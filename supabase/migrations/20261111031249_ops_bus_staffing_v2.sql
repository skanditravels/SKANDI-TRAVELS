-- Draft v2 transport storage. Apply only with the preceding OPS transport
-- registry migration and the corresponding tested application release.
create table public.ops_transport_staff (
  service_id uuid not null references public.vehicle_assignments(id) on delete restrict,
  employee_id text not null references public.agent_users(sk_id) on update restrict on delete restrict,
  role text not null check (role in ('DRIVER','HOST','OTHER')),
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','CONFIRMED','CANCELLED')),
  updated_at timestamptz not null default now(),
  primary key (service_id, employee_id, role)
);
create index ops_transport_staff_employee_idx on public.ops_transport_staff(employee_id, status, service_id);

create table public.ops_transport_alerts (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.vehicle_assignments(id) on delete restrict,
  code text not null,
  status text not null check (status in ('OPEN','RESOLVED')),
  first_seen_at timestamptz not null,
  updated_at timestamptz not null,
  resolved_at timestamptz,
  unique(service_id,code)
);
create index ops_transport_alerts_open_idx on public.ops_transport_alerts(status,updated_at desc);

create table public.ops_transport_worker_state (
  worker_name text primary key,
  last_scan_at timestamptz not null,
  services_scanned integer not null
);

create table public.ops_transport_no_host_approvals (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.vehicle_assignments(id) on delete restrict,
  service_revision timestamptz not null,
  approved_by text not null,
  approved_at timestamptz not null default now(),
  note text not null check(length(btrim(note)) between 1 and 500),
  unique(service_id,service_revision)
);

alter table public.ops_transport_staff enable row level security;
alter table public.ops_transport_alerts enable row level security;
alter table public.ops_transport_worker_state enable row level security;
alter table public.ops_transport_no_host_approvals enable row level security;
revoke all on public.ops_transport_staff,public.ops_transport_alerts,public.ops_transport_no_host_approvals,public.ops_transport_worker_state from public,anon,authenticated;
grant select,insert,update,delete on public.ops_transport_staff to service_role;
grant select,insert,update on public.ops_transport_alerts,public.ops_transport_no_host_approvals to service_role;
grant select,insert,update on public.ops_transport_worker_state to service_role;

-- The service row is the canonical operational record; each staff membership
-- points to it. The server authenticates the actor before invoking this RPC.
create function public.ops_transport_save_service_v2(p_data jsonb)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare
 v_id uuid:=nullif(p_data->>'id','')::uuid;
 v_vehicle_id uuid:=nullif(p_data->>'vehicleId','')::uuid;
 v_supplier_id uuid:=nullif(p_data->>'supplierId','')::uuid;
 v_actor text:=btrim(coalesce(p_data->>'actor',''));
 v_type text:=upper(coalesce(p_data->>'operatorType',''));
 v_status text:=upper(coalesce(p_data->>'status','DRAFT'));
 v_start timestamptz:=(p_data->>'startAt')::timestamptz;
 v_end timestamptz:=(p_data->>'endAt')::timestamptz;
 v_count integer:=(p_data->>'passengerCount')::integer;
 v_members jsonb:=coalesce(p_data->'staff','[]'::jsonb);
 v_stops jsonb:=coalesce(p_data->'stops','[]'::jsonb);
 v_old public.vehicle_assignments%rowtype;
 v_saved public.vehicle_assignments%rowtype;
 v_vehicle public.ops_transport_vehicles%rowtype;
 v_member jsonb;
 v_employee text;
 v_role text;
 v_payload jsonb;
 v_previous_staff jsonb:='[]'::jsonb;
begin
 if v_actor='' or v_type not in ('OWN','THIRD_PARTY') or v_status not in ('DRAFT','SCHEDULED','CONFIRMED','COMPLETED','CANCELLED') or v_start is null or v_end is null or v_start>=v_end or v_count is null or v_count<0 or v_count>10000 or length(btrim(coalesce(p_data->>'label','')))=0 then raise exception 'OPS_TRANSPORT_ASSIGNMENT_INVALID'; end if;
 if jsonb_typeof(v_members)<>'array' or jsonb_typeof(v_stops)<>'array' then raise exception 'OPS_TRANSPORT_ASSIGNMENT_INVALID'; end if;
 if jsonb_array_length(v_stops)>20 or exists(select 1 from jsonb_array_elements(v_stops) s where jsonb_typeof(s)<>'string' or length(s #>> '{}')>180) then raise exception 'OPS_TRANSPORT_STOPS_INVALID'; end if;
 if v_type='OWN' and v_vehicle_id is null then raise exception 'OPS_TRANSPORT_VEHICLE_REQUIRED'; end if;
 if v_type='THIRD_PARTY' and v_supplier_id is null then raise exception 'OPS_TRANSPORT_SUPPLIER_REQUIRED'; end if;
 if v_type='THIRD_PARTY' and v_vehicle_id is not null then raise exception 'OPS_TRANSPORT_ASSIGNMENT_INVALID'; end if;
 if v_supplier_id is not null and not exists(select 1 from public.inventory_master_entities where id=v_supplier_id and entity_type='SUPPLIER' and active is true) then raise exception 'OPS_TRANSPORT_SUPPLIER_INVALID'; end if;
 if v_vehicle_id is not null then
   select * into v_vehicle from public.ops_transport_vehicles where id=v_vehicle_id for update;
   if not found then raise exception 'OPS_TRANSPORT_VEHICLE_NOT_FOUND'; end if;
   if v_status in ('SCHEDULED','CONFIRMED') and v_vehicle.status<>'AVAILABLE' then raise exception 'OPS_TRANSPORT_VEHICLE_UNAVAILABLE'; end if;
   if v_status in ('SCHEDULED','CONFIRMED') and v_count>v_vehicle.seat_capacity then raise exception 'OPS_TRANSPORT_CAPACITY_EXCEEDED'; end if;
 end if;
 if v_id is not null then
   select * into v_old from public.vehicle_assignments where id=v_id for update;
   if not found or coalesce(v_old.payload->>'kind','')<>'BUS' or coalesce(v_old.payload->>'opsTransportVersion','') not in ('1','2') then raise exception 'OPS_TRANSPORT_ASSIGNMENT_NOT_FOUND'; end if;
   if nullif(p_data->>'expectedUpdatedAt','') is null or v_old.updated_at is distinct from (p_data->>'expectedUpdatedAt')::timestamptz then raise exception 'OPS_TRANSPORT_ASSIGNMENT_CHANGED'; end if;
   if v_old.payload->>'opsTransportVersion'='1' and v_old.employee_id is not null and not exists(select 1 from jsonb_array_elements(v_members) x where upper(btrim(x->>'employeeId'))=upper(v_old.employee_id)) then raise exception 'OPS_TRANSPORT_LEGACY_STAFF_ROLE_REQUIRED'; end if;
   select coalesce(jsonb_agg(jsonb_build_object('employeeId',employee_id,'role',role,'status',status) order by employee_id,role),'[]'::jsonb) into v_previous_staff from public.ops_transport_staff where service_id=v_id;
 end if;
 -- Lock employee identities in a stable order to serialize overlapping saves.
 for v_employee in select distinct upper(btrim(x->>'employeeId')) from jsonb_array_elements(v_members) x order by 1 loop
   if coalesce(v_employee,'')='' or not exists(select 1 from public.agent_users where sk_id=v_employee and active is true) then raise exception 'OPS_TRANSPORT_STAFF_INVALID'; end if;
   perform pg_advisory_xact_lock(hashtextextended('ops-transport-staff:'||v_employee,0));
 end loop;
 if exists(select 1 from jsonb_array_elements(v_members) x where jsonb_typeof(x)<>'object' or upper(coalesce(x->>'role','')) not in ('DRIVER','HOST','OTHER') or coalesce(x->>'employeeId','')='') then raise exception 'OPS_TRANSPORT_STAFF_INVALID'; end if;
 if (select count(*) from jsonb_array_elements(v_members))<>(select count(distinct upper(btrim(x->>'employeeId'))||':'||upper(x->>'role')) from jsonb_array_elements(v_members) x) then raise exception 'OPS_TRANSPORT_STAFF_DUPLICATE'; end if;
 if v_status in ('SCHEDULED','CONFIRMED') then
   if v_vehicle_id is not null and exists(select 1 from public.vehicle_assignments a where (v_id is null or a.id<>v_id) and a.payload->>'kind'='BUS' and a.payload->>'vehicleId'=v_vehicle_id::text and upper(coalesce(a.status,'')) in ('SCHEDULED','CONFIRMED') and a.start_time<v_end and a.end_time>v_start) then raise exception 'OPS_TRANSPORT_ASSIGNMENT_CONFLICT'; end if;
   if exists(select 1 from jsonb_array_elements(v_members) x join public.ops_transport_staff s on s.employee_id=upper(btrim(x->>'employeeId')) join public.vehicle_assignments a on a.id=s.service_id where (v_id is null or a.id<>v_id) and s.status in ('SCHEDULED','CONFIRMED') and upper(coalesce(a.status,'')) in ('SCHEDULED','CONFIRMED') and a.start_time<v_end and a.end_time>v_start) then raise exception 'OPS_TRANSPORT_ASSIGNMENT_CONFLICT'; end if;
   if exists(select 1 from jsonb_array_elements(v_members) x join public.vehicle_assignments a on a.employee_id=upper(btrim(x->>'employeeId')) where (v_id is null or a.id<>v_id) and a.payload->>'kind'='BUS' and a.payload->>'opsTransportVersion'='1' and upper(coalesce(a.status,'')) in ('SCHEDULED','CONFIRMED') and a.start_time<v_end and a.end_time>v_start) then raise exception 'OPS_TRANSPORT_ASSIGNMENT_CONFLICT'; end if;
 end if;
 v_payload:=jsonb_build_object('kind','BUS','opsTransportVersion',2,'operatorType',v_type,'label',left(btrim(p_data->>'label'),160),'activityType','duty','vehicleId',v_vehicle_id,'supplierId',v_supplier_id,'vehicleName',coalesce(v_vehicle.display_name,left(btrim(coalesce(p_data->>'externalVehicleName','')),160)),'registration',coalesce(v_vehicle.registration,left(btrim(coalesce(p_data->>'externalRegistration','')),40)),'seatCapacity',v_vehicle.seat_capacity,'passengerCount',v_count,'stops',v_stops,'timeZone',left(btrim(coalesce(p_data->>'timeZone','')),80),'baseCode',coalesce(v_vehicle.base_code,left(btrim(coalesce(p_data->>'baseCode','')),80)),'supplierDriverName',left(btrim(coalesce(p_data->>'supplierDriverName','')),160),'supplierDriverContact',left(btrim(coalesce(p_data->>'supplierDriverContact','')),180),'updatedBy',v_actor);
 if v_id is null then
   insert into public.vehicle_assignments(employee_id,route_id,booking_reference,start_time,end_time,status,notes,payload,updated_at) values(null,nullif(left(btrim(coalesce(p_data->>'routeId','')),120),''),nullif(left(btrim(coalesce(p_data->>'bookingReference','')),120),''),v_start,v_end,v_status,nullif(left(btrim(coalesce(p_data->>'notes','')),500),''),v_payload,clock_timestamp()) returning * into v_saved;
 else
   update public.vehicle_assignments set employee_id=null,route_id=nullif(left(btrim(coalesce(p_data->>'routeId','')),120),''),booking_reference=nullif(left(btrim(coalesce(p_data->>'bookingReference','')),120),''),start_time=v_start,end_time=v_end,status=v_status,notes=nullif(left(btrim(coalesce(p_data->>'notes','')),500),''),payload=coalesce(v_old.payload,'{}'::jsonb)||v_payload,updated_at=clock_timestamp() where id=v_id returning * into v_saved;
 end if;
 delete from public.ops_transport_staff where service_id=v_saved.id;
 for v_member in select value from jsonb_array_elements(v_members) loop
   insert into public.ops_transport_staff(service_id,employee_id,role,status) values(v_saved.id,upper(btrim(v_member->>'employeeId')),upper(v_member->>'role'),'SCHEDULED');
 end loop;
 insert into public.ops_transport_events(vehicle_id,assignment_id,action,actor_staff_id,before_state,after_state) values(v_vehicle_id,v_saved.id,case when v_id is null then 'SERVICE_CREATED' else 'SERVICE_UPDATED' end,v_actor,case when v_id is null then null else to_jsonb(v_old)||jsonb_build_object('staff',v_previous_staff) end,to_jsonb(v_saved)||jsonb_build_object('staff',v_members));
 return to_jsonb(v_saved);
end;
$$;
revoke all on function public.ops_transport_save_service_v2(jsonb) from public,anon,authenticated;
grant execute on function public.ops_transport_save_service_v2(jsonb) to service_role;

-- An explicit, revision-bound decision is required before preparing a
-- customer notice. The backend authenticates and authorizes the OPS actor.
create function public.ops_transport_approve_no_host_v2(p_data jsonb)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare
 v_id uuid:=nullif(p_data->>'serviceId','')::uuid;
 v_actor text:=btrim(coalesce(p_data->>'actor',''));
 v_note text:=left(btrim(coalesce(p_data->>'note','')),500);
 v_service public.vehicle_assignments%rowtype;
 v_approval public.ops_transport_no_host_approvals%rowtype;
begin
 if v_id is null or v_actor='' or v_note='' then raise exception 'OPS_TRANSPORT_APPROVAL_INVALID'; end if;
 select * into v_service from public.vehicle_assignments where id=v_id for update;
 if not found or v_service.payload->>'kind' is distinct from 'BUS' or v_service.payload->>'opsTransportVersion' is distinct from '2' or v_service.payload->>'operatorType' is distinct from 'OWN' or coalesce(v_service.status,'') not in ('SCHEDULED','CONFIRMED') then raise exception 'OPS_TRANSPORT_APPROVAL_NOT_ALLOWED'; end if;
 if nullif(p_data->>'expectedUpdatedAt','') is null or v_service.updated_at is distinct from (p_data->>'expectedUpdatedAt')::timestamptz then raise exception 'OPS_TRANSPORT_ASSIGNMENT_CHANGED'; end if;
 if exists(select 1 from public.ops_transport_staff where service_id=v_id and role='HOST' and status in ('SCHEDULED','CONFIRMED')) then raise exception 'OPS_TRANSPORT_HOST_ALREADY_ASSIGNED'; end if;
 insert into public.ops_transport_no_host_approvals(service_id,service_revision,approved_by,note) values(v_id,v_service.updated_at,v_actor,v_note)
 on conflict(service_id,service_revision) do update set approved_by=excluded.approved_by,approved_at=clock_timestamp(),note=excluded.note returning * into v_approval;
 insert into public.ops_transport_events(vehicle_id,assignment_id,action,actor_staff_id,after_state) values(nullif(v_service.payload->>'vehicleId','')::uuid,v_id,'NO_HOST_APPROVED',v_actor,to_jsonb(v_approval));
 return to_jsonb(v_approval);
end;
$$;
revoke all on function public.ops_transport_approve_no_host_v2(jsonb) from public,anon,authenticated;
grant execute on function public.ops_transport_approve_no_host_v2(jsonb) to service_role;

-- Upsert and resolve alerts idempotently; no message delivery is implied.
create function public.ops_transport_set_alert_v2(p_service uuid,p_code text,p_active boolean,p_now timestamptz)
returns void language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if p_active then
   insert into public.ops_transport_alerts(service_id,code,status,first_seen_at,updated_at,resolved_at) values(p_service,p_code,'OPEN',p_now,p_now,null)
   on conflict(service_id,code) do update set status='OPEN',first_seen_at=case when ops_transport_alerts.status='RESOLVED' then excluded.first_seen_at else ops_transport_alerts.first_seen_at end,updated_at=excluded.updated_at,resolved_at=null;
 else
   update public.ops_transport_alerts set status='RESOLVED',updated_at=p_now,resolved_at=p_now where service_id=p_service and code=p_code and status='OPEN';
 end if;
end;
$$;
revoke all on function public.ops_transport_set_alert_v2(uuid,text,boolean,timestamptz) from public,anon,authenticated;
grant execute on function public.ops_transport_set_alert_v2(uuid,text,boolean,timestamptz) to service_role;

create function public.ops_transport_scan_alerts_v2(p_now timestamptz default now())
returns integer language plpgsql security invoker set search_path=pg_catalog,public as $$
declare v_service public.vehicle_assignments%rowtype;v_hosts integer;v_drivers integer;v_active boolean;v_approved boolean;v_missing boolean;v_count integer:=0;
begin
 if p_now is null then raise exception 'OPS_TRANSPORT_SCAN_TIME_REQUIRED'; end if;
 for v_service in select * from public.vehicle_assignments a where a.payload->>'kind'='BUS' and a.payload->>'opsTransportVersion'='2' and (a.status in ('SCHEDULED','CONFIRMED') or exists(select 1 from public.ops_transport_alerts x where x.service_id=a.id and x.status='OPEN')) loop
   v_active:=v_service.status in ('SCHEDULED','CONFIRMED');
   select count(*) filter(where role='HOST'),count(*) filter(where role='DRIVER') into v_hosts,v_drivers from public.ops_transport_staff where service_id=v_service.id and status in ('SCHEDULED','CONFIRMED');
   select exists(select 1 from public.ops_transport_no_host_approvals a where a.service_id=v_service.id and a.service_revision=v_service.updated_at) into v_approved;
   v_missing:=coalesce(v_service.payload->>'supplierId','')='' or btrim(coalesce(v_service.payload->>'supplierDriverName',''))='' or btrim(coalesce(v_service.payload->>'vehicleName',''))='' or btrim(coalesce(v_service.payload->>'registration',''))='';
   perform public.ops_transport_set_alert_v2(v_service.id,'OWN_DRIVER_MISSING_2H',v_active and v_service.payload->>'operatorType'='OWN' and v_drivers=0 and p_now>=v_service.start_time-interval '2 hours',p_now);
   perform public.ops_transport_set_alert_v2(v_service.id,'OWN_HOST_APPROVAL_REQUIRED',v_active and v_service.payload->>'operatorType'='OWN' and v_hosts=0 and not v_approved,p_now);
   perform public.ops_transport_set_alert_v2(v_service.id,'SUPPLIER_DETAILS_MISSING_4H',v_active and v_service.payload->>'operatorType'='THIRD_PARTY' and v_missing and p_now>=v_service.start_time-interval '4 hours',p_now);
   perform public.ops_transport_set_alert_v2(v_service.id,'THIRD_PARTY_HOST_MISSING_2H',v_active and v_service.payload->>'operatorType'='THIRD_PARTY' and v_hosts=0 and p_now>=v_service.start_time-interval '2 hours',p_now);
   v_count:=v_count+1;
 end loop;
 insert into public.ops_transport_worker_state(worker_name,last_scan_at,services_scanned) values('transport_alerts',p_now,v_count) on conflict(worker_name) do update set last_scan_at=excluded.last_scan_at,services_scanned=excluded.services_scanned;
 return v_count;
end;
$$;
revoke all on function public.ops_transport_scan_alerts_v2(timestamptz) from public,anon,authenticated;
grant execute on function public.ops_transport_scan_alerts_v2(timestamptz) to service_role;

-- Keep future v2 services consistent with their registered vehicle and prevent
-- a registry edit from invalidating a published service's availability/capacity.
create function public.ops_transport_guard_vehicle_v2()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if exists(select 1 from public.vehicle_assignments a where a.payload->>'kind'='BUS' and a.payload->>'opsTransportVersion'='2' and a.payload->>'vehicleId'=old.id::text and a.status in ('SCHEDULED','CONFIRMED') and a.end_time>now() and (new.status<>'AVAILABLE' or coalesce((a.payload->>'passengerCount')::integer,0)>new.seat_capacity)) then raise exception 'OPS_TRANSPORT_VEHICLE_HAS_ACTIVE_SERVICES'; end if;
 return new;
end;
$$;
create trigger ops_transport_guard_vehicle_v2 before update on public.ops_transport_vehicles for each row execute function public.ops_transport_guard_vehicle_v2();

create function public.ops_transport_sync_vehicle_v2()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
declare v_old public.vehicle_assignments%rowtype;v_new public.vehicle_assignments%rowtype;
begin
 if new.display_name is not distinct from old.display_name and new.registration is not distinct from old.registration and new.seat_capacity is not distinct from old.seat_capacity and new.base_code is not distinct from old.base_code then return new; end if;
 for v_old in select * from public.vehicle_assignments a where a.payload->>'kind'='BUS' and a.payload->>'opsTransportVersion'='2' and a.payload->>'vehicleId'=new.id::text and a.status in ('DRAFT','SCHEDULED','CONFIRMED') and a.end_time>now() for update loop
   update public.vehicle_assignments set payload=coalesce(v_old.payload,'{}'::jsonb)||jsonb_build_object('vehicleName',new.display_name,'registration',new.registration,'seatCapacity',new.seat_capacity,'baseCode',new.base_code),updated_at=clock_timestamp() where id=v_old.id returning * into v_new;
   insert into public.ops_transport_events(vehicle_id,assignment_id,action,actor_staff_id,before_state,after_state) values(new.id,v_old.id,'SERVICE_VEHICLE_UPDATED',new.updated_by,to_jsonb(v_old),to_jsonb(v_new));
 end loop;
 return new;
end;
$$;
create trigger ops_transport_sync_vehicle_v2 after update on public.ops_transport_vehicles for each row execute function public.ops_transport_sync_vehicle_v2();
revoke all on function public.ops_transport_guard_vehicle_v2() from public,anon,authenticated;
revoke all on function public.ops_transport_sync_vehicle_v2() from public,anon,authenticated;

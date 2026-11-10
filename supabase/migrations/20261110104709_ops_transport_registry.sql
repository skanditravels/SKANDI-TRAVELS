-- OPS-owned fleet records. Existing Inventory records remain the supplier
-- authority and vehicle_assignments remains the shared staff duty source.
create table public.ops_transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  registration text not null check (length(btrim(registration)) between 1 and 40),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  base_code text not null check (length(btrim(base_code)) between 1 and 80),
  supplier_entity_id uuid references public.inventory_master_entities(id) on delete restrict,
  display_name text not null check (length(btrim(display_name)) between 1 and 160),
  seat_capacity integer not null check (seat_capacity between 1 and 150),
  service_class text not null default 'STANDARD' check (service_class in ('STANDARD', 'COMFORT', 'PREMIUM', 'ACCESSIBLE')),
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED')),
  inspection_due date,
  insurance_due date,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index ops_transport_vehicles_registration_country_idx
  on public.ops_transport_vehicles (country_code, upper(registration));
create index ops_transport_vehicles_base_status_idx
  on public.ops_transport_vehicles (base_code, status);

create table public.ops_transport_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.ops_transport_vehicles(id) on delete restrict,
  assignment_id uuid references public.vehicle_assignments(id) on delete restrict,
  action text not null,
  actor_staff_id text not null,
  before_state jsonb,
  after_state jsonb not null,
  occurred_at timestamptz not null default now()
);
create index ops_transport_events_vehicle_time_idx
  on public.ops_transport_events (vehicle_id, occurred_at desc);
create index ops_transport_events_assignment_time_idx
  on public.ops_transport_events (assignment_id, occurred_at desc);

alter table public.ops_transport_vehicles enable row level security;
alter table public.ops_transport_events enable row level security;
revoke all on public.ops_transport_vehicles, public.ops_transport_events from public, anon, authenticated;
grant select, insert, update on public.ops_transport_vehicles to service_role;
grant select, insert on public.ops_transport_events to service_role;

-- Both functions are invoker-rights and callable only by the established
-- server-side service. The Wix backend independently checks the staff role.
create function public.ops_transport_save_vehicle(p_data jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_id uuid := nullif(p_data->>'id', '')::uuid;
  v_supplier uuid := nullif(p_data->>'supplierId', '')::uuid;
  v_actor text := btrim(coalesce(p_data->>'actor', ''));
  v_old public.ops_transport_vehicles%rowtype;
  v_saved public.ops_transport_vehicles%rowtype;
  v_before jsonb := null;
  v_assignment public.vehicle_assignments%rowtype;
  v_updated public.vehicle_assignments%rowtype;
begin
  if length(v_actor) = 0 then raise exception 'OPS_TRANSPORT_ACTOR_REQUIRED'; end if;
  if v_supplier is not null and not exists (
    select 1 from public.inventory_master_entities
    where id = v_supplier and entity_type = 'SUPPLIER' and active is true
  ) then raise exception 'OPS_TRANSPORT_SUPPLIER_INVALID'; end if;

  if v_id is not null then
    select * into v_old from public.ops_transport_vehicles where id = v_id for update;
    if not found then raise exception 'OPS_TRANSPORT_VEHICLE_NOT_FOUND'; end if;
    if nullif(p_data->>'expectedUpdatedAt', '') is null
       or v_old.updated_at <> (p_data->>'expectedUpdatedAt')::timestamptz then
      raise exception 'OPS_TRANSPORT_VEHICLE_CHANGED';
    end if;
    if exists (select 1 from public.vehicle_assignments a
      where a.payload->>'kind' = 'BUS' and a.payload->>'opsTransportVersion' = '1' and a.payload->>'vehicleId' = v_id::text
        and upper(coalesce(a.status, '')) in ('SCHEDULED', 'CONFIRMED') and a.end_time > now()
        and (upper(p_data->>'status') <> 'AVAILABLE'
          or coalesce((a.payload->>'passengerCount')::integer, 0) > (p_data->>'capacity')::integer)) then
      raise exception 'OPS_TRANSPORT_VEHICLE_HAS_ACTIVE_SERVICES';
    end if;
    v_before := to_jsonb(v_old);
    update public.ops_transport_vehicles set
      registration = upper(btrim(p_data->>'registration')),
      country_code = upper(btrim(p_data->>'countryCode')),
      base_code = upper(btrim(p_data->>'baseCode')),
      supplier_entity_id = v_supplier,
      display_name = btrim(p_data->>'name'),
      seat_capacity = (p_data->>'capacity')::integer,
      service_class = upper(p_data->>'serviceClass'),
      status = upper(p_data->>'status'),
      inspection_due = nullif(p_data->>'inspectionDue', '')::date,
      insurance_due = nullif(p_data->>'insuranceDue', '')::date,
      updated_by = v_actor,
      updated_at = clock_timestamp()
    where id = v_id returning * into v_saved;
    -- Refresh the operational snapshot on future duties in the same transaction.
    for v_assignment in select * from public.vehicle_assignments a
      where a.payload->>'kind' = 'BUS' and a.payload->>'opsTransportVersion' = '1' and a.payload->>'vehicleId' = v_id::text
        and upper(coalesce(a.status, '')) in ('DRAFT', 'SCHEDULED', 'CONFIRMED') and a.end_time > now()
      for update
    loop
      update public.vehicle_assignments set payload = coalesce(v_assignment.payload, '{}'::jsonb) || jsonb_build_object(
        'vehicleName', v_saved.display_name, 'registration', v_saved.registration,
        'seatCapacity', v_saved.seat_capacity, 'baseCode', v_saved.base_code), updated_at = clock_timestamp()
      where id = v_assignment.id returning * into v_updated;
      insert into public.ops_transport_events(vehicle_id, assignment_id, action, actor_staff_id, before_state, after_state)
      values (v_saved.id, v_assignment.id, 'ASSIGNMENT_VEHICLE_UPDATED', v_actor, to_jsonb(v_assignment), to_jsonb(v_updated));
    end loop;
  else
    insert into public.ops_transport_vehicles (
      registration, country_code, base_code, supplier_entity_id, display_name,
      seat_capacity, service_class, status, inspection_due, insurance_due, updated_by
    ) values (
      upper(btrim(p_data->>'registration')), upper(btrim(p_data->>'countryCode')),
      upper(btrim(p_data->>'baseCode')), v_supplier, btrim(p_data->>'name'),
      (p_data->>'capacity')::integer, upper(p_data->>'serviceClass'), upper(p_data->>'status'),
      nullif(p_data->>'inspectionDue', '')::date, nullif(p_data->>'insuranceDue', '')::date, v_actor
    ) returning * into v_saved;
  end if;
  insert into public.ops_transport_events(vehicle_id, action, actor_staff_id, before_state, after_state)
  values (v_saved.id, case when v_id is null then 'VEHICLE_CREATED' else 'VEHICLE_UPDATED' end, v_actor, v_before, to_jsonb(v_saved));
  return to_jsonb(v_saved);
end;
$$;

create function public.ops_transport_save_assignment(p_data jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_id uuid := nullif(p_data->>'id', '')::uuid;
  v_vehicle_id uuid := nullif(p_data->>'vehicleId', '')::uuid;
  v_employee text := nullif(upper(btrim(coalesce(p_data->>'employeeId', ''))), '');
  v_actor text := btrim(coalesce(p_data->>'actor', ''));
  v_start timestamptz := (p_data->>'startAt')::timestamptz;
  v_end timestamptz := (p_data->>'endAt')::timestamptz;
  v_passengers integer := (p_data->>'passengerCount')::integer;
  v_status text := upper(coalesce(p_data->>'status', 'DRAFT'));
  v_stops jsonb := coalesce(p_data->'stops', '[]'::jsonb);
  v_vehicle public.ops_transport_vehicles%rowtype;
  v_old public.vehicle_assignments%rowtype;
  v_saved public.vehicle_assignments%rowtype;
  v_payload jsonb;
begin
  if v_actor = '' or v_vehicle_id is null or v_start is null or v_end is null or v_start >= v_end
     or v_passengers is null or v_passengers < 0 or v_passengers > 10000
     or v_status not in ('DRAFT', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED') then
    raise exception 'OPS_TRANSPORT_ASSIGNMENT_INVALID';
  end if;
  if jsonb_typeof(v_stops) <> 'array' or jsonb_array_length(v_stops) > 20
     or exists (select 1 from jsonb_array_elements(v_stops) s where jsonb_typeof(s) <> 'string' or length(s #>> '{}') > 180) then
    raise exception 'OPS_TRANSPORT_STOPS_INVALID';
  end if;
  select * into v_vehicle from public.ops_transport_vehicles where id = v_vehicle_id for update;
  if not found then raise exception 'OPS_TRANSPORT_VEHICLE_NOT_FOUND'; end if;
  if v_employee is not null then
    perform pg_advisory_xact_lock(hashtextextended('ops-transport-staff:' || v_employee, 0));
    if not exists (select 1 from public.agent_users where sk_id = v_employee and active is true) then
      raise exception 'OPS_TRANSPORT_STAFF_INVALID';
    end if;
  end if;
  if v_id is not null then
    select * into v_old from public.vehicle_assignments where id = v_id for update;
    if not found or coalesce(v_old.payload->>'kind', '') <> 'BUS' or coalesce(v_old.payload->>'opsTransportVersion', '') <> '1' then
      raise exception 'OPS_TRANSPORT_ASSIGNMENT_NOT_FOUND';
    end if;
    if nullif(p_data->>'expectedUpdatedAt', '') is null
       or v_old.updated_at is distinct from (p_data->>'expectedUpdatedAt')::timestamptz then
      raise exception 'OPS_TRANSPORT_ASSIGNMENT_CHANGED';
    end if;
  end if;
  if v_status in ('SCHEDULED', 'CONFIRMED') then
    if v_vehicle.status <> 'AVAILABLE' then raise exception 'OPS_TRANSPORT_VEHICLE_UNAVAILABLE'; end if;
    if v_passengers > v_vehicle.seat_capacity then raise exception 'OPS_TRANSPORT_CAPACITY_EXCEEDED'; end if;
    if v_employee is null then raise exception 'OPS_TRANSPORT_STAFF_REQUIRED'; end if;
    if exists (
      select 1 from public.vehicle_assignments a
      where (v_id is null or a.id <> v_id)
        and coalesce(a.payload->>'kind', '') = 'BUS'
        and upper(coalesce(a.status, '')) in ('SCHEDULED', 'CONFIRMED')
        and a.start_time < v_end and a.end_time > v_start
        and (a.payload->>'vehicleId' = v_vehicle_id::text or a.employee_id = v_employee)
    ) then raise exception 'OPS_TRANSPORT_ASSIGNMENT_CONFLICT'; end if;
  end if;
  v_payload := jsonb_build_object(
    'kind', 'BUS', 'opsTransportVersion', 1, 'activityType', 'duty', 'label', left(btrim(coalesce(p_data->>'label', '')), 160),
    'vehicleId', v_vehicle_id, 'vehicleName', v_vehicle.display_name,
    'registration', v_vehicle.registration, 'seatCapacity', v_vehicle.seat_capacity,
    'passengerCount', v_passengers, 'stops', v_stops, 'baseCode', v_vehicle.base_code,
    'updatedBy', v_actor
  );
  if v_payload->>'label' = '' then raise exception 'OPS_TRANSPORT_LABEL_REQUIRED'; end if;
  if v_id is null then
    insert into public.vehicle_assignments(employee_id, route_id, booking_reference, start_time, end_time, status, notes, payload, updated_at)
    values (v_employee, nullif(left(btrim(coalesce(p_data->>'routeId', '')), 120), ''),
      nullif(left(btrim(coalesce(p_data->>'bookingReference', '')), 120), ''), v_start, v_end,
      v_status, nullif(left(btrim(coalesce(p_data->>'notes', '')), 500), ''), v_payload, clock_timestamp())
    returning * into v_saved;
  else
    update public.vehicle_assignments set employee_id = v_employee,
      route_id = nullif(left(btrim(coalesce(p_data->>'routeId', '')), 120), ''),
      booking_reference = nullif(left(btrim(coalesce(p_data->>'bookingReference', '')), 120), ''),
      start_time = v_start, end_time = v_end, status = v_status,
      notes = nullif(left(btrim(coalesce(p_data->>'notes', '')), 500), ''),
      payload = coalesce(v_old.payload, '{}'::jsonb) || v_payload, updated_at = clock_timestamp()
    where id = v_id returning * into v_saved;
  end if;
  insert into public.ops_transport_events(vehicle_id, assignment_id, action, actor_staff_id, before_state, after_state)
  values (v_vehicle_id, v_saved.id, case when v_id is null then 'ASSIGNMENT_CREATED' else 'ASSIGNMENT_UPDATED' end,
    v_actor, case when v_id is null then null else to_jsonb(v_old) end, to_jsonb(v_saved));
  return to_jsonb(v_saved);
end;
$$;

revoke all on function public.ops_transport_save_vehicle(jsonb) from public, anon, authenticated;
revoke all on function public.ops_transport_save_assignment(jsonb) from public, anon, authenticated;
grant execute on function public.ops_transport_save_vehicle(jsonb) to service_role;
grant execute on function public.ops_transport_save_assignment(jsonb) to service_role;

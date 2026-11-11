// /src/backend/SKANDI_CORE/opsControl.js
// V12 — OPS Control canonical operational synchronization core.
// Reads/writes only established SKANDI workforce, roster, assignment and ALTEA operational resources.

import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { restRequest, rpcRequest } from "backend/SKANDI_CORE/supabaseServer";
import { ROSTER_ASSIGNMENT_SOURCES, rosterAssignmentLabel, rosterAssignmentTimes } from "backend/SKANDI_CORE/rosterAssignments";
import { evaluateTransportReadiness } from "backend/SKANDI_CORE/opsTransportReadiness";

const TABLES = Object.freeze({
  agents: "agent_users",
  shifts: "roster_shifts",
  clock: "roster_clock_events",
  ledger: "roster_time_ledger",
  requests: "schedule_change_requests",
  balances: "time_off_balances",
  leave: "vacation_sick_leave_ledger",
  crew: "crew_assignments",
  drivers: "driver_assignments",
  tours: "tour_assignments",
  airport: "airport_duty_assignments",
  vehicles: "vehicle_assignments",
  jurisdictions: "hr_base_jurisdictions",
  alteaSync: "altea_sync_events"
});

const ASSIGNMENT_TABLES = new Set(Object.keys(ROSTER_ASSIGNMENT_SOURCES));
const OPS_GROUPS = new Set(["operations", "occ", "managers", "system-admin"]);
const PROTOCOL_VERSION = "V12-OPS-CONTROL-2026.10.14";
const MAX_ROWS = 10000;

function arr(value){ return Array.isArray(value) ? value : value ? [value] : []; }
function obj(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value,max=500){ return String(value ?? "").trim().slice(0,max); }
function upper(value,max=120){ return clean(value,max).toUpperCase(); }
function lower(value,max=120){ return clean(value,max).toLowerCase(); }
function first(value){ return arr(value)[0] || null; }
function now(){ return new Date().toISOString(); }
function isoDate(value){ const d=new Date(value); return Number.isFinite(d.getTime()) ? d.toISOString() : ""; }
function hoursBetween(a,b){ const x=new Date(a).getTime(), y=new Date(b).getTime(); return Number.isFinite(x)&&Number.isFinite(y) ? Math.max(0,(y-x)/3600000) : 0; }
function requestType(row){ return upper(obj(row?.payload).requestType || obj(row?.payload).type || row?.type,80); }
function status(value){ return upper(value || "SCHEDULED",80); }
function profile(session){ return session?.profile || {}; }
function hasGroup(session,key){ return arr(session?.permissionGroups).map(v=>lower(v,100)).includes(lower(key,100)); }
function isWildcard(session){
  const values=[...arr(session?.permissionKeys),...arr(session?.allowedApps),...arr(session?.permissionGroups)].map(v=>lower(v,100));
  return values.includes("*") || values.includes("all");
}

const TRANSPORT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSPORT_STATUSES = new Set(["DRAFT", "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"]);
function transportError(code){ const error=new Error(code); error.code=code; return error; }
function transportActor(session){ return upper(profile(session).skId || profile(session).agentId || session.skId || session.agentId || profile(session).agentUserUuid || profile(session).agentUserId || profile(session).id,80); }
function transportDate(value){
  const date=clean(value,10);
  if (!date) return "";
  const parsed=new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==date) throw transportError("OPS_TRANSPORT_DATE_INVALID");
  return date;
}
function transportVehicleView(row={}){
  return {id:clean(row.id,80),registration:clean(row.registration,40),countryCode:clean(row.country_code,2),baseCode:clean(row.base_code,80),supplierId:clean(row.supplier_entity_id,80),name:clean(row.display_name,160),capacity:Number(row.seat_capacity),serviceClass:clean(row.service_class,40),status:clean(row.status,40),inspectionDue:clean(row.inspection_due,10),insuranceDue:clean(row.insurance_due,10),updatedAt:clean(row.updated_at,80)};
}
function transportAssignmentView(row={}){
  const p=obj(row.payload);
  const count=value=>value!==null && value!==undefined && value!=="" && Number.isInteger(Number(value)) && Number(value)>=0?Number(value):null;
  return {id:clean(row.id,80),version:Number(p.opsTransportVersion)||1,operatorType:upper(p.operatorType||"OWN",30),supplierId:clean(p.supplierId,80),supplierDriverName:clean(p.supplierDriverName,160),supplierDriverContact:clean(p.supplierDriverContact,180),externalVehicleName:clean(p.vehicleName,160),externalRegistration:clean(p.registration,40),timeZone:clean(p.timeZone,80),baseCode:clean(p.baseCode,80),employeeId:clean(row.employee_id,80),routeId:clean(row.route_id,120),bookingReference:clean(row.booking_reference,120),startAt:clean(row.start_time,80),endAt:clean(row.end_time,80),status:upper(row.status,40),notes:clean(row.notes,500),label:clean(p.label,160),vehicleId:clean(p.vehicleId,80),vehicleName:clean(p.vehicleName,160),registration:clean(p.registration,40),capacity:count(p.seatCapacity),passengerCount:count(p.passengerCount),stops:arr(p.stops).map(x=>clean(x,180)).filter(Boolean),updatedAt:clean(row.updated_at,80)};
}
async function transportBootstrap(agents, vehicleAssignments, session){
  try {
    const [fleet,suppliers,events,memberships,alerts,approvals,worker]=await Promise.all([
      getRows("ops_transport_vehicles",{order:"display_name.asc"},3000),
      getRows("inventory_master_entities",{select:"id,name,code,active",entity_type:"eq.SUPPLIER",order:"name.asc"},3000),
      getRows("ops_transport_events",{select:"id,vehicle_id,assignment_id,action,actor_staff_id,occurred_at",order:"occurred_at.desc"},250),
      getAllTransportRows("ops_transport_staff",{select:"service_id,employee_id,role,status",order:"service_id.asc,employee_id.asc,role.asc"}),
      getAllTransportRows("ops_transport_alerts",{select:"id,service_id,code,status,first_seen_at,updated_at",status:"eq.OPEN",order:"id.asc"}),
      getAllTransportRows("ops_transport_no_host_approvals",{select:"service_id,service_revision,approved_by,approved_at",order:"service_id.asc,service_revision.asc"}),
      getRows("ops_transport_worker_state",{select:"worker_name,last_scan_at",worker_name:"eq.transport_alerts"},1)
    ]);
    const canEdit=session.canManage===true || session.isSystemAdmin===true || isWildcard(session) || upper(session.accessRole,80)==="SUPER_ADMIN" || hasGroup(session,"occ") || hasGroup(session,"system-admin");
    const services=vehicleAssignments.filter(row=>obj(row.payload).kind==="BUS" && [1,2].includes(obj(row.payload).opsTransportVersion)).map(row=>{
      const view=transportAssignmentView(row),staff=memberships.filter(m=>m.service_id===row.id&&["SCHEDULED","CONFIRMED"].includes(upper(m.status,30))).map(m=>({employeeId:upper(m.employee_id,80),role:upper(m.role,30),status:upper(m.status,30)}));
      const approval=approvals.find(a=>a.service_id===row.id&&a.service_revision===row.updated_at);
      const readiness=view.version===2?evaluateTransportReadiness({operatorType:view.operatorType,status:view.status,startAt:view.startAt,revision:view.updatedAt,staff:staff.map(m=>({staffId:m.employeeId,role:m.role,status:m.status})),noHostApproval:approval?{approvedBy:approval.approved_by,approvedAt:approval.approved_at,serviceRevision:approval.service_revision}:null,provider:{supplierId:view.supplierId,driverName:view.supplierDriverName,vehicleRegistration:view.registration,vehicleDescription:view.vehicleName}}):null;
      return {...view,staff,noHostApproved:readiness?.noHostApproved===true,readiness};
    });
    return {available:true,canEdit,monitorLastScan:clean(worker[0]?.last_scan_at,80),vehicles:fleet.map(transportVehicleView),suppliers:suppliers.map(row=>({id:clean(row.id,80),name:clean(row.name,180),active:row.active===true})),staff:agents.map(row=>({id:upper(row.sk_id,80),name:clean(row.display_name||[row.first_name,row.last_name].filter(Boolean).join(" "),180),base:clean(row.base_code||row.base,80)})).filter(row=>row.id),assignments:services,alerts:alerts.map(a=>({id:clean(a.id,80),serviceId:clean(a.service_id,80),code:upper(a.code,80),firstSeenAt:clean(a.first_seen_at,80)})),events:events.map(row=>({id:clean(row.id,80),time:clean(row.occurred_at,80),action:clean(row.action,120),details:[clean(row.actor_staff_id,80),clean(row.vehicle_id,80),clean(row.assignment_id,80)].filter(Boolean).join(" · "),status:"RECORDED"}))};
  } catch (error) {
    console.error("[OPS transport bootstrap]", clean(error?.code||"OPS_TRANSPORT_UNAVAILABLE",100));
    return {available:false,vehicles:[],suppliers:[],staff:[],assignments:[],message:"Transport data is unavailable. Check that the approved transport setup is installed and try again."};
  }
}
async function saveTransportServiceV2(session,input={}){
  const p=obj(input),actor=transportActor(session),id=clean(p.id,80),vehicleId=clean(p.vehicleId,80),supplierId=clean(p.supplierId,80),operatorType=upper(p.operatorType,30),label=clean(p.label,160),status=upper(p.status||"DRAFT",30),passengerCount=Number(p.passengerCount),start=new Date(p.startAt),end=new Date(p.endAt),timeZone=clean(p.timeZone,80);
  const staff=arr(p.staff).map(m=>({employeeId:upper(m?.employeeId,80),role:upper(m?.role,30)})),stops=arr(p.stops).map(x=>clean(x,180)).filter(Boolean);
  let validZone=true;try{new Intl.DateTimeFormat("en",{timeZone}).format(start);}catch(_){validZone=false;}
  if(!actor||(id&&!TRANSPORT_ID.test(id))||!["OWN","THIRD_PARTY"].includes(operatorType)||(operatorType==="OWN"&&!TRANSPORT_ID.test(vehicleId))||(operatorType==="THIRD_PARTY"&&(!TRANSPORT_ID.test(supplierId)||vehicleId))||!label||!TRANSPORT_STATUSES.has(status)||p.passengerCount==null||p.passengerCount===""||!Number.isInteger(passengerCount)||passengerCount<0||passengerCount>10000||!p.startAt||!p.endAt||!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||start>=end||!validZone||!timeZone||stops.length>20||staff.some(m=>!/^[A-Z0-9_-]{1,80}$/.test(m.employeeId)||!["DRIVER","HOST","OTHER"].includes(m.role)))throw transportError("OPS_TRANSPORT_ASSIGNMENT_INVALID");
  return transportRpc("ops_transport_save_service_v2",{id,actor,vehicleId,supplierId,operatorType,label,status,passengerCount,startAt:start.toISOString(),endAt:end.toISOString(),timeZone,staff,stops,externalVehicleName:clean(p.externalVehicleName,160),externalRegistration:clean(p.externalRegistration,40),supplierDriverName:clean(p.supplierDriverName,160),supplierDriverContact:clean(p.supplierDriverContact,180),baseCode:clean(p.baseCode,80),routeId:clean(p.routeId,120),bookingReference:clean(p.bookingReference,120),notes:clean(p.notes,500),expectedUpdatedAt:clean(p.expectedUpdatedAt,80)});
}
async function saveTransportVehicle(session,input={}){
  const p=obj(input), actor=transportActor(session), id=clean(p.id,80), supplierId=clean(p.supplierId,80);
  const registration=upper(p.registration,40),countryCode=upper(p.countryCode,2),baseCode=upper(p.baseCode,80),name=clean(p.name,160),capacity=Number(p.capacity);
  const serviceClass=upper(p.serviceClass||"STANDARD",30), status=upper(p.status||"AVAILABLE",30);
  if (!actor || (id&&!TRANSPORT_ID.test(id)) || (supplierId&&!TRANSPORT_ID.test(supplierId)) || !registration || !/^[A-Z]{2}$/.test(countryCode) || !baseCode || !name || !Number.isInteger(capacity) || capacity<1 || capacity>150 || !["STANDARD","COMFORT","PREMIUM","ACCESSIBLE"].includes(serviceClass) || !["AVAILABLE","MAINTENANCE","OUT_OF_SERVICE","RETIRED"].includes(status)) throw transportError("OPS_TRANSPORT_VEHICLE_INVALID");
  return transportRpc("ops_transport_save_vehicle",{id,supplierId,actor,registration,countryCode,baseCode,name,capacity,serviceClass,status,inspectionDue:transportDate(p.inspectionDue),insuranceDue:transportDate(p.insuranceDue),expectedUpdatedAt:clean(p.expectedUpdatedAt,80)});
}
async function saveTransportAssignment(session,input={}){
  const p=obj(input), actor=transportActor(session), id=clean(p.id,80), vehicleId=clean(p.vehicleId,80), employeeId=upper(p.employeeId,80), label=clean(p.label,160), status=upper(p.status||"DRAFT",30), passengerCount=Number(p.passengerCount);
  const start=new Date(p.startAt),end=new Date(p.endAt);
  const stops=arr(p.stops).map(x=>clean(x,180)).filter(Boolean);
  if (!actor || (id&&!TRANSPORT_ID.test(id)) || !TRANSPORT_ID.test(vehicleId) || !label || !TRANSPORT_STATUSES.has(status) || p.passengerCount==null || p.passengerCount==="" || !Number.isInteger(passengerCount) || passengerCount<0 || passengerCount>10000 || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start>=end || stops.length>20 || (employeeId&&!/^[A-Z0-9_-]{1,80}$/.test(employeeId))) throw transportError("OPS_TRANSPORT_ASSIGNMENT_INVALID");
  return transportRpc("ops_transport_save_assignment",{id,vehicleId,employeeId,label,status,passengerCount,startAt:start.toISOString(),endAt:end.toISOString(),stops,actor,routeId:clean(p.routeId,120),bookingReference:clean(p.bookingReference,120),notes:clean(p.notes,500),expectedUpdatedAt:clean(p.expectedUpdatedAt,80)});
}
async function transportRpc(name,data){
  try { return await rpcRequest({functionName:name,body:{p_data:data}}); }
  catch(error){
    const message=clean(error?.supabase?.message||error?.message,150);
    if (/^OPS_TRANSPORT_[A-Z_]+$/.test(message)) throw transportError(message);
    if (error?.supabase?.code==="23505") throw transportError("OPS_TRANSPORT_DUPLICATE_VEHICLE");
    throw transportError("OPS_TRANSPORT_SAVE_FAILED");
  }
}

async function requireOpsSession({write=false,requestReview=false}={}){
  const session=await requireStaffPortalSessionCore();
  const groups=new Set(arr(session.permissionGroups).map(v=>lower(v,100)));
  const privileged=session.isSystemAdmin===true || isWildcard(session) || upper(session.accessRole,80)==="SUPER_ADMIN";
  const operational=privileged || [...OPS_GROUPS].some(g=>groups.has(g)) || session.canManage===true;
  if(!operational){
    const error=new Error("OPS_CONTROL_ACCESS_DENIED"); error.code="OPS_CONTROL_ACCESS_DENIED"; throw error;
  }
  const requestReviewAllowed=privileged || session.canManage===true || [...OPS_GROUPS].some(g=>groups.has(g));
  if(write && requestReview && !requestReviewAllowed){
    const error=new Error("OPS_CONTROL_WRITE_DENIED"); error.code="OPS_CONTROL_WRITE_DENIED"; throw error;
  }
  if(write && !requestReview && !(privileged || session.canManage===true || groups.has("occ") || groups.has("system-admin"))){
    const error=new Error("OPS_CONTROL_WRITE_DENIED"); error.code="OPS_CONTROL_WRITE_DENIED"; throw error;
  }
  return session;
}

async function getRows(table, query={}, maxRows=MAX_ROWS){
  const rows=[]; const pageSize=Math.min(1000,Math.max(1,maxRows)); let offset=0;
  while(rows.length<maxRows){
    const remaining=maxRows-rows.length;
    const page=arr(await restRequest({
      table,
      query:{select:"*",...query,limit:Math.min(pageSize,remaining),offset}
    }));
    rows.push(...page);
    if(page.length<Math.min(pageSize,remaining)) break;
    offset+=page.length;
    if(!page.length) break;
  }
  return rows;
}

async function getAllTransportRows(table, query={}){
  const rows=[]; let offset=0;
  for (;;) {
    const page=arr(await restRequest({table,query:{...query,limit:1000,offset}}));
    rows.push(...page);
    if(page.length<1000) return rows;
    offset+=page.length;
  }
}

function operationalRole(agent={}){
  const value=lower(agent.position || agent.job_title || agent.role || agent.job_code || "staff",180);
  if(value.includes("driver")) return "Driver";
  if(value.includes("guide")) return "Guide";
  if(value.includes("host") || value.includes("transfer")) return "Host";
  return clean(agent.position || agent.job_title || agent.job_code || "Staff",60) || "Staff";
}

function activityType(row={}){
  const p=obj(row.payload);
  const raw=lower(p.activityType || p.type || row.assignment_type || row.assignment || row.status,100);
  if(raw.includes("vac")) return "vacation";
  if(raw.includes("standby") || raw.includes("sby") || raw.includes("reserve")) return "sby";
  if(raw.includes("rest") || raw.includes("off") || raw.includes("leave")) return "rest";
  if(raw.includes("disrupt") || raw.includes("violation") || raw.includes("no show") || raw.includes("cancel")) return "disrupted";
  if(raw.includes("tour") || raw.includes("excursion")) return "flight";
  return "duty";
}

function sourceTimes(row={}){
  return rosterAssignmentTimes(row, obj(row.payload));
}

function activityLabel(row={}){
  const p=obj(row.payload);
  return clean(rosterAssignmentLabel(row, p) || "ASSIGNMENT",80);
}

function employeeKey(row={}){
  return upper(row.employee_id || row.employee_ref || obj(row.payload).skId || obj(row.payload).agentId,80);
}

function mapAssignment(row, sourceTable, windowStart){
  const {start,end}=sourceTimes(row);
  const type=activityType(row), p=obj(row.payload);
  return {
    id: clean(row.id,100), sourceId: clean(row.id,100), sourceTable,
    type, label: activityLabel(row),
    startH: Math.max(0,hoursBetween(windowStart,start)),
    durH: Math.max(0.5,hoursBetween(start,end) || Number(p.durationHours) || 1),
    status: status(row.status || p.status || "SCHEDULED"),
    isCalloutCandidate: type==="sby" && p.isCalloutCandidate!==false,
    startAt: isoDate(start), endAt: isoDate(end),
    routeId: clean(row.route_id || p.routeId,120),
    bookingReference: clean(row.booking_reference || p.bookingReference,120)
  };
}

function shiftWithin(row,startMs,endMs){
  const {start,end}=sourceTimes(row), a=new Date(start).getTime(), b=new Date(end||start).getTime();
  return Number.isFinite(a) && a < endMs && (!Number.isFinite(b) || b >= startMs);
}

function latestClockByEmployee(rows=[]){
  const map=new Map();
  for(const row of [...rows].sort((a,b)=>new Date(b.event_time||b.event_at||0)-new Date(a.event_time||a.event_at||0))){
    const key=employeeKey(row); if(key && !map.has(key)) map.set(key,row);
  }
  return map;
}

function ledgerHours(rows=[],skId,days){
  const cutoff=Date.now()-days*86400000;
  return rows.filter(r=>employeeKey(r)===skId && new Date(`${r.work_date||"1970-01-01"}T00:00:00Z`).getTime()>=cutoff)
    .reduce((sum,r)=>sum+(Number(r.hours)||0),0);
}

function buildJurisdictions(rows=[]){
  const out={};
  // This source records locations, not validated labor limits. Do not invent
  // limits or imply that a staff member is legally cleared to work.
  for(const row of rows){
    const base=upper(row.base_code,80);
    if(base) out[base]={name:clean(row.legal_work_location||row.country_code||base,160)};
  }
  return out;
}

function mapRequest(row={}){
  const p=obj(row.payload), type=requestType(row);
  const id=clean(p.requestId || row.id,100);
  return {id,sourceId:clean(row.id,100),employeeId:upper(row.employee_id,80),status:status(row.status||"PENDING REVIEW"),payload:p,type};
}

function mapMyRosterRequest(row={},staffMap=new Map()){
  const request=mapRequest(row), p=request.payload, staff=staffMap.get(request.employeeId);
  const type=request.type;
  const start=clean(p.startDate||row.start_time||"",40).slice(0,10);
  const end=clean(p.endDate||row.end_time||"",40).slice(0,10);
  return {
    id:request.sourceId,
    sourceId:request.sourceId,
    employeeId:request.employeeId,
    name:staff?.name||request.employeeId,
    base:clean(p.baseCode||staff?.base||"",80),
    type,
    period:[start,end].filter(Boolean).join(" to "),
    summary:clean(p.summary||p.reason||p.notes||row.notes||"Request submitted from MyRoster",400),
    status:request.status,
    submittedAt:row.created_at||""
  };
}

function staffProjection(agent={}){
  const skId=upper(agent.sk_id||agent.agent_id,80);
  return {
    agentId: skId,
    name: clean(agent.display_name||agent.preferred_name||[agent.first_name,agent.last_name].filter(Boolean).join(" ")||skId,180),
    base: clean(agent.base_code||agent.station||agent.base||agent.country_code||"—",80),
    role: operationalRole(agent)
  };
}

function mapLogistics(row, sourceTable, staffMap){
  const p=obj(row.payload), key=employeeKey(row), staff=staffMap.get(key);
  const {start,end}=sourceTimes(row);
  const location=clean(p.location || p.station || p.airport || p.hotel || p.routeLabel || row.route_id || row.booking_reference,180);
  const supplier=clean(p.supplier || p.provider || p.vehicleName || p.vehicle || p.transportProvider || sourceTable.replace(/_assignments$/, ""),180);
  return {
    id: clean(row.id,100),
    sourceId: clean(row.id,100),
    sourceTable,
    name: staff?.name || key || "Unassigned",
    loc: location || "—",
    supplier: supplier || "—",
    dates: [isoDate(start),isoDate(end)].filter(Boolean).join(" → "),
    status: status(row.status || p.status || "SCHEDULED")
  };
}

function mapAlteaAudit(row={}){
  const entity=[clean(row.entity_type,100),clean(row.entity_id,120)].filter(Boolean).join(" ");
  const details=[clean(row.source_system,100),entity,clean(row.message,300)].filter(Boolean).join(" · ");
  return {
    id: clean(row.id,100),
    time: row.created_at || "",
    action: clean(row.event_type || "ALTEA_SYNC",120),
    details,
    status: status(row.status || "RECORDED")
  };
}

async function loadBootstrap(session, {jurisdiction="US-NY",windowStart:windowStartParam=""}={}){
  const requestedStart=new Date(windowStartParam);
  const start=Number.isFinite(requestedStart.getTime()) ? requestedStart : new Date(Date.now()-24*3600000);
  start.setUTCHours(0,0,0,0);
  const end=new Date(start.getTime()+8*24*3600000); end.setUTCHours(23,59,59,999);
  const startMs=start.getTime(), endMs=end.getTime(), windowStart=start.toISOString();
  const ledgerFrom=new Date(Date.now()-366*86400000).toISOString().slice(0,10);

  const [
    agents,shifts,clock,ledger,requests,balances,leave,crew,drivers,tours,airport,vehicles,jurisdictionRows,alteaSync
  ]=await Promise.all([
    getRows(TABLES.agents,{active:"eq.true",order:"display_name.asc"}),
    getRows(TABLES.shifts,{order:"updated_at.desc"}),
    getRows(TABLES.clock,{order:"event_at.desc"}),
    getRows(TABLES.ledger,{work_date:`gte.${ledgerFrom}`,order:"work_date.desc"}),
    getRows(TABLES.requests,{order:"updated_at.desc"}),
    getRows(TABLES.balances),
    getRows(TABLES.leave),
    getRows(TABLES.crew,{order:"updated_at.desc"}),
    getRows(TABLES.drivers,{order:"updated_at.desc"}),
    getRows(TABLES.tours,{order:"updated_at.desc"}),
    getRows(TABLES.airport,{order:"updated_at.desc"}),
    getRows(TABLES.vehicles,{order:"updated_at.desc"}),
    getRows(TABLES.jurisdictions,{active:"eq.true",order:"base_code.asc"}),
    getRows(TABLES.alteaSync,{order:"created_at.desc"},500)
  ]);

  const transport=await transportBootstrap(agents,vehicles,session);
  const membersByService=new Map(arr(transport.assignments).filter(a=>a.version===2).map(a=>[a.id,arr(a.staff)]));
  const assignmentRows=[
    ...shifts.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.shifts})),
    ...crew.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.crew})),
    ...drivers.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.drivers})),
    ...tours.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.tours})),
    ...airport.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.airport})),
    ...vehicles.filter(r=>shiftWithin(r,startMs,endMs) && !(obj(r.payload).kind==="BUS" && obj(r.payload).opsTransportVersion===2) && !(obj(r.payload).kind==="BUS" && obj(r.payload).opsTransportVersion===1 && ["DRAFT","CANCELLED"].includes(upper(r.status,40)))).map(r=>({row:r,table:TABLES.vehicles})),
    ...vehicles.filter(r=>shiftWithin(r,startMs,endMs) && obj(r.payload).kind==="BUS" && obj(r.payload).opsTransportVersion===2 && ["SCHEDULED","CONFIRMED"].includes(upper(r.status,40))).flatMap(r=>[...new Set(arr(membersByService.get(r.id)).map(m=>m.employeeId))].map(employeeId=>({row:{...r,employee_id:employeeId},table:TABLES.vehicles})))
  ];

  const staffMap=new Map();
  for(const agent of agents){
    const projected=staffProjection(agent);
    for(const identifier of [agent.id,agent.sk_id,agent.agent_id,projected.agentId].map(value=>upper(value,80)).filter(Boolean)){
      staffMap.set(identifier,projected);
    }
  }
  const assignedByEmployee=new Map(), openTime=[], seen=new Set();
  for(const item of assignmentRows){
    const dedupe=`${item.table}:${item.row.id}:${employeeKey(item.row)}`; if(seen.has(dedupe)) continue; seen.add(dedupe);
    const mapped=mapAssignment(item.row,item.table,windowStart);
    const key=employeeKey(item.row);
    const owner=staffMap.get(key) || staffMap.get(upper(item.row.employee_ref,80));
    const staffId=owner?.agentId || key;
    if(!key){openTime.push(mapped);continue;}
    if(!assignedByEmployee.has(staffId)) assignedByEmployee.set(staffId,[]);
    assignedByEmployee.get(staffId).push(mapped);
  }

  const clocks=latestClockByEmployee(clock);
  const crewData=agents.map((a,index)=>{
    const skId=upper(a.sk_id||a.agent_id,80), acts=(assignedByEmployee.get(skId)||[]).sort((x,y)=>x.startH-y.startH);
    const current=acts.find(x=>!["rest","vacation"].includes(x.type)) || acts[0];
    const clockRow=clocks.get(skId), clockState=lower(clockRow?.event_type||clockRow?.status,80);
    const checkin=clockState.includes("in") && !clockState.includes("out") ? "green" : clockState ? "red" : "gray";
    const alert=acts.some(x=>x.type==="disrupted") ? "danger" : "";
    return {
      id:skId||index+1,agentId:skId,
      name:staffMap.get(skId)?.name || skId,
      assigned:current?.label||"OFF",
      badge:current?.type==="flight"?"purple":current?.type==="duty"?"green":current?.type==="sby"?"orange":"gray",
      role:staffMap.get(skId)?.role || operationalRole(a),
      base:staffMap.get(skId)?.base || "—",
      seeuor:staffMap.get(skId)?.base || "—",
      alert,checkin,acts,
      ftl:{d7:ledgerHours(ledger,skId,7),f28:ledgerHours(ledger,skId,28),f365:ledgerHours(ledger,skId,365)}
    };
  }).filter(c=>c.acts.length>0 || ["Guide","Driver","Host"].includes(c.role));

  const vacationRequests=requests.map(mapRequest).filter(r=>r.type==="VACATION").map(r=>{
    const staff=staffMap.get(r.employeeId), p=r.payload;
    return {
      id:r.id,sourceId:r.sourceId,employeeId:r.employeeId,
      name:staff?.name||r.employeeId,base:staff?.base||"",
      period:`${clean(p.startDate||p.start,40)} to ${clean(p.endDate||p.end,40)}`,
      days:Number(p.days)||0,rule:clean(p.jurisdictionName||p.jurisdiction||jurisdiction,120),
      priority:clean(p.priority||"Standard",120),status:r.status
    };
  });
  const ledgerVac=leave.filter(r=>lower(r.type,80).includes("vac")).map(r=>{
    const key=employeeKey(r), staff=staffMap.get(key);
    return {
      id:clean(obj(r.payload).requestId||r.id,100),sourceId:clean(r.id,100),employeeId:key,
      name:staff?.name||key,base:staff?.base||"",
      period:`${r.start_date||""} to ${r.end_date||""}`,days:Number(r.days)||0,
      rule:clean(obj(r.payload).jurisdiction||jurisdiction,120),priority:clean(obj(r.payload).priority||"Awarded",120),status:"APPROVED"
    };
  });
  const vacationMap=new Map([...ledgerVac,...vacationRequests].map(v=>[v.id,v]));
  const myRosterRequests=requests.map(r=>mapMyRosterRequest(r,staffMap)).filter(r=>["TIME_OFF","SCHEDULE_CHANGE","EOS_ACTION"].includes(r.type));
  const trades=requests.map(mapRequest).filter(r=>r.type==="TRIP_TRADE").map(r=>({
    id:r.id,sourceId:r.sourceId,
    crewA:clean(r.payload.crewAName||r.payload.crewA||staffMap.get(r.employeeId)?.name||r.employeeId,180),
    crewB:clean(r.payload.crewBName||r.payload.crewB,180),
    details:clean(r.payload.details||r.payload.exchangeDetails,300),
    rule:clean(r.payload.rule||"PENDING CHECK",120),status:r.status
  }));
  const bids=requests.map(mapRequest).filter(r=>r.type==="PREFERENTIAL_BID").map(r=>({
    id:r.id,sourceId:r.sourceId,staffName:clean(r.payload.staffName||staffMap.get(r.employeeId)?.name||r.employeeId,180),
    role:clean(r.payload.role,100),base:clean(r.payload.base,80),preferences:Number(r.payload.preferencesCount)||arr(r.payload.preferences).length,
    priority:Number(r.payload.priorityTotal)||0,validation:clean(r.payload.validation||"PENDING",80),status:r.status
  }));

  const logistics=[
    ...drivers.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>mapLogistics(r,TABLES.drivers,staffMap)),
    ...vehicles.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>mapLogistics(r,TABLES.vehicles,staffMap)),
    ...airport.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>mapLogistics(r,TABLES.airport,staffMap))
  ].sort((a,b)=>String(a.dates).localeCompare(String(b.dates)));
  const jurisdictions=buildJurisdictions(jurisdictionRows);
  const bases=[...new Set(crewData.map(c=>c.base).filter(v=>v&&v!=="—"))].sort().map(code=>({code}));
  const roles=[...new Set(crewData.map(c=>c.role).filter(Boolean))].sort().map(name=>({name}));
  const auditLog=[...alteaSync.slice(0,250).map(mapAlteaAudit),...arr(transport.events)].sort((a,b)=>String(b.time).localeCompare(String(a.time))).slice(0,250);

  return {
    ok:true,protocolVersion:PROTOCOL_VERSION,generatedAt:now(),syncedAt:now(),
    profile:profile(session),currentUser:profile(session),
    canManage:session.canManage===true || session.isSystemAdmin===true || hasGroup(session,"occ"),
    windowStart,window:{startAt:windowStart,endAt:end.toISOString(),dayLabels:Array.from({length:8},(_,i)=>{
      const d=new Date(start.getTime()+i*86400000);return d.toLocaleDateString("en-US",{weekday:"short",day:"2-digit",timeZone:"UTC"});
    })},
    jurisdiction:jurisdictions[jurisdiction]?jurisdiction:Object.keys(jurisdictions)[0],jurisdictions,
    crewData,staff:crewData,assignments:assignmentRows.map(({row,table})=>mapAssignment(row,table,windowStart)),
    vacations:[...vacationMap.values()],myRosterRequests,trades,bids,openTime,balances,logistics,transport,
    messages:[],communicationsManagedBy:"GroupTalk",auditLog,bases,roles,
    syncSources:{
      workforce:{source:TABLES.agents,records:agents.length},
      roster:{source:TABLES.shifts,records:shifts.length},
      assignments:{sources:[TABLES.crew,TABLES.drivers,TABLES.tours,TABLES.airport,TABLES.vehicles],records:assignmentRows.length},
      timeLedger:{source:TABLES.ledger,records:ledger.length},
      timeOff:{sources:[TABLES.requests,TABLES.leave,TABLES.balances],records:requests.length+leave.length+balances.length},
      compliance:{source:TABLES.jurisdictions,records:jurisdictionRows.length},
      altea:{source:TABLES.alteaSync,records:alteaSync.length},
      communications:{owner:"GroupTalk",embedded:false}
    },
    counts:{staff:crewData.length,assignments:assignmentRows.length,openTime:openTime.length,requests:requests.length,logistics:logistics.length,audit:auditLog.length}
  };
}

async function patchAssignment(table,id,changes={}){
  if(!ASSIGNMENT_TABLES.has(table)) throw new Error("OPS_ASSIGNMENT_SOURCE_INVALID");
  const current=first(await restRequest({table,query:{select:"*",id:`eq.${id}`,limit:1}}));
  if(!current) throw new Error("OPS_ASSIGNMENT_NOT_FOUND");
  if(table===TABLES.vehicles && obj(current.payload).kind==="BUS" && [1,2].includes(obj(current.payload).opsTransportVersion)) throw transportError("OPS_TRANSPORT_USE_TRANSPORT_EDITOR");
  const existing=obj(current.payload), body={updated_at:now()};
  if(table===TABLES.shifts){if(changes.type) body.assignment_type=changes.type;if(changes.status) body.status=changes.status;}
  else {if(changes.status) body.status=changes.status;if(changes.routeId) body.route_id=changes.routeId;}
  body.payload={...existing,...changes.payload};
  await restRequest({table,method:"PATCH",query:{id:`eq.${id}`},body,prefer:"return=minimal"});
}

async function createVacationRequest(session,payload={}){
  const p=profile(session), start=clean(payload.startDate,20), end=clean(payload.endDate,20);
  if(!start||!end) throw new Error("OPS_VACATION_DATES_REQUIRED");
  const days=Math.max(1,Math.round((new Date(`${end}T00:00:00Z`)-new Date(`${start}T00:00:00Z`))/86400000)+1);
  const requestId=`VAC-${Date.now().toString(36).toUpperCase()}`;
  await restRequest({
    table:TABLES.requests,method:"POST",
    body:{employee_id:p.agentId||p.skId,status:"PENDING REVIEW",notes:"OPS Control vacation request",payload:{
      requestType:"VACATION",requestId,startDate:start,endDate:end,days,priority:clean(payload.priority,120),
      jurisdiction:clean(payload.jurisdiction,80),jurisdictionName:clean(payload.jurisdictionName,160),createdByAgentId:p.agentId||p.skId
    },created_at:now(),updated_at:now()},prefer:"return=minimal"
  });
}

async function approveVacation(session,payload={}){
  const sourceId=clean(payload.sourceId||payload.requestId,100);
  const row=first(await restRequest({table:TABLES.requests,query:{select:"*",id:`eq.${sourceId}`,limit:1}}));
  if(!row || requestType(row)!=="VACATION") throw new Error("OPS_VACATION_REQUEST_NOT_FOUND");
  const p=obj(row.payload), employee=upper(row.employee_id,80), actor=profile(session).agentId||profile(session).skId;
  await restRequest({table:TABLES.requests,method:"PATCH",query:{id:`eq.${row.id}`},body:{status:"APPROVED",updated_at:now(),payload:{...p,approvedBy:actor,approvedAt:now()}},prefer:"return=minimal"});
  const existing=await getRows(TABLES.leave,{employee_id:`eq.${employee}`,order:"created_at.desc"});
  const found=existing.find(x=>obj(x.payload).sourceRequestId===row.id);
  if(!found){
    await restRequest({table:TABLES.leave,method:"POST",body:{employee_id:employee,type:"VACATION",days:Number(p.days)||0,hours:(Number(p.days)||0)*8,approved_by:actor,start_date:p.startDate||null,end_date:p.endDate||null,notes:"Approved in OPS Control",payload:{sourceRequestId:row.id,priority:p.priority,jurisdiction:p.jurisdiction},created_at:now(),updated_at:now()},prefer:"return=minimal"});
  }
}

function myRosterTimeOffDays(startValue,endValue){
  const start=clean(startValue,20),end=clean(endValue,20);
  const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+"T00:00:00Z"))&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
  if(!valid(start)||!valid(end)||start>end) throw new Error("OPS_MYROSTER_TIMEOFF_DATES_INVALID");
  const days=Math.round((Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000)+1;
  if(days<1||days>94) throw new Error("OPS_MYROSTER_TIMEOFF_DATES_INVALID");
  return {start,end,days};
}

async function resolveMyRosterRequest(session,payload={}){
  const sourceId=clean(payload.sourceId||payload.requestId,100);
  const decision=upper(payload.decision,20);
  if(!sourceId||!["APPROVED","REJECTED"].includes(decision)) throw new Error("OPS_MYROSTER_REQUEST_INVALID");
  const row=first(await restRequest({table:TABLES.requests,query:{select:"*",id:`eq.${sourceId}`,limit:1}}));
  const type=requestType(row||{}), allowedTypes=new Set(["TIME_OFF","SCHEDULE_CHANGE","EOS_ACTION"]);
  if(!row||!allowedTypes.has(type)) throw new Error("OPS_MYROSTER_REQUEST_NOT_FOUND");
  if(!["PENDING","PENDING REVIEW","SUBMITTED","OPEN"].includes(status(row.status))) throw new Error("OPS_MYROSTER_REQUEST_ALREADY_REVIEWED");
  const p=obj(row.payload), employee=upper(row.employee_id,80), actor=profile(session).agentId||profile(session).skId||"OPS";
  if(!employee) throw new Error("OPS_MYROSTER_REQUEST_STAFF_REQUIRED");
  if(decision==="APPROVED"&&type==="TIME_OFF"){
    const span=myRosterTimeOffDays(p.startDate||row.start_time,p.endDate||row.end_time);
    const existing=await getRows(TABLES.leave,{employee_id:`eq.${employee}`,order:"created_at.desc"});
    const found=existing.find(item=>obj(item.payload).sourceRequestId===row.id);
    if(!found){
      await restRequest({table:TABLES.leave,method:"POST",body:{
        employee_id:employee,type:"TIME_OFF",days:span.days,hours:span.days*8,approved_by:actor,
        start_date:span.start,end_date:span.end,notes:clean(p.notes||row.notes||"MyRoster time-off request",500),
        payload:{sourceRequestId:row.id,requestType:type,baseCode:clean(p.baseCode,80),reviewedBy:actor,reviewedAt:now()},
        created_at:now(),updated_at:now()
      },prefer:"return=minimal"});
    }
  }
  await restRequest({table:TABLES.requests,method:"PATCH",query:{id:`eq.${row.id}`},body:{
    status:decision,updated_at:now(),payload:{...p,opsDecision:decision,reviewedBy:actor,reviewedAt:now()}
  },prefer:"return=minimal"});
  return {ok:true,sourceId:row.id,requestType:type,decision};
}

async function optimizeAssignments(){
  let recovered=0; const startMs=Date.now()-24*3600000, endMs=Date.now()+8*24*3600000;
  for(const table of ASSIGNMENT_TABLES){
    const rows=await getRows(table,{order:"updated_at.desc"});
    for(const row of rows){
      if(!shiftWithin(row,startMs,endMs) || activityType(row)!=="disrupted") continue;
      const p=obj(row.payload);
      if(table===TABLES.vehicles && p.kind==="BUS" && [1,2].includes(p.opsTransportVersion)) continue;
      await patchAssignment(table,row.id,{status:"RECOVERED",payload:{...p,activityType:p.preDisruptionType||"duty",optimizationStatus:"RECOVERED",optimizedAt:now()}});
      recovered++;
    }
  }
  return recovered;
}

export async function getOpsControlBootstrapCore(payload={}){
  const session=await requireOpsSession();
  return loadBootstrap(session,payload);
}

export async function handleOpsControlActionCore({type="",payload={}}={}){
  const action=upper(type,100), p=obj(payload);
  const session=action==="REFRESH"?await requireOpsSession():await requireOpsSession({write:true,requestReview:action==="RESOLVE_MYROSTER_REQUEST"});
  if(action==="REFRESH") return loadBootstrap(session,p);
  if(action==="SAVE_TRANSPORT_VEHICLE"){
    await saveTransportVehicle(session,p);
  }else if(action==="SAVE_TRANSPORT_SERVICE_V2"){
    await saveTransportServiceV2(session,p);
  }else if(action==="APPROVE_TRANSPORT_NO_HOST"){
    const actor=transportActor(session),serviceId=clean(p.serviceId,80),note=clean(p.note,500),expectedUpdatedAt=clean(p.expectedUpdatedAt,80);
    if(!actor||!TRANSPORT_ID.test(serviceId)||!note||!expectedUpdatedAt)throw transportError("OPS_TRANSPORT_APPROVAL_INVALID");
    await transportRpc("ops_transport_approve_no_host_v2",{actor,serviceId,note,expectedUpdatedAt});
  }else if(action==="SAVE_TRANSPORT_ASSIGNMENT"){
    await saveTransportAssignment(session,p);
  }else if(action==="UPDATE_ASSIGNMENT"){
    await patchAssignment(clean(p.sourceTable,100),clean(p.sourceId,100),{status:status(p.status),type:clean(p.type,80),payload:{label:clean(p.label,120),activityType:clean(p.type,80),status:status(p.status),updatedByAgentId:profile(session).agentId||profile(session).skId,updatedAt:now()}});
  }else if(action==="ACTIVATE_STANDBY"){
    await patchAssignment(clean(p.sourceTable,100),clean(p.sourceId,100),{status:"ON-TIME",routeId:clean(p.label,120),payload:{label:clean(p.label||"ASSIGNED",120),activityType:clean(p.activityType||"duty",80),status:"ON-TIME",isCalloutCandidate:false,activatedByAgentId:profile(session).agentId||profile(session).skId,activatedAt:now()}});
  }else if(action==="CREATE_VACATION_REQUEST"){
    await createVacationRequest(session,p);
  }else if(action==="APPROVE_VACATION"){
    await approveVacation(session,p);
  }else if(action==="RESOLVE_MYROSTER_REQUEST"){
    await resolveMyRosterRequest(session,p);
  }else if(action==="APPROVE_TRIP_TRADE"){
    const id=clean(p.sourceId||p.requestId,100), row=first(await restRequest({table:TABLES.requests,query:{select:"*",id:`eq.${id}`,limit:1}}));
    if(!row || requestType(row)!=="TRIP_TRADE") throw new Error("OPS_TRIP_TRADE_NOT_FOUND");
    await restRequest({table:TABLES.requests,method:"PATCH",query:{id:`eq.${id}`},body:{status:"APPROVED",updated_at:now(),payload:{...obj(row.payload),approvedBy:profile(session).agentId||profile(session).skId,approvedAt:now()}},prefer:"return=minimal"});
  }else if(action==="ACKNOWLEDGE_ALERT"){
    await patchAssignment(clean(p.sourceTable,100),clean(p.sourceId,100),{payload:{alertAcknowledgedAt:now(),alertAcknowledgedBy:profile(session).agentId||profile(session).skId}});
  }else if(action==="OPTIMIZE"){
    const recovered=await optimizeAssignments(), bootstrap=await loadBootstrap(session,p);
    return {ok:true,recovered,bootstrap};
  }else{
    const error=new Error("OPS_CONTROL_ACTION_UNSUPPORTED"); error.code="OPS_CONTROL_ACTION_UNSUPPORTED"; throw error;
  }
  if(["SAVE_TRANSPORT_VEHICLE","SAVE_TRANSPORT_ASSIGNMENT","SAVE_TRANSPORT_SERVICE_V2","APPROVE_TRANSPORT_NO_HOST"].includes(action)){
    // The RPC transaction has committed. A later refresh failure must not be
    // reported as a failed save, which could lead to duplicate retries.
    try { return {ok:true,bootstrap:await loadBootstrap(session,p)}; }
    catch (_) { return {ok:true,refreshRequired:true}; }
  }
  return {ok:true,bootstrap:await loadBootstrap(session,p)};
}

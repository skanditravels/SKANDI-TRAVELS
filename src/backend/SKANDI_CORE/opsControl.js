// /src/backend/SKANDI_CORE/opsControl.js
// B-011.31 — OPS Control backend controller over the canonical workforce/roster domain.
// No duplicate workforce store: reads/writes existing staff, roster, time-off and assignment tables only.

import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

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
  jurisdictions: "hr_base_jurisdictions"
});

const ASSIGNMENT_TABLES = new Set([TABLES.shifts, TABLES.crew, TABLES.drivers, TABLES.tours, TABLES.airport, TABLES.vehicles]);
const OPS_GROUPS = new Set(["operations", "occ", "managers", "system-admin"]);
const PROTOCOL_VERSION = "B-011.31-OPS-CONTROL";

const JURISDICTION_DEFAULTS = Object.freeze({
  "US-NY": Object.freeze({ name:"New York (NY Labor)", maxDuty7:60, maxFlight28:200, maxFlight365:2000, minRest:10, annualVacation:21 }),
  "US-CA": Object.freeze({ name:"California (CA Labor)", maxDuty7:60, maxFlight28:200, maxFlight365:2000, minRest:11, annualVacation:21 }),
  "SE-STO": Object.freeze({ name:"Sweden / Stockholm", maxDuty7:48, maxFlight28:180, maxFlight365:1800, minRest:11, annualVacation:25 }),
  "NO-OSL": Object.freeze({ name:"Norway / Oslo", maxDuty7:48, maxFlight28:180, maxFlight365:1800, minRest:11, annualVacation:25 }),
  "FI-HEL": Object.freeze({ name:"Finland / Helsinki", maxDuty7:48, maxFlight28:180, maxFlight365:1800, minRest:11, annualVacation:24 }),
  "ES-PMI": Object.freeze({ name:"Spain / Palma", maxDuty7:48, maxFlight28:180, maxFlight365:1800, minRest:12, annualVacation:22 }),
  "TH-BKK": Object.freeze({ name:"Thailand / Bangkok", maxDuty7:48, maxFlight28:192, maxFlight365:1920, minRest:8, annualVacation:6 }),
  "GR-ATH": Object.freeze({ name:"Greece / Athens", maxDuty7:48, maxFlight28:180, maxFlight365:1800, minRest:11, annualVacation:20 })
});

function arr(value){ return Array.isArray(value) ? value : value ? [value] : []; }
function obj(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value,max=500){ return String(value ?? "").trim().slice(0,max); }
function upper(value,max=120){ return clean(value,max).toUpperCase(); }
function lower(value,max=120){ return clean(value,max).toLowerCase(); }
function first(value){ return arr(value)[0] || null; }
function now(){ return new Date().toISOString(); }
function isoDate(value){ const d=new Date(value); return Number.isFinite(d.getTime()) ? d.toISOString() : ""; }
function hoursBetween(a,b){ const x=new Date(a).getTime(), y=new Date(b).getTime(); return Number.isFinite(x)&&Number.isFinite(y) ? Math.max(0,(y-x)/3600000) : 0; }
function dateKey(value){ const d=new Date(value); return Number.isFinite(d.getTime()) ? d.toISOString().slice(0,10) : ""; }
function requestType(row){ return upper(obj(row?.payload).requestType || obj(row?.payload).type || row?.type,80); }
function status(value){ return upper(value || "SCHEDULED",80); }

function profile(session){ return session?.profile || {}; }
function hasGroup(session,key){ return arr(session?.permissionGroups).map(v=>lower(v,100)).includes(lower(key,100)); }
function isWildcard(session){ const values=[...arr(session?.permissionKeys),...arr(session?.allowedApps),...arr(session?.permissionGroups)].map(v=>lower(v,100)); return values.includes("*") || values.includes("all"); }

async function requireOpsSession({write=false}={}){
  const session=await requireStaffPortalSessionCore();
  const groups=new Set(arr(session.permissionGroups).map(v=>lower(v,100)));
  const privileged=session.isSystemAdmin===true || isWildcard(session) || upper(session.accessRole,80)==="SUPER_ADMIN";
  const operational=privileged || [...OPS_GROUPS].some(g=>groups.has(g)) || session.canManage===true;
  if(!operational) throw new Error("OPS_CONTROL_ACCESS_DENIED");
  if(write && !(privileged || session.canManage===true || groups.has("occ") || groups.has("system-admin"))) throw new Error("OPS_CONTROL_WRITE_DENIED");
  return session;
}

async function getRows(table, query={}){
  const rows=[]; const pageSize=1000; let offset=0;
  while(true){
    const page=arr(await restRequest({table,query:{select:"*",...query,limit:pageSize,offset}}));
    rows.push(...page);
    if(page.length<pageSize) break;
    offset+=pageSize;
    if(offset>=10000) break;
  }
  return rows;
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
  return {
    start: row.start_time || row.start_at || obj(row.payload).startTime || "",
    end: row.end_time || row.end_at || obj(row.payload).endTime || ""
  };
}

function activityLabel(row={}){
  const p=obj(row.payload);
  return clean(p.label || row.assignment || row.route_id || row.booking_reference || p.routeLabel || p.reference || "ASSIGNMENT",80);
}

function employeeKey(row={}){ return upper(row.employee_id || row.employee_ref || obj(row.payload).skId || obj(row.payload).agentId,80); }

function mapAssignment(row, sourceTable, windowStart){
  const {start,end}=sourceTimes(row);
  const type=activityType(row), p=obj(row.payload);
  return {
    id: clean(row.id,100),
    sourceId: clean(row.id,100),
    sourceTable,
    type,
    label: activityLabel(row),
    startH: Math.max(0,hoursBetween(windowStart,start)),
    durH: Math.max(0.5,hoursBetween(start,end) || Number(p.durationHours) || 1),
    status: status(row.status || p.status || "SCHEDULED"),
    isCalloutCandidate: type==="sby" && p.isCalloutCandidate!==false,
    startAt: isoDate(start),
    endAt: isoDate(end),
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
  for(const [key,value] of Object.entries(JURISDICTION_DEFAULTS)) out[key]={...value};
  const lookup=new Map(rows.map(r=>[upper(r.base_code,80),r]));
  const aliases={"US-NY":"NYCXEC","US-CA":"SFOGOP","SE-STO":"STOXEC","NO-OSL":"OSLGOP","FI-HEL":"HELGOP","ES-PMI":"PMIGOP","TH-BKK":"BKKGOP","GR-ATH":"CHQGOP"};
  for(const [key,baseCode] of Object.entries(aliases)){
    const row=lookup.get(baseCode); if(row?.legal_work_location) out[key].name=key.startsWith("US-")?`${row.legal_work_location} (${out[key].name.split("(")[1]||"Labor)"}`:`${row.country_code||key.split("-")[0]} / ${row.legal_work_location}`;
  }
  return out;
}

function mapRequest(row={}){
  const p=obj(row.payload), type=requestType(row);
  const id=clean(p.requestId || row.id,100);
  return { id, sourceId:clean(row.id,100), employeeId:upper(row.employee_id,80), status:status(row.status||"PENDING REVIEW"), payload:p, type };
}

async function loadBootstrap(session,{jurisdiction="US-NY",windowStart=""}={}){
  const requestedStart=new Date(windowStart);
  const start=Number.isFinite(requestedStart.getTime()) ? requestedStart : new Date(Date.now()-24*3600000);
  start.setUTCHours(0,0,0,0);
  const end=new Date(start.getTime()+8*24*3600000);
  end.setUTCHours(23,59,59,999);
  const [agents,shifts,clock,ledger,requests,balances,leave,crew,drivers,tours,airport,vehicles,jurisdictionRows]=await Promise.all([
    getRows(TABLES.agents,{active:"eq.true",authorized:"eq.true",portal_access:"eq.true",order:"display_name.asc"}),
    getRows(TABLES.shifts,{order:"start_time.asc"}), getRows(TABLES.clock,{order:"event_time.desc"}), getRows(TABLES.ledger,{order:"work_date.desc"}),
    getRows(TABLES.requests,{order:"updated_at.desc"}), getRows(TABLES.balances,{order:"updated_at.desc"}), getRows(TABLES.leave,{order:"created_at.desc"}),
    getRows(TABLES.crew,{order:"start_time.asc"}), getRows(TABLES.drivers,{order:"start_time.asc"}), getRows(TABLES.tours,{order:"start_time.asc"}),
    getRows(TABLES.airport,{order:"start_time.asc"}), getRows(TABLES.vehicles,{order:"start_time.asc"}), getRows(TABLES.jurisdictions,{active:"eq.true",order:"base_code.asc"})
  ]);
  const startMs=start.getTime(), endMs=end.getTime(), windowStart=start.toISOString();
  const assignmentRows=[
    ...shifts.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.shifts})),
    ...crew.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.crew})),
    ...drivers.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.drivers})),
    ...tours.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.tours})),
    ...airport.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.airport})),
    ...vehicles.filter(r=>shiftWithin(r,startMs,endMs)).map(r=>({row:r,table:TABLES.vehicles}))
  ];
  const assignedByEmployee=new Map(); const openTime=[]; const seen=new Set();
  for(const item of assignmentRows){
    const dedupe=`${item.table}:${item.row.id}`; if(seen.has(dedupe)) continue; seen.add(dedupe);
    const mapped=mapAssignment(item.row,item.table,windowStart), key=employeeKey(item.row);
    if(!key){ openTime.push(mapped); continue; }
    if(!assignedByEmployee.has(key)) assignedByEmployee.set(key,[]); assignedByEmployee.get(key).push(mapped);
  }
  const clocks=latestClockByEmployee(clock);
  const crewData=agents.map((a,index)=>{
    const skId=upper(a.sk_id||a.agent_id,80), acts=(assignedByEmployee.get(skId)||[]).sort((x,y)=>x.startH-y.startH);
    const current=acts.find(x=>!['rest','vacation'].includes(x.type)) || acts[0];
    const clockRow=clocks.get(skId), clockState=lower(clockRow?.event_type||clockRow?.status,80);
    const checkin=clockState.includes("in") && !clockState.includes("out") ? "green" : clockState ? "red" : "gray";
    const alert=acts.some(x=>x.type==="disrupted") ? "danger" : "";
    return {
      id: skId || index+1,
      agentId: skId,
      name: clean(a.display_name||a.preferred_name||[a.first_name,a.last_name].filter(Boolean).join(" ")||skId,180),
      assigned: current?.label || "OFF",
      badge: current?.type==="flight"?"purple":current?.type==="duty"?"green":current?.type==="sby"?"orange":"gray",
      role: operationalRole(a),
      base: clean(a.base_code||a.station||a.base||a.country_code||"—",80),
      seeuor: clean(a.base_code||a.station||a.base||a.country_code||"—",80),
      alert,
      checkin,
      acts,
      ftl:{d7:ledgerHours(ledger,skId,7),f28:ledgerHours(ledger,skId,28),f365:ledgerHours(ledger,skId,365)}
    };
  }).filter(c=>c.acts.length>0 || ["Guide","Driver","Host"].includes(c.role));

  const vacationRequests=requests.map(mapRequest).filter(r=>r.type==="VACATION").map(r=>({
    id:r.id, sourceId:r.sourceId,
    period:`${clean(r.payload.startDate||r.payload.start,40)} to ${clean(r.payload.endDate||r.payload.end,40)}`,
    days:Number(r.payload.days)||0,
    rule:clean(r.payload.jurisdictionName||r.payload.jurisdiction||jurisdiction,120),
    priority:clean(r.payload.priority||"Standard",120), status:r.status, employeeId:r.employeeId
  }));
  const ledgerVac=leave.filter(r=>lower(r.type,80).includes("vac")).map(r=>({
    id:clean(obj(r.payload).requestId||r.id,100),sourceId:clean(r.id,100),period:`${r.start_date||""} to ${r.end_date||""}`,days:Number(r.days)||0,
    rule:clean(obj(r.payload).jurisdiction||jurisdiction,120),priority:clean(obj(r.payload).priority||"Awarded",120),status:"APPROVED",employeeId:upper(r.employee_id,80)
  }));
  const vacationMap=new Map([...ledgerVac,...vacationRequests].map(v=>[v.id,v]));
  const trades=requests.map(mapRequest).filter(r=>r.type==="TRIP_TRADE").map(r=>({id:r.id,sourceId:r.sourceId,crewA:clean(r.payload.crewAName||r.payload.crewA||r.employeeId,180),crewB:clean(r.payload.crewBName||r.payload.crewB,180),details:clean(r.payload.details||r.payload.exchangeDetails,300),rule:clean(r.payload.rule||"PENDING CHECK",120),status:r.status}));
  const bids=requests.map(mapRequest).filter(r=>r.type==="PREFERENTIAL_BID").map(r=>({id:r.id,sourceId:r.sourceId,staffName:clean(r.payload.staffName||r.employeeId,180),role:clean(r.payload.role,100),base:clean(r.payload.base,80),preferences:Number(r.payload.preferencesCount)||arr(r.payload.preferences).length,priority:Number(r.payload.priorityTotal)||0,validation:clean(r.payload.validation||"PENDING",80),status:r.status}));
  const jurisdictions=buildJurisdictions(jurisdictionRows);
  return {
    ok:true, protocolVersion:PROTOCOL_VERSION, generatedAt:now(), profile:profile(session), canManage:session.canManage===true || session.isSystemAdmin===true || hasGroup(session,"occ"),
    windowStart,
    window:{startAt:windowStart,endAt:end.toISOString(),dayLabels:Array.from({length:8},(_,i)=>{const d=new Date(start.getTime()+i*86400000);return d.toLocaleDateString("en-US",{weekday:"short",day:"2-digit",timeZone:"UTC"})})},
    jurisdiction:jurisdictions[jurisdiction]?jurisdiction:Object.keys(jurisdictions)[0], jurisdictions,
    crewData, vacations:[...vacationMap.values()], trades, bids, openTime, balances, counts:{staff:crewData.length,assignments:assignmentRows.length,openTime:openTime.length,requests:requests.length}
  };
}

async function patchAssignment(table,id,changes={}){
  if(!ASSIGNMENT_TABLES.has(table)) throw new Error("OPS_ASSIGNMENT_SOURCE_INVALID");
  const current=first(await restRequest({table,query:{select:"*",id:`eq.${id}`,limit:1}}));
  if(!current) throw new Error("OPS_ASSIGNMENT_NOT_FOUND");
  const existing=obj(current.payload), body={updated_at:now()};
  if(table===TABLES.shifts){ if(changes.type) body.assignment_type=changes.type; if(changes.status) body.status=changes.status; }
  else { if(changes.status) body.status=changes.status; if(changes.routeId) body.route_id=changes.routeId; }
  body.payload={...existing,...changes.payload};
  await restRequest({table,method:"PATCH",query:{id:`eq.${id}`},body,prefer:"return=minimal"});
}

async function createVacationRequest(session,payload={}){
  const p=profile(session), start=clean(payload.startDate,20), end=clean(payload.endDate,20); if(!start||!end) throw new Error("OPS_VACATION_DATES_REQUIRED");
  const days=Math.max(1,Math.round((new Date(`${end}T00:00:00Z`)-new Date(`${start}T00:00:00Z`))/86400000)+1);
  const requestId=`VAC-${Date.now().toString(36).toUpperCase()}`;
  await restRequest({table:TABLES.requests,method:"POST",body:{employee_id:p.agentId||p.skId,status:"PENDING REVIEW",notes:"OPS Control vacation request",payload:{requestType:"VACATION",requestId,startDate:start,endDate:end,days,priority:clean(payload.priority,120),jurisdiction:clean(payload.jurisdiction,80),jurisdictionName:clean(payload.jurisdictionName,160),createdByAgentId:p.agentId||p.skId},created_at:now(),updated_at:now()},prefer:"return=minimal"});
}

async function approveVacation(session,payload={}){
  const sourceId=clean(payload.sourceId||payload.requestId,100); const row=first(await restRequest({table:TABLES.requests,query:{select:"*",id:`eq.${sourceId}`,limit:1}}));
  if(!row || requestType(row)!=="VACATION") throw new Error("OPS_VACATION_REQUEST_NOT_FOUND");
  const p=obj(row.payload), employee=upper(row.employee_id,80);
  await restRequest({table:TABLES.requests,method:"PATCH",query:{id:`eq.${row.id}`},body:{status:"APPROVED",updated_at:now(),payload:{...p,approvedBy:profile(session).agentId||profile(session).skId,approvedAt:now()}},prefer:"return=minimal"});
  const existing=getRows(TABLES.leave,{employee_id:`eq.${employee}`,order:"created_at.desc"});
  const found=(await existing).find(x=>obj(x.payload).sourceRequestId===row.id);
  if(!found) await restRequest({table:TABLES.leave,method:"POST",body:{employee_id:employee,type:"VACATION",days:Number(p.days)||0,hours:(Number(p.days)||0)*8,approved_by:profile(session).agentId||profile(session).skId,start_date:p.startDate||null,end_date:p.endDate||null,notes:"Approved in OPS Control",payload:{sourceRequestId:row.id,priority:p.priority,jurisdiction:p.jurisdiction},created_at:now(),updated_at:now()},prefer:"return=minimal"});
}

async function optimizeAssignments(){
  let recovered=0; const startMs=Date.now()-24*3600000, endMs=Date.now()+8*24*3600000;
  for(const table of ASSIGNMENT_TABLES){
    const rows=await getRows(table,{order:"updated_at.desc"});
    for(const row of rows){
      if(!shiftWithin(row,startMs,endMs) || activityType(row)!=="disrupted") continue;
      const p=obj(row.payload);
      await patchAssignment(table,row.id,{status:"RECOVERED",payload:{...p,activityType:p.preDisruptionType||"duty",optimizationStatus:"RECOVERED",optimizedAt:now()}});
      recovered++;
    }
  }
  return recovered;
}

export async function getOpsControlBootstrapCore(payload={}){
  const session=await requireOpsSession(); return loadBootstrap(session,payload);
}

export async function handleOpsControlActionCore({type="",payload={}}={}){
  const action=upper(type,100); const session=await requireOpsSession({write:action!=="REFRESH"}); const p=obj(payload);
  if(action==="REFRESH") return loadBootstrap(session,p);
  if(action==="UPDATE_ASSIGNMENT"){
    await patchAssignment(clean(p.sourceTable,100),clean(p.sourceId,100),{status:status(p.status),type:clean(p.type,80),payload:{label:clean(p.label,120),activityType:clean(p.type,80),status:status(p.status),updatedByAgentId:profile(session).agentId||profile(session).skId,updatedAt:now()}});
  } else if(action==="ACTIVATE_STANDBY"){
    await patchAssignment(clean(p.sourceTable,100),clean(p.sourceId,100),{status:"ON-TIME",routeId:clean(p.label,120),payload:{label:clean(p.label||"ASSIGNED",120),activityType:clean(p.activityType||"duty",80),status:"ON-TIME",isCalloutCandidate:false,activatedByAgentId:profile(session).agentId||profile(session).skId,activatedAt:now()}});
  } else if(action==="CREATE_VACATION_REQUEST"){
    await createVacationRequest(session,p);
  } else if(action==="APPROVE_VACATION"){
    await approveVacation(session,p);
  } else if(action==="APPROVE_TRIP_TRADE"){
    const id=clean(p.sourceId||p.requestId,100);
    const row=first(await restRequest({table:TABLES.requests,query:{select:"*",id:`eq.${id}`,limit:1}}));
    if(!row || requestType(row)!=="TRIP_TRADE") throw new Error("OPS_TRIP_TRADE_NOT_FOUND");
    await restRequest({table:TABLES.requests,method:"PATCH",query:{id:`eq.${id}`},body:{status:"APPROVED",updated_at:now(),payload:{...obj(row.payload),approvedBy:profile(session).agentId||profile(session).skId,approvedAt:now()}},prefer:"return=minimal"});
  } else if(action==="ACKNOWLEDGE_ALERT"){
    await patchAssignment(clean(p.sourceTable,100),clean(p.sourceId,100),{payload:{alertAcknowledgedAt:now(),alertAcknowledgedBy:profile(session).agentId||profile(session).skId}});
  } else if(action==="OPTIMIZE"){
    const recovered=await optimizeAssignments(); const bootstrap=await loadBootstrap(session,p); return {ok:true,recovered,bootstrap};
  } else throw new Error("OPS_CONTROL_ACTION_UNSUPPORTED");
  return {ok:true,bootstrap:await loadBootstrap(session,p)};
}

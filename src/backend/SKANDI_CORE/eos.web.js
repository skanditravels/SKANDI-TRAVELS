// EOS is the authenticated mobile/tablet operations surface for ALTEA.
// All roster rows are scoped to the signed-in staff identity; flight data comes
// from the live ALTEA FIDS and inventory schedule, never embedded examples.
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const OWNED_TABLES = Object.freeze({
  roster_shifts: { select:"id,employee_id,employee_ref,start_at,end_at,start_time,end_time,location,assignment_type,status,payload,route_id,booking_reference,notes,created_at,updated_at", ownerColumns:["employee_id","employee_ref"] },
  crew_assignments: { select:"id,employee_id,employee_ref,assignment,route,start_at,end_at,start_time,end_time,status,notes,booking_reference,route_id,payload,created_at,updated_at", ownerColumns:["employee_id","employee_ref"] },
  airport_duty_assignments: { select:"id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at", ownerColumns:["employee_id"] },
  driver_assignments: { select:"id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at", ownerColumns:["employee_id"] },
  tour_assignments: { select:"id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at", ownerColumns:["employee_id"] }
});
const ACTIONS = new Set(["SAFETY_REPORT", "FLIGHT_ISSUE", "STATION_UPDATE", "CREW_SUPPORT", "DUTY_NOTE"]);
const MAX_ROWS = "300";

function clean(value, max=500) { return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0,max); }
function upper(value, max=120) { return clean(value,max).toUpperCase(); }
function obj(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") { try { const parsed=JSON.parse(value); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch (_) {} }
  return {};
}
function rowsOf(result) { return Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []; }
function fail(code) { const error=new Error(code); error.code=code; throw error; }
function validDate(value) {
  const date=clean(value,20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed=new Date(date+"T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===date;
}
function dateList(from,to) {
  const out=[];
  for (let t=Date.parse(from+"T00:00:00Z"); t<=Date.parse(to+"T00:00:00Z"); t+=86400000) out.push(new Date(t).toISOString().slice(0,10));
  return out;
}
function permissionGroups(session) { return (Array.isArray(session.permissionGroups)?session.permissionGroups:[]).map(v=>clean(v,100).toLowerCase()); }
async function authorizedSession() {
  const session=await requireStaffPortalSessionCore();
  const groups=new Set(permissionGroups(session));
  const allowed=new Set((Array.isArray(session.allowedApps)?session.allowedApps:[]).map(v=>clean(v,100).toLowerCase()));
  const keys=new Set((Array.isArray(session.permissionKeys)?session.permissionKeys:[]).map(v=>clean(v,100).toLowerCase()));
  const permitted=session.isSystemAdmin===true || session.canManage===true || groups.has("operations") || groups.has("occ") || groups.has("airport") || groups.has("destination") || groups.has("managers") || groups.has("system-admin") || allowed.has("eos") || keys.has("eos");
  if (!permitted) fail("EOS_ACCESS_DENIED");
  const profile=session.profile||{};
  const employeeId=clean(profile.agentUserUuid||profile.agentUserId||profile.id||"",160);
  const staffId=clean(profile.agentId||profile.skId||"",160);
  if (!employeeId && !staffId) fail("EOS_STAFF_ID_REQUIRED");
  return {session,profile,employeeId:employeeId||staffId,staffId,identifiers:[...new Set([employeeId,staffId].filter(Boolean))]};
}
function owns(row, identifiers) {
  const allowed=new Set(identifiers.map(v=>String(v).toLowerCase()));
  return [row.employee_id,row.employee_ref].some(v=>v && allowed.has(String(v).toLowerCase()));
}
async function queryOwned(table, context) {
  const definition=OWNED_TABLES[table];
  if (!definition) return [];
  const found=[];
  for (const column of definition.ownerColumns) for (const identifier of context.identifiers) {
    const result=await restRequest({table,method:"GET",query:{select:definition.select,[column]:"eq."+identifier,limit:MAX_ROWS}});
    for (const row of rowsOf(result)) if (owns(row,context.identifiers)) found.push(row);
  }
  const seen=new Set();
  return found.filter(row=>row.id&&!seen.has(String(row.id))&&seen.add(String(row.id)));
}
function normalizeAssignment(row,table) {
  const p=obj(row.payload);
  const start=clean(row.start_at||row.start_time||p.startAt||p.start_time,80);
  const end=clean(row.end_at||row.end_time||p.endAt||p.end_time,80);
  return {
    id:clean(row.id,160), sourceTable:table,
    label:clean(row.assignment||row.assignment_type||p.label||p.assignment||p.title||row.route||"Operational duty",180),
    type:clean(p.activityType||p.type||row.assignment_type||"duty",80),
    route:clean(row.route||p.route||"",120), routeId:clean(row.route_id||p.routeId||"",120),
    reference:clean(row.booking_reference||p.bookingReference||"",80),
    location:clean(row.location||p.location||"",160), startAt:start, endAt:end,
    status:clean(row.status||p.status||"SCHEDULED",60), notes:clean(row.notes||p.notes||"",300), payload:p
  };
}
function publicProfile(context) {
  const p=context.profile;
  return {
    agentId:clean(p.agentId||p.skId||context.staffId,120),
    displayName:clean(p.displayName||p.fullName||p.preferredName||"SKANDI staff",180),
    firstName:clean(p.firstName||p.first_name||"",100),lastName:clean(p.lastName||p.last_name||"",100),
    email:clean(p.corporateEmailAddress||p.email||"",200),jobTitle:clean(p.jobTitle||p.position||"",160),
    baseCode:clean(p.baseCode||p.destinationCode||p.station||p.base||"",80),
    baseName:clean(p.baseName||p.station||p.base||"",160),destinationCode:clean(p.destinationCode||p.airportIata||"",8),
    badgePhotoUrl:clean(p.badgePhotoUrl||"",1200),accessRole:clean(context.session.accessRole||p.accessRole||"",100),canUseGroupTalk:context.session.canAccessGroupTalk===true
  };
}
function stationCode(context) {
  const p=context.profile;
  for (const raw of [p.destinationCode,p.airportIata,p.baseIata,p.baseCode,p.base,p.station]) {
    const value=upper(raw,12).replace(/[^A-Z]/g,"");
    if (/^[A-Z]{3}$/.test(value)) return value;
  }
  return "";
}
function normalizeFlight(row,source="ALTEA FIDS") {
  return {
    id:clean(row.id||row.flight_key||row.flight_number,160),flightNumber:clean(row.flight_number||row.flightNumber,40),
    airlineCode:clean(row.airline_code||"",12),airlineName:clean(row.airline_name||"",100),
    origin:upper(row.origin||row.board_point,8),destination:upper(row.destination||row.off_point,8),viaPoint:upper(row.via_point||"",8),
    departureDate:clean(row.departure_date||row.departureDate,20),scheduledTime:clean(row.scheduled_time||row.std,40),
    arrivalTime:clean(row.arrival_time||row.sta||"",40),estimatedTime:clean(row.estimated_time||"",40),actualTime:clean(row.actual_time||"",40),
    gate:clean(row.gate||"",40),terminal:clean(row.terminal||"",40),belt:clean(row.belt||"",40),status:clean(row.status||"SCHEDULED",80),
    aircraftType:clean(row.aircraft_type||row.equipment_type||"",80),registration:clean(row.registration||"",40),source
  };
}
function flightToken(value) { return clean(value,80).toUpperCase().replace(/[^A-Z0-9]/g,""); }
function operatesOn(row,date) {
  const raw=row.days_of_operation;
  if (!raw) return true;
  const jsDay=new Date(date+"T00:00:00Z").getUTCDay(), bit=jsDay===0?7:jsDay;
  if (Array.isArray(raw)) return raw.map(v=>Number(v)).includes(bit);
  const value=String(raw).replace(/[^0-9]/g,"");
  return !value || value.includes(String(bit));
}
async function flightsForStation(context,{from,to,query=""}={}) {
  const code=stationCode(context);
  if (!code) return [];
  const start=validDate(from)?from:new Date().toISOString().slice(0,10);
  const finish=validDate(to)?to:start;
  if (finish<start || (Date.parse(finish+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000>13) fail("EOS_FLIGHT_RANGE_INVALID");
  const token=flightToken(query);
  const [fids,schedule]=await Promise.all([
    restRequest({table:"altea_fids_flights",method:"GET",query:{select:"id,flight_key,flight_number,airline_code,airline_name,origin,destination,departure_date,scheduled_time,estimated_time,actual_time,gate,terminal,belt,status,aircraft_type,registration",and:"(departure_date.gte."+start+",departure_date.lte."+finish+")",or:"(origin.eq."+code+",destination.eq."+code+")",order:"departure_date.asc,scheduled_time.asc",limit:"500"}}),
    restRequest({table:"inventory_schedule_lines",method:"GET",query:{select:"id,flight_number,days_of_operation,board_point,off_point,via_point,std,sta,equipment_type,effective_date,discontinue_date,status",and:"(effective_date.lte."+finish+",or(discontinue_date.is.null,discontinue_date.gte."+start+"))",or:"(board_point.eq."+code+",off_point.eq."+code+")",order:"flight_number.asc",limit:"500"}})
  ]);
  const out=rowsOf(fids).map(row=>normalizeFlight(row)).filter(f=>f.departureDate>=start&&f.departureDate<=finish);
  const seen=new Set(out.map(f=>[f.flightNumber,f.departureDate,f.origin,f.destination].join("|")));
  for (const row of rowsOf(schedule)) {
    const state=upper(row.status,40);
    if (["CANCELLED","CANCELED","INACTIVE","CLOSED","DELETED","EXPIRED"].includes(state)) continue;
    for (const date of dateList(start,finish)) {
      if ((row.effective_date&&row.effective_date>date)||(row.discontinue_date&&row.discontinue_date<date)||!operatesOn(row,date)) continue;
      const flight=normalizeFlight({...row,departure_date:date},"Published ALTEA schedule");
      const key=[flight.flightNumber,flight.departureDate,flight.origin,flight.destination].join("|");
      if (!seen.has(key)) { seen.add(key); out.push(flight); }
    }
  }
  return out.filter(f=>!token||flightToken([f.flightNumber,f.origin,f.destination,f.viaPoint].join(" ")).includes(token)).slice(0,100);
}
async function clockRows(context) {
  const out=[];
  for (const column of ["employee_id","employee_ref"]) for (const identifier of context.identifiers) {
    const result=await restRequest({table:"roster_clock_events",method:"GET",query:{select:"id,employee_id,employee_ref,event_type,event_at,event_time,location,status,payload,created_at",[column]:"eq."+identifier,order:"event_at.desc",limit:"100"}});
    for (const row of rowsOf(result)) if (owns(row,context.identifiers)) out.push(row);
  }
  const seen=new Set();
  return out.filter(row=>row.id&&!seen.has(String(row.id))&&seen.add(String(row.id))).slice(0,100).map(row=>({id:clean(row.id,160),eventType:upper(row.event_type||"",30),eventAt:clean(row.event_at||row.event_time||row.created_at,80),location:clean(row.location||"",160),status:clean(row.status||"",60),payload:obj(row.payload)}));
}
export async function getEosBootstrapCore(input={}) {
  const context=await authorizedSession();
  const from=validDate(input.from)?input.from:new Date().toISOString().slice(0,10);
  const to=validDate(input.to)?input.to:new Date(Date.now()+2*86400000).toISOString().slice(0,10);
  const tables=Object.keys(OWNED_TABLES);
  const code=stationCode(context);
  const [sets,clockEvents,flights,stationResult]=await Promise.all([
    Promise.all(tables.map(table=>queryOwned(table,context))),clockRows(context),flightsForStation(context,{from,to}),
    code?restRequest({table:"travel_info_airports",method:"GET",query:{select:"ID,iata,icao,title,locationCity,country,timezone,summary",iata:"eq."+code,altea_visible:"eq.true",limit:"1"}}):Promise.resolve([])
  ]);
  const assignments=sets.flatMap((rows,index)=>rows.map(row=>normalizeAssignment(row,tables[index]))).sort((a,b)=>(Date.parse(a.startAt)||0)-(Date.parse(b.startAt)||0));
  const stationRow=rowsOf(stationResult)[0]||{};
  const station=code?{code,name:clean(stationRow.title||stationRow.name||stationRow.airport_name||stationRow.locationCity||context.profile.baseName||context.profile.station||code,180),city:clean(stationRow.locationCity||stationRow.city||"",120),country:clean(stationRow.country||stationRow.country_name||"",100),timezone:clean(stationRow.timezone||"",80),summary:clean(stationRow.summary||"",400)}:null;
  return {ok:true,profile:publicProfile(context),base:{code:clean(context.profile.baseCode||"",80),name:clean(context.profile.baseName||context.profile.station||context.profile.base||"",160),airportIata:code,destinationCode:code},station,stations:station?[station]:[],assignments,clockEvents,flights,requests:[],syncedAt:new Date().toISOString()};
}
export async function searchEosFlightsCore(input={}) {
  const context=await authorizedSession();
  const query=clean(input.query,80);
  if (flightToken(query).length<2) fail("EOS_FLIGHT_SEARCH_TERM_REQUIRED");
  const from=validDate(input.from)?input.from:new Date().toISOString().slice(0,10);
  const to=validDate(input.to)?input.to:new Date(Date.now()+13*86400000).toISOString().slice(0,10);
  return {ok:true,flights:await flightsForStation(context,{from,to,query}),from,to};
}
export async function searchEosStationsCore(input={}) {
  await authorizedSession();
  const query=clean(input.query,60).toUpperCase().replace(/[^A-Z0-9 ]/g," ").trim().replace(/\s+/g," ");
  if (query.length<2) fail("EOS_STATION_SEARCH_TERM_REQUIRED");
  const result=await restRequest({table:"travel_info_airports",method:"GET",query:{
    select:"ID,iata,icao,title,locationCity,country,timezone,summary",
    active:"eq.true",altea_visible:"eq.true",or:`(iata.ilike.*${query}*,icao.ilike.*${query}*,title.ilike.*${query}*,locationCity.ilike.*${query}*)`,
    order:"sortOrder.asc,title.asc",limit:"30"
  }});
  return {ok:true,stations:rowsOf(result).map(row=>({
    id:clean(row.ID||row.id,100),code:upper(row.iata||row.icao,8),iata:upper(row.iata,8),icao:upper(row.icao,8),
    name:clean(row.title||row.name||row.airport_name||row.iata,180),city:clean(row.locationCity||row.city,120),
    country:clean(row.country||row.country_name,100),timezone:clean(row.timezone,80),summary:clean(row.summary,400)
  })).filter(row=>row.code)};
}
export async function createEosClockEventCore(input={}) {
  const context=await authorizedSession();
  const eventType=upper(input.eventType,24),assignmentId=clean(input.assignmentId,160),sourceTable=clean(input.sourceTable,80);
  if (!(["CLOCK_IN","CLOCK_OUT"].includes(eventType)) || !assignmentId || !OWNED_TABLES[sourceTable]) fail("EOS_CLOCK_EVENT_INVALID");
  const rows=await queryOwned(sourceTable,context);
  const assignment=rows.find(row=>String(row.id)===assignmentId);
  if (!assignment) fail("EOS_ASSIGNMENT_NOT_FOUND");
  const at=new Date().toISOString(),location=clean(assignment.location||context.profile.baseName||context.profile.station||"",160);
  const response=await restRequest({table:"roster_clock_events",method:"POST",body:{employee_id:context.staffId||context.employeeId,employee_ref:context.staffId||null,event_type:eventType,event_at:at,event_time:at,location,status:"RECORDED",payload:{requestType:"ATTENDANCE_EVENT",eventType,assignmentId,sourceTable,assignmentLabel:clean(assignment.assignment||assignment.assignment_type||"Operational duty",180),actorStaffId:context.staffId},created_at:at},prefer:"return=representation"});
  return {ok:true,eventId:clean(rowsOf(response)[0]?.id||"",160),eventType,eventAt:at};
}
export async function submitEosOpsActionCore(input={}) {
  const context=await authorizedSession();
  const action=upper(input.action,40),summary=clean(input.summary,400),assignmentId=clean(input.assignmentId,160),sourceTable=clean(input.sourceTable,80);
  if (!ACTIONS.has(action) || summary.length<4) fail("EOS_ACTION_INVALID");
  let assignment=null;
  if (assignmentId||sourceTable) {
    if (!assignmentId||!OWNED_TABLES[sourceTable]) fail("EOS_ASSIGNMENT_NOT_FOUND");
    assignment=(await queryOwned(sourceTable,context)).find(row=>String(row.id)===assignmentId)||null;
    if (!assignment) fail("EOS_ASSIGNMENT_NOT_FOUND");
  }
  const at=new Date().toISOString();
  const payload={requestType:"EOS_ACTION",action,summary,staffId:context.staffId||context.employeeId,baseCode:clean(context.profile.baseCode||context.profile.destinationCode||"",80),assignmentId:assignment?clean(assignment.id,160):"",sourceTable:assignment?sourceTable:"",flightNumber:clean(input.flightNumber||"",40),route:clean(input.route||"",80),stationCode:upper(input.stationCode,8)};
  const response=await restRequest({table:"schedule_change_requests",method:"POST",body:{employee_id:context.staffId||context.employeeId,route_id:assignment?.route_id||null,booking_reference:assignment?.booking_reference||null,start_time:assignment?.start_at||assignment?.start_time||null,end_time:assignment?.end_at||assignment?.end_time||null,status:"PENDING",notes:summary,payload,created_at:at,updated_at:at},prefer:"return=representation"});
  return {ok:true,requestId:clean(rowsOf(response)[0]?.id||"",160),status:"PENDING",message:"Sent to OPS Control for review."};
}

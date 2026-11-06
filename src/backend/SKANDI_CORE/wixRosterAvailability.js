// Server-only reconciliation. The roster supplies working windows; Wix still
// applies service assignment, location, existing appointments and booking rules.
import { createHash } from "crypto";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { rosterAssignmentTimes } from "backend/SKANDI_CORE/rosterAssignments";

const getSecretValue = elevate(secrets.getSecretValue);
const DAY = 86400000;
const HORIZON = 330;
const EVENT_TITLE = "SKANDI roster availability";
const GUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const ACTIVE = new Set(["ACTIVE", "CONFIRMED", "ON-TIME", "PUBLISHED", "SCHEDULED"]);
const endpoint = {
  staff:"/bookings/staff/v2/staff-members/query",
  events:"/calendar/v3/events",
  schedules:"/calendar/v3/schedules"
};

async function readSecret(name) {
  const value = await getSecretValue(name);
  return String(value?.value ?? value?.secretValue ?? value?.secret?.value ?? value ?? "").trim();
}

function wixClient(siteId, key) {
  return async (path, body) => {
    const options = {
      method:body === undefined ? "GET" : "POST",
      headers:{ Authorization:key, "wix-site-id":siteId, "Content-Type":"application/json" }
    };
    if (body !== undefined) options.body = JSON.stringify(body);
    const response = await fetch("https://www.wixapis.com" + path, options);
    if (!response.ok) throw new Error("WIX_ROSTER_REQUEST_FAILED_" + response.status);
    return response.json();
  };
}

async function queryAll(wix, path, key, payload) {
  const rows = [];
  let cursor;
  for (let page = 0; page < 20; page++) {
    const query = { ...payload.query, cursorPaging:{ limit:100, ...(cursor ? {cursor} : {}) } };
    const result = await wix(path, { ...payload, query });
    if (!Array.isArray(result[key])) throw new Error("WIX_ROSTER_INVALID_RESPONSE");
    rows.push(...result[key]);
    if (!result.pagingMetadata?.hasNext) return rows;
    const next = result.pagingMetadata?.cursors?.next;
    if (!next || next === cursor) throw new Error("WIX_ROSTER_INVALID_CURSOR");
    cursor = next;
  }
  throw new Error("WIX_ROSTER_TOO_MANY_RESULTS");
}

function localDates(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone, year:"numeric", month:"2-digit", day:"2-digit",
    hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
  });
  return time => {
    const parts = Object.fromEntries(formatter.formatToParts(time).map(({type,value})=>[type,value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  };
}

function idempotencyKey(...parts) {
  const hash = createHash("sha256").update(parts.join("|")).digest("hex");
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

function eligibleWindows(shifts, types, now, horizon, local) {
  const windows = [];
  for (const row of shifts) {
    const p = row.payload || {};
    const state = String(row.status || p.status || "").trim().toUpperCase();
    const type = String(p.activityType || row.assignment_type || p.assignmentType || p.type || "").trim().toLowerCase();
    if (!ACTIVE.has(state) || !types.has(type)) continue;
    const { start, end } = rosterAssignmentTimes(row, p);
    const from = Date.parse(start), to = Date.parse(end);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw new Error("WIX_ROSTER_INVALID_SHIFT");
    if (to <= now || from >= horizon) continue;
    windows.push({ from, to, versions:[String(row.id||"")+":"+String(row.updated_at||"")] });
  }
  windows.sort((a,b)=>a.from-b.from||a.to-b.to);
  const merged = [];
  for (const window of windows) {
    const previous = merged.at(-1);
    if (previous && previous.to >= window.from) {
      previous.to = Math.max(previous.to, window.to);
      previous.versions.push(...window.versions);
    } else merged.push(window);
  }
  return merged.map(({from,to,versions})=>{
    const start=local(from), end=local(to);
    if(end<=start)throw new Error("WIX_ROSTER_AMBIGUOUS_LOCAL_TIME");
    return {start,end,versions:versions.sort()};
  });
}

async function rosterFor(employeeId) {
  const agents = await restRequest({ table:"agent_users", query:{ select:"id,sk_id,agent_id,active", id:"eq."+employeeId, limit:2 } });
  const employee = agents?.[0];
  if (!employee || !Array.isArray(agents) || agents.length !== 1) throw new Error("WIX_ROSTER_EMPLOYEE_UNVERIFIED");
  if (employee.active !== true) return [];
  const identifiers = [...new Set([employee.id, employee.sk_id, employee.agent_id].filter(Boolean))];
  if (identifiers.some(id=>!/^[a-z0-9_-]+$/i.test(id))) throw new Error("WIX_ROSTER_EMPLOYEE_ID_INVALID");
  const set = identifiers.join(",");
  const rows = await restRequest({ table:"roster_shifts", query:{
    select:"id,employee_id,employee_ref,start_at,end_at,start_time,end_time,assignment_type,status,payload,updated_at",
    or:`(employee_id.in.(${set}),employee_ref.in.(${set}))`,
    and:`(or(end_at.gte.${new Date(Date.now()-DAY).toISOString()},end_time.gte.${new Date(Date.now()-DAY).toISOString()},and(end_at.is.null,end_time.is.null)))`,
    limit:1000
  }});
  if (!Array.isArray(rows) || rows.length >= 1000) throw new Error("WIX_ROSTER_SOURCE_INCOMPLETE");
  return rows;
}

async function syncProvider(wix, staff, mapping, now) {
  if (!staff?.serviceProvider || !staff.resource?.eventsSchedule?.id || !staff.resourceId) throw new Error("WIX_ROSTER_PROVIDER_UNVERIFIED");
  const scheduleId = staff.resource.eventsSchedule.id;
  const ownHours = (staff.resource.workingHoursSchedules || []).some(schedule=>schedule.id===scheduleId);
  const schedule = (await wix(endpoint.schedules + "/" + scheduleId)).schedule;
  const timeZone=schedule?.timeZone||mapping.timeZone;
  if(!timeZone)throw new Error("WIX_ROSTER_TIMEZONE_REQUIRED");
  if(!ownHours&&staff.resource.usesDefaultWorkingHours!==true)throw new Error("WIX_ROSTER_OTHER_SCHEDULE");
  const local=localDates(timeZone);
  const horizon = now + HORIZON*DAY;
  const types = new Set(mapping.assignmentTypes.map(type=>String(type).toLowerCase().trim()));
  const desired = eligibleWindows(await rosterFor(mapping.employeeId), types, now, horizon, local);
  const existing = await queryAll(wix, endpoint.events+"/query", "events", {
    fromLocalDate:local(now-DAY), toLocalDate:local(horizon+DAY),
    query:{ filter:{ externalScheduleId:{ $eq:staff.resourceId }, type:{ $eq:"WORKING_HOURS" } } }
  });
  const active = existing.filter(event=>!["CANCELLED","CANCELED"].includes(event.status));
  const managed = active.filter(event=>event.scheduleId===scheduleId&&event.title===EVENT_TITLE);
  if (active.some(event=>!managed.includes(event))) throw new Error("WIX_ROSTER_UNMANAGED_WORKING_HOURS");
  if (!ownHours && !desired.length) return { deferred:true, created:0, cancelled:0 };

  const key = (start,end) => start + "/" + end;
  const desiredKeys = new Set(desired.map(window=>key(window.start,window.end)));
  const kept = new Set();
  let cancelled = 0, created = 0;
  for (const event of managed) {
    const slot = key(event.start?.localDate,event.end?.localDate);
    if (desiredKeys.has(slot) && !kept.has(slot)) { kept.add(slot); continue; }
    if (event.end?.localDate <= local(now)) continue;
    await wix(endpoint.events + "/" + encodeURIComponent(event.id) + "/cancel", {});
    cancelled++;
  }
  for (const window of desired) {
    const slot = key(window.start,window.end);
    if (kept.has(slot)) continue;
    const cancelledVersions = existing.filter(event=>event.title===EVENT_TITLE&&key(event.start?.localDate,event.end?.localDate)===slot)
      .map(event=>event.id).sort();
    const result = await wix(endpoint.events, {
      event:{ scheduleId, type:"WORKING_HOURS", title:EVENT_TITLE, transparency:"TRANSPARENT",
        start:{localDate:window.start}, end:{localDate:window.end} },
      idempotencyKey:idempotencyKey(scheduleId,slot,...window.versions,...cancelledVersions)
    });
    if (!result?.event?.id || ["CANCELLED","CANCELED"].includes(result.event.status)) throw new Error("WIX_ROSTER_EVENT_UNCONFIRMED");
    created++;
  }
  if (!ownHours) {
    await wix("/bookings/v1/staff-members/" + staff.id + "/assign-working-hours-schedule", { scheduleId });
  }
  return { deferred:false, created, cancelled };
}

export async function syncWixRosterAvailability() {
  let config;
  let rawConfig;
  try { rawConfig=await readSecret("SKANDI_WIX_ROSTER_SYNC"); }
  catch (_) { return { configured:false }; }
  if(!rawConfig)return { configured:false };
  try { config=JSON.parse(rawConfig); }
  catch (_) { throw new Error("WIX_ROSTER_CONFIG_INVALID"); }
  if (config?.enabled !== true) return { configured:false };
  const providers = config.providers;
  if (!GUID.test(config.siteId || "") || !Array.isArray(providers) || !providers.length ||
      providers.some(p=>!GUID.test(p?.employeeId||"")||!GUID.test(p?.staffMemberId||"")||
        !Array.isArray(p?.assignmentTypes)||!p.assignmentTypes.length||p.assignmentTypes.some(t=>typeof t!=="string"||!t.trim())) ||
      new Set(providers.map(p=>p.staffMemberId.toLowerCase())).size !== providers.length)
    throw new Error("WIX_ROSTER_CONFIG_INVALID");

  const key = await readSecret("SKANDI_WIX_ROSTER_API_KEY");
  if (!key) throw new Error("WIX_ROSTER_API_KEY_REQUIRED");
  const wix = wixClient(config.siteId, key);
  const staff = await queryAll(wix, endpoint.staff, "staffMembers", { fields:["RESOURCE_DETAILS"] });
  const now = Date.now();
  const totals = { configured:true, created:0, cancelled:0, deferred:0, failed:0 };
  for (const mapping of providers) {
    try {
      const result = await syncProvider(wix, staff.find(item=>item.id===mapping.staffMemberId), mapping, now);
      totals.created += result.created;
      totals.cancelled += result.cancelled;
      if (result.deferred) totals.deferred++;
    } catch (error) {
      totals.failed++;
      const code = String(error?.message||"");
      console.warn("[Wix roster]", /^WIX_ROSTER_[A-Z0-9_]+$/.test(code)?code:"WIX_ROSTER_SYNC_FAILED");
    }
  }
  console.info("[Wix roster] Reconciliation", totals);
  if (totals.failed) throw new Error("WIX_ROSTER_RECONCILIATION_INCOMPLETE");
  return totals;
}

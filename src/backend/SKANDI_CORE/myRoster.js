// Destination staff self-service for SKANDI MyRoster.
// Each read/write is scoped to the authenticated staff identity from staffAuth.
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const ASSIGNMENT_TABLES = Object.freeze([
  "roster_shifts",
  "driver_assignments",
  "tour_assignments",
  "airport_duty_assignments",
  "vehicle_assignments"
]);
const OWNER_COLUMNS = Object.freeze({
  roster_shifts: ["employee_id", "employee_ref"],
  roster_clock_events: ["employee_id", "employee_ref"],
  roster_time_ledger: ["employee_id"],
  schedule_change_requests: ["employee_id"],
  time_off_balances: ["employee_id"],
  driver_assignments: ["employee_id"],
  tour_assignments: ["employee_id"],
  airport_duty_assignments: ["employee_id"],
  vehicle_assignments: ["employee_id"]
});
const ASSIGNMENT_SELECT = Object.freeze({
  roster_shifts: "id,employee_id,employee_ref,start_at,end_at,start_time,end_time,location,assignment_type,status,payload,route_id,booking_reference,notes,created_at,updated_at",
  driver_assignments: "id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at",
  tour_assignments: "id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at",
  airport_duty_assignments: "id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at",
  vehicle_assignments: "id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at"
});
const MAX_ROWS = "500";

function clean(value, max = 500) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
function arr(value) {
  return Array.isArray(value) ? value.map(v => clean(typeof v === "string" ? v : (v && (v.id || v.key || v.permission || v.name)) || "", 120)).filter(Boolean) : [];
}
function obj(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; }
    catch (_) { return {}; }
  }
  return {};
}
function unique(values) {
  return [...new Set(values.map(v => clean(v, 160)).filter(Boolean))];
}
function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}
function identityFrom(session) {
  const profile = session && (session.profile || session.agent) || {};
  const employeeId = clean(profile.agentUserUuid || profile.agentUserId || profile.id || session.agentUserUuid || session.agentUserId || "", 160);
  const staffRef = clean(profile.agentId || profile.skId || session.agentId || session.skId || "", 160);
  const identifiers = unique([employeeId, staffRef]);
  if (!identifiers.length) fail("MYROSTER_STAFF_ID_REQUIRED");
  return { profile, employeeId: employeeId || staffRef, identifiers, staffRef };
}
async function destinationContext(session) {
  const identity = identityFrom(session);
  const p = identity.profile;
  const groups = arr(session.permissionGroups || p.permissionGroups);
  let roleRecord = null;
  for (const [column, roleCode] of [["role_id", p.roleId], ["job_code", p.jobCode]]) {
    const value = clean(roleCode, 80).replace(/[^A-Za-z0-9_-]/g, "");
    if (!value) continue;
    const result = await restRequest({
      table: "org_job_roles",
      method: "GET",
      query: { select: "role_id,job_code,title,work_model,location_scope,department_code,active", [column]: "eq." + value, active: "eq.true", limit: "3" }
    });
    roleRecord = rowsOf(result).find(row => row && row.active === true) || null;
    if (roleRecord) break;
  }
  let baseRecord = null;
  const baseProbes = [
    ["code", p.baseCode || p.base],
    ["destination_code", p.destinationCode],
    ["airport_iata", p.destinationCode || p.station],
    ["name", p.baseName || p.base],
    ["city", p.city || p.station]
  ];
  for (const [column, rawValue] of baseProbes) {
    const candidate = clean(rawValue, 120).replace(/[^A-Za-z0-9 _-]/g, "");
    if (!candidate) continue;
    const result = await restRequest({
      table: "org_bases",
      method: "GET",
      query: { select: "code,name,city,country_code,base_type,destination_code,airport_iata,timezone,active", [column]: "eq." + candidate, active: "eq.true", limit: "5" }
    });
    const found = rowsOf(result).find(row => row && row.active === true && ["Operating market", "Special field team"].includes(clean(row.base_type, 80)));
    if (found) { baseRecord = found; break; }
  }
  const roleParts = [
    session.accessRole, session.role, p.accessRole, p.role, p.jobTitle, p.position,
    p.jobCode, p.departmentCode, p.department,
    roleRecord && roleRecord.title, roleRecord && roleRecord.work_model,
    roleRecord && roleRecord.location_scope, roleRecord && roleRecord.department_code, ...groups
  ].map(v => clean(v, 120).toUpperCase().replace(/[_-]+/g, " "));
  const roleText = roleParts.join(" | ");
  const modelText = clean((roleRecord && roleRecord.work_model || "") + " " + (roleRecord && roleRecord.location_scope || ""), 240).toUpperCase();
  const excluded = /(^|[^A-Z])(OCC|HQ|HEAD OFFICE|HEADQUARTERS|OPERATIONS CENTER|OPERATIONS CENTRE|OPERATIONS CONTROL|CONTROL CENTER|CONTROL CENTRE|OPS CENTER|OPS CENTRE|DISPATCH|AIRLINE CREW|CABIN CREW|FLIGHT CREW|PILOT|CORPORATE|SUPER ADMIN|DUAL HEADQUARTERS)(?=$|[^A-Z])/.test(roleText + " " + modelText);
  const roleMetadataFieldBased = !!roleRecord && /FIELD|DESTINATION/.test(modelText);
  const roleTextFieldBased = /(^|[^A-Z])(DESTINATION|AIRPORT|STATION|GROUND|TRANSFER|DRIVER|TOUR|GUIDE|RESORT|REPRESENTATIVE|LOCAL|EXCURSION|GUEST SERVICES|HOLIDAY REP)(?=$|[^A-Z])/.test(roleText);
  const destinationRole = roleRecord ? roleMetadataFieldBased : roleTextFieldBased;
  if (session.isSystemAdmin === true || session.isHr === true || session.isPayrollAdmin === true || excluded || !destinationRole) {
    fail("MYROSTER_DESTINATION_ACCESS_REQUIRED");
  }
  // org_job_roles and org_bases may be unseeded while the authenticated staff
  // profile already carries the canonical role and base assignment.
  if (!baseRecord) {
    const code = clean(p.baseCode || p.destinationCode || p.station || p.base, 80).replace(/[^A-Za-z0-9_-]/g, "");
    if (code) {
      baseRecord = {
        code,
        name: clean(p.baseName || p.station || p.base || code, 180),
        city: clean(p.city || p.station || p.base || "", 120),
        country_code: clean(p.countryCode || "", 8),
        destination_code: clean(p.destinationCode || "", 8),
        airport_iata: clean(p.airportIata || p.destinationCode || "", 8),
        timezone: clean(p.timezone || p.timeZone || "", 80),
        base_type: "Authenticated staff profile"
      };
    }
  }
  if (!baseRecord) fail("MYROSTER_DESTINATION_BASE_REQUIRED");
  return {
    ...identity, session, profile: p, groups,
    role: clean(p.jobTitle || p.position || roleRecord && roleRecord.title || session.accessRole || p.accessRole || "Destination staff", 180),
    base: {
      code: clean(baseRecord.code, 80), name: clean(baseRecord.name, 180), city: clean(baseRecord.city, 120),
      countryCode: clean(baseRecord.country_code, 8), destinationCode: clean(baseRecord.destination_code, 8),
      airportIata: clean(baseRecord.airport_iata, 8), timezone: clean(baseRecord.timezone, 80), baseType: clean(baseRecord.base_type, 80)
    }
  };
}
function rowsOf(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result && result.data)) return result.data;
  return [];
}
function owns(row, ids) {
  const owner = [row && row.employee_id, row && row.employee_ref].map(v => clean(v, 160).toLowerCase());
  const allowed = new Set(ids.map(v => v.toLowerCase()));
  return owner.some(v => v && allowed.has(v));
}
async function queryOwned(table, select, options = {}) {
  const ids = options.ids || [];
  const columns = OWNER_COLUMNS[table];
  if (!columns) return [];
  const collected = [];
  for (const column of columns) {
    for (const identifier of ids) {
      const query = { select, limit: options.limit || MAX_ROWS };
      query[column] = "eq." + identifier;
      if (options.order) query.order = options.order;
      const result = await restRequest({ table, method: "GET", query });
      for (const row of rowsOf(result)) {
        if (owns(row, ids)) collected.push(row);
      }
    }
  }
  const seen = new Set();
  return collected.filter(row => {
    const key = table + ":" + clean(row.id, 160);
    if (!row.id || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function assignmentTime(row, payload) {
  return row.start_at || row.start_time || payload.start_at || payload.startAt || payload.start_time || "";
}
function assignmentEnd(row, payload) {
  return row.end_at || row.end_time || payload.end_at || payload.endAt || payload.end_time || "";
}
function normalizeAssignment(row, table) {
  const payload = obj(row.payload);
  const startAt = clean(assignmentTime(row, payload), 100);
  const endAt = clean(assignmentEnd(row, payload), 100);
  return {
    id: clean(row.id, 160),
    sourceTable: table,
    startAt,
    endAt,
    status: clean(row.status || payload.status || "SCHEDULED", 60),
    location: clean(row.location || row.base_code || payload.location || payload.baseCode || "", 180),
    baseCode: clean(row.base_code || payload.baseCode || "", 120),
    label: clean(payload.title || payload.label || payload.assignmentName || row.assignment_type || "", 160),
    assignmentType: clean(row.assignment_type || payload.assignmentType || payload.type || "", 120),
    details: clean(payload.details || payload.description || row.notes || "", 400),
    notes: clean(row.notes || payload.notes || "", 400),
    routeId: clean(row.route_id || payload.routeId || "", 160),
    reference: clean(row.booking_reference || payload.bookingReference || "", 100),
    timeZone: clean(payload.timeZone || payload.time_zone || "", 80),
    flightNumber: clean(row.flight_number || payload.flightNumber || payload.flight_number || "", 40),
    origin: clean(row.origin || payload.origin || payload.originCode || "", 8),
    destination: clean(row.destination || payload.destination || payload.destinationCode || "", 8),
    aircraftType: clean(row.aircraft_type || payload.aircraftType || payload.equipmentType || "", 80),
    registration: clean(row.registration || payload.registration || "", 40)
  };
}
function normalizedClock(row) {
  const payload = obj(row.payload);
  return {
    id: clean(row.id, 160),
    eventType: clean(row.event_type || payload.eventType || payload.type || "", 60),
    eventAt: clean(row.event_at || row.event_time || payload.eventAt || "", 100),
    status: clean(row.status || payload.status || "RECORDED", 60),
    location: clean(row.location || payload.location || "", 180),
    assignmentLabel: clean(payload.assignmentLabel || payload.assignment_label || "", 180),
    timeZone: clean(payload.timeZone || payload.time_zone || "", 80)
  };
}
function normalizedRequest(row) {
  const payload = obj(row.payload);
  const requestType = clean(payload.requestType || payload.type || row.request_type || "SCHEDULE_CHANGE", 80);
  return {
    id: clean(row.id, 160),
    requestType,
    summary: clean(payload.summary || payload.notes || row.notes || "Request submitted for review", 400),
    status: clean(row.status || "PENDING", 60),
    createdAt: clean(row.created_at || "", 100),
    updatedAt: clean(row.updated_at || row.created_at || "", 100)
  };
}
function validDate(value) {
  const text = clean(value, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(text + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text;
}
function rangeAssignments(rows, from, to) {
  const start = validDate(from) ? from : "";
  const end = validDate(to) ? to : "";
  return rows.filter(row => {
    const date = clean(row.startAt, 100).slice(0, 10);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}
function rangeRows(rows, dateField, fromDate) {
  return rows.filter(row => !fromDate || clean(row[dateField], 40).slice(0, 10) >= fromDate);
}
function totalHours(rows) {
  return rows.reduce((total, row) => {
    const state = clean(row.status || "", 40).toUpperCase();
    if (["CANCELLED", "CANCELED", "REJECTED", "DECLINED", "VOID"].includes(state)) return total;
    const hours = Number(row.hours);
    return total + (Number.isFinite(hours) && hours > 0 ? hours : 0);
  }, 0);
}
async function allAssignments(ctx) {
  const sets = await Promise.all(ASSIGNMENT_TABLES.map(table => queryOwned(table, ASSIGNMENT_SELECT[table], { ids: ctx.identifiers })));
  return sets.flatMap((rows, index) => rows.map(row => {
    const assignment = normalizeAssignment(row, ASSIGNMENT_TABLES[index]);
    assignment.timeZone = assignment.timeZone || ctx.base.timezone;
    assignment.location = assignment.location || ctx.base.name || ctx.base.code;
    assignment.baseCode = assignment.baseCode || ctx.base.code;
    return assignment;
  }))
    .sort((a, b) => (Date.parse(a.startAt) || 0) - (Date.parse(b.startAt) || 0));
}
function publicProfile(ctx) {
  const p = ctx.profile;
  return {
    id: ctx.employeeId,
    agentId: clean(p.agentId || p.skId || ctx.staffRef, 160),
    skId: clean(p.agentId || p.skId || ctx.staffRef, 160),
    agentUserUuid: ctx.employeeId,
    agentUserId: ctx.employeeId,
    firstName: clean(p.firstName || p.first_name || "", 100),
    lastName: clean(p.lastName || p.last_name || "", 100),
    preferredName: clean(p.preferredName || p.preferred_name || "", 100),
    displayName: clean(p.displayName || p.fullName || p.preferredName || "SKANDI staff", 180),
    fullName: clean(p.fullName || p.displayName || p.preferredName || "SKANDI staff", 180),
    email: clean(p.corporateEmailAddress || p.corporate_email_address || p.email || "", 200),
    corporateEmailAddress: clean(p.corporateEmailAddress || p.corporate_email_address || p.email || "", 200),
    badgePhotoUrl: clean(p.badgePhotoUrl || p.badge_photo_url || "", 1200),
    jobTitle: ctx.role,
    position: clean(p.position || ctx.role, 180),
    accessRole: clean(p.accessRole || ctx.session.accessRole || "", 120),
    baseCode: ctx.base.code,
    baseName: ctx.base.name,
    destinationCode: ctx.base.destinationCode || ctx.base.airportIata || clean(p.destinationCode || "", 120),
    base: ctx.base.name || ctx.base.code,
    station: ctx.base.city || ctx.base.name || ctx.base.code,
    countryCode: ctx.base.countryCode || clean(p.countryCode || "", 8)
  };
}
export async function getMyRosterBootstrapCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const ctx = await destinationContext(session);
  const from = validDate(input.from) ? clean(input.from, 20) : new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const to = validDate(input.to) ? clean(input.to, 20) : new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const [assignments, clockRows, requests, balanceRows, ledgerRows] = await Promise.all([
    allAssignments(ctx),
    queryOwned("roster_clock_events", "id,employee_id,employee_ref,event_type,event_at,event_time,location,status,payload,created_at", { ids: ctx.identifiers, order: "event_at.desc", limit: MAX_ROWS }),
    queryOwned("schedule_change_requests", "id,employee_id,route_id,booking_reference,start_time,end_time,status,notes,payload,created_at,updated_at", { ids: ctx.identifiers, order: "created_at.desc", limit: MAX_ROWS }),
    queryOwned("time_off_balances", "id,employee_id,type,balance_hours,year,payload,created_at,updated_at", { ids: ctx.identifiers, limit: MAX_ROWS }),
    queryOwned("roster_time_ledger", "id,employee_id,work_date,hours,type,status,payload,created_at", { ids: ctx.identifiers, limit: MAX_ROWS })
  ]);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  return {
    ok: true,
    profile: publicProfile(ctx),
    base: ctx.base,
    role: ctx.role,
    apps: Array.isArray(session.apps) ? session.apps : [],
    assignments: rangeAssignments(assignments, from, to),
    clockEvents: clockRows.map(normalizedClock).sort((a, b) => (Date.parse(b.eventAt) || 0) - (Date.parse(a.eventAt) || 0)),
    requests: requests.map(normalizedRequest).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)),
    timeOffBalances: balanceRows.map(row => {
      const payload = obj(row.payload);
      return { type: clean(row.type || payload.type || "Time off", 80), balanceHours: row.balance_hours == null ? "" : Number(row.balance_hours), unit: clean(payload.unit || "hrs", 20), year: clean(row.year || payload.year || "", 10) };
    }),
    hoursLast30Days: totalHours(rangeRows(ledgerRows, "work_date", thirtyDaysAgo)),
    dateRange: { from, to },
    syncedAt: new Date().toISOString()
  };
}
export async function createTimeClockEventCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const ctx = await destinationContext(session);
  const eventType = clean(input.eventType, 30).toUpperCase();
  if (!["CLOCK_IN", "CLOCK_OUT"].includes(eventType)) fail("MYROSTER_CLOCK_EVENT_INVALID");
  const assignmentId = clean(input.assignmentId, 160);
  const sourceTable = clean(input.sourceTable, 80);
  if (!assignmentId || !ASSIGNMENT_TABLES.includes(sourceTable)) fail("MYROSTER_ASSIGNMENT_NOT_FOUND");
  const assignments = await allAssignments(ctx);
  const assignment = assignments.find(row => row.id === assignmentId && row.sourceTable === sourceTable);
  if (!assignment) fail("MYROSTER_ASSIGNMENT_NOT_FOUND");
  const now = new Date().toISOString();
  const payload = {
    requestType: "ATTENDANCE_EVENT",
    eventType,
    assignmentId: assignment.id,
    sourceTable: assignment.sourceTable,
    assignmentLabel: assignment.label || assignment.assignmentType || "Destination assignment",
    location: assignment.location || ctx.base.name || ctx.base.code,
    timeZone: assignment.timeZone || "",
    actorStaffId: ctx.staffRef
  };
  const result = await restRequest({
    table: "roster_clock_events",
    method: "POST",
    body: {
      employee_id: ctx.staffRef || ctx.employeeId,
      employee_ref: ctx.staffRef || null,
      event_type: eventType,
      event_at: now,
      event_time: now,
      location: assignment.location || ctx.base.name || ctx.base.code,
      status: "RECORDED",
      payload,
      created_at: now
    }
  });
  const saved = rowsOf(result)[0] || {};
  return { ok: true, requestId: clean(input.requestId, 120), eventId: clean(saved.id || "", 160), eventType, eventAt: now };
}
async function createScheduleRequest(ctx, fields) {
  const now = new Date().toISOString();
  const payload = { ...fields.payload, baseCode: ctx.base.code, destinationCode: ctx.base.destinationCode, staffId: ctx.staffRef || ctx.employeeId };
  const result = await restRequest({
    table: "schedule_change_requests",
    method: "POST",
    body: {
      employee_id: ctx.staffRef || ctx.employeeId,
      route_id: fields.routeId || null,
      booking_reference: fields.bookingReference || null,
      start_time: fields.startTime || null,
      end_time: fields.endTime || null,
      status: "PENDING",
      notes: fields.notes,
      payload,
      created_at: now,
      updated_at: now
    }
  });
  const saved = rowsOf(result)[0] || {};
  return { ok: true, requestId: clean(fields.requestId, 120), recordId: clean(saved.id || "", 160), status: clean(saved.status || "PENDING", 60) };
}
export async function requestTimeOffCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const ctx = await destinationContext(session);
  const startDate = clean(input.startDate, 20);
  const endDate = clean(input.endDate, 20);
  const notes = clean(input.notes, 400);
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) fail("MYROSTER_TIMEOFF_DATES_INVALID");
  const span = (Date.parse(endDate + "T00:00:00Z") - Date.parse(startDate + "T00:00:00Z")) / 86400000;
  if (span > 92) fail("MYROSTER_TIMEOFF_DATES_INVALID");
  return createScheduleRequest(ctx, {
    requestId: input.requestId,
    notes: notes || "Time-off request",
    startTime: startDate + "T00:00:00.000Z",
    endTime: endDate + "T23:59:59.999Z",
    payload: { requestType: "TIME_OFF", startDate, endDate, notes, summary: "Time off: " + startDate + " to " + endDate }
  });
}
export async function requestShiftChangeCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const ctx = await destinationContext(session);
  const reason = clean(input.reason, 600);
  if (!reason) fail("MYROSTER_REQUEST_REASON_REQUIRED");
  const requested = input.assignment && typeof input.assignment === "object" ? input.assignment : {};
  let assignment = null;
  const id = clean(requested.id, 160);
  const table = clean(requested.sourceTable, 80);
  if (id || table) {
    if (!id || !ASSIGNMENT_TABLES.includes(table)) fail("MYROSTER_ASSIGNMENT_NOT_FOUND");
    assignment = (await allAssignments(ctx)).find(row => row.id === id && row.sourceTable === table) || null;
    if (!assignment) fail("MYROSTER_ASSIGNMENT_NOT_FOUND");
  }
  return createScheduleRequest(ctx, {
    requestId: input.requestId,
    notes: reason,
    routeId: assignment && assignment.routeId,
    bookingReference: assignment && assignment.reference,
    startTime: assignment && assignment.startAt,
    endTime: assignment && assignment.endAt,
    payload: {
      requestType: "SCHEDULE_CHANGE",
      sourceTable: assignment && assignment.sourceTable || "",
      assignmentId: assignment && assignment.id || "",
      summary: assignment ? "Schedule change requested for " + (assignment.label || assignment.assignmentType || "destination assignment") : reason,
      reason
    }
  });
}

function flightSearchToken(value) {
  return clean(value, 80).toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function flightMatches(row, token) {
  const haystack = flightSearchToken([
    row.flightNumber, row.airlineCode, row.airlineName, row.origin, row.viaPoint, row.destination
  ].filter(Boolean).join(" "));
  return haystack.includes(token);
}
function dateList(from, to) {
  const values = [];
  const cursor = new Date(from + "T00:00:00.000Z");
  const last = new Date(to + "T00:00:00.000Z");
  while (cursor <= last && values.length < 14) {
    values.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return values;
}
function scheduleOperatesOn(row, date) {
  const raw = clean(row.days_of_operation, 80).toUpperCase();
  if (!raw) return true;
  const day = new Date(date + "T00:00:00.000Z").getUTCDay();
  const isoDay = day === 0 ? 7 : day;
  if (/^[1-7]+$/.test(raw)) return raw.includes(String(isoDay));
  const names = raw.match(/\b(?:MONDAY|MON|TUESDAY|TUE|WEDNESDAY|WED|THURSDAY|THUR|THU|FRIDAY|FRI|SATURDAY|SAT|SUNDAY|SUN)\b/g) || [];
  if (!names.length) return false;
  const key = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][day];
  return names.some(name => name.slice(0, 3) === key);
}
function normalizedFidsFlight(row) {
  return {
    id: "FIDS:" + clean(row.flight_key || row.id, 180),
    flightNumber: clean(row.flight_number, 40),
    airlineCode: clean(row.airline_code, 8),
    airlineName: clean(row.airline_name, 120),
    origin: clean(row.origin, 8),
    destination: clean(row.destination, 8),
    departureDate: clean(row.departure_date, 20),
    scheduledTime: clean(row.scheduled_time, 40),
    estimatedTime: clean(row.estimated_time, 40),
    actualTime: clean(row.actual_time, 40),
    status: clean(row.status, 80),
    gate: clean(row.gate, 40),
    terminal: clean(row.terminal, 40),
    belt: clean(row.belt, 40),
    aircraftType: clean(row.aircraft_type, 80),
    registration: clean(row.registration, 40),
    source: "ALTEA FIDS"
  };
}
export async function searchOperationalFlightsCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  await destinationContext(session);
  const token = flightSearchToken(input.query);
  if (token.length < 2) fail("MYROSTER_FLIGHT_SEARCH_TERM_REQUIRED");
  const from = validDate(input.from) ? clean(input.from, 20) : new Date().toISOString().slice(0, 10);
  const to = validDate(input.to) ? clean(input.to, 20) : from;
  const span = (Date.parse(to + "T00:00:00.000Z") - Date.parse(from + "T00:00:00.000Z")) / 86400000;
  if (span < 0 || span > 13) fail("MYROSTER_FLIGHT_SEARCH_RANGE_INVALID");

  const [fidsResult, scheduleResult] = await Promise.all([
    restRequest({
      table: "altea_fids_flights",
      method: "GET",
      query: {
        select: "id,flight_key,flight_number,airline_code,airline_name,origin,destination,departure_date,scheduled_time,estimated_time,actual_time,gate,terminal,belt,status,aircraft_type,registration",
        and: "(departure_date.gte." + from + ",departure_date.lte." + to + ")",
        or: "(flight_number.ilike.*" + token + "*,airline_code.ilike.*" + token + "*,origin.ilike.*" + token + "*,destination.ilike.*" + token + "*)",
        order: "departure_date.asc,scheduled_time.asc",
        limit: "1000"
      }
    }),
    restRequest({
      table: "inventory_schedule_lines",
      method: "GET",
      query: {
        select: "id,flight_number,days_of_operation,board_point,off_point,via_point,std,sta,equipment_type,effective_date,discontinue_date,status",
        and: "(effective_date.lte." + to + ",or(discontinue_date.is.null,discontinue_date.gte." + from + "))",
        or: "(flight_number.ilike.*" + token + "*,board_point.ilike.*" + token + "*,via_point.ilike.*" + token + "*,off_point.ilike.*" + token + "*)",
        order: "flight_number.asc",
        limit: "1000"
      }
    })
  ]);

  const flights = rowsOf(fidsResult).map(normalizedFidsFlight).filter(row =>
    row.departureDate >= from && row.departureDate <= to && flightMatches(row, token)
  );
  const seen = new Set(flights.map(row => [row.flightNumber, row.departureDate, row.origin, row.destination].map(flightSearchToken).join("|")));
  const scheduleDates = dateList(from, to);
  for (const row of rowsOf(scheduleResult)) {
    const flightNumber = clean(row.flight_number, 40);
    const origin = clean(row.board_point, 8);
    const destination = clean(row.off_point, 8);
    const viaPoint = clean(row.via_point, 8);
    if (!flightMatches({ flightNumber, origin, viaPoint, destination }, token)) continue;
    const status = clean(row.status, 80).toUpperCase();
    if (["CANCELLED", "CANCELED", "INACTIVE", "CLOSED", "DELETED", "EXPIRED"].includes(status)) continue;
    for (const date of scheduleDates) {
      if (row.effective_date && clean(row.effective_date, 20) > date) continue;
      if (row.discontinue_date && clean(row.discontinue_date, 20) < date) continue;
      if (!scheduleOperatesOn(row, date)) continue;
      const key = [flightNumber, date, origin, destination].map(flightSearchToken).join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      flights.push({
        id: "SCHEDULE:" + clean(row.id, 120) + ":" + date,
        flightNumber,
        airlineCode: "",
        airlineName: "",
        origin,
        viaPoint,
        destination,
        departureDate: date,
        scheduledTime: clean(row.std, 40),
        arrivalTime: clean(row.sta, 40),
        estimatedTime: "",
        actualTime: "",
        status: clean(row.status || "SCHEDULED", 80),
        gate: "",
        terminal: "",
        belt: "",
        aircraftType: clean(row.equipment_type, 80),
        registration: "",
        source: "Published ALTEA schedule"
      });
    }
  }
  flights.sort((a, b) => (a.departureDate + " " + (a.scheduledTime || "")).localeCompare(b.departureDate + " " + (b.scheduledTime || "")));
  return { ok: true, flights: flights.slice(0, 100), sources: ["ALTEA FIDS", "ALTEA schedule"], dateRange: { from, to }, searchedAt: new Date().toISOString() };
}

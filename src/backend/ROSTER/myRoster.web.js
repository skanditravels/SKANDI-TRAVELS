import { webMethod, Permissions } from 'wix-web-module';
import { requireInternalAgent, text, writeInternalAudit } from '../RIA/internalAccess.js';
import { restRequest } from '../RIA/supabaseServer.js';

function now() { return new Date().toISOString(); }
function date(value) { const result = String(value || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(result) ? result : ''; }
function mapShift(row = {}) { return { id: row.id || '', employeeId: row.employee_id || row.employee_ref || '', startAt: row.start_at || row.start_time || '', endAt: row.end_at || row.end_time || '', location: row.location || '', assignmentType: row.assignment_type || row.assignment || '', routeId: row.route_id || '', bookingReference: row.booking_reference || '', status: row.status || '', notes: row.notes || '', payload: row.payload || {} }; }
function employeeFilter(agent) { return `(employee_id.eq.${agent.id},employee_ref.eq.${agent.id},employee_id.eq.${agent.sk_id || ''},employee_ref.eq.${agent.sk_id || ''})`; }
async function ownBoard(agent, input = {}) {
  const rows = await restRequest({ table: 'roster_shifts', query: { select: '*', or: employeeFilter(agent), order: 'start_at.asc,start_time.asc', limit: Math.min(Math.max(Number(input.limit) || 500, 1), 2000) } });
  return (rows || []).map(mapShift);
}
async function audit(agent, action, target, after = {}) { await writeInternalAudit({ agent, action: `ROSTER_${action}`, target, after }).catch(() => null); }

async function myRosterBoard(input = {}) {
  const { agent, profile } = await requireInternalAgent();
  const shifts = await ownBoard(agent, input);
  const clockEvents = await restRequest({ table: 'roster_clock_events', query: { select: '*', or: employeeFilter(agent), order: 'event_at.desc,event_time.desc', limit: 200 } }).catch(() => []);
  const ledger = await restRequest({ table: 'roster_time_ledger', query: { select: '*', employee_id: `eq.${agent.id}`, order: 'work_date.desc,created_at.desc', limit: 500 } }).catch(() => []);
  return { ok: true, profile, shifts, clockEvents: clockEvents || [], ledger: ledger || [] };
}

export const getMyRosterBoard = webMethod(Permissions.SiteMember, myRosterBoard);

export const getMyRosterBootstrap = webMethod(Permissions.SiteMember, async (input = {}) => {
  const data = await myRosterBoard(input); return { ...data, apps: [], now: now() };
});

export const syncOperationalDutiesFromAltea = webMethod(Permissions.SiteMember, async () => {
  const { agent } = await requireInternalAgent();
  const assignments = await restRequest({ table: 'crew_assignments', query: { select: '*', or: employeeFilter(agent), order: 'start_at.asc,start_time.asc', limit: 1000 } }).catch(() => []);
  const existing = await ownBoard(agent, { limit: 2000 });
  const existingKeys = new Set(existing.map((shift) => `${shift.bookingReference}:${shift.startAt}`));
  const inserts = (assignments || []).map(mapShift).filter((assignment) => !existingKeys.has(`${assignment.bookingReference}:${assignment.startAt}`)).map((assignment) => ({ employee_id: agent.id, employee_ref: agent.sk_id || agent.id, start_at: assignment.startAt || null, end_at: assignment.endAt || null, start_time: assignment.startAt || null, end_time: assignment.endAt || null, location: assignment.location || null, assignment_type: assignment.assignmentType || 'ALTEA_DUTY', route_id: assignment.routeId || null, booking_reference: assignment.bookingReference || null, status: assignment.status || 'PLANNED', notes: assignment.notes || null, payload: { ...(assignment.payload || {}), syncedFrom: 'crew_assignments', syncedAt: now() }, created_at: now(), updated_at: now() }));
  if (inserts.length) await restRequest({ table: 'roster_shifts', method: 'POST', body: inserts });
  await audit(agent, 'ALTEA_DUTIES_SYNCED', agent.id, { inserted: inserts.length });
  return { ok: true, inserted: inserts.length };
});

export const publishRosterWindow = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'manage' }); const start = date(input.startDate); const end = date(input.endDate); if (!start || !end || end < start) throw new Error('ROSTER_WINDOW_INVALID'); const rows = await restRequest({ table: 'roster_shifts', method: 'PATCH', query: { start_at: `gte.${start}T00:00:00Z`, end_at: `lte.${end}T23:59:59Z` }, body: { status: 'PUBLISHED', updated_at: now() }, prefer: 'return=representation' }); await audit(agent, 'WINDOW_PUBLISHED', null, { start, end, updated: rows?.length || 0 }); return { ok: true, updated: rows?.length || 0, startDate: start, endDate: end };
});

export const createTimeClockEvent = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent(); const eventType = text(input.eventType || input.type, 80).toUpperCase(); if (!['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END'].includes(eventType)) throw new Error('ROSTER_CLOCK_EVENT_INVALID'); const at = input.eventAt || input.eventTime || now(); const rows = await restRequest({ table: 'roster_clock_events', method: 'POST', body: { employee_id: agent.id, employee_ref: agent.sk_id || agent.id, event_type: eventType, event_at: at, event_time: at, location: text(input.location, 240) || null, status: 'RECORDED', payload: { ...input, recordedBy: agent.id }, created_at: now() } }); const saved = rows?.[0] || null; await audit(agent, 'CLOCK_EVENT_CREATED', saved?.id, { eventType }); return { ok: true, event: saved };
});

async function createLedgerRequest(agent, type, input = {}) { const workDate = date(input.workDate || input.date || input.startDate) || now().slice(0, 10); const rows = await restRequest({ table: 'roster_time_ledger', method: 'POST', body: { employee_id: agent.id, work_date: workDate, hours: Number(input.hours || 0) || 0, type, status: 'REQUESTED', payload: { ...input, requestedBy: agent.id, requestedAt: now() }, created_at: now(), updated_at: now() } }); const saved = rows?.[0] || null; await audit(agent, `${type}_CREATED`, saved?.id); return { ok: true, request: saved };
}
export const requestTimeOff = webMethod(Permissions.SiteMember, async (input = {}) => createLedgerRequest((await requireInternalAgent()).agent, 'TIME_OFF', input));
export const createRosterBid = webMethod(Permissions.SiteMember, async (input = {}) => createLedgerRequest((await requireInternalAgent()).agent, 'ROSTER_BID', input));
export const createTripTradeDrop = webMethod(Permissions.SiteMember, async (input = {}) => createLedgerRequest((await requireInternalAgent()).agent, 'TRIP_TRADE_DROP', input));
export const requestTripTradePickup = webMethod(Permissions.SiteMember, async (input = {}) => createLedgerRequest((await requireInternalAgent()).agent, 'TRIP_TRADE_PICKUP', input));

export const createPayrollRosterExport = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'payroll' }); const start = date(input.startDate); const end = date(input.endDate); const rows = await restRequest({ table: 'roster_time_ledger', query: { select: '*', employee_id: `eq.${agent.id}`, order: 'work_date.asc', limit: 2000 } }); const items = (rows || []).filter((row) => (!start || row.work_date >= start) && (!end || row.work_date <= end)); const hours = items.reduce((sum, row) => sum + (Number(row.hours) || 0), 0); await audit(agent, 'PAYROLL_EXPORT_CREATED', agent.id, { start, end, hours, rowCount: items.length }); return { ok: true, startDate: start, endDate: end, totalHours: hours, rows: items };
});

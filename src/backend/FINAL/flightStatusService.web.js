import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from '../RIA/supabaseServer.js';

function text(value, max = 120) { return String(value || '').trim().toUpperCase().slice(0, max); }
function mapFlight(row = {}) { return { id: row.id || '', flightKey: row.flight_key || '', flightNumber: row.flight_number || '', airlineCode: row.airline_code || '', airlineName: row.airline_name || '', origin: row.origin || '', destination: row.destination || '', departureDate: row.departure_date || '', scheduledTime: row.scheduled_time || '', estimatedTime: row.estimated_time || '', actualTime: row.actual_time || '', gate: row.gate || '', terminal: row.terminal || '', belt: row.belt || '', status: row.status || '', aircraftType: row.aircraft_type || '' }; }
export const searchFlightStatus = webMethod(Permissions.Anyone, async (input = {}) => {
  const query = text(input.query || input.flightNumber || input.flight || input.origin || input.destination, 120);
  const date = String(input.date || input.departureDate || '').slice(0, 10);
  const rows = await restRequest({ table: 'altea_fids_flights', query: { select: 'id,flight_key,flight_number,airline_code,airline_name,origin,destination,departure_date,scheduled_time,estimated_time,actual_time,gate,terminal,belt,status,aircraft_type', order: 'departure_date.desc,scheduled_time.asc', limit: 500 } });
  const items = (rows || []).filter((row) => (!date || row.departure_date === date) && (!query || `${row.flight_number} ${row.airline_code} ${row.origin} ${row.destination}`.toUpperCase().includes(query))).map(mapFlight);
  return { ok: true, items, meta: { query, date } };
});

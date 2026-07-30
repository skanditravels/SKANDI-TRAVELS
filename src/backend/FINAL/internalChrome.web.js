import { webMethod, Permissions } from 'wix-web-module';
import { requireInternalAgent, text } from '../RIA/internalAccess.js';
import { restRequest } from '../RIA/supabaseServer.js';

function result(type, title, subtitle, path, id) {
  return { type, title, subtitle, path, id: id || '' };
}

async function searchRows(table, query, fields, or, mapper) {
  const q = text(query, 80);
  if (!q) return [];
  const rows = await restRequest({
    table,
    query: {
      select: fields,
      or,
      limit: 8,
    },
  }).catch(() => []);
  return (rows || []).map(mapper).filter(Boolean);
}

export const runInternalGlobalSearch = webMethod(Permissions.SiteMember, async (query = '') => {
  await requireInternalAgent();
  const q = text(query, 80);
  if (q.length < 2) return { query: q, results: [] };

  const [staff, inventory, tickets] = await Promise.all([
    searchRows('agent_users', q, 'id,sk_id,display_name,email,role,department', `(display_name.ilike.*${q}*,email.ilike.*${q}*,sk_id.ilike.*${q}*)`, (row) => result(
      'staff', row.display_name || row.email || row.sk_id, `${row.sk_id || ''} ${row.role || ''}`.trim(), '/riaintra/hr', row.id,
    )),
    searchRows('travel_products', q, 'id,product_id,title,destination,status', `(title.ilike.*${q}*,product_id.ilike.*${q}*,destination.ilike.*${q}*)`, (row) => result(
      'inventory', row.title || row.product_id, `${row.destination || ''} ${row.status || ''}`.trim(), '/riaintra/inventory-control', row.id,
    )),
    searchRows('grouptalk_tickets', q, 'id,ticket_number,title,status,priority', `(ticket_number.ilike.*${q}*,title.ilike.*${q}*)`, (row) => result(
      'ticket', row.title || row.ticket_number, `${row.ticket_number || ''} ${row.status || ''}`.trim(), '/riaintra/grouptalk', row.id,
    )),
  ]);

  return { query: q, results: [...staff, ...inventory, ...tickets].slice(0, 20) };
});

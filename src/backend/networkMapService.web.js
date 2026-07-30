import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from './RIA/supabaseServer.js';

function safeUrl(value) { return /^https:\/\//i.test(String(value || '').trim()) ? String(value).trim() : ''; }

export const getPublicNetworkMapData = webMethod(Permissions.Anyone, async () => {
  const [products, airports] = await Promise.all([
    restRequest({ table: 'travel_products', query: { select: 'id,product_id,title,destination,image_url,short_description,payload', customer_visible: 'eq.true', limit: 500 } }),
    restRequest({ table: 'travel_info_airports', query: { select: '*', active: 'eq.true', order: 'sort_order.asc,title.asc', limit: 500 } }).catch(() => []),
  ]);
  const nodes = [
    ...(airports || []).map((row) => ({ id: row.id, type: 'airport', title: row.title || '', slug: row.slug || '', imageUrl: safeUrl(row.image_url), ...((row.payload && typeof row.payload === 'object') ? row.payload : {}) })),
    ...(products || []).map((row) => ({ id: row.id, type: 'destination', productId: row.product_id || '', title: row.title || '', destination: row.destination || '', imageUrl: safeUrl(row.image_url), description: row.short_description || '', ...((row.payload && typeof row.payload === 'object') ? row.payload : {}) })),
  ];
  return { nodes, locations: nodes, meta: { source: 'Supabase', public: true } };
});

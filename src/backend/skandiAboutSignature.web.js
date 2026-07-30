import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from './RIA/supabaseServer.js';

function safeUrl(value) { return /^https:\/\//i.test(String(value || '').trim()) ? String(value).trim() : ''; }
function productMap(row = {}) {
  return {
    id: row.id || '', productId: row.product_id || row.id || '', title: row.title || '', destination: row.destination || '',
    productType: row.product_type || '', price: Number(row.live_price || row.base_price || 0), currency: row.currency || 'SEK',
    imageUrl: safeUrl(row.image_url), shortDescription: row.short_description || '', status: row.status || '', payload: row.payload || {},
  };
}
async function publicProducts() {
  const rows = await restRequest({ table: 'travel_products', query: { select: '*', customer_visible: 'eq.true', order: 'updated_at.desc', limit: 300 } });
  return (rows || []).filter((row) => String(row.status || '').toUpperCase() !== 'ARCHIVED').map(productMap);
}

export const getAboutPagePayload = webMethod(Permissions.Anyone, async () => {
  const [products, articles] = await Promise.all([
    publicProducts(),
    restRequest({ table: 'travel_info_articles', query: { select: '*', active: 'eq.true', order: 'sort_order.asc,updated_at.desc', limit: 30 } }).catch(() => []),
  ]);
  return {
    company: { name: 'SKANDI TRAVELS', description: 'Curated travel and operational excellence.' },
    featuredProducts: products.slice(0, 12),
    stories: (articles || []).map((row) => ({ id: row.id, title: row.title || '', body: row.body || '', imageUrl: safeUrl(row.image_url), slug: row.slug || '', payload: row.payload || {} })),
  };
});

export const getSignatureCollectionPayload = webMethod(Permissions.Anyone, async () => {
  const products = await publicProducts();
  return { products: products.filter((product) => /signature|luxury|premium/i.test(`${product.productType} ${product.payload?.collection || ''}`)), allProducts: products };
});

export const searchSignatureCollectionPackages = webMethod(Permissions.Anyone, async (input = {}) => {
  const query = String(input.query || input.search || '').trim().toLowerCase();
  const products = await publicProducts();
  const matches = !query ? products : products.filter((product) => `${product.title} ${product.destination} ${product.productType}`.toLowerCase().includes(query));
  return { ok: true, query, products: matches.slice(0, 100) };
});

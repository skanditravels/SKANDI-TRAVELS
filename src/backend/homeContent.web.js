import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from './RIA/supabaseServer.js';

function publicUrl(value) {
  const url = String(value || '').trim();
  return /^https:\/\//i.test(url) ? url : '';
}

export const getOldStyleHomeContent = webMethod(Permissions.Anyone, async () => {
  const products = await restRequest({
    table: 'travel_products',
    query: { select: 'product_id,title,destination,image_url,short_description,base_price,currency', customer_visible: 'eq.true', status: 'eq.published', order: 'updated_at.desc', limit: 12 },
  }).catch(() => []);
  return {
    ok: true,
    hero: { imageUrl: '', logoUrl: '' },
    featuredProducts: (products || []).map((row) => ({
      id: row.product_id || '', title: row.title || '', destination: row.destination || '', imageUrl: publicUrl(row.image_url), description: row.short_description || '', price: row.base_price || 0, currency: row.currency || 'SEK',
    })),
  };
});

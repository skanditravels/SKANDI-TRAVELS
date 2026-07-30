import { restRequest } from './RIA/supabaseServer.js';
import { text } from './RIA/internalAccess.js';

function money(value) { const number = Number(value); return Number.isFinite(number) ? number : 0; }

export function requireBookingCartAccess(row, cartToken) {
  const payload = row?.payload && typeof row.payload === 'object' ? row.payload : {};
  const expected = String(payload.cartAccessToken || '');
  const received = String(cartToken || '');
  const expiresAt = Date.parse(String(row?.expires_at || ''));

  if (!expected || !received || expected !== received || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error('BOOKING_CART_ACCESS_DENIED');
  }
}

export async function loadBookingCart(cartId, cartToken) {
  const rows = await restRequest({ table: 'booking_carts', query: { select: '*', cart_id: `eq.${text(cartId, 120)}`, limit: 1 } });
  const row = rows?.[0];
  if (!row) throw new Error('BOOKING_CART_NOT_FOUND');
  requireBookingCartAccess(row, cartToken);
  const items = await restRequest({ table: 'booking_cart_items', query: { select: '*', cart_id: `eq.${row.cart_id}`, order: 'created_at.asc', limit: 100 } });
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  const { cartAccessToken, ...safePayload } = payload;
  return {
    id: row.id || '',
    cartId: row.cart_id || '',
    status: row.status || 'Open',
    currency: row.currency || 'SEK',
    subtotal: money(row.subtotal),
    taxes: money(row.taxes),
    total: money(row.total),
    selectedOfferId: row.selected_offer_id || '',
    expiresAt: row.expires_at || '',
    source: row.source || '',
    items: items || [],
    ...safePayload,
  };
}

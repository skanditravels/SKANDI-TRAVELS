import { webMethod, Permissions } from 'wix-web-module';
import { loadBookingCart } from './bookingCart.repository.js';
import { restRequest } from './RIA/supabaseServer.js';

export const getSeatmapForCart = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return { ok: true, cartId: cart.cartId, seatmap: null, selections: cart.seatSelections || [], message: 'Seat maps are returned only after supplier availability is configured.' };
});

export const saveSeatSelections = webMethod(Permissions.Anyone, async ({ cartId, cartToken, selections = {}, skipped = false } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  const rows = await restRequest({ table: 'booking_carts', method: 'PATCH', query: { id: `eq.${cart.id}` }, body: { payload: { ...(cart.payload || {}), seatSelections: selections, seatMapSkipped: skipped === true, workflow: { ...(cart.payload?.workflow || {}), step: 'payment' } }, updated_at: new Date().toISOString() } });
  return { ok: true, cart: rows?.[0] || cart };
});

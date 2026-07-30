import { webMethod, Permissions } from 'wix-web-module';
import { loadBookingCart } from './bookingCart.repository.js';

export const getSourceAwareBookingConfirmation = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return { ok: true, cartId: cart.cartId, status: cart.status, bookingReference: cart.bookingReference || '', total: cart.total, currency: cart.currency };
});

export const getTravelDocumentsForCart = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return { ok: true, cartId: cart.cartId, documents: cart.travelDocuments || [], status: cart.status };
});

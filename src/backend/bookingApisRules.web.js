import { webMethod, Permissions } from 'wix-web-module';
import { loadBookingCart } from './bookingCart.repository.js';

export const getApisRulesForCart = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return { ok: true, cartId: cart.cartId, rules: { requiredFields: ['firstName', 'lastName', 'dateOfBirth', 'nationality', 'documentNumber', 'documentExpiry'], destination: cart.offer?.destination || '' } };
});

export const refreshTravelRequirements = webMethod(Permissions.Anyone, async ({ cartId, cartToken, travelers = [] } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return { ok: true, cartId: cart.cartId, requirements: (travelers || []).map((traveler, index) => ({ travelerIndex: index, required: ['passport', 'dateOfBirth'], warnings: [] })) };
});

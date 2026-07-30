import { webMethod, Permissions } from 'wix-web-module';
import { randomUUID } from 'crypto';
import { searchFlightOffers, priceFlightOffer } from './RIA/amadeusClient.js';
import { restRequest } from './RIA/supabaseServer.js';
import { text } from './RIA/internalAccess.js';
import { loadBookingCart, requireBookingCartAccess } from './bookingCart.repository.js';

function cartCode() { return `SKC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }
function cartAccessToken() { return `${randomUUID()}${randomUUID()}`.replace(/-/g, ''); }
function offerCode() { return `OFF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }
function money(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function date(value) { const v = text(value, 10); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; }

function offerMap(offer, cacheId) {
  const price = offer?.price || {};
  const itinerary = Array.isArray(offer?.itineraries) ? offer.itineraries[0] : null;
  const firstSegment = itinerary?.segments?.[0] || {};
  const lastSegment = itinerary?.segments?.[itinerary?.segments?.length - 1] || {};
  return {
    id: cacheId, offerCacheId: cacheId, rawOffer: offer, offer,
    provider: 'AMADEUS', currency: price.currency || 'SEK', total: money(price.grandTotal || price.total),
    origin: firstSegment.departure?.iataCode || '', destination: lastSegment.arrival?.iataCode || '',
    departureAt: firstSegment.departure?.at || '', arrivalAt: lastSegment.arrival?.at || '',
    itineraries: offer?.itineraries || [], validatingAirlineCodes: offer?.validatingAirlineCodes || [],
  };
}

async function cartRow(cartId) {
  const rows = await restRequest({ table: 'booking_carts', query: { select: '*', cart_id: `eq.${text(cartId, 120)}`, limit: 1 } });
  return rows?.[0] || null;
}

async function securedCart(cartId, token) {
  const cart = await cartRow(cartId);
  if (!cart) throw new Error('BOOKING_CART_NOT_FOUND');
  requireBookingCartAccess(cart, token);
  return cart;
}

function cartMap(row = {}, items = []) {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  const { cartAccessToken, ...safePayload } = payload;
  return {
    id: row.id || '', cartId: row.cart_id || '', status: row.status || 'Open', currency: row.currency || 'SEK',
    subtotal: money(row.subtotal), taxes: money(row.taxes), total: money(row.total), selectedOfferId: row.selected_offer_id || '',
    expiresAt: row.expires_at || '', source: row.source || '', items: items || [], ...safePayload,
  };
}

async function patchCart(cart, patch = {}, payloadPatch = {}) {
  const rows = await restRequest({
    table: 'booking_carts', method: 'PATCH', query: { id: `eq.${cart.id}` },
    body: { ...patch, payload: { ...(cart.payload || {}), ...payloadPatch }, updated_at: new Date().toISOString() },
  });
  return rows?.[0] || cart;
}

export const getHomeBootstrap = webMethod(Permissions.Anyone, async () => ({
  ok: true,
  searchDefaults: { origin: 'ARN', currency: 'SEK', adults: 1, max: 20 },
  providers: ['AMADEUS'],
}));

export const searchUnifiedOffers = webMethod(Permissions.Anyone, async ({ search = {} } = {}) => {
  const response = await searchFlightOffers(search);
  const offers = Array.isArray(response?.data) ? response.data : [];
  const items = [];
  for (const offer of offers.slice(0, 50)) {
    const cacheId = offerCode();
    const mapped = offerMap(offer, cacheId);
    await restRequest({
      table: 'altea_offer_cache', method: 'POST',
      body: {
        offer_cache_id: cacheId, offer_id: text(offer.id, 160) || cacheId, source: 'amadeus', provider: 'Amadeus',
        origin: mapped.origin || null, destination: mapped.destination || null, departure_date: date(search.departureDate), return_date: date(search.returnDate),
        currency: mapped.currency, price: mapped.total, price_total: mapped.total, adults: Number(search.adults) || 1,
        product_type: 'FLIGHT_ONLY', expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        search_key: JSON.stringify({ origin: mapped.origin, destination: mapped.destination, departureDate: search.departureDate || '' }),
        payload: { offer, search, dictionaries: response?.dictionaries || {} },
      }, prefer: 'return=minimal',
    });
    items.push(mapped);
  }
  return { ok: true, items, offers: items, dictionaries: response?.dictionaries || {} };
});

export const createBookingCartFromOffer = webMethod(Permissions.Anyone, async ({ offer, search = {} } = {}) => {
  const supplied = offer && typeof offer === 'object' ? offer : {};
  const cacheId = text(supplied.offerCacheId || supplied.id, 160);
  let cached = null;
  if (cacheId) {
    const rows = await restRequest({ table: 'altea_offer_cache', query: { select: '*', offer_cache_id: `eq.${cacheId}`, limit: 1 } });
    cached = rows?.[0] || null;
  }
  const rawOffer = supplied.rawOffer || supplied.offer || cached?.payload?.offer || supplied;
  const mapped = offerMap(rawOffer, cacheId || offerCode());
  if (!mapped.origin || !mapped.destination || !mapped.total) throw new Error('BOOKING_OFFER_INVALID');
  const cartId = cartCode();
  const accessToken = cartAccessToken();
  const cartRows = await restRequest({
    table: 'booking_carts', method: 'POST',
    body: {
      cart_id: cartId, status: 'Open', currency: mapped.currency, subtotal: mapped.total, taxes: 0, total: mapped.total,
      selected_offer_id: mapped.offerCacheId, expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), source: 'home-search',
      payload: { search, offer: rawOffer, offerCacheId: mapped.offerCacheId, cartAccessToken: accessToken, workflow: { step: 'offer', termsAccepted: false } },
    },
  });
  const cart = cartRows?.[0];
  await restRequest({ table: 'booking_cart_items', method: 'POST', body: { cart_id: cartId, item_type: 'FLIGHT_OFFER', item_id: mapped.offerCacheId, title: `${mapped.origin} – ${mapped.destination}`, quantity: 1, unit_price: mapped.total, total: mapped.total, payload: { offer: rawOffer } }, prefer: 'return=minimal' });
  return { ok: true, cartId, cartAccessToken: accessToken, cart: cartMap(cart), nextPath: `/booking?step=offer&cartId=${encodeURIComponent(cartId)}&cartToken=${encodeURIComponent(accessToken)}` };
});

export const getBookingCart = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  return loadBookingCart(cartId, cartToken);
});

export const saveOfferDecision = webMethod(Permissions.Anyone, async ({ cartId, cartToken, termsAccepted } = {}) => {
  if (termsAccepted !== true) throw new Error('BOOKING_TERMS_REQUIRED');
  const cart = await securedCart(cartId, cartToken);
  const saved = await patchCart(cart, { status: 'Offer Accepted' }, { workflow: { ...(cart.payload?.workflow || {}), step: 'extras', termsAccepted: true, offerAcceptedAt: new Date().toISOString() } });
  return { ok: true, cart: cartMap(saved) };
});

export const getBookingExtras = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return { ok: true, cart, extras: cart.availableExtras || [], selectedExtras: cart.selectedExtras || [] };
});

export const saveBookingExtras = webMethod(Permissions.Anyone, async ({ cartId, cartToken, selectedExtras = [] } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  const extras = Array.isArray(selectedExtras) ? selectedExtras.slice(0, 50) : [];
  const requiresSignatureTransfer = extras.some((item) => String(item?.type || item?.code || '').toUpperCase().includes('TRANSFER'));
  const saved = await patchCart(cart, {}, { selectedExtras: extras, workflow: { ...(cart.payload?.workflow || {}), step: requiresSignatureTransfer ? 'transfer' : 'apis' } });
  return { ok: true, cart: cartMap(saved), requiresSignatureTransfer };
});

export const getSignatureTransferOptions = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return { ok: true, cartId: cart.cartId, options: [], message: 'Transfer options are supplied by selected package inventory.' };
});

export const saveSignatureTransfer = webMethod(Permissions.Anyone, async ({ cartId, cartToken, transfer } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  const saved = await patchCart(cart, {}, { signatureTransfer: transfer || null, workflow: { ...(cart.payload?.workflow || {}), step: 'apis' } });
  return { ok: true, cart: cartMap(saved) };
});

export const savePassengerApisAndReprice = webMethod(Permissions.Anyone, async ({ cartId, cartToken, travelers = [], contact = {} } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  const people = Array.isArray(travelers) ? travelers.slice(0, 9) : [];
  if (!people.length) throw new Error('BOOKING_TRAVELER_REQUIRED');
  const saved = await patchCart(cart, { email: text(contact.email, 240) || cart.email || null }, { travelers: people, contact, workflow: { ...(cart.payload?.workflow || {}), step: 'seats', apisSavedAt: new Date().toISOString() } });
  return { ok: true, cart: cartMap(saved) };
});

export const bookingHasFlight = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  return Boolean(cart?.selected_offer_id || cart?.payload?.offer);
});

export const authorizePaymentAndCommitBooking = webMethod(Permissions.Anyone, async ({ cartId, cartToken, termsAccepted } = {}) => {
  if (termsAccepted !== true) throw new Error('BOOKING_TERMS_REQUIRED');
  await securedCart(cartId, cartToken);
  // A booking cannot be marked paid until a configured payment provider returns an authorization.
  // This preserves the payment boundary instead of manufacturing a transaction in page code.
  throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
});

export const priceCachedOffer = webMethod(Permissions.Anyone, async ({ offerCacheId, offer } = {}) => {
  let rawOffer = offer;
  if (!rawOffer && offerCacheId) {
    const rows = await restRequest({ table: 'altea_offer_cache', query: { select: 'payload', offer_cache_id: `eq.${text(offerCacheId, 160)}`, limit: 1 } });
    rawOffer = rows?.[0]?.payload?.offer;
  }
  if (!rawOffer) throw new Error('BOOKING_OFFER_INVALID');
  return priceFlightOffer(rawOffer);
});

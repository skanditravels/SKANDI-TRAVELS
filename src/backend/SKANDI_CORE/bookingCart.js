// /src/backend/SKANDI_CORE/bookingCart.js
// SKANDI Backend Base 1.0 — B-006 customer booking cart repository.
// Owns booking_carts / booking_cart_items / payment_events persistence only.
// No Duffel, Stripe, ALTEA, page or traveler-mapping logic belongs here.

import { randomUUID } from "crypto";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { text, lower, record } from "backend/SKANDI_CORE/platformValidation.js";

const CARTS = "booking_carts";
const ITEMS = "booking_cart_items";
const PAYMENT_EVENTS = "payment_events";

function eq(value) { return `eq.${String(value ?? "")}`; }
function desc(value) { return `${value}.desc`; }
function row(value) { return Array.isArray(value) ? (value[0] || null) : value || null; }
function rows(value) { return Array.isArray(value) ? value : []; }
function nowIso() { return new Date().toISOString(); }
function money(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) throw new Error("BOOKING_INVALID_MONEY");
  return n.toFixed(2);
}
function contextMember(context = {}) {
  const memberId = text(context.memberId, 180);
  if (!memberId) {
    const error = new Error("A signed-in SKANDI account is required.");
    error.code = "LOGIN_REQUIRED";
    error.publicMessage = error.message;
    throw error;
  }
  return memberId;
}
function normalizeCartPatch(input = {}) {
  const patch = {};
  const map = {
    email: "email",
    status: "status",
    currency: "currency",
    subtotal: "subtotal",
    taxes: "taxes",
    total: "total",
    selectedOfferId: "selected_offer_id",
    selected_offer_id: "selected_offer_id",
    expiresAt: "expires_at",
    expires_at: "expires_at",
    payload: "payload",
    source: "source"
  };
  for (const [key, target] of Object.entries(map)) {
    if (!(key in input)) continue;
    let value = input[key];
    if (["subtotal", "taxes", "total"].includes(target)) value = money(value);
    if (target === "email") value = lower(value, 254) || null;
    if (["status", "currency", "selected_offer_id", "source"].includes(target)) value = text(value, 180) || null;
    if (target === "payload") value = record(value);
    patch[target] = value;
  }
  return patch;
}

export async function createOwnedCart(context = {}, input = {}) {
  const memberId = contextMember(context);
  const cartId = text(input.cartId, 36) || randomUUID();
  const body = {
    cart_id: cartId,
    member_id: memberId,
    email: lower(input.email || context.email, 254) || null,
    status: text(input.status || "Open", 60),
    currency: text(input.currency || "USD", 3).toUpperCase(),
    subtotal: money(input.subtotal),
    taxes: money(input.taxes),
    total: money(input.total),
    selected_offer_id: text(input.selectedOfferId, 180) || null,
    expires_at: input.expiresAt || null,
    payload: record(input.payload),
    source: text(input.source || "customer", 80)
  };
  const created = await restRequest({ table: CARTS, method: "POST", body });
  const result = row(created);
  if (!result?.cart_id) throw new Error("BOOKING_CART_CREATE_FAILED");
  return result;
}

export async function getOwnedCart(context = {}, rawCartId) {
  const memberId = contextMember(context);
  const cartId = text(rawCartId, 36);
  if (!cartId) return null;
  return row(await restRequest({
    table: CARTS,
    query: {
      select: "*",
      cart_id: eq(cartId),
      member_id: eq(memberId),
      limit: 1
    }
  }));
}

export async function getOwnedCartByOffer(context = {}, rawOfferId) {
  const memberId = contextMember(context);
  const offerId = text(rawOfferId, 180);
  if (!offerId) return null;
  return row(await restRequest({
    table: CARTS,
    query: {
      select: "*",
      member_id: eq(memberId),
      selected_offer_id: eq(offerId),
      order: desc("created_at"),
      limit: 1
    }
  }));
}

export async function listOwnedCarts(context = {}, { limit = 20, status = "" } = {}) {
  const memberId = contextMember(context);
  const query = {
    select: "*",
    member_id: eq(memberId),
    order: desc("updated_at"),
    limit: Math.min(100, Math.max(1, Number(limit) || 20))
  };
  if (text(status, 60)) query.status = eq(text(status, 60));
  return rows(await restRequest({ table: CARTS, query }));
}

export async function updateOwnedCart(context = {}, rawCartId, input = {}) {
  const memberId = contextMember(context);
  const cartId = text(rawCartId, 36);
  const patch = normalizeCartPatch(input);
  if (!cartId || !Object.keys(patch).length) return getOwnedCart(context, cartId);
  const updated = await restRequest({
    table: CARTS,
    method: "PATCH",
    query: { cart_id: eq(cartId), member_id: eq(memberId) },
    body: patch
  });
  return row(updated) || getOwnedCart(context, cartId);
}

export async function transitionOwnedCart(context = {}, rawCartId, fromStatus, toStatus, extra = {}) {
  const memberId = contextMember(context);
  const cartId = text(rawCartId, 36);
  const from = text(fromStatus, 60);
  const to = text(toStatus, 60);
  if (!cartId || !from || !to) return null;
  const body = { ...normalizeCartPatch(extra), status: to };
  const updated = await restRequest({
    table: CARTS,
    method: "PATCH",
    query: { cart_id: eq(cartId), member_id: eq(memberId), status: eq(from) },
    body
  });
  return row(updated);
}

export async function addCartItem(rawCartId, input = {}) {
  const cartId = text(rawCartId, 36);
  const itemType = text(input.itemType, 80);
  const itemId = text(input.itemId, 180);
  if (!cartId || !itemType || !itemId) throw new Error("BOOKING_CART_ITEM_REQUIRED");
  const existing = row(await restRequest({
    table: ITEMS,
    query: { select: "id", cart_id: eq(cartId), item_type: eq(itemType), item_id: eq(itemId), limit: 1 }
  }));
  const body = {
    cart_id: cartId,
    item_type: itemType,
    item_id: itemId,
    title: text(input.title, 300) || null,
    quantity: Math.min(99, Math.max(1, Number(input.quantity) || 1)),
    unit_price: money(input.unitPrice),
    total: money(input.total),
    payload: record(input.payload)
  };
  if (existing?.id) {
    return row(await restRequest({ table: ITEMS, method: "PATCH", query: { id: eq(existing.id) }, body }));
  }
  return row(await restRequest({ table: ITEMS, method: "POST", body }));
}

export async function listCartItems(rawCartId) {
  const cartId = text(rawCartId, 36);
  if (!cartId) return [];
  return rows(await restRequest({
    table: ITEMS,
    query: { select: "*", cart_id: eq(cartId), order: "created_at.asc" }
  }));
}

export async function recordPaymentEventOnce(input = {}) {
  const eventId = text(input.eventId, 180);
  const provider = text(input.provider || "Stripe", 80);
  if (!eventId) return null;
  const existing = row(await restRequest({
    table: PAYMENT_EVENTS,
    query: { select: "*", event_id: eq(eventId), provider: eq(provider), limit: 1 }
  }));
  if (existing) return existing;
  const body = {
    event_id: eventId,
    provider,
    member_id: text(input.memberId, 180) || null,
    booking_id: text(input.bookingId, 180) || null,
    amount: money(input.amount),
    currency: text(input.currency || "USD", 3).toUpperCase(),
    status: text(input.status, 80) || null,
    payload: record(input.payload),
    updated_at: nowIso()
  };
  try {
    return row(await restRequest({ table: PAYMENT_EVENTS, method: "POST", body }));
  } catch (error) {
    // At-least-once caller safety: another request may have inserted the same provider event.
    const retry = row(await restRequest({
      table: PAYMENT_EVENTS,
      query: { select: "*", event_id: eq(eventId), provider: eq(provider), limit: 1 }
    }));
    if (retry) return retry;
    throw error;
  }
}

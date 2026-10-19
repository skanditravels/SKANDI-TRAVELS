// /src/backend/SKANDI_CORE/duffelAssistant.js
// Customer-scoped Duffel Assistant session bootstrap.
// Customer ownership belongs to customerProfile; provider HTTP belongs to duffelClient.
// This does not create or service a SKANDI booking and does not write ALTEA.

import {
  getCustomerProfileBootstrapCore,
  getCustomerBookingDetailCore,
  updateCustomerProfileCore
} from "backend/SKANDI_CORE/customerProfile";
import { createDuffelComponentClientKeyCore } from "backend/SKANDI_CORE/duffelGround";
import { duffelRequest } from "backend/SKANDI_CORE/duffelClient";

const USER_ID = /^icu_[A-Za-z0-9_]+$/;
const ORDER_ID = /^ord_[A-Za-z0-9_]+$/;
const STAY_ID = /^bok_[A-Za-z0-9_]+$/;
const BOOKING_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISSUE_TYPES = new Set(["cancellation", "change", "other"]);

function clean(value, max = 220) { return String(value ?? "").trim().slice(0, max); }
function error(code, message, status = 400) {
  const e = new Error(message);
  e.name = "CustomerDuffelAssistantError";
  e.code = code;
  e.status = status;
  e.publicMessage = message;
  return e;
}
function requireContext(context) {
  if (!context?.memberId) throw error("LOGIN_REQUIRED", "Sign in to SKANDI to manage your Duffel bookings.", 401);
}
function userIds(resource) {
  const users = Array.isArray(resource?.users) ? resource.users : [];
  return [...new Set(users.filter(value => USER_ID.test(String(value))))];
}
function hasPassengerAccess(resource, userId, kind) {
  const travelers = kind === "air" ? resource?.passengers : resource?.guests;
  return Array.isArray(travelers) && travelers.some(row => row?.user_id === userId);
}
async function ensureResourceAccess(kind, resourceId, userId) {
  const basePath = kind === "air" ? "/air/orders" : "/stays/bookings";
  const path = `${basePath}/${encodeURIComponent(resourceId)}`;
  const before = await duffelRequest(path, { retrySafe: true });
  const resource = before.data;
  if (resource?.id !== resourceId) {
    throw error("PROVIDER_BOOKING_NOT_FOUND", "Duffel did not return the expected booking.", 502);
  }
  const original = userIds(resource);
  if (original.includes(userId) || hasPassengerAccess(resource, userId, kind)) return;
  // Never remove pre-existing access grants. Duffel PATCH replaces the extra-users array.
  if (original.length >= 100) {
    throw error("PROVIDER_BOOKING_USERS_LIMIT", "This booking has reached its access-management limit. Contact SKANDI Support.", 409);
  }
  const next = [...original, userId];
  const linked = await duffelRequest(path, {
    method: "PATCH", body: { data: { users: next } }, retrySafe: false
  });
  const returned = linked.data;
  if (returned?.id !== resourceId ||
      !(userIds(returned).includes(userId) || hasPassengerAccess(returned, userId, kind))) {
    throw error("PROVIDER_BOOKING_LINK_UNCONFIRMED", "Duffel has not confirmed access to this booking. Contact SKANDI Support.", 502);
  }
}

async function resolvedCustomerId(context) {
  const state = await getCustomerProfileBootstrapCore(context, {});
  let profile = state?.profile;
  if (!profile) throw error("CUSTOMER_PROFILE_UNAVAILABLE", "Your SKANDI profile is unavailable.", 503);
  let id = clean(profile.providerCustomerUserId);
  if (!id) {
    // Reuse the canonical profile update / Duffel identity persistence path; no new identity store.
    const updated = await updateCustomerProfileCore(context, {});
    if (updated?.providerSync?.ok !== true) {
      const reason = clean(updated?.providerSync?.error?.message, 250);
      throw error("DUFFEL_IDENTITY_NOT_SYNCED", reason || "Complete and save your first name, last name and email in My Profile before opening the Assistant.", 409);
    }
    profile = updated.profile;
    id = clean(profile?.providerCustomerUserId);
  }
  if (!USER_ID.test(id)) {
    throw error("DUFFEL_IDENTITY_INVALID", "Your travel-provider identity is unavailable. Contact SKANDI Support.", 409);
  }
  return id;
}

export async function createCustomerDuffelAssistantSessionCore(context, input = {}) {
  requireContext(context);
  const userId = await resolvedCustomerId(context);
  const bookingId = clean(input.bookingId, 80);
  const kind = clean(input.resourceType, 10).toLowerCase();
  const issueType = clean(input.issueType, 20).toLowerCase();
  if (issueType && !ISSUE_TYPES.has(issueType)) {
    throw error("ISSUE_TYPE_INVALID", "Choose cancellation, change or other.");
  }

  const scope = { userId };
  let resourceType = "all";
  if (bookingId) {
    if (!BOOKING_ID.test(bookingId)) {
      throw error("SKANDI_BOOKING_ID_INVALID", "Choose a valid booking from your SKANDI account.");
    }
    if (kind && kind !== "air" && kind !== "stay") {
      throw error("RESOURCE_TYPE_INVALID", "Choose a flight or hotel booking.");
    }
    // This canonical service verifies the Wix-member ownership or verified account link.
    // Raw provider order IDs supplied by the browser are never trusted.
    const detail = await getCustomerBookingDetailCore(context, { bookingId });
    if (!detail?.ok) throw error("BOOKING_NOT_FOUND", "This booking is not linked to your SKANDI account.", 404);
    const ids = detail.providerIds || {};
    const air = clean(ids.orderId);
    const stay = clean(ids.stayBookingId);
    if (!kind && ORDER_ID.test(air) && STAY_ID.test(stay)) {
      throw error("RESOURCE_TYPE_REQUIRED", "Choose flight support or hotel support for this booking.");
    }
    if ((kind === "air" || (!kind && ORDER_ID.test(air))) && ORDER_ID.test(air)) {
      scope.orderId = air;
      resourceType = "air";
    } else if ((kind === "stay" || (!kind && STAY_ID.test(stay))) && STAY_ID.test(stay)) {
      scope.bookingId = stay;
      resourceType = "stay";
    } else {
      throw error("DUFFEL_RESOURCE_NOT_LINKED", "This booking is not linked to a supported Duffel flight or hotel booking.", 409);
    }
    await ensureResourceAccess(resourceType, scope.orderId || scope.bookingId, userId);
  }

  const keyResponse = await createDuffelComponentClientKeyCore(scope);
  const clientKey = clean(keyResponse?.componentClientKey || keyResponse?.component_client_key, 8000);
  if (!clientKey) {
    throw error("DUFFEL_CLIENT_KEY_UNAVAILABLE", "Duffel could not prepare the secure Assistant session.", 503);
  }
  return {
    ok: true,
    clientKey,
    resourceType,
    issueType: issueType || null,
    // Do not disclose Duffel Customer User IDs or provider access-grant lists to the embed.
    bookingId: bookingId || null
  };
}

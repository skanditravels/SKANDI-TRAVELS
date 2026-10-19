// /src/backend/SKANDI_CORE/duffelIdentity.js
// Canonical Duffel Customer User identity service. Server-side provider transport only.
// Restores the import already required by customerProfile.js in the V12 main branch.

import { duffelRequest } from "backend/SKANDI_CORE/duffelClient";

function clean(value, max = 255) {
  return String(value ?? "").trim().slice(0, max);
}
function fail(code, message, status = 400) {
  const error = new Error(message);
  error.name = "DuffelIdentityError";
  error.code = code;
  error.status = status;
  error.publicMessage = message;
  return error;
}
function normalizeCustomer(data) {
  if (!data || !/^icu_[A-Za-z0-9_]+$/.test(String(data.id || ""))) {
    throw fail("DUFFEL_IDENTITY_INVALID_RESPONSE", "Duffel did not return a valid customer identity.", 502);
  }
  return {
    id: data.id,
    email: clean(data.email, 254).toLowerCase(),
    givenName: clean(data.given_name),
    familyName: clean(data.family_name),
    phoneNumber: clean(data.phone_number, 32),
    preferredLanguage: clean(data.preferred_language, 2),
    liveMode: data.live_mode === true
  };
}
function normalizedInput(input = {}) {
  const email = clean(input.email, 254).toLowerCase();
  const givenName = clean(input.givenName, 255);
  const familyName = clean(input.familyName, 255);
  const phoneNumber = clean(input.phoneNumber, 32);
  const preferredLanguage = clean(input.preferredLanguage, 2).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw fail("CUSTOMER_EMAIL_REQUIRED", "Save a valid email address in your profile before managing trips.");
  }
  if (!givenName || !familyName) {
    throw fail("CUSTOMER_NAME_REQUIRED", "Save your first and last name in your profile before managing trips.");
  }
  if (phoneNumber && !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw fail("CUSTOMER_PHONE_INVALID", "Your saved phone number must include the international country code.");
  }
  if (preferredLanguage && !/^[a-z]{2}$/.test(preferredLanguage)) {
    throw fail("CUSTOMER_LANGUAGE_INVALID", "The saved language code is not supported by Duffel.");
  }
  return {
    email,
    given_name: givenName,
    family_name: familyName,
    ...(phoneNumber ? { phone_number: phoneNumber } : {}),
    ...(preferredLanguage ? { preferred_language: preferredLanguage } : {})
  };
}
function sameEmail(value, email) {
  return clean(value, 254).toLowerCase() === email;
}

export async function ensureDuffelCustomerUserCore(input = {}) {
  const data = normalizedInput(input);
  const suppliedId = clean(input.customerUserId, 220);
  let user = null;
  if (suppliedId) {
    if (!/^icu_[A-Za-z0-9_]+$/.test(suppliedId)) {
      throw fail("CUSTOMER_USER_ID_INVALID", "The saved Duffel customer identity is invalid.");
    }
    const found = await duffelRequest(`/identity/customer/users/${encodeURIComponent(suppliedId)}`, { retrySafe: true });
    user = normalizeCustomer(found.data);
    if (!sameEmail(user.email, data.email)) {
      throw fail("CUSTOMER_IDENTITY_MISMATCH", "The saved travel-provider identity belongs to a different email address. Contact SKANDI Support.", 409);
    }
  } else {
    // Duffel's email filter is authoritative. Avoid creating duplicates for an existing user.
    const found = await duffelRequest("/identity/customer/users", {
      query: { email: data.email, limit: 50 },
      retrySafe: true
    });
    const matches = (Array.isArray(found.data) ? found.data : [])
      .filter(row => sameEmail(row?.email, data.email))
      .map(normalizeCustomer);
    if (matches.length > 1) {
      throw fail("CUSTOMER_IDENTITY_AMBIGUOUS", "More than one Duffel customer identity uses this email. Contact SKANDI Support.", 409);
    }
    if (matches.length === 1) user = matches[0];
  }

  if (user) {
    const requiresUpdate = user.givenName !== data.given_name ||
      user.familyName !== data.family_name ||
      (data.phone_number && user.phoneNumber !== data.phone_number) ||
      (data.preferred_language && user.preferredLanguage !== data.preferred_language);
    if (!requiresUpdate) return { user };
    const updated = await duffelRequest(`/identity/customer/users/${encodeURIComponent(user.id)}`, {
      method: "PUT", body: { data }, retrySafe: false
    });
    return { user: normalizeCustomer(updated.data) };
  }

  const created = await duffelRequest("/identity/customer/users", {
    method: "POST", body: { data }, retrySafe: false
  });
  return { user: normalizeCustomer(created.data) };
}

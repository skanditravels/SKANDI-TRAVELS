// /src/public/customerAuthUi.js
// SKANDI page-level customer authentication popup bridge — B-011.23.
// Single frontend launcher for Wix-managed SKANDI Club login/reset popups.
// Global-header authentication is intentionally NOT owned here.

import wixWindowFrontend from "wix-window-frontend";
import { getCustomerAuthPopup } from "public/siteMap.js";

const AUTH_SOURCE = "SKANDI_CUSTOMER_AUTH";

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function safeContext(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const output = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)) continue;
    if (typeof raw === "boolean" || typeof raw === "number") output[key] = raw;
    else if (raw !== null && raw !== undefined) output[key] = clean(raw, 1500);
  }
  return output;
}

export async function openCustomerAuthPopup(kind, context = {}) {
  const popup = getCustomerAuthPopup(kind);
  if (!popup?.name) throw new Error(`Unknown SKANDI customer auth popup: ${clean(kind, 80) || "EMPTY"}`);

  return wixWindowFrontend.openLightbox(popup.name, {
    source: AUTH_SOURCE,
    kind,
    popupCodeFile: popup.codeFile,
    timestamp: new Date().toISOString(),
    ...safeContext(context)
  });
}

export function openCustomerLogin(context = {}) {
  return openCustomerAuthPopup("login", context);
}

export function openCustomerResetPassword(context = {}) {
  return openCustomerAuthPopup("resetPassword", context);
}

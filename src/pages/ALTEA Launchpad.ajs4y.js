// /src/pages/ALTEA Launchpad.ajs4y.js
// V12 — correlated Launchpad bridge; staffAuth owns identity and app access.
// Component ID is taken from the published ajs4y controller; preserve its spelling.

import wixLocationFrontend from "wix-location-frontend";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";
import {
  getStaffPortalSession,
  getAlteaLaunchpadApps
} from "backend/SKANDI_CORE/staffAuth.web";

const VERSION = "V12-ALTEA-LAUNCHPAD-2026.10.06";
const EMBED_IDS = ["#alteaDasboardEmbed"];
const CHILD_SOURCE = "SKANDI_ALTEA_LAUNCHPAD";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const SERVICE_TIMEOUT_MS = 20000;
const REQUEST_TYPES = new Set([
  "ALTEA_LAUNCHPAD_READY", "ALTEA_LAUNCHPAD_REFRESH", "ALTEA_LAUNCHPAD_NAVIGATE"
]);

let html = null;
let bootstrapPromise = null;
let bootstrapGeneration = 0;
let activeBootstrapId = "";
let lastBootstrap = null;
let authorizedApps = new Map();
let navigatingRequestId = "";
let completedNavigationId = "";

$w.onReady(() => {
  html = resolveHtmlEmbed();
  if (!html) {
    console.error("[ALTEA Launchpad] No supported HTML embed was found.");
    return;
  }
  html.onMessage(handleEmbedMessage);
  // HTML repeats its read-only READY request until a correlated response arrives.
  postToEmbed("ALTEA_LAUNCHPAD_HOST_READY", { version: VERSION, embedId: html.id || "" });
});

async function handleEmbedMessage(event) {
  const msg = parseMessage(event?.data);
  if (!msg || msg.source !== CHILD_SOURCE || !REQUEST_TYPES.has(msg.type)) return;
  const requestId = cleanText(msg.requestId, 120);
  if (!requestId) return;

  try {
    if (msg.type === "ALTEA_LAUNCHPAD_NAVIGATE") {
      await handleNavigate(isRecord(msg.payload) ? msg.payload : {}, requestId);
    } else {
      await bootstrapLaunchpad(requestId);
    }
  } catch (error) {
    await reportError(error, requestId);
  }
}

async function readAuthorizedApps() {
  if (typeof getStaffPortalSession !== "function" || typeof getAlteaLaunchpadApps !== "function") {
    throw new PublicError(
      "ALTEA_WEB_FACADE_MISMATCH",
      "The published ALTEA authorization service is unavailable. Publish the Launchpad controller and staff-auth web module together."
    );
  }
  const session = unwrapResult(await getStaffPortalSession());
  if (!isRecord(session) || typeof session.loggedIn !== "boolean") {
    throw new PublicError("ALTEA_RESPONSE_INVALID", "The staff-session service returned an invalid response.");
  }
  if (!session.loggedIn) {
    throw new PublicError("STAFF_AUTH_REQUIRED", "Your staff session has expired. Sign in again.");
  }
  if (session.authorized !== true) {
    const reason = safeCode(session.reason, "STAFF_ACCESS_DENIED");
    throw new PublicError(
      reason,
      reason.startsWith("SUPABASE_")
        ? "The staff authorization service is unavailable. Select Retry to reconnect."
        : "Your staff account is not authorized for RIAINTRA. Contact your administrator if this is unexpected."
    );
  }

  const result = unwrapResult(await getAlteaLaunchpadApps());
  if (!isRecord(result) || result.ok !== true || !Array.isArray(result.apps)) {
    throw new PublicError("ALTEA_RESPONSE_INVALID", "The authorization service returned an invalid application list.");
  }
  const apps = result.apps.map(cleanApp);
  if (apps.some(app => !app) || new Set(apps.map(app => app.id)).size !== apps.length) {
    throw new PublicError("ALTEA_RESPONSE_INVALID", "The authorization service returned an invalid application list.");
  }
  return {
    version: VERSION,
    apps,
    profile: publicProfile(result.profile || session.profile),
    accessRole: cleanText(result.accessRole || session.accessRole, 80),
    permissionPreset: cleanText(result.permissionPreset || session.permissionPreset, 100)
  };
}

async function bootstrapLaunchpad(requestId) {
  if (navigatingRequestId) {
    throw new PublicError("ALTEA_REQUEST_BUSY", "Wait for the current application launch to finish.");
  }
  if (lastBootstrap?.requestId === requestId) {
    postToEmbed("ALTEA_LAUNCHPAD_BOOTSTRAP", lastBootstrap.payload, requestId);
    return;
  }
  if (activeBootstrapId === requestId) return;

  const generation = ++bootstrapGeneration;
  activeBootstrapId = requestId;
  authorizedApps.clear();
  lastBootstrap = null;
  if (!bootstrapPromise) {
    bootstrapPromise = withTimeout(readAuthorizedApps(), SERVICE_TIMEOUT_MS)
      .finally(() => { bootstrapPromise = null; });
  }
  try {
    const payload = await bootstrapPromise;
    if (generation !== bootstrapGeneration) return;
    authorizedApps = new Map(payload.apps.map(app => [app.id, app]));
    lastBootstrap = { requestId, payload };
    postToEmbed("ALTEA_LAUNCHPAD_BOOTSTRAP", payload, requestId);
  } catch (error) {
    if (generation === bootstrapGeneration) throw error;
  } finally {
    if (generation === bootstrapGeneration) activeBootstrapId = "";
  }
}

async function handleNavigate(payload, requestId) {
  if (completedNavigationId === requestId || navigatingRequestId === requestId) return;
  if (navigatingRequestId || activeBootstrapId) {
    throw new PublicError("ALTEA_REQUEST_BUSY", "Wait for the current authorization check to finish.");
  }
  const app = authorizedApps.get(cleanText(payload.appId, 80));
  if (!app || !cleanPath(payload.path) || app.path !== payload.path) {
    throw new PublicError("ALTEA_APP_NOT_AUTHORIZED", "This application is not authorized for your current access profile.");
  }
  if (app.available === false) {
    throw new PublicError("ALTEA_APP_UNAVAILABLE", app.unavailableReason || "This application is not yet available.");
  }

  // Lock before the first await. An embed cannot launch twice during validation.
  navigatingRequestId = requestId;
  try {
    const latest = await withTimeout(readAuthorizedApps(), SERVICE_TIMEOUT_MS);
    authorizedApps = new Map(latest.apps.map(item => [item.id, item]));
    lastBootstrap = null;
    const target = authorizedApps.get(app.id);
    if (target?.available === false) {
      postToEmbed("ALTEA_LAUNCHPAD_BOOTSTRAP", latest, requestId);
      throw new PublicError("ALTEA_APP_UNAVAILABLE", target.unavailableReason || "This application is not yet available.");
    }
    if (!target || target.path !== app.path) {
      postToEmbed("ALTEA_LAUNCHPAD_BOOTSTRAP", latest, requestId);
      throw new PublicError(
        "ALTEA_APP_ACCESS_CHANGED",
        "Your access to this application has changed. The application list has been refreshed."
      );
    }
    try {
      await withTimeout(Promise.resolve(wixLocationFrontend.to(target.path)), 5000);
    } catch (_) {
      throw new PublicError("ALTEA_NAVIGATION_FAILED", "The application could not be opened. Try again.");
    }
    completedNavigationId = requestId;
    postToEmbed("ALTEA_LAUNCHPAD_NAVIGATING", { appId: target.id, path: target.path }, requestId);
  } finally {
    navigatingRequestId = "";
  }
}

async function reportError(error, requestId) {
  const failure = publicError(error);
  if (!["ALTEA_REQUEST_BUSY", "ALTEA_APP_ACCESS_CHANGED", "ALTEA_APP_UNAVAILABLE"].includes(failure.code)) {
    authorizedApps.clear();
    lastBootstrap = null;
  }
  postToEmbed("ALTEA_LAUNCHPAD_ERROR", failure, requestId);
  if (failure.code === "STAFF_AUTH_REQUIRED") {
    try {
      await withTimeout(Promise.resolve(wixLocationFrontend.to(SITE_MAP.staffLogin)), 5000);
    } catch (_) {
      postToEmbed("ALTEA_LAUNCHPAD_ERROR", {
        code: "ALTEA_LOGIN_REDIRECT_FAILED",
        message: "Open RIAINTRA to sign in again, then return to the Launchpad."
      }, requestId);
    }
  }
}

function withTimeout(promise, milliseconds) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new PublicError(
      "ALTEA_SERVICE_TIMEOUT",
      "The authorization service did not respond in time. Select Retry to reconnect."
    )), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function resolveHtmlEmbed() {
  for (const id of EMBED_IDS) {
    try {
      const candidate = $w(id);
      if (candidate && typeof candidate.onMessage === "function" && typeof candidate.postMessage === "function") return candidate;
    } catch (_) {}
  }
  return null;
}

function postToEmbed(type, payload = {}, requestId = "") {
  if (!html) return;
  html.postMessage({ source: PARENT_SOURCE, type, payload, requestId, timestamp: new Date().toISOString() });
}

function cleanApp(raw) {
  if (!isRecord(raw)) return null;
  const id = cleanText(raw.id, 80);
  const path = cleanPath(raw.path);
  if (!id || !path) return null;
  return {
    id,
    title: cleanText(raw.title || id, 160),
    description: cleanText(raw.description, 600),
    icon: cleanText(raw.icon || "arrow", 40),
    code: cleanText(raw.code || id, 80),
    accent: /^#[0-9a-f]{6}$/i.test(String(raw.accent || "")) ? String(raw.accent) : "#005eb8",
    available: raw.available !== false,
    unavailableReason: raw.available === false ? cleanText(raw.unavailableReason, 240) : "",
    path
  };
}

function publicProfile(profile) {
  if (!isRecord(profile)) return null;
  return {
    agentId: cleanText(profile.agentId || profile.skId, 20),
    skId: cleanText(profile.skId || profile.agentId, 20),
    firstName: cleanText(profile.firstName, 120),
    lastName: cleanText(profile.lastName, 120),
    preferredName: cleanText(profile.preferredName, 120),
    displayName: cleanText(profile.displayName, 180),
    jobTitle: cleanText(profile.jobTitle, 180),
    accessRole: cleanText(profile.accessRole, 80),
    baseCode: cleanText(profile.baseCode, 80),
    station: cleanText(profile.station, 80)
  };
}

function cleanPath(value) {
  const path = cleanText(value, 240);
  if (!path.startsWith("/riaintra/") || !isSafeInternalRoute(path)) return "";
  try {
    const decoded = decodeURIComponent(path);
    if (decoded.includes("//") || decoded.includes("..") || /[\\\x00-\x1f\x7f]/.test(decoded)) return "";
  } catch (_) { return ""; }
  return path;
}

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function safeCode(value, fallback = "ALTEA_SERVICE_UNAVAILABLE") {
  const code = cleanText(value, 100);
  return /^[A-Z][A-Z0-9_]{0,99}$/.test(code) ? code : fallback;
}

function parseMessage(value) {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch (_) { return null; }
  }
  return isRecord(value) ? value : null;
}

function unwrapResult(value) {
  if (!isRecord(value)) return value;
  if ("loggedIn" in value || "apps" in value) return value;
  for (const key of ["payload", "data", "result"]) {
    if (isRecord(value[key])) return value[key];
  }
  return value;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function publicError(error) {
  if (error instanceof PublicError) return { code: error.code, message: error.message };
  const code = safeCode(error?.code);
  if (code === "STAFF_AUTH_REQUIRED") return { code, message: "Your staff session has expired. Sign in again." };
  if (code.startsWith("STAFF_") || code === "WIX_MEMBER_LINK_MISMATCH") {
    return { code, message: "Your staff account cannot access ALTEA. Sign in again or contact your administrator." };
  }
  return { code, message: "The ALTEA authorization service could not be reached. Select Retry to reconnect." };
}

class PublicError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PublicError";
    this.code = code;
  }
}

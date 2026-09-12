// /src/pages/ALTEA Launchpad.<WIX_PAGE_ID>.js
// Canonical Backend Base 1.0 / B-002 ALTEA launchpad bridge.
// HTML candidates: #alteaOpsEmbed (historical/current ALTEA page),
// #alteaLaunchpadEmbed, #alteaMasterEmbed.

import wixLocationFrontend from "wix-location-frontend";
import {
  getStaffPortalSession,
  getAlteaLaunchpadApps
} from "backend/SKANDI_CORE/staffAuth.web";

const EMBED_IDS = ["#alteaOpsEmbed", "#alteaLaunchpadEmbed", "#alteaMasterEmbed"];
const CHILD_SOURCE = "SKANDI_ALTEA_LAUNCHPAD";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

let html = null;
let bootstrapPromise = null;
let authorizedApps = new Map();
let navigating = false;

$w.onReady(function () {
  html = resolveHtmlEmbed();
  if (!html) {
    console.error("[ALTEA Launchpad] No supported HTML embed was found.");
    return;
  }

  html.onMessage(handleEmbedMessage);
  void bootstrapLaunchpad();
});

async function handleEmbedMessage(event) {
  const msg = event?.data || {};
  if (msg.source !== CHILD_SOURCE) return;

  const payload = isRecord(msg.payload) ? msg.payload : {};
  const requestId = cleanRequestId(msg.requestId);

  try {
    if (msg.type === "ALTEA_LAUNCHPAD_READY" || msg.type === "ALTEA_LAUNCHPAD_REFRESH") {
      await bootstrapLaunchpad(requestId);
      return;
    }

    if (msg.type === "ALTEA_LAUNCHPAD_NAVIGATE") {
      await handleNavigate(payload, requestId);
    }
  } catch (error) {
    postToEmbed("ALTEA_LAUNCHPAD_ERROR", { message: cleanError(error) }, requestId);
  }
}

async function bootstrapLaunchpad(requestId = "") {
  if (!html) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const session = unwrapResult(await getStaffPortalSession());

    if (session?.loggedIn !== true) {
      redirectToLogin();
      return;
    }

    if (session?.authorized !== true) {
      postToEmbed("ALTEA_LAUNCHPAD_ERROR", {
        message: "Your staff account is not authorized for RIAINTRA."
      }, requestId);
      return;
    }

    const result = unwrapResult(await getAlteaLaunchpadApps());
    const apps = Array.isArray(result?.apps)
      ? result.apps.map(cleanApp).filter(Boolean)
      : [];

    authorizedApps = new Map(apps.map((app) => [app.id, app]));

    postToEmbed("ALTEA_LAUNCHPAD_BOOTSTRAP", {
      apps,
      profile: publicProfile(result?.profile || session?.profile),
      accessRole: cleanText(result?.accessRole || session?.accessRole, 80),
      permissionPreset: cleanText(result?.permissionPreset || session?.permissionPreset, 100)
    }, requestId);
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

async function handleNavigate(payload, requestId) {
  if (navigating) return;

  const appId = cleanText(payload.appId, 80);
  const requestedPath = cleanPath(payload.path);
  const app = authorizedApps.get(appId);

  if (!app || !requestedPath || app.path !== requestedPath) {
    throw new PublicError("This ALTEA application is not authorized for your current access profile.");
  }

  // Revalidate the current session immediately before navigation. The browser
  // cannot grant itself access by replaying a tile message from a stale embed.
  const session = unwrapResult(await getStaffPortalSession());
  if (session?.loggedIn !== true) {
    redirectToLogin();
    return;
  }
  if (session?.authorized !== true) {
    throw new PublicError("Your RIAINTRA session is no longer authorized.");
  }

  const latest = unwrapResult(await getAlteaLaunchpadApps());
  const stillAuthorized = Array.isArray(latest?.apps)
    ? latest.apps.map(cleanApp).filter(Boolean).find((item) => item.id === app.id && item.path === app.path)
    : null;

  if (!stillAuthorized) {
    authorizedApps.delete(app.id);
    await bootstrapLaunchpad(requestId);
    throw new PublicError("Your access to this ALTEA application has changed. The launchpad has been refreshed.");
  }

  navigating = true;
  wixLocationFrontend.to(app.path);
}

function resolveHtmlEmbed() {
  for (const id of EMBED_IDS) {
    try {
      const candidate = $w(id);
      if (candidate && typeof candidate.onMessage === "function" && typeof candidate.postMessage === "function") {
        return candidate;
      }
    } catch (_) {
      // Candidate ID is not present on this Wix page generation.
    }
  }
  return null;
}

function postToEmbed(type, payload = {}, requestId = "") {
  if (!html) return;
  const message = {
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  };
  if (requestId) message.requestId = requestId;
  html.postMessage(message);
}

function redirectToLogin() {
  if (navigating) return;
  navigating = true;
  wixLocationFrontend.to(LOGIN_PATH);
}

function cleanApp(raw = {}) {
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
    path
  };
}

function publicProfile(profile) {
  if (!isRecord(profile)) return null;
  return {
    skId: cleanText(profile.skId, 20),
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
  if (!path.startsWith("/riaintra/")) return "";
  if (path.includes("//") || path.includes("\\") || path.includes("..")) return "";
  return path;
}

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanRequestId(value) {
  return typeof value === "string" ? value.slice(0, 100) : "";
}

function unwrapResult(value) {
  if (!isRecord(value)) return value;
  if (
    Object.prototype.hasOwnProperty.call(value, "loggedIn") ||
    Object.prototype.hasOwnProperty.call(value, "authorized") ||
    Object.prototype.hasOwnProperty.call(value, "apps")
  ) {
    return value;
  }
  for (const key of ["payload", "data", "result"]) {
    if (isRecord(value[key])) return value[key];
  }
  return value;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanError(error) {
  if (error instanceof PublicError) return error.message;

  const text = [error?.code, error?.message, error]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  if (text.includes("auth") || text.includes("login") || text.includes("member")) {
    return "Your RIAINTRA session has expired. Sign in again.";
  }
  if (text.includes("forbidden") || text.includes("not authorized") || text.includes("access denied")) {
    return "This ALTEA application is not authorized for your current access profile.";
  }
  if (text.includes("network") || text.includes("timeout") || text.includes("fetch")) {
    return "The ALTEA authorization service could not be reached. Try again.";
  }
  return "The ALTEA launchpad could not be loaded. Try again.";
}

class PublicError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublicError";
  }
}

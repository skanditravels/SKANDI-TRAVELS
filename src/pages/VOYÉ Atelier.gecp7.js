// Wix page code
// Suggested route: /voy-magazine
// HTML Component ID: #voyMagazineEmbed

import wixLocation from "wix-location";
import {
  getVoyPublicBootstrap,
  trackVoyInteraction,
  saveVoyIssueForMember
} from "backend/FINAL/voyMagazineService.web";

const EMBED_ID = "#voyMagazineEmbed";
const CHILD_SOURCE = "SKANDI_VOY_MAGAZINE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const ALLOWED_PUBLIC_PREFIXES = [
  "/destinations",
  "/signature-collection",
  "/hotels",
  "/flights",
  "/tours",
  "/activities",
  "/transfers",
  "/packages",
  "/my-trip",
  "/plan-your-trip",
  "/voy-magazine",
  "/about/contact",
  "/about/support"
];

let embed = null;
let bootstrapPromise = null;

function send(type, payload = {}) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function allowedPublicPath(path) {
  const value = String(path || "").trim();
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    ALLOWED_PUBLIC_PREFIXES.some(
      (prefix) => value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}?`)
    )
  );
}

async function loadMagazine(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;
  bootstrapPromise = getVoyPublicBootstrap();
  try {
    const result = await bootstrapPromise;
    if (!result || result.ok === false) {
      throw new Error(result?.error || "VOY bootstrap failed.");
    }
    send("VOY_BOOTSTRAP_RESULT", {
      ...result,
      requestedIssue: wixLocation.query?.issue || ""
    });
    return result;
  } finally {
    bootstrapPromise = null;
  }
}

async function track(type, payload) {
  if (!payload.issueId) return;
  try {
    await trackVoyInteraction({
      issueId: payload.issueId,
      interactionId: payload.interactionId || "",
      eventType: type,
      page: payload.page || null,
      metadata: {
        label: payload.label || "",
        interactionType: payload.type || "",
        path: payload.path || ""
      }
    });
  } catch (error) {
    // Analytics is best-effort and must never block reading the magazine.
    console.warn("[VOY] Interaction tracking failed.", error);
  }
}

$w.onReady(function () {
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[VOY] Missing HTML Component ${EMBED_ID}.`, error);
    return;
  }

  embed.onMessage(async (event) => {
    const message = event?.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const type = message.type || "";
    const payload =
      message.payload && typeof message.payload === "object"
        ? message.payload
        : message;

    try {
      if (type === "VOY_READY") {
        await loadMagazine();
        return;
      }

      if (type === "VOY_REFRESH") {
        await loadMagazine(true);
        return;
      }

      if (type === "VOY_NAVIGATE") {
        if (allowedPublicPath(payload.path)) wixLocation.to(payload.path);
        return;
      }

      if (type === "VOY_ISSUE_OPENED") {
        await track("ISSUE_OPENED", payload);
        return;
      }

      if (type === "VOY_INTERACTION_CLICKED") {
        await track("INTERACTION_CLICKED", payload);
        return;
      }

      if (type === "VOY_SAVE_ISSUE") {
        const result = await saveVoyIssueForMember({ issueId: payload.issueId });
        send("VOY_ISSUE_SAVED", result);
        return;
      }

      if (type === "VOY_SHARE_ISSUE") {
        await track("ISSUE_SHARED", payload);
        return;
      }

      if (type.startsWith("VOY_INTERACTIVE_")) {
        await track(type, payload);
      }
    } catch (error) {
      send("VOY_ERROR", {
        message: userMessage(error)
      });
    }
  });

  void loadMagazine();
});

function userMessage(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.includes("VOY_NOT_AUTHENTICATED")) {
    return "Sign in to your SKANDI account to save this issue.";
  }
  if (message.includes("VOY_PUBLIC_ORGANIZATION_NOT_CONFIGURED")) {
    return "VOY Magazine is not configured for public publishing yet.";
  }
  return "VOY Magazine could not complete that action. Please try again.";
}

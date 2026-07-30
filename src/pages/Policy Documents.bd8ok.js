import { getPublicLegalDocument } from "src/backend/LEGAL/legalPolicyService.web";
import { sbInsert, sbSelect, sbUpdate, eq, and, order } from "src/backend/supabaseClient";
import { uid, nowIso } from "src/backend/core/response";

// Map each Multi-State Box state to its respective embed ID and legal policy type
const STATE_CONFIG = {
  legalCookies: { embedId: "#legalCookiesEmbed", type: "cookies" },
  legalPrivacy: { embedId: "#legalPrivacyEmbed", type: "privacy" },
  legalDisclaimer: { embedId: "#legalDisclaimerEmbed", type: "disclaimer" },
  legalBooking: { embedId: "#legalBookingEmbed", type: "booking" },
  legalAccessibility: { embedId: "#legalAccessibilityEmbed", type: "accessibility" }
};

const HTML_SOURCE = "SKANDI_LEGAL_DOCUMENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const TABLE = "customer_notifications";

function getCurrentConfig() {
  const currentState = $w("#legalMultiDoc").currentState?.id;
  return STATE_CONFIG[currentState] || STATE_CONFIG.legalCookies;
}

function send(type, payload = {}) {
  const config = getCurrentConfig();
  $w(config.embedId).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

async function load() {
  try {
    const config = getCurrentConfig();
    send("LEGAL_DOCUMENT_DATA", await getPublicLegalDocument({ type: config.type }));
  } catch (error) {
    send("LEGAL_ERROR", { message: "This legal document is temporarily unavailable." });
  }
}

$w.onReady(function () {
  // Listen for state changes inside the multi-state box
  $w("#legalMultiDoc").onStateChanged(() => {
    load();
  });

  // Attach message listener to all relevant embeds or the current one
  Object.values(STATE_CONFIG).forEach(config => {
    const embed = $w(config.embedId);
    if (embed) {
      embed.onMessage(async (event) => {
        const msg = event.data || {};
        if (msg.source && msg.source !== HTML_SOURCE) return;
        if (msg.type === "LEGAL_DOCUMENT_READY" || msg.type === "LEGAL_DOCUMENT_REFRESH") await load();
      });
    }
  });

  load();
});

// Your backend notification exports remain untouched below
export async function createNotification(data = {}) {
  const rows = await sbInsert(TABLE, {
    notification_id: uid("NOTIF"),
    member_id: data.memberId || null,
    wix_member_id: data.wixMemberId || null,
    supabase_user_id: data.supabaseUserId || null,
    type: data.type || "General",
    title: data.title || "Notification",
    message: data.message || "",
    action_path: data.actionPath || "",
    entity_type: data.entityType || "",
    entity_id: data.entityId || "",
    read: false,
    payload: data.payload || {},
    created_at: nowIso(),
    updated_at: nowIso()
  });

  return rows?.[0] || null;
}

export async function listNotifications(memberId) {
  return sbSelect(
    TABLE,
    `select=*&${eq("member_id", memberId)}&${order("created_at", "desc")}&limit=50`
  );
}

export async function markNotificationRead(memberId, notificationId) {
  return sbUpdate(
    TABLE,
    and(eq("member_id", memberId), eq("notification_id", notificationId)),
    { read: true, updated_at: nowIso() }
  );
}

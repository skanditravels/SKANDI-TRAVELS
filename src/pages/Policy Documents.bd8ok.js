import { getPublicLegalDocument } from "src/backend/LEGAL/legalPolicyService.web";
import { sbInsert, sbSelect, sbUpdate, eq, and, order } from "src/backend/supabaseClient";
import { uid, nowIso } from "src/backend/core/response";

const EMBED_ID = "#legalCookiesEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_DOCUMENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LEGAL_TYPE = "cookies";
const TABLE = "customer_notifications";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

async function load() {
  try {
    send("LEGAL_DOCUMENT_DATA", await getPublicLegalDocument({ type: LEGAL_TYPE }));
  } catch (error) {
    send("LEGAL_ERROR", { message: "This legal document is temporarily unavailable." });
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source && msg.source !== HTML_SOURCE) return;
    if (msg.type === "LEGAL_DOCUMENT_READY" || msg.type === "LEGAL_DOCUMENT_REFRESH") await load();
  });
  load();
});




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

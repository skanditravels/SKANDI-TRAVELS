// Page path: /riaintra/super-admin-control
// HTML Component ID: #superAdminControlEmbed

import {
  getSuperAdminAuditLog,
  getSuperAdminAuthUsers,
  getSuperAdminBootstrap,
  getSuperAdminStorageBuckets,
  getSuperAdminStorageObjects,
  getSuperAdminTableRows,
  runSuperAdminAuthMutation,
  runSuperAdminRecordMutation,
  runSuperAdminStorageMutation
} from "backend/SUPERADMIN/superAdminControl.web";

const EMBED_ID = "#superAdminControlEmbed";
const HTML_SOURCE = "SKANDI_SUPER_ADMIN_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function getEmbed() {
  try {
    return $w(EMBED_ID);
  } catch (error) {
    console.error(`[SuperAdminPage] Missing HTML Component ${EMBED_ID}.`);
    return null;
  }
}

function post(embed, type, payload = {}, requestId = null) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId,
    payload,
    timestamp: new Date().toISOString()
  });
}

function safeError(error) {
  return {
    code: String(error?.code || "SUPER_ADMIN_ERROR"),
    message: String(
      error?.message || "The super-admin request could not be completed."
    )
  };
}

async function dispatch(type, payload) {
  switch (type) {
    case "BOOTSTRAP":
      return getSuperAdminBootstrap(payload || {});
    case "LOAD_TABLE_ROWS":
      return getSuperAdminTableRows(payload || {});
    case "MUTATE_RECORD":
      return runSuperAdminRecordMutation(payload || {});
    case "LOAD_AUDIT":
      return getSuperAdminAuditLog(payload || {});
    case "LOAD_AUTH_USERS":
      return getSuperAdminAuthUsers(payload || {});
    case "MUTATE_AUTH_USER":
      return runSuperAdminAuthMutation(payload || {});
    case "LOAD_STORAGE_BUCKETS":
      return getSuperAdminStorageBuckets();
    case "LOAD_STORAGE_OBJECTS":
      return getSuperAdminStorageObjects(payload || {});
    case "MUTATE_STORAGE":
      return runSuperAdminStorageMutation(payload || {});
    case "PING":
      return { ok: true, timestamp: new Date().toISOString() };
    default: {
      const error = new Error(`Unsupported super-admin message: ${type}`);
      error.code = "UNSUPPORTED_MESSAGE";
      throw error;
    }
  }
}

$w.onReady(function () {
  const embed = getEmbed();
  if (!embed) return;

  embed.onMessage(async (event) => {
    const message = event?.data;
    if (!message || message.source !== HTML_SOURCE) return;

    const type = String(message.type || "");
    const requestId = String(message.requestId || "");
    if (!type || !requestId) return;

    try {
      const data = await dispatch(type, message.payload || {});
      post(embed, "RESULT", { ok: true, data }, requestId);
    } catch (error) {
      console.error(`[SuperAdminPage:${type}]`, error);
      post(
        embed,
        "RESULT",
        { ok: false, error: safeError(error) },
        requestId
      );
    }
  });

  post(embed, "PARENT_READY", {
    embedId: EMBED_ID,
    pagePath: "/riaintra/super-admin-control"
  });
});

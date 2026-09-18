// /src/pages/MEDIA Control.chm91.js
// B-011.16 — supplied Media Control / VOY embed bridged to the canonical Supabase Asset Library.

import wixLocation from "wix-location";
import {
  listAssets,
  checkAssetDuplicate,
  prepareAssetUpload,
  finalizeAssetUpload,
  getAssetAccessUrl,
  registerAssetUsage,
  archiveAsset
} from "backend/SKANDI_CORE/assets.web.js";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap.js";

const EMBED_ID = "#mediaControlEmbed";
const CHILD_SOURCES = new Set(["SKANDI_MEDIA_CONTROL", "SKANDI_NEWSROOM_CONTROL"]);
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}
function safeError(error) {
  const message = String(error?.message || error?.details?.applicationError?.description || "").trim();
  return { code: String(error?.code || "MEDIA_CONTROL_ACTION_FAILED"), message: message && message.length <= 420 ? message : "Media Control action failed." };
}
async function sendLibrary(payload = {}, responseType = "MEDIA_CONTROL_LIBRARY") {
  const result = await listAssets({
    visibility: payload.visibility || "",
    assetType: payload.assetType || "",
    libraryRoot: payload.libraryRoot || "",
    libraryFolder: payload.libraryFolder || "",
    category: payload.category || "",
    search: payload.query || payload.search || ""
  });
  send(responseType, result);
  return result;
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async event => {
    const msg = event?.data || {};
    const source = String(msg.source || "");
    if (source && !CHILD_SOURCES.has(source)) return;
    const type = String(msg.type || "");
    const payload = msg.payload && typeof msg.payload === "object" ? msg.payload : {};
    try {
      switch (type) {
        case "MEDIA_CONTROL_READY":
        case "MEDIA_CONTROL_LIST":
          await sendLibrary(payload);
          return;
        case "MEDIA_CONTROL_DUPLICATE_CHECK":
          send("MEDIA_CONTROL_DUPLICATE_RESULT", await checkAssetDuplicate(payload));
          return;
        case "MEDIA_CONTROL_UPLOAD_PREPARE":
          send("MEDIA_CONTROL_UPLOAD_READY", await prepareAssetUpload(payload));
          return;
        case "MEDIA_CONTROL_UPLOAD_FINALIZE":
          send("MEDIA_CONTROL_UPLOAD_COMPLETE", await finalizeAssetUpload(payload));
          return;
        case "MEDIA_CONTROL_ACCESS_URL": {
          const result = await getAssetAccessUrl(payload);
          send("MEDIA_CONTROL_ACCESS_URL_RESULT", { ...result, assetId: payload.assetId || "", purpose: payload.purpose || "open" });
          return;
        }
        case "MEDIA_CONTROL_REGISTER_USAGE":
          send("MEDIA_CONTROL_USAGE_REGISTERED", await registerAssetUsage(payload));
          return;
        case "MEDIA_CONTROL_ARCHIVE":
          send("MEDIA_CONTROL_ARCHIVED", await archiveAsset(payload));
          return;

        // Shared VOY media contract. It resolves to the same SKANDI_CORE asset service.
        case "VOY_MEDIA_LIBRARY_REQUEST":
        case "VOY_ASSET_UPLOAD_OPEN_REQUEST":
          await sendLibrary(payload, "VOY_MEDIA_LIBRARY_RESULT");
          return;
        case "VOY_MEDIA_UPLOAD_CREATE": {
          const result = await prepareAssetUpload(payload);
          send("VOY_MEDIA_UPLOAD_READY", { ...result, clientRequestId: payload.clientRequestId || "" });
          return;
        }
        case "VOY_MEDIA_UPLOAD_FINALIZE":
          send("VOY_MEDIA_UPLOAD_COMPLETE", await finalizeAssetUpload(payload));
          return;
        case "VOY_MEDIA_REFRESH_URL": {
          const result = await getAssetAccessUrl(payload);
          send("VOY_MEDIA_REFRESH_URL_RESULT", {
            ...result,
            assetId: payload.assetId || "",
            purpose: payload.purpose || "preview"
          });
          return;
        }
        case "VOY_OPEN_MEDIA_CONTROL":
          wixLocation.to(SITE_MAP.mediaControl || SITE_MAP.magazineManager);
          return;
        case "MEDIA_CONTROL_NAVIGATE":
          if (isSafeInternalRoute(payload.path)) wixLocation.to(payload.path);
          return;
        default:
          return;
      }
    } catch (error) {
      const safe = safeError(error);
      send(type.startsWith("VOY_") ? "VOY_ADMIN_ERROR" : "MEDIA_CONTROL_ERROR", { action: type, ...safe });
    }
  });

  send("MEDIA_CONTROL_HOST_READY", { version: "B-011.16", route: SITE_MAP.mediaControl || SITE_MAP.magazineManager });
});

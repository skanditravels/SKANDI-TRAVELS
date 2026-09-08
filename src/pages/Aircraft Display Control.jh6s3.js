import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getAircraftControlBootstrap,
  getAircraftControlRecord,
  smartFillAircraft,
  saveAircraftControlAircraft,
  deleteAircraftControlAircraft,
  saveAircraftControlCabin,
  deleteAircraftControlCabin,
  saveAircraftControlView,
  deleteAircraftControlView,
  saveAircraftControlHotspot,
  deleteAircraftControlHotspot,
  saveAircraftControlScene,
  deleteAircraftControlScene,
  saveAircraftControlSceneHotspot,
  deleteAircraftControlSceneHotspot,
  syncAircraftCabinsFromConfiguration,
  smartSyncAircraftCatalog,
  createAircraftAssetUpload,
  completeAircraftAssetUpload
} from "backend/RIA/aircraftDisplayControl.web";

const HTML_ID = "#aircraftDisplayControlEmbed";
const CHILD_SOURCE = "SKANDI_AIRCRAFT_DISPLAY_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";
let bootstrapPromise = null;

function post(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId: requestId || "",
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function errorMessage(error) {
  return String(error?.message || error || "Aircraft Display Control request failed.");
}

async function requirePortalSession() {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }
  return session;
}

async function bootstrap(html, requestId = "") {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    const portalSession = await requirePortalSession();
    if (!portalSession) return;
    const payload = await getAircraftControlBootstrap();
    post(html, "AIRCRAFT_CONTROL_BOOTSTRAP", {
      ...payload,
      portalSession: payload.portalSession || payload.session || portalSession
    }, requestId);
  })();
  try { await bootstrapPromise; }
  finally { bootstrapPromise = null; }
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE || typeof msg.type !== "string") return;

    const type = msg.type;
    const payload = msg.payload && typeof msg.payload === "object" && !Array.isArray(msg.payload)
      ? msg.payload
      : {};
    const requestId = msg.requestId || payload.requestId || "";

    try {
      if (type === "AIRCRAFT_CONTROL_READY" || type === "AIRCRAFT_CONTROL_REFRESH") {
        await bootstrap(html, requestId);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_CREATE_ASSET_UPLOAD") {
        const result = await createAircraftAssetUpload(payload);
        post(html, "AIRCRAFT_CONTROL_ASSET_UPLOAD_READY", result, requestId);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_COMPLETE_ASSET_UPLOAD") {
        const result = await completeAircraftAssetUpload(payload);
        post(html, "AIRCRAFT_CONTROL_ASSET_UPLOADED", result, requestId);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_GET") {
        const result = await getAircraftControlRecord({ aircraftId: payload.aircraftId || "" });
        post(html, "AIRCRAFT_CONTROL_RECORD", result, requestId);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_SMART_FILL") {
        const result = await smartFillAircraft(payload);
        post(html, "AIRCRAFT_CONTROL_SMART_FILL_RESULT", result, requestId);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_SMART_SYNC_ALL") {
        const result = await smartSyncAircraftCatalog({
          buildMissingCabins: payload.buildMissingCabins !== false
        });
        post(html, "AIRCRAFT_CONTROL_SMART_SYNCED", result, requestId);
        await bootstrap(html);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_SYNC_CABINS") {
        const result = await syncAircraftCabinsFromConfiguration({
          aircraftId: payload.aircraftId || "",
          overwrite: payload.overwrite === true
        });
        post(html, "AIRCRAFT_CONTROL_CABINS_SYNCED", result, requestId);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_SAVE_AIRCRAFT") {
        const result = await saveAircraftControlAircraft(payload);
        post(html, "AIRCRAFT_CONTROL_SAVED", result, requestId);
        return;
      }

      if (type === "AIRCRAFT_CONTROL_DELETE_AIRCRAFT") {
        const result = await deleteAircraftControlAircraft({ id: payload.id || payload.aircraftId || "" });
        post(html, "AIRCRAFT_CONTROL_DELETED", result, requestId);
        return;
      }

      const childActions = {
        AIRCRAFT_CONTROL_SAVE_CABIN: saveAircraftControlCabin,
        AIRCRAFT_CONTROL_DELETE_CABIN: deleteAircraftControlCabin,
        AIRCRAFT_CONTROL_SAVE_VIEW: saveAircraftControlView,
        AIRCRAFT_CONTROL_DELETE_VIEW: deleteAircraftControlView,
        AIRCRAFT_CONTROL_SAVE_HOTSPOT: saveAircraftControlHotspot,
        AIRCRAFT_CONTROL_DELETE_HOTSPOT: deleteAircraftControlHotspot,
        AIRCRAFT_CONTROL_SAVE_SCENE: saveAircraftControlScene,
        AIRCRAFT_CONTROL_DELETE_SCENE: deleteAircraftControlScene,
        AIRCRAFT_CONTROL_SAVE_SCENE_HOTSPOT: saveAircraftControlSceneHotspot,
        AIRCRAFT_CONTROL_DELETE_SCENE_HOTSPOT: deleteAircraftControlSceneHotspot
      };

      const method = childActions[type];
      if (method) {
        const result = await method(payload);
        post(
          html,
          type.includes("_DELETE_") ? "AIRCRAFT_CONTROL_CHILD_DELETED" : "AIRCRAFT_CONTROL_CHILD_SAVED",
          result,
          requestId
        );
      }
    } catch (error) {
      post(html, "AIRCRAFT_CONTROL_ERROR", {
        message: errorMessage(error),
        failedType: type
      }, requestId);
    }
  });

  // Do not rely on the iframe READY message: iframe startup can precede Wix onReady.
  bootstrap(html).catch((error) => {
    post(html, "AIRCRAFT_CONTROL_ERROR", {
      message: errorMessage(error),
      failedType: "AIRCRAFT_CONTROL_BOOTSTRAP"
    });
  });
});

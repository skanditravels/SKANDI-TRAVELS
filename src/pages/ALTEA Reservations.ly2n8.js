// /src/pages/ALTEA Reservations.ly2n8.js
// SKANDI Recovery R-006.3 — systematic unified Reservations page bridge.
// HTML Embed: #alteaReservationsEmbed
//
// Page rule:
// - one application facade only: backend/SKANDI_CORE/reservations.web
// - no direct Duffel provider web-module imports
// - no document-renderer imports in frontend page code
// - generated document content is created by Reservations core and persisted
//   through the private Platform Asset Library lifecycle.

import wixLocation from "wix-location-frontend";
import { handleReservationsAction } from "backend/SKANDI_CORE/reservations.web";

const EMBED_ID = "#alteaReservationsEmbed";
const STAFF_LOGIN_PATH = "/riaintra";
const CHILD_SOURCE = "SKANDI_DUFFEL_RESERVATIONS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "R-006.3";

function parse(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function cleanRequestId(value) {
  const requestId = String(value || "");
  return /^[A-Za-z0-9_-]{1,100}$/.test(requestId) ? requestId : "";
}

function postToEmbed(embed, type, payload = {}, requestId = "") {
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    requestId,
    timestamp: new Date().toISOString()
  });
}

function errorCode(error) {
  const raw = String(
    error?.code ||
    error?.details?.applicationError?.code ||
    error?.message ||
    "ALTEA_ACTION_FAILED"
  ).toUpperCase();
  return raw.match(/[A-Z][A-Z0-9_]{2,80}/)?.[0] || "ALTEA_ACTION_FAILED";
}

function publicMessage(error, fallback = "The reservation action could not be completed.") {
  const raw =
    error?.publicMessage ||
    error?.details?.applicationError?.data?.message ||
    error?.details?.applicationError?.message ||
    error?.message ||
    fallback;
  const value = String(raw || "").trim();
  if (!value || /unable to handle the request/i.test(value)) return fallback;
  return value.slice(0, 600);
}

function progressFor(type) {
  const messages = {
    DUFFEL_SEARCH_OFFERS: "Searching live airline offers…",
    DUFFEL_REFRESH_OFFER: "Refreshing price and availability…",
    DUFFEL_PREPARE_PAYMENT: "Preparing secure payment…",
    DUFFEL_GET_ORDER: "Retrieving supplier order…",
    DUFFEL_CREATE_ORDER: "Creating supplier order…",
    DUFFEL_CREATE_CANCELLATION: "Calculating cancellation terms…",
    DUFFEL_CONFIRM_CANCELLATION: "Confirming cancellation…",
    DUFFEL_SEARCH_ORDER_CHANGES: "Searching airline change options…",
    DUFFEL_CREATE_ORDER_CHANGE: "Creating pending airline change…",
    DUFFEL_PREPARE_CHANGE_PAYMENT: "Preparing secure change payment…",
    DUFFEL_CONFIRM_ORDER_CHANGE: "Confirming supplier order change…",
    DUFFEL_SEARCH_STAYS: "Searching live hotel stays…",
    DUFFEL_FETCH_STAY_RATES: "Loading live room rates…",
    DUFFEL_QUOTE_STAY: "Confirming hotel price and availability…",
    DUFFEL_CREATE_STAY_BOOKING: "Creating hotel booking…",
    DUFFEL_CANCEL_STAY_BOOKING: "Cancelling hotel booking…",
    DUFFEL_SEARCH_CARS: "Searching live car rentals…",
    DUFFEL_QUOTE_CAR: "Confirming car price and availability…",
    DUFFEL_PREPARE_CAR_CARD: "Preparing secure supplier card entry…",
    DUFFEL_CREATE_CAR_BOOKING: "Creating car-rental booking…",
    DUFFEL_CANCEL_CAR_BOOKING: "Cancelling car-rental booking…",
    ALTEA_GENERATE_DOCUMENT: "Generating SKANDI document…",
    ALTEA_DCS_RECORD_DOCUMENT: "Generating SKANDI departure document…",
    ALTEA_TRANSFER_DCS_RECORD_DOCUMENT: "Generating SKANDI transfer document…",
    ALTEA_SEND_MANIFEST: "Generating operations manifest…"
  };
  return messages[type] || "";
}

async function runAction(type, payload = {}) {
  const result = await handleReservationsAction({ type, payload });
  return {
    responseType: result?.responseType || "",
    payload: result?.payload || {}
  };
}

async function uploadGeneratedAsset(assetUpload = {}) {
  const upload = assetUpload?.upload || {};
  const signedUrl = String(upload?.signedUrl || "").trim();
  const content = assetUpload?.content;
  if (!assetUpload?.requestId || !signedUrl || typeof content !== "string") {
    throw new Error("GENERATED_ASSET_UPLOAD_CONTRACT_INVALID");
  }

  const response = await fetch(signedUrl, {
    method: String(upload?.method || "PUT").toUpperCase(),
    headers: {
      "Content-Type": String(assetUpload?.mimeType || upload?.contentType || "text/html"),
      "cache-control": String(upload?.cacheControl || "3600"),
      "x-upsert": "false"
    },
    body: content
  });

  if (!response.ok) {
    const error = new Error(`GENERATED_ASSET_UPLOAD_HTTP_${response.status}`);
    error.code = `GENERATED_ASSET_UPLOAD_HTTP_${response.status}`;
    throw error;
  }
}

async function finalizeGeneratedAsset(embed, originalPayload, result, requestId) {
  const payload = result?.payload || {};
  const assetUpload = payload?.assetUpload;
  if (!assetUpload?.requestId) return;

  try {
    await uploadGeneratedAsset(assetUpload);
    const finalized = await runAction("ALTEA_FINALIZE_GENERATED_ASSET", {
      requestId: assetUpload.requestId,
      bookingId: originalPayload?.bookingId || payload?.document?.bookingId || "",
      documentId: assetUpload.documentId || payload?.document?.id || "",
      manifestId: assetUpload.manifestId || payload?.manifest?.id || ""
    });

    // Do not emit ALTEA_BOOKING_RESULT here: that message navigates the current
    // HTML away from Ticketing. Use the update contract so the current view
    // refreshes without changing tabs.
    if (finalized?.payload?.workspace) {
      postToEmbed(
        embed,
        "ALTEA_DOCUMENT_UPDATED",
        { workspace: finalized.payload.workspace, asset: finalized.payload.asset || null },
        ""
      );
    }
    postToEmbed(
      embed,
      "ALTEA_GENERATED_ASSET_FINALIZED",
      finalized?.payload || {},
      requestId
    );
  } catch (error) {
    console.error("[ALTEA R-006.3] Generated asset finalization failed after document creation.", error);
    postToEmbed(
      embed,
      "ALTEA_ASSET_WARNING",
      {
        code: errorCode(error),
        message: "The document was created, but private file storage could not be finalized."
      },
      requestId
    );
  }
}

function isGeneratedFileAction(type) {
  return [
    "ALTEA_GENERATE_DOCUMENT",
    "ALTEA_DCS_RECORD_DOCUMENT",
    "ALTEA_TRANSFER_DCS_RECORD_DOCUMENT",
    "ALTEA_SEND_MANIFEST"
  ].includes(type);
}

$w.onReady(() => {
  const embed = $w(EMBED_ID);

  // Listener first: never allow the iframe ready event to outrun the Wix bridge.
  embed.onMessage(async (event) => {
    const input = parse(event?.data);
    if (!input || input.source !== CHILD_SOURCE) return;

    const type = String(input.type || "").toUpperCase();
    const payload = input.payload && typeof input.payload === "object" ? input.payload : {};
    const requestId = cleanRequestId(input.requestId);

    if (type === "MASTER_NAVIGATE") {
      const path = String(payload?.path || input?.path || "").trim();
      if (path.startsWith("/") && !path.startsWith("//")) wixLocation.to(path);
      return;
    }

    const progress = progressFor(type);
    if (progress) postToEmbed(embed, "DUFFEL_PROGRESS", { message: progress }, requestId);

    try {
      const result = await runAction(type, payload);

      // Visibility first. The HTML receives the canonical document/workspace
      // result before private file finalization is attempted.
      if (result.responseType) {
        postToEmbed(embed, result.responseType, result.payload, requestId);
      }

      if (isGeneratedFileAction(type)) {
        await finalizeGeneratedAsset(embed, payload, result, requestId);
      }
    } catch (error) {
      const code = errorCode(error);
      const providerAction = type.startsWith("DUFFEL_");
      console.error("[ALTEA R-006.3]", {
        type,
        code,
        message: String(error?.message || ""),
        error
      });

      postToEmbed(
        embed,
        providerAction ? "DUFFEL_ERROR" : "ALTEA_ERROR",
        {
          code,
          action: type,
          message: publicMessage(
            error,
            providerAction
              ? `Supplier action ${type} failed (${code}).`
              : `ALTEA action ${type} failed (${code}).`
          )
        },
        requestId
      );

      if (code === "AUTH_REQUIRED") wixLocation.to(STAFF_LOGIN_PATH);
    }
  });

  postToEmbed(embed, "DUFFEL_PARENT_READY", {
    embedId: EMBED_ID,
    version: VERSION,
    unified: true,
    oneApplicationFacade: true,
    providerWebMethodsPageBound: false,
    providerInternalized: true,
    inventoryControl: true,
    enterprise: true,
    transferDcs: true,
    skandiClub: true,
    documents: true,
    documentWorkspaceMetadataOnly: true,
    platformAssetDocuments: true
  });
});

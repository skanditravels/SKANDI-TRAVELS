// /src/pages/Inventory Control.jsdik.js
// SKANDI Inventory Control — B-011.35 bootstrap and refresh delivery recovery.
// Preferred HTML component: #inventoryControlEmbed.
//
// The page imports exactly one Wix web method. All action routing lives in
// backend/SKANDI_CORE/inventory.web.js so the page and backend cannot drift.

import { handleInventoryAction } from "backend/SKANDI_CORE/inventory.web";

const EMBED_IDS = "#inventoryControlEmbed";
const CHILD_SOURCE = "SKANDI_INVENTORY_EMBED";
const PARENT_SOURCE = "SKANDI_INVENTORY_PARENT";
const VERSION = "B-011.35-INVENTORY-SINGLE-DISPATCH";
const BOOTSTRAP_REUSE_MS = 15000;

let bootstrapPromise = null;
let bootstrapSnapshot = null;
let bootstrapSnapshotAt = 0;
let bootstrapGeneration = 0;
let readyDeliveryPending = false;

function findEmbed() {
  for (const id of EMBED_IDS) {
    try {
      const element = $w(id);
      if (
        element &&
        typeof element.onMessage === "function" &&
        typeof element.postMessage === "function"
      ) {
        return element;
      }
    } catch (_) {}
  }
  return null;
}

function parse(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }
  return value && typeof value === "object" ? value : null;
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function post(embed, type, payload = {}, requestId = "") {
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    requestId,
    timestamp: new Date().toISOString()
  });
}

function invalidateBootstrap() {
  bootstrapGeneration += 1;
  bootstrapSnapshot = null;
  bootstrapSnapshotAt = 0;
}

function validateDispatchResult(value, expectedType = "") {
  const result = object(value);
  const responseType = String(result.responseType || "").trim();

  if (!responseType) {
    const error = new Error("INVENTORY_DISPATCH_RESPONSE_INVALID");
    error.code = "INVENTORY_DISPATCH_RESPONSE_INVALID";
    error.publicMessage =
      "Inventory Control received an invalid response from its backend dispatcher.";
    throw error;
  }

  if (expectedType && responseType !== expectedType) {
    const error = new Error("INVENTORY_DISPATCH_RESPONSE_MISMATCH");
    error.code = "INVENTORY_DISPATCH_RESPONSE_MISMATCH";
    error.publicMessage =
      `Inventory Control expected ${expectedType} but received ${responseType}.`;
    throw error;
  }

  return {
    responseType,
    payload: object(result.payload),
    refreshBootstrap: result.refreshBootstrap === true
  };
}

function requireInventoryDispatcher() {
  if (typeof handleInventoryAction !== "function") {
    const error = new Error("INVENTORY_WEB_FACADE_MISMATCH");
    error.code = "INVENTORY_WEB_FACADE_MISMATCH";
    error.publicMessage =
      "Inventory Control page and backend are on different published versions. Publish Inventory Controldik and backend/SKANDI_CORE/inventory.web together.";
    throw error;
  }

  return handleInventoryAction;
}

async function dispatch(type, payload = {}) {
  const dispatcher = requireInventoryDispatcher();
  const response = await dispatcher({
    type,
    payload: object(payload)
  });
  return validateDispatchResult(response);
}

async function loadInventoryBootstrap({ force = false } = {}) {
  if (force) invalidateBootstrap();
  if (bootstrapSnapshot && Date.now() - bootstrapSnapshotAt < BOOTSTRAP_REUSE_MS) {
    return bootstrapSnapshot;
  }

  if (!bootstrapPromise) {
    const generation = bootstrapGeneration;
    bootstrapPromise = dispatch("INVENTORY_V9_REFRESH", {})
      .then(result => {
        if (result.responseType === "INVENTORY_ERROR") {
          const failure = new Error(result.payload.message || "Inventory bootstrap failed.");
          failure.code = result.payload.code || "INVENTORY_ERROR";
          failure.publicMessage = result.payload.message || "Inventory bootstrap failed.";
          throw failure;
        }
        const checked = validateDispatchResult(result, "INVENTORY_V9_BOOTSTRAP");
        if (checked.payload.ok !== true || !Array.isArray(checked.payload.records)) {
          const failure = new Error("INVENTORY_DISPATCH_RESPONSE_INVALID");
          failure.code = "INVENTORY_DISPATCH_RESPONSE_INVALID";
          throw failure;
        }
        // A save or explicit refresh can invalidate a read already in flight.
        // Only the current generation may populate or deliver the shared snapshot.
        if (generation !== bootstrapGeneration) return null;
        bootstrapSnapshot = checked.payload;
        bootstrapSnapshotAt = Date.now();
        return bootstrapSnapshot;
      })
      .catch(error => {
        if (generation !== bootstrapGeneration) return null;
        throw error;
      })
      .finally(() => { bootstrapPromise = null; });
  }

  const snapshot = await bootstrapPromise;
  return snapshot || loadInventoryBootstrap();
}

function errorPayload(error) {
  const code = String(
    error?.code ||
    error?.message ||
    "INVENTORY_ERROR"
  ).slice(0, 120);

  const friendly = {
    INVENTORY_AUTH_REQUIRED:
      "Your staff session has expired. Sign in again.",
    INVENTORY_ACCESS_DENIED:
      "You do not have access to Inventory Control.",
    INVENTORY_WRITE_ACCESS_DENIED:
      "Your role does not allow this Inventory change.",
    INVENTORY_DUPLICATE_CODE:
      "That code is already in use for this record family.",
    INVENTORY_DUPLICATE_SLUG:
      "That URL slug is already in use for this record family.",
    INVENTORY_PARENT_CYCLE:
      "That parent selection would create a geography loop.",
    INVENTORY_ASSET_LIBRARY_REQUIRED:
      "Choose this image from the SKANDI Asset Library. New direct image URLs are not accepted.",
    INVENTORY_PUBLIC_ASSET_REQUIRED:
      "Inventory website media must use a public Asset Library file.",
    INVENTORY_ASSET_NOT_FOUND:
      "The selected Asset Library file no longer exists or is archived.",
    INVENTORY_ASSET_ID_INVALID:
      "The selected Asset Library reference is invalid.",
    INVENTORY_ASSET_PUBLIC_URL_MISSING:
      "The selected public Asset Library file has no usable public URL.",
    ASSET_AUTH_REQUIRED:
      "Your staff session has expired. Sign in again.",
    ASSET_WRITE_ACCESS_DENIED:
      "Your role does not allow Asset Library uploads.",
    ASSET_MIME_NOT_ALLOWED:
      "That file type is not allowed in this Asset Library.",
    ASSET_FILE_TOO_LARGE:
      "That file exceeds the Asset Library size limit.",
    ASSET_FOLDER_REQUIRED:
      "Choose an Asset Library root and folder before uploading.",
    INVENTORY_PROVIDER_TYPE_UNSUPPORTED:
      "That Duffel reference type is not supported by Inventory Control.",
    INVENTORY_PROVIDER_IMPORT_TYPE_UNSUPPORTED:
      "That Duffel reference can be searched but is not importable into the current Inventory model.",
    INVENTORY_PROVIDER_CANONICAL_MATCH:
      "A matching SKANDI record already exists. Link Duffel to the existing record instead of creating a duplicate.",
    INVENTORY_NON_IATA_AIRLINE_SCHEMA_REQUIRED:
      "This airline has no IATA code. It can be used as Duffel reference data, but the current SKANDI airline store needs a separate internal-code field before it can be imported safely.",
    INVENTORY_DUFFEL_SOURCE_REQUIRED:
      "This record is not linked to a Duffel source resource and cannot be refreshed from Duffel.",
    INVENTORY_ACTION_NOT_SUPPORTED:
      "Inventory Control page and backend action contract are out of sync. Publish both replacement files together.",
    INVENTORY_WEB_FACADE_MISMATCH:
      "Inventory Control page and backend are on different published versions. Publish both replacement files together.",
    INVENTORY_DISPATCH_RESPONSE_INVALID:
      "Inventory Control received an invalid response from its backend dispatcher.",
    INVENTORY_DISPATCH_RESPONSE_MISMATCH:
      "Inventory Control page and backend response contract are out of sync.",
    REFERENCE_QUERY_REQUIRED:
      "Enter a search term.",
    NEGOTIATED_RATE_SCOPE_REQUIRED:
      "Choose a hotel chain or at least one accommodation for the negotiated rate.",
    NEGOTIATED_RATE_SCOPE_INVALID:
      "Choose either a hotel chain or specific accommodations, not both."
  };

  return {
    code,
    message:
      friendly[code] ||
      String(
        error?.publicMessage ||
        error?.message ||
        "Inventory request failed."
      ).slice(0, 700)
  };
}

$w.onReady(() => {
  const embed = findEmbed();

  if (!embed) {
    console.error("[SKANDI Inventory] #inventoryControlEmbed not found.");
    return;
  }

  // Listener is registered before HOST_READY to avoid the historical bridge race.
  embed.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || message.source !== CHILD_SOURCE) return;

    const payload = object(message.payload);
    const requestId = String(message.requestId || "");
    const isReady = message.type === "INVENTORY_V9_READY";
    if (isReady && readyDeliveryPending) return;
    if (isReady) readyDeliveryPending = true;

    try {
      if (isReady) {
        post(
          embed,
          "INVENTORY_V9_BOOTSTRAP",
          await loadInventoryBootstrap(),
          requestId
        );
        return;
      }

      post(
        embed,
        "INVENTORY_V9_PROGRESS",
        { action: message.type },
        requestId
      );

      if (message.type === "INVENTORY_V9_REFRESH") {
        post(embed, "INVENTORY_V9_BOOTSTRAP", await loadInventoryBootstrap({ force: true }), requestId);
        return;
      }

      const result = await dispatch(message.type, payload);
      if (result.responseType === "INVENTORY_ERROR") {
        const failure = new Error(result.payload.message || "Inventory request failed.");
        failure.code = result.payload.code || "INVENTORY_ERROR";
        failure.publicMessage = result.payload.message || "Inventory request failed.";
        throw failure;
      }

      post(
        embed,
        result.responseType,
        result.payload,
        requestId
      );

      if (result.refreshBootstrap) {
        post(
          embed,
          "INVENTORY_V9_BOOTSTRAP",
          await loadInventoryBootstrap({ force: true }),
          requestId
        );
      }
    } catch (error) {
      post(
        embed,
        "INVENTORY_ERROR",
        errorPayload(error),
        requestId
      );
    } finally {
      if (isReady) readyDeliveryPending = false;
    }
  });

  post(
    embed,
    "INVENTORY_V9_HOST_READY",
    {
      version: VERSION,
      embedId: embed.id || "",
      readyAt: new Date().toISOString()
    }
  );
});

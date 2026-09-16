// /src/backend/SKANDI_CORE/inventory.web.js
// SKANDI Inventory Control — canonical single-dispatch Wix web-method facade.
// B-011.14 — Inventory runtime boundary convergence.
//
// This file owns ONLY the frontend-callable action contract.
// Inventory, Asset Library, Supabase and Duffel business logic remain in SKANDI_CORE cores.

import { Permissions, webMethod } from "@wix/web-methods";

import {
  getInventoryBootstrapCore,
  getInventoryRecordCore,
  saveInventoryBundleCore,
  archiveInventoryRecordCore,
  getDatedInventoryCore,
  saveDatedInventoryCore,
  deleteDatedInventoryCore,
  getAirInventoryCore,
  saveAirInventoryRowCore,
  getAircraftRecordCore,
  saveAircraftCore,
  archiveAircraftCore,
  saveAircraftChildCore,
  archiveAircraftChildCore,
  smartSyncAircraftCore,
  getCabinNormalizationPreviewCore,
  getInventoryAuditCore,
  getInventoryQualityCore,
  searchInventoryProviderCore,
  getInventoryProviderResourceCore,
  importInventoryProviderResourceCore,
  refreshInventoryProviderResourceCore,
  listInventoryNegotiatedRatesCore,
  getInventoryNegotiatedRateCore,
  createInventoryNegotiatedRateCore,
  updateInventoryNegotiatedRateCore,
  deleteInventoryNegotiatedRateCore
} from "backend/SKANDI_CORE/inventory.js";

import {
  listAssetsCore,
  checkAssetDuplicateCore,
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  getAssetAccessUrlCore,
  registerAssetUsageCore,
  archiveAssetCore
} from "backend/SKANDI_CORE/assets.js";

const MEMBER = Permissions.SiteMember;
const VERSION = "B-011.14-INVENTORY-SINGLE-DISPATCH";

const object = value =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const action = (responseType, handler, { refreshBootstrap = false } = {}) =>
  Object.freeze({ responseType, handler, refreshBootstrap });

const ACTIONS = Object.freeze({
  INVENTORY_V9_REFRESH:
    action("INVENTORY_V9_BOOTSTRAP", getInventoryBootstrapCore),

  INVENTORY_V9_GET_RECORD:
    action("INVENTORY_V9_RECORD", getInventoryRecordCore),
  INVENTORY_V9_SAVE_BUNDLE:
    action("INVENTORY_V9_SAVED", saveInventoryBundleCore, { refreshBootstrap: true }),
  INVENTORY_V9_ARCHIVE_RECORD:
    action("INVENTORY_V9_ARCHIVED", archiveInventoryRecordCore, { refreshBootstrap: true }),

  INVENTORY_V9_GET_DATED:
    action("INVENTORY_V9_DATED", getDatedInventoryCore),
  INVENTORY_V9_SAVE_DATED:
    action("INVENTORY_V9_DATED_SAVED", saveDatedInventoryCore, { refreshBootstrap: true }),
  INVENTORY_V9_DELETE_DATED:
    action("INVENTORY_V9_DATED_DELETED", deleteDatedInventoryCore, { refreshBootstrap: true }),

  INVENTORY_V9_GET_AIR:
    action("INVENTORY_V9_AIR", getAirInventoryCore),
  INVENTORY_V9_SAVE_AIR_ROW:
    action("INVENTORY_V9_AIR_SAVED", saveAirInventoryRowCore, { refreshBootstrap: true }),

  INVENTORY_V9_GET_AUDIT:
    action("INVENTORY_V9_AUDIT", getInventoryAuditCore),
  INVENTORY_V9_QUALITY:
    action("INVENTORY_V9_QUALITY_RESULT", getInventoryQualityCore),

  INVENTORY_V9_GET_AIRCRAFT:
    action("INVENTORY_V9_AIRCRAFT_RECORD", getAircraftRecordCore),
  INVENTORY_V9_SAVE_AIRCRAFT:
    action("INVENTORY_V9_AIRCRAFT_SAVED", saveAircraftCore, { refreshBootstrap: true }),
  INVENTORY_V9_ARCHIVE_AIRCRAFT:
    action("INVENTORY_V9_AIRCRAFT_ARCHIVED", archiveAircraftCore, { refreshBootstrap: true }),
  INVENTORY_V9_SAVE_AIRCRAFT_CHILD:
    action("INVENTORY_V9_AIRCRAFT_CHILD_SAVED", saveAircraftChildCore, { refreshBootstrap: true }),
  INVENTORY_V9_ARCHIVE_AIRCRAFT_CHILD:
    action("INVENTORY_V9_AIRCRAFT_CHILD_ARCHIVED", archiveAircraftChildCore, { refreshBootstrap: true }),
  INVENTORY_V9_SMART_SYNC_AIRCRAFT:
    action("INVENTORY_V9_SMART_SYNC_RESULT", smartSyncAircraftCore, { refreshBootstrap: true }),
  INVENTORY_V9_CABIN_NORMALIZATION_PREVIEW:
    action("INVENTORY_V9_CABIN_NORMALIZATION_RESULT", getCabinNormalizationPreviewCore),

  INVENTORY_PROVIDER_SEARCH:
    action("INVENTORY_PROVIDER_SEARCH_RESULT", searchInventoryProviderCore),
  INVENTORY_PROVIDER_GET_RESOURCE:
    action("INVENTORY_PROVIDER_RESOURCE", getInventoryProviderResourceCore),
  INVENTORY_PROVIDER_IMPORT:
    action("INVENTORY_PROVIDER_IMPORTED", importInventoryProviderResourceCore, { refreshBootstrap: true }),
  INVENTORY_PROVIDER_REFRESH:
    action("INVENTORY_PROVIDER_REFRESHED", refreshInventoryProviderResourceCore, { refreshBootstrap: true }),

  INVENTORY_NEGOTIATED_RATES_LIST:
    action("INVENTORY_NEGOTIATED_RATES_RESULT", listInventoryNegotiatedRatesCore),
  INVENTORY_NEGOTIATED_RATE_GET:
    action("INVENTORY_NEGOTIATED_RATE_RESULT", getInventoryNegotiatedRateCore),
  INVENTORY_NEGOTIATED_RATE_CREATE:
    action("INVENTORY_NEGOTIATED_RATE_SAVED", createInventoryNegotiatedRateCore),
  INVENTORY_NEGOTIATED_RATE_UPDATE:
    action("INVENTORY_NEGOTIATED_RATE_SAVED", updateInventoryNegotiatedRateCore),
  INVENTORY_NEGOTIATED_RATE_DELETE:
    action("INVENTORY_NEGOTIATED_RATE_DELETED", deleteInventoryNegotiatedRateCore),

  INVENTORY_ASSET_LIST:
    action("INVENTORY_ASSET_LIST_RESULT", listAssetsCore),
  INVENTORY_ASSET_CHECK_DUPLICATE:
    action("INVENTORY_ASSET_DUPLICATE_RESULT", checkAssetDuplicateCore),
  INVENTORY_ASSET_PREPARE_UPLOAD:
    action("INVENTORY_ASSET_UPLOAD_PREPARED", prepareAssetUploadCore),
  INVENTORY_ASSET_FINALIZE_UPLOAD:
    action("INVENTORY_ASSET_UPLOAD_FINALIZED", finalizeAssetUploadCore),
  INVENTORY_ASSET_ACCESS_URL:
    action("INVENTORY_ASSET_ACCESS_URL_RESULT", getAssetAccessUrlCore),
  INVENTORY_ASSET_REGISTER_USAGE:
    action("INVENTORY_ASSET_USAGE_REGISTERED", registerAssetUsageCore),
  INVENTORY_ASSET_ARCHIVE:
    action("INVENTORY_ASSET_ARCHIVED", archiveAssetCore)
});

function safeError(error) {
  const code = String(
    error?.code ||
    error?.message ||
    "INVENTORY_ERROR"
  ).trim().slice(0, 120);

  const publicMessage = String(
    error?.publicMessage ||
    ""
  ).trim().slice(0, 700);

  return {
    code,
    message: publicMessage || "Inventory request failed."
  };
}

async function dispatch(input = {}) {
  const request = object(input);
  const type = String(request.type || "").trim().toUpperCase().slice(0, 120);
  const payload = object(request.payload);

  try {
    const selected = ACTIONS[type];
    if (!selected) {
      const error = new Error("INVENTORY_ACTION_NOT_SUPPORTED");
      error.code = "INVENTORY_ACTION_NOT_SUPPORTED";
      error.publicMessage =
        `Inventory Control action is not supported: ${type || "UNKNOWN"}.`;
      throw error;
    }

    const result = await selected.handler(payload);

    return {
      ok: true,
      version: VERSION,
      actionType: type,
      responseType: selected.responseType,
      refreshBootstrap: selected.refreshBootstrap === true,
      payload: object(result)
    };
  } catch (error) {
    return {
      ok: false,
      version: VERSION,
      actionType: type,
      responseType: "INVENTORY_ERROR",
      refreshBootstrap: false,
      payload: safeError(error)
    };
  }
}

export const handleInventoryAction = webMethod(MEMBER, dispatch);

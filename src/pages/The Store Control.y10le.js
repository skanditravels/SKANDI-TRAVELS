import wixLocationFrontend from "wix-location-frontend";

import {
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

import {
  getStoreControlBootstrap,
  getStoreControlProduct,
  createStoreControlProduct,
  saveStoreControlProductCore,
  saveStoreControlVariants,
  setStoreControlVisibility,
  deleteStoreControlProduct,
  setStoreControlCategories,
  bulkUpdateStoreControlPrices
} from "backend/storeControlV3.web";

const EMBED_ID = "#storeControlEmbed";
const CHILD_SOURCE = "SKANDI_STORE_CONTROL_V3";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

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

function parseMessage(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function cleanError(error) {
  const raw = String(error?.message || error || "").trim();
  const map = {
    STORE_CONTROL_AUTH_REQUIRED: "Your staff session has expired. Sign in again.",
    STORE_CONTROL_PERMISSION_REQUIRED: "Store Control administrator permission is required.",
    PRODUCT_NAME_REQUIRED: "Product name is required.",
    PRODUCT_PRICE_REQUIRED: "A valid product price is required.",
    PRODUCT_ID_REQUIRED: "Product ID is required.",
    VARIANT_CHANGES_REQUIRED: "No variant changes were supplied.",
    DELETE_CONFIRMATION_REQUIRED: "The permanent-delete confirmation did not match.",
    BULK_PRODUCTS_REQUIRED: "Select at least one product.",
    INVALID_BULK_PRICE_OPERATION: "That bulk price operation is not supported."
  };
  return map[raw] || raw || "Store Control could not complete the action.";
}

async function requireSession() {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.ok === false || session.authorized === false) {
    wixLocationFrontend.to(LOGIN_PATH);
    return null;
  }
  return session;
}

async function bootstrap(force = false, query = "") {
  if (bootstrapPromise && !force) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const session = await requireSession();
    if (!session) return null;

    const result = await getStoreControlBootstrap({ query });
    send("STORE_CONTROL_BOOTSTRAP", result);
    return result;
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

async function openProduct(productId) {
  const result = await getStoreControlProduct({ productId });
  send("STORE_CONTROL_PRODUCT", result);
  return result;
}

async function refreshAfterMutation(productId = "") {
  await bootstrap(true);
  if (productId) await openProduct(productId);
}

async function handleMessage(message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "STORE_CONTROL_READY":
      await bootstrap(false);
      return;

    case "STORE_CONTROL_REFRESH":
      await bootstrap(true, payload.query || "");
      return;

    case "STORE_CONTROL_SEARCH":
      await bootstrap(true, payload.query || "");
      return;

    case "STORE_CONTROL_OPEN_PRODUCT":
      await openProduct(payload.productId);
      return;

    case "STORE_CONTROL_CREATE_PRODUCT": {
      send("STORE_CONTROL_PROGRESS", { message: "Creating product…" });
      const result = await createStoreControlProduct({ product: payload.product || {} });
      send("STORE_CONTROL_MUTATION_OK", { action: "create", ...result });
      await refreshAfterMutation(result.productId || "");
      return;
    }

    case "STORE_CONTROL_SAVE_CORE": {
      send("STORE_CONTROL_PROGRESS", { message: "Saving product…" });
      const result = await saveStoreControlProductCore({
        productId: payload.productId,
        patch: payload.patch || {}
      });
      send("STORE_CONTROL_MUTATION_OK", { action: "core", ...result });
      await refreshAfterMutation(payload.productId);
      return;
    }

    case "STORE_CONTROL_SAVE_VARIANTS": {
      send("STORE_CONTROL_PROGRESS", { message: "Saving variants, prices and stock…" });
      const result = await saveStoreControlVariants({
        productId: payload.productId,
        variants: Array.isArray(payload.variants) ? payload.variants : []
      });
      send("STORE_CONTROL_MUTATION_OK", { action: "variants", ...result });
      await refreshAfterMutation(payload.productId);
      return;
    }

    case "STORE_CONTROL_SET_VISIBILITY": {
      const result = await setStoreControlVisibility({
        productId: payload.productId,
        visible: payload.visible
      });
      send("STORE_CONTROL_MUTATION_OK", { action: "visibility", ...result });
      await refreshAfterMutation(payload.productId);
      return;
    }

    case "STORE_CONTROL_SAVE_CATEGORIES": {
      send("STORE_CONTROL_PROGRESS", { message: "Updating categories…" });
      const result = await setStoreControlCategories({
        productId: payload.productId,
        categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds : []
      });
      send("STORE_CONTROL_MUTATION_OK", { action: "categories", ...result });
      await refreshAfterMutation(payload.productId);
      return;
    }

    case "STORE_CONTROL_BULK_PRICE": {
      send("STORE_CONTROL_PROGRESS", { message: "Updating selected prices…" });
      const result = await bulkUpdateStoreControlPrices({
        productIds: Array.isArray(payload.productIds) ? payload.productIds : [],
        operation: payload.operation,
        value: payload.value,
        compareAtMode: payload.compareAtMode,
        compareAtValue: payload.compareAtValue
      });
      send("STORE_CONTROL_BULK_RESULT", result);
      await bootstrap(true);
      return;
    }

    case "STORE_CONTROL_DELETE_PRODUCT": {
      send("STORE_CONTROL_PROGRESS", { message: "Permanently deleting product…" });
      const result = await deleteStoreControlProduct({
        productId: payload.productId,
        confirmation: payload.confirmation
      });
      send("STORE_CONTROL_MUTATION_OK", { action: "delete", ...result });
      await bootstrap(true);
      return;
    }

    case "STORE_CONTROL_NAVIGATE":
      if (String(payload.path || "").startsWith("/")) {
        wixLocationFrontend.to(payload.path);
      }
      return;

    default:
      return;
  }
}

$w.onReady(function () {
  embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message || message.source !== CHILD_SOURCE) return;

    try {
      await handleMessage(message);
    } catch (error) {
      console.error(`[Store Control V3] ${message.type} failed.`, error);
      const cleaned = cleanError(error);
      send("STORE_CONTROL_ERROR", {
        stage: message.type,
        message: cleaned
      });
      if (String(error?.message || "") === "STORE_CONTROL_AUTH_REQUIRED") {
        wixLocationFrontend.to(LOGIN_PATH);
      }
    }
  });

  send("STORE_CONTROL_PARENT_READY", {
    catalogVersion: "V3",
    page: "Store Control",
    embedId: EMBED_ID
  });

  void bootstrap(false).catch((error) => {
    send("STORE_CONTROL_ERROR", { message: cleanError(error) });
  });
});

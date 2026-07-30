// skandiStorefrontPageCode.js
// Page code for the SKANDI Store Control HTML component.
// Put the HTML iframe/custom element ID below. Default expected ID:
// #skandiStorefrontFrame

import {
  bootstrapStorefront,
  saveProduct,
  deleteProduct,
  updateInventory,
  updateFulfillment,
  saveCollection,
  savePromotionDraft,
} from "backend/skandiStorefront.web";

const HTML_COMPONENT_ID = "#skandiStorefrontFrame";
const SOURCE_UI = "SKANDI_STOREFRONT_ADMIN";
const SOURCE_PARENT = "SKANDI_STOREFRONT_PARENT";

function respond(type, payload = {}) {
  $w(HTML_COMPONENT_ID).postMessage({
    source: SOURCE_PARENT,
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

async function run(action, fn) {
  try {
    const result = await fn();
    if (result?.ok === false) {
      respond("SKANDI_STOREFRONT_ERROR", {
        action,
        message: result.message || "Action failed.",
        payload: result,
      });
      return;
    }

    respond("SKANDI_STOREFRONT_OK", {
      action,
      message: result?.message || "Action completed.",
      payload: result,
    });
  } catch (error) {
    respond("SKANDI_STOREFRONT_ERROR", {
      action,
      message: error?.message || String(error),
    });
  }
}

async function sendBootstrap(payload = {}) {
  const result = await bootstrapStorefront(payload);
  if (result?.ok === false) {
    respond("SKANDI_STOREFRONT_ERROR", {
      action: "SKANDI_STOREFRONT_BOOTSTRAP",
      message: result.message,
      payload: result,
    });
    return;
  }

  respond("SKANDI_STOREFRONT_DATA", {
    payload: result,
    ...result,
  });
}

$w.onReady(function () {
  const frame = $w(HTML_COMPONENT_ID);

  frame.onMessage(async (event) => {
    const data = event.data || {};
    if (!data || data.source !== SOURCE_UI) return;

    switch (data.type) {
      case "SKANDI_STOREFRONT_BOOTSTRAP":
      case "SKANDI_STOREFRONT_FULL_SYNC":
      case "SKANDI_STOREFRONT_PRODUCTS_REFRESH":
      case "SKANDI_STOREFRONT_ORDERS_REFRESH":
      case "SKANDI_STOREFRONT_INVENTORY_REFRESH":
      case "SKANDI_STOREFRONT_COLLECTIONS_REFRESH":
        await sendBootstrap(data);
        break;

      case "SKANDI_STOREFRONT_PRODUCT_SAVE":
        await run(data.type, () => saveProduct(data));
        break;

      case "SKANDI_STOREFRONT_PRODUCT_DELETE":
        await run(data.type, () => deleteProduct(data));
        break;

      case "SKANDI_STOREFRONT_INVENTORY_UPDATE":
        await run(data.type, () => updateInventory(data));
        break;

      case "SKANDI_STOREFRONT_ORDER_FULFILLMENT_UPDATE":
        await run(data.type, () => updateFulfillment(data));
        break;

      case "SKANDI_STOREFRONT_COLLECTION_SAVE":
      case "SKANDI_STOREFRONT_COLLECTION_ASSIGN_PRODUCTS":
        await run(data.type, () => saveCollection({
          ...data,
          assignOnly: data.type === "SKANDI_STOREFRONT_COLLECTION_ASSIGN_PRODUCTS",
        }));
        break;

      case "SKANDI_STOREFRONT_PROMOTION_DRAFT_SAVE":
        await run(data.type, () => savePromotionDraft(data));
        break;

      case "SKANDI_STOREFRONT_OPEN_ADMIN":
        respond("SKANDI_STOREFRONT_OK", {
          action: data.type,
          message: "Admin handoff acknowledged.",
        });
        break;

      default:
        respond("SKANDI_STOREFRONT_ERROR", {
          action: data.type || "UNKNOWN_ACTION",
          message: "Unknown SKANDI storefront action.",
        });
    }
  });

  sendBootstrap();
});

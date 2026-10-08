// /src/backend/SKANDI_CORE/storeCartV3.web.js
// v.12 — existing Store Control web contract; Catalog V3 implementation is owned by storefront.js.
import { webMethod, Permissions } from "wix-web-module";
import { publicError } from "backend/SKANDI_CORE/platformErrors";
import { getStoreControlBootstrapCore, getStoreControlProductCore, createStoreControlProductCore, saveStoreControlProductCore as saveStoreControlProductData, saveStoreControlVariantsCore, setStoreControlVisibilityCore, deleteStoreControlProductCore, setStoreControlCategoriesCore, bulkUpdateStoreControlPricesCore } from "backend/SKANDI_CORE/storefront";

export const getStoreControlBootstrap = webMethod(Permissions.SiteMember, async input => {
  try {
    return await getStoreControlBootstrapCore(input);
  } catch (error) {
    // An uncaught Velo exception becomes Wix's generic "Unable to handle" text.
    // Keep the SiteMember boundary and send the canonical safe error explicitly.
    const safe = publicError(error, "Store Control could not load its data. Refresh to retry.");
    if (!/^STORE_CONTROL_[A-Z_]+$/.test(safe.code)) safe.code = "STORE_CONTROL_BOOTSTRAP_FAILED";
    return { ok: false, error: safe, stage: error?.details?.stage || "bootstrap", requestId: error?.details?.requestId || "" };
  }
});
export const getStoreControlProduct = webMethod(Permissions.SiteMember, input => getStoreControlProductCore(input));
export const createStoreControlProduct = webMethod(Permissions.SiteMember, input => createStoreControlProductCore(input));
export const saveStoreControlProductCore = webMethod(Permissions.SiteMember, input => saveStoreControlProductData(input));
export const saveStoreControlVariants = webMethod(Permissions.SiteMember, input => saveStoreControlVariantsCore(input));
export const setStoreControlVisibility = webMethod(Permissions.SiteMember, input => setStoreControlVisibilityCore(input));
export const deleteStoreControlProduct = webMethod(Permissions.SiteMember, input => deleteStoreControlProductCore(input));
export const setStoreControlCategories = webMethod(Permissions.SiteMember, input => setStoreControlCategoriesCore(input));
export const bulkUpdateStoreControlPrices = webMethod(Permissions.SiteMember, input => bulkUpdateStoreControlPricesCore(input));

import { updateStoreControlInventoryCore, updateStoreControlOrderCore, saveStoreControlCollectionCore, saveStoreControlPromotionCore } from "backend/SKANDI_CORE/storefront";
export const updateStoreControlInventory = webMethod(Permissions.SiteMember, input => updateStoreControlInventoryCore(input));
export const updateStoreControlOrder = webMethod(Permissions.SiteMember, input => updateStoreControlOrderCore(input));
export const saveStoreControlCollection = webMethod(Permissions.SiteMember, input => saveStoreControlCollectionCore(input));
export const saveStoreControlPromotion = webMethod(Permissions.SiteMember, input => saveStoreControlPromotionCore(input));


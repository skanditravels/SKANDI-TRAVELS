// /src/backend/SKANDI_CORE/storeCartV3.web.js
// v.12 — existing Store Control web contract; Catalog V3 implementation is owned by storefront.js.
import { webMethod, Permissions } from "wix-web-module";
import { getStoreControlBootstrapCore, getStoreControlProductCore, createStoreControlProductCore, saveStoreControlProductCore as saveStoreControlProductData, saveStoreControlVariantsCore, setStoreControlVisibilityCore, deleteStoreControlProductCore, setStoreControlCategoriesCore, bulkUpdateStoreControlPricesCore } from "backend/SKANDI_CORE/storefront";

export const getStoreControlBootstrap = webMethod(Permissions.SiteMember, input => getStoreControlBootstrapCore(input));
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

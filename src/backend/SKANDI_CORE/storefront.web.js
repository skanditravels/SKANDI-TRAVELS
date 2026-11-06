// /src/backend/SKANDI_CORE/storefront.web.js
// v.12 — public Store contract backed by the canonical Catalog V3 core.
import { webMethod, Permissions } from "wix-web-module";
import { listStorefrontProductsCore, resolveStoreVariantCore } from "backend/SKANDI_CORE/storefront";
export const listStorefrontProducts = webMethod(Permissions.Anyone, async input => {
  try {
    return await listStorefrontProductsCore(input);
  } catch (error) {
    console.error("[Store catalog] Read failed", error);
    return { ok: false, message: "We couldn’t load the store catalog. Please try again." };
  }
});
export const resolveStoreVariant = webMethod(Permissions.Anyone, input => resolveStoreVariantCore(input));

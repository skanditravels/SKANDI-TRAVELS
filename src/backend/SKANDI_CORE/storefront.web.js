// /src/backend/SKANDI_CORE/storefront.web.js
// v.12 — public Store contract backed by the canonical Catalog V3 core.
import { webMethod, Permissions } from "wix-web-module";
import { listStorefrontProductsCore, resolveStoreVariantCore } from "backend/SKANDI_CORE/storefront";
export const listStorefrontProducts = webMethod(Permissions.Anyone, input => listStorefrontProductsCore(input));
export const resolveStoreVariant = webMethod(Permissions.Anyone, input => resolveStoreVariantCore(input));

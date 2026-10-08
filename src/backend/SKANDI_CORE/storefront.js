// /src/backend/SKANDI_CORE/storefront.js
// v.12 — one Catalog V3 owner for Store Control and the public Store.
// Existing V3 administrator operations are preserved; public responses exclude merchant-only data.
import { productsV3, inventoryItemsV3 } from "@wix/stores";
import { orders, orderFulfillments } from "@wix/ecom";
import { coupons } from "wix-marketing.v2";
import { elevate } from "wix-auth";
import { categories } from "@wix/categories";
import { auth } from "@wix/essentials";
import { SkandiError, errorCode, errorStatus } from "backend/SKANDI_CORE/platformErrors";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";

const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const STORE_TREE = Object.freeze({ appNamespace: "@wix/stores", treeKey: null });
const PRODUCT_FIELDS = [
  "VARIANT_OPTION_CHOICE_NAMES","MERCHANT_DATA","INFO_SECTION","URL","CURRENCY",
  "WEIGHT_MEASUREMENT_UNIT_INFO","BREADCRUMBS_INFO","MEDIA_ITEMS_INFO","DESCRIPTION",
  "DIRECT_CATEGORIES_INFO","ALL_CATEGORIES_INFO"
];
const STORE_ADMIN_TOKENS = new Set([
  "super_admin","super admin","owner","company_owner","company owner","administrator","admin",
  "inventory_admin","inventory admin","store_admin","store admin","ecommerce_admin","ecommerce admin",
  "commerce_admin","commerce admin","sales_admin","sales admin","product_admin","product admin",
  "catalog_admin","catalog admin","store.manage","catalog.manage","products.manage","inventory.manage","pricing.manage"
]);

const elevatedQueryProducts = auth.elevate(productsV3.queryProducts);
const elevatedGetProduct = auth.elevate(productsV3.getProduct);
const elevatedCreateProductWithInventory = auth.elevate(productsV3.createProductWithInventory);
const elevatedUpdateProduct = auth.elevate(productsV3.updateProduct);
const elevatedUpdateProductWithInventory = auth.elevate(productsV3.updateProductWithInventory);
const elevatedDeleteProduct = auth.elevate(productsV3.deleteProduct);
const elevatedQueryInventory = auth.elevate(inventoryItemsV3.queryInventoryItems);
const elevatedQueryCategories = auth.elevate(categories.queryCategories);
const elevatedAddItemToCategories = auth.elevate(categories.bulkAddItemToCategories);
const elevatedRemoveItemFromCategories = auth.elevate(categories.bulkRemoveItemFromCategories);

function cleanText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}
function boolValue(value, fallback = false) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return fallback;
}
function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function amountString(value, fallback = "") {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return number.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
function tokensFrom(value, output = []) {
  if (!value) return output;
  if (Array.isArray(value)) {
    value.forEach((item) => tokensFrom(item, output));
    return output;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, enabled]) => {
      if (enabled === true) output.push(String(key).trim().toLowerCase());
      else tokensFrom(enabled, output);
    });
    return output;
  }
  output.push(String(value).trim().toLowerCase());
  return output;
}
function normalizedProfile(session = {}) {
  const source = session.profile || session.staff || session.user || session.data?.profile || {};
  const firstName = cleanText(source.firstName || source.first_name, 80);
  const lastName = cleanText(source.lastName || source.last_name, 80);
  return {
    ...source,
    name: cleanText(source.name || source.displayName || source.display_name || [firstName,lastName].filter(Boolean).join(" ") || source.email, 160),
    skId: cleanText(source.skId || source.skID || source.sk_id || source.employeeId || source.employee_id, 40).toUpperCase(),
    role: cleanText(source.role || source.position || source.jobTitle || source.job_title, 120)
  };
}
async function requireStoreAdmin() {
  const session = await requireStaffPortalSessionCore();
  const profile = normalizedProfile(session);
  const tokens = tokensFrom([session.permissionKeys, session.permissionGroups, session.allowedApps]);
  // These are server-resolved access roles and app grants from staffAuth,
  // the same authority used by portalApps; profile/job titles never grant access.
  const accessRole = cleanText(session.accessRole, 80).toUpperCase();
  const appGrants = tokensFrom(session.allowedApps);
  const portalAdministrator = ["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"].includes(accessRole);
  const allowed = session.isSystemAdmin === true || portalAdministrator ||
    appGrants.some(token => token === "*" || token === "all") || tokens.some(token =>
    STORE_ADMIN_TOKENS.has(token) || ["store-control", "store", "retail", "ecommerce", "commerce", "system-admin"].includes(token)
  );
  if (!allowed) throw new Error("STORE_CONTROL_PERMISSION_REQUIRED");
  return { session, profile };
}

function richText(plainText = "") {
  const text = cleanText(plainText, 50000);
  return text ? {
    nodes: [{ type: "PARAGRAPH", nodes: [{ type: "TEXT", textData: { text } }] }],
    metadata: { version: 1 }
  } : { nodes: [], metadata: { version: 1 } };
}
function moneyInfo(money = {}, currency = "USD") {
  const amount = amountString(money?.amount ?? money?.convertedAmount ?? 0, "0");
  return {
    amount: Number(amount || 0),
    amountString: amount || "0",
    formatted: cleanText(money?.formattedAmount || money?.formattedConvertedAmount || "", 80) || `${currency} ${Number(amount || 0).toFixed(2)}`,
    currency
  };
}
// Catalog V3 SDK image fields are wix:image strings; REST images are objects.
function storeImageUrl(value, depth = 0) {
  if (!value || depth > 5) return "";
  if (typeof value === "object") {
    const candidates = value.mediaType === "VIDEO" ? [value.thumbnail] :
      [value.image, value.url, value.src, value.imageUrl, value.thumbnail, value._id, value.id];
    for (const candidate of candidates) {
      const url = storeImageUrl(candidate, depth + 1);
      if (url) return url;
    }
    return "";
  }
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("wix:image://v1/")) {
    let id;
    try { id = decodeURIComponent(raw.slice(15).split(/[\/#]/)[0]); }
    catch (_) { return ""; }
    return /^[A-Za-z0-9_.~-]+$/.test(id) ? `https://static.wixstatic.com/media/${id}` : "";
  }
  if (raw.startsWith("/media/")) return `https://static.wixstatic.com${raw}`;
  if (/^[A-Za-z0-9_-]+_[A-Za-z0-9_~.-]+\.(?:png|jpe?g|webp|gif|avif)$/i.test(raw)) {
    return `https://static.wixstatic.com/media/${raw}`;
  }
  return "";
}
function mediaUrlsFrom(product = {}) {
  const items = product.media?.itemsInfo?.items;
  return [...new Set([
    product.media?.main,
    ...(Array.isArray(items) ? items : []),
    product.media?.main?.thumbnail,
    product.thumbnail
  ].map(item => storeImageUrl(item)).filter(Boolean))];
}
function categoryIdsFrom(product = {}) {
  const rows = product?.directCategoriesInfo?.categories;
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => item?._id || item?.id || "").filter(Boolean);
}
function choiceLabel(variant = {}) {
  const choices = Array.isArray(variant.choices) ? variant.choices : [];
  const labels = choices.map((choice) => {
    const names = choice?.optionChoiceNames || {};
    const option = cleanText(names.optionName, 100);
    const selected = cleanText(names.choiceName, 100);
    return option && selected ? `${option}: ${selected}` : (selected || option || "");
  }).filter(Boolean);
  return labels.join(" · ") || "Default";
}

async function queryAllProducts() {
  const products = [];
  let cursor = "";
  for (let page = 0; page < 100; page += 1) {
    const response = await elevatedQueryProducts({
      cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) },
      sort: [{ fieldName: "updatedDate", order: "DESC" }]
    }, {
      fields: ["URL","CURRENCY","THUMBNAIL","MEDIA_ITEMS_INFO","DIRECT_CATEGORIES_INFO"]
    });
    if (!Array.isArray(response?.products)) throw new Error("STORE_CONTROL_INVALID_PRODUCTS_RESPONSE");
    const rows = response.products;
    products.push(...rows);
    const next = response?.pagingMetadata?.cursors?.next || "";
    if (!response?.pagingMetadata?.hasNext || !next) break;
    cursor = next;
  }
  return products;
}
async function queryAllCategories() {
  const response = await elevatedQueryCategories(
    { cursorPaging: { limit: 1000 } },
    { treeReference: STORE_TREE, returnNonVisibleCategories: true, fields: ["BREADCRUMBS_INFO","DESCRIPTION"] }
  );
  if (!Array.isArray(response?.categories)) throw new Error("STORE_CONTROL_INVALID_CATEGORIES_RESPONSE");
  return response.categories;
}
async function queryAllInventoryItems() {
  const inventory = [];
  let cursor = "";
  for (let page = 0; page < 100; page += 1) {
    const response = await elevatedQueryInventory({ cursorPaging: { limit: 1000, ...(cursor ? { cursor } : {}) } });
    const rows = Array.isArray(response?.inventoryItems) ? response.inventoryItems : [];
    inventory.push(...rows);
    const next = response?.pagingMetadata?.cursors?.next || "";
    if (!response?.pagingMetadata?.hasNext || !next) break;
    cursor = next;
  }
  return inventory;
}
async function getFullProduct(productId) {
  const id = cleanText(productId, 80);
  if (!id) throw new Error("PRODUCT_ID_REQUIRED");
  return elevatedGetProduct(id, { fields: PRODUCT_FIELDS });
}

function normalizeProductListItem(product = {}) {
  const currency = cleanText(product.currency, 8) || "USD";
  const min = moneyInfo(product?.actualPriceRange?.minValue, currency);
  const max = moneyInfo(product?.actualPriceRange?.maxValue, currency);
  return {
    id: product._id || product.id || "",
    revision: cleanText(product.revision, 40),
    name: cleanText(product.name, 300),
    slug: cleanText(product.slug, 300),
    visible: product.visible !== false,
    visibleInPos: product.visibleInPos !== false,
    productType: cleanText(product.productType, 40),
    currency,
    minPrice: min.amount,
    maxPrice: max.amount,
    priceLabel: min.amount === max.amount ? min.formatted : `${min.formatted} – ${max.formatted}`,
    thumbnail: mediaUrlsFrom(product)[0] || "",
    categoryIds: categoryIdsFrom(product),
    updatedDate: product._updatedDate || product.updatedDate || ""
  };
}
function normalizeInventoryItem(item = {}) {
  return {
    id: item._id || item.id || "",
    revision: cleanText(item.revision, 40),
    productId: item.productId || "",
    variantId: item.variantId || "",
    locationId: item.locationId || "",
    trackQuantity: item.trackQuantity === true,
    quantity: item.quantity ?? null,
    inStock: item.inStock ?? (String(item.availabilityStatus || "").toUpperCase() === "IN_STOCK"),
    availabilityStatus: cleanText(item.availabilityStatus, 60)
  };
}
function normalizeProductDetail(product = {}, inventoryItems = []) {
  const currency = cleanText(product.currency, 8) || "USD";
  const inventoryByVariant = new Map();
  inventoryItems.filter((item) => String(item.productId || "") === String(product._id || product.id || "")).forEach((item) => {
    const variantId = item.variantId || "";
    if (!inventoryByVariant.has(variantId)) inventoryByVariant.set(variantId, []);
    inventoryByVariant.get(variantId).push(normalizeInventoryItem(item));
  });
  const variants = Array.isArray(product?.variantsInfo?.variants) ? product.variantsInfo.variants : [];
  return {
    id: product._id || product.id || "",
    revision: cleanText(product.revision, 40),
    name: cleanText(product.name, 300),
    slug: cleanText(product.slug, 300),
    visible: product.visible !== false,
    visibleInPos: product.visibleInPos !== false,
    productType: cleanText(product.productType, 40) || "PHYSICAL",
    currency,
    plainDescription: cleanText(product.plainDescription, 50000),
    mediaUrls: mediaUrlsFrom(product),
    categoryIds: categoryIdsFrom(product),
    options: Array.isArray(product.options) ? product.options : [],
    variants: variants.map((variant) => {
      const id = variant._id || variant.id || "";
      const actual = moneyInfo(variant?.price?.actualPrice, currency);
      const compareAt = variant?.price?.compareAtPrice ? moneyInfo(variant.price.compareAtPrice, currency) : null;
      const cost = variant?.revenueDetails?.cost ? moneyInfo(variant.revenueDetails.cost, currency) : null;
      return {
        id,
        label: choiceLabel(variant),
        visible: variant.visible !== false,
        sku: cleanText(variant.sku, 200),
        barcode: cleanText(variant.barcode, 200),
        actualPrice: actual.amount,
        compareAtPrice: compareAt ? compareAt.amount : null,
        cost: cost ? cost.amount : null,
        weight: variant?.physicalProperties?.weight ?? null,
        inventoryStatus: variant.inventoryStatus || {},
        inventory: inventoryByVariant.get(id) || []
      };
    })
  };
}
function normalizeCategory(category = {}) {
  return {
    id: category._id || category.id || "",
    revision: cleanText(category.revision, 40),
    name: cleanText(category.name, 300),
    slug: cleanText(category.slug, 300),
    visible: category.visible !== false,
    parentCategoryId: category?.parentCategory?._id || category?.parentCategory?.id || "",
    imageUrl: storeImageUrl(category.image),
    itemCounter: Number(category.itemCounter || 0)
  };
}

function cleanMoneyObject(amount) {
  if(amount!==undefined && amount!==null && amount!=="" && (!Number.isFinite(Number(amount))||Number(amount)<0))throw new Error("A non-negative price is required.");
  const value = amountString(amount, "");
  return value === "" ? undefined : { amount: value };
}
function variantForUpdate(existing = {}, change = {}) {
  const id = existing._id || existing.id || "";
  const actualPrice = change.actualPrice !== undefined ? change.actualPrice : existing?.price?.actualPrice?.amount;
  const compareAtPrice = change.compareAtPrice !== undefined ? change.compareAtPrice : existing?.price?.compareAtPrice?.amount;
  const cost = change.cost !== undefined ? change.cost : existing?.revenueDetails?.cost?.amount;
  const physicalProperties = { ...(existing.physicalProperties || {}) };
  if (change.weight !== undefined) physicalProperties.weight = Math.max(0, numberValue(change.weight, 0));
  const result = {
    _id: id,
    visible: change.visible !== undefined ? boolValue(change.visible, true) : existing.visible !== false,
    choices: Array.isArray(existing.choices) ? existing.choices : [],
    price: { actualPrice: cleanMoneyObject(actualPrice) },
    physicalProperties
  };
  if (change.sku !== undefined || existing.sku) result.sku = cleanText(change.sku !== undefined ? change.sku : existing.sku, 200);
  if (change.barcode !== undefined || existing.barcode) result.barcode = cleanText(change.barcode !== undefined ? change.barcode : existing.barcode, 200);
  const compareObject = cleanMoneyObject(compareAtPrice);
  if (compareObject) result.price.compareAtPrice = compareObject;
  const costObject = cleanMoneyObject(cost);
  if (costObject) result.revenueDetails = { cost: costObject };
  ["digitalProperties","subscriptionInfo"].forEach((key) => {
    if (existing[key] !== undefined) result[key] = existing[key];
  });
  return result;
}
async function updateVariants(productId, changes = [], inventoryChanges = [], expectedRevision = "") {
  const product = await getFullProduct(productId);
  assertRevision(product, expectedRevision);
  const byId = new Map((Array.isArray(changes) ? changes : []).map((change) => [String(change.id || change.variantId || ""), change]));
  const inventoryById = new Map((Array.isArray(inventoryChanges) ? inventoryChanges : []).map((change) => [String(change.id || change.variantId || ""), change]));
  const currentVariants = Array.isArray(product?.variantsInfo?.variants) ? product.variantsInfo.variants : [];
  const variants = currentVariants.map((variant) => {
    const id = String(variant._id || variant.id || "");
    const merged = variantForUpdate(variant, byId.get(id) || {});
    const stock = inventoryById.get(id);
    if (stock) {
      if (boolValue(stock.trackQuantity, stock.quantity !== undefined)) {
        merged.inventoryItem = { quantity: Math.max(0, numberValue(stock.quantity, 0)) };
      } else {
        merged.inventoryItem = { inStock: boolValue(stock.inStock, true) };
      }
    }
    return merged;
  });
  const patch = {
    _id: product._id || product.id,
    revision: product.revision,
    options: Array.isArray(product.options) ? product.options : [],
    variantsInfo: { variants }
  };
  if (inventoryById.size) {
    const result = await elevatedUpdateProductWithInventory(productId, patch, { fields: PRODUCT_FIELDS });
    return result?.product || result;
  }
  return elevatedUpdateProduct(productId, patch, { fields: PRODUCT_FIELDS });
}

async function syncProductCategories(productId, desiredIds = []) {
  const product = await getFullProduct(productId);
  const current = new Set(categoryIdsFrom(product));
  const desired = new Set((Array.isArray(desiredIds) ? desiredIds : []).map((value) => cleanText(value, 80)).filter(Boolean));
  const add = [...desired].filter((id) => !current.has(id));
  const remove = [...current].filter((id) => !desired.has(id));
  const item = { catalogItemId: productId, appId: WIX_STORES_APP_ID };
  if (add.length) await elevatedAddItemToCategories(item, { categoryIds: add, treeReference: STORE_TREE });
  if (remove.length) await elevatedRemoveItemFromCategories(item, { categoryIds: remove, treeReference: STORE_TREE });
  return { added: add, removed: remove };
}

export async function getStoreControlBootstrapCore({ query = "" } = {}) {
  let stage = "authorization";
  try {
    const { profile } = await requireStoreAdmin();
    stage = "catalog";
    const readCatalog = async (name, read) => {
      try { return await read(); }
      catch (error) {
        throw new SkandiError("STORE_CONTROL_CATALOG_READ_FAILED", "Catalog read failed.", {
          status: errorStatus(error),
          details: { stage: name, providerCode: error?.details?.applicationError?.code || errorCode(error) }
        });
      }
    };
    const [rawProducts, rawCategories] = await Promise.all([
      readCatalog("products", queryAllProducts), readCatalog("categories", queryAllCategories)
    ]);
    stage = "services";
    const services=await Promise.allSettled([queryAllInventoryItems(), readRecentOrders(), readCoupons()]);
    const serviceErrors={};
    ["inventory","orders","promotions"].forEach((name,i)=>{if(services[i].status==="rejected")serviceErrors[name]=`${name} could not be loaded. Refresh to retry.`});
    const inventory=services[0].status==="fulfilled"?services[0].value.map(normalizeInventoryItem):[];
    const orderRows=services[1].status==="fulfilled"?services[1].value:[];
    const promotions=services[2].status==="fulfilled"?services[2].value:[];
    stage = "catalog-data";
    const needle = cleanText(query, 200).toLowerCase();
    const products = rawProducts.map(normalizeProductListItem).filter((product) =>
      !needle || product.name.toLowerCase().includes(needle) || product.slug.toLowerCase().includes(needle) || product.id.toLowerCase().includes(needle)
    );
    const categoriesList = rawCategories.map(normalizeCategory);
    return {
      ok: true,
      profile: { name: profile.name || "", skId: profile.skId || "", role: profile.role || "" },
      catalogVersion: "V3",
      inventory, orders:orderRows, promotions, serviceErrors,
      scope:"Orders show the latest 100 records; promotions show the first page returned by Wix (up to 100). Activity log is local to this page session.",
      currency: rawProducts[0]?.currency || "USD",
      stats: {
        products: rawProducts.length,
        visible: rawProducts.filter((item) => item.visible !== false).length,
        hidden: rawProducts.filter((item) => item.visible === false).length,
        categories: categoriesList.length,
        openOrders:serviceErrors.orders?null:orderRows.filter(o=>o.status!=="CANCELED"&&o.fulfillmentStatus!=="FULFILLED").length,
        lowStock:serviceErrors.inventory?null:inventory.filter(i=>i.trackQuantity&&i.quantity<=5).length
      },
      products,
      categories: categoriesList
    };
  } catch (error) {
    stage = error?.details?.stage || stage;
    const sourceCode = errorCode(error, "STORE_CONTROL_BOOTSTRAP_FAILED");
    const authRequired = ["STAFF_AUTH_REQUIRED", "STORE_CONTROL_AUTH_REQUIRED"].includes(sourceCode);
    const denied = sourceCode === "STORE_CONTROL_PERMISSION_REQUIRED";
    const code = authRequired ? "STORE_CONTROL_AUTH_REQUIRED" : denied ? sourceCode :
      stage === "authorization" ? "STORE_CONTROL_ACCESS_FAILED" :
      stage === "products" ? "STORE_CONTROL_PRODUCTS_FAILED" :
      stage === "categories" ? "STORE_CONTROL_CATEGORIES_FAILED" : "STORE_CONTROL_BOOTSTRAP_FAILED";
    const messages = {
      STORE_CONTROL_AUTH_REQUIRED: "Your staff session has expired. Sign in again.",
      STORE_CONTROL_PERMISSION_REQUIRED: "Your staff account does not have Store Control access. Ask a portal administrator to review its access role and app permissions.",
      STORE_CONTROL_ACCESS_FAILED: "Your staff access could not be verified. Sign in again; if this continues, ask a portal administrator to check your account.",
      STORE_CONTROL_PRODUCTS_FAILED: "Wix products could not be loaded. Refresh to retry.",
      STORE_CONTROL_CATEGORIES_FAILED: "Wix categories could not be loaded. Refresh to retry.",
      STORE_CONTROL_BOOTSTRAP_FAILED: "Store Control could not load its data. Refresh to retry."
    };
    const requestId = `SC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const providerCode = error?.details?.providerCode || error?.details?.applicationError?.code || sourceCode;
    // Codes and status only: never log a staff record, token, or provider payload.
    console.error("[Store Control V12] Bootstrap failed", {
      requestId, stage, code, status: errorStatus(error) || null,
      providerCode: /^[A-Za-z0-9_.:-]{1,120}$/.test(providerCode) ? providerCode : "UNCLASSIFIED"
    });
    throw new SkandiError(code, messages[code], {
      status: authRequired ? 401 : denied ? 403 : errorStatus(error),
      retryable: stage !== "authorization",
      details: { requestId, stage }
    });
  }
}

export async function getStoreControlProductCore({ productId } = {}) {
  await requireStoreAdmin();
  const [product, inventory] = await Promise.all([getFullProduct(productId), queryAllInventoryItems()]);
  return { ok: true, product: normalizeProductDetail(product, inventory) };
}

export async function createStoreControlProductCore({ product = {} } = {}) {
  await requireStoreAdmin();
  const name = cleanText(product.name, 300);
  if (!name) throw new Error("PRODUCT_NAME_REQUIRED");
  const actualPrice = amountString(product.actualPrice, "");
  if (actualPrice === "") throw new Error("PRODUCT_PRICE_REQUIRED");
  const mediaUrls = (Array.isArray(product.mediaUrls) ? product.mediaUrls : String(product.mediaUrls || "").split(/\r?\n|,/))
    .map((url) => cleanText(url, 2048)).filter(Boolean);
  const variant = {
    visible: boolValue(product.variantVisible, true),
    price: { actualPrice: { amount: actualPrice } },
    physicalProperties: { weight: Math.max(0, numberValue(product.weight, 0)) }
  };
  const compareAt = amountString(product.compareAtPrice, "");
  if (compareAt !== "") variant.price.compareAtPrice = { amount: compareAt };
  const cost = amountString(product.cost, "");
  if (cost !== "") variant.revenueDetails = { cost: { amount: cost } };
  const sku = cleanText(product.sku, 200);
  if (sku) variant.sku = sku;
  const barcode = cleanText(product.barcode, 200);
  if (barcode) variant.barcode = barcode;
  if (boolValue(product.trackQuantity, false)) variant.inventoryItem = { quantity: Math.max(0, numberValue(product.quantity, 0)) };
  else variant.inventoryItem = { inStock: boolValue(product.inStock, true) };
  const input = {
    name,
    visible: boolValue(product.visible, true),
    visibleInPos: boolValue(product.visibleInPos, true),
    productType: cleanText(product.productType, 40) || "PHYSICAL",
    description: richText(product.description),
    physicalProperties: {},
    variantsInfo: { variants: [variant] }
  };
  if (mediaUrls.length) {
    input.media = {
      main: { url: mediaUrls[0], altText: name },
      itemsInfo: { items: mediaUrls.map((url) => ({ url, altText: name })) }
    };
  }
  const result = await elevatedCreateProductWithInventory(input, { fields: PRODUCT_FIELDS });
  const created = result?.product || result;
  const productId = created?._id || created?.id || "";
  if (productId && Array.isArray(product.categoryIds)) await syncProductCategories(productId, product.categoryIds);
  return { ok: true, productId, product: normalizeProductDetail(created, []) };
}

export async function saveStoreControlProductCore({ productId, patch = {} } = {}) {
  await requireStoreAdmin();
  const current = await getFullProduct(productId);
  assertRevision(current, patch.revision);
  const update = { _id: current._id || current.id, revision: current.revision };
  if(patch.variant){
    const variants=current.variantsInfo?.variants||[];
    if(!variants.some(v=>(v._id||v.id)===patch.variant.id))throw new Error("Select a valid product variant.");
    update.options=current.options||[];
    update.variantsInfo={variants:variants.map(v=>variantForUpdate(v,(v._id||v.id)===patch.variant.id?patch.variant:{}))};
  }
  if (patch.name !== undefined) {
    const name = cleanText(patch.name, 300);
    if (!name) throw new Error("PRODUCT_NAME_REQUIRED");
    update.name = name;
  }
  if (patch.description !== undefined) update.description = richText(patch.description);
  if (patch.visible !== undefined) update.visible = boolValue(patch.visible, true);
  if (patch.visibleInPos !== undefined) update.visibleInPos = boolValue(patch.visibleInPos, true);
  if (patch.mediaUrls !== undefined) {
    const urls = (Array.isArray(patch.mediaUrls) ? patch.mediaUrls : String(patch.mediaUrls || "").split(/\r?\n|,/))
      .map((url) => cleanText(url, 2048)).filter(Boolean);
    update.media = urls.length ? {
      main: { url: urls[0], altText: update.name || current.name || "" },
      itemsInfo: { items: urls.map((url) => ({ url, altText: update.name || current.name || "" })) }
    } : { itemsInfo: { items: [] } };
  }
  await elevatedUpdateProduct(productId, update, { fields: PRODUCT_FIELDS });
  if (patch.categoryIds !== undefined) await syncProductCategories(productId, patch.categoryIds);
  const [refreshed, inventory] = await Promise.all([getFullProduct(productId), queryAllInventoryItems()]);
  return { ok: true, product: normalizeProductDetail(refreshed, inventory) };
}

export async function saveStoreControlVariantsCore({ productId, variants = [], revision = "" } = {}) {
  await requireStoreAdmin();
  if (!Array.isArray(variants) || !variants.length) throw new Error("VARIANT_CHANGES_REQUIRED");
  const inventoryChanges = variants.filter((item) => item.inventoryChanged === true).map((item) => ({
    id: item.id, trackQuantity: item.trackQuantity, quantity: item.quantity, inStock: item.inStock
  }));
  await updateVariants(productId, variants, inventoryChanges, revision);
  const [refreshed, inventory] = await Promise.all([getFullProduct(productId), queryAllInventoryItems()]);
  return { ok: true, product: normalizeProductDetail(refreshed, inventory) };
}

export async function setStoreControlVisibilityCore({ productId, visible } = {}) {
  await requireStoreAdmin();
  const current = await getFullProduct(productId);
  await elevatedUpdateProduct(productId, {
    _id: current._id || current.id,
    revision: current.revision,
    visible: boolValue(visible, true)
  }, { fields: PRODUCT_FIELDS });
  const refreshed = await getFullProduct(productId);
  return { ok: true, product: normalizeProductDetail(refreshed, []) };
}

export async function deleteStoreControlProductCore({ productId, confirmation = "" } = {}) {
  await requireStoreAdmin();
  const id = cleanText(productId, 80);
  if (cleanText(confirmation, 200) !== `DELETE ${id}`) throw new Error("DELETE_CONFIRMATION_REQUIRED");
  await elevatedDeleteProduct(id);
  return { ok: true, deletedProductId: id };
}

export async function setStoreControlCategoriesCore({ productId, categoryIds = [] } = {}) {
  await requireStoreAdmin();
  const result = await syncProductCategories(productId, categoryIds);
  return { ok: true, ...result };
}

export async function bulkUpdateStoreControlPricesCore({
  productIds = [], operation = "PERCENT", value = 0, compareAtMode = "KEEP", compareAtValue = 0
} = {}) {
  await requireStoreAdmin();
  const ids = [...new Set((Array.isArray(productIds) ? productIds : []).map((id) => cleanText(id, 80)).filter(Boolean))];
  if (!ids.length) throw new Error("BULK_PRODUCTS_REQUIRED");
  const op = cleanText(operation, 40).toUpperCase();
  const amount = numberValue(value, 0);
  const compareMode = cleanText(compareAtMode, 40).toUpperCase();
  const compareValue = numberValue(compareAtValue, 0);
  const results = [];
  for (const productId of ids) {
    try {
      const product = await getFullProduct(productId);
      const variants = Array.isArray(product?.variantsInfo?.variants) ? product.variantsInfo.variants : [];
      const changes = variants.map((variant) => {
        const current = numberValue(variant?.price?.actualPrice?.amount, 0);
        let next = current;
        if (op === "SET") next = amount;
        else if (op === "ADD") next = current + amount;
        else if (op === "SUBTRACT") next = current - amount;
        else if (op === "PERCENT") next = current * (1 + amount / 100);
        else throw new Error("INVALID_BULK_PRICE_OPERATION");
        next = Math.max(0, Math.round(next * 100) / 100);
        let compareAtPrice = variant?.price?.compareAtPrice?.amount;
        if (compareMode === "CLEAR") compareAtPrice = "";
        if (compareMode === "SET") compareAtPrice = Math.max(0, compareValue);
        if (compareMode === "PERCENT_ABOVE") compareAtPrice = Math.max(0, Math.round(next * (1 + compareValue / 100) * 100) / 100);
        return { id: variant._id || variant.id, actualPrice: next, compareAtPrice };
      });
      await updateVariants(productId, changes, []);
      results.push({ productId, ok: true, variants: changes.length });
    } catch (error) {
      results.push({ productId, ok: false, message: error?.message || String(error) });
    }
  }
  return {
    ok: results.some((item) => item.ok),
    results,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length
  };
}

// Public reads run in the visitor's Wix context and never request merchant data.
const PUBLIC_PRODUCT_FIELDS = ["CURRENCY", "THUMBNAIL", "MEDIA_ITEMS_INFO", "DESCRIPTION", "DIRECT_CATEGORIES_INFO"];
function publicOptions(product = {}) {
  return (Array.isArray(product.options) ? product.options : []).map(option => ({
    id: cleanText(option._id, 80),
    name: cleanText(option.name, 100),
    choices: (Array.isArray(option.choicesSettings?.choices) ? option.choicesSettings.choices : [])
      .filter(choice => choice.visible !== false)
      .map(choice => ({ value: cleanText(choice.name, 100), description: cleanText(choice.name, 100) }))
  }));
}
function publicProduct(product = {}, categoriesById = new Map()) {
  const currency = cleanText(product.currency, 8);
  const ids = categoryIdsFrom(product);
  const urls = mediaUrlsFrom(product);
  const price = moneyInfo(product.actualPriceRange?.minValue, currency);
  const compare = product.compareAtPriceRange?.minValue;
  const inStock = !["OUT_OF_STOCK"].includes(product.inventory?.availabilityStatus);
  return {
    id: product._id || product.id,
    name: cleanText(product.name, 300), slug: cleanText(product.slug, 300),
    description: cleanText(product.plainDescription, 50000),
    imageUrl: urls[0] || "", imageCandidates: urls,
    mediaUrls: urls, price, comparePrice: compare ? moneyInfo(compare, currency) : null,
    currency, visible: product.visible !== false, inStock,
    canAddToCart: product.visible !== false && inStock,
    categoryIds: ids, categoryNames: ids.map(id => categoriesById.get(id)?.name).filter(Boolean),
    brand: cleanText(product.brand?.name, 180), ribbon: cleanText(product.ribbon?.name, 180),
    options: publicOptions(product)
  };
}
export async function listStorefrontProductsCore({ limit = 300 } = {}) {
  const requested = Number(limit);
  const maximum = Number.isFinite(requested) ? Math.max(1, Math.min(10000, Math.trunc(requested))) : 300;
  const rawProducts = [];
  let cursor = "";
  while (rawProducts.length < maximum) {
    const result = await productsV3.queryProducts({ cursorPaging: { limit: Math.min(100, maximum - rawProducts.length), ...(cursor ? { cursor } : {}) } }, { fields: PUBLIC_PRODUCT_FIELDS });
    const rows = Array.isArray(result?.products) ? result.products : [];
    rawProducts.push(...rows);
    const next = result?.pagingMetadata?.cursors?.next || "";
    if (!result?.pagingMetadata?.hasNext || !next || next === cursor) break;
    cursor = next;
  }
  const categoryResult = await categories.queryCategories({ cursorPaging: { limit: 1000 } }, { treeReference: STORE_TREE, returnNonVisibleCategories: false });
  const categoryRows = (Array.isArray(categoryResult?.categories) ? categoryResult.categories : [])
    .filter(category => category.visible !== false).map(normalizeCategory);
  const categoriesById = new Map(categoryRows.map(category => [category.id, category]));
  const products = rawProducts.filter(product => product.visible !== false).map(product => publicProduct(product, categoriesById));
  return { ok: true, products, categories: categoryRows, banners: [], travelCards: [],
    meta: { source: "WIX_STORES", catalogVersion: "V3", productCount: products.length, collectionCount: categoryRows.length } };
}
export async function resolveStoreVariantCore({ productId, choices = {} } = {}) {
  const id = cleanText(productId, 80);
  if (!id) throw new Error("STORE_PRODUCT_ID_REQUIRED");
  const product = await productsV3.getProduct(id, { fields: ["VARIANT_OPTION_CHOICE_NAMES"] });
  if (!product || product.visible === false) throw new Error("STORE_PRODUCT_UNAVAILABLE");
  const selected = choices && typeof choices === "object" && !Array.isArray(choices) ? choices : {};
  const options = Array.isArray(product.options) ? product.options : [];
  if (Object.keys(selected).length !== options.length || options.some(option => !Object.prototype.hasOwnProperty.call(selected, option.name))) {
    throw new Error("Select every product option before adding it to your bag.");
  }
  const variants = Array.isArray(product.variantsInfo?.variants) ? product.variantsInfo.variants : [];
  const matches = variants.filter(variant => variant.visible !== false &&
    (Array.isArray(variant.choices) ? variant.choices : []).length === options.length &&
    (variant.choices || []).every(choice => {
      const names = choice.optionChoiceNames || {};
      return names.optionName && String(selected[names.optionName]) === String(names.choiceName);
    })
  );
  if (matches.length !== 1) throw new Error("The selected product option is unavailable.");
  const variant = matches[0];
  if (variant.inventoryStatus?.inStock === false && variant.inventoryStatus?.preorderEnabled !== true) throw new Error("The selected product option is sold out.");
  if (!variant._id) throw new Error("STORE_VARIANT_ID_MISSING");
  return { ok: true, productId: id, variantId: variant._id };
}


// V12 Store Control operations stay behind the existing staff authorization boundary.
function assertRevision(current, expected) {
  if(expected && String(current.revision)!==String(expected))throw new Error("This record changed. Refresh before saving your edits.");
}
const adminSearchOrders=auth.elevate(orders.searchOrders);
const adminGetOrder=auth.elevate(orders.getOrder);
const adminUpdateOrder=auth.elevate(orders.updateOrder);
const adminCancelOrder=auth.elevate(orders.cancelOrder);
const adminAddActivities=auth.elevate(orders.addActivities);
const adminFulfill=auth.elevate(orderFulfillments.createFulfillment);
const adminUpdateInventory=auth.elevate(inventoryItemsV3.updateInventoryItem);
const adminCreateCategory=auth.elevate(categories.createCategory);
const adminQueryCoupons=elevate(coupons.queryCoupons);
const adminCreateCoupon=elevate(coupons.createCoupon);
async function readRecentOrders(){
  const result=await adminSearchOrders({cursorPaging:{limit:100},filter:{status:{$in:["APPROVED","PENDING","REJECTED","CANCELED"]}}});
  if(!Array.isArray(result?.orders))throw new Error("Order response was invalid.");
  return result.orders.map(o=>({id:o._id||o.id,number:o.number,status:o.status,paymentStatus:o.paymentStatus,fulfillmentStatus:o.fulfillmentStatus,archived:o.archived===true,created:o._createdDate||o.createdDate,customer:o.billingInfo?.contactDetails?.firstName||o.buyerInfo?.email||"Customer",items:(o.lineItems||[]).reduce((n,i)=>n+Number(i.quantity||0),0),total:o.priceSummary?.total?.amount,currency:o.currency}));
}
async function readCoupons(){
  const result=await adminQueryCoupons({});
  if(!Array.isArray(result?.coupons))throw new Error("Promotion response was invalid.");
  return result.coupons.map(c=>{const p=c.specification||c;return {id:c._id||c.id,name:p.name,code:p.code,type:p.percentOffRate!=null?"PERCENT":p.moneyOffAmount!=null?"AMOUNT":"FREE_SHIPPING",value:p.percentOffRate??p.moneyOffAmount??"",status:p.active===true?"Active":"Draft"}});
}
export async function updateStoreControlInventoryCore({inventoryId,revision,mode="SET",quantity,tracked=true}={}){
  await requireStoreAdmin();
  const rows=await queryAllInventoryItems();
  const current=rows.find(i=>(i._id||i.id)===inventoryId);
  if(!current)throw new Error("Select an inventory record, including its location, before saving.");
  if(!revision)throw new Error("Refresh inventory before saving.");
  assertRevision(current,revision);
  const amount=Number(quantity);
  if(quantity===""||quantity==null||!Number.isInteger(amount)||amount<0)throw new Error("A non-negative whole-number stock quantity is required.");
  if(!["SET","INCREMENT","DECREMENT"].includes(mode))throw new Error("Select a valid stock operation.");
  if(mode!=="SET"&&current.trackQuantity!==true)throw new Error("Set an exact quantity before adjusting untracked stock.");
  const next=mode==="SET"?amount:Number(current.quantity)+(mode==="INCREMENT"?amount:-amount);
  if(next<0)throw new Error("Stock cannot be negative.");
  const patch={revision:current.revision,...(tracked?{quantity:next}:{inStock:next>0})};
  const saved=await adminUpdateInventory(inventoryId,patch,{reason:inventoryItemsV3.ReasonType.MANUAL});
  return {ok:true,inventory:normalizeInventoryItem(saved?.inventoryItem||saved)};
}
export async function updateStoreControlOrderCore({orderId,action,carrier="",trackingNumber="",note="",confirmation=""}={}){
  await requireStoreAdmin();
  const id=cleanText(orderId,80);if(!id)throw new Error("Order ID is required.");
  const order=await adminGetOrder(id);
  if(action==="READY"){
    if(order.status!=="APPROVED")throw new Error("Only approved orders can be prepared for shipping.");
    await adminAddActivities(id,{orderActivities:[{activityType:"MERCHANT_COMMENT",merchantComment:{message:"Ready to ship"+(note?": "+cleanText(note,2000):"")}}]});
    return {ok:true,orderId:id,message:"Ready-to-ship note saved to the order. Fulfillment status is unchanged."};
  }
  if(action==="FULFILLED"){
    if(order.status!=="APPROVED")throw new Error("Only approved orders can be fulfilled.");
    if(confirmation!==`FULFILL ${id}`)throw new Error("Confirm fulfillment of all remaining items.");
    if(Boolean(carrier)!==Boolean(trackingNumber))throw new Error("Provide both carrier and tracking number, or leave both blank.");
    const result=await adminFulfill(id,{lineItems:(order.lineItems||[]).map(i=>({_id:i._id||i.id})),...(trackingNumber?{trackingInfo:{trackingNumber:cleanText(trackingNumber,200),shippingProvider:cleanText(carrier,100)}}:{})});
    if(!result?.fulfillmentId)throw new Error("Fulfillment was not confirmed. Refresh the order before retrying.");
    return {ok:true,orderId:id,message:"Fulfillment created. Wix may take a moment to update its status."};
  }
  if(action==="CANCELED"){
    if(confirmation!==`CANCEL ${id}`)throw new Error("Confirm cancellation before continuing.");
    await adminCancelOrder(id,{sendOrderCanceledEmail:false,restockAllItems:false});
    return {ok:true,orderId:id,message:"Order canceled. Refunds and restocking require separate review in Wix."};
  }
  if(action==="ARCHIVED"){await adminUpdateOrder(id,{archived:true});return {ok:true,orderId:id,message:"Order archived."}}
  throw new Error("Select a valid order action.");
}
export async function saveStoreControlCollectionCore({categoryId="",name="",slug="",description="",productIds=[],assignOnly=false}={}){
  await requireStoreAdmin();
  let id=cleanText(categoryId,80);
  if(!assignOnly){
    if(!cleanText(name,300))throw new Error("Collection name is required.");
    const result=await adminCreateCategory({name:cleanText(name,300),description:cleanText(description,5000),...(slug?{slug:cleanText(slug,300)}:{}),visible:true},{treeReference:STORE_TREE});
    const category=result?.category||result;id=category?._id||category?.id||"";
    if(!id)throw new Error("Collection creation was not confirmed. Refresh before retrying.");
  }
  if(!id)throw new Error("Select a collection for assignment.");
  const results=[];
  for(const productId of [...new Set(productIds)].slice(0,100)){
    try{await elevatedAddItemToCategories({catalogItemId:cleanText(productId,80),appId:WIX_STORES_APP_ID},{categoryIds:[id],treeReference:STORE_TREE});results.push({productId,ok:true})}
    catch(_){results.push({productId,ok:false})}
  }
  return {ok:true,categoryId:id,results,message:results.some(x=>!x.ok)?"Collection saved; some product assignments failed. Review the listed products before retrying.":"Collection saved."};
}
export async function saveStoreControlPromotionCore({name,code,type,value,starts,ends,scope=""}={}){
  await requireStoreAdmin();
  if(!cleanText(name,300)||!cleanText(code,100))throw new Error("Promotion name and code are required.");
  if(scope && scope.toLowerCase()!=="stores")throw new Error("This editor supports store-wide coupons. Leave Scope blank or enter stores.");
  const amount=Number(value),start=starts?new Date(starts).getTime():Date.now(),end=ends?new Date(ends).getTime():null;
  if(!Number.isFinite(start)||(end!==null&&(!Number.isFinite(end)||end<=start)))throw new Error("Choose valid promotion dates; the end must follow the start.");
  const spec={name:cleanText(name,300),code:cleanText(code,100),active:false,startTime:String(start),...(end?{expirationTime:String(end)}:{})};
  if(type==="FREE_SHIPPING")spec.freeShipping=true;
  else{
    if(!Number.isFinite(amount)||amount<=0||(type==="PERCENT"&&amount>100))throw new Error("Enter a valid discount value.");
    spec.scope={namespace:"stores"};
    if(type==="PERCENT")spec.percentOffRate=amount;else if(type==="AMOUNT")spec.moneyOffAmount=amount;else throw new Error("Invalid promotion type.");
  }
  const result=await adminCreateCoupon(spec);const coupon=result?.coupon||result;
  if(!(coupon?._id||coupon?.id))throw new Error("Promotion save was not confirmed. Refresh before retrying.");
  return {ok:true,couponId:coupon._id||coupon.id,message:"Promotion saved to Wix as an inactive draft."};
}



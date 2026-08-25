import { webMethod, Permissions } from "wix-web-module";
import { productsV3, inventoryItemsV3 } from "@wix/stores";
import { categories } from "@wix/categories";
import { auth } from "@wix/essentials";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

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
  if (!Number.isFinite(number)) return fallback;
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
  const session = await getStaffPortalSession();
  if (!session || session.ok === false || session.authorized === false) throw new Error("STORE_CONTROL_AUTH_REQUIRED");
  const profile = normalizedProfile(session);
  const tokens = tokensFrom([
    profile.role, profile.roles, profile.permission, profile.permissions, profile.access, profile.accessRoles,
    profile.dutyCode, session.permissions, session.roles
  ]);
  const allowed = Boolean(
    profile.isSuperAdmin || profile.superAdmin || session.isSuperAdmin ||
    tokens.some((token) => STORE_ADMIN_TOKENS.has(token))
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
function mediaUrlsFrom(product = {}) {
  const output = [];
  const main = product?.media?.main?.url;
  if (main) output.push(main);
  const items = product?.media?.itemsInfo?.items;
  if (Array.isArray(items)) {
    items.forEach((item) => {
      const url = item?.url;
      if (url && !output.includes(url)) output.push(url);
    });
  }
  return output;
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
      sort: [{ fieldName: "_updatedDate", order: "DESC" }]
    }, {
      fields: ["URL","CURRENCY","THUMBNAIL","MEDIA_ITEMS_INFO","DIRECT_CATEGORIES_INFO"]
    });
    const rows = Array.isArray(response?.products) ? response.products : [];
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
  return Array.isArray(response?.categories) ? response.categories : [];
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
    thumbnail: product?.media?.main?.url || product?.thumbnail?.url || product?.thumbnail || "",
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
    itemCounter: Number(category.itemCounter || 0)
  };
}

function cleanMoneyObject(amount) {
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
async function updateVariants(productId, changes = [], inventoryChanges = []) {
  const product = await getFullProduct(productId);
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

export const getStoreControlBootstrap = webMethod(Permissions.Anyone, async function ({ query = "" } = {}) {
  const { profile } = await requireStoreAdmin();
  const [rawProducts, rawCategories] = await Promise.all([queryAllProducts(), queryAllCategories()]);
  const needle = cleanText(query, 200).toLowerCase();
  const products = rawProducts.map(normalizeProductListItem).filter((product) =>
    !needle || product.name.toLowerCase().includes(needle) || product.slug.toLowerCase().includes(needle) || product.id.toLowerCase().includes(needle)
  );
  const categoriesList = rawCategories.map(normalizeCategory);
  return {
    ok: true,
    profile: { name: profile.name || "", skId: profile.skId || "", role: profile.role || "" },
    catalogVersion: "V3",
    currency: rawProducts[0]?.currency || "USD",
    stats: {
      products: rawProducts.length,
      visible: rawProducts.filter((item) => item.visible !== false).length,
      hidden: rawProducts.filter((item) => item.visible === false).length,
      categories: categoriesList.length
    },
    products,
    categories: categoriesList
  };
});

export const getStoreControlProduct = webMethod(Permissions.Anyone, async function ({ productId } = {}) {
  await requireStoreAdmin();
  const [product, inventory] = await Promise.all([getFullProduct(productId), queryAllInventoryItems()]);
  return { ok: true, product: normalizeProductDetail(product, inventory) };
});

export const createStoreControlProduct = webMethod(Permissions.Anyone, async function ({ product = {} } = {}) {
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
});

export const saveStoreControlProductCore = webMethod(Permissions.Anyone, async function ({ productId, patch = {} } = {}) {
  await requireStoreAdmin();
  const current = await getFullProduct(productId);
  const update = { _id: current._id || current.id, revision: current.revision };
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
});

export const saveStoreControlVariants = webMethod(Permissions.Anyone, async function ({ productId, variants = [] } = {}) {
  await requireStoreAdmin();
  if (!Array.isArray(variants) || !variants.length) throw new Error("VARIANT_CHANGES_REQUIRED");
  const inventoryChanges = variants.filter((item) => item.inventoryChanged === true).map((item) => ({
    id: item.id, trackQuantity: item.trackQuantity, quantity: item.quantity, inStock: item.inStock
  }));
  await updateVariants(productId, variants, inventoryChanges);
  const [refreshed, inventory] = await Promise.all([getFullProduct(productId), queryAllInventoryItems()]);
  return { ok: true, product: normalizeProductDetail(refreshed, inventory) };
});

export const setStoreControlVisibility = webMethod(Permissions.Anyone, async function ({ productId, visible } = {}) {
  await requireStoreAdmin();
  const current = await getFullProduct(productId);
  await elevatedUpdateProduct(productId, {
    _id: current._id || current.id,
    revision: current.revision,
    visible: boolValue(visible, true)
  }, { fields: PRODUCT_FIELDS });
  const refreshed = await getFullProduct(productId);
  return { ok: true, product: normalizeProductDetail(refreshed, []) };
});

export const deleteStoreControlProduct = webMethod(Permissions.Anyone, async function ({ productId, confirmation = "" } = {}) {
  await requireStoreAdmin();
  const id = cleanText(productId, 80);
  if (cleanText(confirmation, 200) !== `DELETE ${id}`) throw new Error("DELETE_CONFIRMATION_REQUIRED");
  await elevatedDeleteProduct(id);
  return { ok: true, deletedProductId: id };
});

export const setStoreControlCategories = webMethod(Permissions.Anyone, async function ({ productId, categoryIds = [] } = {}) {
  await requireStoreAdmin();
  const result = await syncProductCategories(productId, categoryIds);
  return { ok: true, ...result };
});

export const bulkUpdateStoreControlPrices = webMethod(Permissions.Anyone, async function ({
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
});

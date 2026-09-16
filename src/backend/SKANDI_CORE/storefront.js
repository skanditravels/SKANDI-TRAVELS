// /src/backend/SKANDI_CORE/storefront.js
// B-011.13 — SKANDI The Store canonical Wix Stores/eCommerce service.
// One source of truth for public catalog/cart and internal Store Control.

import wixStoresBackend from "wix-stores-backend";
import { currentCart, checkout, orders, orderFulfillments } from "wix-ecom-backend";
import { elevate } from "wix-auth";
import { getStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth.js";

export const STOREFRONT_CORE_VERSION = "B-011.13";
export const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

const elevatedSearchOrders = elevate(orders.searchOrders);
const elevatedCancelOrder = elevate(orders.cancelOrder);
const elevatedUpdateOrder = elevate(orders.updateOrder);
const elevatedCreateFulfillment = elevate(orderFulfillments.createFulfillment);
const elevatedCreateProduct = elevate(wixStoresBackend.createProduct);
const elevatedUpdateProduct = elevate(wixStoresBackend.updateProductFields);
const elevatedDeleteProduct = elevate(wixStoresBackend.deleteProduct);
const elevatedCreateCollection = elevate(wixStoresBackend.createCollection);
const elevatedAddProductsToCollection = elevate(wixStoresBackend.addProductsToCollection);
const elevatedUpdateInventoryByProduct = elevate(wixStoresBackend.updateInventoryVariantFieldsByProductId);

const clean = (v, max = 1000) => String(v ?? "").trim().slice(0, max);
const arr = v => Array.isArray(v) ? v : [];
const number = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const bool = v => v === true || String(v).toLowerCase() === "true";

function firstUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const candidates = [
    value.url,
    value.src,
    value.image?.url,
    value.imageInfo?.url,
    value.mainMedia?.image?.url,
    value.mainMedia?.url,
    value.media?.mainMedia?.image?.url,
    value.media?.main?.image?.url
  ];
  return candidates.map(v => clean(v, 5000)).find(Boolean) || "";
}

function normalizePrice(product = {}) {
  const amount = number(
    product?.priceData?.discountedPrice ??
    product?.priceData?.price ??
    product?.price?.discountedPrice?.amount ??
    product?.price?.price?.amount ??
    product?.price?.amount ??
    product?.price
  );
  const formatted = clean(product?.formattedDiscountedPrice || product?.formattedPrice || product?.priceData?.formatted?.discountedPrice || product?.priceData?.formatted?.price, 120);
  const currency = clean(product?.currency || product?.priceData?.currency || product?.price?.currency || "USD", 12) || "USD";
  return { amount, formatted, currency };
}

function normalizeProduct(product = {}) {
  const id = clean(product._id || product.id, 160);
  const imageUrl = firstUrl(product.media || product.mainMedia || product);
  const mediaItems = arr(product?.media?.items || product?.media?.itemsInfo?.items || product?.media?.mediaItems)
    .map(item => ({ id: clean(item?._id || item?.id, 160), url: firstUrl(item), type: clean(item?.mediaType || item?.type, 40) }))
    .filter(item => item.url || item.id);
  const categories = arr(product.collectionIds || product.collections || product.categoryNames).map(x => typeof x === "string" ? x : clean(x?.name || x?._id || x?.id, 180)).filter(Boolean);
  const price = normalizePrice(product);
  return {
    id,
    _id: id,
    name: clean(product.name, 300),
    slug: clean(product.slug, 300),
    description: clean(product.description, 12000),
    sku: clean(product.sku, 180),
    visible: product.visible !== false,
    inStock: product.stock?.inStock ?? product.inStock ?? product.inventory?.inStock ?? true,
    quantity: number(product.stock?.quantity ?? product.quantityInStock ?? product.inventory?.quantity ?? 0),
    trackInventory: bool(product.stock?.trackInventory ?? product.trackInventory ?? product.inventory?.trackQuantity),
    price,
    currency: price.currency,
    weight: number(product.weight),
    imageUrl,
    imageCandidates: [imageUrl, ...mediaItems.map(x => x.url)].filter(Boolean),
    media: mediaItems,
    collectionIds: arr(product.collectionIds).map(String),
    categoryNames: categories,
    ribbon: clean(product.ribbon, 180),
    brand: clean(product.brand || "SKANDI", 180),
    updatedAt: product.lastUpdated || product._updatedDate || product.updatedDate || "",
    canAddToCart: product.visible !== false && (product.stock?.inStock ?? product.inStock ?? true) !== false,
    rawManageVariants: product.manageVariants === true
  };
}

function normalizeCollection(collection = {}) {
  const id = clean(collection._id || collection.id, 160);
  return {
    id,
    _id: id,
    name: clean(collection.name, 300),
    title: clean(collection.name, 300),
    slug: clean(collection.slug, 300),
    description: clean(collection.description, 4000),
    imageUrl: firstUrl(collection.media || collection.image || collection)
  };
}

function normalizeCart(cart = {}) {
  const lineItems = arr(cart.lineItems).map(item => ({
    id: clean(item._id || item.id, 160),
    productId: clean(item.catalogReference?.catalogItemId || item.productId, 160),
    name: clean(item.productName?.original || item.productName || item.name, 300),
    quantity: number(item.quantity || 1),
    imageUrl: firstUrl(item.image || item.media),
    price: {
      amount: number(item.price?.amount || item.price?.convertedAmount || item.price),
      formatted: clean(item.price?.formattedAmount || item.price?.formatted || "", 120),
      currency: clean(item.price?.currency || cart.currency || "USD", 12)
    }
  }));
  return {
    id: clean(cart._id || cart.id, 160),
    lineItems,
    itemCount: lineItems.reduce((n, item) => n + item.quantity, 0),
    totals: cart.priceSummary || cart.totals || {},
    currency: clean(cart.currency || cart.priceSummary?.subtotal?.currency || "USD", 12)
  };
}

function normalizeOrder(order = {}) {
  const id = clean(order._id || order.id, 160);
  const lineItems = arr(order.lineItems);
  return {
    id,
    number: clean(order.number || order.orderNumber, 120),
    createdAt: order._createdDate || order.createdDate || "",
    status: clean(order.status, 80),
    paymentStatus: clean(order.paymentStatus || order.paymentStatusV2, 80),
    fulfillmentStatus: clean(order.fulfillmentStatus, 80),
    buyerEmail: clean(order.buyerInfo?.email, 320),
    buyerName: clean([order.billingInfo?.contactDetails?.firstName, order.billingInfo?.contactDetails?.lastName].filter(Boolean).join(" "), 300),
    total: order.priceSummary?.total || {},
    lineItems: lineItems.map(item => ({ id: clean(item._id || item.id, 160), name: clean(item.productName?.original || item.productName || item.name, 300), quantity: number(item.quantity) }))
  };
}

async function queryProducts({ visibleOnly = false, query = "" } = {}) {
  let builder = wixStoresBackend.queryProducts();
  if (visibleOnly && typeof builder.eq === "function") builder = builder.eq("visible", true);
  if (typeof builder.limit === "function") builder = builder.limit(100);
  const result = await builder.find();
  let items = arr(result?.items).map(normalizeProduct);
  const q = clean(query, 200).toLowerCase();
  if (q) items = items.filter(item => [item.name, item.sku, item.description, item.brand, ...item.categoryNames].join(" ").toLowerCase().includes(q));
  return items;
}

async function queryCollections() {
  const builder = wixStoresBackend.queryCollections();
  const result = await (typeof builder.limit === "function" ? builder.limit(100) : builder).find();
  return arr(result?.items).map(normalizeCollection);
}

async function requireStoreAdmin() {
  const session = await getStaffPortalSessionCore();
  if (!session?.loggedIn || !session?.authorized) throw new Error("STORE_ADMIN_AUTH_REQUIRED");
  const profile = session.profile || {};
  const values = [
    ...(arr(session.permissionKeys)), ...(arr(session.permissions)), ...(arr(session.allowedApps)), ...(arr(session.permissionGroups)),
    ...(arr(profile.permissionKeys)), ...(arr(profile.allowedApps)), ...(arr(profile.permissionGroups))
  ].map(v => clean(typeof v === "string" ? v : (v?.id || v?.key || v?.permission), 180).toLowerCase());
  const canManage = session.canManage === true || profile.canManage === true || ["all", "system-admin", "store-control", "retail", "ecommerce", "commerce"].some(v => values.includes(v));
  if (!canManage) throw new Error("STORE_ADMIN_ACCESS_DENIED");
  return session;
}

export async function getStorefrontCatalogCore(input = {}) {
  const [products, collections] = await Promise.all([
    queryProducts({ visibleOnly: true, query: input.query }),
    queryCollections().catch(() => [])
  ]);
  return {
    ok: true,
    version: STOREFRONT_CORE_VERSION,
    products,
    categories: collections,
    banners: [],
    travelCards: [],
    meta: { productCount: products.length, collectionCount: collections.length, source: "WIX_STORES" }
  };
}

export async function getCurrentStoreCartCore() {
  try {
    return { ok: true, cart: normalizeCart(await currentCart.getCurrentCart()) };
  } catch (error) {
    const message = clean(error?.message, 400);
    if (/not found|does not exist|empty cart/i.test(message)) return { ok: true, cart: normalizeCart({ lineItems: [] }) };
    throw error;
  }
}

export async function addToStoreCartCore(input = {}) {
  const productId = clean(input.productId, 160);
  const quantity = Math.max(1, Math.min(99, Math.trunc(number(input.quantity) || 1)));
  if (!productId) throw new Error("STORE_PRODUCT_ID_REQUIRED");
  const options = input.choices && typeof input.choices === "object" ? input.choices : {};
  const catalogReference = { appId: WIX_STORES_APP_ID, catalogItemId: productId };
  if (clean(options.variantId, 160)) {
    catalogReference.options = { variantId: clean(options.variantId, 160) };
  } else if (Object.keys(options).length) {
    catalogReference.options = { options };
  }
  await currentCart.addToCurrentCart({ lineItems: [{ quantity, catalogReference }] });
  return getCurrentStoreCartCore();
}

export async function createStoreCheckoutCore() {
  const created = await currentCart.createCheckoutFromCurrentCart({ channelType: "WEB" });
  const checkoutId = clean(created?.checkoutId || created?._id || created?.id, 160);
  if (!checkoutId) throw new Error("STORE_CHECKOUT_ID_MISSING");
  const urlResult = await checkout.getCheckoutUrl(checkoutId).catch(() => null);
  return { ok: true, checkoutId, checkoutUrl: clean(urlResult?.checkoutUrl || urlResult?.url, 5000) };
}

export async function getStoreAdminBootstrapCore(input = {}) {
  await requireStoreAdmin();
  const [products, collections, orderResult] = await Promise.all([
    queryProducts({ visibleOnly: false, query: input.query }),
    queryCollections().catch(() => []),
    elevatedSearchOrders({ cursorPaging: { limit: 100 } }).catch(() => ({ orders: [] }))
  ]);
  const orderRows = arr(orderResult?.orders || orderResult?.items).map(normalizeOrder);
  const inventory = products.map(product => ({
    id: product.id,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    quantity: product.quantity,
    tracked: product.trackInventory,
    inStock: product.inStock,
    variantId: ""
  }));
  const openOrders = orderRows.filter(order => !/FULFILLED|CANCELED|CANCELLED/i.test(order.fulfillmentStatus || order.status)).length;
  const lowStock = inventory.filter(item => item.tracked && item.quantity <= 5).length;
  const revenueAmount = orderRows.reduce((sum, order) => sum + number(order.total?.amount), 0);
  return {
    ok: true,
    version: STOREFRONT_CORE_VERSION,
    products,
    collections,
    orders: orderRows,
    inventory,
    promotions: [],
    audit: [],
    stats: { products: products.length, orders: orderRows.length, openOrders, lowStock, collections: collections.length, revenue: revenueAmount.toFixed(2) },
    storeUrl: "/the-store"
  };
}

export async function saveStoreProductCore(input = {}) {
  await requireStoreAdmin();
  const product = input.product && typeof input.product === "object" ? input.product : input;
  const id = clean(product.id || product._id, 160);
  const info = {
    name: clean(product.name, 300),
    description: clean(product.description, 12000),
    price: Math.max(0, number(product.price)),
    visible: product.visible !== false,
    sku: clean(product.sku, 180),
    weight: Math.max(0, number(product.weight))
  };
  if (!info.name) throw new Error("STORE_PRODUCT_NAME_REQUIRED");
  const saved = id ? await elevatedUpdateProduct(id, info) : await elevatedCreateProduct(info);
  const normalized = normalizeProduct(saved?.product || saved);
  const collectionId = clean(product.collectionId, 160);
  if (collectionId && normalized.id) await elevatedAddProductsToCollection(collectionId, [normalized.id]).catch(() => null);
  return { ok: true, product: normalized };
}

export async function hideOrDeleteStoreProductCore(input = {}) {
  await requireStoreAdmin();
  const id = clean(input.productId || input.id, 160);
  if (!id) throw new Error("STORE_PRODUCT_ID_REQUIRED");
  if (clean(input.mode, 40).toUpperCase() === "DELETE") {
    await elevatedDeleteProduct(id);
    return { ok: true, productId: id, deleted: true };
  }
  const saved = await elevatedUpdateProduct(id, { visible: false });
  return { ok: true, product: normalizeProduct(saved?.product || saved), deleted: false };
}

export async function updateStoreInventoryCore(input = {}) {
  await requireStoreAdmin();
  const productId = clean(input.productId, 160);
  if (!productId) throw new Error("STORE_PRODUCT_ID_REQUIRED");
  const quantity = Math.max(0, Math.trunc(number(input.quantity)));
  const mode = clean(input.mode || "SET", 20).toUpperCase();
  const currentProducts = await queryProducts({ visibleOnly: false });
  const product = currentProducts.find(item => item.id === productId || (input.sku && item.sku === input.sku));
  const nextQuantity = mode === "INCREMENT" ? Math.max(0, number(product?.quantity) + quantity) : mode === "DECREMENT" ? Math.max(0, number(product?.quantity) - quantity) : quantity;
  let variantId = clean(input.variantId, 160);
  if (!variantId) {
    const variants = await wixStoresBackend.getProductVariants(productId).catch(() => []);
    variantId = clean(variants?.[0]?.variant?._id || variants?.[0]?.variant?.id || variants?.[0]?._id || variants?.[0]?.id, 160);
  }
  if (!variantId) throw new Error("STORE_VARIANT_ID_REQUIRED");
  const info = {
    trackQuantity: input.tracked !== false,
    variants: [{ variantId, quantity: nextQuantity, inStock: nextQuantity > 0 }]
  };
  await elevatedUpdateInventoryByProduct(productId, info);
  return { ok: true, productId, quantity: nextQuantity, tracked: input.tracked !== false };
}

export async function saveStoreCollectionCore(input = {}) {
  await requireStoreAdmin();
  const name = clean(input.name || input.title, 300);
  if (!name) throw new Error("STORE_COLLECTION_NAME_REQUIRED");
  const result = await elevatedCreateCollection({ name });
  const collection = normalizeCollection(result?.collection || result);
  const ids = arr(input.productIds).map(v => clean(v, 160)).filter(Boolean);
  if (collection.id && ids.length) await elevatedAddProductsToCollection(collection.id, ids);
  return { ok: true, collection };
}

export async function assignStoreCollectionProductsCore(input = {}) {
  await requireStoreAdmin();
  const collectionId = clean(input.collectionId || input.id, 160);
  const productIds = arr(input.productIds).map(v => clean(v, 160)).filter(Boolean);
  if (!collectionId || !productIds.length) throw new Error("STORE_COLLECTION_ASSIGNMENT_REQUIRED");
  await elevatedAddProductsToCollection(collectionId, productIds);
  return { ok: true, collectionId, productIds };
}

export async function updateStoreOrderCore(input = {}) {
  await requireStoreAdmin();
  const orderId = clean(input.orderId, 160);
  const action = clean(input.action, 80).toUpperCase();
  if (!orderId) throw new Error("STORE_ORDER_ID_REQUIRED");
  if (action === "CANCELED" || action === "CANCELLED") {
    await elevatedCancelOrder(orderId, { sendOrderCanceledEmail: true, restockAllItems: true });
    return { ok: true, orderId, action: "CANCELED" };
  }
  if (action === "ARCHIVED") {
    await elevatedUpdateOrder(orderId, { archived: true });
    return { ok: true, orderId, action: "ARCHIVED" };
  }
  if (action === "FULFILLED" || action === "READY") {
    const order = await orders.getOrder(orderId);
    const lineItems = arr(order?.lineItems).map(item => ({ _id: item._id || item.id, quantity: number(item.quantity) })).filter(item => item._id && item.quantity > 0);
    const fulfillment = { lineItems };
    const trackingNumber = clean(input.trackingNumber, 300);
    const carrier = clean(input.carrier, 180);
    if (trackingNumber || carrier) fulfillment.trackingInfo = { trackingNumber, shippingProvider: carrier };
    if (lineItems.length) await elevatedCreateFulfillment(orderId, fulfillment);
    return { ok: true, orderId, action };
  }
  throw new Error("STORE_ORDER_ACTION_INVALID");
}

// V12 Store Gift Cards owner. Wix Gift Cards remains the stored-value authority.
// SKANDI exposes the one Wix gift-card product as Store-native denomination products
// and uses paid eCommerce orders to issue the corresponding Wix-managed gift cards.

import { cartV2, currentCartV2, orders } from "@wix/ecom";
import { giftVouchers, giftVoucherProducts } from "@wix/gift-vouchers";
import { auth } from "@wix/essentials";
import { createHmac, timingSafeEqual } from "crypto";
import { Buffer } from "buffer";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";

const queryGiftCardProducts = auth.elevate(giftVoucherProducts.queryGiftCardProducts);
const createGiftCard = auth.elevate(giftVouchers.createGiftCard);
const queryGiftCards = auth.elevate(giftVouchers.queryGiftCards);
const addGiftCardLine = auth.elevate(cartV2.addLineItems);
const getSecretValue = elevate(secrets.getSecretValue);

const CODE_KEY_SECRET = "SKANDI_GIFT_CARD_CODE_KEY";
const MAX_MESSAGE_LENGTH = 500;

const CARD_STYLES = Object.freeze([
  Object.freeze({ id: "CLASSIC_NAVY", name: "Classic Navy", background: "#022e64", secondary: "#063f78", accent: "#5FC7CF", text: "#FFFFFF", motif: "wave" }),
  Object.freeze({ id: "TRAVEL_BLUE", name: "Travel Blue", background: "#073B66", secondary: "#5FC7CF", accent: "#D7E6FF", text: "#FFFFFF", motif: "horizon" }),
  Object.freeze({ id: "NORDIC_LIGHT", name: "Nordic Light", background: "#F6FAFF", secondary: "#D7E6FF", accent: "#022e64", text: "#022e64", motif: "nordic" }),
  Object.freeze({ id: "CELEBRATION", name: "Celebration", background: "#0A1733", secondary: "#243B6B", accent: "#D7B56D", text: "#FFFFFF", motif: "celebration" }),
  Object.freeze({ id: "PLATINUM", name: "Platinum", background: "#1A2230", secondary: "#596577", accent: "#D7E6FF", text: "#FFFFFF", motif: "platinum" })
]);

function cleanText(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function userError(message, code = "GIFT_CARD_VALIDATION") {
  const error = new Error(message);
  error.code = code;
  error.publicMessage = message;
  return error;
}

function email(value) {
  const normalized = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
}

function amountText(value) {
  const amount = Number(value?.amount ?? value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return String(Math.round(amount * 100) / 100);
}

function imageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return cleanText(value.url || value.src || value.imageUrl || "", 2000);
}

function secretString(raw) {
  if (typeof raw === "string") return raw.trim();
  for (const key of ["value", "secretValue", "secret", "data"]) {
    if (typeof raw?.[key] === "string" && raw[key].trim()) return raw[key].trim();
  }
  return "";
}

async function requiredSecret(name, publicMessage) {
  let raw;
  try {
    raw = await getSecretValue(name);
  } catch (_) {
    const error = new Error(`${name} is unavailable.`);
    error.code = "GIFT_CARD_CONFIGURATION_REQUIRED";
    error.publicMessage = publicMessage;
    throw error;
  }
  const value = secretString(raw);
  if (!value) {
    const error = new Error(`${name} is empty.`);
    error.code = "GIFT_CARD_CONFIGURATION_REQUIRED";
    error.publicMessage = publicMessage;
    throw error;
  }
  return value;
}

async function fulfillmentKey() {
  const key = await requiredSecret(CODE_KEY_SECRET, "Gift cards are temporarily unavailable for purchase.");
  if (key.length < 32) throw userError("Gift cards are temporarily unavailable for purchase.", "GIFT_CARD_CONFIGURATION_REQUIRED");
  return key;
}

function signedSku({amount, price, currency, styleId, recipientName, recipientEmail, senderName, message, deliveryDate}, key) {
  const signature = createHmac("sha256", key).update(JSON.stringify([
    amount, price, currency, styleId, recipientName, recipientEmail, senderName, message, deliveryDate
  ])).digest("hex");
  return "SK-GC-" + signature.slice(0, 32);
}

function styleById(styleId) {
  const id = cleanText(styleId, 60).toUpperCase();
  return CARD_STYLES.find(style => style.id === id) || null;
}

async function loadGiftCardProduct() {
  const response = await queryGiftCardProducts({ cursorPaging: { limit: 10 } });
  const products = Array.isArray(response?.giftCardProducts) ? response.giftCardProducts : [];
  if (!products.length) {
    const error = new Error("No Wix Gift Card Product is configured.");
    error.code = "GIFT_CARD_PRODUCT_MISSING";
    error.publicMessage = "Gift cards are temporarily unavailable.";
    throw error;
  }
  return products[0];
}

function currencyFor(product = {}) {
  const variant = Array.isArray(product.presetVariants) ? product.presetVariants[0] : null;
  return cleanText(
    variant?.value?.currency || variant?.price?.currency || product.currency || "USD",
    8
  ) || "USD";
}

function formattedAmount(amount, currency = "USD") {
  const numeric = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(numeric);
  } catch (_) {
    return `${currency} ${numeric.toFixed(2)}`;
  }
}

function normalizeVariant(variant = {}, product = {}) {
  const value = amountText(variant.value || variant.price);
  const price = amountText(variant.price || variant.value);
  if (!value || !price) return null;
  const currency = cleanText(
    variant?.value?.currency || variant?.price?.currency || currencyFor(product),
    8
  ) || "USD";
  const id = cleanText(variant._id || variant.id, 100);
  return {
    id,
    amount: value,
    price: {
      amount: price,
      currency,
      formatted: formattedAmount(price, currency)
    },
    value: {
      amount: value,
      currency,
      formatted: formattedAmount(value, currency)
    },
    imageUrl: imageUrl(variant.image) || imageUrl(product.image)
  };
}

function virtualProduct(product, variant, purchaseEnabled) {
  const value = Number(variant.value.amount);
  const display = variant.value.formatted;
  return {
    id: `skandi-gift-card-${variant.id || String(value).replace(/\D/g, "")}`,
    virtualGiftCard: true,
    giftCardProductId: cleanText(product._id || product.id, 100),
    giftCardVariantId: variant.id,
    name: `SKANDI Gift Card — ${display}`,
    brand: "SKANDI Gift Card",
    summary: "Give someone the freedom to choose their own SKANDI journey.",
    description: cleanText(product.description, 3000) || "A digital SKANDI Gift Card delivered to the recipient you choose.",
    sku: `SK-GC-${String(value).replace(/\D/g, "")}`.slice(0, 40),
    categoryNames: ["Gift Cards", "Gifts", "SKANDI"],
    price: variant.price,
    giftCardValue: variant.value,
    imageUrl: variant.imageUrl,
    imageCandidates: [variant.imageUrl].filter(Boolean),
    inStock: true,
    canAddToCart: purchaseEnabled,
    fixedQuantity: true,
    styles: CARD_STYLES.map(style => ({ ...style })),
    recommendation: "A digital gift card redeemable at The Store checkout."
  };
}

export async function getStoreGiftCardCatalogCore() {
  const product = await loadGiftCardProduct();
  const variants = (Array.isArray(product.presetVariants) ? product.presetVariants : [])
    .map(variant => normalizeVariant(variant, product))
    .filter(Boolean)
    .sort((a, b) => Number(a.value.amount) - Number(b.value.amount));

  const purchaseEnabled = await fulfillmentKey().then(() => true, () => false);
  return {
    ok: true,
    purchaseEnabled,
    product: {
      id: cleanText(product._id || product.id, 100),
      revision: cleanText(product.revision, 50),
      name: cleanText(product.name, 200),
      description: cleanText(product.description, 3000),
      expirationType: cleanText(product.expirationType, 30),
      fixedExpirationDate: product.fixedExpirationDate || null,
      relativeExpirationDate: product.relativeExpirationDate || null
    },
    styles: CARD_STYLES.map(style => ({ ...style })),
    variants,
    products: variants.map(variant => virtualProduct(product, variant, purchaseEnabled))
  };
}

function descriptionLine(name, value) {
  return {
    name: { original: cleanText(name, 100) },
    value: { plainText: { original: cleanText(value, 600) } }
  };
}

function normalizeDeliveryDate(value) {
  const raw = cleanText(value, 30);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) return "";
  const today = new Date().toISOString().slice(0, 10);
  if (raw < today) return "";
  return raw;
}

function validatePurchaseInput(payload = {}) {
  const style = styleById(payload.styleId);
  if (!style) throw userError("Choose a gift card design.");
  const recipientName = cleanText(payload.recipientName, 200);
  const recipientEmail = email(payload.recipientEmail);
  const senderName = cleanText(payload.senderName, 200);
  const message = cleanText(payload.message, MAX_MESSAGE_LENGTH);
  const deliveryDate = normalizeDeliveryDate(payload.deliveryDate);
  if (!recipientName) throw userError("Enter the recipient's name.");
  if (!recipientEmail) throw userError("Enter a valid recipient email address.");
  if (!senderName) throw userError("Enter the sender name.");
  if (payload.deliveryDate && !deliveryDate) throw userError("Choose a valid future delivery date.");
  return { style, recipientName, recipientEmail, senderName, message, deliveryDate };
}

export async function addStoreGiftCardToCurrentCartCore(payload = {}) {
  const input = validatePurchaseInput(payload);
  const key = await fulfillmentKey();
  const product = await loadGiftCardProduct();
  const variants = (Array.isArray(product.presetVariants) ? product.presetVariants : [])
    .map(variant => normalizeVariant(variant, product))
    .filter(Boolean);
  const requestedVariantId = cleanText(payload.giftCardVariantId, 100);
  const requestedAmount = amountText(payload.amount);
  const variant = variants.find(item =>
    (requestedVariantId && item.id === requestedVariantId) ||
    (!requestedVariantId && requestedAmount && item.value.amount === requestedAmount)
  );
  if (!variant) throw userError("The selected gift card value is unavailable.", "GIFT_CARD_VARIANT_UNAVAILABLE");

  const sku = signedSku({
    ...input, styleId: input.style.id, amount: variant.value.amount, price: variant.price.amount, currency: variant.value.currency
  }, key);
  const descriptionLines = [
    descriptionLine("Gift card value", variant.value.amount),
    descriptionLine("Gift card style", input.style.name),
    descriptionLine("Recipient", input.recipientName),
    descriptionLine("Recipient email", input.recipientEmail),
    descriptionLine("From", input.senderName),
    ...(input.message ? [descriptionLine("Message", input.message)] : []),
    descriptionLine("Delivery", input.deliveryDate || "Send after payment")
  ];

  const customItem = {
    name: { original: `SKANDI Gift Card — ${variant.value.formatted}` },
    quantityInfo: { requestedQuantity: 1, fixedQuantity: true },
    pricing: { price: { amount: variant.price.amount } },
    attributes: {
      image: variant.imageUrl || undefined,
      descriptionLines,
      physicalProperties: {
        sku,
        shippable: false
      },
      itemType: { preset: "GIFT_CARD" }
    }
  };

  // Resolve the shopper’s cart without elevation. The elevated write can
  // only add this server-priced line to that verified cart.
  let current;
  try {
    current = await currentCartV2.getCurrentCart();
  } catch (error) {
    const status = Number(error?.httpStatus || error?.status || error?.response?.status);
    if (status !== 404) throw error;
  }
  if (!current?.cart?._id && !current?.cart?.id) current = await currentCartV2.createCurrentCart({});
  const cartId = current?.cart?._id || current?.cart?.id;
  if (!cartId) throw userError("Your shopping bag could not be opened.", "GIFT_CARD_CART_UNAVAILABLE");
  const response = await addGiftCardLine(cartId, { customItems: [customItem] });
  const cart = response?.cart;
  if ((cart?._id || cart?.id) !== cartId || !cart?.lineItems?.some(line => line?.attributes?.physicalProperties?.sku === sku)) {
    throw userError("The gift card could not be confirmed in your bag. Check your bag before trying again.", "GIFT_CARD_CART_UNCONFIRMED");
  }
  return {
    ok: true,
    cart,
    giftCard: {
      productId: cleanText(product._id || product.id, 100),
      variantId: variant.id,
      amount: variant.value.amount,
      styleId: input.style.id,
      styleName: input.style.name
    }
  };
}

function lineText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return cleanText(
    value?.plainText?.original || value?.plainText?.translated ||
    value?.original || value?.translated || value?.name || "",
    600
  );
}

function descriptionMap(lines = []) {
  const map = new Map();
  if (!Array.isArray(lines)) return map;
  for (const line of lines) {
    const key = lineText(line?.name).toLowerCase();
    const value = lineText(line?.value);
    if (key && value) map.set(key, value);
  }
  return map;
}

function isSkandiGiftCardLine(item = {}) {
  const preset = cleanText(item?.itemType?.preset || item?.attributes?.itemType?.preset, 40).toUpperCase();
  const sku = cleanText(item?.physicalProperties?.sku || item?.attributes?.physicalProperties?.sku, 40).toUpperCase();
  const name = lineText(item.productName || item.name);
  return preset === "GIFT_CARD" && (sku.startsWith("SK-GC-") || /^SKANDI Gift Card/i.test(name));
}

function expirationDateFor(product = {}) {
  const type = cleanText(product.expirationType, 30).toUpperCase();
  if (type === "FIXED" && product.fixedExpirationDate) return new Date(product.fixedExpirationDate);
  if (type !== "RELATIVE") return undefined;
  const relative = product.relativeExpirationDate || {};
  const value = Number(relative.value || 0);
  const period = cleanText(relative.period, 20).toUpperCase();
  if (!Number.isInteger(value) || value < 1) return undefined;
  const date = new Date();
  if (period === "DAYS") date.setUTCDate(date.getUTCDate() + value);
  else if (period === "WEEKS") date.setUTCDate(date.getUTCDate() + (value * 7));
  else if (period === "MONTHS") date.setUTCMonth(date.getUTCMonth() + value);
  else if (period === "YEARS") date.setUTCFullYear(date.getUTCFullYear() + value);
  else return undefined;
  return date;
}

function deterministicCode(orderId, lineItemId, key) {
  const digest = createHmac("sha256", key)
    .update(`${orderId}:${lineItemId}:SKANDI-GIFT-CARD-V12`, "utf8")
    .digest("hex")
    .toUpperCase();
  return `SK${digest.slice(0, 16)}`;
}

function idempotencyKey(orderId, lineItemId, key) {
  return createHmac("sha256", key)
    .update(`${orderId}:${lineItemId}:SKANDI-GIFT-CARD-CREATE`, "utf8")
    .digest("hex");
}

async function existingGiftCardByCode(code) {
  const result = await queryGiftCards({
    filter: { code: { $eq: code } },
    cursorPaging: { limit: 1 }
  });
  return Array.isArray(result?.giftCards) && result.giftCards.length ? result.giftCards[0] : null;
}

export async function finalizeStoreGiftCardsCore({ orderId } = {}) {
  const id = cleanText(orderId, 100);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw userError("A valid order reference is required.", "INVALID_ORDER_REFERENCE");
  }

  // Never elevate this read. Wix must verify the current visitor/member owns the order.
  const order = await orders.getOrder(id);
  if (!order || (order._id || order.id) !== id) throw userError("This order is unavailable in your current session.", "ORDER_UNAVAILABLE");

  return fulfillPaidStoreGiftCardsCore(order);
}

// Only the verified owner read above and the Wix backend payment event call this.
export async function fulfillPaidStoreGiftCardsCore(order = {}) {
  if (cleanText(order.paymentStatus, 40).toUpperCase() !== "PAID") {
    return { ok: true, pending: true, issued: 0, existing: 0, reason: "ORDER_NOT_PAID" };
  }
  const lines = (Array.isArray(order.lineItems) ? order.lineItems : []).filter(isSkandiGiftCardLine);
  if (!lines.length) return { ok: true, pending: false, issued: 0, existing: 0, giftCards: [] };
  const id = cleanText(order._id || order.id, 100);
  if (!id) throw new Error("Gift card order reference is missing.");
  const key = await fulfillmentKey();
  const product = await loadGiftCardProduct();
  const expirationDate = expirationDateFor(product);
  const currency = cleanText(order.currency, 8).toUpperCase();
  const buyerEmail = email(order?.buyerInfo?.email);
  const results = [];

  for (const item of lines) {
    const meta = descriptionMap(item.descriptionLines || item?.attributes?.descriptionLines || []);
    const styleName = cleanText(meta.get("gift card style"), 100);
    const style = CARD_STYLES.find(candidate => candidate.name.toLowerCase() === styleName.toLowerCase());
    const recipientName = cleanText(meta.get("recipient"), 200);
    const recipientEmail = email(meta.get("recipient email"));
    const senderName = cleanText(meta.get("from"), 200);
    const message = cleanText(meta.get("message"), MAX_MESSAGE_LENGTH);
    const deliveryValue = cleanText(meta.get("delivery"), 40);
    const deliveryDate = /^\d{4}-\d{2}-\d{2}$/.test(deliveryValue) ? deliveryValue : "";
    const amount = amountText(meta.get("gift card value"));
    const price = amountText(item.price || item?.pricing?.unitPrice);
    const sku = cleanText(item?.physicalProperties?.sku || item?.attributes?.physicalProperties?.sku, 40);
    const lineItemId = cleanText(item._id || item.id, 100);
    if (!style || !recipientName || !recipientEmail || !senderName || !currency || !amount || !price ||
        !lineItemId || Number(item.quantity) !== 1 || !/^SK-GC-[a-f0-9]{32}$/i.test(sku)) {
      throw new Error("A paid gift card line could not be validated.");
    }
    const expected = signedSku({
      amount, price, currency, styleId: style.id, recipientName, recipientEmail, senderName, message, deliveryDate
    }, key);
    if (!timingSafeEqual(Buffer.from(sku.toLowerCase()), Buffer.from(expected.toLowerCase()))) {
      throw new Error("A paid gift card line did not match the authorized purchase.");
    }

    const code = deterministicCode(id, lineItemId, key);
    const existing = await existingGiftCardByCode(code);
    if (existing) {
      results.push({
        lineItemId, giftCardId: cleanText(existing._id || existing.id, 100),
        codeSuffix: cleanText(existing.codeSuffix || code.slice(-4), 4),
        amount, styleId: style.id, existing: true
      });
      continue;
    }

    // Noon UTC keeps the requested delivery date in the Store's New York time zone.
    const scheduled = deliveryDate ? new Date(`${deliveryDate}T12:00:00Z`) : null;
    const created = await createGiftCard({
      code,
      initialValue: { amount },
      currency,
      source: "ORDER",
      orderInfo: { orderId: id, orderNumber: String(order.number || "") },
      ...(expirationDate ? { expirationDate } : {}),
      notificationInfo: {
        recipient: { name: recipientName, email: recipientEmail },
        sender: { name: senderName, ...(buyerEmail ? { email: buyerEmail } : {}) },
        ...(message ? { personalizedMessage: message } : {}),
        ...(scheduled && scheduled.getTime() > Date.now() ? { notificationDate: scheduled } : {})
      }
    }, { idempotencyKey: idempotencyKey(id, lineItemId, key) });
    const card = created?.giftCard || created;
    const giftCardId = cleanText(card?._id || card?.id, 100);
    if (!giftCardId) throw new Error("Wix Gift Cards did not confirm issuance.");
    results.push({ lineItemId, giftCardId, codeSuffix: cleanText(card.codeSuffix || code.slice(-4), 4),
      amount, styleId: style.id, existing: false });
  }

  return { ok: true, pending: false, issued: results.filter(item => !item.existing).length,
    existing: results.filter(item => item.existing).length, giftCards: results };
}

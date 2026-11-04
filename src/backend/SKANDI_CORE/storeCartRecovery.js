// Trusted backend only. Wix owns checkout, consent, email delivery and idempotency.
import { createHash, timingSafeEqual } from "crypto";
import { Buffer } from "buffer";
import { auth } from "@wix/essentials";
import { abandonedCheckouts } from "@wix/ecom";
import { emailSubscriptions } from "@wix/email-subscriptions";
import { emailTransmissions } from "@wix/email-transmissions";
import { checkout } from "wix-ecom-backend";
import { contacts } from "wix-crm-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { getStoreEmailRecommendationsCore } from "backend/SKANDI_CORE/storefront";
import { renderStoreCartRecovery, UNSUBSCRIBE_MARKER } from "backend/SKANDI_CORE/storeCartRecoveryTemplates";

const readSecret = elevate(secrets.getSecretValue);
const getAbandoned = auth.elevate(abandonedCheckouts.getAbandonedCheckout);
const queryAbandoned = auth.elevate(abandonedCheckouts.queryAbandonedCheckouts);
const getCheckout = elevate(checkout.getCheckout);
const querySubscriptions = auth.elevate(emailSubscriptions.queryEmailSubscriptions);
const sendTransmission = auth.elevate(emailTransmissions.sendEmailTransmission);
const GUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const TOKEN = /^[0-9a-f]{64}$/;
const EMAIL = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const STORE_APP = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const HOURS = 3600000;
const LOCALES = Object.freeze({ en: "en-US", sv: "sv-SE", no: "nb-NO", da: "da-DK", fi: "fi-FI" });
const DISCOUNT_LABELS = Object.freeze({
  en: ["Coupon", "Discount", "Shipping discount", "Item discount"],
  sv: ["Kupong", "Rabatt", "Fraktrabatt", "Produktrabatt"],
  no: ["Kupong", "Rabatt", "Fraktrabatt", "Varerabatt"],
  da: ["Kupon", "Rabat", "Fragtrabat", "Varerabat"],
  fi: ["Kuponki", "Alennus", "Toimitusalennus", "Tuotealennus"]
});

function recoveryError(code, status = 503) {
  return Object.assign(new Error(code), { recoveryCode: code, status });
}

function clean(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isoLanguage(value) {
  const code = clean(value, 30).toLowerCase().split(/[-_]/)[0];
  const normalized = ({ nb: "no", nn: "no", dk: "da", se: "sv" })[code] || code;
  return Object.prototype.hasOwnProperty.call(LOCALES, normalized) ? normalized : "";
}

function skip(reason) {
  return { ok: true, outcome: "SKIPPED", reason };
}

function assertGuid(value) {
  const id = clean(value, 100).toLowerCase();
  if (!GUID.test(id)) throw recoveryError("CART_RECOVERY_INVALID_ID", 400);
  return id;
}

async function secret(name) {
  const result = await readSecret(name);
  return clean(typeof result === "string" ? result : result?.value, 12000);
}

export async function authorizeStoreCartRecovery(token) {
  if (typeof token !== "string" || !TOKEN.test(token)) return false;
  const expected = await secret("SKANDI_STORE_CART_RECOVERY_TOKEN");
  return TOKEN.test(expected) && timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
}

async function configuration() {
  let config;
  try { config = JSON.parse(await secret("SKANDI_STORE_CART_RECOVERY_CONFIG")); }
  catch (_) { throw recoveryError("CART_RECOVERY_CONFIG_REQUIRED"); }
  if (!config || typeof config.enabled !== "boolean" ||
      !EMAIL.test(clean(config.fromEmail, 254)) || !EMAIL.test(clean(config.replyTo, 254))) {
    throw recoveryError("CART_RECOVERY_CONFIG_INVALID");
  }
  return { ...config, fromEmail: clean(config.fromEmail, 254), replyTo: clean(config.replyTo, 254) };
}

function httpsUrl(value, allowedDomains) {
  try {
    const parsed = new URL(clean(value, 4096));
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) return "";
    if (allowedDomains && !allowedDomains.some(domain => parsed.hostname === domain || parsed.hostname.endsWith("." + domain))) return "";
    return parsed.href;
  } catch (_) {
    return "";
  }
}

function imageUrl(value) {
  const input = clean(value, 4096);
  const media = /^wix:image:\/\/v1\/([A-Za-z0-9_.~%-]+)(?:\/|#|$)/.exec(input);
  if (media) return "https://static.wixstatic.com/media/" + media[1];
  return httpsUrl(input);
}

async function lookupAbandoned(input) {
  if (input.abandonedCheckoutId !== undefined) {
    const requestedId = assertGuid(input.abandonedCheckoutId);
    const result = await getAbandoned(requestedId);
    const record = result?.abandonedCheckout || result;
    return (record?._id || record?.id) === requestedId ? record : null;
  }
  const checkoutId = assertGuid(input.checkoutId);
  const contactId = assertGuid(input.contactId);
  const result = await queryAbandoned({
    filter: { "buyerInfo.contactId": { $eq: contactId } },
    cursorPaging: { limit: 100 }
  });
  const rows = result.abandonedCheckouts || result.results || [];
  return rows.find(row => row.checkoutId === checkoutId && row.buyerInfo?.contactId === contactId) || null;
}

async function profileFor(memberId, buyerEmail) {
  if (!GUID.test(memberId || "")) return null;
  const profile = await restRequest({
    table: "customer_profiles",
    query: {
      select: "wix_member_id,email,auth_email,is_loyalty_member,marketing_consent,preferred_language_id",
      wix_member_id: "eq." + memberId,
      limit: 2
    }
  });
  if (profile?.length !== 1) return null;
  const row = profile[0];
  return [row.email, row.auth_email].some(email => clean(email, 254).toLowerCase() === buyerEmail) ? row : null;
}

async function preferredLanguage(profile, checkoutLanguage) {
  if (GUID.test(profile?.preferred_language_id || "")) {
    const matches = await restRequest({
      table: "languages",
      query: { select: "language_code", id: "eq." + profile.preferred_language_id, active: "eq.true", limit: 1 }
    });
    const preferred = isoLanguage(matches?.[0]?.language_code);
    if (preferred) return preferred;
  }
  return isoLanguage(checkoutLanguage) || "en";
}

async function optedIn(email) {
  const result = await querySubscriptions({ email: { $in: [email] } }, { paging: { limit: 2, offset: 0 } });
  const rows = result.subscriptions || [];
  if (rows.length !== 1 || clean(rows[0].email, 254).toLowerCase() !== email) return false;
  return rows[0].subscriptionStatus === "SUBSCRIBED" &&
    ["VALID", "NOT_SET"].includes(rows[0].deliverabilityStatus || "NOT_SET");
}

function clubOfferTerms(config, profile, now) {
  const offer = config.clubOffer;
  if (profile?.is_loyalty_member !== false || profile?.marketing_consent !== true || offer?.active !== true) return "";
  const begins = Date.parse(offer.startsAt);
  const ends = Date.parse(offer.endsAt);
  if (!(begins <= now && now < ends)) return "";
  return httpsUrl(offer.termsUrl, ["skanditravels.com"]);
}

function priceNumber(amount) {
  const text = clean(amount, 32);
  if (!/^\d{1,11}(?:\.\d{1,8})?$/.test(text)) throw recoveryError("CART_RECOVERY_PRICE_UNAVAILABLE");
  return Number(text);
}

function translated(value, useTranslation) {
  return clean(useTranslation ? value?.translated || value?.original : value?.original || value?.translated);
}

function normalizeCart(current, language) {
  const summary = current.priceSummary;
  const discounts = Array.isArray(current.appliedDiscounts) ? current.appliedDiscounts : [];
  const gift = current.giftCard?.amount;
  const selectedShipping = current.shippingInfo?.selectedCarrierServiceOption;
  const displayAmounts = [summary?.subtotal, summary?.total];
  for (const item of current.lineItems) {
    displayAmounts.push(item.price);
    for (const price of [item.lineItemPrice, item.fullPrice || item.priceBeforeDiscounts]) {
      if (price) displayAmounts.push(price);
    }
  }
  for (const discount of discounts) {
    const amount = (discount.coupon || discount.discountRule || discount.merchantDiscount)?.amount;
    if (amount) displayAmounts.push(amount);
  }
  for (const price of [selectedShipping && summary?.shipping, summary?.tax, gift]) {
    if (price) displayAmounts.push(price);
  }
  const converted = /^[A-Z]{3}$/.test(current.conversionCurrency || "") &&
    current.currency !== current.conversionCurrency &&
    displayAmounts.every(amount => /^\d{1,11}(?:\.\d{1,8})?$/.test(amount?.convertedAmount || ""));
  const currency = converted ? current.conversionCurrency : current.currency;
  if (!/^[A-Z]{3}$/.test(currency || "")) throw recoveryError("CART_RECOVERY_CURRENCY_UNAVAILABLE");
  const format = new Intl.NumberFormat(LOCALES[language], { style: "currency", currency });
  const amount = price => priceNumber(converted ? price?.convertedAmount : price?.amount);
  const money = price => format.format(amount(price));
  const useTranslation = isoLanguage(current.buyerLanguage) === language;
  const labels = DISCOUNT_LABELS[language];
  const items = current.lineItems.map(item => {
    const name = translated(item.productName, useTranslation);
    if (!name || !Number.isSafeInteger(item.quantity) || item.quantity < 1) throw recoveryError("CART_RECOVERY_ITEM_INVALID");
    const price = amount(item.price);
    const original = item.fullPrice || item.priceBeforeDiscounts;
    const options = (item.descriptionLines || []).map(line => {
      const label = translated(line.name, useTranslation);
      const value = translated(line.plainText || line.colorInfo, useTranslation);
      return value ? [label, value].filter(Boolean).join(": ") : "";
    }).filter(Boolean);
    return {
      name, quantity: item.quantity,
      imageUrl: imageUrl(item.media || item.image),
      optionsText: options.join(" · "),
      unitPriceFormatted: money(item.price),
      originalUnitPriceFormatted: original && amount(original) > price ? money(original) : "",
      lineTotalFormatted: item.lineItemPrice ? money(item.lineItemPrice) : format.format(price * item.quantity)
    };
  });
  return {
    currency,
    items,
    subtotalFormatted: money(summary.subtotal),
    totalFormatted: money(summary.total),
    discounts: discounts.map(discount => {
      const source = discount.coupon || discount.discountRule || discount.merchantDiscount || {};
      const code = clean(discount.coupon?.code, 100);
      const name = clean(discount.coupon?.name) || translated(discount.discountRule?.name, useTranslation);
      const scope = discount.discountType === "SHIPPING" ? labels[2] : discount.discountType === "SPECIFIC_ITEMS" ? labels[3] : labels[1];
      return {
        label: name && name !== code ? name : code ? labels[0] : scope,
        code,
        amountFormatted: source.amount && amount(source.amount) > 0 ? money(source.amount) : ""
      };
    }),
    shippingFormatted: selectedShipping && summary.shipping ? money(summary.shipping) : "",
    taxFormatted: current.taxIncludedInPrice === false && summary.tax && amount(summary.tax) > 0 ? money(summary.tax) : "",
    giftCardFormatted: gift && amount(gift) > 0 ? money(gift) : "",
    offers: []
  };
}

async function recommendationCards(items) {
  const refs = items.filter(item => item.catalogReference?.appId === STORE_APP && GUID.test(item.catalogReference.catalogItemId));
  if (!refs.length) return [];
  try {
    const result = await getStoreEmailRecommendationsCore({
      product_id: refs[0].catalogReference.catalogItemId,
      line_items: refs.map(item => ({
        id: item.catalogReference.catalogItemId, item_name: item.productName?.original || ""
      }))
    });
    return [1, 2].map(index => ({
      name: clean(result["recommendation" + index + "Name"]),
      url: httpsUrl(result["recommendation" + index + "Url"], ["skanditravels.com"]),
      imageUrl: imageUrl(result["recommendation" + index + "ImageUrl"])
    })).filter(card => card.name && card.url && card.imageUrl);
  } catch (_) {
    console.warn("[SKANDI Cart Recovery] Recommendations unavailable");
    return [];
  }
}

// UUID-shaped, stable across retries, deployment changes and repeated abandonments of one checkout.
function deliveryKey(checkoutId) {
  const hex = createHash("sha256").update("SKANDI:STORE:CART-RECOVERY:" + checkoutId).digest("hex");
  return [hex.slice(0, 8), hex.slice(8, 12), "8" + hex.slice(13, 16),
    "8" + hex.slice(17, 20), hex.slice(20, 32)].join("-");
}

export async function processStoreCartRecovery(input) {
  const config = await configuration();
  const preview = input.mode === "preview";
  if (!preview && !config.enabled) return skip("DISABLED");
  const abandonment = await lookupAbandoned(input);
  if (!abandonment || abandonment.status !== "ABANDONED" || abandonment.checkoutRecoveredDate) return skip("NOT_ABANDONED");
  if (abandonment.activities?.some(activity => activity.type === "EMAIL_SENT")) return skip("WIX_RECOVERY_ALREADY_SENT");
  const checkoutId = assertGuid(abandonment.checkoutId);
  const abandonedAt = Date.parse(abandonment._createdDate || abandonment.createdDate);
  const now = Date.now();
  if (!Number.isFinite(abandonedAt)) return skip("ABANDONMENT_TIME_UNVERIFIED");
  if (!preview && now - abandonedAt < 2 * HOURS) return skip("WAITING_FOR_DELAY");
  const buyer = abandonment.buyerInfo;
  if (!GUID.test(buyer?.contactId || "")) return skip("CONTACT_UNVERIFIED");
  const email = clean(buyer.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return skip("CONTACT_UNVERIFIED");
  const checkoutUrl = httpsUrl(abandonment.checkoutUrl, ["skanditravels.com", "wix.com", "wixsite.com", "wixapis.com"]);
  if (!checkoutUrl) throw recoveryError("CART_RECOVERY_LINK_UNVERIFIED");

  const [current, contact, subscribed, profile] = await Promise.all([
    getCheckout(checkoutId),
    contacts.getContact(buyer.contactId, { suppressAuth: true }),
    optedIn(email),
    profileFor(buyer.memberId, email)
  ]);
  if (current?._id !== checkoutId || current.completed !== false || !current.lineItems?.length) {
    return skip("CHECKOUT_CLOSED_OR_EMPTY");
  }
  if (current.buyerInfo?.contactId !== buyer.contactId ||
      clean(current.buyerInfo?.email, 254).toLowerCase() !== email ||
      contact?._id !== buyer.contactId || clean(contact.primaryInfo?.email, 254).toLowerCase() !== email) {
    return skip("RECIPIENT_MISMATCH");
  }
  if (!subscribed || profile?.marketing_consent === false) return skip("MARKETING_NOT_PERMITTED");
  if (current.calculationErrors?.orderValidationErrors?.length) return skip("CHECKOUT_HAS_VALIDATION_ERRORS");
  const language = await preferredLanguage(profile, current.buyerLanguage || abandonment.buyerLanguage);
  const cart = normalizeCart(current, language);
  const recommendations = await recommendationCards(current.lineItems);
  const clubOfferTermsUrl = clubOfferTerms(config, profile, now);
  const { html, subject } = renderStoreCartRecovery(language, {
    checkoutUrl, currency: cart.currency, cart, recommendations, clubOfferTermsUrl,
    firstName: clean(contact.info?.name?.first || abandonment.contactDetails?.firstName, 100)
  });
  if (html.split(UNSUBSCRIBE_MARKER).length !== 2 || html.length > 1000000) {
    throw recoveryError("CART_RECOVERY_RENDER_INVALID");
  }
  const summary = {
    itemCount: cart.items.length, discountCount: cart.discounts.length, language,
    recommendationCount: recommendations.length, clubOffer: Boolean(clubOfferTermsUrl)
  };
  if (preview) return { ok: true, outcome: "PREVIEW_READY", ...summary };

  // Recheck after rendering so a purchase, cart update or opt-out during the work stops delivery.
  const [latest, stillSubscribed] = await Promise.all([getCheckout(checkoutId), optedIn(email)]);
  if (!stillSubscribed || latest?._id !== checkoutId || latest.completed !== false ||
      latest.buyerInfo?.contactId !== buyer.contactId ||
      clean(latest.buyerInfo?.email, 254).toLowerCase() !== email ||
      !latest._updatedDate || new Date(latest._updatedDate).getTime() !== new Date(current._updatedDate).getTime()) {
    return skip("CHECKOUT_OR_CONSENT_CHANGED");
  }
  const result = await sendTransmission({
    type: "MARKETING",
    emailSubject: subject,
    emailHtmlContent: html,
    senderName: "THE STORE by SKANDI",
    senderEmailAddress: config.fromEmail,
    replyTo: { emailAddress: config.replyTo },
    toRecipients: [{ contactId: buyer.contactId }],
    metadata: { workflow: "skandi-store-cart-recovery", checkoutId },
    marketingOptions: { unsubscribeUrlPlaceholder: UNSUBSCRIBE_MARKER }
  }, { idempotencyKey: deliveryKey(checkoutId) });
  const transmission = result?.emailTransmission;
  if (!GUID.test(transmission?._id || "") || !["ACCEPTED", "IN_PROGRESS", "PROCESSED"].includes(transmission.status)) {
    throw recoveryError("CART_RECOVERY_TRANSMISSION_UNCONFIRMED", 502);
  }
  return { ok: true, outcome: "TRANSMISSION_RECORDED", transmissionId: transmission._id, providerStatus: transmission.status };
}

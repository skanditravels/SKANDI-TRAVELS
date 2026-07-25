import wixLocationFrontend from "wix-location-frontend";
import wixEcomFrontend from "wix-ecom-frontend";
import { currentCart } from "wix-ecom-backend";

import { listStorefrontProducts } from "backend/skandiStorefront.web";
import { createPublicSupportCase } from "backend/chatwootSupport.web";

const EMBED_ID = "#skandiStoreEmbed";

const STOREFRONT_SOURCE = "SKANDI_STOREFRONT";
const SUPPORT_SOURCE = "SKANDI_SUPPORT_PUBLIC";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const WIX_STORES_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

// Change this only if your Wix order-history page uses another URL.
const ORDERS_PATH = "/my-orders";

let loadPromise = null;

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function normalizeMoney(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return (
    value.formattedAmount ||
    value.formattedConvertedAmount ||
    value.formatted ||
    value.formattedPrice ||
    value.amount ||
    value.convertedAmount ||
    value.price ||
    ""
  );
}

function normalizeMediaUrl(media = {}) {
  return (
    media.src ||
    media.url ||
    media.image?.url ||
    media.imageInfo?.url ||
    ""
  );
}

function normalizeDescriptionLines(lines = []) {
  if (!Array.isArray(lines)) {
    return "";
  }

  return lines
    .map((line) => {
      const name =
        line.name?.original ||
        line.name?.translated ||
        line.name ||
        "";

      const value =
        line.value?.original ||
        line.value?.translated ||
        line.value ||
        "";

      if (!name) {
        return String(value || "");
      }

      return value ? `${name}: ${value}` : String(name);
    })
    .filter(Boolean)
    .join(", ");
}

function normalizeCart(response = {}) {
  // Supports both a direct Cart response and { cart: Cart }.
  const raw = response.cart || response || {};
  const lineItems = raw.lineItems || raw.items || [];

  const normalizedItems = lineItems.map((item) => {
    const catalogReference = item.catalogReference || {};
    const productName = item.productName || {};
    const media =
      item.media ||
      item.mediaItem ||
      item.image ||
      {};

    return {
      id:
        item._id ||
        item.id ||
        item.lineItemId ||
        "",

      productId:
        item.productId ||
        catalogReference.catalogItemId ||
        catalogReference.productId ||
        "",

      name:
        productName.original ||
        productName.translated ||
        item.name ||
        (typeof item.productName === "string"
          ? item.productName
          : "") ||
        "Product",

      quantity: Math.max(1, Number(item.quantity || 1)),

      imageUrl:
        normalizeMediaUrl(media) ||
        item.imageUrl ||
        "",

      optionsLabel:
        normalizeDescriptionLines(item.descriptionLines) ||
        item.optionsLabel ||
        "",

      priceLabel:
        normalizeMoney(item.lineItemPrice) ||
        normalizeMoney(item.totalPrice) ||
        normalizeMoney(item.fullPrice) ||
        normalizeMoney(item.price)
    };
  });

  return {
    id: raw._id || raw.id || "",

    lineItems: normalizedItems,

    totalLabel:
      normalizeMoney(raw.priceSummary?.total) ||
      normalizeMoney(raw.totals?.total) ||
      normalizeMoney(raw.subtotalAfterDiscounts) ||
      normalizeMoney(raw.subtotal) ||
      normalizeMoney(raw.total) ||
      ""
  };
}

function buildCatalogOptions(payload = {}) {
  if (
    payload.catalogOptions &&
    typeof payload.catalogOptions === "object"
  ) {
    return payload.catalogOptions;
  }

  const options = {};

  /*
   * Wix Stores products with managed variants must send variantId.
   * The product-listing web method should include variant data so the
   * HTML can return the selected variantId.
   */
  if (payload.variantId) {
    options.variantId = payload.variantId;
  } else if (
    payload.choices &&
    typeof payload.choices === "object" &&
    Object.keys(payload.choices).length
  ) {
    /*
     * Used for products whose variants are not inventory-managed.
     */
    options.options = payload.choices;
  }

  if (
    payload.customTextFields &&
    typeof payload.customTextFields === "object" &&
    Object.keys(payload.customTextFields).length
  ) {
    options.customTextFields = payload.customTextFields;
  }

  return Object.keys(options).length
    ? options
    : undefined;
}

function toCurrentCartPayload(payload = {}) {
  const productId =
    payload.productId ||
    payload.catalogItemId;

  if (!productId) {
    throw new Error("The selected product could not be identified.");
  }

  const catalogReference = {
    appId: WIX_STORES_APP_ID,
    catalogItemId: productId
  };

  const catalogOptions = buildCatalogOptions(payload);

  if (catalogOptions) {
    catalogReference.options = catalogOptions;
  }

  return {
    lineItems: [
      {
        catalogReference,
        quantity: Math.max(
          1,
          Number(payload.quantity || 1)
        )
      }
    ]
  };
}

async function refreshNativeCartUi() {
  try {
    await wixEcomFrontend.refreshCart();
  } catch (error) {
    console.warn("Cart UI could not be refreshed.", error);
  }
}

async function sendCart() {
  try {
    const activeCart =
      await currentCart.getCurrentCart();

    send("STOREFRONT_CART", {
      cart: normalizeCart(activeCart)
    });
  } catch (error) {
    /*
     * Wix can return an error when no current cart exists yet.
     * The storefront should display an empty bag in that situation.
     */
    send("STOREFRONT_CART", {
      cart: {
        id: "",
        lineItems: [],
        totalLabel: ""
      }
    });
  }
}

async function loadProducts() {
  /*
   * Prevent STOREFRONT_READY and the initial page load from
   * requesting the catalog twice simultaneously.
   */
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    send("STOREFRONT_PROGRESS", {
      message: "Loading products..."
    });

    const storefrontData =
      await listStorefrontProducts({
        limit: 300,
        context: "public"
      });

    send("STOREFRONT_PRODUCTS", storefrontData || {});
    await sendCart();

    return storefrontData;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

async function addProduct(payload = {}) {
  const cartPayload =
    toCurrentCartPayload(payload);

  const response =
    await currentCart.addToCurrentCart(cartPayload);

  await refreshNativeCartUi();

  send("STOREFRONT_CART", {
    cart: normalizeCart(response)
  });
}

async function openCheckout() {
  const activeCart =
    await currentCart.getCurrentCart();

  if (!activeCart?.lineItems?.length) {
    throw new Error(
      "Your shopping bag is empty."
    );
  }

  const checkoutResponse =
    await currentCart.createCheckoutFromCurrentCart({
      channelType: "WEB"
    });

  const checkoutId =
    checkoutResponse?.checkoutId ||
    checkoutResponse?._id ||
    checkoutResponse?.id;

  if (!checkoutId) {
    throw new Error(
      "Checkout could not be created."
    );
  }

  await wixEcomFrontend.navigateToCheckoutPage(
    checkoutId
  );
}

async function handleStorefrontMessage(message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "STOREFRONT_READY":
    case "STOREFRONT_REFRESH":
      await loadProducts();
      return;

    case "STOREFRONT_CART_REQUEST":
      await sendCart();
      return;

    case "STOREFRONT_ADD_TO_CART":
      send("STOREFRONT_PROGRESS", {
        message: "Adding to bag..."
      });

      await addProduct(payload);
      return;

    case "STOREFRONT_CHECKOUT":
      send("STOREFRONT_PROGRESS", {
        message: "Opening checkout..."
      });

      await openCheckout();
      return;

    case "STOREFRONT_ORDERS":
      wixLocationFrontend.to(ORDERS_PATH);
      return;

    case "STOREFRONT_NAVIGATE":
      if (payload.path) {
        wixLocationFrontend.to(payload.path);
      }
      return;

    default:
      return;
  }
}

async function handleSupportMessage(message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "PUBLIC_SUPPORT_CREATE_CASE": {
      const result =
        await createPublicSupportCase({
          input: payload
        });

      send(
        "PUBLIC_SUPPORT_CASE_CREATED",
        result || {}
      );
      return;
    }

    case "PUBLIC_SUPPORT_NAVIGATE":
      if (payload.path) {
        wixLocationFrontend.to(payload.path);
      }
      return;

    default:
      return;
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};

    if (message.source === SUPPORT_SOURCE) {
      try {
        await handleSupportMessage(message);
      } catch (error) {
        console.error(
          "Support request failed:",
          error
        );

        send("PUBLIC_SUPPORT_ERROR", {
          message:
            error?.message ||
            "Support request failed."
        });
      }

      return;
    }

    if (message.source !== STOREFRONT_SOURCE) {
      return;
    }

    try {
      await handleStorefrontMessage(message);
    } catch (error) {
      console.error(
        "Store action failed:",
        error
      );

      send("STOREFRONT_ERROR", {
        message:
          error?.message ||
          "Store action failed."
      });
    }
  });

  /*
   * Keep the embedded bag synchronized if the native Wix cart
   * changes elsewhere on the site.
   */
  if (
    typeof wixEcomFrontend.onCartChange ===
    "function"
  ) {
    wixEcomFrontend.onCartChange(() => {
      sendCart();
    });
  }

  /*
   * Fallback initial load. If the HTML sends STOREFRONT_READY
   * at the same time, loadPromise prevents a duplicate request.
   */
  loadProducts().catch((error) => {
    console.error(
      "Initial store load failed:",
      error
    );

    send("STOREFRONT_ERROR", {
      message:
        error?.message ||
        "The store could not be loaded."
    });
  });
});
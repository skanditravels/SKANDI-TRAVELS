import wixLocationFrontend from "wix-location-frontend";
import wixEcomFrontend from "wix-ecom-frontend";

import {
  listStorefrontProducts,
  resolveStoreVariant
} from "backend/skandiStorefront.web";

import {
  getStorefrontCartV2,
  addProductToCurrentCartV2
} from "backend/storeCartV2.web";

const EMBED_ID =
  "#skandiStoreEmbed";

const STOREFRONT_SOURCE =
  "SKANDI_STOREFRONT";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const WIX_STORES_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

const CHECKOUT_PATH =
  "/store/checkout";

const ORDERS_PATH =
  "/my-orders";

let embed = null;
let loadingPromise = null;
let cachedCatalog = null;

function parseMessage(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }
  return value && typeof value === "object"
    ? value
    : null;
}

function send(type, payload = {}) {
  if (!embed || typeof embed.postMessage !== "function") {
    return;
  }

  embed.postMessage({
    source:
      PARENT_SOURCE,
    type,
    payload,
    timestamp:
      new Date().toISOString()
  });
}

function textValue(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return (
    value.translated ||
    value.original ||
    value.formattedAmount ||
    value.formatted ||
    fallback
  );
}

function moneyLabel(value) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return (
    value.formattedAmount ||
    value.formattedConvertedAmount ||
    value.formatted ||
    value.amount ||
    value.convertedAmount ||
    ""
  );
}

function normalizeCartV2(raw = {}) {
  const cart =
    raw?.cart ||
    raw ||
    {};

  const items =
    Array.isArray(cart.lineItems)
      ? cart.lineItems
      : [];

  return {
    id:
      cart._id ||
      cart.id ||
      "",

    lineItems:
      items.map(
        (item) => ({
          id:
            item._id ||
            item.id ||
            "",

          productId:
            item
              ?.source
              ?.catalogReference
              ?.catalogItemId ||
            "",

          name:
            textValue(
              item.name,
              "Product"
            ),

          quantity:
            Number(
              item
                ?.quantityInfo
                ?.requestedQuantity ??
              item
                ?.quantityInfo
                ?.confirmedQuantity ??
              1
            ),

          imageUrl:
            item
              ?.attributes
              ?.image
              ?.url ||
            "",

          optionsLabel:
            Array.isArray(
              item
                ?.attributes
                ?.descriptionLines
            )
              ? item
                  .attributes
                  .descriptionLines
                  .map(
                    (line) => {
                      const name =
                        textValue(
                          line.name
                        );

                      const value =
                        textValue(
                          line.value
                        );

                      return (
                        name &&
                        value
                      )
                        ? `${name}: ${value}`
                        : (
                            name ||
                            value
                          );
                    }
                  )
                  .filter(Boolean)
                  .join(", ")
              : "",

          priceLabel:
            moneyLabel(
              item
                ?.pricing
                ?.totalPrice
            )
        })
      ),

    totalLabel:
      moneyLabel(
        cart.subtotal
      )
  };
}

async function loadCatalog(force = false) {
  if (cachedCatalog && !force) {
    send(
      "STOREFRONT_PRODUCTS",
      cachedCatalog
    );
    return cachedCatalog;
  }

  if (loadingPromise && !force) {
    return loadingPromise;
  }

  loadingPromise =
    (async () => {
      const result =
        await listStorefrontProducts({
          limit: 300
        });

      if (!result || result.ok === false) {
        throw new Error(
          result?.message ||
          "The Wix Store catalog could not be loaded."
        );
      }

      cachedCatalog = {
        ...result,

        products:
          Array.isArray(result.products)
            ? result.products
            : [],

        categories:
          Array.isArray(result.categories)
            ? result.categories
            : []
      };

      send(
        "STOREFRONT_PRODUCTS",
        cachedCatalog
      );

      void sendCart();

      return cachedCatalog;
    })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

async function sendCart() {
  try {
    const result =
      await getStorefrontCartV2();

    send(
      "STOREFRONT_CART",
      {
        cart:
          normalizeCartV2(
            result?.cart ||
            {}
          )
      }
    );
  } catch (error) {
    console.warn(
      "[Store Page] Cart V2 unavailable.",
      error
    );

    send(
      "STOREFRONT_CART",
      {
        cart: {
          id: "",
          lineItems: [],
          totalLabel: ""
        }
      }
    );
  }
}

function findProduct(productId) {
  return (
    cachedCatalog
      ?.products
      ?.find(
        (product) =>
          String(product.id) ===
          String(productId)
      ) ||
    null
  );
}

async function resolveVariant(productId, choices = {}) {
  const product =
    findProduct(productId);

  const selectedChoices =
    choices &&
    typeof choices === "object"
      ? choices
      : {};

  if (
    !Object.keys(selectedChoices).length &&
    product?.defaultVariantId
  ) {
    return {
      variantId:
        product.defaultVariantId
    };
  }

  const result =
    await resolveStoreVariant({
      productId,
      choices:
        selectedChoices
    });

  if (
    !result ||
    result.ok === false ||
    !result.variantId
  ) {
    throw new Error(
      result?.message ||
      "The selected product option is unavailable."
    );
  }

  return result;
}

async function addProduct(payload = {}) {
  const productId =
    String(
      payload.productId ||
      payload.catalogItemId ||
      ""
    ).trim();

  if (!productId) {
    throw new Error(
      "The selected product could not be identified."
    );
  }

  const quantity =
    Math.max(
      1,
      Number(
        payload.quantity ||
        1
      )
    );

  const choices =
    (
      payload.choices &&
      typeof payload.choices === "object"
    )
      ? payload.choices
      : {};

  const variant =
    await resolveVariant(
      productId,
      choices
    );

  const result =
    await addProductToCurrentCartV2({
      lineItems: [
        {
          catalogReference: {
            appId:
              WIX_STORES_APP_ID,

            catalogItemId:
              productId,

            options: {
              variantId:
                variant.variantId
            }
          },

          quantity
        }
      ]
    });

  try {
    await wixEcomFrontend
      .refreshCart();
  } catch (_) {}

  const cart =
    normalizeCartV2(
      result?.cart ||
      {}
    );

  send(
    "STOREFRONT_CART",
    {
      cart
    }
  );

  send(
    "STOREFRONT_CART_UPDATED",
    {
      action:
        "added",
      productId,
      quantity,
      cart
    }
  );
}

async function handleMessage(message) {
  const payload =
    message.payload ||
    {};

  switch (message.type) {
    case "STOREFRONT_READY":
      if (cachedCatalog) {
        send(
          "STOREFRONT_PRODUCTS",
          cachedCatalog
        );
        void sendCart();
        return;
      }
      await loadCatalog();
      return;

    case "STOREFRONT_REFRESH":
      cachedCatalog = null;
      await loadCatalog(true);
      return;

    case "STOREFRONT_CART_REQUEST":
      await sendCart();
      return;

    case "STOREFRONT_ADD_TO_CART":
      send(
        "STOREFRONT_PROGRESS",
        {
          message:
            "Adding to bag…"
        }
      );
      await addProduct(payload);
      return;

    /*
     * CUSTOM SKANDI CHECKOUT.
     * Never call navigateToCheckoutPage().
     */
    case "STOREFRONT_CHECKOUT":
      wixLocationFrontend.to(
        CHECKOUT_PATH
      );
      return;

    case "STOREFRONT_ORDERS":
      wixLocationFrontend.to(
        ORDERS_PATH
      );
      return;

    case "STOREFRONT_NAVIGATE":
      if (payload.path) {
        wixLocationFrontend.to(
          payload.path
        );
      }
      return;

    default:
      return;
  }
}

$w.onReady(function () {
  embed =
    $w(
      EMBED_ID
    );

  embed.onMessage(
    async (event) => {
      const message =
        parseMessage(
          event.data
        );

      if (
        !message ||
        message.source !==
          STOREFRONT_SOURCE
      ) {
        return;
      }

      try {
        await handleMessage(
          message
        );
      } catch (error) {
        console.error(
          `[Store Page] ${message.type} failed.`,
          error
        );

        send(
          "STOREFRONT_ERROR",
          {
            stage:
              message.type,

            message:
              error?.message ||
              "The store action could not be completed."
          }
        );
      }
    }
  );

  send(
    "STOREFRONT_PARENT_READY",
    {
      bridge:
        "PRODUCTION_CART_V2",

      catalogVersion:
        "V3",

      customCheckout:
        true,

      checkoutPath:
        CHECKOUT_PATH
    }
  );

  void loadCatalog()
    .catch(
      (error) =>
        console.error(
          "[Store Page] Initial load failed.",
          error
        )
    );
});

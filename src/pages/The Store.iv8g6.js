import wixLocationFrontend from "wix-location-frontend";
import wixEcomFrontend from "wix-ecom-frontend";

import {
  listStorefrontProducts,
  getStorefrontCart,
  addProductToCurrentCart,
  createStorefrontCheckout
} from "backend/skandiStorefront.web";

import {
  createPublicSupportCase
} from "backend/chatwootSupport.web";

const EMBED_ID =
  "#skandiStoreEmbed";

const STOREFRONT_SOURCE =
  "SKANDI_STOREFRONT";

const SUPPORT_SOURCE =
  "SKANDI_SUPPORT_PUBLIC";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const WIX_STORES_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

const ORDERS_PATH =
  "/my-orders";

let embed = null;
let loadPromise = null;
let lastCatalogPayload = null;

function parseMessage(value) {
  if (
    typeof value === "string"
  ) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }

  return (
    value &&
    typeof value === "object"
  )
    ? value
    : null;
}

function send(
  type,
  payload = {}
) {
  if (!embed) {
    console.warn(
      "[Store Page] Cannot send before HTML Component is ready.",
      type
    );
    return;
  }

  embed.postMessage({
    source:
      PARENT_SOURCE,
    type,
    payload,
    timestamp:
      new Date()
        .toISOString()
  });
}

function normalizeMoney(value) {
  if (
    value === null ||
    value === undefined
  ) {
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

function normalizeDescriptionLines(
  lines = []
) {
  if (
    !Array.isArray(lines)
  ) {
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

      return name
        ? (
            value
              ? `${name}: ${value}`
              : String(name)
          )
        : String(value || "");
    })
    .filter(Boolean)
    .join(", ");
}

function normalizeCart(
  response = {}
) {
  const raw =
    response.cart ||
    response ||
    {};

  const lineItems =
    raw.lineItems ||
    raw.items ||
    [];

  return {
    id:
      raw._id ||
      raw.id ||
      "",

    lineItems:
      lineItems.map((item) => {
        const catalogReference =
          item.catalogReference ||
          {};

        const productName =
          item.productName ||
          {};

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
            (
              typeof item.productName === "string"
                ? item.productName
                : ""
            ) ||
            "Product",

          quantity:
            Math.max(
              1,
              Number(
                item.quantity ||
                1
              )
            ),

          imageUrl:
            normalizeMediaUrl(
              media
            ) ||
            item.imageUrl ||
            "",

          optionsLabel:
            normalizeDescriptionLines(
              item.descriptionLines
            ) ||
            item.optionsLabel ||
            "",

          priceLabel:
            normalizeMoney(
              item.lineItemPrice
            ) ||
            normalizeMoney(
              item.totalPrice
            ) ||
            normalizeMoney(
              item.fullPrice
            ) ||
            normalizeMoney(
              item.price
            )
        };
      }),

    totalLabel:
      normalizeMoney(
        raw.priceSummary?.total
      ) ||
      normalizeMoney(
        raw.totals?.total
      ) ||
      normalizeMoney(
        raw.subtotalAfterDiscounts
      ) ||
      normalizeMoney(
        raw.subtotal
      ) ||
      normalizeMoney(
        raw.total
      ) ||
      ""
  };
}

async function loadProducts(
  force = false
) {
  if (
    loadPromise &&
    !force
  ) {
    return loadPromise;
  }

  loadPromise =
    (async () => {
      send(
        "STOREFRONT_PROGRESS",
        {
          message:
            "Loading Wix Store products…"
        }
      );

      console.log(
        "[Store Page] Calling listStorefrontProducts()."
      );

      const result =
        await listStorefrontProducts({
          limit:
            300
        });

      if (
        !result ||
        result.ok === false
      ) {
        throw new Error(
          result?.message ||
          result?.error ||
          "The Wix Stores catalog request failed."
        );
      }

      const products =
        Array.isArray(
          result.products
        )
          ? result.products
          : [];

      const categories =
        Array.isArray(
          result.categories
        )
          ? result.categories
          : [];

      lastCatalogPayload = {
        ...result,
        products,
        categories
      };

      console.log(
        "[Store Page] Catalog ready:",
        {
          products:
            products.length,
          categories:
            categories.length,
          meta:
            result.meta ||
            {}
        }
      );

      /*
       * Critical path:
       * send products BEFORE cart/support work.
       */
      send(
        "STOREFRONT_PRODUCTS",
        lastCatalogPayload
      );

      /*
       * Cart is secondary. A cart failure must never suppress products.
       */
      void sendCart();

      return lastCatalogPayload;
    })();

  try {
    return await loadPromise;
  } catch (error) {
    console.error(
      "[Store Page] Catalog load failed:",
      error
    );

    send(
      "STOREFRONT_ERROR",
      {
        stage:
          "catalog",
        message:
          error?.message ||
          "The store catalog could not be loaded."
      }
    );

    throw error;
  } finally {
    loadPromise =
      null;
  }
}

async function sendCart() {
  try {
    const result =
      await getStorefrontCart();

    send(
      "STOREFRONT_CART",
      {
        cart:
          normalizeCart(
            result?.cart ||
            result ||
            {}
          )
      }
    );
  } catch (error) {
    console.warn(
      "[Store Page] Cart unavailable. Products remain usable.",
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

function cartLineItemFromPayload(
  payload = {}
) {
  const productId =
    payload.productId ||
    payload.catalogItemId;

  if (!productId) {
    throw new Error(
      "The selected product could not be identified."
    );
  }

  const catalogReference = {
    appId:
      WIX_STORES_APP_ID,
    catalogItemId:
      productId
  };

  if (payload.variantId) {
    catalogReference.options = {
      variantId:
        payload.variantId
    };
  } else if (
    payload.choices &&
    typeof payload.choices === "object" &&
    Object.keys(
      payload.choices
    ).length
  ) {
    catalogReference.options = {
      options:
        payload.choices
    };
  }

  return {
    catalogReference,
    quantity:
      Math.max(
        1,
        Number(
          payload.quantity ||
          1
        )
      )
  };
}

async function addProduct(
  payload = {}
) {
  const lineItem =
    cartLineItemFromPayload(
      payload
    );

  const result =
    await addProductToCurrentCart({
      lineItems: [
        lineItem
      ]
    });

  await wixEcomFrontend
    .refreshCart()
    .catch(() => {});

  send(
    "STOREFRONT_CART",
    {
      cart:
        normalizeCart(
          result?.cart ||
          result ||
          {}
        )
    }
  );
}

async function openCheckout() {
  const result =
    await createStorefrontCheckout();

  const checkoutId =
    result?.checkoutId;

  if (!checkoutId) {
    throw new Error(
      "Checkout could not be created."
    );
  }

  await wixEcomFrontend
    .navigateToCheckoutPage(
      checkoutId
    );
}

async function handleStorefrontMessage(
  message
) {
  const payload =
    message.payload ||
    {};

  switch (
    message.type
  ) {
    case "STOREFRONT_READY":
      /*
       * If data has already loaded, replay it immediately.
       * This eliminates iframe/page-code race conditions.
       */
      if (
        lastCatalogPayload
      ) {
        send(
          "STOREFRONT_PRODUCTS",
          lastCatalogPayload
        );
        return;
      }

      await loadProducts();
      return;

    case "STOREFRONT_REFRESH":
      lastCatalogPayload =
        null;
      await loadProducts(
        true
      );
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

      await addProduct(
        payload
      );
      return;

    case "STOREFRONT_CHECKOUT":
      send(
        "STOREFRONT_PROGRESS",
        {
          message:
            "Opening checkout…"
        }
      );

      await openCheckout();
      return;

    case "STOREFRONT_ORDERS":
      wixLocationFrontend.to(
        ORDERS_PATH
      );
      return;

    case "STOREFRONT_NAVIGATE":
      if (
        payload.path
      ) {
        wixLocationFrontend.to(
          payload.path
        );
      }
      return;

    default:
      return;
  }
}

async function handleSupportMessage(
  message
) {
  const payload =
    message.payload ||
    {};

  if (
    message.type ===
    "PUBLIC_SUPPORT_CREATE_CASE"
  ) {
    const result =
      await createPublicSupportCase({
        input:
          payload
      });

    send(
      "PUBLIC_SUPPORT_CASE_CREATED",
      result ||
      {}
    );
    return;
  }

  if (
    message.type ===
    "PUBLIC_SUPPORT_NAVIGATE" &&
    payload.path
  ) {
    wixLocationFrontend.to(
      payload.path
    );
  }
}

$w.onReady(function () {
  try {
    embed =
      $w(
        EMBED_ID
      );
  } catch (error) {
    console.error(
      `[Store Page] Missing HTML Component ${EMBED_ID}.`,
      error
    );
    return;
  }

  if (
    !embed ||
    typeof embed.onMessage !== "function" ||
    typeof embed.postMessage !== "function"
  ) {
    console.error(
      `[Store Page] ${EMBED_ID} is not an HTML Component.`
    );
    return;
  }

  console.log(
    "[Store Page] Store bridge initialized.",
    {
      embedId:
        EMBED_ID
    }
  );

  embed.onMessage(
    async (event) => {
      const message =
        parseMessage(
          event.data
        );

      if (
        !message ||
        !message.type
      ) {
        return;
      }

      if (
        message.source ===
        SUPPORT_SOURCE
      ) {
        try {
          await handleSupportMessage(
            message
          );
        } catch (error) {
          console.error(
            "[Store Page] Support failed:",
            error
          );

          send(
            "PUBLIC_SUPPORT_ERROR",
            {
              message:
                error?.message ||
                "Support request failed."
            }
          );
        }

        return;
      }

      if (
        message.source !==
        STOREFRONT_SOURCE
      ) {
        return;
      }

      try {
        await handleStorefrontMessage(
          message
        );
      } catch (error) {
        console.error(
          `[Store Page] ${message.type} failed:`,
          error
        );

        send(
          "STOREFRONT_ERROR",
          {
            stage:
              message.type,
            message:
              error?.message ||
              "Store action failed."
          }
        );
      }
    }
  );

  /*
   * Tell the iframe the Wix parent listener now exists.
   * The iframe will request catalog data after receiving this.
   */
  send(
    "STOREFRONT_PARENT_READY",
    {
      embedId:
        EMBED_ID,
      catalogVersion:
        "V3"
    }
  );

  /*
   * Also preload immediately. If the iframe isn't ready yet,
   * lastCatalogPayload is replayed when STOREFRONT_READY arrives.
   */
  void loadProducts()
    .catch(() => {});
});

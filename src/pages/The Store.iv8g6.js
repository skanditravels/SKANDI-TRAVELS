import wixLocationFrontend from "wix-location-frontend";
import wixEcomFrontend from "wix-ecom-frontend";

import {
  listStorefrontProducts,
  resolveStoreVariant,
  getStorefrontCart,
  addProductToCurrentCart,
  createStorefrontCheckout
} from "backend/skandiStorefront.web";


/* ==========================================================================
   CONFIG
   ========================================================================== */

const EMBED_ID =
  "#skandiStoreEmbed";

const STOREFRONT_SOURCE =
  "SKANDI_STOREFRONT";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const WIX_STORES_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

const ORDERS_PATH =
  "/my-orders";


/* ==========================================================================
   STATE
   ========================================================================== */

let embed =
  null;

let loadingPromise =
  null;

let cachedCatalog =
  null;


/* ==========================================================================
   MESSAGE HELPERS
   ========================================================================== */

function parseMessage(
  value
) {
  if (
    typeof value ===
    "string"
  ) {
    try {
      return JSON.parse(
        value
      );
    } catch (_) {
      return null;
    }
  }

  return (
    value &&
    typeof value ===
      "object"
  )
    ? value
    : null;
}


function send(
  type,
  payload = {}
) {
  if (
    !embed ||
    typeof embed.postMessage !==
      "function"
  ) {
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


/* ==========================================================================
   MONEY
   ========================================================================== */

function moneyText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    return String(
      value
    );
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


/* ==========================================================================
   CART NORMALIZATION
   ========================================================================== */

function normalizeMediaUrl(
  value
) {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return (
    value.image?.url ||
    value.url ||
    value.src ||
    value.imageUrl ||
    value.media?.image?.url ||
    ""
  );
}


function normalizeDescriptionLines(
  lines = []
) {
  if (
    !Array.isArray(
      lines
    )
  ) {
    return "";
  }

  return lines
    .map(
      (line) => {
        const name =
          line?.name?.original ||
          line?.name?.translated ||
          line?.name ||
          "";

        const value =
          line?.value?.original ||
          line?.value?.translated ||
          line?.value ||
          "";

        if (
          name &&
          value
        ) {
          return `${name}: ${value}`;
        }

        return (
          name ||
          value ||
          ""
        );
      }
    )
    .filter(Boolean)
    .join(", ");
}


function normalizeCart(
  response = {}
) {
  const raw =
    response?.cart ||
    response ||
    {};

  const sourceItems =
    raw.lineItems ||
    raw.items ||
    [];

  const lineItems =
    Array.isArray(
      sourceItems
    )
      ? sourceItems
      : [];

  return {
    id:
      raw._id ||
      raw.id ||
      "",

    lineItems:
      lineItems.map(
        (item) => {
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
              "",

            name:
              productName.original ||
              productName.translated ||
              (
                typeof item.productName ===
                  "string"
                  ? item.productName
                  : ""
              ) ||
              item.name ||
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
              moneyText(
                item.lineItemPrice
              ) ||
              moneyText(
                item.totalPrice
              ) ||
              moneyText(
                item.fullPrice
              ) ||
              moneyText(
                item.price
              )
          };
        }
      ),

    totalLabel:
      moneyText(
        raw.priceSummary?.total
      ) ||
      moneyText(
        raw.totals?.total
      ) ||
      moneyText(
        raw.subtotalAfterDiscounts
      ) ||
      moneyText(
        raw.subtotal
      ) ||
      moneyText(
        raw.total
      ) ||
      ""
  };
}


/* ==========================================================================
   CATALOG
   ========================================================================== */

async function loadCatalog(
  force = false
) {
  if (
    cachedCatalog &&
    !force
  ) {
    send(
      "STOREFRONT_PRODUCTS",
      cachedCatalog
    );

    return cachedCatalog;
  }

  if (
    loadingPromise &&
    !force
  ) {
    return loadingPromise;
  }

  loadingPromise =
    (async () => {
      try {
        send(
          "STOREFRONT_PROGRESS",
          {
            message:
              "Loading store products…"
          }
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
            "The Wix Store catalog could not be loaded."
          );
        }

        cachedCatalog = {
          ...result,

          products:
            Array.isArray(
              result.products
            )
              ? result.products
              : [],

          categories:
            Array.isArray(
              result.categories
            )
              ? result.categories
              : [],

          banners:
            Array.isArray(
              result.banners
            )
              ? result.banners
              : [],

          travelCards:
            Array.isArray(
              result.travelCards
            )
              ? result.travelCards
              : []
        };

        console.log(
          "[Store Page] Catalog loaded.",
          {
            products:
              cachedCatalog
                .products
                .length,

            categories:
              cachedCatalog
                .categories
                .length
          }
        );

        /*
         * Send products BEFORE doing anything with the cart.
         * A cart failure can therefore never suppress the catalog.
         */
        send(
          "STOREFRONT_PRODUCTS",
          cachedCatalog
        );

        /*
         * Refresh cart independently.
         */
        void sendCart();

        return cachedCatalog;
      } catch (error) {
        console.error(
          "[Store Page] Catalog load failed.",
          error
        );

        send(
          "STOREFRONT_ERROR",
          {
            stage:
              "catalog",

            message:
              error?.message ||
              "Store products could not be loaded."
          }
        );

        throw error;
      } finally {
        loadingPromise =
          null;
      }
    })();

  return loadingPromise;
}


/* ==========================================================================
   CART
   ========================================================================== */

async function sendCart() {
  try {
    const result =
      await getStorefrontCart();

    const cart =
      normalizeCart(
        result?.cart ||
        result ||
        {}
      );

    send(
      "STOREFRONT_CART",
      {
        cart
      }
    );

    return cart;
  } catch (error) {
    console.error(
      "[Store Page] Cart load failed.",
      error
    );

    /*
     * Do not break the storefront if the visitor does not yet have a cart.
     */
    const cart = {
      id:
        "",

      lineItems:
        [],

      totalLabel:
        ""
    };

    send(
      "STOREFRONT_CART",
      {
        cart
      }
    );

    return cart;
  }
}


/* ==========================================================================
   PRODUCT LOOKUP
   ========================================================================== */

function findCachedProduct(
  productId
) {
  if (
    !cachedCatalog ||
    !Array.isArray(
      cachedCatalog.products
    )
  ) {
    return null;
  }

  return (
    cachedCatalog
      .products
      .find(
        (product) =>
          String(
            product.id
          ) ===
          String(
            productId
          )
      ) ||
    null
  );
}


/* ==========================================================================
   VARIANT RESOLUTION
   ========================================================================== */

async function resolveVariantForCart(
  productId,
  choices = {}
) {
  const product =
    findCachedProduct(
      productId
    );

  if (!product) {
    throw new Error(
      "The selected product could not be found in the current catalog."
    );
  }

  /*
   * Catalog V3 requires variantId even for products that appear to have
   * only one purchasable variant.
   *
   * For a product without user-selectable options, use the variant already
   * supplied by the catalog payload.
   */
  const selectedChoices =
    choices &&
    typeof choices ===
      "object"
      ? choices
      : {};

  const hasChoices =
    Object.keys(
      selectedChoices
    ).length > 0;

  if (
    !hasChoices &&
    product.defaultVariantId
  ) {
    return {
      variantId:
        product.defaultVariantId
    };
  }

  /*
   * Optioned product: ask the backend to match the buyer's selected option
   * names against Catalog V3 read-only variants.
   */
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
      "The selected product options are not available."
    );
  }

  return result;
}


/* ==========================================================================
   ADD TO BAG
   ========================================================================== */

async function addProductToBag(
  payload = {}
) {
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
      typeof payload.choices ===
        "object"
    )
      ? payload.choices
      : {};

  send(
    "STOREFRONT_PROGRESS",
    {
      message:
        "Adding to bag…"
    }
  );

  const variant =
    await resolveVariantForCart(
      productId,
      choices
    );

  const lineItem = {
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
  };

  console.log(
    "[Store Page] Adding Wix Store item.",
    {
      productId,
      variantId:
        variant.variantId,
      quantity,
      choices
    }
  );

  const result =
    await addProductToCurrentCart({
      lineItems: [
        lineItem
      ]
    });

  /*
   * Update Wix's native eCommerce state.
   */
  try {
    await wixEcomFrontend
      .refreshCart();
  } catch (error) {
    console.warn(
      "[Store Page] Native cart refresh failed.",
      error
    );
  }

  const cart =
    normalizeCart(
      result?.cart ||
      result ||
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

  return cart;
}


/* ==========================================================================
   CHECKOUT
   ========================================================================== */

async function checkout() {
  send(
    "STOREFRONT_PROGRESS",
    {
      message:
        "Opening checkout…"
    }
  );

  const result =
    await createStorefrontCheckout();

  const checkoutId =
    result?.checkoutId;

  if (!checkoutId) {
    throw new Error(
      "Wix checkout could not be created."
    );
  }

  console.log(
    "[Store Page] Checkout created.",
    {
      checkoutId
    }
  );

  await wixEcomFrontend
    .navigateToCheckoutPage(
      checkoutId
    );
}


/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function navigate(
  rawPath
) {
  const path =
    String(
      rawPath ||
      ""
    ).trim();

  if (!path) {
    return;
  }

  const allowed =
    path.startsWith("/") ||
    /^https?:\/\//i.test(
      path
    ) ||
    /^mailto:/i.test(
      path
    ) ||
    /^tel:/i.test(
      path
    );

  if (!allowed) {
    console.warn(
      "[Store Page] Blocked invalid navigation:",
      path
    );

    return;
  }

  wixLocationFrontend
    .to(
      path
    );
}


/* ==========================================================================
   HTML MESSAGE HANDLER
   ========================================================================== */

async function handleStorefrontMessage(
  message
) {
  const payload =
    message.payload ||
    {};

  switch (
    message.type
  ) {
    /* --------------------------------------------------------------
       READY
       -------------------------------------------------------------- */

    case "STOREFRONT_READY":

      if (
        cachedCatalog
      ) {
        send(
          "STOREFRONT_PRODUCTS",
          cachedCatalog
        );

        void sendCart();

        return;
      }

      await loadCatalog();

      return;


    /* --------------------------------------------------------------
       REFRESH
       -------------------------------------------------------------- */

    case "STOREFRONT_REFRESH":

      cachedCatalog =
        null;

      await loadCatalog(
        true
      );

      return;


    /* --------------------------------------------------------------
       CART REQUEST
       -------------------------------------------------------------- */

    case "STOREFRONT_CART_REQUEST":

      await sendCart();

      return;


    /* --------------------------------------------------------------
       ADD PRODUCT
       -------------------------------------------------------------- */

    case "STOREFRONT_ADD_TO_CART":

      await addProductToBag(
        payload
      );

      return;


    /* --------------------------------------------------------------
       CHECKOUT
       -------------------------------------------------------------- */

    case "STOREFRONT_CHECKOUT":

      await checkout();

      return;


    /* --------------------------------------------------------------
       ORDERS
       -------------------------------------------------------------- */

    case "STOREFRONT_ORDERS":

      navigate(
        ORDERS_PATH
      );

      return;


    /* --------------------------------------------------------------
       NAVIGATION
       -------------------------------------------------------------- */

    case "STOREFRONT_NAVIGATE":

      navigate(
        payload.path
      );

      return;


    default:

      console.log(
        "[Store Page] Unhandled storefront message:",
        message.type
      );

      return;
  }
}


/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

$w.onReady(function () {
  console.log(
    "[Store Page] Production storefront starting."
  );

  try {
    embed =
      $w(
        EMBED_ID
      );
  } catch (error) {
    console.error(
      `[Store Page] ${EMBED_ID} does not exist.`,
      error
    );

    return;
  }

  if (
    !embed ||
    typeof embed.onMessage !==
      "function" ||
    typeof embed.postMessage !==
      "function"
  ) {
    console.error(
      `[Store Page] ${EMBED_ID} is not a Wix HTML Component.`
    );

    return;
  }

  console.log(
    "[Store Page] HTML storefront bridge connected.",
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


  /* ========================================================================
     HANDSHAKE
     ======================================================================== */

  send(
    "STOREFRONT_PARENT_READY",
    {
      bridge:
        "PRODUCTION",

      catalogVersion:
        "V3",

      cart:
        true,

      checkout:
        true,

      embedId:
        EMBED_ID
    }
  );


  /* ========================================================================
     PRELOAD
     ======================================================================== */

  /*
   * Load immediately.
   *
   * If the iframe has not attached its event listener yet, the catalog is
   * cached and replayed when STOREFRONT_READY arrives.
   */
  void loadCatalog()
    .catch(
      (error) => {
        console.error(
          "[Store Page] Initial catalog preload failed.",
          error
        );
      }
    );
});

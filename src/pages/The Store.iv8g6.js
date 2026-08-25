import {
  listStorefrontProducts
} from "backend/skandiStorefront.web";

const EMBED_ID =
  "#skandiStoreEmbed";

const STOREFRONT_SOURCE =
  "SKANDI_STOREFRONT";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

let embed = null;
let loadingPromise = null;
let cachedCatalog = null;

function parseMessage(
  value
) {
  if (
    typeof value === "string"
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
    typeof value === "object"
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
              "Loading Wix Catalog V3 products…"
          }
        );

        console.log(
          "[Store Page] Calling Catalog V3 storefront backend."
        );

        const result =
          await listStorefrontProducts({
            limit:
              100
          });

        if (
          !result ||
          result.ok === false
        ) {
          throw new Error(
            result?.message ||
            result?.error ||
            "Catalog V3 returned an invalid response."
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
              : []
        };

        console.log(
          "[Store Page] Catalog V3 payload ready.",
          {
            products:
              cachedCatalog.products.length,

            meta:
              cachedCatalog.meta ||
              {}
          }
        );

        send(
          "STOREFRONT_PRODUCTS",
          cachedCatalog
        );

        return cachedCatalog;
      } catch (error) {
        console.error(
          "[Store Page] Catalog V3 failed.",
          error
        );

        send(
          "STOREFRONT_ERROR",
          {
            stage:
              "catalog-v3",

            message:
              error?.message ||
              "Wix Catalog V3 could not be loaded."
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

$w.onReady(function () {
  console.log(
    "[Store Page] Catalog V3 page code started."
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
    "[Store Page] HTML bridge connected.",
    {
      id:
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
        message.source !==
          STOREFRONT_SOURCE
      ) {
        return;
      }

      console.log(
        "[Store Page] Message from storefront HTML:",
        message.type
      );

      if (
        message.type ===
          "STOREFRONT_READY" ||
        message.type ===
          "STOREFRONT_REFRESH"
      ) {
        try {
          await loadCatalog(
            message.type ===
              "STOREFRONT_REFRESH"
          );
        } catch (_) {}

        return;
      }

      /*
       * Product transport only for this corrected Catalog V3 build.
       * Cart/support can be reconnected after catalog transport is
       * confirmed without putting product rendering at risk.
       */
      if (
        message.type ===
          "STOREFRONT_ADD_TO_CART" ||
        message.type ===
          "STOREFRONT_CART_REQUEST" ||
        message.type ===
          "STOREFRONT_CHECKOUT"
      ) {
        send(
          "STOREFRONT_ERROR",
          {
            stage:
              "catalog-v3-diagnostic",

            message:
              "Products are connected to Wix Catalog V3. Cart is temporarily disabled in this transport-only build."
          }
        );
      }
    }
  );

  send(
    "STOREFRONT_PARENT_READY",
    {
      bridge:
        "WIX_CATALOG_V3",

      embedId:
        EMBED_ID
    }
  );

  /*
   * Preload immediately. If the iframe is not listening yet,
   * its retrying STOREFRONT_READY message will receive cached data.
   */
  void loadCatalog()
    .catch(() => {});
});

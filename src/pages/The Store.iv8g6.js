import {
  getPublicStoreCatalog
} from "backend/storeCatalogBridge.web";

const EMBED_ID =
  "#skandiStoreEmbed";

const STOREFRONT_SOURCE =
  "SKANDI_STOREFRONT";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

let embed = null;
let loadPromise = null;
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
  if (!embed) {
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
    loadPromise &&
    !force
  ) {
    return loadPromise;
  }

  loadPromise =
    (async () => {
      try {
        send(
          "STOREFRONT_PROGRESS",
          {
            message:
              "Reading Wix Stores products…"
          }
        );

        console.log(
          "[Store Page] Calling getPublicStoreCatalog()."
        );

        const result =
          await getPublicStoreCatalog({
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
            "Wix Stores returned an invalid catalog response."
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
          "[Store Page] Wix catalog loaded.",
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
          "[Store Page] Wix catalog load failed.",
          error
        );

        send(
          "STOREFRONT_ERROR",
          {
            stage:
              "catalog-only-bridge",

            message:
              error?.message ||
              "Wix Stores products could not be loaded."
          }
        );

        throw error;
      } finally {
        loadPromise =
          null;
      }
    })();

  return loadPromise;
}

$w.onReady(function () {
  console.log(
    "[Store Page] Catalog-only page code started."
  );

  try {
    embed =
      $w(
        EMBED_ID
      );
  } catch (error) {
    console.error(
      `[Store Page] ${EMBED_ID} does not exist on this Wix page.`,
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
    "[Store Page] HTML Component connected.",
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
        message.source !==
          STOREFRONT_SOURCE
      ) {
        return;
      }

      console.log(
        "[Store Page] HTML message received.",
        {
          type:
            message.type
        }
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
       * Cart/support are intentionally disabled in this diagnostic bridge.
       * They will be reconnected only after the catalog transport is proven.
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
              "catalog-diagnostic",

            message:
              "Catalog is connected. Cart is temporarily disabled while the Wix Stores bridge is being isolated."
          }
        );
      }
    }
  );

  /*
   * This message proves page code itself is executing.
   */
  send(
    "STOREFRONT_PARENT_READY",
    {
      bridge:
        "CATALOG_ONLY",

      embedId:
        EMBED_ID
    }
  );

  /*
   * Preload immediately. If the iframe has not attached its listener yet,
   * the HTML's retrying STOREFRONT_READY handshake will replay cached data.
   */
  void loadCatalog()
    .catch(() => {});
});

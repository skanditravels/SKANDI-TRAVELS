import {
  Permissions,
  webMethod
} from "wix-web-module";

import {
  currentCartV2
} from "@wix/ecom";

const WIX_STORES_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeCatalogItem(item = {}) {
  const reference =
    item.catalogReference || {};

  const productId =
    cleanText(
      reference.catalogItemId ||
      item.productId
    );

  const variantId =
    cleanText(
      reference?.options?.variantId ||
      item.variantId
    );

  if (!productId) {
    throw new Error(
      "A SKANDI product ID is required."
    );
  }

  if (!variantId) {
    throw new Error(
      "A Wix Catalog V3 variant ID is required."
    );
  }

  const quantity = Number(item.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("A positive whole-number quantity is required.");

  return {
    catalogReference: {
      appId:
        WIX_STORES_APP_ID,

      catalogItemId:
        productId,

      options: {
        variantId
      }
    },

    quantity
  };
}

export const getStorefrontCartV2 =
  webMethod(
    Permissions.Anyone,

    async function () {
      try {
        const response =
          await currentCartV2
            .getCurrentCart();

        return {
          ok: true,
          cart:
            response?.cart ||
            response ||
            null
        };
      } catch (error) {
        const status = Number(error?.httpStatus || error?.status || error?.response?.status);
        if (status === 404) return { ok: true, cart: null };
        throw error;
      }
    }
  );

export const addProductToCurrentCartV2 =
  webMethod(
    Permissions.Anyone,

    async function ({
      lineItems = []
    } = {}) {
      if (
        !Array.isArray(lineItems) ||
        !lineItems.length
      ) {
        throw new Error(
          "No store item was supplied."
        );
      }

      const catalogItems =
        lineItems.map(
          normalizeCatalogItem
        );

      const response =
        await currentCartV2
          .addLineItemsToCurrentCart({
            catalogItems
          });

      console.log(
        "[SKANDI Cart V2] Added catalog items.",
        catalogItems.map(
          (item) => ({
            productId:
              item.catalogReference.catalogItemId,

            variantId:
              item.catalogReference.options.variantId,

            quantity:
              item.quantity
          })
        )
      );

      return {
        ok: true,
        cart:
          response?.cart ||
          response
      };
    }
  );

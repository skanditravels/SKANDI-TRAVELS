import {
  webMethod,
  Permissions
} from "wix-web-module";

import wixData from "wix-data";

const PRODUCTS_COLLECTION =
  "Stores/Products";

const MAX_LIMIT =
  100;

function numberValue(
  value,
  fallback = 0
) {
  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function text(
  value,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return (
    value.url ||
    value.src ||
    value.name ||
    value.value ||
    fallback
  );
}

function wixMediaToPublicUrl(
  value
) {
  const raw =
    text(value);

  if (!raw) {
    return "";
  }

  if (
    /^https?:\/\//i.test(raw)
  ) {
    return raw;
  }

  /*
   * Wix app collections commonly return:
   * wix:image://v1/<media-id>/<filename>#...
   *
   * static.wixstatic.com can serve the media ID directly.
   */
  const imageMatch =
    raw.match(
      /^wix:image:\/\/v1\/([^/]+)\//
    );

  if (imageMatch?.[1]) {
    return (
      "https://static.wixstatic.com/media/" +
      imageMatch[1]
    );
  }

  const videoMatch =
    raw.match(
      /^wix:video:\/\/v1\/([^/]+)\//
    );

  if (videoMatch?.[1]) {
    return (
      "https://video.wixstatic.com/video/" +
      videoMatch[1]
    );
  }

  return raw;
}

function stripHtml(
  value
) {
  return String(value || "")
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function normalizeProduct(
  item = {}
) {
  const fullPrice =
    numberValue(
      item.price
    );

  const discounted =
    numberValue(
      item.discountedPrice,
      fullPrice
    );

  const hasDiscount =
    discounted > 0 &&
    fullPrice > 0 &&
    discounted < fullPrice;

  const displayAmount =
    hasDiscount
      ? discounted
      : fullPrice;

  const displayFormatted =
    hasDiscount
      ? (
          item.formattedDiscountedPrice ||
          item.formattedPrice ||
          ""
        )
      : (
          item.formattedPrice ||
          item.formattedDiscountedPrice ||
          ""
        );

  return {
    id:
      item._id ||
      "",

    _id:
      item._id ||
      "",

    name:
      item.name ||
      "Product",

    slug:
      item.slug ||
      "",

    brand:
      item.brand ||
      "SKANDI",

    sku:
      item.sku ||
      "",

    description:
      stripHtml(
        item.description
      ),

    summary:
      stripHtml(
        item.description
      ),

    imageUrl:
      wixMediaToPublicUrl(
        item.mainMedia
      ),

    price: {
      amount:
        displayAmount,

      currency:
        item.currency ||
        "USD",

      formatted:
        displayFormatted ||
        (
          item.currency
            ? `${item.currency} ${displayAmount.toFixed(2)}`
            : displayAmount.toFixed(2)
        )
    },

    comparePrice:
      hasDiscount
        ? {
            amount:
              fullPrice,

            currency:
              item.currency ||
              "USD",

            formatted:
              item.formattedPrice ||
              (
                item.currency
                  ? `${item.currency} ${fullPrice.toFixed(2)}`
                  : fullPrice.toFixed(2)
              )
          }
        : undefined,

    ribbon:
      item.ribbon ||
      "",

    badge:
      item.ribbon ||
      "",

    inStock:
      item.inStock !== false,

    canAddToCart:
      item.inStock !== false,

    productPageUrl:
      item.productPageUrl ||
      "",

    productOptions:
      item.productOptions ||
      {},

    manageVariants:
      item.manageVariants === true,

    productType:
      item.productType ||
      "",

    categoryIds:
      Array.isArray(
        item.collections
      )
        ? item.collections
            .map((entry) =>
              typeof entry === "string"
                ? entry
                : (
                    entry?._id ||
                    entry?.id ||
                    ""
                  )
            )
            .filter(Boolean)
        : [],

    categoryNames:
      [],

    createdAt:
      item._createdDate ||
      "",

    updatedAt:
      item._updatedDate ||
      ""
  };
}

export const getPublicStoreCatalog =
  webMethod(
    Permissions.Anyone,
    async function ({
      limit = 100
    } = {}) {
      const safeLimit =
        Math.max(
          1,
          Math.min(
            MAX_LIMIT,
            Number(limit) ||
            MAX_LIMIT
          )
        );

      console.log(
        "[Store Catalog Bridge] Querying Stores/Products.",
        {
          limit:
            safeLimit
        }
      );

      const result =
        await wixData
          .query(
            PRODUCTS_COLLECTION
          )
          .limit(
            safeLimit
          )
          .find();

      const rawItems =
        Array.isArray(
          result?.items
        )
          ? result.items
          : [];

      const products =
        rawItems
          .map(
            normalizeProduct
          )
          .filter(
            (product) =>
              product.id &&
              product.name
          );

      console.log(
        "[Store Catalog Bridge] Products loaded.",
        {
          rawCount:
            rawItems.length,
          productCount:
            products.length
        }
      );

      return {
        ok:
          true,

        products,

        categories:
          [],

        banners:
          [],

        travelCards:
          [],

        meta: {
          source:
            "WIX_DATA_STORES_PRODUCTS",

          collection:
            PRODUCTS_COLLECTION,

          rawProductCount:
            rawItems.length,

          productCount:
            products.length,

          generatedAt:
            new Date()
              .toISOString()
        }
      };
    }
  );

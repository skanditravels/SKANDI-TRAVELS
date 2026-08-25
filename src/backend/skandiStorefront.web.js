import {
  Permissions,
  webMethod
} from "wix-web-module";

import {
  productsV3
} from "@wix/stores";

import {
  categories
} from "@wix/categories";

import {
  currentCart
} from "wix-ecom-backend";

const WIX_STORES_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

const TREE_REFERENCE = {
  appNamespace: "@wix/stores",
  treeKey: null
};

/*
 * SKANDI storefront public catalog.
 *
 * IMPORTANT:
 * SKANDI TRAVELS uses Wix Stores Catalog V3.
 * Do NOT query wixData collection "Stores/Products" on this site.
 *
 * Official SDK:
 *   import { productsV3 } from "@wix/stores";
 *   productsV3.queryProducts(query, { fields })
 */

const MAX_PRODUCTS = 100;

const PRODUCT_FIELDS = [
  "CURRENCY",
  "URL",
  "PLAIN_DESCRIPTION",
  "THUMBNAIL",
  "MEDIA_ITEMS_INFO",
  "ALL_CATEGORIES_INFO",
  "MIN_PRICE_VARIANT"
];

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
}

function cleanText(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return fallback;
}

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function firstDefined(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}

function moneyFromV3(value = {}, currency = "") {
  if (!value || typeof value !== "object") {
    return {
      amount: 0,
      currency,
      formatted: ""
    };
  }

  const amount =
    asNumber(
      firstDefined(
        value.amount,
        value.value
      ),
      0
    );

  return {
    amount,
    currency:
      cleanText(
        firstDefined(
          value.currency,
          value.currencyCode,
          currency
        )
      ),
    formatted:
      cleanText(
        firstDefined(
          value.formattedAmount,
          value.formatted,
          value.formattedPrice
        )
      )
  };
}

function imageUrlFromMedia(media = {}) {
  if (!media) {
    return "";
  }

  if (typeof media === "string") {
    return media;
  }

  return cleanText(
    firstDefined(
      media?.image?.url,
      media?.image?.src,
      media?.url,
      media?.src,
      media?.thumbnail?.url,
      media?.imageInfo?.url,
      media?.media?.image?.url
    )
  );
}

function mediaItems(product = {}) {
  const candidates = [
    product?.mediaItemsInfo?.items,
    product?.mediaItemsInfo?.mediaItems,
    product?.media?.items,
    product?.media?.mediaItems
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function productImageCandidates(product = {}) {
  const variantMedia =
    product?.variantSummary?.minPriceVariant?.media;

  const items =
    mediaItems(product);

  const urls = [
    product?.media?.main?.image?.url,
    product?.media?.main?.url,
    product?.thumbnail?.url,
    variantMedia?.image?.url,
    variantMedia?.url,
    ...items.map(imageUrlFromMedia)
  ]
    .map((value) => cleanText(value))
    .filter(Boolean);

  return [
    ...new Set(urls)
  ];
}

function mainImageUrl(product = {}) {
  return productImageCandidates(product)[0] || "";
}

function normalizeChoices(option = {}) {
  const choices =
    option?.choicesSettings?.choices;

  if (!Array.isArray(choices)) {
    return [];
  }

  return choices
    .filter(
      (choice) =>
        choice?.visible !== false
    )
    .map((choice) => {
      const linkedMedia =
        Array.isArray(choice?.linkedMedia)
          ? choice.linkedMedia
          : [];

      return {
        id:
          cleanText(
            choice?.choiceId
          ),

        value:
          cleanText(
            firstDefined(
              choice?.key,
              choice?.name
            )
          ),

        description:
          cleanText(
            firstDefined(
              choice?.name,
              choice?.key
            )
          ),

        inStock:
          choice?.inStock !== false,

        visible:
          choice?.visible !== false,

        imageUrl:
          imageUrlFromMedia(
            linkedMedia[0] || {}
          )
      };
    });
}

function normalizeOptions(product = {}) {
  const options =
    Array.isArray(product?.options)
      ? product.options
      : [];

  return options.map(
    (option) => ({
      id:
        cleanText(
          option?.id
        ),

      name:
        cleanText(
          firstDefined(
            option?.name,
            option?.key
          ),
          "Option"
        ),

      key:
        cleanText(
          firstDefined(
            option?.key,
            option?.name
          )
        ),

      renderType:
        cleanText(
          option?.optionRenderType
        ),

      choices:
        normalizeChoices(
          option
        )
    })
  );
}

function normalizeProduct(product = {}) {
  const currency =
    cleanText(
      product?.currency,
      "USD"
    );

  const minVariant =
    product?.variantSummary?.minPriceVariant ||
    {};

  const actualPriceSource =
    firstDefined(
      minVariant?.price?.actualPrice,
      product?.actualPriceRange?.minValue
    ) || {};

  const comparePriceSource =
    firstDefined(
      minVariant?.price?.compareAtPrice,
      product?.compareAtPriceRange?.minValue
    );

  const price =
    moneyFromV3(
      actualPriceSource,
      currency
    );

  const comparePrice =
    comparePriceSource
      ? moneyFromV3(
          comparePriceSource,
          currency
        )
      : null;

  const categoryIds =
    Array.isArray(
      product?.allCategoriesInfo?.categories
    )
      ? product.allCategoriesInfo.categories
          .map((category) =>
            cleanText(category?.id)
          )
          .filter(Boolean)
      : [];

  const inventoryStatus =
    cleanText(
      product?.inventory?.availabilityStatus
    )
      .toUpperCase();

  /*
   * IN_STOCK and PARTIALLY_OUT_OF_STOCK both mean at least one
   * purchasable choice exists. OUT_OF_STOCK means no current stock.
   */
  const inStock =
    ![
      "OUT_OF_STOCK",
      "UNAVAILABLE"
    ].includes(
      inventoryStatus
    );

  const ribbon =
    Array.isArray(
      product?.additionalRibbons
    ) &&
    product.additionalRibbons.length
      ? cleanText(
          firstDefined(
            product.additionalRibbons[0]?.name,
            product.additionalRibbons[0]?.text,
            product.additionalRibbons[0]
          )
        )
      : "";

  return {
    id:
      cleanText(
        product?.id
      ),

    _id:
      cleanText(
        product?.id
      ),

    name:
      cleanText(
        product?.name,
        "Product"
      ),

    slug:
      cleanText(
        product?.slug
      ),

    handle:
      cleanText(
        product?.handle
      ),

    brand:
      cleanText(
        firstDefined(
          product?.brand?.name,
          product?.brand
        ),
        "SKANDI"
      ),

    brandId:
      cleanText(
        product?.brand?.id
      ),

    sku:
      cleanText(
        minVariant?.sku
      ),

    description:
      stripHtml(
        product?.plainDescription ||
        ""
      ),

    summary:
      stripHtml(
        product?.plainDescription ||
        ""
      ),

    imageUrl:
      mainImageUrl(
        product
      ),

    thumbnailUrl:
      cleanText(
        product?.thumbnail?.url
      ),

    variantImageUrl:
      imageUrlFromMedia(
        product?.variantSummary?.minPriceVariant?.media
      ),

    mediaUrls:
      productImageCandidates(
        product
      ),

    price,

    comparePrice:
      (
        comparePrice &&
        comparePrice.amount > price.amount
      )
        ? comparePrice
        : undefined,

    ribbon,

    badge:
      ribbon,

    categoryIds,

    categoryNames:
      [],

    mainCategoryId:
      cleanText(
        product?.mainCategoryId
      ),

    options:
      normalizeOptions(
        product
      ),

    variantCount:
      asNumber(
        product?.variantSummary?.variantCount,
        0
      ),

    defaultVariantId:
      cleanText(
        minVariant?.id
      ),

    productType:
      cleanText(
        product?.productType
      ),

    inventoryStatus,

    inStock,

    canAddToCart:
      inStock,

    productPageUrl:
      cleanText(
        firstDefined(
          product?.url?.url,
          product?.url?.relativePath
        )
      ),

    createdAt:
      cleanText(
        product?.createdDate
      ),

    updatedAt:
      cleanText(
        product?.updatedDate
      )
  };
}

function responseProducts(response = {}) {
  return Array.isArray(response?.products)
    ? response.products
    : [];
}

function nextCursor(response = {}) {
  return cleanText(
    response?.pagingMetadata?.cursors?.next
  );
}

async function queryVisibleProducts(limit) {
  const output = [];
  let cursor = "";

  while (output.length < limit) {
    const pageLimit =
      Math.min(
        100,
        limit - output.length
      );

    const query = {
      cursorPaging: {
        limit:
          pageLimit,
        ...(cursor
          ? { cursor }
          : {})
      }

      /*
       * Do not add a Catalog V1 filter here.
       * Public Product Read returns the visible products available
       * to this caller. Non-visible products require admin scope.
       */
    };

    const response =
      await productsV3.queryProducts(
        query,
        {
          fields:
            PRODUCT_FIELDS
        }
      );

    const page =
      responseProducts(
        response
      );

    output.push(
      ...page
    );

    const next =
      nextCursor(
        response
      );

    if (
      !next ||
      !page.length
    ) {
      break;
    }

    cursor =
      next;
  }

  return output.slice(
    0,
    limit
  );
}

export const listStorefrontProducts =
  webMethod(
    Permissions.Anyone,
    async function ({
      limit = MAX_PRODUCTS
    } = {}) {
      const safeLimit =
        Math.max(
          1,
          Math.min(
            MAX_PRODUCTS,
            Number(limit) ||
            MAX_PRODUCTS
          )
        );

      console.log(
        "[SKANDI Storefront V3] Querying Catalog V3 products.",
        {
          limit:
            safeLimit
        }
      );

      const rawProducts =
        await queryVisibleProducts(
          safeLimit
        );

      const products =
        rawProducts
          .map(
            normalizeProduct
          )
          .filter(
            (product) =>
              product.id &&
              product.name
          );

      console.log(
        "[SKANDI Storefront V3] Catalog loaded.",
        {
          rawProducts:
            rawProducts.length,
          products:
            products.length
        }
      );

      return {
        ok:
          true,

        products,

        /*
         * Product rendering is intentionally independent of the
         * Categories API. Category names can be reattached after
         * the catalog transport is confirmed.
         */
        categories:
          [],

        banners:
          [],

        travelCards:
          [],

        meta: {
          source:
            "WIX_STORES_CATALOG_V3",

          productCount:
            products.length,

          rawProductCount:
            rawProducts.length,

          generatedAt:
            new Date()
              .toISOString()
        }
      };
    }
  );

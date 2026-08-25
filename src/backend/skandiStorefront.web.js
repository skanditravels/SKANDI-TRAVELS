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

const PAGE_SIZE = 100;
const MAX_PRODUCTS = 300;

function text(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return (
    value.value ||
    value.name ||
    value.original ||
    value.translated ||
    value.text ||
    fallback
  );
}

function firstDefined(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
}

function imageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value;

  return (
    value.url ||
    value.src ||
    value.imageUrl ||
    value.image?.url ||
    value.image?.src ||
    value.media?.url ||
    value.mainMedia?.image?.url ||
    value.mainMedia?.url ||
    ""
  );
}

function mediaItems(product = {}) {
  return (
    product.mediaItemsInfo?.items ||
    product.mediaItemsInfo?.mediaItems ||
    product.media?.items ||
    product.media?.mediaItems ||
    product.mediaItems ||
    product.images ||
    []
  );
}

function productImage(product = {}) {
  return (
    imageUrl(product.thumbnail) ||
    imageUrl(product.image) ||
    imageUrl(product.mainMedia) ||
    imageUrl(product.media?.mainMedia) ||
    imageUrl(product.media?.main) ||
    imageUrl(mediaItems(product)[0]) ||
    ""
  );
}

function money(value = {}) {
  if (value === null || value === undefined) {
    return {
      amount: 0,
      currency: "",
      formatted: ""
    };
  }

  const source =
    value.actualPrice ||
    value.price ||
    value.value ||
    value.minValue ||
    value.min ||
    value;

  const amount =
    numberValue(
      firstDefined(
        source.amount,
        source.value,
        value.amount
      )
    );

  const currency =
    text(
      firstDefined(
        source.currency,
        source.currencyCode,
        value.currency,
        value.currencyCode
      )
    );

  const formatted =
    text(
      firstDefined(
        source.formattedAmount,
        source.formatted,
        source.formattedPrice,
        value.formattedAmount,
        value.formatted,
        value.formattedPrice
      )
    );

  return {
    amount,
    currency,
    formatted:
      formatted ||
      (
        currency
          ? `${currency} ${amount.toFixed(2)}`
          : String(amount)
      )
  };
}

function productPrice(product = {}) {
  return money(
    firstDefined(
      product.variantSummary?.minPriceVariant?.price?.priceAfterDiscount,
      product.variantSummary?.minPriceVariant?.price?.actualPrice,
      product.actualPriceRange?.minValue,
      product.actualPriceRange?.min,
      product.actualPrice,
      product.priceData?.price,
      product.price
    )
  );
}

function comparePrice(product = {}) {
  return money(
    firstDefined(
      product.variantSummary?.minPriceVariant?.price?.compareAtPrice,
      product.compareAtPriceRange?.minValue,
      product.compareAtPriceRange?.min,
      product.compareAtPrice
    )
  );
}

function categoryId(category = {}) {
  return text(
    firstDefined(
      category.id,
      category._id,
      category.categoryId
    )
  );
}

function categoryName(category = {}) {
  return text(
    firstDefined(
      category.name,
      category.title,
      category.label
    )
  );
}

function normalizeCategory(category = {}, categoryMap = new Map()) {
  const id = categoryId(category);
  const parent = category.parentCategory || {};
  const parentId = text(
    firstDefined(
      parent.id,
      category.parentCategoryId,
      category.parentId
    )
  );

  return {
    id,
    _id: id,
    name: categoryName(category),
    description:
      text(
        firstDefined(
          category.description,
          category.summary
        )
      ),
    imageUrl:
      imageUrl(
        firstDefined(
          category.image,
          category.coverImage
        )
      ),
    visible:
      category.visible !== false,
    slug:
      text(category.slug),
    itemCount:
      numberValue(
        firstDefined(
          category.itemCounter,
          category.itemCount
        )
      ),
    parentCategoryId:
      parentId,
    parentCategoryName:
      text(
        firstDefined(
          parent.name,
          categoryMap.get(parentId)?.name
        )
      ),
    order:
      numberValue(
        firstDefined(
          parent.index,
          category.sortOrder,
          category.displayOrder
        )
      )
  };
}

function normalizeProduct(
  product = {},
  assignedCategoryIds = [],
  categoryMap = new Map()
) {
  const id =
    text(
      firstDefined(
        product.id,
        product._id,
        product.productId
      )
    );

  const price =
    productPrice(product);

  const oldPrice =
    comparePrice(product);

  const categoryIds =
    [
      ...new Set(
        [
          ...(product.allCategoriesInfo?.allCategoryIds || []),
          ...(product.allCategoriesInfo?.directCategoryIds || []),
          ...(product.directCategoryIds || []),
          ...(product.categoryIds || []),
          ...assignedCategoryIds
        ]
          .map(String)
          .filter(Boolean)
      )
    ];

  const categoryNames =
    categoryIds
      .map((idValue) =>
        categoryMap.get(String(idValue))?.name
      )
      .filter(Boolean);

  const ribbon =
    text(
      firstDefined(
        product.ribbon?.name,
        product.ribbon,
        product.primaryRibbon?.name
      )
    );

  const description =
    text(
      firstDefined(
        product.plainDescription,
        product.description,
        product.descriptionText,
        product.summary
      )
    );

  const inventoryStatus =
    text(
      firstDefined(
        product.inventoryStatus,
        product.inventory?.status
      )
    )
      .toUpperCase();

  const inStock =
    product.visible !== false &&
    product.inStock !== false &&
    ![
      "OUT_OF_STOCK",
      "SOLD_OUT",
      "UNAVAILABLE"
    ].includes(inventoryStatus);

  return {
    id,
    _id: id,
    name:
      text(
        product.name,
        "Product"
      ),
    slug:
      text(
        firstDefined(
          product.slug,
          product.handle
        )
      ),
    brand:
      text(
        firstDefined(
          product.brand?.name,
          product.brand,
          "SKANDI"
        ),
        "SKANDI"
      ),
    sku:
      text(
        firstDefined(
          product.sku,
          product.variantSummary?.minPriceVariant?.sku
        )
      ),
    description,
    summary:
      text(
        firstDefined(
          product.summary,
          description
        )
      ),
    imageUrl:
      productImage(product),
    price,
    comparePrice:
      oldPrice.amount > price.amount
        ? oldPrice
        : undefined,
    ribbon,
    badge:
      ribbon,
    categoryIds,
    categoryNames,
    options: [],
    inStock,
    canAddToCart:
      inStock,
    updatedAt:
      text(
        firstDefined(
          product.updatedDate,
          product._updatedDate
        )
      ),
    createdAt:
      text(
        firstDefined(
          product.createdDate,
          product._createdDate
        )
      ),
    recommendationScore:
      numberValue(
        firstDefined(
          product.recommendationScore,
          product.sortOrder
        )
      ),
    productPageUrl:
      text(
        firstDefined(
          product.url?.fullUrl,
          product.url,
          product.productPageUrl
        )
      )
  };
}

function responseProducts(response = {}) {
  return (
    response.products ||
    response.items ||
    []
  );
}

function nextCursor(response = {}) {
  return (
    response.pagingMetadata?.cursors?.next ||
    response.metadata?.cursors?.next ||
    response.paging?.nextCursor ||
    ""
  );
}

async function queryProductPage(
  cursor,
  limit
) {
  const query = {
    filter: {
      visible: {
        $eq: true
      }
    },
    cursorPaging: {
      limit,
      ...(cursor
        ? { cursor }
        : {})
    }
  };

  const fields = [
    "CURRENCY",
    "URL",
    "PLAIN_DESCRIPTION",
    "THUMBNAIL",
    "MEDIA_ITEMS_INFO",
    "ALL_CATEGORIES_INFO",
    "MIN_PRICE_VARIANT",
    "DISCOUNT_INFO"
  ];

  try {
    return await productsV3.queryProducts(
      query,
      { fields }
    );
  } catch (error) {
    console.warn(
      "[Storefront] Product field projection failed. Retrying basic query.",
      error
    );

    return productsV3.queryProducts(
      query,
      { fields: [] }
    );
  }
}

async function queryVisibleProducts(
  limit = MAX_PRODUCTS
) {
  const output = [];
  let cursor = "";

  while (
    output.length < limit
  ) {
    const response =
      await queryProductPage(
        cursor,
        Math.min(
          PAGE_SIZE,
          limit - output.length
        )
      );

    const page =
      responseProducts(response);

    output.push(
      ...page
    );

    const next =
      nextCursor(response);

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

async function queryVisibleCategories() {
  const query = {
    filter: {
      visible: {
        $eq: true
      }
    },
    cursorPaging: {
      limit: 1000
    }
  };

  try {
    const response =
      await categories.queryCategories(
        query,
        {
          treeReference:
            TREE_REFERENCE,
          returnNonVisibleCategories:
            false,
          fields: [
            "DESCRIPTION",
            "BREADCRUMBS_INFO"
          ]
        }
      );

    return (
      response.categories ||
      response.items ||
      []
    );
  } catch (error) {
    console.warn(
      "[Storefront] Categories could not be loaded. Products will still be returned.",
      error
    );

    return [];
  }
}

async function categoryAssignments(
  products
) {
  const map =
    new Map();

  if (!products.length) {
    return map;
  }

  const references =
    products
      .map((product) => ({
        catalogItemId:
          text(
            firstDefined(
              product.id,
              product._id,
              product.productId
            )
          ),
        appId:
          WIX_STORES_APP_ID
      }))
      .filter(
        (reference) =>
          reference.catalogItemId
      );

  for (
    let start = 0;
    start < references.length;
    start += 100
  ) {
    const batch =
      references.slice(
        start,
        start + 100
      );

    try {
      const response =
        await categories.listCategoriesForItems(
          batch,
          {
            treeReference:
              TREE_REFERENCE
          }
        );

      const entries =
        response.categoriesForItems ||
        response.items ||
        response.mappings ||
        [];

      entries.forEach(
        (entry) => {
          const item =
            entry.item ||
            entry.itemReference ||
            {};

          const productId =
            text(
              firstDefined(
                item.catalogItemId,
                entry.catalogItemId,
                entry.productId
              )
            );

          const ids =
            [
              ...new Set(
                [
                  ...(entry.directCategoryIds || []),
                  ...(entry.allCategoryIds || []),
                  ...(
                    entry.categories || []
                  ).map((category) =>
                    typeof category === "string"
                      ? category
                      : categoryId(category)
                  )
                ]
                  .map(String)
                  .filter(Boolean)
              )
            ];

          if (productId) {
            map.set(
              productId,
              ids
            );
          }
        }
      );
    } catch (error) {
      console.warn(
        "[Storefront] Category assignment mapping failed for one batch.",
        error
      );
    }
  }

  return map;
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

      /*
       * Products are the critical path.
       * Categories are intentionally non-fatal.
       */
      const rawProducts =
        await queryVisibleProducts(
          safeLimit
        );

      const rawCategories =
        await queryVisibleCategories();

      const rawCategoryMap =
        new Map(
          rawCategories.map(
            (category) => [
              categoryId(category),
              category
            ]
          )
        );

      const normalizedCategories =
        rawCategories
          .map((category) =>
            normalizeCategory(
              category,
              rawCategoryMap
            )
          )
          .filter(
            (category) =>
              category.id &&
              category.name
          );

      const categoryMap =
        new Map(
          normalizedCategories.map(
            (category) => [
              category.id,
              category
            ]
          )
        );

      const assignments =
        await categoryAssignments(
          rawProducts
        );

      const products =
        rawProducts
          .map((product) => {
            const productId =
              text(
                firstDefined(
                  product.id,
                  product._id,
                  product.productId
                )
              );

            return normalizeProduct(
              product,
              assignments.get(
                productId
              ) || [],
              categoryMap
            );
          })
          .filter(
            (product) =>
              product.id &&
              product.name
          );

      console.log(
        "[Storefront] Public catalog loaded.",
        {
          rawProducts:
            rawProducts.length,
          products:
            products.length,
          categories:
            normalizedCategories.length
        }
      );

      return {
        ok: true,
        products,
        categories:
          normalizedCategories,
        banners: [],
        travelCards: [],
        meta: {
          source:
            "WIX_STORES_CATALOG_V3",
          catalogVersion:
            "V3",
          rawProductCount:
            rawProducts.length,
          productCount:
            products.length,
          categoryCount:
            normalizedCategories.length,
          generatedAt:
            new Date()
              .toISOString()
        }
      };
    }
  );

/* ==========================================================================
   CART WEB METHODS
   ========================================================================== */

export const getStorefrontCart =
  webMethod(
    Permissions.Anyone,
    async function () {
      try {
        const cart =
          await currentCart.getCurrentCart();

        return {
          ok: true,
          cart
        };
      } catch (error) {
        return {
          ok: true,
          cart: {
            lineItems: []
          }
        };
      }
    }
  );

export const addProductToCurrentCart =
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

      const response =
        await currentCart.addToCurrentCart({
          lineItems
        });

      return {
        ok: true,
        cart:
          response?.cart ||
          response
      };
    }
  );

export const createStorefrontCheckout =
  webMethod(
    Permissions.Anyone,
    async function () {
      const cart =
        await currentCart.getCurrentCart();

      if (
        !cart?.lineItems?.length
      ) {
        throw new Error(
          "Your shopping bag is empty."
        );
      }

      const response =
        await currentCart.createCheckoutFromCurrentCart({
          channelType:
            "WEB"
        });

      return {
        ok: true,
        checkoutId:
          response?.checkoutId ||
          response?._id ||
          response?.id ||
          response
      };
    }
  );

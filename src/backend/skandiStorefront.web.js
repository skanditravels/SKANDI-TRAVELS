import {
  Permissions,
  webMethod
} from "wix-web-module";

import {
  productsV3
  readOnlyVariantsV3
} from "@wix/stores";

import {
  categories
} from "@wix/categories";

import {
  currentCart
} from "wix-ecom-backend";


/* ==========================================================================
   CONFIG
   ========================================================================== */

const WIX_STORES_APP_ID =
  "215238eb-22a5-4c36-9e7b-e7c08025e04e";

const TREE_REFERENCE = {
  appNamespace: "@wix/stores",
  treeKey: null
};

const PAGE_SIZE = 100;
const MAX_PRODUCTS = 300;


/* ==========================================================================
   GENERIC HELPERS
   ========================================================================== */

function text(
  value,
  fallback = ""
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
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


function firstDefined(
  ...values
) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}


function numberValue(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


/* ==========================================================================
   IMAGE HELPERS
   ========================================================================== */

/*
 * Convert any known Wix Catalog V3 media shape into a browser-ready URL.
 */
function imageUrl(
  value
) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return (
    value.image?.url ||
    value.image?.src ||
    value.url ||
    value.src ||
    value.imageUrl ||

    value.main?.image?.url ||
    value.main?.url ||

    value.mainMedia?.image?.url ||
    value.mainMedia?.url ||

    value.thumbnail?.url ||

    value.media?.image?.url ||
    value.media?.url ||

    ""
  );
}


/*
 * Catalog V3 may return additional media when MEDIA_ITEMS_INFO is requested.
 */
function mediaItems(
  product = {}
) {
  const candidates = [
    product.mediaItemsInfo?.items,
    product.mediaItemsInfo?.mediaItems,

    product.media?.items,
    product.media?.mediaItems,

    product.mediaItems,
    product.images
  ];

  for (
    const candidate
    of candidates
  ) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  return [];
}


/*
 * IMPORTANT:
 * The live Catalog V3 response for SKANDI places the canonical product
 * image here:
 *
 * product.media.main.image.url
 *
 * Keep that FIRST.
 */
function productImageCandidates(
  product = {}
) {
  const variantMedia =
    product
      ?.variantSummary
      ?.minPriceVariant
      ?.media;

  const additionalMedia =
    mediaItems(product);

  const candidates = [
    /* Catalog V3 canonical main image */
    product?.media?.main?.image?.url,
    product?.media?.main?.url,

    /* Minimum-price variant image */
    variantMedia?.image?.url,
    variantMedia?.url,

    /* Thumbnail projection */
    product?.thumbnail?.url,

    /* Other possible Wix media shapes */
    product?.media?.mainMedia?.image?.url,
    product?.media?.mainMedia?.url,

    product?.mainMedia?.image?.url,
    product?.mainMedia?.url,

    product?.image?.url,
    product?.imageUrl,

    /* Additional media */
    ...additionalMedia.map(
      (item) =>
        imageUrl(item)
    )
  ]
    .map(
      (value) =>
        String(
          value || ""
        ).trim()
    )
    .filter(Boolean);

  return [
    ...new Set(candidates)
  ];
}


function productImage(
  product = {}
) {
  return (
    productImageCandidates(
      product
    )[0] ||
    ""
  );
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function money(
  value = {}
) {
  if (
    value === null ||
    value === undefined
  ) {
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


function productPrice(
  product = {}
) {
  return money(
    firstDefined(
      product
        ?.variantSummary
        ?.minPriceVariant
        ?.price
        ?.priceAfterDiscount,

      product
        ?.variantSummary
        ?.minPriceVariant
        ?.price
        ?.actualPrice,

      product
        ?.actualPriceRange
        ?.minValue,

      product
        ?.actualPriceRange
        ?.min,

      product.actualPrice,

      product
        ?.priceData
        ?.price,

      product.price
    )
  );
}


function comparePrice(
  product = {}
) {
  return money(
    firstDefined(
      product
        ?.variantSummary
        ?.minPriceVariant
        ?.price
        ?.compareAtPrice,

      product
        ?.compareAtPriceRange
        ?.minValue,

      product
        ?.compareAtPriceRange
        ?.min,

      product.compareAtPrice
    )
  );
}


/* ==========================================================================
   CATEGORY HELPERS
   ========================================================================== */

function categoryId(
  category = {}
) {
  return text(
    firstDefined(
      category.id,
      category._id,
      category.categoryId
    )
  );
}


function categoryName(
  category = {}
) {
  return text(
    firstDefined(
      category.name,
      category.title,
      category.label
    )
  );
}


function normalizeCategory(
  category = {},
  categoryMap = new Map()
) {
  const id =
    categoryId(category);

  const parent =
    category.parentCategory ||
    {};

  const parentId =
    text(
      firstDefined(
        parent.id,
        category.parentCategoryId,
        category.parentId
      )
    );

  return {
    id,
    _id:
      id,

    name:
      categoryName(
        category
      ),

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
      text(
        category.slug
      ),

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


/* ==========================================================================
   PRODUCT OPTIONS
   ========================================================================== */

function normalizeOptionChoices(
  option = {}
) {
  const choices =
    option
      ?.choicesSettings
      ?.choices;

  if (
    !Array.isArray(choices)
  ) {
    return [];
  }

  return choices
    .filter(
      (choice) =>
        choice?.visible !== false
    )
    .map(
      (choice) => {
        const linkedMedia =
          Array.isArray(
            choice.linkedMedia
          )
            ? choice.linkedMedia
            : [];

        return {
          id:
            text(
              choice.choiceId
            ),

          value:
            text(
              firstDefined(
                choice.key,
                choice.name
              )
            ),

          name:
            text(
              firstDefined(
                choice.name,
                choice.key
              )
            ),

          inStock:
            choice.inStock !== false,

          visible:
            choice.visible !== false,

          imageUrl:
            imageUrl(
              linkedMedia[0]
            )
        };
      }
    );
}


function normalizeProductOptions(
  product = {}
) {
  const options =
    Array.isArray(
      product.options
    )
      ? product.options
      : [];

  return options.map(
    (option) => ({
      id:
        text(
          option.id
        ),

      name:
        text(
          firstDefined(
            option.name,
            option.key
          ),
          "Option"
        ),

      key:
        text(
          firstDefined(
            option.key,
            option.name
          )
        ),

      renderType:
        text(
          option.optionRenderType
        ),

      choices:
        normalizeOptionChoices(
          option
        )
    })
  );
}


/* ==========================================================================
   NORMALIZE PRODUCT
   ========================================================================== */

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
    productPrice(
      product
    );

  const oldPrice =
    comparePrice(
      product
    );

  /*
   * Catalog V3 returns category IDs inside:
   *
   * allCategoriesInfo.categories
   *
   * as:
   * [{ id: "..." }]
   */
  const v3CategoryIds =
    Array.isArray(
      product
        ?.allCategoriesInfo
        ?.categories
    )
      ? product
          .allCategoriesInfo
          .categories
          .map(
            (category) =>
              typeof category ===
                "string"
                ? category
                : (
                    category?.id ||
                    category?._id ||
                    ""
                  )
          )
          .filter(Boolean)
      : [];

  const categoryIds =
    [
      ...new Set(
        [
          ...(
            product
              ?.allCategoriesInfo
              ?.allCategoryIds ||
            []
          ),

          ...(
            product
              ?.allCategoriesInfo
              ?.directCategoryIds ||
            []
          ),

          ...v3CategoryIds,

          ...(
            product.directCategoryIds ||
            []
          ),

          ...(
            product.categoryIds ||
            []
          ),

          ...assignedCategoryIds
        ]
          .map(String)
          .filter(Boolean)
      )
    ];

  const categoryNames =
    categoryIds
      .map(
        (idValue) =>
          categoryMap
            .get(
              String(idValue)
            )
            ?.name
      )
      .filter(Boolean);

  const ribbon =
    text(
      firstDefined(
        product.ribbon?.name,
        product.ribbon,
        product.primaryRibbon?.name,

        Array.isArray(
          product.additionalRibbons
        )
          ? (
              product.additionalRibbons[0]
                ?.name ||
              product.additionalRibbons[0]
                ?.text ||
              ""
            )
          : ""
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

  /*
   * Catalog V3 uses:
   * inventory.availabilityStatus
   *
   * Examples:
   * IN_STOCK
   * PARTIALLY_OUT_OF_STOCK
   * OUT_OF_STOCK
   */
  const inventoryStatus =
    text(
      firstDefined(
        product.inventoryStatus,

        product
          ?.inventory
          ?.availabilityStatus,

        product
          ?.inventory
          ?.status
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
    ].includes(
      inventoryStatus
    );

  /*
   * Extract the image once and reuse it.
   */
  const mainImage =
    productImage(
      product
    );

  const mediaUrls =
    productImageCandidates(
      product
    );

  return {
    id,

    _id:
      id,

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

    handle:
      text(
        product.handle
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

    brandId:
      text(
        product.brand?.id
      ),

    sku:
      text(
        firstDefined(
          product.sku,

          product
            ?.variantSummary
            ?.minPriceVariant
            ?.sku
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


    /* ==============================================================
       IMAGE FIELDS
       ============================================================== */

    /*
     * Main field used by SKANDI storefront.
     */
    imageUrl:
      mainImage,

    /*
     * Compatibility fields so the existing HTML can find it even if
     * it expects another property name.
     */
    image:
      mainImage,

    mainImage:
      mainImage,

    mainMedia:
      mainImage,

    thumbnailUrl:
      imageUrl(
        product.thumbnail
      ),

    variantImageUrl:
      imageUrl(
        product
          ?.variantSummary
          ?.minPriceVariant
          ?.media
      ),

    /*
     * All valid Wix image URLs for fallback rendering.
     */
    mediaUrls,


    /* ==============================================================
       PRICE
       ============================================================== */

    price,

    comparePrice:
      oldPrice.amount >
        price.amount
        ? oldPrice
        : undefined,


    /* ==============================================================
       PRODUCT META
       ============================================================== */

    ribbon,

    badge:
      ribbon,

    categoryIds,

    categoryNames,

    mainCategoryId:
      text(
        product.mainCategoryId
      ),

    options:
      normalizeProductOptions(
        product
      ),

    variantCount:
      numberValue(
        product
          ?.variantSummary
          ?.variantCount
      ),

    defaultVariantId:
      text(
        product
          ?.variantSummary
          ?.minPriceVariant
          ?.id
      ),

    inventoryStatus,

    inStock,

    canAddToCart:
      inStock,

    productType:
      text(
        product.productType
      ),

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

    /*
     * Catalog V3:
     *
     * product.url.url
     * product.url.relativePath
     */
    productPageUrl:
      text(
        firstDefined(
          product?.url?.url,
          product?.url?.fullUrl,
          product?.url?.relativePath,

          typeof product.url ===
            "string"
            ? product.url
            : "",

          product.productPageUrl
        )
      )
  };
}

/* ==========================================================================
   CATALOG V3 VARIANT RESOLUTION
   ========================================================================== */

function normalizeChoiceValue(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toLowerCase();
}


function variantChoiceMap(
  variant = {}
) {
  const map =
    new Map();

  const choices =
    Array.isArray(
      variant.optionChoices
    )
      ? variant.optionChoices
      : [];

  choices.forEach(
    (choice) => {
      const names =
        choice.optionChoiceNames ||
        {};

      const optionName =
        normalizeChoiceValue(
          names.optionName
        );

      const choiceName =
        normalizeChoiceValue(
          names.choiceName
        );

      if (
        optionName &&
        choiceName
      ) {
        map.set(
          optionName,
          choiceName
        );
      }
    }
  );

  return map;
}


function variantMatchesChoices(
  variant,
  selectedChoices
) {
  const entries =
    Object.entries(
      selectedChoices ||
      {}
    )
      .filter(
        ([key, value]) =>
          String(key || "").trim() &&
          String(value || "").trim()
      );

  if (
    !entries.length
  ) {
    return true;
  }

  const variantChoices =
    variantChoiceMap(
      variant
    );

  return entries.every(
    ([optionName, choiceName]) => {
      const optionKey =
        normalizeChoiceValue(
          optionName
        );

      const selectedValue =
        normalizeChoiceValue(
          choiceName
        );

      return (
        variantChoices.get(
          optionKey
        ) ===
        selectedValue
      );
    }
  );
}


export const resolveStoreVariant =
  webMethod(
    Permissions.Anyone,

    async function ({
      productId,
      choices = {}
    } = {}) {
      const cleanProductId =
        String(
          productId ||
          ""
        ).trim();

      if (!cleanProductId) {
        throw new Error(
          "Product ID is required."
        );
      }

      const response =
        await readOnlyVariantsV3
          .queryVariants(
            {
              filter: {
                "productData.productId": {
                  $eq:
                    cleanProductId
                }
              },

              cursorPaging: {
                limit:
                  1000
              }
            },

            {
              fields: [
                "CURRENCY"
              ]
            }
          );

      const variants =
        Array.isArray(
          response?.variants
        )
          ? response.variants
          : [];

      if (
        !variants.length
      ) {
        throw new Error(
          "No purchasable variants were found for this product."
        );
      }

      const matchingVariants =
        variants.filter(
          (variant) =>
            variant.visible !==
              false &&
            variantMatchesChoices(
              variant,
              choices
            )
        );

      /*
       * Prefer an in-stock variant.
       */
      const selected =
        matchingVariants.find(
          (variant) =>
            variant
              ?.inventoryStatus
              ?.inStock !== false
        ) ||
        matchingVariants[0];

      if (!selected) {
        return {
          ok:
            false,

          message:
            "That combination is currently unavailable."
        };
      }

      return {
        ok:
          true,

        productId:
          cleanProductId,

        variantId:
          selected.variantId,

        sku:
          selected.sku ||
          "",

        inStock:
          selected
            ?.inventoryStatus
            ?.inStock !== false
      };
    }
  );
/* ==========================================================================
   PRODUCT QUERY
   ========================================================================== */

function responseProducts(
  response = {}
) {
  return (
    response.products ||
    response.items ||
    []
  );
}


function nextCursor(
  response = {}
) {
  return (
    response
      ?.pagingMetadata
      ?.cursors
      ?.next ||

    response
      ?.metadata
      ?.cursors
      ?.next ||

    response
      ?.paging
      ?.nextCursor ||

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
        ? {
            cursor
          }
        : {})
    }
  };

  /*
   * These are Catalog V3 field ENUMS,
   * not property names.
   */
  const fields = [
    "CURRENCY",
    "URL",
    "PLAIN_DESCRIPTION",
    "THUMBNAIL",
    "MEDIA_ITEMS_INFO",
    "ALL_CATEGORIES_INFO",
    "MIN_PRICE_VARIANT"
  ];

  try {
    return await productsV3
      .queryProducts(
        query,
        {
          fields
        }
      );
  } catch (error) {
    console.warn(
      "[Storefront] Extended Catalog V3 query failed. Retrying default product fields.",
      error
    );

    /*
     * Default V3 fields still include core product media.
     */
    return productsV3
      .queryProducts(
        query,
        {
          fields: []
        }
      );
  }
}


async function queryVisibleProducts(
  limit = MAX_PRODUCTS
) {
  const output = [];

  let cursor =
    "";

  while (
    output.length <
      limit
  ) {
    const response =
      await queryProductPage(
        cursor,

        Math.min(
          PAGE_SIZE,
          limit -
            output.length
        )
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


/* ==========================================================================
   CATEGORY QUERY
   ========================================================================== */

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
      await categories
        .queryCategories(
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


/* ==========================================================================
   CATEGORY ASSIGNMENTS
   ========================================================================== */

async function categoryAssignments(
  products
) {
  const map =
    new Map();

  if (
    !products.length
  ) {
    return map;
  }

  const references =
    products
      .map(
        (product) => ({
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
        })
      )
      .filter(
        (reference) =>
          reference.catalogItemId
      );

  for (
    let start = 0;
    start <
      references.length;
    start += 100
  ) {
    const batch =
      references.slice(
        start,
        start + 100
      );

    try {
      const response =
        await categories
          .listCategoriesForItems(
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
                  ...(
                    entry.directCategoryIds ||
                    []
                  ),

                  ...(
                    entry.allCategoryIds ||
                    []
                  ),

                  ...(
                    entry.categories ||
                    []
                  ).map(
                    (category) =>
                      typeof category ===
                        "string"
                        ? category
                        : categoryId(
                            category
                          )
                  )
                ]
                  .map(String)
                  .filter(Boolean)
              )
            ];

          if (
            productId
          ) {
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


/* ==========================================================================
   PUBLIC STOREFRONT PRODUCT API
   ========================================================================== */

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


      /* ==============================================================
         PRODUCTS
         ============================================================== */

      const rawProducts =
        await queryVisibleProducts(
          safeLimit
        );


      /* ==============================================================
         CATEGORIES
         ============================================================== */

      const rawCategories =
        await queryVisibleCategories();


      const rawCategoryMap =
        new Map(
          rawCategories.map(
            (category) => [
              categoryId(
                category
              ),

              category
            ]
          )
        );


      const normalizedCategories =
        rawCategories
          .map(
            (category) =>
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


      /* ==============================================================
         NORMALIZE PRODUCTS
         ============================================================== */

      const products =
        rawProducts
          .map(
            (product) => {
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
            }
          )
          .filter(
            (product) =>
              product.id &&
              product.name
          );


      /* ==============================================================
         DIAGNOSTIC
         ============================================================== */

      console.log(
        "[Storefront] Public Catalog V3 loaded.",
        {
          rawProducts:
            rawProducts.length,

          products:
            products.length,

          categories:
            normalizedCategories.length,

          imageCheck:
            products
              .slice(
                0,
                5
              )
              .map(
                (product) => ({
                  name:
                    product.name,

                  imageUrl:
                    product.imageUrl,

                  thumbnailUrl:
                    product.thumbnailUrl,

                  variantImageUrl:
                    product.variantImageUrl,

                  mediaUrls:
                    product.mediaUrls
                })
              )
        }
      );


      /* ==============================================================
         RESPONSE
         ============================================================== */

      return {
        ok:
          true,

        products,

        categories:
          normalizedCategories,

        banners:
          [],

        travelCards:
          [],

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
   CART
   ========================================================================== */

export const getStorefrontCart =
  webMethod(
    Permissions.Anyone,

    async function () {
      try {
        const cart =
          await currentCart
            .getCurrentCart();

        return {
          ok:
            true,

          cart
        };
      } catch (error) {
        console.warn(
          "[Storefront] Current cart unavailable.",
          error
        );

        return {
          ok:
            true,

          cart: {
            lineItems: []
          }
        };
      }
    }
  );


/* ==========================================================================
   ADD TO CART
   ========================================================================== */

export const addProductToCurrentCart =
  webMethod(
    Permissions.Anyone,

    async function ({
      lineItems = []
    } = {}) {
      if (
        !Array.isArray(
          lineItems
        ) ||
        !lineItems.length
      ) {
        throw new Error(
          "No store item was supplied."
        );
      }

      const response =
        await currentCart
          .addToCurrentCart({
            lineItems
          });

      return {
        ok:
          true,

        cart:
          response?.cart ||
          response
      };
    }
  );


/* ==========================================================================
   CHECKOUT
   ========================================================================== */

export const createStorefrontCheckout =
  webMethod(
    Permissions.Anyone,

    async function () {
      const cart =
        await currentCart
          .getCurrentCart();

      if (
        !cart
          ?.lineItems
          ?.length
      ) {
        throw new Error(
          "Your shopping bag is empty."
        );
      }

      const response =
        await currentCart
          .createCheckoutFromCurrentCart({
            channelType:
              "WEB"
          });

      return {
        ok:
          true,

        checkoutId:
          response?.checkoutId ||
          response?._id ||
          response?.id ||
          response
      };
    }
  );

import {
  Permissions,
  webMethod
} from "wix-web-module";

import {
  productsV3,
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

const PRODUCT_FIELDS = [
  "CURRENCY",
  "URL",
  "PLAIN_DESCRIPTION",
  "THUMBNAIL",
  "MEDIA_ITEMS_INFO",
  "ALL_CATEGORIES_INFO",
  "MIN_PRICE_VARIANT"
];


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
 *
 * For SKANDI's Wix Catalog V3 products the canonical image should be
 * read from:
 *
 * product.media.main.image.url
 *
 * Keep that first.
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
    mediaItems(
      product
    );

  const candidates = [
    /* Main Catalog V3 image */
    product?.media?.main?.image?.url,
    product?.media?.main?.url,

    /* Minimum price variant image */
    variantMedia?.image?.url,
    variantMedia?.url,

    /* Thumbnail */
    product?.thumbnail?.url,

    /* Other possible V3 media shapes */
    product?.media?.mainMedia?.image?.url,
    product?.media?.mainMedia?.url,

    product?.mainMedia?.image?.url,
    product?.mainMedia?.url,

    product?.image?.url,
    product?.imageUrl,

    /* Additional media */
    ...additionalMedia.map(
      (item) =>
        imageUrl(
          item
        )
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
    ...new Set(
      candidates
    )
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
    categoryId(
      category
    );

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
      category.visible !==
        false,

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
          categoryMap.get(
            parentId
          )?.name
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
    !Array.isArray(
      choices
    )
  ) {
    return [];
  }

  return choices
    .filter(
      (choice) =>
        choice?.visible !==
          false
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
            choice.inStock !==
              false,

          visible:
            choice.visible !==
              false,

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
          firstDefined(
            option.id,
            option._id
          )
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
   PRODUCT NORMALIZATION
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


  /* ========================================================================
     CATEGORIES
     ======================================================================== */

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
              String(
                idValue
              )
            )
            ?.name
      )
      .filter(Boolean);


  /* ========================================================================
     RIBBON
     ======================================================================== */

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
              product
                .additionalRibbons[0]
                ?.name ||

              product
                .additionalRibbons[0]
                ?.text ||

              ""
            )
          : ""
      )
    );


  /* ========================================================================
     DESCRIPTION
     ======================================================================== */

  const description =
    text(
      firstDefined(
        product.plainDescription,
        product.description,
        product.descriptionText,
        product.summary
      )
    );


  /* ========================================================================
     INVENTORY
     ======================================================================== */

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
    product.visible !==
      false &&

    product.inStock !==
      false &&

    ![
      "OUT_OF_STOCK",
      "SOLD_OUT",
      "UNAVAILABLE"
    ].includes(
      inventoryStatus
    );


  /* ========================================================================
     IMAGE
     ======================================================================== */

  const mainImage =
    productImage(
      product
    );

  const mediaUrls =
    productImageCandidates(
      product
    );


  /* ========================================================================
     RESPONSE
     ======================================================================== */

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


    /* ======================================================================
       IMAGES
       ====================================================================== */

    imageUrl:
      mainImage,

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

    mediaUrls,


    /* ======================================================================
       PRICING
       ====================================================================== */

    price,

    comparePrice:
      oldPrice.amount >
        price.amount
        ? oldPrice
        : undefined,


    /* ======================================================================
       PRODUCT META
       ====================================================================== */

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

    /*
     * Catalog V3 requires a variantId when passing the product into
     * Wix eCommerce.
     *
     * The minPriceVariant ID is suitable as the default variant where
     * the customer hasn't selected another option.
     */
    defaultVariantId:
      text(
        firstDefined(
          product
            ?.variantSummary
            ?.minPriceVariant
            ?.id,

          product
            ?.variantSummary
            ?.minPriceVariant
            ?._id
        )
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
        $eq:
          true
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


  try {
    return await productsV3
      .queryProducts(
        query,
        {
          fields:
            PRODUCT_FIELDS
        }
      );
  } catch (error) {
    console.warn(
      "[Storefront] Extended Catalog V3 query failed. Retrying basic product query.",
      error
    );

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
  const output =
    [];

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
        $eq:
          true
      }
    },

    cursorPaging: {
      limit:
        1000
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
    /*
     * Categories are NOT allowed to break product loading.
     */
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
    !Array.isArray(
      products
    ) ||
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
   PUBLIC PRODUCT CATALOG
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


      /* ====================================================================
         PRODUCTS — CRITICAL PATH
         ==================================================================== */

      const rawProducts =
        await queryVisibleProducts(
          safeLimit
        );


      /* ====================================================================
         CATEGORIES — NON-CRITICAL
         ==================================================================== */

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


      /* ====================================================================
         NORMALIZE PRODUCTS
         ==================================================================== */

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


      /* ====================================================================
         DIAGNOSTIC
         ==================================================================== */

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

                  mediaUrls:
                    product.mediaUrls,

                  defaultVariantId:
                    product.defaultVariantId
                })
              )
        }
      );


      /* ====================================================================
         RESPONSE
         ==================================================================== */

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
   VARIANT RESOLUTION HELPERS
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
          String(
            key ||
            ""
          ).trim() &&

          String(
            value ||
            ""
          ).trim()
      );


  /*
   * No option choices supplied:
   * any variant is technically a candidate.
   */
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
    ([
      optionName,
      choiceName
    ]) => {
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


function variantAvailable(
  variant = {}
) {
  const status =
    text(
      firstDefined(
        variant
          ?.inventoryStatus
          ?.availabilityStatus,

        variant
          ?.inventoryStatus
          ?.status,

        variant.inventoryStatus
      )
    )
      .toUpperCase();


  if (
    [
      "OUT_OF_STOCK",
      "UNAVAILABLE",
      "SOLD_OUT"
    ].includes(
      status
    )
  ) {
    return false;
  }


  if (
    variant
      ?.inventoryStatus
      ?.inStock ===
      false
  ) {
    return false;
  }


  return true;
}


/* ==========================================================================
   RESOLVE CATALOG V3 VARIANT
   ========================================================================== */

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


      if (
        !cleanProductId
      ) {
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
        return {
          ok:
            false,

          message:
            "No purchasable variants were found for this product."
        };
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


      if (
        !matchingVariants.length
      ) {
        return {
          ok:
            false,

          message:
            "That option combination is not available."
        };
      }


      /*
       * Prefer an available/in-stock matching variant.
       */
      const selected =
        matchingVariants.find(
          (variant) =>
            variantAvailable(
              variant
            )
        ) ||
        matchingVariants[0];


      if (
        !selected?.variantId
      ) {
        return {
          ok:
            false,

          message:
            "The Wix Store variant could not be identified."
        };
      }


      const selectedChoiceLabels =
        Array.isArray(
          selected.optionChoices
        )
          ? selected.optionChoices
              .map(
                (choice) => {
                  const names =
                    choice.optionChoiceNames ||
                    {};

                  const optionName =
                    text(
                      names.optionName
                    );

                  const choiceName =
                    text(
                      names.choiceName
                    );

                  return (
                    optionName &&
                    choiceName
                  )
                    ? `${optionName}: ${choiceName}`
                    : "";
                }
              )
              .filter(Boolean)
          : [];


      console.log(
        "[Storefront] Variant resolved.",
        {
          productId:
            cleanProductId,

          variantId:
            selected.variantId,

          sku:
            selected.sku ||
            "",

          selectedChoices:
            choices,

          resolvedChoices:
            selectedChoiceLabels
        }
      );


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
          variantAvailable(
            selected
          ),

        choices:
          selectedChoiceLabels
      };
    }
  );


/* ==========================================================================
   GET CURRENT CART
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
        /*
         * A visitor without an existing cart should not break the Store UI.
         */
        console.warn(
          "[Storefront] Current cart unavailable or not yet created.",
          error
        );


        return {
          ok:
            true,

          cart: {
            lineItems:
              []
          }
        };
      }
    }
  );


/* ==========================================================================
   ADD PRODUCT TO CURRENT CART
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


      /*
       * Validate the Wix Stores catalog reference before sending it
       * to Wix eCommerce.
       */
      const normalizedLineItems =
        lineItems.map(
          (item) => {
            const reference =
              item.catalogReference ||
              {};


            const productId =
              String(
                reference.catalogItemId ||
                ""
              ).trim();


            const variantId =
              String(
                reference
                  ?.options
                  ?.variantId ||
                ""
              ).trim();


            if (
              !productId
            ) {
              throw new Error(
                "A Wix Store product ID is required."
              );
            }


            if (
              !variantId
            ) {
              throw new Error(
                "A Wix Catalog V3 variant ID is required."
              );
            }


            return {
              catalogReference: {
                appId:
                  WIX_STORES_APP_ID,

                catalogItemId:
                  productId,

                options: {
                  ...reference.options,

                  variantId
                }
              },

              quantity:
                Math.max(
                  1,

                  Number(
                    item.quantity ||
                    1
                  )
                )
            };
          }
        );


      console.log(
        "[Storefront] Adding items to Wix cart.",
        normalizedLineItems.map(
          (item) => ({
            productId:
              item
                .catalogReference
                .catalogItemId,

            variantId:
              item
                .catalogReference
                .options
                .variantId,

            quantity:
              item.quantity
          })
        )
      );


      const response =
        await currentCart
          .addToCurrentCart({
            lineItems:
              normalizedLineItems
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
   CREATE CHECKOUT
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


      const checkoutId =
        response?.checkoutId ||
        response?._id ||
        response?.id ||
        "";


      if (
        !checkoutId
      ) {
        throw new Error(
          "Wix checkout could not be created."
        );
      }


      console.log(
        "[Storefront] Checkout created.",
        {
          checkoutId
        }
      );


      return {
        ok:
          true,

        checkoutId
      };
    }
  );

import { Permissions, webMethod } from "wix-web-module";
import { productsV3 } from "@wix/stores";
import { categories } from "@wix/categories";

const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const TREE_REFERENCE = {
  appNamespace: "@wix/stores",
  treeKey: null
};
const MAX_PUBLIC_PRODUCTS = 300;
const PAGE_SIZE = 100;

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
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toBrowserImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  if (raw.startsWith("wix:image://v1/")) {
    const path = raw.slice("wix:image://v1/".length).split("#")[0];
    const mediaId = decodeURIComponent(path.split("/")[0] || "");
    return mediaId ? `https://static.wixstatic.com/media/${mediaId}` : "";
  }

  if (raw.startsWith("/media/")) {
    return `https://static.wixstatic.com${raw}`;
  }

  if (/^[A-Za-z0-9_-]+_[A-Za-z0-9_-]+~mv2(?:\.[A-Za-z0-9]+)?$/i.test(raw)) {
    return `https://static.wixstatic.com/media/${raw}`;
  }

  return raw;
}

function normalizeImage(value) {
  if (!value) return "";
  if (typeof value === "string") return toBrowserImageUrl(value);

  const candidate =
    value.url ||
    value.src ||
    value.imageUrl ||
    value.image?.url ||
    value.image?.src ||
    value.imageInfo?.url ||
    value.file?.url ||
    value.thumbnail?.url ||
    value.media?.url ||
    value.mainMedia?.image?.url ||
    value.mainMedia?.url ||
    value.id ||
    value.image?.id ||
    "";

  return toBrowserImageUrl(candidate);
}

function primaryProductImage(product = {}) {
  const media = product.media || product.mediaItemsInfo || {};
  const items =
    media.itemsInfo?.items ||
    media.items ||
    media.mediaItems ||
    product.mediaItemsInfo?.items ||
    product.mediaItems ||
    product.images ||
    [];

  return (
    normalizeImage(product.image) ||
    normalizeImage(product.mainMedia) ||
    normalizeImage(media.mainMedia) ||
    normalizeImage(media.main) ||
    normalizeImage(items[0]) ||
    ""
  );
}

function priceParts(value = {}) {
  if (value === null || value === undefined) {
    return { amount: 0, currency: "", formatted: "" };
  }

  if (typeof value === "number" || typeof value === "string") {
    return {
      amount: toNumber(value),
      currency: "",
      formatted: ""
    };
  }

  const nested =
    value.price ||
    value.value ||
    value.minValue ||
    value.min ||
    value.minimum ||
    value;

  const amount = toNumber(
    firstDefined(
      nested.amount,
      nested.value,
      value.amount,
      value.minAmount,
      value.minimumAmount
    )
  );

  const currency = text(
    firstDefined(
      nested.currency,
      nested.currencyCode,
      value.currency,
      value.currencyCode
    )
  );

  const formatted = text(
    firstDefined(
      nested.formattedAmount,
      nested.formatted,
      nested.formattedPrice,
      value.formattedAmount,
      value.formatted,
      value.formattedPrice
    )
  );

  return { amount, currency, formatted };
}

function formatMoney(price) {
  if (price.formatted) return price.formatted;
  if (!price.currency) return String(price.amount || "");

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency
    }).format(price.amount || 0);
  } catch (error) {
    return `${price.currency} ${Number(price.amount || 0).toFixed(2)}`;
  }
}

function normalizeMoney(value) {
  const result = priceParts(value);
  return {
    amount: result.amount,
    currency: result.currency,
    formatted: formatMoney(result)
  };
}

function extractPrice(product = {}) {
  return normalizeMoney(
    firstDefined(
      product.actualPriceRange?.minValue,
      product.actualPriceRange?.min,
      product.actualPrice,
      product.priceData?.price,
      product.price,
      product.convertedPriceData?.price,
      product.variantsInfo?.variants?.[0]?.price?.actualPrice
    )
  );
}

function extractComparePrice(product = {}) {
  return normalizeMoney(
    firstDefined(
      product.compareAtPriceRange?.minValue,
      product.compareAtPriceRange?.min,
      product.compareAtPrice,
      product.priceData?.discountedPrice
        ? product.priceData?.price
        : undefined,
      product.variantsInfo?.variants?.[0]?.price?.compareAtPrice
    )
  );
}

function normalizeChoices(rawChoices) {
  if (!rawChoices) return [];

  if (Array.isArray(rawChoices)) {
    return rawChoices
      .map((choice) => {
        if (typeof choice === "string") {
          return {
            id: choice,
            value: choice,
            description: choice,
            inStock: true,
            visible: true
          };
        }

        const description = text(
          firstDefined(
            choice.name,
            choice.description,
            choice.value,
            choice.choiceName,
            choice.label,
            choice.id,
            choice._id
          )
        );

        return {
          id: text(firstDefined(choice.id, choice._id, choice.choiceId, description)),
          value: text(
            firstDefined(
              choice.value,
              choice.name,
              choice.description,
              choice.choiceName,
              choice.id,
              choice._id
            )
          ),
          description,
          inStock: choice.inStock !== false,
          visible: choice.visible !== false
        };
      })
      .filter((choice) => choice.description && choice.visible !== false);
  }

  if (typeof rawChoices === "object") {
    return Object.entries(rawChoices).map(([key, value]) => ({
      id: key,
      value: text(value, key),
      description: text(value, key),
      inStock: true,
      visible: true
    }));
  }

  return [];
}

function normalizeOptions(product = {}) {
  const rawOptions =
    product.options ||
    product.productOptions ||
    product.variantOptions ||
    [];

  if (Array.isArray(rawOptions)) {
    return rawOptions
      .map((option) => ({
        id: text(firstDefined(option.id, option._id, option.optionId)),
        name: text(
          firstDefined(
            option.name,
            option.title,
            option.label,
            option.optionName
          )
        ),
        type: text(
          firstDefined(
            option.optionType,
            option.type,
            option.renderType,
            "DROP_DOWN"
          )
        ),
        choices: normalizeChoices(
          firstDefined(
            option.choices,
            option.optionChoices,
            option.values,
            option.choiceSettings?.choices
          )
        )
      }))
      .filter((option) => option.name && option.choices.length);
  }

  if (typeof rawOptions === "object") {
    return Object.entries(rawOptions).map(([name, choices]) => ({
      id: name,
      name,
      type: "DROP_DOWN",
      choices: normalizeChoices(choices)
    }));
  }

  return [];
}

function inventoryAvailable(product = {}) {
  const status = text(
    firstDefined(
      product.inventoryStatus,
      product.inventory?.status,
      product.stock?.inventoryStatus,
      product.variantsInfo?.variants?.[0]?.inventoryStatus
    )
  ).toUpperCase();

  if (["OUT_OF_STOCK", "SOLD_OUT", "UNAVAILABLE"].includes(status)) {
    return false;
  }

  if (product.inStock === false || product.inventory?.inStock === false) {
    return false;
  }

  return product.visible !== false;
}

function categoryIdOf(category = {}) {
  return text(firstDefined(category.id, category._id, category.categoryId));
}

function categoryNameOf(category = {}) {
  return text(firstDefined(category.name, category.title, category.label));
}

function productCategoryIds(product = {}) {
  const ids = new Set();

  const sources = [
    product.directCategoryIds,
    product.categoryIds,
    product.allCategoriesInfo?.directCategoryIds,
    product.allCategoriesInfo?.allCategoryIds,
    product.allCategoriesInfo?.categories,
    product.categories,
    product.collections
  ];

  sources.forEach((source) => {
    (Array.isArray(source) ? source : []).forEach((entry) => {
      const id = typeof entry === "string" ? entry : categoryIdOf(entry);
      if (id) ids.add(String(id));
    });
  });

  if (product.mainCategoryId) ids.add(String(product.mainCategoryId));
  return [...ids];
}

function normalizeCategory(category = {}, categoryMap = new Map()) {
  const id = categoryIdOf(category);
  const parent = category.parentCategory || category.parent || {};
  const parentId = text(
    firstDefined(
      category.parentCategoryId,
      category.parentId,
      parent.id,
      parent._id
    )
  );
  const parentRecord = categoryMap.get(parentId);

  return {
    id,
    _id: id,
    name: categoryNameOf(category),
    description: text(
      firstDefined(
        category.description,
        category.summary,
        category.shortDescription
      )
    ),
    imageUrl: normalizeImage(
      firstDefined(category.image, category.imageUrl, category.coverImage)
    ),
    slug: text(firstDefined(category.slug, category.urlSlug)),
    visible: category.visible !== false,
    itemCount: toNumber(
      firstDefined(category.itemCounter, category.itemCount, category.productCount)
    ),
    parentCategoryId: parentId,
    parentCategoryName: text(
      firstDefined(
        category.parentCategoryName,
        parent.name,
        parent.title,
        parentRecord?.name,
        parentRecord?.title
      )
    ),
    order: toNumber(
      firstDefined(
        parent.index,
        category.sortOrder,
        category.displayOrder,
        category.rank
      )
    )
  };
}

function normalizeProduct(product = {}, categoryIds = [], categoryMap = new Map()) {
  const id = text(firstDefined(product.id, product._id, product.productId));
  const price = extractPrice(product);
  const comparePrice = extractComparePrice(product);
  const allCategoryIds = [
    ...new Set([...productCategoryIds(product), ...(categoryIds || [])])
  ];
  const categoryNames = allCategoryIds
    .map((categoryId) => categoryNameOf(categoryMap.get(String(categoryId))))
    .filter(Boolean);

  const ribbon = text(
    firstDefined(
      product.ribbon?.name,
      product.ribbon,
      product.primaryRibbon?.name,
      product.badge
    )
  );

  const description = text(
    firstDefined(
      product.description,
      product.plainDescription,
      product.descriptionText,
      product.summary
    )
  );

  const inStock = inventoryAvailable(product);
  const mainImageUrl = primaryProductImage(product);
  const imageUrls = [
    ...new Set(
      (
        product.media?.itemsInfo?.items ||
        product.media?.items ||
        product.mediaItemsInfo?.items ||
        product.mediaItems ||
        product.images ||
        []
      )
        .map(normalizeImage)
        .filter(Boolean)
    )
  ];

  if (mainImageUrl && !imageUrls.includes(mainImageUrl)) {
    imageUrls.unshift(mainImageUrl);
  }

  return {
    id,
    _id: id,
    slug: text(firstDefined(product.slug, product.handle)),
    name: text(product.name, "Product"),
    brand: text(firstDefined(product.brand?.name, product.brand, "SKANDI")),
    sku: text(
      firstDefined(
        product.sku,
        product.variantsInfo?.variants?.[0]?.sku,
        product.inventoryItem?.sku
      )
    ),
    description,
    summary: text(firstDefined(product.summary, description)),
    recommendation: text(product.recommendation),
    imageUrl: mainImageUrl,
    image: mainImageUrl,
    mainImage: mainImageUrl,
    images: imageUrls,
    price,
    comparePrice:
      comparePrice.amount > price.amount ? comparePrice : undefined,
    ribbon,
    badge: ribbon,
    categoryIds: allCategoryIds,
    categoryNames,
    options: normalizeOptions(product),
    inStock,
    canAddToCart: inStock && product.visible !== false,
    updatedAt: text(
      firstDefined(product.updatedDate, product._updatedDate, product.lastUpdated)
    ),
    createdAt: text(firstDefined(product.createdDate, product._createdDate)),
    recommendationScore: toNumber(
      firstDefined(product.recommendationScore, product.sortOrder, 0)
    ),
    productPageUrl: text(firstDefined(product.url, product.productPageUrl))
  };
}

function responseItems(response = {}) {
  return response.products || response.items || [];
}

function nextCursor(response = {}) {
  return (
    response.pagingMetadata?.cursors?.next ||
    response.metadata?.cursors?.next ||
    response.paging?.nextCursor ||
    ""
  );
}

async function queryProductPage(cursor, limit) {
  const query = {
    filter: {
      visible: { $eq: true }
    },
    cursorPaging: {
      limit,
      ...(cursor ? { cursor } : {})
    }
  };

  const preferredFields = [
    "MEDIA_ITEMS_INFO",
    "CURRENCY",
    "URL",
    "DESCRIPTION"
  ];

  try {
    return await productsV3.queryProducts(query, {
      fields: preferredFields
    });
  } catch (error) {
    console.warn(
      "Product query field projection was not accepted. Retrying with default fields.",
      error
    );
    return productsV3.queryProducts(query, { fields: [] });
  }
}

async function queryVisibleProducts(limit) {
  const products = [];
  let cursor = "";

  while (products.length < limit) {
    const pageLimit = Math.min(PAGE_SIZE, limit - products.length);
    const response = await queryProductPage(cursor, pageLimit);
    const page = responseItems(response);
    products.push(...page);

    const next = nextCursor(response);
    if (!next || page.length === 0) break;
    cursor = next;
  }

  return products.slice(0, limit);
}

function productIdOf(product = {}) {
  return text(firstDefined(product.id, product._id, product.productId));
}

async function getProductWithMedia(product = {}) {
  const productId = productIdOf(product);
  if (!productId) return product;

  try {
    const response = await productsV3.getProduct(productId, {
      fields: ["MEDIA_ITEMS_INFO", "CURRENCY", "URL", "DESCRIPTION"]
    });
    const detailed = response?.product || response || {};

    return {
      ...product,
      ...detailed,
      media: detailed.media || product.media,
      actualPriceRange:
        detailed.actualPriceRange || product.actualPriceRange,
      compareAtPriceRange:
        detailed.compareAtPriceRange || product.compareAtPriceRange,
      options: detailed.options || product.options
    };
  } catch (error) {
    console.warn(`Product media could not be hydrated for ${productId}.`, error);
    return product;
  }
}

async function hydrateMissingProductMedia(productList = []) {
  const output = [...productList];
  const missingIndexes = output
    .map((product, index) => (primaryProductImage(product) ? -1 : index))
    .filter((index) => index >= 0);

  if (!missingIndexes.length) return output;

  let cursor = 0;
  const workerCount = Math.min(8, missingIndexes.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < missingIndexes.length) {
      const position = cursor++;
      const productIndex = missingIndexes[position];
      output[productIndex] = await getProductWithMedia(output[productIndex]);
    }
  });

  await Promise.all(workers);
  return output;
}

async function queryVisibleCategories() {
  const query = {
    filter: {
      visible: { $eq: true }
    },
    cursorPaging: {
      limit: 1000
    }
  };

  const options = {
    treeReference: TREE_REFERENCE,
    returnNonVisibleCategories: false,
    fields: ["DESCRIPTION", "BREADCRUMBS_INFO"]
  };

  try {
    const response = await categories.queryCategories(query, options);
    return response.categories || response.items || [];
  } catch (error) {
    console.warn(
      "Category description projection was not accepted. Retrying with default fields.",
      error
    );
    const response = await categories.queryCategories(query, {
      treeReference: TREE_REFERENCE,
      returnNonVisibleCategories: false,
      fields: []
    });
    return response.categories || response.items || [];
  }
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function itemProductId(entry = {}) {
  const item = entry.item || entry.itemReference || entry.reference || {};
  return text(
    firstDefined(
      item.catalogItemId,
      item.productId,
      entry.catalogItemId,
      entry.productId
    )
  );
}

async function mapCategoriesToProducts(productList) {
  const mapping = new Map();
  const references = productList
    .map((product) => ({
      catalogItemId: text(firstDefined(product.id, product._id, product.productId)),
      appId: WIX_STORES_APP_ID
    }))
    .filter((reference) => reference.catalogItemId);

  for (const batch of chunks(references, 100)) {
    try {
      const response = await categories.listCategoriesForItems(batch, {
        treeReference: TREE_REFERENCE
      });

      const entries =
        response.categoriesForItems ||
        response.items ||
        response.mappings ||
        [];

      entries.forEach((entry) => {
        const productId = itemProductId(entry);
        const categoryIds = [
          ...new Set([
            ...(entry.directCategoryIds || []),
            ...(entry.allCategoryIds || []),
            ...((entry.categories || []).map((category) =>
              typeof category === "string" ? category : categoryIdOf(category)
            ))
          ])
        ].filter(Boolean);

        if (productId) mapping.set(String(productId), categoryIds);
      });
    } catch (error) {
      console.warn("Product-category mapping could not be loaded.", error);
    }
  }

  return mapping;
}

function optionChoiceMap(variant = {}) {
  const candidates = [
    variant.optionChoiceNames,
    variant.choices,
    variant.options,
    variant.variantChoices,
    variant.optionChoices
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (Array.isArray(candidate)) {
      const output = {};
      candidate.forEach((choice) => {
        const name = text(
          firstDefined(
            choice.optionName,
            choice.option?.name,
            choice.name,
            choice.key
          )
        );
        const value = text(
          firstDefined(
            choice.choiceName,
            choice.choice?.name,
            choice.value,
            choice.label
          )
        );
        if (name && value) output[name] = value;
      });
      if (Object.keys(output).length) return output;
    }

    if (typeof candidate === "object") {
      const output = {};
      Object.entries(candidate).forEach(([name, value]) => {
        output[name] = text(value);
      });
      if (Object.keys(output).length) return output;
    }
  }

  return {};
}

function sameChoices(left = {}, right = {}) {
  const leftEntries = Object.entries(left).map(([key, value]) => [
    String(key).trim().toLowerCase(),
    String(value).trim().toLowerCase()
  ]);
  const rightMap = new Map(
    Object.entries(right).map(([key, value]) => [
      String(key).trim().toLowerCase(),
      String(value).trim().toLowerCase()
    ])
  );

  return (
    leftEntries.length > 0 &&
    leftEntries.every(([key, value]) => rightMap.get(key) === value)
  );
}

export const listStorefrontProducts = webMethod(
  Permissions.Anyone,
  async ({ limit = MAX_PUBLIC_PRODUCTS } = {}) => {
    const safeLimit = Math.min(
      MAX_PUBLIC_PRODUCTS,
      Math.max(1, Number(limit) || MAX_PUBLIC_PRODUCTS)
    );

    const [queriedProducts, rawCategories] = await Promise.all([
      queryVisibleProducts(safeLimit),
      queryVisibleCategories()
    ]);
    const rawProducts = await hydrateMissingProductMedia(queriedProducts);

    const rawCategoryMap = new Map(
      rawCategories.map((category) => [categoryIdOf(category), category])
    );
    const normalizedCategories = rawCategories
      .map((category) => normalizeCategory(category, rawCategoryMap))
      .filter((category) => category.id && category.name);
    const categoryMap = new Map(
      normalizedCategories.map((category) => [category.id, category])
    );

    const categoryMapping = await mapCategoriesToProducts(rawProducts);
    const normalizedProducts = rawProducts
      .map((product) => {
        const productId = text(
          firstDefined(product.id, product._id, product.productId)
        );
        return normalizeProduct(
          product,
          categoryMapping.get(productId) || [],
          categoryMap
        );
      })
      .filter((product) => product.id && product.name);

    return {
      products: normalizedProducts,
      categories: normalizedCategories,
      banners: [],
      travelCards: [],
      meta: {
        catalogVersion: "V3",
        productCount: normalizedProducts.length,
        categoryCount: normalizedCategories.length,
        productsWithImages: normalizedProducts.filter((product) => product.imageUrl).length,
        productsWithoutImages: normalizedProducts.filter((product) => !product.imageUrl).length,
        generatedAt: new Date().toISOString()
      }
    };
  }
);

export const resolveStoreVariant = webMethod(
  Permissions.Anyone,
  async ({ productId, choices = {} } = {}) => {
    if (!productId) {
      throw new Error("Missing productId.");
    }

    if (!choices || !Object.keys(choices).length) {
      return { variantId: "" };
    }

    const product = await productsV3.getProduct(String(productId), {
      fields: ["VARIANT_OPTION_CHOICE_NAMES", "CURRENCY"]
    });

    const variants =
      product?.variantsInfo?.variants ||
      product?.variants ||
      product?.product?.variantsInfo?.variants ||
      product?.product?.variants ||
      [];

    const match = variants.find((variant) =>
      sameChoices(choices, optionChoiceMap(variant))
    );

    if (!match) {
      throw new Error(
        "The selected product option combination is not available."
      );
    }

    const variantId = text(
      firstDefined(match.id, match._id, match.variantId)
    );

    if (!variantId) {
      throw new Error("The selected product variant could not be identified.");
    }

    return {
      variantId,
      inStock:
        match.inStock !== false &&
        !["OUT_OF_STOCK", "SOLD_OUT", "UNAVAILABLE"].includes(
          text(match.inventoryStatus).toUpperCase()
        )
    };
  }
);
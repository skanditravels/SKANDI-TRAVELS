import {
  Permissions,
  webMethod
} from "wix-web-module";

import {
  currentCartV2,
  cartV2,
  deliveryProfile
} from "@wix/ecom";

const BASIC_SHIPPING_APP_ID =
  "45c44b27-ca7b-4891-8c0d-1747d588b835";

const MAX_QUANTITY = 99;


/* ==========================================================================
   HELPERS
   ========================================================================== */

function cleanText(value, maxLength = 1000) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function money(value = {}, currencyCode = "USD") {
  if (value === null || value === undefined) {
    return {
      amount: 0,
      currency: currencyCode,
      formatted: ""
    };
  }

  const amount =
    Number(
      value.amount ??
      value.convertedAmount ??
      0
    );

  const safeAmount =
    Number.isFinite(amount)
      ? amount
      : 0;

  return {
    amount:
      safeAmount,

    currency:
      cleanText(
        value.currency ||
        value.currencyCode ||
        currencyCode,
        8
      ) ||
      currencyCode,

    formatted:
      cleanText(
        value.formattedAmount ||
        value.formattedConvertedAmount ||
        value.formatted ||
        "",
        60
      ) ||
      `$${safeAmount.toFixed(2)}`
  };
}

function translatedText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.translated ||
    value.original ||
    value.name ||
    fallback
  );
}

function normalizeSubdivision(country, subdivision) {
  const c =
    cleanText(country, 2)
      .toUpperCase();

  const raw =
    cleanText(subdivision, 50)
      .toUpperCase();

  if (!raw) {
    return "";
  }

  if (raw.includes("-")) {
    return raw;
  }

  if (c && raw.length <= 3) {
    return `${c}-${raw}`;
  }

  return raw;
}

function normalizeAddress(address = {}) {
  const country =
    cleanText(
      address.country,
      2
    )
      .toUpperCase();

  return {
    country,

    subdivision:
      normalizeSubdivision(
        country,
        address.subdivision
      ),

    city:
      cleanText(
        address.city,
        50
      ),

    postalCode:
      cleanText(
        address.postalCode,
        50
      ),

    addressLine:
      cleanText(
        address.addressLine,
        150
      ),

    addressLine2:
      cleanText(
        address.addressLine2,
        100
      )
  };
}

function normalizeCustomer(customer = {}) {
  return {
    firstName:
      cleanText(
        customer.firstName,
        100
      ),

    lastName:
      cleanText(
        customer.lastName,
        100
      ),

    email:
      cleanText(
        customer.email,
        254
      ),

    phone:
      cleanText(
        customer.phone,
        50
      )
  };
}


/* ==========================================================================
   CART NORMALIZATION
   ========================================================================== */

function descriptionLines(lines = []) {
  if (!Array.isArray(lines)) {
    return [];
  }

  return lines
    .map(
      (line) => {
        const name =
          translatedText(
            line?.name
          );

        const value =
          translatedText(
            line?.value
          );

        if (name && value) {
          return `${name}: ${value}`;
        }

        return (
          name ||
          value ||
          ""
        );
      }
    )
    .filter(Boolean);
}

function normalizeCart(cart = {}) {
  const currency =
    cleanText(
      cart
        ?.businessInfo
        ?.currencyCode ||
      cart
        ?.paymentInfo
        ?.currencyCode ||
      "USD",
      8
    ) ||
    "USD";

  const lineItems =
    Array.isArray(
      cart.lineItems
    )
      ? cart.lineItems
      : [];

  return {
    id:
      cart._id ||
      cart.id ||
      "",

    revision:
      cleanText(
        cart.revision,
        50
      ),

    orderPlaced:
      cart.orderPlaced === true,

    orderId:
      cart.orderId ||
      "",

    currency,

    customer: {
      firstName:
        cleanText(
          cart
            ?.customerInfo
            ?.firstName,
          100
        ),

      lastName:
        cleanText(
          cart
            ?.customerInfo
            ?.lastName,
          100
        ),

      email:
        cleanText(
          cart
            ?.customerInfo
            ?.email,
          254
        ),

      phone:
        cleanText(
          cart
            ?.customerInfo
            ?.phone,
          50
        )
    },

    address:
      normalizeAddress(
        cart
          ?.deliveryInfo
          ?.address ||
        {}
      ),

    selectedDeliveryMethod:
      cart
        ?.deliveryInfo
        ?.method
        ? {
            code:
              cleanText(
                cart
                  .deliveryInfo
                  .method
                  .code,
                100
              ),

            appId:
              cleanText(
                cart
                  .deliveryInfo
                  .method
                  .appId,
                80
              ),

            title:
              translatedText(
                cart
                  .deliveryInfo
                  .method
                  .title,
                "Delivery"
              ),

            pickup:
              cart
                .deliveryInfo
                .method
                .pickup === true
          }
        : null,

    note:
      cleanText(
        cart.note,
        1000
      ),

    coupons:
      Array.isArray(
        cart.coupons
      )
        ? cart.coupons.map(
            (coupon) => ({
              id:
                coupon._id ||
                coupon.id ||
                "",

              code:
                cleanText(
                  coupon.code,
                  50
                )
            })
          )
        : [],

    subtotal:
      money(
        cart.subtotal,
        currency
      ),

    lineItems:
      lineItems.map(
        (item) => {
          const source =
            item.source ||
            {};

          const reference =
            source.catalogReference ||
            {};

          const attributes =
            item.attributes ||
            {};

          const quantityInfo =
            item.quantityInfo ||
            {};

          const pricing =
            item.pricing ||
            {};

          return {
            id:
              item._id ||
              item.id ||
              "",

            productId:
              reference.catalogItemId ||
              source.rootCatalogItemId ||
              "",

            variantId:
              reference
                ?.options
                ?.variantId ||
              "",

            name:
              translatedText(
                item.name,
                "Product"
              ),

            imageUrl:
              attributes
                ?.image
                ?.url ||
              attributes
                ?.image
                ?.src ||
              "",

            url:
              attributes
                ?.url
                ?.url ||
              attributes
                ?.url
                ?.relativePath ||
              "",

            descriptionLines:
              descriptionLines(
                attributes
                  .descriptionLines
              ),

            sku:
              cleanText(
                attributes
                  ?.physicalProperties
                  ?.sku,
                100
              ),

            quantity:
              Number(
                quantityInfo.requestedQuantity ??
                quantityInfo.confirmedQuantity ??
                1
              ),

            confirmedQuantity:
              Number(
                quantityInfo.confirmedQuantity ??
                quantityInfo.requestedQuantity ??
                1
              ),

            availableQuantity:
              quantityInfo.availableQuantity ??
              null,

            fixedQuantity:
              quantityInfo.fixedQuantity === true,

            status:
              cleanText(
                item.status,
                60
              ),

            unitPrice:
              money(
                pricing.unitPrice,
                currency
              ),

            totalPrice:
              money(
                pricing.totalPrice,
                currency
              )
          };
        }
      )
  };
}

function normalizeViolations(violations = []) {
  if (!Array.isArray(violations)) {
    return [];
  }

  return violations.map(
    (violation) => ({
      scope:
        cleanText(
          violation.scope,
          80
        ),

      code:
        cleanText(
          violation.code,
          120
        ),

      severity:
        cleanText(
          violation.severity,
          30
        ),

      description:
        cleanText(
          violation.description ||
          "Please review your checkout details.",
          1000
        )
    })
  );
}

function normalizeSummary(summary = {}, currencyCode = "USD") {
  const price =
    summary.priceSummary ||
    {};

  const payment =
    summary.paymentSummary ||
    {};

  return {
    priceVerificationToken:
      cleanText(
        summary.priceVerificationToken,
        2048
      ),

    subtotal:
      money(
        price.subtotal,
        currencyCode
      ),

    discount:
      money(
        price.discount,
        currencyCode
      ),

    delivery:
      money(
        price.delivery,
        currencyCode
      ),

    additionalFees:
      money(
        price.additionalFees,
        currencyCode
      ),

    tax:
      money(
        price.tax,
        currencyCode
      ),

    total:
      money(
        price.total,
        currencyCode
      ),

    payNow:
      money(
        payment.payNow,
        currencyCode
      ),

    payLater:
      money(
        payment.payLater,
        currencyCode
      ),

    totalAfterGiftCards:
      money(
        payment.totalAfterGiftCards,
        currencyCode
      ),

    requiresPayment:
      payment
        .requiresPaymentAfterGiftCard !==
        false,

    violations:
      normalizeViolations(
        summary.violations
      )
  };
}


/* ==========================================================================
   DELIVERY METHODS
   ========================================================================== */

function destinationMatches(destination = {}, address = {}) {
  const country =
    cleanText(
      address.country,
      2
    )
      .toUpperCase();

  const subdivision =
    normalizeSubdivision(
      country,
      address.subdivision
    );

  const targetCountry =
    cleanText(
      destination.countryCode,
      2
    )
      .toUpperCase();

  if (
    !country ||
    !targetCountry ||
    country !== targetCountry
  ) {
    return false;
  }

  const subdivisions =
    Array.isArray(
      destination.subdivisions
    )
      ? destination.subdivisions
          .map(
            (value) =>
              cleanText(
                value,
                50
              )
                .toUpperCase()
          )
          .filter(Boolean)
      : [];

  if (!subdivisions.length) {
    return true;
  }

  return (
    subdivision &&
    subdivisions.includes(
      subdivision
    )
  );
}

function matchingRegions(profile = {}, address = {}) {
  const regions =
    Array.isArray(
      profile.deliveryRegions
    )
      ? profile.deliveryRegions
          .filter(
            (region) =>
              region.active !== false
          )
      : [];

  if (!address.country) {
    return [];
  }

  const explicit =
    regions.filter(
      (region) => {
        const destinations =
          Array.isArray(
            region.destinations
          )
            ? region.destinations
            : [];

        return (
          destinations.length > 0 &&
          destinations.some(
            (destination) =>
              destinationMatches(
                destination,
                address
              )
          )
        );
      }
    );

  if (explicit.length) {
    return explicit;
  }

  /*
   * Empty destinations means Rest of World.
   */
  return regions.filter(
    (region) =>
      !Array.isArray(
        region.destinations
      ) ||
      region.destinations.length === 0
  );
}

async function getDeliveryMethods(address = {}) {
  const normalizedAddress =
    normalizeAddress(
      address
    );

  if (!normalizedAddress.country) {
    return [];
  }

  const profilesResponse =
    await deliveryProfile
      .queryDeliveryProfiles({
        cursorPaging: {
          limit: 100
        }
      });

  const profiles =
    Array.isArray(
      profilesResponse
        ?.deliveryProfiles
    )
      ? profilesResponse
          .deliveryProfiles
      : [];

  const methods = [];

  for (const profile of profiles) {
    const regions =
      matchingRegions(
        profile,
        normalizedAddress
      );

    for (const region of regions) {
      const regionCarriers =
        Array.isArray(
          region.deliveryCarriers
        )
          ? region.deliveryCarriers
          : [];

      const appIds =
        [
          ...new Set(
            regionCarriers
              .map(
                (carrier) =>
                  cleanText(
                    carrier.appId,
                    80
                  )
              )
              .filter(Boolean)
          )
        ];

      /*
       * Live SKANDI currently uses Wix Basic Shipping.
       */
      if (!appIds.length) {
        appIds.push(
          BASIC_SHIPPING_APP_ID
        );
      }

      let carriersResponse;

      try {
        carriersResponse =
          await deliveryProfile
            .listDeliveryCarriers(
              profile.id ||
              profile._id,

              {
                appIds
              }
            );
      } catch (error) {
        console.warn(
          "[SKANDI Checkout] Carrier details unavailable.",
          error
        );
        continue;
      }

      const carrierResults =
        Array.isArray(
          carriersResponse
            ?.results
        )
          ? carriersResponse.results
          : [];

      carrierResults.forEach(
        (carrierResult) => {
          const appId =
            carrierResult
              ?.deliveryCarrierMetadata
              ?._id ||
            carrierResult
              ?.deliveryCarrierMetadata
              ?.id ||
            carrierResult
              ?.deliveryCarrierDetails
              ?._id ||
            carrierResult
              ?.deliveryCarrierDetails
              ?.id ||
            "";

          const regionalSettings =
            Array.isArray(
              carrierResult
                ?.deliveryCarrierRegionalSettings
            )
              ? carrierResult
                  .deliveryCarrierRegionalSettings
              : [];

          regionalSettings
            .filter(
              (setting) =>
                String(
                  setting.deliveryRegionId ||
                  ""
                ) ===
                String(
                  region.id ||
                  region._id ||
                  ""
                )
            )
            .forEach(
              (setting) => {
                const tables =
                  Array.isArray(
                    setting.dashboardTables
                  )
                    ? setting.dashboardTables
                    : [];

                tables.forEach(
                  (table) => {
                    const rows =
                      Array.isArray(
                        table.rows
                      )
                        ? table.rows
                        : [];

                    rows
                      .filter(
                        (row) =>
                          row.active !== false
                      )
                      .forEach(
                        (row) => {
                          const code =
                            cleanText(
                              row.key,
                              100
                            );

                          if (!code) {
                            return;
                          }

                          methods.push({
                            code,

                            appId:
                              cleanText(
                                appId,
                                80
                              ),

                            title:
                              cleanText(
                                row
                                  ?.data
                                  ?.name ||
                                carrierResult
                                  ?.deliveryCarrierDetails
                                  ?.displayName ||
                                "Delivery",
                                200
                              ),

                            priceLabel:
                              cleanText(
                                row
                                  ?.data
                                  ?.rate ||
                                "",
                                80
                              ),

                            regionId:
                              region.id ||
                              region._id ||
                              "",

                            regionName:
                              cleanText(
                                region.name,
                                200
                              ),

                            pickup:
                              false
                          });
                        }
                      );
                  }
                );
              }
            );
        }
      );
    }
  }

  const unique =
    new Map();

  methods.forEach(
    (method) => {
      const key =
        `${method.appId}|${method.code}`;

      if (!unique.has(key)) {
        unique.set(
          key,
          method
        );
      }
    }
  );

  return [
    ...unique.values()
  ];
}


/* ==========================================================================
   CHECKOUT STATE
   ========================================================================== */

async function getCurrentCartSafe() {
  try {
    const response =
      await currentCartV2
        .getCurrentCart();

    return (
      response?.cart ||
      response ||
      null
    );
  } catch (_) {
    return null;
  }
}

async function calculateCurrentCartSafe() {
  try {
    return await currentCartV2
      .calculateCurrentCart({
        refreshCart: true
      });
  } catch (error) {
    console.warn(
      "[SKANDI Checkout] Cart calculation incomplete.",
      error
    );

    return null;
  }
}

async function buildCheckoutState(preferredAddress = null) {
  const current =
    await getCurrentCartSafe();

  if (
    !current ||
    !Array.isArray(
      current.lineItems
    ) ||
    !current.lineItems.length
  ) {
    return {
      ok: true,
      empty: true,
      cart: {
        lineItems: []
      },
      summary: null,
      deliveryMethods: [],
      blockingViolations: []
    };
  }

  const calculated =
    await calculateCurrentCartSafe();

  const rawCart =
    calculated?.cart ||
    current;

  const normalizedCart =
    normalizeCart(
      rawCart
    );

  const summary =
    calculated?.summary
      ? normalizeSummary(
          calculated.summary,
          normalizedCart.currency
        )
      : {
          subtotal:
            normalizedCart.subtotal,
          discount:
            money({}, normalizedCart.currency),
          delivery:
            money({}, normalizedCart.currency),
          additionalFees:
            money({}, normalizedCart.currency),
          tax:
            money({}, normalizedCart.currency),
          total:
            normalizedCart.subtotal,
          payNow:
            normalizedCart.subtotal,
          payLater:
            money({}, normalizedCart.currency),
          totalAfterGiftCards:
            normalizedCart.subtotal,
          requiresPayment:
            true,
          priceVerificationToken:
            "",
          violations:
            []
        };

  const address =
    preferredAddress
      ? normalizeAddress(
          preferredAddress
        )
      : normalizedCart.address;

  let deliveryMethods = [];

  try {
    deliveryMethods =
      await getDeliveryMethods(
        address
      );
  } catch (error) {
    console.warn(
      "[SKANDI Checkout] Delivery methods unavailable.",
      error
    );
  }

  const blockingViolations =
    (
      summary.violations ||
      []
    ).filter(
      (violation) =>
        String(
          violation.severity
        )
          .toUpperCase() ===
        "ERROR"
    );

  return {
    ok: true,
    empty: false,
    cart:
      normalizedCart,
    summary,
    deliveryMethods,
    blockingViolations
  };
}


/* ==========================================================================
   WEB METHODS
   ========================================================================== */

export const getStoreCheckoutBootstrap =
  webMethod(
    Permissions.Anyone,

    async function () {
      return buildCheckoutState();
    }
  );


export const saveStoreCheckoutDetails =
  webMethod(
    Permissions.Anyone,

    async function ({
      customer = {},
      address = {},
      note = ""
    } = {}) {
      const cleanCustomer =
        normalizeCustomer(
          customer
        );

      const cleanAddress =
        normalizeAddress(
          address
        );

      await currentCartV2
        .updateCurrentCart({
          customerInfo:
            cleanCustomer,

          deliveryInfo: {
            address:
              cleanAddress
          },

          note:
            cleanText(
              note,
              1000
            )
        });

      return buildCheckoutState(
        cleanAddress
      );
    }
  );


export const setStoreDeliveryMethod =
  webMethod(
    Permissions.Anyone,

    async function ({
      code,
      appId
    } = {}) {
      const cleanCode =
        cleanText(
          code,
          100
        );

      const cleanAppId =
        cleanText(
          appId,
          80
        );

      if (!cleanCode) {
        throw new Error(
          "Choose a delivery method."
        );
      }

      await currentCartV2
        .setDeliveryMethodForCurrentCart({
          code:
            cleanCode,

          ...(cleanAppId
            ? {
                appId:
                  cleanAppId
              }
            : {})
        });

      return buildCheckoutState();
    }
  );


export const applyStoreCoupon =
  webMethod(
    Permissions.Anyone,

    async function ({
      code
    } = {}) {
      const cleanCode =
        cleanText(
          code,
          50
        );

      if (!cleanCode) {
        throw new Error(
          "Enter a promo code."
        );
      }

      await currentCartV2
        .addCouponToCurrentCart({
          code:
            cleanCode
        });

      return buildCheckoutState();
    }
  );


export const removeStoreCoupon =
  webMethod(
    Permissions.Anyone,

    async function ({
      couponId
    } = {}) {
      const cleanId =
        cleanText(
          couponId,
          80
        );

      if (!cleanId) {
        throw new Error(
          "Coupon ID is required."
        );
      }

      await currentCartV2
        .removeCouponFromCurrentCart(
          cleanId
        );

      return buildCheckoutState();
    }
  );


export const updateStoreCartLineItem =
  webMethod(
    Permissions.Anyone,

    async function ({
      lineItemId,
      quantity
    } = {}) {
      const cleanId =
        cleanText(
          lineItemId,
          80
        );

      const safeQuantity =
        Math.max(
          1,
          Math.min(
            MAX_QUANTITY,
            Number(quantity) ||
            1
          )
        );

      if (!cleanId) {
        throw new Error(
          "Line item ID is required."
        );
      }

      await currentCartV2
        .updateLineItemsInCurrentCart({
          lineItems: [
            {
              lineItemId:
                cleanId,

              quantity: {
                newQuantity:
                  safeQuantity
              }
            }
          ]
        });

      return buildCheckoutState();
    }
  );


export const removeStoreCartLineItem =
  webMethod(
    Permissions.Anyone,

    async function ({
      lineItemId
    } = {}) {
      const cleanId =
        cleanText(
          lineItemId,
          80
        );

      if (!cleanId) {
        throw new Error(
          "Line item ID is required."
        );
      }

      await currentCartV2
        .removeLineItemsFromCurrentCart([
          cleanId
        ]);

      return buildCheckoutState();
    }
  );


export const prepareStorePayment =
  webMethod(
    Permissions.Anyone,

    async function () {
      const calculated =
        await currentCartV2
          .calculateCurrentCart({
            refreshCart: true
          });

      const cart =
        calculated?.cart;

      const summary =
        calculated?.summary;

      if (!cart || !summary) {
        throw new Error(
          "The cart could not be calculated."
        );
      }

      const normalizedCart =
        normalizeCart(
          cart
        );

      const normalizedSummary =
        normalizeSummary(
          summary,
          normalizedCart.currency
        );

      const blocking =
        normalizedSummary
          .violations
          .filter(
            (violation) =>
              String(
                violation.severity
              )
                .toUpperCase() ===
              "ERROR"
          );

      if (blocking.length) {
        return {
          ok: false,

          stage:
            "validation",

          message:
            blocking[0]
              ?.description ||
            "Please review your checkout details.",

          state:
            await buildCheckoutState(),

          violations:
            blocking
        };
      }

      const cartId =
        cart._id ||
        cart.id ||
        "";

      const token =
        summary
          .priceVerificationToken ||
        "";

      if (!cartId || !token) {
        throw new Error(
          "The cart is missing its checkout verification token."
        );
      }

      const result =
        await cartV2
          .placeOrder(
            cartId,
            {
              priceVerificationToken:
                token
            }
          );

      console.log(
        "[SKANDI Checkout] Order placed.",
        {
          orderId:
            result?.orderId,
          completed:
            result?.completed,
          hasPaymentGatewayOrderId:
            Boolean(
              result
                ?.paymentGatewayOrderId
            )
        }
      );

      return {
        ok: true,

        orderId:
          result?.orderId ||
          "",

        paymentGatewayOrderId:
          result
            ?.paymentGatewayOrderId ||
          "",

        completed:
          result?.completed ===
          true,

        requiresPayment:
          result?.completed !==
            true &&
          Boolean(
            result
              ?.paymentGatewayOrderId
          )
      };
    }
  );

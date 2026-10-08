// V12 Store checkout owner. Wix current-cart identity remains authoritative.


import {
  currentCartV2,
  cartV2,
  deliveryProfile,
  orders
} from "@wix/ecom";

import { auth } from "@wix/essentials";
const queryDeliveryProfiles = auth.elevate(deliveryProfile.queryDeliveryProfiles);
const listDeliveryCarriers = auth.elevate(deliveryProfile.listDeliveryCarriers);
const placingOrders = new Map();

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
      new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(safeAmount)
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
        address.addressLine || [address.streetAddress?.number, address.streetAddress?.name].filter(Boolean).join(" "),
        150
      ),

    addressLine2:
      cleanText(
        address.addressLine2,
        100
      )
  };
}

function cartAddress(address){
  const {addressLine,...rest}=address;
  return {...rest,streetAddress:{name:addressLine}};
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
    await queryDeliveryProfiles({
        paging: { limit: 100, offset: 0 }
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
          await listDeliveryCarriers(
              profile.id ||
              profile._id,

              {
                appIds
              }
            );
      } catch (error) {
        throw new Error("Delivery options could not be loaded. Please try again.");
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
  } catch (error) {
    if (Number(error?.httpStatus || error?.status || error?.response?.status) === 404 || error?.details?.applicationError?.code === "CART_NOT_FOUND") return null;
    throw new Error("Your shopping bag could not be loaded. Please try again.");
  }
}

async function calculateCurrentCartSafe() {
  const result = await currentCartV2.calculateCurrentCart({ refreshCart: true });
  if (!result?.cart || !result?.summary) throw new Error("Your order total could not be calculated. Please try again.");
  return result;
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

  if (current.orderPlaced === true) return { ok: true, empty: false, orderPlaced: true, orderId: current.orderId || "", cart: normalizeCart(current), summary: null, deliveryMethods: [], blockingViolations: [] };

  const calculated =
    await calculateCurrentCartSafe();

  const rawCart =
    calculated?.cart ||
    current;

  const normalizedCart =
    normalizeCart(
      rawCart
    );

  const summary = normalizeSummary(calculated.summary, normalizedCart.currency);

  const address =
    preferredAddress
      ? normalizeAddress(
          preferredAddress
        )
      : normalizedCart.address;

  let deliveryMethods = [];
  let deliveryError = "";
  try { deliveryMethods = await getDeliveryMethods(address); }
  catch (_) { deliveryError = "Delivery options could not be loaded. Update your delivery options to retry."; }

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
    deliveryError,
    blockingViolations
  };
}


/* ==========================================================================
   WEB METHODS
   ========================================================================== */

export async function getStoreCheckoutBootstrapCore() {
      return buildCheckoutState();
    }


export async function saveStoreCheckoutDetailsCore({
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

          deliveryInfo: { address: cartAddress(cleanAddress) },
          paymentInfo: { billingAddress: cartAddress(cleanAddress), billingContact: { firstName: cleanCustomer.firstName, lastName: cleanCustomer.lastName, phone: cleanCustomer.phone } },

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


export async function setStoreDeliveryMethodCore({
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


export async function applyStoreCouponCore({
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


export async function removeStoreCouponCore({
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


export async function updateStoreCartLineItemCore({
      lineItemId,
      quantity
    } = {}) {
      const cleanId =
        cleanText(
          lineItemId,
          80
        );

      const safeQuantity = Number(quantity);
      if (!Number.isInteger(safeQuantity) || safeQuantity < 1 || safeQuantity > MAX_QUANTITY) throw new Error("Quantity must be a whole number from 1 to 99.");

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


export async function removeStoreCartLineItemCore({
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


export async function prepareStorePaymentCore({ priceVerificationToken = "" } = {}) {
  const current = await getCurrentCartSafe();
  const cartId = current?._id || current?.id || "";
  if (!cartId || !current.lineItems?.length) throw new Error("Your shopping bag is empty.");
  if (current.orderPlaced === true) {
    if (!current.orderId) throw new Error("This cart has already been submitted. Check My Orders before trying again.");
    return { ok: true, orderId: current.orderId, alreadyPlaced: true, completed: false };
  }
  if (placingOrders.has(cartId)) return placingOrders.get(cartId);
  if (!priceVerificationToken) throw new Error("Refresh and review your order total before placing the order.");
  const pending = (async () => {
    const calculated = await calculateCurrentCartSafe();
    const normalizedCart = normalizeCart(calculated.cart);
    const summary = normalizeSummary(calculated.summary, normalizedCart.currency);
    const blocking = summary.violations.filter(v => v.severity.toUpperCase() === "ERROR");
    if (blocking.length) return { ok: false, stage: "validation", message: blocking[0].description, state: await buildCheckoutState() };
    // Wix recalculates and rejects the supplied token if the displayed prices changed.
    const result = await cartV2.placeOrder(cartId, { priceVerificationToken: cleanText(priceVerificationToken, 3000) });
    if (!result?.orderId) throw new Error("Order submission could not be confirmed. Check My Orders before trying again.");
    if (!result.completed && !result.paymentGatewayOrderId) return { ok: true, orderId: result.orderId, completed: false, requiresPayment: false, submitted: true };
    return { ok: true, orderId: result.orderId, paymentGatewayOrderId: result.paymentGatewayOrderId || "", completed: result.completed === true, requiresPayment: Boolean(result.paymentGatewayOrderId) && result.completed !== true };
  })().finally(() => placingOrders.delete(cartId));
  placingOrders.set(cartId, pending);
  return pending;
}

export async function getStoreOrderConfirmationCore({ orderId } = {}) {
  const id = cleanText(orderId, 100);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("A valid order reference is required.");
  // Never elevate: Wix only returns orders placed by this member or visitor.
  const order = await orders.getOrder(id);
  if (!order || (order._id || order.id) !== id) throw new Error("This order is unavailable in your current session.");
  const currency = cleanText(order.currency, 8) || "USD";
  return {
    ok: true, verified: true, orderId: id, orderNumber: cleanText(order.number, 40),
    status: cleanText(order.status, 40), paymentStatus: cleanText(order.paymentStatus, 40) || "UNKNOWN",
    fulfillmentStatus: cleanText(order.fulfillmentStatus, 40) || "NOT_FULFILLED",
    generatedAt: new Date().toISOString(), createdAt: order._createdDate || "",
    total: money(order.priceSummary?.total, currency),
    items: (Array.isArray(order.lineItems) ? order.lineItems : []).map(item => ({
      id: item._id, name: translatedText(item.productName, "Product"), quantity: Number(item.quantity || 0),
      total: money(item.totalPriceAfterTax || item.totalPriceBeforeTax, currency)
    }))
  };
}

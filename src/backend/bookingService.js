import {
  searchDuffelOffersCore,
  refreshDuffelOfferCore,
  priceDuffelOfferCore,
  getDuffelSeatMapsCore,
  prepareDuffelPaymentCore,
  createDuffelOrderCore,
  getDuffelOrderCore
} from "backend/duffelTravel.web";
import {
  captureStripePaymentIntent
} from "backend/duffelClient";
import {
  addCartItem,
  createOwnedCart,
  getOwnedCart,
  getOwnedCartByOffer,
  recordPaymentEventOnce,
  transitionOwnedCart,
  updateOwnedCart
} from "backend/booking/cartRepository";
import {
  assertOfferMatchesSearch,
  bookingError,
  buildDuffelPassengers,
  combineServiceSelections,
  mapOfferForCart,
  mapOfferForHome,
  toDuffelOfferSearch,
  toPublicCart
} from "backend/booking/bookingMapper";
import {
  decryptBookingData,
  encryptBookingData
} from "backend/booking/securePayload";

export async function searchLiveFlightOffers(input) {
  const normalized = toDuffelOfferSearch(input?.search);
  const result = await searchDuffelOffersCore(normalized.coreRequest);
  const items = (result.offers || [])
    .filter((offer) => !offer.isExpired)
    .sort(
      (left, right) =>
        Number(left.totalAmount || 0) -
        Number(right.totalAmount || 0)
    )
    .slice(0, 30)
    .map((offer) =>
      mapOfferForHome(offer, normalized.searchContext)
    );
  const response = {
    provider: "Duffel",
    offerRequestId: result.offerRequestId,
    items,
    meta: {
      live: true,
      resultCount: items.length,
      searchedAt: new Date().toISOString()
    }
  };

  return response;
}

export async function createFlightCart(context, input) {
  const offerId = assertOfferId(input?.offer?.id);
  const existing = await getOwnedCartByOffer(context, offerId);
  if (existing?.cart_id) {
    return {
      cartId: existing.cart_id,
      step: resumeStepForStatus(existing.status),
      recoveredExistingCart: true
    };
  }

  const normalized = toDuffelOfferSearch(
    input?.search ||
    input?.offer?.searchContext
  );
  const refreshed = await refreshDuffelOfferCore({ offerId });
  const offer = refreshed.offer;

  assertOfferMatchesSearch(offer, normalized.searchContext);
  const selectedOffer = mapOfferForCart(offer);
  const payload = {
    version: 2,
    provider: "Duffel",
    productType: "flight",
    searchContext: normalized.searchContext,
    selectedOffer,
    extras: [],
    seatSelections: {},
    transfer: null,
    secureTravelers: null,
    order: null,
    flow: {
      currentStep: "offer",
      createdAt: new Date().toISOString()
    }
  };
  let row;
  try {
    row = await createOwnedCart(context, {
      status: "Open",
      currency: offer.totalCurrency,
      subtotal: decimal(offer.totalAmount),
      taxes: decimal(offer.taxAmount),
      total: decimal(offer.totalAmount),
      selectedOfferId: offer.id,
      expiresAt: offer.expiresAt,
      payload,
      source: "Duffel"
    });
  } catch (error) {
    const retry = await getOwnedCartByOffer(context, offerId);
    if (retry?.cart_id) {
      return {
        cartId: retry.cart_id,
        step: resumeStepForStatus(retry.status),
        recoveredExistingCart: true
      };
    }

    if (
      String(error?.message || "")
        .toLowerCase()
        .includes("selected_offer")
    ) {
      throw bookingError(
        "OFFER_ALREADY_IN_USE",
        "That live offer is already attached to another cart. Search again for a new offer."
      );
    }
    throw error;
  }

  await addCartItem(row.cart_id, {
    itemType: "flight",
    itemId: offer.id,
    title: selectedOffer.routeSummary,
    quantity: 1,
    unitPrice: decimal(offer.totalAmount),
    total: decimal(offer.totalAmount),
    payload: {
      provider: "Duffel",
      owner: offer.owner,
      expiresAt: offer.expiresAt
    }
  });

  return {
    cartId: row.cart_id,
    step: "offer"
  };
}

export async function loadBookingCart(
  context,
  input,
  options = {}
) {
  const row = await requireOwnedCart(context, input?.cartId);
  let sensitive = null;

  if (options.includeTravelers && row.payload?.secureTravelers) {
    sensitive = await decryptBookingData(
      row.payload.secureTravelers
    );
  }

  return {
    row,
    sensitive,
    cart: toPublicCart(row, sensitive)
  };
}

export async function acceptBookingOffer(context, input) {
  if (input?.termsAccepted !== true) {
    throw bookingError(
      "TERMS_REQUIRED",
      "Accept the booking conditions before continuing."
    );
  }

  const loaded = await loadBookingCart(context, input);
  assertCustomerEditable(loaded.row);
  const refreshed = await refreshAndPersistOffer(
    context,
    loaded.row
  );
  const payload = {
    ...refreshed.payload,
    offerTermsAcceptedAt: new Date().toISOString(),
    flow: {
      ...(refreshed.payload?.flow || {}),
      currentStep: "extras"
    }
  };
  const updated = await updateOwnedCart(
    context,
    refreshed.cart_id,
    {
      status: "OfferAccepted",
      payload
    }
  );

  return toPublicCart(updated);
}

export async function loadBookingExtras(context, input) {
  const loaded = await loadBookingCart(context, input);
  assertCustomerEditable(loaded.row);
  const refreshed = await refreshAndPersistOffer(
    context,
    loaded.row
  );
  const offer = refreshed.payload?.selectedOffer || {};
  const items = (offer.availableServices || [])
    .filter((service) => service.type === "baggage")
    .map((service) => ({
      id: service.id,
      serviceId: service.id,
      title: service.label || "Additional baggage",
      description: [
        service.passengerName,
        service.segmentLabel
      ].filter(Boolean).join(" · "),
      price: {
        amount: service.totalAmount,
        currency: service.totalCurrency
      },
      maximumQuantity: service.maximumQuantity || 1
    }));

  return {
    cart: toPublicCart(refreshed),
    items,
    selectedExtras: refreshed.payload?.extras || []
  };
}

export async function storeBookingExtras(context, input) {
  const loaded = await loadBookingCart(context, input);
  assertCustomerEditable(loaded.row);
  const refreshed = await refreshAndPersistOffer(
    context,
    loaded.row
  );
  const available = new Map(
    (refreshed.payload?.selectedOffer?.availableServices || [])
      .filter((service) => service.type === "baggage")
      .map((service) => [service.id, service])
  );
  const requested = Array.isArray(input?.selectedExtras)
    ? input.selectedExtras
    : [];
  const selectedIds = new Set();
  const extras = requested.map((selection) => {
    const id = String(
      selection?.id ||
      selection?.serviceId ||
      ""
    ).trim();
    const service = available.get(id);
    if (!service) {
      throw bookingError(
        "SERVICE_UNAVAILABLE",
        "A selected baggage service is no longer available."
      );
    }
    if (selectedIds.has(id)) {
      throw bookingError(
        "DUPLICATE_SERVICE",
        "The same baggage service cannot be selected twice."
      );
    }
    selectedIds.add(id);

    const quantity = Number(selection?.quantity || 1);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > Number(service.maximumQuantity || 1)
    ) {
      throw bookingError(
        "INVALID_SERVICE_QUANTITY",
        "A selected baggage quantity is invalid."
      );
    }

    return {
      id,
      quantity,
      title: service.label,
      amount: service.totalAmount,
      currency: service.totalCurrency
    };
  });
  const payload = {
    ...refreshed.payload,
    extras,
    flow: {
      ...(refreshed.payload?.flow || {}),
      currentStep: "transfer"
    }
  };

  await updateOwnedCart(context, refreshed.cart_id, {
    status: "ExtrasSaved",
    payload
  });

  return {
    requiresSignatureTransfer: false
  };
}

export async function loadSignatureTransfers(context, input) {
  await loadBookingCart(context, input);
  return {
    options: [],
    meta: {
      message:
        "No live Signature transfer is attached to this flight cart."
    }
  };
}

export async function storeSignatureTransfer(context, input) {
  if (input?.transfer) {
    throw bookingError(
      "TRANSFER_UNAVAILABLE",
      "That transfer is not available for this booking."
    );
  }

  const loaded = await loadBookingCart(context, input);
  assertCustomerEditable(loaded.row);
  const payload = {
    ...loaded.row.payload,
    transfer: null,
    flow: {
      ...(loaded.row.payload?.flow || {}),
      currentStep: "apis"
    }
  };
  await updateOwnedCart(context, loaded.row.cart_id, {
    status: "TravelersPending",
    payload
  });

  return { saved: true };
}

export async function saveBookingTravelers(context, input) {
  const loaded = await loadBookingCart(context, input);
  assertCustomerEditable(loaded.row);
  const offer = loaded.row.payload?.selectedOffer;
  const mapped = buildDuffelPassengers(
    input?.travelers,
    input?.contact,
    offer
  );
  const encrypted = await encryptBookingData(mapped);
  const services = combineServiceSelections(
    loaded.row.payload
  );
  const priced = await priceDuffelOfferCore({
    offerId: loaded.row.selected_offer_id,
    services
  });
  const selectedOffer = mapOfferForCart(priced.offer);
  const payload = {
    ...loaded.row.payload,
    selectedOffer,
    secureTravelers: encrypted,
    travelerCount: mapped.passengers.length,
    flow: {
      ...(loaded.row.payload?.flow || {}),
      currentStep: "seats"
    }
  };

  const updated = await updateOwnedCart(
    context,
    loaded.row.cart_id,
    {
      email: mapped.contact.email,
      status: "TravelersSaved",
      currency: priced.offer.totalCurrency,
      subtotal: decimal(priced.offer.totalAmount),
      taxes: decimal(priced.offer.taxAmount),
      total: decimal(priced.offer.totalAmount),
      expires_at: priced.offer.expiresAt,
      payload
    }
  );

  return {
    cart: toPublicCart(updated),
    repriced: true
  };
}

export async function loadSeatMaps(context, input) {
  const loaded = await loadBookingCart(
    context,
    input,
    { includeTravelers: true }
  );
  if (!loaded.sensitive?.passengers?.length) {
    throw bookingError(
      "TRAVELERS_REQUIRED",
      "Save traveler details before selecting seats."
    );
  }

  const result = await getDuffelSeatMapsCore({
    offerId: loaded.row.selected_offer_id
  });
  const seatMaps = result.seatMaps || [];
  const availableSeatCount = seatMaps.reduce(
    (total, map) =>
      total +
      (map.seats || []).filter(
        (seat) => seat.availableServices?.length
      ).length,
    0
  );

  return {
    unavailable: availableSeatCount === 0,
    reason: availableSeatCount === 0
      ? "The airline did not return selectable seats for this offer."
      : "",
    provider: "Duffel",
    seatMaps,
    travelers: loaded.sensitive.passengers.map(
      (passenger, index) => ({
        id: passenger.id,
        travelerId: passenger.id,
        firstName: passenger.givenName,
        lastName: passenger.familyName,
        label: [
          passenger.givenName,
          passenger.familyName
        ].filter(Boolean).join(" ") || `Traveler ${index + 1}`
      })
    ),
    existingSelections:
      loaded.row.payload?.seatSelections || {}
  };
}

export async function storeSeatSelections(context, input) {
  const loaded = await loadBookingCart(context, input);
  assertCustomerEditable(loaded.row);
  const rawSelections = input?.selections &&
    typeof input.selections === "object"
    ? input.selections
    : {};
  let seatSelections = {};

  if (input?.skipped !== true) {
    const result = await getDuffelSeatMapsCore({
      offerId: loaded.row.selected_offer_id
    });
    const available = buildAvailableSeatServices(
      result.seatMaps || []
    );
    const travelerIds = new Set(
      (loaded.row.payload?.selectedOffer?.passengers || [])
        .map((passenger) => passenger?.id)
        .filter(Boolean)
    );
    const usedPassengerSegments = new Set();
    const usedSeats = new Set();

    for (const [selectionKey, selection] of Object.entries(
      rawSelections
    )) {
      const travelerId = String(
        selection?.travelerId ||
        selectionKey.split(":")[0] ||
        ""
      ).trim();
      const serviceId = String(
        selection?.serviceId ||
        selection?.id ||
        ""
      ).trim();
      if (!travelerIds.has(travelerId)) {
        throw bookingError(
          "SEAT_PASSENGER_MISMATCH",
          "A selected seat belongs to an unknown traveler."
        );
      }
      const candidate = available.get(serviceId);
      if (!candidate) {
        throw bookingError(
          "SEAT_UNAVAILABLE",
          "A selected seat is no longer available."
        );
      }
      if (
        candidate.passengerId &&
        candidate.passengerId !== travelerId
      ) {
        throw bookingError(
          "SEAT_PASSENGER_MISMATCH",
          "A selected seat belongs to a different traveler."
        );
      }

      const assignmentKey = [
        travelerId,
        candidate.segmentId || "segment"
      ].join(":");
      const seatKey = [
        candidate.segmentId || "segment",
        candidate.designator
      ].join(":");
      if (
        usedPassengerSegments.has(assignmentKey) ||
        usedSeats.has(seatKey)
      ) {
        throw bookingError(
          "DUPLICATE_SEAT",
          "Each traveler can have one seat per flight segment."
        );
      }
      usedPassengerSegments.add(assignmentKey);
      usedSeats.add(seatKey);

      seatSelections[selectionKey] = {
        ...candidate,
        travelerId
      };
    }
  }

  const nextPayload = {
    ...loaded.row.payload,
    seatSelections,
    seatsSkipped: input?.skipped === true,
    flow: {
      ...(loaded.row.payload?.flow || {}),
      currentStep: "payment"
    }
  };
  const services = combineServiceSelections(nextPayload);
  const priced = await priceDuffelOfferCore({
    offerId: loaded.row.selected_offer_id,
    services
  });
  nextPayload.selectedOffer = mapOfferForCart(priced.offer);

  const updated = await updateOwnedCart(
    context,
    loaded.row.cart_id,
    {
      status: "PaymentReady",
      currency: priced.offer.totalCurrency,
      subtotal: decimal(priced.offer.totalAmount),
      taxes: decimal(priced.offer.taxAmount),
      total: decimal(priced.offer.totalAmount),
      expires_at: priced.offer.expiresAt,
      payload: nextPayload
    }
  );

  return {
    cart: toPublicCart(updated)
  };
}

export async function prepareBookingPayment(context, input) {
  const loaded = await loadBookingCart(context, input);
  if (!loaded.row.payload?.secureTravelers) {
    throw bookingError(
      "TRAVELERS_REQUIRED",
      "Save traveler details before payment."
    );
  }
  if (loaded.row.status === "Confirmed") {
    throw bookingError(
      "BOOKING_ALREADY_CONFIRMED",
      "This booking is already confirmed."
    );
  }
  if (
    loaded.row.status === "Committing" ||
    loaded.row.status === "ReconciliationRequired"
  ) {
    throw bookingError(
      "BOOKING_RECONCILIATION_REQUIRED",
      "This booking is already being committed or reconciled. Do not submit another payment; contact SKANDI with your cart ID."
    );
  }

  const services = combineServiceSelections(
    loaded.row.payload
  );
  const result = await prepareDuffelPaymentCore({
    offerId: loaded.row.selected_offer_id,
    services,
    idempotencyContext: loaded.row.cart_id,
    manualCapture: true
  });
  const selectedOffer = mapOfferForCart(result.offer);
  const payload = {
    ...loaded.row.payload,
    selectedOffer,
    payment: {
      paymentIntentId: result.payment.paymentIntentId,
      amount: result.payment.amount,
      currency: result.payment.currency,
      status: result.payment.status,
      preparedAt: new Date().toISOString()
    },
    flow: {
      ...(loaded.row.payload?.flow || {}),
      currentStep: "payment"
    }
  };
  const updated = await updateOwnedCart(
    context,
    loaded.row.cart_id,
    {
      status: "PaymentPending",
      currency: result.offer.totalCurrency,
      subtotal: decimal(result.offer.totalAmount),
      taxes: decimal(result.offer.taxAmount),
      total: decimal(result.offer.totalAmount),
      expires_at: result.offer.expiresAt,
      payload
    }
  );

  return {
    cart: toPublicCart(updated),
    payment: result.payment
  };
}

export async function commitBooking(context, input) {
  if (input?.termsAccepted !== true) {
    throw bookingError(
      "TERMS_REQUIRED",
      "Accept the booking and payment terms before continuing."
    );
  }

  let loaded = await loadBookingCart(
    context,
    input,
    { includeTravelers: true }
  );
  if (loaded.row.status === "Confirmed") {
    return confirmedResult(loaded.row);
  }

  const storedPaymentId =
    loaded.row.payload?.payment?.paymentIntentId ||
    "";
  const submittedPaymentId = String(
    input?.paymentIntentId || ""
  ).trim();
  if (
    !storedPaymentId ||
    storedPaymentId !== submittedPaymentId
  ) {
    throw bookingError(
      "PAYMENT_REFERENCE_MISMATCH",
      "The completed payment does not match this booking."
    );
  }

  if (loaded.row.status === "PaymentPending") {
    const claimed = await transitionOwnedCart(
      context,
      loaded.row.cart_id,
      "PaymentPending",
      "Committing"
    );
    if (claimed) {
      loaded = {
        ...loaded,
        row: claimed
      };
    } else {
      loaded = await loadBookingCart(
        context,
        input,
        { includeTravelers: true }
      );
    }
  }

  if (!loaded.sensitive?.passengers?.length) {
    throw bookingError(
      "TRAVELERS_REQUIRED",
      "Traveler details are missing from this booking."
    );
  }

  let committedOrder = loaded.row.payload?.order || null;
  try {
    const services = combineServiceSelections(
      loaded.row.payload
    );
    const result = await createDuffelOrderCore({
      offerId: loaded.row.selected_offer_id,
      orderType: "instant",
      services,
      paymentIntentId: submittedPaymentId,
      passengers: loaded.sensitive.passengers,
      internalReference: loaded.row.cart_id
    });
    const order = result.order;
    committedOrder = order;
    await captureStripePaymentIntent(
      submittedPaymentId,
      `skandi_capture_${loaded.row.cart_id}`.slice(0, 255)
    );
    const payload = {
      ...loaded.row.payload,
      payment: {
        ...loaded.row.payload.payment,
        status: "succeeded",
        completedAt: new Date().toISOString()
      },
      order: committedOrder,
      flow: {
        ...(loaded.row.payload?.flow || {}),
        currentStep: "confirmation",
        confirmedAt: new Date().toISOString()
      }
    };
    const updated = await updateOwnedCart(
      context,
      loaded.row.cart_id,
      {
        status: "Confirmed",
        payload
      }
    );

    recordPaymentEventOnce({
      eventId: submittedPaymentId,
      provider: "Stripe",
      memberId: context.memberId,
      bookingId: loaded.row.cart_id,
      amount: loaded.row.total,
      currency: loaded.row.currency,
      status: "succeeded",
      payload: {
        duffelOrderId: order.id,
        bookingReference: order.bookingReference
      }
    }).catch(() => {
      /*
       * A confirmed airline order must not be reported as failed because
       * the auxiliary payment audit row could not be written.
       */
    });

    return {
      ...confirmedResult(updated),
      recoveredExistingOrder:
        result.recoveredExistingOrder === true
    };
  } catch (error) {
    const paymentIncomplete =
      error?.code === "PAYMENT_NOT_COMPLETE";
    const payload = {
      ...loaded.row.payload,
      order: committedOrder,
      payment: {
        ...loaded.row.payload?.payment,
        status: paymentIncomplete
          ? "requires_payment"
          : "reconciliation_required"
      },
      reconciliation: paymentIncomplete
        ? null
        : {
          required: true,
          code: safeCode(error?.code),
          orderId: committedOrder?.id || null,
          createdAt: new Date().toISOString()
        }
    };

    await updateOwnedCart(context, loaded.row.cart_id, {
      status: paymentIncomplete
        ? "PaymentPending"
        : "ReconciliationRequired",
      payload
    });

    if (!paymentIncomplete) {
      throw bookingError(
        "BOOKING_RECONCILIATION_REQUIRED",
        "The airline order or payment capture is still being reconciled. Do not try to pay again; contact SKANDI with your cart ID."
      );
    }
    throw error;
  }
}

export async function loadBookingConfirmation(context, input) {
  const loaded = await loadBookingCart(context, input);
  const row = await refreshConfirmedOrder(
    context,
    loaded.row
  );
  return confirmationFromRow(row);
}

export async function loadBookingDocuments(context, input) {
  const loaded = await loadBookingCart(context, input);
  const row = await refreshConfirmedOrder(
    context,
    loaded.row
  );
  const order = row.payload.order;
  const confirmation = confirmationFromRow(row);
  const itinerary = {
    title: "Duffel flight itinerary",
    bookingReference: order.bookingReference,
    orderId: order.id,
    status: order.status,
    slices: order.slices || []
  };
  const eTickets = {
    title: "Airline ticket documents",
    documents: (order.documents || []).map((document) => ({
      id: document.id,
      type: document.type,
      ticketNumber: document.uniqueIdentifier,
      passengerIds: document.passengerIds || []
    })),
    note: order.documents?.length
      ? "Ticket identifiers supplied by the airline are shown below."
      : "No airline ticket document has been issued yet."
  };

  return {
    cartId: row.cart_id,
    provider: "Duffel",
    documents: {
      confirmation,
      itinerary,
      eTickets
    }
  };
}

async function refreshAndPersistOffer(context, row) {
  const refreshed = await refreshDuffelOfferCore({
    offerId: row.selected_offer_id
  });
  assertOfferMatchesSearch(
    refreshed.offer,
    row.payload?.searchContext || {}
  );
  const selectedOffer = mapOfferForCart(refreshed.offer);
  const payload = {
    ...row.payload,
    selectedOffer
  };
  const updated = await updateOwnedCart(
    context,
    row.cart_id,
    {
      currency: refreshed.offer.totalCurrency,
      subtotal: decimal(refreshed.offer.totalAmount),
      taxes: decimal(refreshed.offer.taxAmount),
      total: decimal(refreshed.offer.totalAmount),
      expires_at: refreshed.offer.expiresAt,
      payload
    }
  );

  return updated;
}

async function refreshConfirmedOrder(context, row) {
  const storedOrder = row.payload?.order;
  if (row.status !== "Confirmed" || !storedOrder?.id) {
    throw bookingError(
      "BOOKING_NOT_CONFIRMED",
      "This booking does not have a confirmed airline order yet."
    );
  }

  const result = await getDuffelOrderCore({
    orderIdOrReference: storedOrder.id
  });
  const payload = {
    ...row.payload,
    order: result.order
  };
  return updateOwnedCart(context, row.cart_id, { payload });
}

async function requireOwnedCart(context, rawCartId) {
  const cartId = String(rawCartId || "").trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(cartId)
  ) {
    throw bookingError(
      "INVALID_CART_ID",
      "The booking cart reference is invalid."
    );
  }

  const row = await getOwnedCart(context, cartId);
  if (!row) {
    throw bookingError(
      "CART_NOT_FOUND",
      "This booking cart was not found or belongs to another account."
    );
  }
  return row;
}

function buildAvailableSeatServices(seatMaps) {
  const result = new Map();
  seatMaps.forEach((seatMap) => {
    (seatMap.seats || []).forEach((seat) => {
      (seat.availableServices || []).forEach((service) => {
        if (!service?.id) return;
        result.set(service.id, {
          serviceId: service.id,
          id: service.id,
          designator: seat.designator,
          cabinName: seat.cabinName,
          disclosures: seat.disclosures || [],
          passengerId: service.passengerId || null,
          segmentId: seatMap.segmentId || service.segmentId || null,
          amount: service.totalAmount,
          currency: service.totalCurrency
        });
      });
    });
  });
  return result;
}

function confirmationFromRow(row) {
  const order = row.payload?.order || {};
  const selectedOffer = row.payload?.selectedOffer || {};
  return {
    cartId: row.cart_id,
    title: "Your flight is confirmed",
    summary:
      selectedOffer.summary ||
      "Your airline order has been confirmed through Duffel.",
    bookingReference: order.bookingReference || "",
    pnrLocator: order.bookingReference || "",
    orderId: order.id || "",
    confirmationType: "Duffel flight order",
    status: order.status || "confirmed",
    primaryPassenger: "",
    seatSummary: seatSummary(row.payload?.seatSelections),
    segments: flattenSegments(order.slices || [])
  };
}

function confirmedResult(row) {
  const order = row?.payload?.order || {};
  return {
    cartId: row?.cart_id || "",
    bookingReference: order.bookingReference || "",
    orderId: order.id || "",
    status: row?.status || "Confirmed"
  };
}

function flattenSegments(slices) {
  return slices.flatMap((slice) =>
    (slice.segments || []).map((segment) => ({
      origin: segment.origin?.iataCode,
      destination: segment.destination?.iataCode,
      carrier:
        segment.marketingCarrier?.iataCode ||
        segment.marketingCarrier?.name,
      flightNumber: segment.marketingFlightNumber,
      departingAt: segment.departingAt,
      arrivingAt: segment.arrivingAt,
      date: String(segment.departingAt || "").slice(0, 10),
      bookingClass: slice.fareBrandName || ""
    }))
  );
}

function seatSummary(selections = {}) {
  const values = Object.values(selections)
    .map((selection) => selection?.designator)
    .filter(Boolean);
  return values.length ? values.join(", ") : "Not selected";
}

function assertOfferId(value) {
  const id = String(value || "").trim();
  if (!/^off_[A-Za-z0-9_]+$/.test(id)) {
    throw bookingError(
      "INVALID_OFFER_ID",
      "The selected Duffel offer is invalid."
    );
  }
  return id;
}

function decimal(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number < 0) {
    throw bookingError(
      "INVALID_PRICE",
      "The provider returned an invalid price."
    );
  }
  return number.toFixed(2);
}

function safeCode(value) {
  const code = String(value || "")
    .toUpperCase()
    .slice(0, 60);
  return /^[A-Z0-9_]+$/.test(code)
    ? code
    : "BOOKING_COMMIT_FAILED";
}

function assertCustomerEditable(row) {
  if (
    row?.status === "Confirmed" ||
    row?.status === "Committing" ||
    row?.status === "ReconciliationRequired"
  ) {
    throw bookingError(
      "BOOKING_LOCKED",
      "This booking can no longer be changed from checkout."
    );
  }
}

function resumeStepForStatus(status) {
  const steps = {
    OfferAccepted: "extras",
    ExtrasSaved: "transfer",
    TravelersPending: "apis",
    TravelersSaved: "seats",
    PaymentReady: "payment",
    PaymentPending: "payment",
    Committing: "payment",
    ReconciliationRequired: "payment",
    Confirmed: "confirmation"
  };
  return steps[String(status || "")] || "offer";

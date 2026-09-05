import { webMethod, Permissions } from "wix-web-module";
import { loadBookingCart } from "./bookingCart.repository.js";

function text(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function baseRules(cart = {}) {
  const destination = text(
    cart?.search?.destination ||
    cart?.flight?.offer?.slices?.[0]?.destination?.iataCode ||
    "",
    100
  );
  return {
    status: "READY",
    summary: destination
      ? `Traveler identity and document details are required for travel to ${destination}. Entry and transit requirements should be checked before departure.`
      : "Traveler identity and document details are required before the reservation can be issued.",
    destination,
    fields: [],
    notices: [],
    providerStatus: "Live booking validation"
  };
}

export const getApisRulesForCart = webMethod(
  Permissions.Anyone,
  async ({ cartId, cartToken } = {}) => {
    const cart = await loadBookingCart(cartId, cartToken);
    return baseRules(cart);
  }
);

export const refreshTravelRequirements = webMethod(
  Permissions.Anyone,
  async ({ cartId, cartToken, travelers = [] } = {}) => {
    const cart = await loadBookingCart(cartId, cartToken);
    const rules = baseRules(cart);
    const notices = [];

    for (const [index, traveler] of (Array.isArray(travelers) ? travelers : []).entries()) {
      const nationality = text(traveler?.nationality, 2).toUpperCase();
      const document = Array.isArray(traveler?.documents) ? traveler.documents[0] || {} : {};
      const documentNumber = text(
        traveler?.documentNumber || document?.number || "",
        50
      );
      const expiry = text(
        traveler?.documentExpiry || document?.expiryDate || "",
        10
      );

      if (!/^[A-Z]{2}$/.test(nationality)) {
        notices.push(`Traveler ${index + 1}: enter nationality as a two-letter country code.`);
      }
      if (!documentNumber) {
        notices.push(`Traveler ${index + 1}: travel document number is required.`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        notices.push(`Traveler ${index + 1}: enter a valid document expiry date.`);
      }
    }

    return {
      ...rules,
      status: notices.length ? "REVIEW" : "READY",
      notices
    };
  }
);

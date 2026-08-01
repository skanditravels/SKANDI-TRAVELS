import { webMethod, Permissions } from "wix-web-module";

/*
 * API-ready car rental service.
 *
 * Replace the provider calls below when the selected car-rental API is ready.
 * Keep provider credentials in Wix Secrets Manager or a backend-only provider
 * module. Never place keys in the HTML component or page code.
 */

const API_NOT_CONFIGURED = "CAR_RENTAL_API_NOT_CONFIGURED";

function providerError() {
  const error = new Error(
    "The car rental provider is not configured yet. Add the provider adapter to backend/carRentalService.web.js."
  );
  error.code = API_NOT_CONFIGURED;
  return error;
}

function cleanText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function requireText(value, label) {
  const text = cleanText(value);
  if (!text) throw new Error(`${label} is required.`);
  return text;
}

export const getCarRentalBootstrap = webMethod(
  Permissions.Anyone,
  async () => ({
    ok: true,
    providerConfigured: false,
    locations: [],
    countries: [
      "United States",
      "Sweden",
      "Norway",
      "Denmark",
      "Finland",
      "United Kingdom",
      "Germany",
      "France",
      "Spain",
      "Greece",
      "Thailand",
      "Canada"
    ],
    trust: [
      {
        title: "Trusted providers",
        text: "Compare connected rental partners in one place."
      },
      {
        title: "Transparent terms",
        text: "Deposits, fuel and mileage rules before you confirm."
      },
      {
        title: "Secure confirmation",
        text: "Availability and price are revalidated before booking."
      },
      {
        title: "Connected trip",
        text: "Keep rental details with your SKANDI journey."
      }
    ],
    features: [
      {
        icon: "⌖",
        title: "Airport and city locations",
        text: "Search airport, downtown and neighborhood rental stations."
      },
      {
        icon: "✓",
        title: "Clear protection choices",
        text: "See what is included and what each optional protection adds."
      },
      {
        icon: "▣",
        title: "Voucher and supplier details",
        text: "Receive pick-up instructions, contact details and rental terms."
      }
    ],
    filters: [
      {
        id: "category",
        title: "Vehicle type",
        options: ["Mini", "Economy", "Compact", "Midsize", "SUV", "Luxury", "Van"]
      },
      {
        id: "transmission",
        title: "Transmission",
        options: ["Automatic", "Manual"]
      },
      {
        id: "fuel",
        title: "Fuel type",
        options: ["Gasoline", "Diesel", "Hybrid", "Electric"]
      }
    ],
    faqs: [],
    extras: [],
    protection: []
  })
);

export const searchCarRentalOffers = webMethod(
  Permissions.Anyone,
  async (search = {}) => {
    requireText(search.pickupLocationId || search.pickupLocationText, "Pick-up location");
    requireText(search.dropoffLocationId || search.dropoffLocationText, "Drop-off location");
    requireText(search.pickupDate, "Pick-up date");
    requireText(search.dropoffDate, "Drop-off date");
    throw providerError();
  }
);

export const getCarRentalOfferDetails = webMethod(
  Permissions.Anyone,
  async ({ offerId, offer } = {}) => {
    if (!offerId && !offer) throw new Error("Offer ID is required.");
    throw providerError();
  }
);

export const repriceCarRentalQuote = webMethod(
  Permissions.Anyone,
  async ({ offerId, offer, extras = {}, search = {} } = {}) => {
    if (!offerId && !offer) throw new Error("Offer ID is required.");
    void extras;
    void search;
    throw providerError();
  }
);

export const createCarRentalBooking = webMethod(
  Permissions.Anyone,
  async (payload = {}) => {
    requireText(payload?.driver?.firstName, "Driver first name");
    requireText(payload?.driver?.lastName, "Driver last name");
    requireText(payload?.driver?.email, "Driver email");
    if (!payload?.offerId && !payload?.offer) throw new Error("Offer is required.");
    throw providerError();
  }
);

export const getCarRentalBooking = webMethod(
  Permissions.Anyone,
  async ({ reference, email } = {}) => {
    requireText(reference, "Booking reference");
    requireText(email, "Email");
    throw providerError();
  }
);

export const cancelCarRentalBooking = webMethod(
  Permissions.Anyone,
  async ({ reference, email } = {}) => {
    requireText(reference, "Booking reference");
    requireText(email, "Email");
    throw providerError();
  }
);

export const emailCarRentalConfirmation = webMethod(
  Permissions.Anyone,
  async ({ bookingReference, email } = {}) => {
    requireText(bookingReference, "Booking reference");
    requireText(email, "Email");
    throw providerError();
  }
);

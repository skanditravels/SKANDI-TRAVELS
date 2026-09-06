import wixLocation from "wix-location";
import { getPublicDestinationFinderData } from "backend/FINAL/publicInventory.web";

const EMBED_ID = "#htmlDestinations";

const CHILD_SOURCE = "SKANDI_DESTINATIONS_INDEX";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let lastLanguage = "EN";

function embed() {
  try {
    return $w(EMBED_ID);
  } catch (_error) {
    return null;
  }
}

function send(type, payload = {}) {
  const html = embed();

  if (!html?.postMessage) {
    return;
  }

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function normalizeLanguage(value) {
  const language = String(value || "EN")
    .trim()
    .toUpperCase();

  return ["EN", "SV", "NO", "DA", "FI"].includes(language)
    ? language
    : "EN";
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}

function buildPayload(result = {}) {
  const countries = Array.isArray(result.countries)
    ? result.countries
    : [];

  const areas = Array.isArray(result.areas)
    ? result.areas
    : [];

  const hotels = Array.isArray(result.hotels)
    ? result.hotels
    : [];

  const countryCards = countries.map((country) => {
    const countryAreas = areas.filter(
      (area) =>
        String(area.countryId || "") ===
        String(country.id || "")
    );

    const areaIds = new Set(
      countryAreas.map((area) => String(area.id))
    );

    const countryHotels = hotels.filter((hotel) =>
      areaIds.has(String(hotel.areaId || ""))
    );

    return {
      ...country,

      areaCount: countryAreas.length,
      hotelCount: countryHotels.length,

      areas: countryAreas
        .slice()
        .sort((a, b) =>
          String(a.name || "").localeCompare(
            String(b.name || "")
          )
        )
        .map((area) => ({
          id: area.id,
          name: area.name,
          slug: area.slug,
          image:
            area.image ||
            area.heroImage ||
            area.cardImage ||
            "",
          description:
            area.description || "",
          iata:
            area.destinationIata ||
            area.airportIata ||
            area.iata ||
            ""
        }))
    };
  });

  return {
    countries: countryCards,
    totalCountries: countryCards.length,
    totalAreas: areas.length,
    totalHotels: hotels.length
  };
}

async function loadDestinations(
  language = lastLanguage
) {
  lastLanguage =
    normalizeLanguage(language);

  send("DESTINATIONS_INDEX_LOADING", {
    loading: true
  });

  try {
    const result =
      await getPublicDestinationFinderData({
        language: lastLanguage
      });

    if (result?.ok === false) {
      throw new Error(
        result.message ||
          "Destination data could not be loaded."
      );
    }

    const payload =
      buildPayload(result);

    send(
      "DESTINATIONS_INDEX_DATA",
      payload
    );
  } catch (error) {
    console.error(
      "[SKANDI Destinations]",
      error
    );

    send("DESTINATIONS_INDEX_ERROR", {
      message:
        error?.message ||
        "Destinations are temporarily unavailable."
    });
  }
}

function navigate(path) {
  const cleanPath =
    String(path || "").trim();

  if (!cleanPath) {
    return;
  }

  wixLocation.to(
    cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`
  );
}

$w.onReady(async () => {
  const html = embed();

  if (!html) {
    console.error(
      `[SKANDI Destinations] Missing ${EMBED_ID}`
    );
    return;
  }

  html.onMessage(async (event) => {
    const message =
      event.data || {};

    if (
      message.source !== CHILD_SOURCE
    ) {
      return;
    }

    const payload =
      message.payload || {};

    try {
      switch (message.type) {
        case "DESTINATIONS_INDEX_READY":
          await loadDestinations(
            payload.language
          );
          return;

        case "DESTINATIONS_INDEX_REFRESH":
          await loadDestinations(
            payload.language ||
              lastLanguage
          );
          return;

        case "DESTINATIONS_LANGUAGE_CHANGE":
          await loadDestinations(
            payload.language
          );
          return;

        case "DESTINATIONS_OPEN_COUNTRY": {
          const slug =
            normalizeSlug(
              payload.slug
            );

          if (slug) {
            navigate(
              `/destinations/${slug}`
            );
          }

          return;
        }

        case "DESTINATIONS_OPEN_AREA": {
          const countrySlug =
            normalizeSlug(
              payload.countrySlug
            );

          const areaSlug =
            normalizeSlug(
              payload.areaSlug
            );

          if (
            countrySlug &&
            areaSlug
          ) {
            navigate(
              `/destinations/${countrySlug}/${areaSlug}`
            );
          }

          return;
        }

        default:
          return;
      }
    } catch (error) {
      console.error(
        "[SKANDI Destinations]",
        error
      );

      send(
        "DESTINATIONS_INDEX_ERROR",
        {
          message:
            error?.message ||
            "The request could not be completed."
        }
      );
    }
  });

  // Fallback in case the iframe READY
  // message happens before Wix attaches.
  setTimeout(() => {
    loadDestinations(
      lastLanguage
    );
  }, 500);
});

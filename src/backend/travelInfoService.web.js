import {
  webMethod,
  Permissions
} from "wix-web-module";

import {
  getSecret
} from "wix-secrets-backend";

import {
  fetch
} from "wix-fetch";

const SUPABASE_URL_SECRET =
  "SUPABASE_URL";

const SUPABASE_SECRET_KEY_SECRET =
  "SUPABASE_SECRET_KEY";

const SUPABASE_LEGACY_SERVICE_ROLE_SECRET =
  "SUPABASE_SERVICE_ROLE_KEY";

const OPENWEATHER_SECRET_NAME =
  "OPENWEATHER_API_KEY";

const TABLES = Object.freeze({
  airlines: "travel_info_airlines",
  airports: "travel_info_airports",
  hotels: "travel_info_hotels",
  transfers: "travel_info_transfers",
  tours: "travel_info_tours",
  tickets: "travel_info_tickets",
  faq: "travel_info_faq",
  articles: "travel_info_articles",
  requirements: "travel_requirements",
  baggage: "baggage_allowance",
  support: "travel_info_support_requests"
});

const DEFAULT_WEATHER_LOCATIONS = [
  {
    locationId: "NYC",
    title: "New York City",
    label: "New York City",
    airportHint: "NYC",
    country: "US",
    latitude: 40.7128,
    longitude: -74.0060
  },
  {
    locationId: "STOCKHOLM",
    title: "Stockholm",
    label: "Stockholm",
    airportHint: "ARN",
    country: "SE",
    latitude: 59.3293,
    longitude: 18.0686
  },
  {
    locationId: "KOH_SAMUI",
    title: "Koh Samui",
    label: "Koh Samui",
    airportHint: "USM",
    country: "TH",
    latitude: 9.5120,
    longitude: 100.0136
  },
  {
    locationId: "SANTORINI",
    title: "Santorini",
    label: "Santorini",
    airportHint: "JTR",
    country: "GR",
    latitude: 36.3932,
    longitude: 25.4615
  }
];

let supabaseConfigurationPromise = null;

/* ==========================================================================
   BASIC HELPERS
   ========================================================================== */

function asObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [value];
    } catch (_) {
      return [value];
    }
  }

  return [value];
}

function asJsonObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    try {
      return asObject(
        JSON.parse(value)
      );
    } catch (_) {}
  }

  return {};
}

function cleanText(
  value,
  maxLength = 4000
) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
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

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );
}

function titleFromSlug(value) {
  return String(value || "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .pop()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function makeReference(prefix) {
  const date =
    new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");

  const random =
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

  return `${prefix}-${date}-${random}`;
}

/* ==========================================================================
   SUPABASE SERVER CONNECTION
   ========================================================================== */

async function readSecret(name) {
  try {
    return cleanText(
      await getSecret(name),
      10000
    );
  } catch (_) {
    return "";
  }
}

async function supabaseConfiguration() {
  if (
    supabaseConfigurationPromise
  ) {
    return supabaseConfigurationPromise;
  }

  supabaseConfigurationPromise =
    (async () => {
      const [
        url,
        preferredSecret,
        legacyServiceRole
      ] =
        await Promise.all([
          readSecret(
            SUPABASE_URL_SECRET
          ),
          readSecret(
            SUPABASE_SECRET_KEY_SECRET
          ),
          readSecret(
            SUPABASE_LEGACY_SERVICE_ROLE_SECRET
          )
        ]);

      const cleanUrl =
        String(url || "")
          .replace(/\/+$/, "");

      const key =
        preferredSecret ||
        legacyServiceRole;

      if (
        !/^https:\/\/[^/]+\.supabase\.co$/i
          .test(cleanUrl)
      ) {
        throw new Error(
          "SUPABASE_URL is missing or invalid in Wix Secrets Manager."
        );
      }

      if (!key) {
        throw new Error(
          "Add SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to Wix Secrets Manager."
        );
      }

      if (
        key.startsWith(
          "sb_publishable_"
        )
      ) {
        throw new Error(
          "The Travel Info backend requires a server-only Supabase secret key, not a publishable key."
        );
      }

      return {
        url:
          cleanUrl,
        key,
        isModernSecret:
          key.startsWith(
            "sb_secret_"
          )
      };
    })();

  try {
    return await supabaseConfigurationPromise;
  } catch (error) {
    supabaseConfigurationPromise =
      null;

    throw error;
  }
}

async function supabaseRequest(
  path,
  {
    method = "GET",
    body,
    prefer = ""
  } = {}
) {
  const {
    url,
    key,
    isModernSecret
  } =
    await supabaseConfiguration();

  const headers = {
    apikey:
      key,
    Accept:
      "application/json",
    "Content-Type":
      "application/json"
  };

  /*
   * Modern sb_secret_ keys are API keys rather than JWTs.
   * Legacy service_role keys can also be sent as Bearer tokens.
   */
  if (!isModernSecret) {
    headers.Authorization =
      `Bearer ${key}`;
  }

  if (prefer) {
    headers.Prefer =
      prefer;
  }

  const response =
    await fetch(
      `${url}/rest/v1/${String(path).replace(/^\/+/, "")}`,
      {
        method,
        headers,
        body:
          body === undefined
            ? undefined
            : JSON.stringify(body)
      }
    );

  const text =
    await response.text();

  let data = null;

  if (text) {
    try {
      data =
        JSON.parse(text);
    } catch (_) {
      data =
        text;
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === "string"
        ? data
        : (
            data?.message ||
            data?.error ||
            JSON.stringify(data || {})
          );

    throw new Error(
      `Supabase ${method} failed (${response.status}): ${String(detail).slice(0, 500)}`
    );
  }

  return data;
}

async function selectActive(
  table
) {
  const query =
    [
      table,
      "?select=*",
      "&active=not.eq.false",
      "&order=sort_order.asc.nullslast,updated_at.desc"
    ].join("");

  const rows =
    await supabaseRequest(
      query
    );

  return Array.isArray(rows)
    ? rows
    : [];
}

/* ==========================================================================
   SQL ROW NORMALIZATION
   ========================================================================== */

function expandRow(row = {}) {
  const payload =
    asObject(row.payload);

  const title =
    firstValue(
      payload.title,
      payload.name,
      row.title,
      titleFromSlug(
        row.slug
      )
    ) || "";

  return {
    ...payload,

    _id:
      firstValue(
        payload._id,
        row.id
      ),

    id:
      firstValue(
        payload.id,
        payload.recordId,
        row.id
      ),

    recordId:
      firstValue(
        payload.recordId,
        payload.id,
        row.id
      ),

    title,
    name:
      firstValue(
        payload.name,
        title
      ),

    slug:
      firstValue(
        payload.slug,
        row.slug,
        ""
      ),

    category:
      firstValue(
        payload.category,
        row.category,
        ""
      ),

    body:
      firstValue(
        payload.body,
        row.body,
        ""
      ),

    imageUrl:
      firstValue(
        payload.imageUrl,
        payload.image_url,
        row.image_url,
        ""
      ),

    heroImage:
      firstValue(
        payload.heroImage,
        payload.hero_image,
        payload.imageUrl,
        row.image_url,
        ""
      ),

    active:
      row.active !== false &&
      payload.active !== false,

    sortOrder:
      numberValue(
        firstValue(
          payload.sortOrder,
          payload.sort_order,
          row.sort_order
        ),
        999
      ),

    updatedAt:
      firstValue(
        payload.updatedAt,
        payload.updated_at,
        row.updated_at,
        ""
      )
  };
}

function airline(item = {}) {
  const id =
    firstValue(
      item.recordId,
      item.airlineId,
      item.iataCode,
      item.id,
      item._id
    );

  return {
    id,
    name:
      firstValue(
        item.name,
        item.title,
        "Airline"
      ),
    shortName:
      cleanText(
        item.shortName ||
        item.short_name
      ),
    initials:
      cleanText(
        item.iataCode ||
        item.iata_code ||
        item.initials
      ),
    iataCode:
      cleanText(
        item.iataCode ||
        item.iata_code
      ),
    icaoCode:
      cleanText(
        item.icaoCode ||
        item.icao_code
      ),
    country:
      cleanText(
        item.country
      ),
    hub:
      cleanText(
        item.hub
      ),
    logo:
      firstValue(
        item.logo,
        item.logoUrl,
        item.logo_url,
        item.imageUrl,
        ""
      ),
    textmarkLogo:
      firstValue(
        item.textmarkLogo,
        item.textmark_logo,
        ""
      ),
    heroImage:
      firstValue(
        item.heroImage,
        item.hero_image,
        item.imageUrl,
        ""
      ),
    aircraftLogo:
      firstValue(
        item.aircraftLogo,
        item.aircraft_logo,
        ""
      ),
    color:
      firstValue(
        item.color,
        "#022e64"
      ),
    accent:
      firstValue(
        item.accent,
        "#d7e6ff"
      ),
    summary:
      firstValue(
        item.summary,
        item.body,
        ""
      ),
    intro:
      firstValue(
        item.intro,
        item.summary,
        item.body,
        ""
      ),
    meta:
      asArray(
        firstValue(
          item.meta,
          item.metaJson,
          item.meta_json
        )
      ).length
        ? asArray(
            firstValue(
              item.meta,
              item.metaJson,
              item.meta_json
            )
          )
        : [
            item.iataCode ||
              item.iata_code,
            item.country,
            item.hub
          ].filter(Boolean),
    sections:
      asJsonObject(
        firstValue(
          item.sections,
          item.sectionsJson,
          item.sections_json
        )
      ),
    sourceUrls:
      asArray(
        firstValue(
          item.sourceUrls,
          item.sourceUrlsJson,
          item.source_urls_json
        )
      ),
    publicDisclaimer:
      cleanText(
        item.publicDisclaimer ||
        item.public_disclaimer
      )
  };
}

function airport(item = {}) {
  const fallbackName =
    titleFromSlug(
      item.slug
    );

  return {
    id:
      firstValue(
        item.recordId,
        item.code,
        item.id,
        item._id
      ),
    code:
      cleanText(
        item.code ||
        item.iataCode ||
        item.iata_code
      ),
    name:
      firstValue(
        item.name,
        item.title,
        fallbackName,
        "Airport"
      ),
    city:
      cleanText(
        item.city
      ),
    country:
      cleanText(
        item.country
      ),
    region:
      cleanText(
        item.region
      ),
    summary:
      firstValue(
        item.summary,
        item.body,
        ""
      ),
    tagline:
      firstValue(
        item.tagline,
        item.summary,
        item.body,
        ""
      ),
    heroImage:
      firstValue(
        item.heroImage,
        item.hero_image,
        item.imageUrl,
        ""
      ),
    badges:
      asArray(
        firstValue(
          item.badges,
          item.badgesJson,
          item.badges_json
        )
      ).length
        ? asArray(
            firstValue(
              item.badges,
              item.badgesJson,
              item.badges_json
            )
          )
        : [
            item.city,
            item.country,
            item.region
          ].filter(Boolean),
    sections:
      asJsonObject(
        firstValue(
          item.sections,
          item.sectionsJson,
          item.sections_json
        )
      )
  };
}

function libraryRecord(
  type,
  item = {}
) {
  return {
    id:
      firstValue(
        item.recordId,
        item.id,
        item._id
      ),
    type,
    code:
      firstValue(
        item.code,
        item.ticketType,
        item.ticket_type,
        item.transferType,
        item.transfer_type,
        item.activityType,
        item.activity_type,
        ""
      ),
    name:
      firstValue(
        item.name,
        item.title,
        "Travel information"
      ),
    title:
      firstValue(
        item.title,
        item.name,
        "Travel information"
      ),
    city:
      cleanText(
        item.city
      ),
    country:
      cleanText(
        item.country
      ),
    region:
      firstValue(
        item.region,
        item.destination,
        ""
      ),
    destination:
      firstValue(
        item.destination,
        item.region,
        ""
      ),
    durationText:
      firstValue(
        item.durationText,
        item.duration_text,
        ""
      ),
    summary:
      firstValue(
        item.summary,
        item.body,
        ""
      ),
    intro:
      firstValue(
        item.intro,
        item.summary,
        item.body,
        ""
      ),
    heroImage:
      firstValue(
        item.heroImage,
        item.hero_image,
        item.imageUrl,
        ""
      ),
    logo:
      firstValue(
        item.logo,
        item.logoUrl,
        item.logo_url,
        ""
      ),
    badges:
      asArray(
        firstValue(
          item.badges,
          item.badgesJson,
          item.badges_json
        )
      ),
    amenities:
      asArray(
        firstValue(
          item.amenities,
          item.amenitiesJson,
          item.amenities_json
        )
      ),
    included:
      asArray(
        firstValue(
          item.included,
          item.includedJson,
          item.included_json
        )
      ),
    gallery:
      asArray(
        firstValue(
          item.gallery,
          item.galleryJson,
          item.gallery_json
        )
      ),
    sections:
      asJsonObject(
        firstValue(
          item.sections,
          item.sectionsJson,
          item.sections_json
        )
      ),
    bookingUrl:
      firstValue(
        item.bookingUrl,
        item.booking_url,
        ""
      ),
    meetingPoint:
      firstValue(
        item.meetingPoint,
        item.meeting_point,
        ""
      ),
    fromLocation:
      firstValue(
        item.fromLocation,
        item.from_location,
        ""
      ),
    toLocation:
      firstValue(
        item.toLocation,
        item.to_location,
        ""
      ),
    starRating:
      firstValue(
        item.starRating,
        item.star_rating,
        null
      ),
    difficulty:
      cleanText(
        item.difficulty
      ),
    publicType:
      firstValue(
        item.publicType,
        item.transferType,
        item.transfer_type,
        item.activityType,
        item.activity_type,
        item.ticketType,
        item.ticket_type,
        item.category,
        ""
      )
  };
}

/* ==========================================================================
   HELP CENTER
   ========================================================================== */

function helpTopic(
  item = {},
  source = "faq"
) {
  const groupId =
    cleanText(
      firstValue(
        item.groupId,
        item.group_id,
        item.category,
        "general"
      ),
      100
    )
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-");

  return {
    topicId:
      firstValue(
        item.topicId,
        item.topic_id,
        item.recordId,
        item.id
      ),
    groupId,
    title:
      firstValue(
        item.question,
        item.title,
        "Travel information"
      ),
    subtitle:
      firstValue(
        item.subtitle,
        item.summary,
        ""
      ),
    body:
      firstValue(
        item.answer,
        item.body,
        item.summary,
        ""
      ),
    bullets:
      asArray(
        firstValue(
          item.bullets,
          item.bulletsJson,
          item.bullets_json
        )
      ),
    actionType:
      firstValue(
        item.actionType,
        item.action_type,
        "article"
      ),
    actionTarget:
      firstValue(
        item.actionTarget,
        item.action_target,
        ""
      ),
    linkedLibrary:
      firstValue(
        item.linkedLibrary,
        item.linked_library,
        ""
      ),
    tags:
      firstValue(
        item.tags,
        ""
      ),
    sortOrder:
      numberValue(
        firstValue(
          item.sortOrder,
          item.sort_order
        ),
        999
      ),
    active:
      item.active !== false,
    featured:
      item.featured === true,
    source
  };
}

function helpGroupsFromTopics(
  topics = []
) {
  const groups =
    new Map();

  for (const topic of topics) {
    const groupId =
      topic.groupId ||
      "general";

    if (
      groups.has(groupId)
    ) {
      continue;
    }

    const label =
      groupId
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        );

    groups.set(
      groupId,
      {
        groupId,
        title:
          label ||
          "General",
        subtitle:
          "",
        eyebrow:
          "SKANDI Help Center",
        icon:
          "support",
        sortOrder:
          groups.size + 1,
        active:
          true,
        featured:
          false
      }
    );
  }

  return [
    ...groups.values()
  ];
}

/* ==========================================================================
   TRAVEL REQUIREMENTS / BAGGAGE
   ========================================================================== */

function buildTravelRequirements(
  rows = []
) {
  const out = {
    countries: [],
    visaDurations: {},
    passportValidityRules: {},
    healthRules: {},
    transitRules: {},
    airlineOverrides: {},
    etiasStartYear: 2025,
    etiasNote: "",
    disclaimer:
      "Travel rules change. Always check official government and carrier guidance before departure."
  };

  rows.forEach((row) => {
    const type =
      firstValue(
        row.ruleType,
        row.rule_type,
        row.category,
        ""
      );

    const key =
      firstValue(
        row.key,
        row.region,
        row.countryName,
        row.country_name,
        row.ruleId,
        row.rule_id,
        row.slug,
        ""
      );

    const value =
      firstValue(
        row.value,
        row.valueJson,
        row.value_json,
        row.valueText,
        row.value_text,
        row.body,
        ""
      );

    const jsonValue =
      (
        typeof value === "string"
          ? (() => {
              try {
                return JSON.parse(
                  value
                );
              } catch (_) {
                return value;
              }
            })()
          : value
      );

    if (type === "country") {
      out.countries.push({
        name:
          firstValue(
            row.countryName,
            row.country_name,
            row.title,
            ""
          ),
        region:
          firstValue(
            row.region,
            row.key,
            ""
          )
      });
    }

    if (
      type === "visaDuration" &&
      key
    ) {
      out.visaDurations[key] =
        jsonValue;
    }

    if (
      type === "passportValidity" &&
      key
    ) {
      out.passportValidityRules[key] =
        jsonValue;
    }

    if (
      type === "health" &&
      key
    ) {
      out.healthRules[key] =
        Array.isArray(jsonValue)
          ? jsonValue
          : [String(jsonValue)];
    }

    if (
      type === "transit" &&
      key
    ) {
      out.transitRules[key] =
        jsonValue;
    }

    if (
      type === "airlineOverride" &&
      key
    ) {
      out.airlineOverrides[key] =
        Array.isArray(jsonValue)
          ? jsonValue
          : [String(jsonValue)];
    }

    if (
      type === "setting" &&
      key
    ) {
      out[key] =
        jsonValue;
    }

    if (
      type === "disclaimer"
    ) {
      out.disclaimer =
        String(
          jsonValue ||
          out.disclaimer
        );
    }
  });

  return out;
}

function buildBaggage(
  rows = []
) {
  const baggageRules = {};
  const loyaltyPrograms = {};
  const excessBaggagePricing = {};

  rows.forEach((row) => {
    const key =
      firstValue(
        row.airlineKey,
        row.airline_key,
        row.recordId,
        row.id
      );

    if (!key) {
      return;
    }

    baggageRules[key] = {
      name:
        firstValue(
          row.airlineName,
          row.airline_name,
          row.title,
          key
        ),
      logo:
        firstValue(
          row.logo,
          row.logoUrl,
          row.logo_url,
          row.imageUrl,
          ""
        ),
      classes:
        asJsonObject(
          firstValue(
            row.classes,
            row.classesJson,
            row.classes_json
          )
        )
    };

    const loyalty =
      asJsonObject(
        firstValue(
          row.loyaltyPrograms,
          row.loyaltyProgramsJson,
          row.loyalty_programs_json
        )
      );

    Object.keys(loyalty)
      .forEach((program) => {
        loyaltyPrograms[program] =
          loyalty[program];
      });

    const excess =
      firstValue(
        row.excessPricing,
        row.excessPricingJson,
        row.excess_pricing_json
      );

    if (excess) {
      excessBaggagePricing[key] =
        typeof excess === "object"
          ? excess
          : asJsonObject(excess);
    }
  });

  return {
    baggageRules,
    loyaltyPrograms,
    excessBaggagePricing
  };
}

/* ==========================================================================
   PUBLIC TRAVEL INFO PAYLOAD
   ========================================================================== */

export const getTravelInfoPayload =
  webMethod(
    Permissions.Anyone,
    async function () {
      const [
        airlineRowsRaw,
        airportRowsRaw,
        hotelRowsRaw,
        transferRowsRaw,
        tourRowsRaw,
        ticketRowsRaw,
        faqRowsRaw,
        articleRowsRaw,
        requirementRowsRaw,
        baggageRowsRaw
      ] =
        await Promise.all([
          selectActive(
            TABLES.airlines
          ),
          selectActive(
            TABLES.airports
          ),
          selectActive(
            TABLES.hotels
          ),
          selectActive(
            TABLES.transfers
          ),
          selectActive(
            TABLES.tours
          ),
          selectActive(
            TABLES.tickets
          ),
          selectActive(
            TABLES.faq
          ),
          selectActive(
            TABLES.articles
          ),
          selectActive(
            TABLES.requirements
          ),
          selectActive(
            TABLES.baggage
          )
        ]);

      const airlineRows =
        airlineRowsRaw.map(
          expandRow
        );

      const airportRows =
        airportRowsRaw.map(
          expandRow
        );

      const hotelRows =
        hotelRowsRaw.map(
          expandRow
        );

      const transferRows =
        transferRowsRaw.map(
          expandRow
        );

      const tourRows =
        tourRowsRaw.map(
          expandRow
        );

      const ticketRows =
        ticketRowsRaw.map(
          expandRow
        );

      const requirementRows =
        requirementRowsRaw.map(
          expandRow
        );

      const baggageRows =
        baggageRowsRaw.map(
          expandRow
        );

      const faqTopics =
        faqRowsRaw
          .map(expandRow)
          .map((row) =>
            helpTopic(
              row,
              "faq"
            )
          );

      const articleTopics =
        articleRowsRaw
          .map(expandRow)
          .map((row) =>
            helpTopic(
              row,
              "article"
            )
          );

      const topics = [
        ...faqTopics,
        ...articleTopics
      ].filter(
        (topic) =>
          topic.active !== false
      );

      const airlines = {};

      airlineRows
        .map(airline)
        .forEach((item) => {
          if (item.id) {
            airlines[item.id] =
              item;
          }
        });

      const baggage =
        buildBaggage(
          baggageRows
        );

      /*
       * There is currently no public.travel_info_activities table.
       * Activities can be stored in travel_info_tours with a category /
       * activityType of activity or excursion and are separated here.
       */
      const activities =
        tourRows
          .filter((row) => {
            const value =
              String(
                firstValue(
                  row.libraryType,
                  row.library_type,
                  row.activityType,
                  row.activity_type,
                  row.category,
                  ""
                )
              )
                .toLowerCase();

            return (
              value.includes(
                "activity"
              ) ||
              value.includes(
                "excursion"
              )
            );
          })
          .map((row) =>
            libraryRecord(
              "activities",
              row
            )
          );

      const tours =
        tourRows
          .filter((row) => {
            const value =
              String(
                firstValue(
                  row.libraryType,
                  row.library_type,
                  row.activityType,
                  row.activity_type,
                  row.category,
                  ""
                )
              )
                .toLowerCase();

            return !(
              value.includes(
                "activity"
              ) ||
              value.includes(
                "excursion"
              )
            );
          })
          .map((row) =>
            libraryRecord(
              "tours",
              row
            )
          );

      return {
        generatedAt:
          new Date()
            .toISOString(),

        meta: {
          source:
            "SUPABASE",
          tables: {
            airlines:
              airlineRowsRaw.length,
            airports:
              airportRowsRaw.length,
            hotels:
              hotelRowsRaw.length,
            transfers:
              transferRowsRaw.length,
            tours:
              tourRowsRaw.length,
            tickets:
              ticketRowsRaw.length,
            faq:
              faqRowsRaw.length,
            articles:
              articleRowsRaw.length,
            requirements:
              requirementRowsRaw.length,
            baggage:
              baggageRowsRaw.length
          }
        },

        helpCenter: {
          groups:
            helpGroupsFromTopics(
              topics
            ),
          topics
        },

        airlines,

        airports:
          airportRows.map(
            airport
          ),

        hotels:
          hotelRows.map((row) =>
            libraryRecord(
              "hotels",
              row
            )
          ),

        transfers:
          transferRows.map((row) =>
            libraryRecord(
              "transfers",
              row
            )
          ),

        tours,

        activities,

        tickets:
          ticketRows.map((row) =>
            libraryRecord(
              "tickets",
              row
            )
          ),

        travelRequirements:
          buildTravelRequirements(
            requirementRows
          ),

        baggageRules:
          baggage.baggageRules,

        loyaltyPrograms:
          baggage.loyaltyPrograms,

        excessBaggagePricing:
          baggage.excessBaggagePricing
      };
    }
  );

/* ==========================================================================
   SUPPORT REQUESTS
   ========================================================================== */

export const createTravelInfoSupportRequest =
  webMethod(
    Permissions.Anyone,
    async function (
      input = {}
    ) {
      const message =
        cleanText(
          input.message,
          5000
        );

      if (!message) {
        return {
          ok: false,
          message:
            "Message is required."
        };
      }

      const ticketId =
        makeReference(
          "TRAVEL"
        );

      const now =
        new Date()
          .toISOString();

      const record = {
        title:
          `Travel Info request ${ticketId}`,
        slug:
          ticketId.toLowerCase(),
        category:
          cleanText(
            input.category ||
            "General",
            100
          ),
        body:
          message,
        active:
          true,
        sort_order:
          0,
        payload: {
          ticketId,
          source:
            "travel-info",
          name:
            cleanText(
              input.name,
              200
            ),
          email:
            cleanText(
              input.email,
              254
            )
              .toLowerCase(),
          bookingReference:
            cleanText(
              input.bookingReference,
              100
            ),
          category:
            cleanText(
              input.category ||
              "General",
              100
            ),
          message,
          status:
            "New",
          createdAt:
            now
        }
      };

      const rows =
        await supabaseRequest(
          TABLES.support,
          {
            method:
              "POST",
            body:
              record,
            prefer:
              "return=representation"
          }
        );

      const saved =
        Array.isArray(rows)
          ? rows[0]
          : rows;

      return {
        ok:
          true,
        ticketId,
        id:
          saved?.id || "",
        message:
          "Your request has been received."
      };
    }
  );

/* ==========================================================================
   ALEXANDRA
   ========================================================================== */

function normalizeSearchText(
  value
) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

export const askTravelInfoAgent =
  webMethod(
    Permissions.Anyone,
    async function (
      input = {}
    ) {
      const question =
        cleanText(
          input.question,
          1500
        );

      if (!question) {
        return {
          ok: false,
          answer:
            "Please type a travel information question."
        };
      }

      const context =
        asObject(
          input.searchContext
        );

      const matches =
        asArray(
          context.matches
        );

      const helpTopics =
        asArray(
          context.helpTopics
        );

      const query =
        normalizeSearchText(
          question
        );

      const candidates = [
        ...matches,
        ...helpTopics
      ];

      const ranked =
        candidates
          .map((item) => {
            const text =
              normalizeSearchText(
                [
                  item.title,
                  item.question,
                  item.summary,
                  item.answer,
                  item.tags
                ].join(" ")
              );

            const score =
              query
                .split(/\s+/)
                .filter(Boolean)
                .reduce(
                  (
                    total,
                    token
                  ) =>
                    total +
                    (
                      text.includes(
                        token
                      )
                        ? 1
                        : 0
                    ),
                  0
                );

            return {
              item,
              score
            };
          })
          .sort(
            (
              a,
              b
            ) =>
              b.score -
              a.score
          );

      const best =
        ranked[0];

      if (
        best &&
        best.score > 0
      ) {
        const item =
          best.item;

        const answer =
          firstValue(
            item.answer,
            item.summary,
            item.body,
            ""
          );

        if (answer) {
          return {
            ok: true,
            source:
              "SKANDI_TRAVEL_INFO",
            answer:
              String(answer)
          };
        }
      }

      return {
        ok:
          true,
        source:
          "SKANDI_TRAVEL_INFO",
        answer:
          "I couldn't find a sufficiently specific answer in the current SKANDI Travel Information content. Please use Contact Support so the team can help with your trip."
      };
    }
  );

/* ==========================================================================
   OPENWEATHER
   ========================================================================== */

function round(
  value,
  decimals = 0
) {
  const n =
    numberValue(
      value,
      0
    );

  const factor =
    Math.pow(
      10,
      decimals
    );

  return (
    Math.round(
      n * factor
    ) /
    factor
  );
}

function normalizeWeather(
  raw = {},
  location = {}
) {
  const weather =
    Array.isArray(
      raw.weather
    ) &&
    raw.weather.length
      ? raw.weather[0]
      : {};

  const main =
    asObject(
      raw.main
    );

  const title =
    location.title ||
    raw.name ||
    "Destination";

  return {
    ok: true,
    status:
      "live",
    locationId:
      location.locationId ||
      "",
    title,
    label:
      location.label ||
      title,
    airportHint:
      location.airportHint ||
      "",
    country:
      location.country ||
      raw.sys?.country ||
      "",
    fetchedAt:
      new Date()
        .toISOString(),
    condition:
      weather.main ||
      "",
    description:
      weather.description ||
      "",
    iconUrl:
      weather.icon
        ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
        : "",
    tempC:
      round(
        main.temp,
        1
      ),
    feelsLikeC:
      round(
        main.feels_like,
        1
      ),
    displayTemp:
      `${round(main.temp, 0)}°C`
  };
}

async function getOpenWeatherKey() {
  const key =
    await readSecret(
      OPENWEATHER_SECRET_NAME
    );

  if (!key) {
    throw new Error(
      `Missing Wix Secret: ${OPENWEATHER_SECRET_NAME}`
    );
  }

  return key;
}

async function fetchWeather(
  location,
  apiKey
) {
  const params =
    new URLSearchParams();

  params.set(
    "lat",
    String(
      location.latitude
    )
  );

  params.set(
    "lon",
    String(
      location.longitude
    )
  );

  params.set(
    "appid",
    apiKey
  );

  params.set(
    "units",
    "metric"
  );

  const response =
    await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
      {
        method:
          "GET"
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `OpenWeather HTTP ${response.status}`
    );
  }

  return normalizeWeather(
    data,
    location
  );
}

export const getTravelWeather =
  webMethod(
    Permissions.Anyone,
    async function (
      input = {}
    ) {
      const requested =
        Array.isArray(
          input.locations
        ) &&
        input.locations.length
          ? input.locations
          : DEFAULT_WEATHER_LOCATIONS;

      let apiKey = "";

      try {
        apiKey =
          await getOpenWeatherKey();
      } catch (error) {
        return {
          ok: false,
          source:
            "OPENWEATHER",
          updatedAt:
            new Date()
              .toISOString(),
          message:
            error.message,
          locations:
            requested.map(
              (location) => ({
                ok: false,
                status:
                  "unavailable",
                locationId:
                  location.locationId ||
                  "",
                title:
                  location.title ||
                  "Destination",
                label:
                  location.label ||
                  location.title ||
                  "Destination",
                airportHint:
                  location.airportHint ||
                  "",
                condition:
                  "Weather unavailable",
                tempC:
                  null,
                feelsLikeC:
                  null
              })
            )
        };
      }

      const locations = [];

      for (
        const location
        of requested
      ) {
        try {
          locations.push(
            await fetchWeather(
              location,
              apiKey
            )
          );
        } catch (error) {
          locations.push({
            ok:
              false,
            status:
              "unavailable",
            locationId:
              location.locationId ||
              "",
            title:
              location.title ||
              "Destination",
            label:
              location.label ||
              location.title ||
              "Destination",
            airportHint:
              location.airportHint ||
              "",
            condition:
              "Weather unavailable",
            tempC:
              null,
            feelsLikeC:
              null,
            error:
              error.message
          });
        }
      }

      return {
        ok:
          true,
        source:
          "OPENWEATHER",
        updatedAt:
          new Date()
            .toISOString(),
        locations
      };
    }
  );

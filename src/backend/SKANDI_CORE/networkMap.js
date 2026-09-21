return {
  type: "SKANDI_MAP_DATA",
  source: "SKANDI_WIX_PARENT",
  generatedAt: payload.generatedAt || new Date().toISOString(),

  destinations: Array.isArray(payload.destinations)
    ? payload.destinations
    : [],

  routes: Array.isArray(payload.routes)
    ? payload.routes
    : [],

  hotels: Array.isArray(payload.hotels)
    ? payload.hotels
    : [],

  airports: Array.isArray(payload.airports)
    ? payload.airports
    : [],

  airlines: Array.isArray(payload.airlines)
    ? payload.airlines
    : [],

  stats: payload.stats || {
    destinations: 0,
    airports: 0,
    routes: 0,
    hotels: 0,
    airlines: 0
  },

  publicNote:
    payload.publicNote ||
    "Only published, customer-visible network records are shown."
};

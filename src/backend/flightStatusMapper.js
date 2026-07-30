const MAX_RESULTS = 100;

export function normalizeFlights(rows, criteria) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const flights = sourceRows
    .filter((row) => matchesCriteria(row, criteria))
    .map((row) => normalizeFlight(row))
    .filter(Boolean);

  const unique = new Map();
  flights.forEach((flight) => {
    const key = [
      flight.flightIata,
      flight.departure.iata,
      flight.arrival.iata,
      flight.departure.scheduled
    ].join("|");
    if (!unique.has(key)) unique.set(key, flight);
  });

  const timeField =
    criteria.boardType === "arrivals" ? "arrival" : "departure";

  return [...unique.values()]
    .sort((a, b) => flightTime(a[timeField]) - flightTime(b[timeField]))
    .slice(0, MAX_RESULTS);
}

export function resultMessage(count, criteria) {
  if (!count) return "No flights matched your search.";
  if (criteria.mode === "flight") {
    return `${criteria.flightNumber}: ${count} matching flight ${
      count === 1 ? "record" : "records"
    }.`;
  }
  if (criteria.mode === "airport") {
    return `${criteria.airport} ${criteria.boardType}: ${count} ${
      count === 1 ? "flight" : "flights"
    }.`;
  }
  return `${criteria.from || "ANY"} to ${criteria.to || "ANY"}: ${count} ${
    count === 1 ? "flight" : "flights"
  }.`;
}

function matchesCriteria(row, criteria) {
  if (!row || typeof row !== "object") return false;

  const flightDate = token(row.flight_date, 10);
  if (flightDate && flightDate !== criteria.date) return false;

  const flightIata = compactCode(
    row.flight?.iata ||
      `${token(row.airline?.iata, 3)}${token(row.flight?.number, 6)}`
  );
  const departureIata = compactCode(row.departure?.iata);
  const arrivalIata = compactCode(row.arrival?.iata);

  if (
    criteria.mode === "flight" &&
    flightIata !== criteria.flightNumber
  ) {
    return false;
  }
  if (criteria.mode === "route" && criteria.from) {
    if (departureIata !== criteria.from) return false;
  }
  if (criteria.mode === "route" && criteria.to) {
    if (arrivalIata !== criteria.to) return false;
  }
  if (criteria.mode === "airport") {
    const boardAirport =
      criteria.boardType === "arrivals" ? arrivalIata : departureIata;
    if (boardAirport !== criteria.airport) return false;
  }

  return true;
}

function normalizeFlight(row) {
  const flightIata = compactCode(
    row.flight?.iata ||
      `${token(row.airline?.iata, 3)}${token(row.flight?.number, 6)}`
  );
  if (!flightIata) return null;

  const departure = normalizeAirportEvent(row.departure);
  const arrival = normalizeAirportEvent(row.arrival);

  return {
    id: [
      flightIata,
      departure.iata,
      arrival.iata,
      departure.scheduled
    ].join("-"),
    flightIata,
    airlineName:
      displayText(row.airline?.name, 80) ||
      compactCode(row.airline?.iata) ||
      "AIRLINE",
    status: normalizeStatus(row.flight_status, departure, arrival),
    departure,
    arrival
  };
}

function normalizeAirportEvent(value) {
  const event = value && typeof value === "object" ? value : {};
  return {
    airport: displayText(event.airport, 80),
    city: displayText(event.city, 50),
    iata: compactCode(event.iata).slice(0, 4),
    terminal: displayText(event.terminal, 15),
    gate: displayText(event.gate, 8),
    baggage: displayText(event.baggage, 15),
    scheduled: isoDateTime(event.scheduled),
    estimated: isoDateTime(event.estimated),
    actual: isoDateTime(event.actual)
  };
}

function normalizeStatus(value, departure, arrival) {
  const raw = token(value, 30).toLowerCase();
  if (raw === "cancelled") return "CANCELLED";
  if (raw === "diverted") return "DIVERTED";
  if (raw === "incident") return "INCIDENT";
  if (arrival.actual || raw === "landed") return "LANDED";
  if (departure.actual || raw === "active") return "IN FLIGHT";

  const scheduled = Date.parse(departure.scheduled);
  const estimated = Date.parse(departure.estimated);
  if (
    Number.isFinite(scheduled) &&
    Number.isFinite(estimated) &&
    estimated - scheduled >= 15 * 60 * 1000
  ) {
    return "DELAYED";
  }

  return raw === "scheduled" ? "SCHEDULED" : displayText(raw, 12) || "UNKNOWN";
}

function token(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function compactCode(value) {
  return token(value, 16)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function displayText(value, maxLength) {
  return token(value, maxLength)
    .replace(/[<>&"`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isoDateTime(value) {
  const timestamp = Date.parse(token(value, 50));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function flightTime(event) {
  const value = event?.estimated || event?.scheduled || event?.actual;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;

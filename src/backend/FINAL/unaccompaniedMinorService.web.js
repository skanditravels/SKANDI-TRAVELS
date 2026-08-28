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

const MAX_SIGNATURE_LENGTH = 400000;
const MAX_FLIGHT_SEGMENTS = 3;

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizePhone(value) {
  let phone = cleanText(value, 40).replace(/[^\d+]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  return phone;
}

function cleanFlight(value) {
  const flight = asObject(value);
  return {
    airline: cleanText(flight.airline, 80),
    prefix: cleanText(flight.prefix, 3).toUpperCase(),
    number: cleanText(flight.number, 4),
    departureDate: cleanText(flight.departureDate, 10),
    from: cleanText(flight.from, 160),
    to: cleanText(flight.to, 160)
  };
}

function validateFlight(flight, label) {
  if (!flight.airline || !/^[A-Z0-9]{2,3}$/.test(flight.prefix) || !/^\d{1,4}$/.test(flight.number) || !/^\d{4}-\d{2}-\d{2}$/.test(flight.departureDate) || !flight.from || !flight.to) {
    throw new Error(`${label} is incomplete.`);
  }
  if (flight.from.toLowerCase() === flight.to.toLowerCase()) {
    throw new Error(`${label} must have different departure and arrival airports.`);
  }
}

function caseNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `UM-${date}-${random}`;
}

async function config() {
  const [url, key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);
  return {
    url: String(url || "").replace(/\/$/, ""),
    key: String(key || "")
  };
}

async function insertRecord(record) {
  const { url, key } = await config();
  if (!url || !key) {
    throw new Error("Supabase is not configured for unaccompanied-minor forms.");
  }

  const response = await fetch(`${url}/rest/v1/unaccompanied_minor_forms`, {
    method: "post",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`The form could not be stored (${response.status}): ${detail.slice(0, 260)}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export const submitUnaccompaniedMinorForm = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    const form = asObject(input.form);
    const context = asObject(input.context);

    const pnr = cleanText(form.pnr, 6).toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(pnr)) {
      throw new Error("A valid six-character booking reference is required.");
    }

    const required = {
      umFirstName: cleanText(form.umFirstName, 120),
      umLastName: cleanText(form.umLastName, 120),
      umDob: cleanText(form.umDob, 10),
      umGender: cleanText(form.umGender, 30),
      guardianName: cleanText(form.guardianName, 180),
      guardianRelationship: cleanText(form.guardianRelationship, 100),
      guardianMobile: normalizePhone(form.guardianMobile),
      guardianEmail: cleanText(form.guardianEmail, 240).toLowerCase(),
      guardianStreet: cleanText(form.guardianStreet, 240),
      guardianCity: cleanText(form.guardianCity, 120),
      guardianPostal: cleanText(form.guardianPostal, 40),
      guardianCountry: cleanText(form.guardianCountry, 100),
      departureEscortName: cleanText(form.departureEscortName, 180),
      departureEscortRelationship: cleanText(form.departureEscortRelationship, 100),
      departureEscortAddress: cleanText(form.departureEscortAddress, 300),
      departureEscortPhone: normalizePhone(form.departureEscortPhone),
      arrivalEscortName: cleanText(form.arrivalEscortName, 180),
      arrivalEscortRelationship: cleanText(form.arrivalEscortRelationship, 100),
      arrivalEscortAddress: cleanText(form.arrivalEscortAddress, 300),
      arrivalEscortPhone: normalizePhone(form.arrivalEscortPhone),
      signPlace: cleanText(form.signPlace, 120),
      signName: cleanText(form.signName, 180)
    };

    const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length) {
      throw new Error(`Required information is missing: ${missing.join(", ")}.`);
    }

    if (!/^\S+@\S+\.\S+$/.test(required.guardianEmail)) {
      throw new Error("A valid guardian email address is required.");
    }

    const dob = new Date(`${required.umDob}T00:00:00Z`);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      throw new Error("A valid date of birth is required.");
    }

    if (!form.consent1 || !form.consent2 || !form.consent3) {
      throw new Error("All required confirmations must be accepted.");
    }

    const signatureDataUrl = cleanText(form.signatureDataUrl, MAX_SIGNATURE_LENGTH);
    if (!signatureDataUrl.startsWith("data:image/png;base64,")) {
      throw new Error("A guardian signature is required.");
    }

    const outboundFlights = Array.isArray(form.outboundFlights) ? form.outboundFlights.slice(0, MAX_FLIGHT_SEGMENTS).map(cleanFlight) : [];
    const returnFlights = Array.isArray(form.returnFlights) ? form.returnFlights.slice(0, MAX_FLIGHT_SEGMENTS).map(cleanFlight) : [];

    if (!outboundFlights.length) {
      throw new Error("At least one outbound flight is required.");
    }
    outboundFlights.forEach((flight, index) => validateFlight(flight, `Outbound flight ${index + 1}`));
    returnFlights.forEach((flight, index) => validateFlight(flight, `Return flight ${index + 1}`));

    const number = caseNumber();
    const record = {
      case_number: number,
      status: "submitted",
      pnr,
      child_first_name: required.umFirstName,
      child_last_name: required.umLastName,
      child_date_of_birth: required.umDob,
      child_gender: required.umGender,
      child_languages: Array.isArray(form.umLanguages) ? form.umLanguages.map(value => cleanText(value, 50)).filter(Boolean).slice(0, 20) : [],
      guardian: {
        name: required.guardianName,
        relationship: required.guardianRelationship,
        mobile: required.guardianMobile,
        email: required.guardianEmail,
        street: required.guardianStreet,
        city: required.guardianCity,
        region: cleanText(form.guardianRegion, 120),
        postal: required.guardianPostal,
        country: required.guardianCountry
      },
      departure_escort: {
        name: required.departureEscortName,
        relationship: required.departureEscortRelationship,
        address: required.departureEscortAddress,
        phone: required.departureEscortPhone
      },
      transfer_escort: form.noTransferEscort ? null : {
        name: cleanText(form.transferEscortName, 180),
        relationship: cleanText(form.transferEscortRelationship, 100),
        address: cleanText(form.transferEscortAddress, 300),
        phone: normalizePhone(form.transferEscortPhone)
      },
      arrival_escort: {
        name: required.arrivalEscortName,
        relationship: required.arrivalEscortRelationship,
        address: required.arrivalEscortAddress,
        phone: required.arrivalEscortPhone
      },
      outbound_flights: outboundFlights,
      return_flights: returnFlights,
      consent: {
        authorised: Boolean(form.consent1),
        understands_requirements: Boolean(form.consent2),
        information_sharing: Boolean(form.consent3),
        place: required.signPlace,
        signer_name: required.signName,
        signed_at: new Date().toISOString()
      },
      signature_data_url: signatureDataUrl,
      language: cleanText(form.language, 10) || "EN",
      member_id: cleanText(context.memberId, 100) || null,
      member_email: cleanText(context.memberEmail, 240).toLowerCase() || null,
      source_page: cleanText(context.sourcePage, 500) || null,
      submitted_at: new Date().toISOString()
    };

    const stored = await insertRecord(record);

    return {
      success: true,
      caseNumber: stored?.case_number || number,
      id: stored?.id || "",
      status: stored?.status || "submitted",
      submittedAt: stored?.submitted_at || record.submitted_at
    };
  }
);

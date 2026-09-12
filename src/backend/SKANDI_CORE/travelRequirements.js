// /src/backend/SKANDI_CORE/travelRequirements.js
// Internal provider adapter for approved travel-requirements sources.
// R-005.2: reusable backend module; never imported by Wix page/frontend code.


import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";


const elevatedGetSecretValue = elevate(secrets.getSecretValue);


function secretString(result) {
  if (typeof result === "string") return result.trim();
  return String(result?.value ?? result?.secretValue ?? "").trim();
}


async function secret(name) {
  try {
    return secretString(await elevatedGetSecretValue(name));
  } catch (_) {
    return "";
  }
}


export async function checkExternalTravelRequirements({ cart, travelers = [] } = {}) {
  const url = await secret("TRAVEL_REQUIREMENTS_PROVIDER_URL");
  const token = await secret("TRAVEL_REQUIREMENTS_PROVIDER_TOKEN");


  if (!url || !token) {
    return {
      connected: false,
      status: "NEEDS_PROVIDER",
      provider: "NONE",
      summary:
        "External travel-requirements provider is not connected. SKANDI guidance is not a live Timatic/IATA boarding decision.",
      fields: [],
      notices: [
        "Connect Timatic/IATA Travel Centre or another approved requirements provider before production visa/entry automation."
      ]
    };
  }


  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      origin: cart?.searchContext?.origin || "",
      destination: cart?.searchContext?.destination || "",
      departureDate: cart?.searchContext?.departureDate || "",
      returnDate: cart?.searchContext?.returnDate || "",
      travelers: (Array.isArray(travelers) ? travelers : []).map((traveler) => ({
        id: traveler?.id || traveler?.travelerId || "",
        nationality: traveler?.nationality || "",
        residenceCountry: traveler?.residenceCountry || "",
        documentType:
          traveler?.documents?.[0]?.documentType ||
          traveler?.documentType ||
          "",
        documentExpiryDate:
          traveler?.documents?.[0]?.expiryDate ||
          traveler?.documentExpiry ||
          traveler?.expiryDate ||
          "",
        dateOfBirth: traveler?.dateOfBirth || ""
      }))
    })
  });


  let json = {};
  try {
    json = await response.json();
  } catch (_) {
    json = {};
  }


  if (!response.ok) {
    return {
      connected: true,
      status: "PROVIDER_ERROR",
      provider: "CONFIGURED",
      summary:
        json?.message ||
        json?.error ||
        "Travel requirements provider returned an error.",
      fields: [],
      notices: ["Review travel-requirements provider configuration."]
    };
  }


  return {
    connected: true,
    status: json?.status || "PROVIDER_RESULT",
    provider: json?.provider || "CONFIGURED",
    summary: json?.summary || "Travel requirements checked.",
    decision: json?.decision || null,
    raw: json?.raw || null,
    fields: Array.isArray(json?.fields) ? json.fields : [],
    notices: Array.isArray(json?.notices) ? json.notices : []
  };
}
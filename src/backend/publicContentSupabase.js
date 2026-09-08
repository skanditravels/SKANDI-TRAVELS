import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configurationPromise = null;

const ALLOWED_RPCS = new Set([
  "get_public_about_payload",
  "get_public_network_map_payload"
]);

function secretString(response) {
  if (typeof response === "string") return response.trim();
  return String(
    response?.value ??
    response?.secretValue ??
    response?.secret?.value ??
    ""
  ).trim();
}

async function getSecret(name) {
  const response = await elevatedGetSecretValue(name);
  const value = secretString(response);
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}

async function getConfiguration() {
  if (configurationPromise) return configurationPromise;

  configurationPromise = (async () => {
    const baseUrl = await getSecret("SUPABASE_URL");
    let apiKey = "";

    try {
      apiKey = await getSecret("SUPABASE_SECRET_KEY");
    } catch (_) {
      apiKey = await getSecret("SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!/^https:\/\/[^/]+\.supabase\.co\/?$/i.test(baseUrl)) {
      throw new Error("SUPABASE_URL_INVALID");
    }
    if (!apiKey) throw new Error("SUPABASE_SERVER_KEY_MISSING");

    return {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      apiKey,
      keyType: apiKey.startsWith("sb_secret_")
        ? "modern-secret"
        : apiKey.startsWith("eyJ")
          ? "legacy-jwt"
          : "api-key"
    };
  })();

  try {
    return await configurationPromise;
  } catch (error) {
    configurationPromise = null;
    throw error;
  }
}

export async function callPublicContentRpc(functionName) {
  if (!ALLOWED_RPCS.has(functionName)) {
    throw new Error("PUBLIC_CONTENT_RPC_NOT_ALLOWED");
  }

  const { baseUrl, apiKey, keyType } = await getConfiguration();
  const headers = {
    apikey: apiKey,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  if (keyType === "legacy-jwt") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${baseUrl}/rest/v1/rpc/${functionName}`, {
    method: "post",
    headers,
    body: "{}"
  });

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      throw new Error("PUBLIC_CONTENT_INVALID_RESPONSE");
    }
  }

  if (!response.ok) {
    console.error("[PublicContent] Supabase RPC failed", {
      functionName,
      status: response.status,
      code: String(payload?.code || "").slice(0, 80)
    });
    throw new Error(`PUBLIC_CONTENT_HTTP_${response.status}`);
  }

  return payload;
}

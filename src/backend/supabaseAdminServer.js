import { fetch } from "wix-fetch";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";

const getSecretValueElevated = elevate(secrets.getSecretValue);

const CONFIG_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 25 * 1000;

let configCache = null;
let configExpiresAt = 0;

async function readSecret(name, required = true) {
  try {
    const result = await getSecretValueElevated(name);
    const value = String(result?.value || "").trim();
    if (value) return value;
  } catch (error) {
    if (!required) return "";
  }

  if (!required) return "";

  const error = new Error(`Required Wix secret ${name} is not configured.`);
  error.code = "SECRET_CONFIGURATION_MISSING";
  throw error;
}

async function readFirstSecret(names) {
  for (const name of names) {
    const value = await readSecret(name, false);
    if (value) return value;
  }

  const error = new Error(
    `Configure one of these Wix secrets: ${names.join(", ")}.`
  );
  error.code = "SECRET_CONFIGURATION_MISSING";
  throw error;
}

function parseCsv(value) {
  return String(value || "")
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getRuntimeConfig() {
  if (configCache && Date.now() < configExpiresAt) return configCache;

  const [
    rawUrl,
    secretKey,
    memberIdsRaw,
    allowedTablesRaw,
    blockedTablesRaw
  ] = await Promise.all([
    readSecret("SUPABASE_URL"),
    readFirstSecret(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]),
    readSecret("SUPER_ADMIN_WIX_MEMBER_IDS"),
    readSecret("SUPER_ADMIN_ALLOWED_TABLES", false),
    readSecret("SUPER_ADMIN_BLOCKED_TABLES", false)
  ]);

  const url = rawUrl.replace(/\/+$/, "");
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    const error = new Error("SUPABASE_URL is not a valid hosted Supabase URL.");
    error.code = "SECRET_CONFIGURATION_MISSING";
    throw error;
  }

  configCache = Object.freeze({
    url,
    secretKey,
    superAdminMemberIds: new Set(parseCsv(memberIdsRaw)),
    allowedTables: new Set(parseCsv(allowedTablesRaw)),
    blockedTables: new Set(parseCsv(blockedTablesRaw))
  });
  configExpiresAt = Date.now() + CONFIG_TTL_MS;

  return configCache;
}

function buildHeaders(key, extraHeaders = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    ...extraHeaders
  };
}

function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function safeRemoteMessage(body, status) {
  if (body && typeof body === "object") {
    const message = body.message || body.msg || body.error_description || body.error;
    if (message) return String(message).slice(0, 500);
  }
  return `Supabase returned HTTP ${status}.`;
}

export async function supabaseAdminRequest(
  path,
  {
    method = "GET",
    query = null,
    body,
    headers = {},
    prefer,
    includeResponseHeaders = false
  } = {}
) {
  const config = await getRuntimeConfig();
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;
  const url = new URL(`${config.url}${normalizedPath}`);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const requestHeaders = buildHeaders(config.secretKey, headers);
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (prefer) requestHeaders.Prefer = prefer;

  let response;
  let timeout;
  try {
    response = await Promise.race([
      fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body)
      }),
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          const timeoutError = new Error("Supabase request timed out.");
          timeoutError.code = "SUPABASE_REQUEST_FAILED";
          reject(timeoutError);
        }, REQUEST_TIMEOUT_MS);
      })
    ]);
  } catch (cause) {
    const error = new Error(
      cause?.message === "Supabase request timed out."
        ? cause.message
        : "Supabase could not be reached."
    );
    error.code = "SUPABASE_REQUEST_FAILED";
    error.cause = cause;
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    const error = new Error(safeRemoteMessage(data, response.status));
    error.code = "SUPABASE_REQUEST_FAILED";
    error.status = response.status;
    error.remoteCode =
      data && typeof data === "object" ? data.code || data.error_code : null;
    throw error;
  }

  if (!includeResponseHeaders) return data;

  return {
    data,
    headers: {
      contentRange: response.headers.get("content-range"),
      totalCount: response.headers.get("x-total-count")
    },
    status: response.status
  };
}

export async function callAdminRpc(functionName, payload = {}) {
  return supabaseAdminRequest(`/rest/v1/rpc/${functionName}`, {
    method: "POST",
    body: payload
  });
}

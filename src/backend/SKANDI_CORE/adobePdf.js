// /src/backend/SKANDI_CORE/adobePdf.js
// V12 canonical server-only Adobe PDF Services transport.
// Provider authentication, asset upload and job polling only. Domain authorization stays in caller cores.

import { Buffer } from "buffer";
import * as https from "https";
import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";

const getSecretValue = elevate(secrets.getSecretValue);
const TOKEN_URL = "https://pdf-services.adobe.io/token";
const DEFAULT_BASE = "https://pdf-services.adobe.io";
const REGION_BASES = Object.freeze({
  ue1: "https://pdf-services-ue1.adobe.io",
  ew1: "https://pdf-services-ew1.adobe.io"
});
const MAX_PROVIDER_BYTES = 150 * 1024 * 1024;
const POLL_ATTEMPTS = 30;
const POLL_DELAY_MS = 750;

let tokenCache = null;
let configPromise = null;

const clean = (value, max = 5000) => String(value ?? "").trim().slice(0, max);

function secretValue(result) {
  if (typeof result === "string") return result.trim();
  return clean(result?.value ?? result?.secretValue ?? result?.secret?.value, 10000);
}

async function readSecret(name, { optional = false } = {}) {
  try {
    const value = secretValue(await getSecretValue(name));
    if (!value && !optional) throw new Error(`ADOBE_SECRET_EMPTY_${name}`);
    return value;
  } catch (error) {
    if (optional) return "";
    throw error;
  }
}

async function config() {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    const clientId = await readSecret("PDF_SERVICES_CLIENT_ID");
    const clientSecret = await readSecret("PDF_SERVICES_CLIENT_SECRET");
    const region = clean(await readSecret("PDF_SERVICES_REGION", { optional: true }), 8).toLowerCase();
    if (region && !REGION_BASES[region]) throw new Error("ADOBE_PDF_REGION_INVALID");
    return Object.freeze({
      clientId,
      clientSecret,
      region: region || "default",
      baseUrl: region ? REGION_BASES[region] : DEFAULT_BASE
    });
  })();
  try {
    return await configPromise;
  } catch (error) {
    configPromise = null;
    throw error;
  }
}

function providerMessage(payload, fallback) {
  return clean(
    payload?.error?.message || payload?.message || payload?.error_description || fallback,
    500
  );
}

async function jsonResponse(response, fallback) {
  const raw = await response.text();
  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      throw new Error(`${fallback}_INVALID_JSON`);
    }
  }
  if (!response.ok) {
    const error = new Error(providerMessage(payload, `${fallback}_HTTP_${response.status}`));
    error.code = clean(payload?.error?.code || payload?.code || `${fallback}_HTTP_${response.status}`, 120);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function accessToken() {
  const now = Date.now();
  if (tokenCache?.token && tokenCache.expiresAt > now + 60000) return tokenCache.token;
  const { clientId, clientSecret } = await config();
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret }).toString();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const payload = await jsonResponse(response, "ADOBE_TOKEN");
  const token = clean(payload.access_token, 10000);
  if (!token) throw new Error("ADOBE_ACCESS_TOKEN_MISSING");
  const expiresIn = Math.max(120, Number(payload.expires_in || 3600));
  tokenCache = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

async function adobeFetch(pathOrUrl, { method = "GET", body, contentType = "application/json" } = {}) {
  const { clientId, baseUrl } = await config();
  const token = await accessToken();
  const url = /^https:\/\//i.test(pathOrUrl) ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
  const headers = {
    "x-api-key": clientId,
    Authorization: `Bearer ${token}`
  };
  if (contentType) headers["Content-Type"] = contentType;
  return fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body)
  });
}

function binaryRequest(url, { method = "GET", headers = {}, body = null, redirects = 4 } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const request = https.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 443,
      path: `${target.pathname}${target.search}`,
      method,
      headers
    }, response => {
      const status = Number(response.statusCode || 0);
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirects > 0) {
        response.resume();
        const next = new URL(response.headers.location, url).toString();
        resolve(binaryRequest(next, { method: status === 303 ? "GET" : method, headers, body, redirects: redirects - 1 }));
        return;
      }
      const chunks = [];
      let size = 0;
      response.on("data", chunk => {
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += data.length;
        if (size > MAX_PROVIDER_BYTES) {
          request.destroy(new Error("ADOBE_BINARY_RESPONSE_TOO_LARGE"));
          return;
        }
        chunks.push(data);
      });
      response.on("end", () => {
        const data = Buffer.concat(chunks);
        if (status < 200 || status >= 300) {
          reject(new Error(`ADOBE_BINARY_HTTP_${status}`));
          return;
        }
        resolve({ status, headers: response.headers, data });
      });
    });
    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

async function createAsset(mediaType) {
  const response = await adobeFetch("/assets", {
    method: "POST",
    body: { mediaType }
  });
  const payload = await jsonResponse(response, "ADOBE_ASSET_CREATE");
  const uploadUri = clean(payload.uploadUri, 12000);
  const assetID = clean(payload.assetID, 1000);
  if (!uploadUri || !assetID) throw new Error("ADOBE_ASSET_RESPONSE_INVALID");
  return { uploadUri, assetID };
}

async function uploadBuffer(buffer, mediaType) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (!bytes.length || bytes.length > MAX_PROVIDER_BYTES) throw new Error("ADOBE_ASSET_SIZE_INVALID");
  const asset = await createAsset(mediaType);
  await binaryRequest(asset.uploadUri, {
    method: "PUT",
    headers: {
      "Content-Type": mediaType,
      "Content-Length": bytes.length
    },
    body: bytes
  });
  return asset.assetID;
}

async function loadBuffer(url) {
  const result = await binaryRequest(url, { method: "GET" });
  if (!result.data.length) throw new Error("ADOBE_SOURCE_FILE_EMPTY");
  return result.data;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitJob(operation, body) {
  const response = await adobeFetch(`/operation/${operation}`, { method: "POST", body });
  if (!response.ok) await jsonResponse(response, `ADOBE_${operation.toUpperCase()}_SUBMIT`);
  const location = clean(response.headers?.get?.("location") || response.headers?.get?.("Location"), 12000);
  if (!location) throw new Error(`ADOBE_${operation.toUpperCase()}_LOCATION_MISSING`);
  return location;
}

async function pollJob(location, operation) {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const response = await adobeFetch(location, { method: "GET", contentType: "" });
    const payload = await jsonResponse(response, `ADOBE_${operation.toUpperCase()}_STATUS`);
    const status = clean(payload.status, 40).toLowerCase();
    if (status === "done") return payload;
    if (status === "failed") {
      const error = new Error(providerMessage(payload, `ADOBE_${operation.toUpperCase()}_FAILED`));
      error.code = clean(payload?.error?.code || `ADOBE_${operation.toUpperCase()}_FAILED`, 120);
      throw error;
    }
    if (status && status !== "in progress" && status !== "in_progress") {
      throw new Error(`ADOBE_${operation.toUpperCase()}_STATUS_INVALID`);
    }
    await wait(POLL_DELAY_MS);
  }
  throw new Error(`ADOBE_${operation.toUpperCase()}_TIMEOUT`);
}

function normalizePdfProperties(payload = {}) {
  const props = payload.pdfProperties || payload.result?.pdfProperties || payload.result || payload;
  const document = props.document || props.Document || {};
  const pageCount = Number(document.pageCount ?? document.page_count ?? props.pageCount ?? props.page_count ?? 0);
  const fileSize = Number(document.fileSize ?? document.file_size ?? 0);
  const pdfVersion = clean(document.pdfVersion ?? document.pdf_version, 80);
  const encrypted = Boolean(document.encrypted ?? document.isEncrypted ?? document.is_encrypted ?? false);
  return {
    pageCount: Number.isFinite(pageCount) && pageCount > 0 ? pageCount : 0,
    fileSize: Number.isFinite(fileSize) && fileSize > 0 ? fileSize : 0,
    pdfVersion,
    encrypted,
    raw: props
  };
}

export async function getAdobePdfPropertiesFromUrl({ url, pageLevel = false } = {}) {
  const sourceUrl = clean(url, 12000);
  if (!/^https:\/\//i.test(sourceUrl)) throw new Error("ADOBE_PDF_SOURCE_URL_INVALID");
  const source = await loadBuffer(sourceUrl);
  const assetID = await uploadBuffer(source, "application/pdf");
  const location = await submitJob("pdfproperties", { assetID, pageLevel: pageLevel === true });
  const result = await pollJob(location, "pdfproperties");
  const properties = normalizePdfProperties(result);
  if (!properties.pageCount) throw new Error("ADOBE_PDF_PAGE_COUNT_MISSING");
  return properties;
}

export async function getAdobePdfDiagnostics() {
  const cfg = await config();
  return {
    ok: true,
    provider: "ADOBE_PDF_SERVICES",
    region: cfg.region,
    baseUrl: cfg.baseUrl,
    clientIdConfigured: Boolean(cfg.clientId),
    clientSecretConfigured: Boolean(cfg.clientSecret)
  };
}

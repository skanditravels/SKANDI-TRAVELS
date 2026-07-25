import { fetch } from "wix-fetch";
import wixSecretsBackend from "wix-secrets-backend";

async function getSupabaseConfig() {
  const rawUrl = await wixSecretsBackend.getSecret("SUPABASE_URL");
  const rawKey = await wixSecretsBackend.getSecret("SUPABASE_SERVICE_ROLE_KEY");

  const url = String(rawUrl || "")
    .trim()
    .replace(/\/$/, "")
    .replace(/\/rest\/v1$/, "");

  const key = String(rawKey || "").trim();

  if (!url || !key) {
    throw new Error("Supabase secrets are not configured.");
  }

  return { url, key };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = await getSupabaseConfig();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "get",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (error) {
    data = raw;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      data?.hint ||
      `Supabase request failed: ${response.status}`
    );
  }

  return data;
}

export async function sbSelect(table, query = "") {
  return supabaseRequest(`${table}${query ? `?${query}` : ""}`);
}

export async function sbInsert(table, body, options = {}) {
  return supabaseRequest(table, {
    method: "post",
    body,
    prefer: options.prefer || "return=representation"
  });
}

export async function sbUpsert(table, body, conflictTarget, options = {}) {
  const conflict = conflictTarget
    ? `?on_conflict=${encodeURIComponent(conflictTarget)}`
    : "";

  return supabaseRequest(`${table}${conflict}`, {
    method: "post",
    body,
    prefer: options.prefer || "resolution=merge-duplicates,return=representation"
  });
}

export async function sbUpdate(table, query, body, options = {}) {
  return supabaseRequest(`${table}?${query}`, {
    method: "patch",
    body,
    prefer: options.prefer || "return=representation"
  });
}

export async function sbDelete(table, query, options = {}) {
  return supabaseRequest(`${table}?${query}`, {
    method: "delete",
    prefer: options.prefer || "return=representation"
  });
}

export async function sbRpc(functionName, body = {}) {
  return supabaseRequest(`rpc/${functionName}`, {
    method: "post",
    body
  });
}

export function eq(field, value) {
  return `${encodeURIComponent(field)}=eq.${encodeURIComponent(value)}`;
}

export function neq(field, value) {
  return `${encodeURIComponent(field)}=neq.${encodeURIComponent(value)}`;
}

export function isTrue(field) {
  return `${encodeURIComponent(field)}=eq.true`;
}

export function limit(value) {
  return `limit=${encodeURIComponent(value)}`;
}

export function order(field, direction = "asc") {
  return `order=${encodeURIComponent(field)}.${encodeURIComponent(direction)}`;
}

export function select(fields = "*") {
  return `select=${encodeURIComponent(fields)}`;
}

export function and(...parts) {
  return parts.filter(Boolean).join("&");
}
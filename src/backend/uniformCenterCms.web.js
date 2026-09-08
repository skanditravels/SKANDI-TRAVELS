import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

import {
  findAgentByMemberOrEmail,
  isAgentAuthorized
} from "./RIA/staffPortalAuth.repository.js";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const UNIFORM_IMAGE_BUCKET = "uniform-assets";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 12;

let configPromise;

function clean(value, max = 255) {
  return String(value ?? "").trim().slice(0, max);
}

function lower(value, max = 255) {
  return clean(value, max).toLowerCase();
}

function upper(value, max = 255) {
  return clean(value, max).toUpperCase();
}

function key(value, max = 100) {
  return lower(value, max)
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max);
}

function numberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function booleanValue(value, fallback = true) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 160));
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(v => clean(v, 80)).filter(Boolean);
  return clean(value, 2000).split(",").map(v => clean(v, 80)).filter(Boolean);
}

function now() {
  return new Date().toISOString();
}

function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function secretValue(result) {
  if (typeof result === "string") return result.trim();
  return clean(result?.value ?? result?.secretValue ?? result?.secret?.value ?? "", 20000);
}

async function readSecret(name) {
  try {
    return secretValue(await elevatedGetSecretValue(name));
  } catch (_) {
    return "";
  }
}

async function getSupabaseConfig() {
  if (!configPromise) {
    configPromise = (async () => {
      const url = (await readSecret("SUPABASE_URL")).replace(/\/+$/, "");
      const apiKey = (await readSecret("SUPABASE_SECRET_KEY")) || (await readSecret("SUPABASE_SERVICE_ROLE_KEY"));

      if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(url)) {
        throw new Error("SUPABASE_URL_INVALID");
      }
      if (!apiKey) {
        throw new Error("SUPABASE_SERVER_KEY_MISSING");
      }
      if (apiKey.startsWith("sb_publishable_")) {
        throw new Error("SUPABASE_SERVER_KEY_INVALID");
      }

      return {
        url,
        apiKey,
        modernSecret: apiKey.startsWith("sb_secret_")
      };
    })().catch(error => {
      configPromise = null;
      throw error;
    });
  }
  return configPromise;
}

function requestHeaders(apiKey, modernSecret, prefer = "") {
  const headers = {
    apikey: apiKey,
    "Content-Type": "application/json"
  };

  // Legacy JWT service_role keys require Bearer auth. Modern sb_secret_ keys do not.
  if (!modernSecret) headers.Authorization = `Bearer ${apiKey}`;
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function supabaseRequest(path, { method = "GET", body, prefer = "", headers = {} } = {}) {
  const { url, apiKey, modernSecret } = await getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${String(path).replace(/^\//, "")}`, {
    method,
    headers: {
      ...requestHeaders(apiKey, modernSecret, prefer),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      payload = raw;
    }
  }

  if (!response.ok) {
    const message = clean(payload?.message || payload?.error || payload?.hint || `SUPABASE_HTTP_${response.status}`, 500);
    throw new Error(message || `SUPABASE_HTTP_${response.status}`);
  }

  return payload;
}

function displayName(agent = {}) {
  return clean(
    agent.preferred_name ||
    agent.display_name ||
    [agent.first_name, agent.last_name].filter(Boolean).join(" ") ||
    agent.email ||
    agent.corporate_email_address ||
    agent.sk_id ||
    "Staff",
    180
  );
}

function agentSkId(agent = {}) {
  return clean(agent.sk_id || agent.agent_id, 80);
}

function agentEmail(agent = {}) {
  return lower(agent.corporate_email_address || agent.email, 240);
}

function roleKeyForAgent(agent = {}) {
  return upper(
    agent.payload?.uniformRole ||
    agent.payload?.role ||
    agent.job_title ||
    agent.department ||
    "ALL",
    100
  ).replace(/[^A-Z0-9_-]+/g, "_");
}

function canManageUniforms(agent = {}) {
  if (agent.can_manage === true) return true;
  if (agent.payload?.canManageUniforms === true || agent.payload?.uniformAdmin === true) return true;

  const title = lower(agent.job_title, 180);
  const department = upper(agent.department, 100);
  return ["ceo", "owner", "chief executive officer", "uniform manager", "uniform admin", "hr manager", "hr admin", "altea admin", "operations manager", "operations director"].includes(title) ||
    department.includes("XEC") || department.includes("HR") || department.includes("UNIFORM");
}

async function requireAgent() {
  const member = await currentMember.getMember().catch(() => null);
  if (!member) throw new Error("Staff login required.");

  const emailCandidates = member?.contactDetails?.emails;
  const email = lower(
    member.loginEmail ||
    member.email ||
    (Array.isArray(emailCandidates) ? emailCandidates[0] : emailCandidates) ||
    member?.profile?.email ||
    "",
    240
  );
  const memberId = clean(member._id || member.id, 160);

  const agent = await findAgentByMemberOrEmail({ memberId, email });
  if (!agent || !isAgentAuthorized(agent) || agent.active === false || agent.authorized === false || agent.portal_access === false) {
    throw new Error("You are not authorized to access Uniform Center.");
  }

  return { member, agent };
}

async function requireUniformAdmin() {
  const context = await requireAgent();
  if (!canManageUniforms(context.agent)) {
    throw new Error("Uniform Control admin permission required.");
  }
  return context;
}

function mapCategory(row = {}) {
  return {
    id: row.id || "",
    categoryKey: row.category_key || "",
    title: row.title || "",
    description: row.description || "",
    sortOrder: numberValue(row.sort_order, 100),
    active: row.active !== false,
    payload: row.payload || {}
  };
}

function mapCatalogItem(row = {}) {
  const gallery = Array.isArray(row.image_gallery) ? row.image_gallery : [];
  const imageUrls = gallery
    .map(image => typeof image === "string" ? image : (image?.url || image?.imageUrl || ""))
    .filter(Boolean);
  if (!imageUrls.length && row.image_url) imageUrls.push(row.image_url);

  return {
    id: row.id || "",
    _id: row.id || "",
    itemId: row.id || "",
    itemCode: row.item_code || "",
    title: row.title || "",
    categoryKey: row.category_key || "",
    category: row.category_title || row.category_key || "",
    categoryTitle: row.category_title || "",
    pointsCost: numberValue(row.points_cost, 0),
    stockStatus: row.stock_status || "IN_STOCK",
    active: row.active !== false,
    sizes: Array.isArray(row.sizes) ? row.sizes.map(v => String(v)) : [],
    imageUrl: row.image_url || imageUrls[0] || "",
    imageStoragePath: row.image_storage_path || "",
    imageMimeType: row.image_mime_type || "",
    imageUploadedAt: row.image_uploaded_at || "",
    imageGallery: gallery,
    imageUrls,
    description: row.description || "",
    payload: row.payload || {},
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function mapRule(row = {}) {
  return {
    id: row.id || "",
    ruleKey: row.rule_key || "",
    title: row.title || "",
    roleKey: row.role_key || row.role || "ALL",
    monthlyPoints: numberValue(row.monthly_points, 0),
    yearlyPoints: numberValue(row.yearly_points, 0),
    maxItems: numberValue(row.max_items, 0),
    renewalMonths: numberValue(row.renewal_months, 0),
    summary: row.summary || "",
    active: row.active !== false,
    sortOrder: numberValue(row.sort_order, 100),
    payload: row.payload || {}
  };
}

function mapWallet(row = {}) {
  return {
    id: row.id || "",
    walletId: row.id || "",
    agentUserId: row.agent_user_id || "",
    skId: row.sk_id || "",
    email: row.email || "",
    displayName: row.display_name || "",
    availablePoints: numberValue(row.available_points, 0),
    heldPoints: numberValue(row.held_points, 0),
    spentPoints: numberValue(row.spent_points, 0),
    status: row.status || "active",
    payload: row.payload || {},
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function mapOrderItem(row = {}) {
  return {
    id: row.id || "",
    itemId: row.item_id || row.product_id || "",
    itemCode: row.item_code || "",
    title: row.title || "",
    category: row.category || "",
    size: row.size || "",
    quantity: numberValue(row.quantity, 1),
    pointsCost: numberValue(row.points_cost, 0),
    linePoints: numberValue(row.line_points, 0),
    payload: row.payload || {}
  };
}

function mapOrder(row = {}, items = []) {
  return {
    id: row.id || "",
    orderId: row.id || "",
    orderNumber: row.order_number || row.order_id || "",
    agentUserId: row.agent_user_id || "",
    skId: row.sk_id || "",
    staffName: row.staff_name || "",
    email: row.email || "",
    status: upper(row.status || "PENDING", 80),
    totalPoints: numberValue(row.total_points ?? row.points_total, 0),
    note: row.note || row.order_note || "",
    managerNote: row.action_note || row.manager_note || "",
    walletId: row.wallet_id || "",
    walletEffectStatus: row.wallet_effect_status || "",
    summary: items.length
      ? items.map(item => `${item.quantity || 1}× ${item.title}${item.size ? ` (${item.size})` : ""}`).join(", ")
      : (row.note || row.order_note || ""),
    items,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function mapPolicy(row = {}) {
  if (!row?.id) return null;
  return {
    id: row.id,
    policyId: row.id,
    policyKey: row.policy_key || "",
    title: row.title || "",
    policyVersion: row.policy_version || "",
    version: row.policy_version || "",
    body: row.body || "",
    active: row.active !== false,
    payload: row.payload || {}
  };
}

function mapAudit(row = {}) {
  return {
    id: row.id || "",
    eventType: row.event_type || "",
    entityTable: row.entity_table || "",
    entityId: row.entity_id || "",
    orderNumber: row.order_number || "",
    actorAgentUserId: row.actor_agent_user_id || "",
    actorSkId: row.actor_sk_id || "",
    actorName: row.actor_name || "",
    message: row.message || "",
    payload: row.payload || {},
    createdAt: row.created_at || ""
  };
}

async function audit(eventType, data = {}, agent = {}) {
  try {
    await supabaseRequest("uniform_audit", {
      method: "POST",
      body: {
        event_type: clean(eventType, 120),
        entity_table: clean(data.entityTable, 120),
        entity_id: clean(data.entityId, 160),
        order_number: clean(data.orderNumber, 80),
        actor_agent_user_id: isUuid(agent?.id) ? agent.id : null,
        actor_sk_id: agentSkId(agent),
        actor_name: displayName(agent),
        message: clean(data.message || eventType, 1000),
        payload: data.payload || data || {}
      },
      prefer: "return=minimal"
    });
  } catch (_) {
    // Do not fail the user action only because audit logging failed.
  }
}

async function listOrderItems(orderIds = []) {
  const ids = orderIds.filter(isUuid);
  if (!ids.length) return {};

  const rows = await supabaseRequest(
    `uniform_order_items?select=*&order_id=in.(${ids.map(encodeURIComponent).join(",")})&order=created_at.asc&limit=2000`
  );

  return (rows || []).reduce((output, row) => {
    const id = String(row.order_id || "");
    if (!output[id]) output[id] = [];
    output[id].push(mapOrderItem(row));
    return output;
  }, {});
}

async function listOrders(path = "uniform_orders?select=*&order=created_at.desc&limit=500") {
  const rows = await supabaseRequest(path);
  const itemsByOrder = await listOrderItems((rows || []).map(row => row.id));
  return (rows || []).map(row => mapOrder(row, itemsByOrder[row.id] || []));
}

async function latestPolicy() {
  const rows = await supabaseRequest("uniform_policies?select=*&active=eq.true&order=created_at.desc&limit=1");
  return mapPolicy(first(rows));
}

async function allowanceForAgent(agent = {}) {
  const roleKey = roleKeyForAgent(agent);
  const rows = await supabaseRequest(
    `uniform_allowance_rules?select=*&active=eq.true&or=(role_key.eq.${encodeURIComponent(roleKey)},role_key.eq.ALL)&order=role_key.desc,sort_order.asc&limit=1`
  );
  return first(rows);
}

async function ensureWallet(agent = {}) {
  if (!isUuid(agent?.id)) throw new Error("Staff profile is missing an agent ID.");

  const existing = await supabaseRequest(
    `uniform_wallets?select=*&agent_user_id=eq.${encodeURIComponent(agent.id)}&limit=1`
  );
  if (first(existing)) return first(existing);

  const rule = await allowanceForAgent(agent).catch(() => null);
  const created = await supabaseRequest("uniform_wallets?on_conflict=agent_user_id", {
    method: "POST",
    body: {
      agent_user_id: agent.id,
      sk_id: agentSkId(agent),
      email: agentEmail(agent),
      display_name: displayName(agent),
      available_points: Math.max(0, numberValue(rule?.monthly_points, 0)),
      held_points: 0,
      spent_points: 0,
      status: "active",
      payload: {
        initializedFromRule: rule?.rule_key || "",
        initializedAt: now()
      },
      created_by_agent_user_id: agent.id
    },
    prefer: "resolution=merge-duplicates,return=representation"
  });
  return first(created);
}

async function findWallet(input = {}) {
  const filters = [];
  const agentUserId = clean(input.agentUserId || input.agent_user_id, 160);
  const skId = upper(input.skId || input.sk_id, 80);
  const email = lower(input.email, 240);

  if (isUuid(agentUserId)) filters.push(`agent_user_id.eq.${encodeURIComponent(agentUserId)}`);
  if (skId) filters.push(`sk_id.eq.${encodeURIComponent(skId)}`);
  if (email) filters.push(`email.eq.${encodeURIComponent(email)}`);
  if (!filters.length) return null;

  const rows = await supabaseRequest(`uniform_wallets?select=*&or=(${filters.join(",")})&limit=1`);
  return first(rows);
}

async function findAgent(input = {}) {
  const filters = [];
  const skId = upper(input.skId || input.sk_id, 80);
  const email = lower(input.email, 240);

  if (skId) filters.push(`sk_id.eq.${encodeURIComponent(skId)}`);
  if (email) {
    filters.push(`email.eq.${encodeURIComponent(email)}`);
    filters.push(`corporate_email_address.eq.${encodeURIComponent(email)}`);
  }
  if (!filters.length) return null;

  const rows = await supabaseRequest(`agent_users?select=*&or=(${filters.join(",")})&limit=1`);
  return first(rows);
}

async function patchWallet(wallet, deltas = {}, meta = {}, actor = {}) {
  const available = numberValue(wallet.available_points, 0) + numberValue(deltas.available, 0);
  const held = numberValue(wallet.held_points, 0) + numberValue(deltas.held, 0);
  const spent = numberValue(wallet.spent_points, 0) + numberValue(deltas.spent, 0);

  if (available < 0 || held < 0 || spent < 0) {
    throw new Error("Uniform wallet balance cannot go below zero.");
  }

  const updated = first(await supabaseRequest(`uniform_wallets?id=eq.${encodeURIComponent(wallet.id)}`, {
    method: "PATCH",
    body: {
      available_points: available,
      held_points: held,
      spent_points: spent,
      updated_at: now()
    },
    prefer: "return=representation"
  })) || wallet;

  await supabaseRequest("uniform_wallet_ledger", {
    method: "POST",
    body: {
      wallet_id: wallet.id,
      agent_user_id: wallet.agent_user_id || null,
      sk_id: wallet.sk_id || "",
      email: wallet.email || "",
      event_type: clean(meta.eventType || "ADJUSTMENT", 120),
      points_delta: numberValue(meta.pointsDelta ?? deltas.available, 0),
      available_after: available,
      held_after: held,
      spent_after: spent,
      order_id: isUuid(meta.orderId) ? meta.orderId : null,
      order_number: clean(meta.orderNumber, 80),
      reason: clean(meta.reason, 1000),
      payload: meta.payload || {},
      created_by_agent_user_id: isUuid(actor?.id) ? actor.id : null,
      created_by_name: displayName(actor)
    },
    prefer: "return=minimal"
  });

  return updated;
}

function orderNumber() {
  const stamp = now().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UNI-${stamp}-${random}`;
}

async function catalogItemByIdOrCode(value) {
  const input = clean(value, 160);
  if (!input) return null;

  const path = isUuid(input)
    ? `uniform_catalog_items?select=*&id=eq.${encodeURIComponent(input)}&active=eq.true&stock_status=neq.DELETED&limit=1`
    : `uniform_catalog_items?select=*&item_code=eq.${encodeURIComponent(upper(input, 80))}&active=eq.true&stock_status=neq.DELETED&limit=1`;

  return first(await supabaseRequest(path));
}

function normalizeOrderAction(value) {
  const status = upper(value, 80);
  const allowed = new Set(["PENDING", "APPROVED", "REJECTED", "FULFILLMENT_READY", "COMPLETED", "CANCELLED", "RETURNED"]);
  return allowed.has(status) ? status : "";
}

function normalizeGallery(value) {
  const input = Array.isArray(value) ? value : (value ? [value] : []);
  const output = [];

  for (const entry of input) {
    const image = typeof entry === "string" ? { url: entry } : (entry || {});
    const url = clean(image.url || image.imageUrl || image.image_url, 1000);
    if (!url || url.startsWith("data:")) continue;

    output.push({
      url,
      imageUrl: url,
      storagePath: clean(image.storagePath || image.imageStoragePath || image.storage_path, 1000),
      mimeType: clean(image.mimeType || image.imageMimeType || image.mime_type, 120),
      fileName: clean(image.fileName || image.file_name, 240),
      alt: clean(image.alt || image.title, 240),
      sortOrder: output.length + 1,
      uploadedAt: clean(image.uploadedAt || image.uploaded_at || now(), 80)
    });

    if (output.length >= MAX_GALLERY_IMAGES) break;
  }

  return output;
}

function itemSavePayload(item = {}, agent = {}) {
  const categoryTitle = clean(item.categoryTitle || item.category || item.category_title, 180);
  const categoryKey = key(item.categoryKey || item.category_key || categoryTitle, 100);
  const gallery = normalizeGallery(item.imageGallery || item.image_gallery || item.images || item.imageUrls || []);
  const main = gallery[0] || {};
  const imageUrl = clean(item.imageUrl || item.image_url || main.url, 1000);
  const imageStoragePath = clean(item.imageStoragePath || item.image_storage_path || main.storagePath, 1000);
  const imageMimeType = clean(item.imageMimeType || item.image_mime_type || main.mimeType, 120);

  if (imageUrl.startsWith("data:")) {
    throw new Error("Upload the image before saving the uniform item.");
  }

  return {
    ...(isUuid(item.itemId || item.id || item._id) ? { id: item.itemId || item.id || item._id } : {}),
    item_code: upper(item.itemCode || item.item_code, 80) || null,
    title: clean(item.title, 240),
    category_key: categoryKey || null,
    category_title: categoryTitle || null,
    points_cost: Math.max(0, numberValue(item.pointsCost ?? item.points_cost, 0)),
    stock_status: upper(item.stockStatus || item.stock_status || "IN_STOCK", 80),
    active: booleanValue(item.active, true),
    sizes: asArray(item.sizes),
    image_url: imageUrl || null,
    image_storage_path: imageStoragePath || null,
    image_mime_type: imageMimeType || null,
    image_uploaded_at: imageUrl ? (clean(item.imageUploadedAt || item.image_uploaded_at, 80) || now()) : null,
    image_gallery: gallery,
    description: clean(item.description, 10000),
    payload: {
      ...(item.payload && typeof item.payload === "object" ? item.payload : {}),
      lastEditor: {
        agentUserId: agent?.id || "",
        skId: agentSkId(agent),
        name: displayName(agent),
        at: now()
      }
    },
    created_by_agent_user_id: isUuid(agent?.id) ? agent.id : null,
    updated_at: now()
  };
}

function imageExtension(mimeType) {
  const mime = lower(mimeType, 120);
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "";
}

function extractImage(input = {}) {
  const dataUrl = clean(input.dataUrl || input.data_url, 8 * 1024 * 1024);
  if (dataUrl) {
    const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) throw new Error("Invalid image data.");
    return { mimeType: lower(match[1], 120), base64: match[2] };
  }
  return {
    mimeType: lower(input.mimeType || input.mime_type, 120),
    base64: clean(input.base64, 8 * 1024 * 1024)
  };
}

function base64ToBytes(base64 = "") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const input = String(base64 || "").replace(/[^A-Za-z0-9+/=]/g, "");
  const bytes = [];

  for (let i = 0; i < input.length; i += 4) {
    const c1 = chars.indexOf(input[i]);
    const c2 = chars.indexOf(input[i + 1]);
    const c3 = input[i + 2] === "=" ? -1 : chars.indexOf(input[i + 2]);
    const c4 = input[i + 3] === "=" ? -1 : chars.indexOf(input[i + 3]);
    if (c1 < 0 || c2 < 0) continue;

    const n = (c1 << 18) | (c2 << 12) | ((c3 < 0 ? 0 : c3) << 6) | (c4 < 0 ? 0 : c4);
    bytes.push((n >> 16) & 255);
    if (c3 >= 0) bytes.push((n >> 8) & 255);
    if (c4 >= 0) bytes.push(n & 255);
  }

  return new Uint8Array(bytes);
}

function encodedStoragePath(path) {
  return String(path || "").split("/").map(encodeURIComponent).join("/");
}

async function uploadImage(input = {}) {
  const { url, apiKey, modernSecret } = await getSupabaseConfig();
  const { mimeType, base64 } = extractImage(input);
  const extension = imageExtension(mimeType);
  if (!extension) throw new Error("Only PNG, JPG/JPEG, WebP and GIF images are allowed.");
  if (!base64) throw new Error("Image file data is required.");

  const bytes = base64ToBytes(base64);
  if (!bytes.length) throw new Error("Image file data is empty.");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image is too large. Maximum size is 5 MB.");

  const itemPart = key(input.itemCode || input.itemId || input.title || "uniform-item", 80) || "uniform-item";
  const stamp = now().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  const objectPath = `catalog/${itemPart}-${stamp}-${random}.${extension}`;

  const headers = {
    apikey: apiKey,
    "Content-Type": mimeType,
    "x-upsert": "true",
    "Cache-Control": "3600"
  };
  if (!modernSecret) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(UNIFORM_IMAGE_BUCKET)}/${encodedStoragePath(objectPath)}`, {
    method: "POST",
    headers,
    body: bytes
  });

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try { payload = JSON.parse(raw); } catch (_) { payload = raw; }
  }
  if (!response.ok) {
    throw new Error(clean(payload?.message || payload?.error || `UNIFORM_IMAGE_UPLOAD_${response.status}`, 500));
  }

  const publicUrl = `${url}/storage/v1/object/public/${encodeURIComponent(UNIFORM_IMAGE_BUCKET)}/${encodedStoragePath(objectPath)}`;
  return {
    url: publicUrl,
    imageUrl: publicUrl,
    storagePath: objectPath,
    mimeType,
    size: bytes.length,
    fileName: clean(input.fileName || input.file_name, 240),
    uploadedAt: now()
  };
}

export const getUniformAdminBootstrap = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireUniformAdmin();
  const query = clean(input.query, 120);

  const catalogParams = ["select=*", "stock_status=neq.DELETED", "order=title.asc", "limit=1000"];
  if (query) {
    const q = encodeURIComponent(query);
    catalogParams.push(`or=(title.ilike.*${q}*,item_code.ilike.*${q}*,category_title.ilike.*${q}*)`);
  }

  const [catalogRows, categoryRows, ruleRows, walletRows, orders, auditRows] = await Promise.all([
    supabaseRequest(`uniform_catalog_items?${catalogParams.join("&")}`),
    supabaseRequest("uniform_categories?select=*&order=sort_order.asc,title.asc&limit=1000"),
    supabaseRequest("uniform_allowance_rules?select=*&order=sort_order.asc,title.asc&limit=1000"),
    supabaseRequest("uniform_wallets?select=*&order=updated_at.desc&limit=1000"),
    listOrders(),
    supabaseRequest("uniform_audit?select=*&order=created_at.desc&limit=300")
  ]);

  const catalog = (catalogRows || []).map(mapCatalogItem);
  const categories = (categoryRows || []).map(mapCategory);
  const wallets = (walletRows || []).map(mapWallet);
  const allowanceRules = (ruleRows || []).map(mapRule);

  return {
    ok: true,
    session: {
      id: agent.id || "",
      skId: agentSkId(agent),
      displayName: displayName(agent),
      email: agentEmail(agent),
      jobTitle: agent.job_title || "",
      department: agent.department || "",
      canManageUniforms: true
    },
    stats: {
      catalog: catalog.length,
      openOrders: orders.filter(order => !["COMPLETED", "REJECTED", "CANCELLED", "RETURNED"].includes(order.status)).length,
      wallets: wallets.length,
      categories: categories.length
    },
    orders,
    catalog,
    categories,
    allowanceRules,
    wallets,
    audit: (auditRows || []).map(mapAudit),
    lastSync: now(),
    dataSource: "SUPABASE"
  };
});

// REPLACE ONLY the existing adminUploadUniformImage export block with this.
// Do NOT add any new named exports for signed uploads.

export const adminUploadUniformImage = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const mode = cleanUpper(input.mode || "", 40);

      // ------------------------------------------------------------
      // MODE 1: Create a time-limited signed Supabase upload URL.
      // ------------------------------------------------------------
      if (mode === "CREATE_SIGNED_UPLOAD") {
        await requireUniformAdmin();

        const requestId = cleanText(input.requestId || input.request_id || "", 120);
        const fileName = cleanText(input.fileName || input.file_name || "", 240);
        const mimeType = cleanText(input.mimeType || input.mime_type || "", 120).toLowerCase();
        const size = Number(input.size || input.fileSize || input.file_size || 0);
        const extension = imageExtension(mimeType);

        if (!extension) {
          throw new Error("Only PNG, JPG, WebP and GIF images are allowed.");
        }

        if (!Number.isFinite(size) || size <= 0) {
          throw new Error("Image file size is required.");
        }

        if (size > 5 * 1024 * 1024) {
          throw new Error("Image is too large. Maximum size is 5 MB.");
        }

        const itemPart =
          cleanKey(
            input.itemCode ||
            input.item_code ||
            input.itemId ||
            input.item_id ||
            input.title ||
            "uniform-item",
            80
          ) || "uniform-item";

        const stamp = new Date()
          .toISOString()
          .replace(/[-:.TZ]/g, "")
          .slice(0, 14);

        const random = Math.random().toString(36).slice(2, 10);
        const objectPath = `catalog/${itemPart}-${stamp}-${random}.${extension}`;
        const { url, key } = await getSupabaseConfig();

        const response = await fetch(
          `${url}/storage/v1/object/upload/sign/${encodeURIComponent(UNIFORM_IMAGE_BUCKET)}/${storageObjectPath(objectPath)}`,
          {
            method: "POST",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: "{}"
          }
        );

        const text = await response.text();
        let data = null;

        if (text) {
          try {
            data = JSON.parse(text);
          } catch (err) {
            data = text;
          }
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            `Could not create signed Uniform image upload: ${response.status}`
          );
        }

        const returnedUrl = String(
          data?.url ||
          data?.signedUrl ||
          data?.signedURL ||
          ""
        ).trim();

        if (!returnedUrl) {
          throw new Error("Supabase did not return a signed upload URL.");
        }

        let signedUrl = returnedUrl;

        if (!/^https?:\/\//i.test(signedUrl)) {
          if (signedUrl.startsWith("/storage/v1/")) {
            signedUrl = `${url}${signedUrl}`;
          } else if (signedUrl.startsWith("/object/")) {
            signedUrl = `${url}/storage/v1${signedUrl}`;
          } else {
            signedUrl = `${url}/storage/v1/${signedUrl.replace(/^\/+/, "")}`;
          }
        }

        const tokenMatch = signedUrl.match(/[?&]token=([^&]+)/i);
        const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : "";

        return {
          ok: true,
          mode,
          requestId,
          fileName,
          mimeType,
          size,
          bucket: UNIFORM_IMAGE_BUCKET,
          objectPath,
          storagePath: objectPath,
          signedUrl,
          token,
          imageUrl: storagePublicUrl(UNIFORM_IMAGE_BUCKET, objectPath),
          publicUrl: storagePublicUrl(UNIFORM_IMAGE_BUCKET, objectPath)
        };
      }

      // ------------------------------------------------------------
      // MODE 2: Browser completed direct binary upload; audit/finalize.
      // ------------------------------------------------------------
      if (mode === "COMPLETE_SIGNED_UPLOAD") {
        const { agent } = await requireUniformAdmin();

        const requestId = cleanText(input.requestId || input.request_id || "", 120);
        const objectPath = cleanText(
          input.objectPath ||
          input.storagePath ||
          input.object_path ||
          input.storage_path ||
          "",
          1000
        );
        const fileName = cleanText(input.fileName || input.file_name || "", 240);
        const mimeType = cleanText(input.mimeType || input.mime_type || "", 120).toLowerCase();
        const size = Number(input.size || input.fileSize || input.file_size || 0);
        const itemId = cleanText(input.itemId || input.item_id || "", 160);
        const extension = imageExtension(mimeType);

        if (!objectPath || !objectPath.startsWith("catalog/")) {
          throw new Error("Invalid Uniform image storage path.");
        }

        if (!extension) {
          throw new Error("Invalid Uniform image MIME type.");
        }

        if (!objectPath.toLowerCase().endsWith(`.${extension}`)) {
          throw new Error("Uniform image extension does not match its MIME type.");
        }

        if (!Number.isFinite(size) || size <= 0 || size > 5 * 1024 * 1024) {
          throw new Error("Invalid Uniform image size.");
        }

        const imageUrl = storagePublicUrl(UNIFORM_IMAGE_BUCKET, objectPath);
        const uploadedAt = new Date().toISOString();

        await logAudit("uniform_image_uploaded", {
          entityTable: "uniform_catalog_items",
          entityId: itemId,
          message: "Uniform catalog image uploaded with signed Storage URL.",
          payload: {
            requestId,
            objectPath,
            imageUrl,
            fileName,
            mimeType,
            size
          }
        }, agent);

        return {
          ok: true,
          mode,
          requestId,
          imageUrl,
          url: imageUrl,
          storagePath: objectPath,
          objectPath,
          mimeType,
          size,
          fileName,
          image: {
            url: imageUrl,
            imageUrl,
            storagePath: objectPath,
            mimeType,
            fileName,
            uploadedAt
          }
        };
      }

      // ------------------------------------------------------------
      // LEGACY MODE: keep old Base64 upload working as a fallback.
      // ------------------------------------------------------------
      const { agent } = await requireUniformAdmin();
      const uploaded = await uploadUniformImageToStorage(input);

      await logAudit("uniform_image_uploaded", {
        entityTable: "uniform_catalog_items",
        entityId: cleanText(input.itemId || input.item_id || "", 160),
        message: "Uniform catalog image uploaded.",
        payload: {
          objectPath: uploaded.objectPath,
          imageUrl: uploaded.url,
          mimeType: uploaded.mimeType,
          size: uploaded.size
        }
      }, agent);

      return {
        ok: true,
        imageUrl: uploaded.url,
        url: uploaded.url,
        storagePath: uploaded.objectPath,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        image: {
          url: uploaded.url,
          imageUrl: uploaded.url,
          storagePath: uploaded.objectPath,
          mimeType: uploaded.mimeType,
          fileName: cleanText(input.fileName || input.file_name || "", 240),
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

// /src/backend/SKANDI_CORE/uniform.js
// SKANDI Uniform Domain — canonical business core.
// B-011.28 — employee Uniform Center + Apparel-ERP Uniform Control convergence.
//
// Owns Uniform business rules only. Raw Supabase transport, staff identity,
// platform assets and cross-system authorization remain in shared SKANDI_CORE services.
// Existing Uniform tables and JSON payloads are preserved; no third data model is created.

import { randomUUID } from "crypto";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import {
  getStaffPortalSessionCore,
  requireStaffPortalSessionCore
} from "backend/SKANDI_CORE/staffAuth";
import {
  listAssetsCore,
  checkAssetDuplicateCore,
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  getAssetAccessUrlCore,
  registerAssetUsageCore
} from "backend/SKANDI_CORE/assets";
import {
  text,
  lower,
  upper,
  stringArray,
  record,
  safeNumber,
  safeBoolean
} from "backend/SKANDI_CORE/platformValidation";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";

export const UNIFORM_CORE_VERSION = "B-011.29-UNIFORM-SKU-FAMILY";

const TABLE = Object.freeze({
  catalog: "uniform_catalog_items",
  categories: "uniform_categories",
  orders: "uniform_orders",
  orderItems: "uniform_order_items",
  wallets: "uniform_wallets",
  walletLedger: "uniform_wallet_ledger",
  rules: "uniform_allowance_rules",
  policies: "uniform_policies",
  acknowledgements: "uniform_policy_acknowledgements",
  audit: "uniform_audit",
  agents: "agent_users"
});

const CLOSED_ORDER_STATES = new Set(["COMPLETED", "REJECTED", "CANCELLED", "RETURNED"]);
const OPEN_REPLACEMENT_STATES = new Set([
  "PENDING", "SUBMITTED", "MANAGER_REVIEW", "APPROVED", "FULFILLMENT_READY",
  "PICKING", "PICKED", "PACKING", "READY_FOR_PICKUP", "SHIPPED", "PARTIAL",
  "RETURN_REQUESTED"
]);
const ORDER_STATES = new Set([
  "PENDING", "SUBMITTED", "MANAGER_REVIEW", "APPROVED", "FULFILLMENT_READY",
  "PICKING", "PICKED", "PACKING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED",
  "COMPLETED", "PARTIAL", "RETURN_REQUESTED", "RETURNED", "REJECTED", "CANCELLED"
]);
const ADMIN_ACCESS_ROLES = new Set(["UNIFORM_MANAGER", "SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const MAX_IMAGES = 12;

const arr = value => Array.isArray(value) ? value : [];
const qeq = value => `eq.${text(value, 600)}`;
const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text(value, 80));
const int = (value, fallback = 0) => Math.trunc(safeNumber(value, fallback));
const now = () => new Date().toISOString();

function cleanList(value, { maxItems = 100, itemMax = 160, normalize = false } = {}) {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(",");
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const cleaned = normalize
      ? upper(item, itemMax).replace(/[\s-]+/g, "_")
      : text(item, itemMax);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= maxItems) break;
  }
  return out;
}

function cleanHex(value) {
  const candidate = text(value, 16);
  const full = candidate.startsWith("#") ? candidate : `#${candidate}`;
  return /^#[0-9A-F]{6}$/i.test(full) ? full.toUpperCase() : "";
}

function mergePayload(existing, incoming, snapshot = {}) {
  const oldPayload = record(existing);
  const newPayload = record(incoming);
  const cleanSnapshot = { ...record(snapshot) };
  delete cleanSnapshot.payload;
  return {
    ...oldPayload,
    ...newPayload,
    ...cleanSnapshot,
    _uniformConvergence: {
      ...record(oldPayload._uniformConvergence),
      version: UNIFORM_CORE_VERSION,
      updatedAt: now()
    }
  };
}

async function select(table, query = {}) {
  const result = await restRequest({ table, method: "GET", query, prefer: "" });
  return arr(result);
}

async function insert(table, body, prefer = "return=representation") {
  return arr(await restRequest({ table, method: "POST", body, prefer }));
}

async function patch(table, query, body, prefer = "return=representation") {
  return arr(await restRequest({ table, method: "PATCH", query, body, prefer }));
}

function profileFromSession(session = {}) {
  const p = record(session.profile);
  return {
    id: text(p.id, 80),
    agentUserId: text(p.agentUserUuid || p.agentUserId || p.id, 80),
    agentId: text(p.agentId || p.skId, 32),
    skId: text(p.skId || p.agentId, 32),
    displayName: text(p.displayName || p.fullName, 240),
    email: lower(p.email || p.corporateEmailAddress, 320),
    role: text(p.accessRole || session.accessRole, 100),
    accessRole: text(p.accessRole || session.accessRole, 100),
    roleId: text(p.roleId, 80),
    jobCode: text(p.jobCode, 80),
    jobTitle: text(p.jobTitle || p.position, 180),
    position: text(p.position || p.jobTitle, 180),
    departmentId: text(p.departmentId, 80),
    departmentCode: text(p.departmentCode, 80),
    department: text(p.department, 180),
    baseCode: text(p.baseCode, 80),
    base: text(p.base || p.station, 180),
    station: text(p.station || p.base, 180),
    employmentStatus: text(p.employmentStatus, 80)
  };
}

function hasAdminAccess(session = {}) {
  if (session.isSystemAdmin === true) return true;
  if (ADMIN_ACCESS_ROLES.has(upper(session.accessRole, 100))) return true;
  const groups = new Set(cleanList(session.permissionGroups, { normalize: true }).map(lower));
  const keys = new Set([
    ...cleanList(session.permissionKeys, { normalize: true }),
    ...cleanList(session.allowedApps, { normalize: true })
  ].map(lower));
  return groups.has("uniform_admin") || keys.has("uniform_manage") || keys.has("uniform_admin");
}

async function requireUniformSession({ admin = false } = {}) {
  const session = await requireStaffPortalSessionCore();
  if (admin && !hasAdminAccess(session)) {
    throw new SkandiError("UNIFORM_ADMIN_ACCESS_REQUIRED", "Uniform Control admin permission required.", {
      publicMessage: "Uniform Control admin permission required."
    });
  }
  return session;
}

function assetName(asset = {}) {
  return text(asset.originalName || asset.displayName || asset.storagePath || asset.publicUrl, 1000)
    .split(/[/?#]/).filter(Boolean).pop() || "";
}

function assetStem(asset = {}) {
  return assetName(asset).replace(IMAGE_EXT, "").replace(/\.[A-Za-z0-9]+$/, "");
}

function productAssets(row = {}, assets = []) {
  const sku = upper(row.item_code, 80);
  const payload = record(row.payload);
  const requestedIds = cleanList(
    payload.assetIds || payload.asset_ids || payload.imageAssetIds || record(payload.erp).assetIds,
    { maxItems: MAX_IMAGES, itemMax: 80 }
  );

  const byId = new Map(assets.map(a => [text(a.id, 80), a]));
  const selected = [];
  const seen = new Set();
  for (const id of requestedIds) {
    const asset = byId.get(id);
    if (!asset?.publicUrl || seen.has(asset.id)) continue;
    selected.push(asset);
    seen.add(asset.id);
  }

  const matched = assets
    .filter(a => a.publicUrl && IMAGE_EXT.test(assetName(a)))
    .filter(a => {
      const stem = upper(assetStem(a), 160);
      return sku && (stem === sku || stem.startsWith(`${sku}-`));
    })
    .sort((a, b) => {
      const ax = upper(assetStem(a), 160) === sku ? 0 : 1;
      const bx = upper(assetStem(b), 160) === sku ? 0 : 1;
      return ax - bx || assetName(a).localeCompare(assetName(b));
    });

  for (const asset of matched) {
    if (seen.has(asset.id)) continue;
    selected.push(asset);
    seen.add(asset.id);
    if (selected.length >= MAX_IMAGES) break;
  }

  const gallery = selected.slice(0, MAX_IMAGES).map((asset, index) => ({
    assetId: text(asset.id, 80),
    assetCode: text(asset.assetCode, 120),
    url: text(asset.publicUrl || asset.previewUrl, 5000),
    imageUrl: text(asset.publicUrl || asset.previewUrl, 5000),
    fileName: assetName(asset),
    mimeType: text(asset.mimeType, 180),
    storagePath: text(asset.storagePath, 3000),
    alt: text(asset.altText || row.title || row.item_code, 1000),
    sortOrder: index + 1,
    uploadedAt: text(asset.createdAt || asset.updatedAt, 100)
  }));

  return {
    gallery,
    exactMainFound: matched.some(a => upper(assetStem(a), 160) === sku),
    matchedFiles: matched.map(a => text(a.storagePath, 3000)),
    assetIds: gallery.map(a => a.assetId).filter(Boolean)
  };
}

async function uniformAssets() {
  try {
    const result = await listAssetsCore({ search: "uniform" });
    return arr(result.assets).filter(a => a.status === "ACTIVE" && a.publicUrl);
  } catch (_) {
    return [];
  }
}

function mapCategory(row = {}) {
  return {
    id: text(row.id, 80),
    categoryKey: text(row.category_key, 120),
    title: text(row.title, 240),
    description: text(row.description, 3000),
    sortOrder: int(row.sort_order, 100),
    active: row.active !== false,
    payload: record(row.payload)
  };
}

function mapCatalogItem(row = {}, assets = []) {
  const assetSet = productAssets(row, assets);
  const primary = assetSet.gallery[0] || {};
  const payload = record(row.payload);
  return {
    _id: text(row.id, 80),
    itemId: text(row.id, 80),
    itemCode: text(row.item_code, 80),
    title: text(row.title, 240),
    categoryKey: text(row.category_key, 120),
    category: text(row.category_title || row.category_key, 180),
    subCategory: text(row.sub_category, 180),
    styleGroup: text(row.style_group || row.item_code, 120),
    colorName: text(row.color_name, 120),
    colorHex: cleanHex(row.color_hex),
    fitOptions: cleanList(row.fit_options),
    initialIssueQuantity: Math.max(0, int(row.initial_issue_quantity, 0)),
    replacementCycleMonths: Math.max(0, int(row.replacement_cycle_months, 0)),
    availableRoles: cleanList(row.available_roles, { normalize: true }),
    availableDepartments: cleanList(row.available_departments, { normalize: true }),
    availableBases: cleanList(row.available_bases, { normalize: true }),
    itemRegulations: text(row.item_regulations, 12000),
    pointsCost: Math.max(0, int(row.points_cost, 0)),
    stockStatus: upper(row.stock_status || "IN_STOCK", 80),
    active: row.active !== false,
    sizes: cleanList(row.sizes, { maxItems: 200, itemMax: 80 }),
    imageUrl: text(primary.url || row.image_url, 5000),
    imageStoragePath: text(primary.storagePath || row.image_storage_path, 3000),
    imageMimeType: text(primary.mimeType || row.image_mime_type, 180),
    imageUploadedAt: text(primary.uploadedAt || row.image_uploaded_at, 100),
    imageGallery: assetSet.gallery.length ? assetSet.gallery : arr(row.image_gallery),
    imageUrls: (assetSet.gallery.length ? assetSet.gallery : arr(row.image_gallery))
      .map(image => typeof image === "string" ? image : image?.url || image?.imageUrl)
      .filter(Boolean),
    imageAssetSource: assetSet.gallery.length ? "SKANDI_ASSET_LIBRARY" : "LEGACY_CATALOG_FIELDS",
    imageAssetCount: assetSet.gallery.length || arr(row.image_gallery).length,
    imageAssetMainExact: assetSet.exactMainFound,
    imageAssetFiles: assetSet.matchedFiles,
    imageAssetIds: assetSet.assetIds,
    description: text(row.description, 8000),
    details: text(row.details, 8000),
    careInstructions: text(row.care_instructions, 8000),
    payload,
    erp: record(payload.erp),
    createdAt: text(row.created_at, 100),
    updatedAt: text(row.updated_at, 100)
  };
}

function mapRule(row = {}) {
  return {
    id: text(row.id, 80),
    ruleKey: text(row.rule_key, 120),
    title: text(row.title, 240),
    roleKey: text(row.role_key || row.role || "ALL", 120),
    monthlyPoints: int(row.monthly_points, 0),
    yearlyPoints: row.yearly_points == null ? null : int(row.yearly_points, 0),
    maxItems: row.max_items == null ? null : int(row.max_items, 0),
    renewalMonths: row.renewal_months == null ? null : int(row.renewal_months, 0),
    summary: text(row.summary, 3000),
    status: text(row.status, 80),
    active: row.active !== false,
    sortOrder: int(row.sort_order, 100),
    payload: record(row.payload)
  };
}

function mapWallet(row = {}) {
  return {
    id: text(row.id, 80),
    walletId: text(row.id, 80),
    agentUserId: text(row.agent_user_id, 80),
    skId: text(row.sk_id, 32),
    email: lower(row.email, 320),
    displayName: text(row.display_name, 240),
    availablePoints: int(row.available_points, 0),
    heldPoints: int(row.held_points, 0),
    spentPoints: int(row.spent_points, 0),
    status: text(row.status || "active", 80),
    payload: record(row.payload),
    updatedAt: text(row.updated_at, 100)
  };
}

function mapWalletLedger(row = {}) {
  return {
    id: text(row.id, 80),
    walletId: text(row.wallet_id, 80),
    skId: text(row.sk_id, 32),
    email: lower(row.email, 320),
    eventType: text(row.event_type, 120),
    pointsDelta: int(row.points_delta, 0),
    availableAfter: int(row.available_after, 0),
    heldAfter: int(row.held_after, 0),
    spentAfter: int(row.spent_after, 0),
    orderId: text(row.order_id, 80),
    orderNumber: text(row.order_number, 120),
    reason: text(row.reason, 1000),
    payload: record(row.payload),
    createdByName: text(row.created_by_name, 240),
    createdAt: text(row.created_at, 100)
  };
}

function mapOrderItem(row = {}) {
  const payload = record(row.payload);
  const snapshot = record(payload.catalogSnapshot);
  const requested = record(payload.requested);
  return {
    id: text(row.id, 80),
    itemId: text(row.item_id || row.product_id, 80),
    itemCode: text(row.item_code, 80),
    title: text(row.title, 240),
    category: text(row.category, 180),
    styleGroup: text(row.style_group || snapshot.style_group || row.item_code, 120),
    colorName: text(row.color_name || snapshot.color_name, 120),
    fit: text(row.fit || requested.fit, 80),
    size: text(row.size, 80),
    quantity: Math.max(1, int(row.quantity, 1)),
    pointsCost: int(row.points_cost, 0),
    linePoints: int(row.line_points, 0),
    payload
  };
}

function mapOrder(row = {}, items = []) {
  const totalPoints = int(row.total_points ?? row.points_total, 0);
  return {
    id: text(row.id, 80),
    orderId: text(row.id, 80),
    legacyOrderId: text(row.order_id, 120),
    orderNumber: text(row.order_number || row.order_id, 120),
    employeeRef: text(row.employee_ref || row.sk_id, 120),
    agentUserId: text(row.agent_user_id, 80),
    skId: text(row.sk_id, 32),
    staffName: text(row.staff_name, 240),
    email: lower(row.email, 320),
    status: upper(row.status || "PENDING", 80),
    totalPoints,
    pointsTotal: int(row.points_total ?? row.total_points, 0),
    pointsHold: int(row.points_hold, 0),
    cashTotal: safeNumber(row.cash_total ?? row.total, 0),
    cashDeduction: safeNumber(row.cash_deduction, 0),
    cashDeductionRequired: row.cash_deduction_required === true,
    payrollDeductionStatus: upper(row.payroll_deduction_status || "NOT_REQUIRED", 80),
    paymentMethod: text(row.payment_method, 80),
    pickupLocationRef: text(row.pickup_location_ref, 80),
    note: text(row.note || row.order_note, 2000),
    orderNote: text(row.order_note || row.note, 2000),
    managerNote: text(row.manager_note, 2000),
    actionNote: text(row.action_note, 2000),
    walletId: text(row.wallet_id, 80),
    walletEffectStatus: upper(row.wallet_effect_status || "NONE", 80),
    items,
    summary: items.length
      ? items.map(i => `${i.quantity}× ${i.title}${i.colorName ? ` · ${i.colorName}` : ""}${i.size ? ` · ${i.size}` : ""}${i.fit ? ` · ${i.fit}` : ""}`).join(", ")
      : text(row.note || row.order_note, 2000),
    payload: record(row.payload),
    approvedAt: text(row.approved_at, 100),
    fulfillmentReadyAt: text(row.fulfillment_ready_at || row.fulfilled_at, 100),
    fulfilledAt: text(row.fulfilled_at, 100),
    completedAt: text(row.completed_at, 100),
    rejectedAt: text(row.rejected_at, 100),
    createdAt: text(row.created_at, 100),
    updatedAt: text(row.updated_at, 100)
  };
}

function mapPolicy(row = {}) {
  if (!row?.id) return null;
  return {
    id: text(row.id, 80),
    policyId: text(row.id, 80),
    policyKey: text(row.policy_key, 120),
    title: text(row.title, 240),
    policyVersion: text(row.policy_version, 80),
    effectiveDate: text(row.effective_date, 40),
    documentId: text(row.document_id, 120),
    pdfUrl: text(row.pdf_url, 5000),
    body: text(row.body, 50000),
    active: row.active !== false,
    payload: record(row.payload)
  };
}

function mapAudit(row = {}) {
  return {
    id: text(row.id, 80),
    eventType: text(row.event_type, 120),
    entityTable: text(row.entity_table, 120),
    entityId: text(row.entity_id, 160),
    orderNumber: text(row.order_number, 120),
    actorAgentUserId: text(row.actor_agent_user_id, 80),
    actorSkId: text(row.actor_sk_id, 32),
    actorName: text(row.actor_name, 240),
    message: text(row.message, 2000),
    payload: record(row.payload),
    createdAt: text(row.created_at, 100)
  };
}

async function writeAudit(session, eventType, input = {}) {
  const p = profileFromSession(session);
  await insert(TABLE.audit, {
    event_type: text(eventType, 120),
    entity_table: text(input.entityTable, 120),
    entity_id: text(input.entityId, 160),
    order_number: text(input.orderNumber, 120),
    actor_agent_user_id: isUuid(p.agentUserId) ? p.agentUserId : null,
    actor_sk_id: p.skId || null,
    actor_name: p.displayName || null,
    message: text(input.message, 2000),
    payload: record(input.payload),
    created_at: now()
  }, "return=minimal");
}

async function latestPolicy() {
  const rows = await select(TABLE.policies, {
    select: "*", active: "eq.true", order: "created_at.desc", limit: "1"
  });
  return mapPolicy(rows[0]);
}

async function orderItemsByOrder(ids = []) {
  const valid = ids.filter(isUuid);
  if (!valid.length) return {};
  const rows = await select(TABLE.orderItems, {
    select: "*", order_id: `in.(${valid.join(",")})`, order: "created_at.asc", limit: "3000"
  });
  return rows.reduce((acc, row) => {
    const key = text(row.order_id, 80);
    if (!acc[key]) acc[key] = [];
    acc[key].push(mapOrderItem(row));
    return acc;
  }, {});
}

async function listOrders({ agentUserId = "", limit = 750 } = {}) {
  const query = { select: "*", order: "created_at.desc", limit: String(limit) };
  if (isUuid(agentUserId)) query.agent_user_id = qeq(agentUserId);
  const rows = await select(TABLE.orders, query);
  const items = await orderItemsByOrder(rows.map(row => row.id));
  return rows.map(row => mapOrder(row, items[row.id] || []));
}

function roleCandidates(profile = {}) {
  return [profile.accessRole, profile.role, profile.roleId, profile.jobCode, profile.jobTitle, profile.position];
}
function departmentCandidates(profile = {}) {
  return [profile.departmentId, profile.departmentCode, profile.department];
}
function baseCandidates(profile = {}) {
  return [profile.baseCode, profile.base, profile.station];
}
function normalizedSet(values) {
  return new Set(cleanList(values, { normalize: true }));
}
function dimensionAllows(rules, candidates) {
  const allowed = normalizedSet(rules);
  if (!allowed.size || allowed.has("ALL")) return true;
  const actual = normalizedSet(candidates);
  return [...actual].some(value => allowed.has(value));
}
function eligibleForProfile(item = {}, profile = {}) {
  return dimensionAllows(item.available_roles || item.availableRoles, roleCandidates(profile)) &&
    dimensionAllows(item.available_departments || item.availableDepartments, departmentCandidates(profile)) &&
    dimensionAllows(item.available_bases || item.availableBases, baseCandidates(profile));
}

function itemCode(item = {}) {
  return upper(item.itemCode || item.item_code, 80);
}

function skuParts(value) {
  return upper(value, 240).split(/[^A-Z0-9]+/).filter(Boolean);
}

function itemErp(item = {}) {
  const payload = record(item.payload);
  return record(item.erp || payload.erp);
}

function productIdentityKey(item = {}) {
  const erp = itemErp(item);
  const variantTokens = new Set([
    ...skuParts(item.colorName || item.color_name),
    ...cleanList(item.sizes, { maxItems: 200, itemMax: 80 }).flatMap(skuParts),
    ...cleanList(item.fitOptions || item.fit_options, { maxItems: 40, itemMax: 80 }).flatMap(skuParts),
    ...skuParts(erp.supplierColor),
    ...skuParts(erp.supplierSize)
  ]);
  const baseTitle = skuParts(item.title).filter(part => !variantTokens.has(part)).join("-");
  return [
    baseTitle,
    upper(item.category || item.categoryKey || item.category_key, 180),
    upper(item.subCategory || item.sub_category, 180),
    upper(erp.genderFit, 120),
    upper(erp.program, 120),
    upper(erp.collection, 120)
  ].join("|");
}

function meaningfulSkuPrefix(parts = []) {
  if (parts.length >= 2) return true;
  return parts.length === 1 && String(parts[0] || "").length >= 5;
}

function inferredShopGroupKey(item = {}, catalog = []) {
  const sku = itemCode(item);
  const style = upper(item.styleGroup || item.style_group, 120);

  // A deliberately assigned style_group remains authoritative.
  if (style && style !== sku) return `STYLE:${style}`;

  const erp = itemErp(item);
  const supplierStyle = upper(erp.supplierStyle || erp.style, 120);
  if (supplierStyle && supplierStyle !== sku) return `SUPPLIER:${supplierStyle}`;

  if (!sku) return `ITEM:${upper(item.itemId || item._id || item.id, 80)}`;

  const parts = skuParts(sku);
  const identity = productIdentityKey(item);
  const peers = arr(catalog).filter(peer =>
    peer !== item &&
    itemCode(peer) &&
    productIdentityKey(peer) === identity
  );

  // First preference: a common delimited SKU stem, e.g. SK-2201-WHT-34 / SK-2201-NVY-36 -> SK-2201.
  if (parts.length >= 2) {
    let family = parts;
    const maxTrim = Math.min(3, parts.length - 1);
    for (let trim = 1; trim <= maxTrim; trim += 1) {
      const prefix = parts.slice(0, parts.length - trim);
      if (!meaningfulSkuPrefix(prefix)) continue;

      const hasSibling = peers.some(peer => {
        const peerParts = skuParts(itemCode(peer));
        return peerParts.length > prefix.length &&
          prefix.every((part, index) => peerParts[index] === part);
      });

      if (hasSibling) family = prefix;
    }
    if (family.length < parts.length) return `SKU:${family.join("-")}`;
  }

  // Second preference: a meaningful repeated SKU token anywhere in the code,
  // e.g. RED-XYZ123-34 / BLUE-XYZ123-36 -> XYZ123.
  const generic = new Set(["SK", "SKU", "UNIFORM", "ITEM", "PRODUCT", "STYLE"]);
  const sharedTokens = parts
    .filter(part => !generic.has(part) && (part.length >= 4 || /\d/.test(part)))
    .filter(part => peers.some(peer => skuParts(itemCode(peer)).includes(part)))
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
  if (sharedTokens.length) return `SKU-TOKEN:${sharedTokens[0]}`;

  // Final automatic fallback: support compact/non-delimited SKU families.
  const compactSku = sku.replace(/[^A-Z0-9]/g, "");
  let bestPrefix = "";
  peers.forEach(peer => {
    const peerSku = itemCode(peer).replace(/[^A-Z0-9]/g, "");
    let i = 0;
    while (i < compactSku.length && i < peerSku.length && compactSku[i] === peerSku[i]) i += 1;
    const prefix = compactSku.slice(0, i).replace(/[-_.]+$/g, "");
    if (prefix.length >= 5 && prefix.length > bestPrefix.length) bestPrefix = prefix;
  });
  if (bestPrefix) return `SKU-PREFIX:${bestPrefix}`;

  return `SKU:${sku}`;
}

function withShopGroupKeys(catalog = []) {
  return arr(catalog).map(item => ({
    ...item,
    shopGroupKey: inferredShopGroupKey(item, catalog)
  }));
}

function styleKey(item = {}) {
  return upper(item.shopGroupKey || item.styleGroup || item.style_group || item.itemCode || item.item_code || item.id, 180);
}
function addMonthsIso(value, months) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  date.setUTCMonth(date.getUTCMonth() + Math.max(0, int(months, 0)));
  return date.toISOString();
}
function replacementState(item = {}, orders = [], catalog = []) {
  const months = Math.max(0, int(item.replacementCycleMonths ?? item.replacement_cycle_months, 0));
  if (!months) return { replacementEligible: true, replacementPending: false, replacementCycleMonths: 0, replacementLastIssuedAt: "", replacementNextEligibleAt: "", replacementMessage: "" };
  const group = styleKey(item);
  const siblings = new Set(catalog.filter(row => styleKey(row) === group).map(itemCode).filter(Boolean));
  if (!siblings.size && itemCode(item)) siblings.add(itemCode(item));
  const related = orders.filter(order => arr(order.items).some(line => siblings.has(itemCode(line))));
  const open = related.find(order => OPEN_REPLACEMENT_STATES.has(upper(order.status, 80)));
  if (open) {
    return {
      replacementEligible: false, replacementPending: true, replacementCycleMonths: months,
      replacementLastIssuedAt: open.approvedAt || open.fulfillmentReadyAt || open.createdAt || "",
      replacementNextEligibleAt: "",
      replacementMessage: "An existing request for this uniform style is still in progress."
    };
  }
  const completed = related.filter(order => upper(order.status, 80) === "COMPLETED")
    .map(order => ({ order, issuedAt: order.completedAt || order.fulfilledAt || order.fulfillmentReadyAt || order.approvedAt || order.createdAt || "" }))
    .filter(entry => entry.issuedAt)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  if (!completed.length) return { replacementEligible: true, replacementPending: false, replacementCycleMonths: months, replacementLastIssuedAt: "", replacementNextEligibleAt: "", replacementMessage: "" };
  const last = completed[0].issuedAt;
  const next = addMonthsIso(last, months);
  const eligible = !next || Date.now() >= new Date(next).getTime();
  return {
    replacementEligible: eligible, replacementPending: false, replacementCycleMonths: months,
    replacementLastIssuedAt: last, replacementNextEligibleAt: next,
    replacementMessage: eligible ? "" : `Replacement becomes available after ${next.slice(0, 10)}.`
  };
}

async function activeRuleForProfile(profile = {}) {
  const rows = await select(TABLE.rules, { select: "*", active: "eq.true", order: "sort_order.asc", limit: "1000" });
  const candidates = normalizedSet(roleCandidates(profile));
  return rows.find(row => candidates.has(upper(row.role_key || row.role, 120))) ||
    rows.find(row => upper(row.role_key || row.role || "ALL", 120) === "ALL") || null;
}

async function ensureWallet(session) {
  const p = profileFromSession(session);
  if (!isUuid(p.agentUserId)) throw new SkandiError("UNIFORM_STAFF_ID_REQUIRED");
  const existing = await select(TABLE.wallets, { select: "*", agent_user_id: qeq(p.agentUserId), limit: "1" });
  if (existing[0]) return existing[0];
  const rule = await activeRuleForProfile(p).catch(() => null);
  const rows = await restRequest({
    table: TABLE.wallets,
    method: "POST",
    query: { on_conflict: "agent_user_id" },
    prefer: "resolution=merge-duplicates,return=representation",
    body: {
      agent_user_id: p.agentUserId,
      sk_id: p.skId || null,
      email: p.email || null,
      display_name: p.displayName || null,
      available_points: int(rule?.monthly_points ?? rule?.yearly_points, 0),
      held_points: 0,
      spent_points: 0,
      status: "active",
      payload: { initializedFromRule: text(rule?.rule_key, 120), initializedAt: now() },
      created_by_agent_user_id: p.agentUserId
    }
  });
  return arr(rows)[0] || null;
}

async function mutateWallet(wallet, deltas = {}, meta = {}, session) {
  if (!wallet?.id) throw new SkandiError("UNIFORM_WALLET_NOT_FOUND");
  const before = {
    available: int(wallet.available_points, 0), held: int(wallet.held_points, 0), spent: int(wallet.spent_points, 0)
  };
  const after = {
    available: before.available + int(deltas.available, 0),
    held: before.held + int(deltas.held, 0),
    spent: before.spent + int(deltas.spent, 0)
  };
  if (after.available < 0 || after.held < 0 || after.spent < 0) {
    throw new SkandiError("INSUFFICIENT_SK_POINTS", "Uniform wallet balance cannot go below zero.", { publicMessage: "Insufficient SK-Points for this action." });
  }

  const rows = await patch(TABLE.wallets, {
    id: qeq(wallet.id),
    available_points: qeq(before.available),
    held_points: qeq(before.held),
    spent_points: qeq(before.spent)
  }, {
    available_points: after.available,
    held_points: after.held,
    spent_points: after.spent,
    updated_at: now()
  });
  if (!rows[0]) {
    throw new SkandiError("CONCURRENT_WALLET_CHANGE", "Uniform wallet changed during this action.", {
      publicMessage: "The wallet changed in another session. Refresh and try again."
    });
  }
  const p = profileFromSession(session || {});
  await insert(TABLE.walletLedger, {
    wallet_id: wallet.id,
    agent_user_id: isUuid(wallet.agent_user_id) ? wallet.agent_user_id : null,
    sk_id: text(wallet.sk_id, 32),
    email: lower(wallet.email, 320),
    event_type: text(meta.eventType || "ADJUSTMENT", 120),
    points_delta: int(meta.pointsDelta ?? deltas.available, 0),
    available_after: after.available,
    held_after: after.held,
    spent_after: after.spent,
    order_id: isUuid(meta.orderId) ? meta.orderId : null,
    order_number: text(meta.orderNumber, 120),
    reason: text(meta.reason, 1000),
    payload: record(meta.payload),
    created_by_agent_user_id: isUuid(p.agentUserId) ? p.agentUserId : null,
    created_by_name: p.displayName || null,
    created_at: now()
  }, "return=minimal");
  return rows[0];
}

async function uniformEligibilityOptions() {
  const rows = await select(TABLE.agents, {
    select: "access_role,role_id,job_code,job_title,department_id,department_code,department,base_code,base,station",
    limit: "5000"
  }).catch(() => []);
  const roles = new Set(["ALL"]), departments = new Set(["ALL"]), bases = new Set(["ALL"]);
  rows.forEach(row => {
    [row.access_role, row.role_id, row.job_code, row.job_title].forEach(v => { const x = upper(v, 180).replace(/[\s-]+/g, "_"); if (x) roles.add(x); });
    [row.department_id, row.department_code, row.department].forEach(v => { const x = upper(v, 180).replace(/[\s-]+/g, "_"); if (x) departments.add(x); });
    [row.base_code, row.base, row.station].forEach(v => { const x = upper(v, 180).replace(/[\s-]+/g, "_"); if (x) bases.add(x); });
  });
  return { roles: [...roles].sort(), departments: [...departments].sort(), bases: [...bases].sort() };
}

async function loadCatalog({ includeInactive = false, search = "" } = {}) {
  const query = { select: "*", order: "title.asc,item_code.asc", limit: "1500" };
  if (!includeInactive) query.active = "eq.true";
  const [rows, assets] = await Promise.all([select(TABLE.catalog, query), uniformAssets()]);
  const completeCatalog = withShopGroupKeys(rows.map(row => mapCatalogItem(row, assets)));
  let mapped = completeCatalog;
  const needle = lower(search, 160);
  if (needle) {
    mapped = mapped.filter(item => [item.title, item.itemCode, item.category, item.subCategory, item.styleGroup, item.shopGroupKey, item.colorName]
      .join(" ").toLowerCase().includes(needle));
  }
  return mapped;
}

async function registerProductAssets(item, saved, session) {
  const ids = cleanList(
    record(item.payload).assetIds || record(item.payload).imageAssetIds || item.imageAssetIds || record(item.erp).assetIds,
    { maxItems: MAX_IMAGES, itemMax: 80 }
  ).filter(isUuid);
  for (const assetId of ids) {
    await registerAssetUsageCore({
      assetId,
      system: "Uniform Control",
      recordType: "UNIFORM_CATALOG_ITEM",
      recordId: saved.id,
      usageRole: "PRODUCT_IMAGE",
      fieldName: "image_gallery",
      payload: { itemCode: saved.item_code }
    }, session).catch(() => null);
  }
}

export async function getUniformAdminBootstrapCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const [catalog, categoriesRaw, rulesRaw, walletsRaw, orders, auditRaw, policy, eligibilityOptions, walletLedgerRaw, assetResult] = await Promise.all([
    loadCatalog({ includeInactive: true, search: input.query }),
    select(TABLE.categories, { select: "*", order: "sort_order.asc,title.asc", limit: "1000" }),
    select(TABLE.rules, { select: "*", order: "sort_order.asc,title.asc", limit: "1000" }),
    select(TABLE.wallets, { select: "*", order: "updated_at.desc", limit: "1000" }),
    listOrders(),
    select(TABLE.audit, { select: "*", order: "created_at.desc", limit: "500" }),
    latestPolicy(),
    uniformEligibilityOptions(),
    select(TABLE.walletLedger, { select: "*", order: "created_at.desc", limit: "500" }),
    listAssetsCore({ search: "uniform" }).catch(() => ({ assets: [] }))
  ]);
  const profile = profileFromSession(session);
  const categories = categoriesRaw.map(mapCategory);
  const allowanceRules = rulesRaw.map(mapRule);
  const wallets = walletsRaw.map(mapWallet);
  const assets = arr(assetResult.assets).filter(a => a.status === "ACTIVE");
  const activeCatalog = catalog.filter(item => item.active !== false && item.stockStatus !== "ARCHIVED");
  return {
    ok: true,
    version: UNIFORM_CORE_VERSION,
    session: {
      id: profile.agentUserId,
      skId: profile.skId,
      displayName: profile.displayName,
      email: profile.email,
      role: profile.accessRole,
      accessRole: profile.accessRole,
      canManageUniforms: true,
      permissionKeys: arr(session.permissionKeys),
      permissionGroups: arr(session.permissionGroups)
    },
    profile,
    apps: arr(session.apps),
    stats: {
      catalog: activeCatalog.length,
      styles: new Set(activeCatalog.map(styleKey).filter(Boolean)).size,
      openOrders: orders.filter(o => !CLOSED_ORDER_STATES.has(o.status)).length,
      wallets: wallets.length,
      categories: categories.length,
      assets: assets.length,
      schemaGated: 12
    },
    orders,
    catalog,
    categories,
    allowanceRules,
    wallets,
    walletLedger: walletLedgerRaw.map(mapWalletLedger),
    audit: auditRaw.map(mapAudit),
    policy,
    eligibilityOptions,
    assets,
    capabilities: {
      productMaster: true,
      employeeOrders: true,
      pointsWallets: true,
      allowanceRules: true,
      policy: true,
      audit: true,
      assetLibrary: true,
      transactionalStock: false,
      warehouses: false,
      bins: false,
      purchaseOrders: false,
      receiving: false,
      allocations: false,
      pickPack: false,
      transfers: false,
      physicalCounts: false,
      fittings: false,
      returns: false,
      payrollDeductionHandoff: false
    },
    lastSync: now()
  };
}

export async function saveUniformCatalogItemCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const item = record(input.item || input);
  const id = text(item.itemId || item.id || item._id, 80);
  const itemCodeValue = upper(item.itemCode || item.item_code, 80);
  const title = text(item.title, 240);
  if (!itemCodeValue) throw new SkandiError("UNIFORM_ITEM_CODE_REQUIRED", "SKU / Item code is required.", { publicMessage: "SKU / Item code is required." });
  if (!title) throw new SkandiError("UNIFORM_ITEM_TITLE_REQUIRED", "Product name is required.", { publicMessage: "Product name is required." });

  const existing = isUuid(id)
    ? (await select(TABLE.catalog, { select: "*", id: qeq(id), limit: "1" }))[0]
    : (await select(TABLE.catalog, { select: "*", item_code: qeq(itemCodeValue), limit: "1" }))[0];
  const categoryRaw = text(item.categoryTitle || item.category || item.categoryKey || item.category_key, 180);
  const profile = profileFromSession(session);
  const body = {
    item_code: itemCodeValue,
    title,
    category_key: upper(item.categoryKey || item.category_key || categoryRaw, 120).replace(/[^A-Z0-9_-]+/g, "_") || null,
    category_title: categoryRaw || null,
    sub_category: text(item.subCategory || item.sub_category, 180) || null,
    style_group: upper(item.styleGroup || item.style_group || itemCodeValue, 120) || itemCodeValue,
    color_name: text(item.colorName || item.color_name, 120) || null,
    color_hex: cleanHex(item.colorHex || item.color_hex) || null,
    fit_options: cleanList(item.fitOptions || item.fit_options, { maxItems: 40, itemMax: 80 }),
    initial_issue_quantity: Math.max(0, int(item.initialIssueQuantity ?? item.initial_issue_quantity, 0)),
    replacement_cycle_months: Math.max(0, int(item.replacementCycleMonths ?? item.replacement_cycle_months, 0)),
    available_roles: cleanList(item.availableRoles || item.available_roles, { normalize: true }),
    available_departments: cleanList(item.availableDepartments || item.available_departments, { normalize: true }),
    available_bases: cleanList(item.availableBases || item.available_bases, { normalize: true }),
    item_regulations: text(item.itemRegulations || item.item_regulations, 12000) || null,
    points_cost: Math.max(0, int(item.pointsCost ?? item.points_cost, 0)),
    stock_status: upper(item.stockStatus || item.stock_status || "IN_STOCK", 80),
    active: safeBoolean(item.active, true),
    sizes: cleanList(item.sizes, { maxItems: 200, itemMax: 80 }),
    description: text(item.description, 8000) || null,
    details: text(item.details, 8000) || null,
    care_instructions: text(item.careInstructions || item.care_instructions, 8000) || null,
    payload: mergePayload(existing?.payload, item.payload, item),
    updated_at: now()
  };

  let saved;
  if (existing?.id) {
    saved = (await patch(TABLE.catalog, { id: qeq(existing.id) }, body))[0];
  } else {
    saved = (await insert(TABLE.catalog, {
      ...body,
      created_by_agent_user_id: isUuid(profile.agentUserId) ? profile.agentUserId : null,
      created_at: now()
    }))[0];
  }
  if (!saved?.id) throw new SkandiError("UNIFORM_ITEM_SAVE_FAILED");
  await registerProductAssets(item, saved, session);
  await writeAudit(session, "uniform_item_saved", {
    entityTable: TABLE.catalog, entityId: saved.id,
    message: existing ? "Uniform product updated." : "Uniform product created.",
    payload: { before: existing || null, after: saved }
  });
  const assets = await uniformAssets();
  return { ok: true, version: UNIFORM_CORE_VERSION, item: mapCatalogItem(saved, assets) };
}

export async function saveUniformCategoryCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const category = record(input.category || input);
  const key = upper(category.categoryKey || category.category_key || category.title, 120).replace(/[^A-Z0-9_-]+/g, "_");
  if (!key) throw new SkandiError("UNIFORM_CATEGORY_KEY_REQUIRED");
  const existing = (await select(TABLE.categories, { select: "*", category_key: qeq(key), limit: "1" }))[0];
  const body = {
    category_key: key,
    title: text(category.title || key, 240),
    description: text(category.description, 3000) || null,
    sort_order: int(category.sortOrder ?? category.sort_order, 100),
    active: safeBoolean(category.active, true),
    payload: mergePayload(existing?.payload, category.payload, category),
    updated_at: now()
  };
  const saved = existing?.id
    ? (await patch(TABLE.categories, { id: qeq(existing.id) }, body))[0]
    : (await insert(TABLE.categories, body))[0];
  await writeAudit(session, "uniform_category_saved", { entityTable: TABLE.categories, entityId: saved?.id, message: "Uniform category saved.", payload: { before: existing || null, after: saved || body } });
  return { ok: true, category: mapCategory(saved || body) };
}

export async function saveUniformAllowanceRuleCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const rule = record(input.rule || input);
  const id = text(rule.id, 80);
  const key = upper(rule.ruleKey || rule.rule_key || `${rule.roleKey || rule.role || "ALL"}-${rule.title || "ALLOWANCE"}`, 120).replace(/[^A-Z0-9_-]+/g, "_");
  const existing = isUuid(id)
    ? (await select(TABLE.rules, { select: "*", id: qeq(id), limit: "1" }))[0]
    : (await select(TABLE.rules, { select: "*", rule_key: qeq(key), limit: "1" }))[0];
  const body = {
    rule_key: key,
    title: text(rule.title || key, 240),
    role_key: upper(rule.roleKey || rule.role_key || rule.role || "ALL", 120).replace(/[\s-]+/g, "_"),
    role: text(rule.role || existing?.role, 180) || null,
    monthly_points: Math.max(0, int(rule.monthlyPoints ?? rule.monthly_points, existing?.monthly_points || 0)),
    yearly_points: rule.yearlyPoints === undefined && rule.yearly_points === undefined ? existing?.yearly_points ?? null : Math.max(0, int(rule.yearlyPoints ?? rule.yearly_points, 0)),
    max_items: rule.maxItems === undefined && rule.max_items === undefined ? existing?.max_items ?? null : Math.max(0, int(rule.maxItems ?? rule.max_items, 0)),
    renewal_months: rule.renewalMonths === undefined && rule.renewal_months === undefined ? existing?.renewal_months ?? null : Math.max(0, int(rule.renewalMonths ?? rule.renewal_months, 0)),
    summary: text(rule.summary, 3000) || null,
    status: text(rule.status || existing?.status, 80) || null,
    active: safeBoolean(rule.active, true),
    sort_order: int(rule.sortOrder ?? rule.sort_order, existing?.sort_order || 100),
    payload: mergePayload(existing?.payload, rule.payload, rule),
    updated_at: now()
  };
  const saved = existing?.id
    ? (await patch(TABLE.rules, { id: qeq(existing.id) }, body))[0]
    : (await insert(TABLE.rules, body))[0];
  await writeAudit(session, "uniform_allowance_rule_saved", { entityTable: TABLE.rules, entityId: saved?.id, message: "Uniform allowance rule saved.", payload: { before: existing || null, after: saved || body } });
  return { ok: true, rule: mapRule(saved || body) };
}

export async function saveUniformPolicyCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const policy = record(input.policy || input);
  const key = upper(policy.policyKey || policy.policy_key || "SKANDI_UNIFORM_REGULATIONS", 120) || "SKANDI_UNIFORM_REGULATIONS";
  const existing = (await select(TABLE.policies, { select: "*", policy_key: qeq(key), order: "created_at.desc", limit: "1" }))[0];
  const bodyText = text(policy.body, 50000);
  if (!bodyText) throw new SkandiError("UNIFORM_POLICY_BODY_REQUIRED", "Uniform Regulations text is required.", { publicMessage: "Uniform Regulations text is required." });
  const body = {
    policy_key: key,
    title: text(policy.title || "SKANDI Uniform Regulations", 240),
    policy_version: text(policy.policyVersion || policy.policy_version || "CURRENT", 80),
    body: bodyText,
    active: safeBoolean(policy.active, true),
    effective_date: text(policy.effectiveDate || policy.effective_date, 20) || null,
    document_id: text(policy.documentId || policy.document_id, 120) || null,
    pdf_url: text(policy.pdfUrl || policy.pdf_url, 5000) || null,
    payload: mergePayload(existing?.payload, policy.payload, policy),
    updated_at: now()
  };
  const saved = existing?.id
    ? (await patch(TABLE.policies, { id: qeq(existing.id) }, body))[0]
    : (await insert(TABLE.policies, body))[0];
  await writeAudit(session, "uniform_policy_saved", { entityTable: TABLE.policies, entityId: saved?.id, message: "Uniform Regulations saved.", payload: { before: existing || null, after: saved || body } });
  return { ok: true, policy: mapPolicy(saved || body) };
}

async function walletByIdentity(input = {}) {
  const skId = upper(input.skId || input.skID || input.sk_id, 32);
  const email = lower(input.email, 320);
  const agentUserId = text(input.agentUserId || input.agent_user_id, 80);
  const filters = [];
  if (isUuid(agentUserId)) filters.push(`agent_user_id.eq.${agentUserId}`);
  if (skId) filters.push(`sk_id.eq.${skId}`);
  if (email) filters.push(`email.eq.${email}`);
  if (!filters.length) return null;
  return (await select(TABLE.wallets, { select: "*", or: `(${filters.join(",")})`, limit: "1" }))[0] || null;
}

async function agentByIdentity(input = {}) {
  const skId = upper(input.skId || input.skID || input.sk_id, 32);
  const email = lower(input.email, 320);
  const filters = [];
  if (skId) filters.push(`sk_id.eq.${skId}`, `agent_id.eq.${skId}`);
  if (email) filters.push(`email.eq.${email}`, `corporate_email_address.eq.${email}`);
  if (!filters.length) return null;
  return (await select(TABLE.agents, { select: "*", or: `(${filters.join(",")})`, limit: "1" }).catch(() => []))[0] || null;
}

export async function adjustUniformWalletCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const points = int(input.points, 0);
  if (!points) throw new SkandiError("UNIFORM_WALLET_ZERO_ADJUSTMENT", "Wallet adjustment cannot be zero.", { publicMessage: "Wallet adjustment cannot be zero." });
  let wallet = await walletByIdentity(input);
  if (!wallet) {
    const agent = await agentByIdentity(input);
    if (!agent?.id) throw new SkandiError("UNIFORM_STAFF_NOT_FOUND", "Staff member was not found.", { publicMessage: "Staff member was not found." });
    // Build a temporary session-compatible object so one wallet authority path is used.
    wallet = await ensureWallet({ profile: {
      id: agent.id,
      agentUserUuid: agent.id,
      agentId: agent.agent_id || agent.sk_id,
      skId: agent.sk_id || agent.agent_id,
      displayName: agent.display_name || [agent.first_name, agent.last_name].filter(Boolean).join(" "),
      email: agent.corporate_email_address || agent.email,
      accessRole: agent.access_role,
      roleId: agent.role_id,
      jobCode: agent.job_code,
      jobTitle: agent.job_title,
      departmentId: agent.department_id,
      departmentCode: agent.department_code,
      department: agent.department,
      baseCode: agent.base_code,
      base: agent.base,
      station: agent.station
    } });
  }
  const updated = await mutateWallet(wallet, { available: points }, {
    eventType: "ADMIN_ADJUSTMENT", pointsDelta: points,
    reason: text(input.reason || "Uniform Control wallet adjustment.", 1000), payload: record(input)
  }, session);
  await writeAudit(session, "uniform_wallet_adjusted", { entityTable: TABLE.wallets, entityId: updated.id, message: "Uniform wallet adjusted.", payload: { points, reason: input.reason || "", wallet: updated } });
  return { ok: true, wallet: mapWallet(updated) };
}

function transitionAllowed(fromValue, toValue) {
  const from = upper(fromValue || "PENDING", 80);
  const to = upper(toValue, 80);
  if (from === to) return true;
  if (!ORDER_STATES.has(to)) return false;
  if (CLOSED_ORDER_STATES.has(from)) return false;
  const map = {
    PENDING: ["MANAGER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
    SUBMITTED: ["MANAGER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
    MANAGER_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: ["FULFILLMENT_READY", "PICKING", "PARTIAL", "CANCELLED"],
    FULFILLMENT_READY: ["PICKING", "PICKED", "PACKING", "READY_FOR_PICKUP", "SHIPPED", "PARTIAL", "CANCELLED"],
    PICKING: ["PICKED", "PARTIAL", "CANCELLED"],
    PICKED: ["PACKING", "PARTIAL", "CANCELLED"],
    PACKING: ["READY_FOR_PICKUP", "SHIPPED", "PARTIAL", "CANCELLED"],
    READY_FOR_PICKUP: ["DELIVERED", "COMPLETED", "RETURN_REQUESTED"],
    SHIPPED: ["DELIVERED", "PARTIAL", "RETURN_REQUESTED"],
    DELIVERED: ["COMPLETED", "RETURN_REQUESTED"],
    PARTIAL: ["PICKING", "PACKING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"],
    RETURN_REQUESTED: ["RETURNED", "COMPLETED"]
  };
  return arr(map[from]).includes(to);
}

export async function uniformOrderActionCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const id = text(input.orderId || input.id, 80);
  const action = upper(input.action, 80);
  if (!isUuid(id)) throw new SkandiError("UNIFORM_ORDER_ID_INVALID", "Valid order ID is required.", { publicMessage: "Valid uniform order ID is required." });
  if (!ORDER_STATES.has(action)) throw new SkandiError("UNIFORM_ORDER_ACTION_INVALID", "Unsupported order status.", { publicMessage: "That Uniform order action is not supported." });
  const order = (await select(TABLE.orders, { select: "*", id: qeq(id), limit: "1" }))[0];
  if (!order) throw new SkandiError("UNIFORM_ORDER_NOT_FOUND", "Uniform order was not found.", { publicMessage: "Uniform order was not found." });
  if (!transitionAllowed(order.status, action)) {
    throw new SkandiError("UNIFORM_ORDER_TRANSITION_INVALID", `Cannot change ${order.status} to ${action}.`, { publicMessage: `Order cannot move from ${order.status} to ${action}.` });
  }

  let wallet = null;
  if (isUuid(order.wallet_id)) wallet = (await select(TABLE.wallets, { select: "*", id: qeq(order.wallet_id), limit: "1" }))[0] || null;
  let walletEffect = upper(order.wallet_effect_status || "NONE", 80);
  const totalPoints = int(order.total_points ?? order.points_total, 0);
  const body = { status: action, action_note: text(input.note, 2000), updated_at: now() };
  const p = profileFromSession(session);

  if (action === "APPROVED" && !order.approved_at) {
    body.approved_at = now(); body.approved_by = isUuid(p.agentUserId) ? p.agentUserId : null;
    if (wallet && ["NONE", "RELEASED", ""].includes(walletEffect) && totalPoints > 0) {
      wallet = await mutateWallet(wallet, { available: -totalPoints, held: totalPoints }, {
        eventType: "ORDER_HELD", pointsDelta: -totalPoints, orderId: order.id, orderNumber: order.order_number,
        reason: "Uniform order approved and points held."
      }, session);
      walletEffect = "HELD";
    }
  }
  if (["REJECTED", "CANCELLED", "RETURNED"].includes(action)) {
    if (action === "REJECTED") { body.rejected_at = now(); body.rejected_by = isUuid(p.agentUserId) ? p.agentUserId : null; }
    if (wallet && walletEffect === "HELD" && totalPoints > 0) {
      wallet = await mutateWallet(wallet, { available: totalPoints, held: -totalPoints }, {
        eventType: "ORDER_RELEASED", pointsDelta: totalPoints, orderId: order.id, orderNumber: order.order_number,
        reason: `Uniform order ${action.toLowerCase()} and held points released.`
      }, session);
      walletEffect = "RELEASED";
    }
  }
  if (["FULFILLMENT_READY", "PICKING", "PICKED", "PACKING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED", "PARTIAL"].includes(action) && !order.fulfillment_ready_at) {
    body.fulfillment_ready_at = now();
  }
  if (action === "COMPLETED") {
    if (totalPoints > 0 && (!wallet || walletEffect !== "HELD")) {
      throw new SkandiError("UNIFORM_ORDER_POINTS_NOT_HELD", "Order points must be held before completion.", { publicMessage: "Approve the order and hold SK-Points before completion." });
    }
    if (wallet && totalPoints > 0) {
      wallet = await mutateWallet(wallet, { held: -totalPoints, spent: totalPoints }, {
        eventType: "ORDER_SPENT", pointsDelta: -totalPoints, orderId: order.id, orderNumber: order.order_number,
        reason: "Uniform order completed and held points spent."
      }, session);
      walletEffect = "SPENT";
    }
    body.completed_at = now(); body.fulfilled_at = order.fulfilled_at || now(); body.fulfilled_by = isUuid(p.agentUserId) ? p.agentUserId : null;
  }
  body.wallet_effect_status = walletEffect;
  const updated = (await patch(TABLE.orders, { id: qeq(order.id), status: qeq(order.status) }, body))[0];
  if (!updated) throw new SkandiError("CONCURRENT_ORDER_CHANGE", "Order changed in another session.", { publicMessage: "The order changed in another session. Refresh and try again." });
  const lines = (await orderItemsByOrder([order.id]))[order.id] || [];
  await writeAudit(session, "uniform_order_action", { entityTable: TABLE.orders, entityId: updated.id, orderNumber: updated.order_number, message: `Uniform order action: ${action}`, payload: { before: order, after: updated, action, note: input.note || "" } });
  return { ok: true, order: mapOrder(updated, lines), wallet: wallet ? mapWallet(wallet) : null };
}

export async function archiveUniformItemCore(input = {}) {
  const session = await requireUniformSession({ admin: true });
  const id = text(input.itemId || input.id, 80);
  if (!isUuid(id)) throw new SkandiError("UNIFORM_ITEM_ID_INVALID", "Valid uniform item ID is required.", { publicMessage: "Valid Uniform item ID is required." });
  const existing = (await select(TABLE.catalog, { select: "*", id: qeq(id), limit: "1" }))[0];
  if (!existing) throw new SkandiError("UNIFORM_ITEM_NOT_FOUND");
  const saved = (await patch(TABLE.catalog, { id: qeq(id) }, {
    active: false,
    stock_status: "ARCHIVED",
    payload: mergePayload(existing.payload, {}, { archivedAt: now(), archivedReason: text(input.reason || "Uniform Control archive", 1000) }),
    updated_at: now()
  }))[0];
  await writeAudit(session, "uniform_item_archived", { entityTable: TABLE.catalog, entityId: id, message: "Uniform product archived.", payload: { before: existing, after: saved } });
  const assets = await uniformAssets();
  return { ok: true, archived: true, deleted: false, itemId: id, item: mapCatalogItem(saved || existing, assets) };
}

export async function getUniformEmployeeBootstrapCore() {
  const session = await requireUniformSession();
  const profile = profileFromSession(session);
  const [wallet, catalog, categoriesRaw, orders, policy] = await Promise.all([
    ensureWallet(session),
    loadCatalog({ includeInactive: false }),
    select(TABLE.categories, { select: "*", active: "eq.true", order: "sort_order.asc,title.asc", limit: "1000" }),
    listOrders({ agentUserId: profile.agentUserId, limit: 300 }),
    latestPolicy()
  ]);
  const eligibleCatalog = catalog
    .filter(item => eligibleForProfile({
      available_roles: item.availableRoles,
      available_departments: item.availableDepartments,
      available_bases: item.availableBases
    }, profile))
    .map(item => ({ ...item, ...replacementState(item, orders, catalog) }));
  return {
    ok: true,
    version: UNIFORM_CORE_VERSION,
    profile,
    wallet: mapWallet(wallet || {}),
    catalog: eligibleCatalog,
    categories: categoriesRaw.map(mapCategory),
    orders,
    policy,
    lastSync: now()
  };
}

export async function submitUniformEmployeeOrderCore(input = {}) {
  const session = await requireUniformSession();
  const profile = profileFromSession(session);
  const cart = arr(input.items);
  if (!cart.length) throw new SkandiError("UNIFORM_ORDER_EMPTY", "No Uniform items were selected.", { publicMessage: "Your Uniform bag is empty." });
  const [catalog, history] = await Promise.all([loadCatalog({ includeInactive: false }), listOrders({ agentUserId: profile.agentUserId, limit: 500 })]);
  const byId = new Map(catalog.map(item => [item.itemId, item]));
  const byCode = new Map(catalog.map(item => [upper(item.itemCode, 80), item]));
  const lines = [];
  let totalPoints = 0;

  for (const requested of cart) {
    const product = byId.get(text(requested.itemId || requested.id, 80)) || byCode.get(upper(requested.itemCode, 80));
    if (!product || product.active === false || product.stockStatus === "ARCHIVED") throw new SkandiError("UNIFORM_SKU_NOT_FOUND", "Uniform item is unavailable.", { publicMessage: "One of the selected Uniform items is unavailable." });
    if (!eligibleForProfile({ available_roles: product.availableRoles, available_departments: product.availableDepartments, available_bases: product.availableBases }, profile)) {
      throw new SkandiError("EMPLOYEE_NOT_ELIGIBLE", "Employee is not eligible for this Uniform item.", { publicMessage: `You are not eligible for ${product.title}.` });
    }
    const replacement = replacementState(product, history, catalog);
    if (!replacement.replacementEligible) throw new SkandiError("REPLACEMENT_NOT_ELIGIBLE", replacement.replacementMessage, { publicMessage: replacement.replacementMessage });
    const allowedFits = cleanList(product.fitOptions);
    const fit = text(requested.fit || requested.selectedFit || requested.activeFit, 80);
    if (allowedFits.length && !fit) throw new SkandiError("UNIFORM_FIT_REQUIRED", `Fit is required for ${product.title}.`, { publicMessage: `Select a fit for ${product.title}.` });
    if (fit && allowedFits.length && !allowedFits.map(lower).includes(lower(fit))) throw new SkandiError("UNIFORM_FIT_INVALID", `Invalid fit for ${product.title}.`, { publicMessage: `The selected fit is not available for ${product.title}.` });
    const sizes = cleanList(product.sizes, { maxItems: 200, itemMax: 80 });
    const size = text(requested.size || requested.selectedSize || requested.activeSize, 80);
    if (sizes.length && !size) throw new SkandiError("UNIFORM_SIZE_REQUIRED", `Size is required for ${product.title}.`, { publicMessage: `Select a size for ${product.title}.` });
    if (size && sizes.length && !sizes.map(lower).includes(lower(size))) throw new SkandiError("UNIFORM_SIZE_INVALID", `Invalid size for ${product.title}.`, { publicMessage: `The selected size is not available for ${product.title}.` });
    const quantity = Math.max(1, Math.min(20, int(requested.quantity, 1)));
    const pointsCost = Math.max(0, int(product.pointsCost, 0));
    const linePoints = pointsCost * quantity;
    totalPoints += linePoints;
    lines.push({
      item_id: product.itemId,
      product_id: product.itemId,
      item_code: product.itemCode,
      title: product.title,
      category: product.category,
      style_group: product.styleGroup,
      color_name: product.colorName,
      fit,
      size,
      quantity,
      points_cost: pointsCost,
      unit_price: null,
      line_points: linePoints,
      status: "SUBMITTED",
      payload: { requested: record(requested), catalogSnapshot: { ...product, payload: product.payload } }
    });
  }

  let wallet = await ensureWallet(session);
  if (int(wallet.available_points, 0) < totalPoints) throw new SkandiError("INSUFFICIENT_SK_POINTS", "Not enough SK-Points.", { publicMessage: "Not enough SK-Points for this request." });
  const orderNumber = `UO-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  wallet = await mutateWallet(wallet, { available: -totalPoints, held: totalPoints }, {
    eventType: "ORDER_HELD", pointsDelta: -totalPoints, orderNumber,
    reason: "Uniform request submitted and SK-Points held.", payload: { cart }
  }, session);

  let order = null;
  let savedLines = [];
  try {
    order = (await insert(TABLE.orders, {
      order_id: orderNumber,
      employee_ref: profile.skId || profile.agentId,
      order_number: orderNumber,
      agent_user_id: isUuid(profile.agentUserId) ? profile.agentUserId : null,
      sk_id: profile.skId || null,
      staff_name: profile.displayName || null,
      email: profile.email || null,
      status: "PENDING",
      points_total: totalPoints,
      points_hold: totalPoints,
      total_points: totalPoints,
      wallet_id: wallet.id,
      wallet_effect_status: "HELD",
      note: text(input.note, 2000),
      order_note: text(input.note, 2000),
      cash_total: 0,
      cash_deduction: 0,
      cash_deduction_required: false,
      payroll_deduction_status: "NOT_REQUIRED",
      lines: cart,
      payload: mergePayload({}, input.payload, input),
      created_by: isUuid(profile.agentUserId) ? profile.agentUserId : null,
      created_by_agent_user_id: isUuid(profile.agentUserId) ? profile.agentUserId : null,
      created_at: now(),
      updated_at: now()
    }))[0];
    if (!order?.id) throw new SkandiError("UNIFORM_ORDER_CREATE_FAILED");
    savedLines = await insert(TABLE.orderItems, lines.map(line => ({ ...line, order_id: order.id, created_at: now(), updated_at: now() })));
  } catch (error) {
    await mutateWallet(wallet, { available: totalPoints, held: -totalPoints }, {
      eventType: "ORDER_HOLD_ROLLBACK", pointsDelta: totalPoints, orderNumber,
      reason: "Uniform order creation failed; held points released.", payload: { error: text(error?.message, 500) }
    }, session).catch(() => null);
    throw error;
  }
  await writeAudit(session, "uniform_order_submitted", { entityTable: TABLE.orders, entityId: order.id, orderNumber, message: "Uniform order submitted.", payload: { order, items: savedLines } });
  return { ok: true, order: mapOrder(order, savedLines.map(mapOrderItem)), wallet: mapWallet(wallet) };
}

export async function acknowledgeUniformPolicyCore(input = {}) {
  const session = await requireUniformSession();
  const profile = profileFromSession(session);
  let policy = null;
  const policyId = text(input.policyId || input.id, 80);
  if (isUuid(policyId)) policy = (await select(TABLE.policies, { select: "*", id: qeq(policyId), limit: "1" }))[0] || null;
  if (!policy) {
    const mapped = await latestPolicy();
    if (mapped?.id) policy = (await select(TABLE.policies, { select: "*", id: qeq(mapped.id), limit: "1" }))[0] || null;
  }
  if (!policy?.id) return { ok: true, acknowledged: false, message: "No active Uniform policy exists." };
  const key = text(policy.policy_key, 120);
  const version = text(input.policyVersion || input.policy_version || policy.policy_version, 80);
  const existing = (await select(TABLE.acknowledgements, {
    select: "*", policy_key: qeq(key), policy_version: qeq(version), agent_user_id: qeq(profile.agentUserId), limit: "1"
  }))[0];
  let saved = existing;
  if (!saved) {
    saved = (await insert(TABLE.acknowledgements, {
      policy_id: policy.id,
      policy_key: key,
      policy_version: version,
      agent_user_id: isUuid(profile.agentUserId) ? profile.agentUserId : null,
      sk_id: profile.skId || null,
      email: profile.email || null,
      acknowledged_at: now(),
      payload: mergePayload({}, input.payload, input)
    }))[0];
  }
  await writeAudit(session, "uniform_policy_acknowledged", { entityTable: TABLE.acknowledgements, entityId: saved?.id, message: `Uniform Regulations ${version} acknowledged.`, payload: { policyId: policy.id, policyKey: key, policyVersion: version } });
  return { ok: true, acknowledged: true, acknowledgement: saved, policy: mapPolicy(policy) };
}

export async function getUniformRegulationsBootstrapCore() {
  const session = await requireUniformSession();
  return { ok: true, version: UNIFORM_CORE_VERSION, profile: profileFromSession(session), policy: await latestPolicy(), lastSync: now() };
}

export async function listUniformAssetsCore(input = {}) {
  await requireUniformSession({ admin: true });
  return listAssetsCore({ ...record(input), search: text(input.search || "uniform", 200) });
}
export async function checkUniformAssetDuplicateCore(input = {}) {
  await requireUniformSession({ admin: true });
  return checkAssetDuplicateCore(input);
}
export async function prepareUniformAssetUploadCore(input = {}) {
  await requireUniformSession({ admin: true });
  return prepareAssetUploadCore({
    ...record(input),
    visibility: "PUBLIC",
    libraryRoot: text(input.libraryRoot || "UNIFORMS", 180),
    libraryFolder: text(input.libraryFolder || "Uniform Center", 240),
    librarySubfolder: text(input.librarySubfolder || "Products", 500),
    category: text(input.category || "IMAGE", 180),
    brand: text(input.brand || "SKANDI", 180),
    system: "Uniform Control",
    contextSystem: "Uniform Control",
    contextRecordType: text(input.contextRecordType || "UNIFORM_CATALOG_ITEM", 120),
    role: text(input.role || "PRODUCT_IMAGE", 120),
    fieldName: text(input.fieldName || "image_gallery", 180)
  });
}
export async function finalizeUniformAssetUploadCore(input = {}) {
  await requireUniformSession({ admin: true });
  return finalizeAssetUploadCore(input);
}
export async function getUniformAssetAccessUrlCore(input = {}) {
  await requireUniformSession({ admin: true });
  return getAssetAccessUrlCore(input);
}

export async function getUniformSystemStatusCore() {
  const session = await getStaffPortalSessionCore();
  return {
    ok: true,
    version: UNIFORM_CORE_VERSION,
    authorized: session?.authorized === true,
    admin: session?.authorized === true && hasAdminAccess(session),
    architecture: "SKANDI_CORE",
    sourceOfTruth: "Supabase Uniform tables + canonical staff/org + canonical Asset Library",
    transactionalStockReady: false
  };
}

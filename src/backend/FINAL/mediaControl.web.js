// src/backend/FINAL/mediaControl.web.js
// SKANDI Media Control — server-only Supabase Storage bridge.
// Reuses the existing backend Supabase admin client. Never expose its secret key.

import { currentMember } from "wix-members-backend";
import { Permissions, webMethod } from "wix-web-module";
import { getMagazineManagerSupabase } from "./supabaseAdmin";

const DEFAULT_UPLOAD_BUCKET = "inventory-media";
const DEFAULT_SIGNED_READ_SECONDS = 15 * 60;
const MAX_LIST_OBJECTS = 5000;
const PAGE_SIZE = 100;
const MEDIA_MANAGER_ROLES = new Set(["admin", "manager"]);
const ADMIN_ROLE_NAMES = new Set([
  "admin",
  "administrator",
  "site owner",
  "super admin",
  "system admin",
  "media admin",
  "marketing admin",
  "communications admin"
]);

function clean(value = "", max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function lower(value = "") {
  return clean(value, 500).toLowerCase();
}

function memberId(member) {
  return clean(member?._id || member?.id || member?.memberId || "", 200);
}

function memberEmail(member) {
  return clean(
    member?.loginEmail ||
      member?.contactDetails?.emails?.[0] ||
      member?.profile?.email ||
      member?.profile?.loginEmail ||
      "",
    320
  );
}

function displayName(member) {
  const first = clean(
    member?.contactDetails?.firstName || member?.profile?.firstName || "",
    100
  );
  const last = clean(
    member?.contactDetails?.lastName || member?.profile?.lastName || "",
    100
  );
  return (
    `${first} ${last}`.trim() ||
    clean(member?.profile?.nickname || memberEmail(member) || "Staff member", 200)
  );
}

function safeRoleName(role = {}) {
  return lower(role?.name || role?.title || role?.roleName || role?._id || role);
}

function assertResult(result, code) {
  if (result?.error) {
    console.error(`[Media Control] ${code}`, {
      message: result.error.message,
      code: result.error.code || null,
      status: result.error.status || null
    });
    throw new Error(code);
  }
  return result?.data;
}

async function getMediaActor() {
  const [member, roles] = await Promise.all([
    currentMember.getMember(),
    currentMember.getRoles().catch(() => [])
  ]);
  const wixMemberId = memberId(member);
  if (!wixMemberId) throw new Error("MEDIA_NOT_AUTHENTICATED");

  const supabase = await getMagazineManagerSupabase();
  let membership = null;
  let agent = null;

  try {
    const result = await supabase
      .from("dashboard_members")
      .select("organization_id, role, is_active")
      .eq("wix_member_id", wixMemberId)
      .eq("is_active", true)
      .maybeSingle();
    if (!result.error) membership = result.data || null;
  } catch (_) {
    membership = null;
  }

  try {
    const publicDb = supabase.schema("public");
    let result = await publicDb
      .from("agent_users")
      .select("id, sk_id, wix_member_id, member_id, email, corporate_email_address, display_name, preferred_name, job_title, department, base, station, active, status, employment_status, portal_access, authorized, can_manage")
      .eq("wix_member_id", wixMemberId)
      .limit(1)
      .maybeSingle();

    if (!result.error && result.data) {
      agent = result.data;
    } else {
      result = await publicDb
        .from("agent_users")
        .select("id, sk_id, wix_member_id, member_id, email, corporate_email_address, display_name, preferred_name, job_title, department, base, station, active, status, employment_status, portal_access, authorized, can_manage")
        .eq("member_id", wixMemberId)
        .limit(1)
        .maybeSingle();
      if (!result.error && result.data) agent = result.data;
    }
  } catch (_) {
    agent = null;
  }

  const wixAdmin = (Array.isArray(roles) ? roles : []).some((role) =>
    ADMIN_ROLE_NAMES.has(safeRoleName(role))
  );
  const mmManager =
    membership?.is_active !== false &&
    MEDIA_MANAGER_ROLES.has(lower(membership?.role));
  const staffManager =
    agent?.active === true &&
    agent?.portal_access === true &&
    agent?.authorized === true &&
    agent?.can_manage === true &&
    !["inactive", "terminated", "blocked", "suspended"].includes(
      lower(agent?.status || agent?.employment_status)
    );

  if (!wixAdmin && !mmManager && !staffManager) {
    throw new Error("MEDIA_ACCESS_DENIED");
  }

  return {
    supabase,
    wixMemberId,
    profile: {
      name: clean(agent?.display_name || agent?.preferred_name || displayName(member), 200),
      email: memberEmail(member),
      skId: clean(agent?.sk_id || "", 40),
      position: clean(agent?.job_title || membership?.role || "Media Manager", 120),
      department: clean(agent?.department || "", 120),
      base: clean(agent?.base || agent?.station || "", 80)
    }
  };
}

function bucketId(bucket = {}) {
  return clean(bucket.id || bucket.name || "", 180);
}

function bucketPublic(bucket = {}) {
  return bucket.public === true;
}

function bucketLimit(bucket = {}) {
  const value = Number(bucket.file_size_limit ?? bucket.fileSizeLimit ?? 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function bucketMimeTypes(bucket = {}) {
  const raw = bucket.allowed_mime_types ?? bucket.allowedMimeTypes ?? null;
  return Array.isArray(raw) ? raw.map((v) => lower(v)).filter(Boolean) : [];
}

function normalizeBucket(bucket = {}) {
  return {
    id: bucketId(bucket),
    name: clean(bucket.name || bucket.id || "", 180),
    public: bucketPublic(bucket),
    fileSizeLimit: bucketLimit(bucket),
    allowedMimeTypes: bucketMimeTypes(bucket),
    createdAt: bucket.created_at || bucket.createdAt || null,
    updatedAt: bucket.updated_at || bucket.updatedAt || null
  };
}

async function fetchBuckets(supabase) {
  const result = await supabase.storage.listBuckets({ limit: 100, offset: 0 });
  const data = assertResult(result, "MEDIA_BUCKET_LIST_FAILED") || [];
  return data.map(normalizeBucket).filter((bucket) => bucket.id);
}

function joinPath(prefix, name) {
  const left = clean(prefix, 1500).replace(/^\/+|\/+$/g, "");
  const right = clean(name, 500).replace(/^\/+|\/+$/g, "");
  return [left, right].filter(Boolean).join("/");
}

function isFolder(item = {}) {
  return item.id == null && item.metadata == null;
}

function mimeFrom(item = {}) {
  return lower(
    item?.metadata?.mimetype ||
      item?.metadata?.mimeType ||
      item?.metadata?.contentType ||
      ""
  );
}

function isImageMime(mime) {
  return /^image\/(jpeg|jpg|png|webp|avif|gif|svg\+xml)$/i.test(clean(mime, 100));
}

async function listAllFilesForBucket(supabase, bucket, maxObjects) {
  const storage = supabase.storage.from(bucket.id);
  const queue = [""];
  const seen = new Set();
  const files = [];
  let truncated = false;

  while (queue.length && files.length < maxObjects) {
    const prefix = queue.shift();
    if (seen.has(prefix)) continue;
    seen.add(prefix);

    let offset = 0;
    while (files.length < maxObjects) {
      const result = await storage.list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" }
      });
      const items = assertResult(result, "MEDIA_OBJECT_LIST_FAILED") || [];
      if (!items.length) break;

      for (const item of items) {
        const path = joinPath(prefix, item.name);
        if (!path) continue;
        if (isFolder(item)) {
          if (!seen.has(path)) queue.push(path);
        } else {
          files.push({ ...item, path });
          if (files.length >= maxObjects) {
            truncated = true;
            break;
          }
        }
      }
      if (items.length < PAGE_SIZE || files.length >= maxObjects) break;
      offset += PAGE_SIZE;
    }
  }

  if (queue.length) truncated = true;
  return { files, truncated };
}

function publicUrl(supabase, bucket, path) {
  const result = supabase.storage.from(bucket).getPublicUrl(path);
  return clean(result?.data?.publicUrl || result?.publicURL || "", 3000);
}

async function signedUrls(supabase, bucket, paths) {
  const map = new Map();
  const storage = supabase.storage.from(bucket);
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const result = await storage.createSignedUrls(batch, DEFAULT_SIGNED_READ_SECONDS);
    if (result?.error) {
      console.warn("[Media Control] Could not sign private asset batch.", {
        bucket,
        message: result.error.message
      });
      continue;
    }
    for (const row of result?.data || []) {
      const path = clean(row.path || row.name || "", 2000);
      const url = clean(row.signedUrl || row.signedURL || "", 4000);
      if (path && url) map.set(path, url);
    }
  }
  return map;
}

async function normalizeFiles(supabase, bucket, files) {
  const privateSigns = bucket.public
    ? new Map()
    : await signedUrls(
        supabase,
        bucket.id,
        files.map((file) => file.path)
      );

  return files.map((file) => {
    const mimeType = mimeFrom(file);
    const url = bucket.public
      ? publicUrl(supabase, bucket.id, file.path)
      : privateSigns.get(file.path) || "";
    return {
      id: clean(file.id || `${bucket.id}:${file.path}`, 500),
      assetId: `${bucket.id}:${file.path}`,
      bucket: bucket.id,
      path: file.path,
      name: clean(file.name || file.path.split("/").pop() || "Asset", 500),
      public: bucket.public,
      private: !bucket.public,
      mimeType,
      size: Number(file?.metadata?.size || file?.metadata?.contentLength || 0) || 0,
      createdAt: file.created_at || file.createdAt || null,
      updatedAt: file.updated_at || file.updatedAt || null,
      isImage: isImageMime(mimeType),
      url,
      imageUrl: isImageMime(mimeType) ? url : "",
      thumbUrl: isImageMime(mimeType) ? url : "",
      readUrl: url,
      usageAllowed: bucket.public === true && isImageMime(mimeType),
      provider: "Supabase Storage",
      license: bucket.public ? "Managed public asset" : "Private internal asset"
    };
  });
}

async function loadMediaAssets(input = {}) {
  const actor = await getMediaActor();
  const buckets = await fetchBuckets(actor.supabase);
  const requestedBucket = clean(input.bucket || "", 180);
  const query = lower(input.query || input.search || "");
  const imagesOnly = input.imagesOnly === true;
  const maxObjects = Math.max(
    1,
    Math.min(MAX_LIST_OBJECTS, Number(input.limit || MAX_LIST_OBJECTS) || MAX_LIST_OBJECTS)
  );

  const selected = requestedBucket
    ? buckets.filter((bucket) => bucket.id === requestedBucket)
    : buckets;
  if (requestedBucket && !selected.length) throw new Error("MEDIA_BUCKET_NOT_FOUND");

  const assets = [];
  let truncated = false;
  const bucketCounts = {};

  for (const bucket of selected) {
    if (assets.length >= maxObjects) {
      truncated = true;
      break;
    }
    const remaining = maxObjects - assets.length;
    const listed = await listAllFilesForBucket(actor.supabase, bucket, remaining);
    const normalized = await normalizeFiles(actor.supabase, bucket, listed.files);
    const filtered = normalized.filter((asset) => {
      if (imagesOnly && !asset.isImage) return false;
      if (!query) return true;
      return [asset.bucket, asset.path, asset.name, asset.mimeType]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
    bucketCounts[bucket.id] = listed.files.length;
    assets.push(...filtered);
    if (listed.truncated) truncated = true;
  }

  assets.sort((a, b) => {
    const ad = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bd = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bd - ad || a.path.localeCompare(b.path);
  });

  return {
    ok: true,
    profile: actor.profile,
    buckets,
    assets,
    bucketCounts,
    total: assets.length,
    truncated,
    defaultUploadBucket:
      buckets.find((bucket) => bucket.id === DEFAULT_UPLOAD_BUCKET)?.id ||
      buckets.find((bucket) => bucket.public)?.id ||
      buckets[0]?.id ||
      "",
    generatedAt: new Date().toISOString()
  };
}

function sanitizeSegment(value = "") {
  return clean(value, 240)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 180);
}

function sanitizeFolder(value = "") {
  return clean(value, 1000)
    .split("/")
    .map(sanitizeSegment)
    .filter(Boolean)
    .slice(0, 12)
    .join("/");
}

function uniqueObjectPath(fileName, folder = "") {
  const safeName = sanitizeSegment(fileName) || "asset";
  const dot = safeName.lastIndexOf(".");
  const base = dot > 0 ? safeName.slice(0, dot) : safeName;
  const ext = dot > 0 ? safeName.slice(dot).toLowerCase() : "";
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 9);
  const safeFolder = sanitizeFolder(folder);
  const defaultFolder = `media/${new Date().getUTCFullYear()}/${String(
    new Date().getUTCMonth() + 1
  ).padStart(2, "0")}`;
  return `${safeFolder || defaultFolder}/${stamp}-${random}-${base}${ext}`;
}

function validateUpload(bucket, input = {}) {
  const fileName = clean(input.fileName || input.name || "", 500);
  const mimeType = lower(input.mimeType || input.type || "");
  const size = Number(input.size || 0);
  if (!fileName) throw new Error("MEDIA_FILE_NAME_REQUIRED");
  if (!mimeType) throw new Error("MEDIA_FILE_TYPE_REQUIRED");
  if (!Number.isFinite(size) || size <= 0) throw new Error("MEDIA_FILE_SIZE_INVALID");

  const limit = bucket.fileSizeLimit;
  if (limit && size > limit) throw new Error("MEDIA_FILE_TOO_LARGE");
  const allowed = bucket.allowedMimeTypes || [];
  if (allowed.length && !allowed.includes(mimeType)) {
    throw new Error("MEDIA_FILE_TYPE_NOT_ALLOWED");
  }
  return { fileName, mimeType, size };
}

export const getMediaControlBootstrap = webMethod(
  Permissions.SiteMember,
  async (input = {}) => loadMediaAssets({ ...input, limit: input.limit || MAX_LIST_OBJECTS })
);

export const listMediaAssets = webMethod(
  Permissions.SiteMember,
  async (input = {}) => loadMediaAssets(input)
);

export const createMediaUpload = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    const actor = await getMediaActor();
    const buckets = await fetchBuckets(actor.supabase);
    const requested = clean(input.bucket || DEFAULT_UPLOAD_BUCKET, 180);
    const bucket = buckets.find((item) => item.id === requested);
    if (!bucket) throw new Error("MEDIA_BUCKET_NOT_FOUND");

    const file = validateUpload(bucket, input);
    const path = uniqueObjectPath(file.fileName, input.folder || "");
    const result = await actor.supabase.storage
      .from(bucket.id)
      .createSignedUploadUrl(path, { upsert: false });
    const data = assertResult(result, "MEDIA_SIGNED_UPLOAD_FAILED") || {};
    const signedUrl = clean(data.signedUrl || data.signedURL || "", 5000);
    if (!signedUrl) throw new Error("MEDIA_SIGNED_UPLOAD_MISSING_URL");

    return {
      ok: true,
      requestId: clean(input.requestId || "", 200),
      bucket: bucket.id,
      path,
      mimeType: file.mimeType,
      size: file.size,
      signedUrl,
      token: clean(data.token || "", 4000),
      public: bucket.public,
      expiresInSeconds: 2 * 60 * 60
    };
  }
);

export const finalizeMediaUpload = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    const actor = await getMediaActor();
    const buckets = await fetchBuckets(actor.supabase);
    const bucketIdValue = clean(input.bucket || "", 180);
    const path = clean(input.path || "", 1800).replace(/^\/+/, "");
    const bucket = buckets.find((item) => item.id === bucketIdValue);
    if (!bucket) throw new Error("MEDIA_BUCKET_NOT_FOUND");
    if (!path || path.includes("..")) throw new Error("MEDIA_OBJECT_PATH_INVALID");

    const slash = path.lastIndexOf("/");
    const folder = slash >= 0 ? path.slice(0, slash) : "";
    const fileName = slash >= 0 ? path.slice(slash + 1) : path;
    const result = await actor.supabase.storage.from(bucket.id).list(folder, {
      limit: 20,
      offset: 0,
      search: fileName
    });
    const rows = assertResult(result, "MEDIA_UPLOAD_VERIFY_FAILED") || [];
    const item = rows.find((row) => row.name === fileName && !isFolder(row));
    if (!item) throw new Error("MEDIA_UPLOAD_NOT_FOUND");

    const [asset] = await normalizeFiles(actor.supabase, bucket, [
      { ...item, path }
    ]);
    return {
      ok: true,
      requestId: clean(input.requestId || "", 200),
      asset,
      generatedAt: new Date().toISOString()
    };
  }
);

export const refreshMediaAssetUrl = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    const actor = await getMediaActor();
    const buckets = await fetchBuckets(actor.supabase);
    const bucketIdValue = clean(input.bucket || "", 180);
    const path = clean(input.path || "", 1800).replace(/^\/+/, "");
    const bucket = buckets.find((item) => item.id === bucketIdValue);
    if (!bucket || !path) throw new Error("MEDIA_ASSET_NOT_FOUND");
    if (bucket.public) {
      return { ok: true, url: publicUrl(actor.supabase, bucket.id, path), public: true };
    }
    const result = await actor.supabase.storage
      .from(bucket.id)
      .createSignedUrl(path, DEFAULT_SIGNED_READ_SECONDS);
    const data = assertResult(result, "MEDIA_SIGNED_READ_FAILED") || {};
    return {
      ok: true,
      url: clean(data.signedUrl || data.signedURL || "", 5000),
      public: false,
      expiresInSeconds: DEFAULT_SIGNED_READ_SECONDS
    };
  }
);

import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

import {
  findAgentByMemberOrEmail,
  isAgentAuthorized
} from "./RIA/staffPortalAuth.repository.js";

const SUPABASE_URL_SECRET = "SUPABASE_URL";
const SUPABASE_SERVICE_ROLE_SECRET = "SUPABASE_SERVICE_ROLE_KEY";
const UNIFORM_IMAGE_BUCKET = "uniform-assets";
const MAX_UNIFORM_IMAGES = 12;
const MAX_UNIFORM_IMAGE_BYTES = 5 * 1024 * 1024;

let supabaseCache = null;

/* =========================================================
   SUPABASE
   ========================================================= */

async function getSupabaseConfig() {
  if (supabaseCache?.url && supabaseCache?.key) {
    return supabaseCache;
  }

  const url = String(
    (await getSecret(SUPABASE_URL_SECRET)) || ""
  ).replace(/\/$/, "");

  const key = String(
    (await getSecret(SUPABASE_SERVICE_ROLE_SECRET)) || ""
  ).trim();

  if (!url || !key) {
    throw new Error("Supabase secrets are missing.");
  }

  supabaseCache = { url, key };
  return supabaseCache;
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = await getSupabaseConfig();

  const response = await fetch(
    `${url}/rest/v1/${String(path).replace(/^\//, "")}`,
    {
      method: options.method || "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(options.prefer
          ? { Prefer: options.prefer }
          : {}),
        ...(options.headers || {})
      },
      body: options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined
    }
  );

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Supabase request failed: ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   STORAGE
   ========================================================= */

function storageObjectPath(objectPath) {
  return String(objectPath || "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

function storagePublicUrl(bucket, objectPath, explicitBaseUrl = "") {
  const base = String(
    explicitBaseUrl ||
    supabaseCache?.url ||
    ""
  ).replace(/\/$/, "");

  if (!base) {
    throw new Error(
      "Supabase URL is unavailable for the Storage public URL."
    );
  }

  const encodedPath = storageObjectPath(objectPath);

  return (
    `${base}/storage/v1/object/public/` +
    `${encodeURIComponent(bucket)}/${encodedPath}`
  );
}

function imageExtension(mimeType = "") {
  const mime = String(mimeType || "").toLowerCase();

  if (mime === "image/jpeg" || mime === "image/jpg") {
    return "jpg";
  }

  if (mime === "image/png") {
    return "png";
  }

  if (mime === "image/webp") {
    return "webp";
  }

  if (mime === "image/gif") {
    return "gif";
  }

  return "";
}

function base64ToBytes(base64 = "") {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const clean = String(base64 || "")
    .replace(/[^A-Za-z0-9+/=]/g, "");

  const bytes = [];

  for (let i = 0; i < clean.length; i += 4) {
    const c1 = chars.indexOf(clean[i]);
    const c2 = chars.indexOf(clean[i + 1]);
    const c3 =
      clean[i + 2] === "="
        ? -1
        : chars.indexOf(clean[i + 2]);
    const c4 =
      clean[i + 3] === "="
        ? -1
        : chars.indexOf(clean[i + 3]);

    if (c1 < 0 || c2 < 0) {
      continue;
    }

    const n =
      (c1 << 18) |
      (c2 << 12) |
      ((c3 < 0 ? 0 : c3) << 6) |
      (c4 < 0 ? 0 : c4);

    bytes.push((n >> 16) & 255);

    if (c3 >= 0) {
      bytes.push((n >> 8) & 255);
    }

    if (c4 >= 0) {
      bytes.push(n & 255);
    }
  }

  return new Uint8Array(bytes);
}

function extractImageBase64(input = {}) {
  const dataUrl = String(
    input.dataUrl ||
    input.data_url ||
    ""
  ).trim();

  if (dataUrl) {
    const match = dataUrl.match(
      /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i
    );

    if (!match) {
      throw new Error("Invalid image data.");
    }

    return {
      mimeType: match[1].toLowerCase(),
      base64: match[2]
    };
  }

  return {
    mimeType: String(
      input.mimeType ||
      input.mime_type ||
      ""
    ).toLowerCase(),
    base64: String(input.base64 || "").trim()
  };
}

async function uploadUniformImageToStorage(input = {}) {
  const { url, key } = await getSupabaseConfig();

  const extracted = extractImageBase64(input);
  const mimeType = extracted.mimeType;
  const extension = imageExtension(mimeType);

  if (!extension) {
    throw new Error(
      "Only PNG, JPG, WebP and GIF images are allowed."
    );
  }

  if (!extracted.base64) {
    throw new Error("Image file data is required.");
  }

  const bytes = base64ToBytes(extracted.base64);

  if (!bytes.length) {
    throw new Error("Image file data is empty.");
  }

  if (bytes.length > MAX_UNIFORM_IMAGE_BYTES) {
    throw new Error(
      "Image is too large. Maximum size is 5 MB."
    );
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

  const random = Math.random()
    .toString(36)
    .slice(2, 8);

  const objectPath =
    `catalog/${itemPart}-${stamp}-${random}.${extension}`;

  const response = await fetch(
    `${url}/storage/v1/object/` +
    `${encodeURIComponent(UNIFORM_IMAGE_BUCKET)}/` +
    `${storageObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
        "Cache-Control": "3600"
      },
      body: bytes
    }
  );

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Uniform image upload failed: ${response.status}`
    );
  }

  return {
    objectPath,
    mimeType,
    size: bytes.length,
    url: storagePublicUrl(
      UNIFORM_IMAGE_BUCKET,
      objectPath,
      url
    )
  };
}

async function createUniformSignedUpload(input = {}) {
  await requireUniformAdmin();

  const requestId = cleanText(
    input.requestId ||
    input.request_id ||
    "",
    120
  );

  const fileName = cleanText(
    input.fileName ||
    input.file_name ||
    "",
    240
  );

  const mimeType = cleanText(
    input.mimeType ||
    input.mime_type ||
    "",
    120
  ).toLowerCase();

  const size = Number(
    input.size ||
    input.fileSize ||
    input.file_size ||
    0
  );

  const extension = imageExtension(mimeType);

  if (!extension) {
    throw new Error(
      "Only PNG, JPG, WebP and GIF images are allowed."
    );
  }

  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Image file size is required.");
  }

  if (size > MAX_UNIFORM_IMAGE_BYTES) {
    throw new Error(
      "Image is too large. Maximum size is 5 MB."
    );
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

  const random = Math.random()
    .toString(36)
    .slice(2, 10);

  const objectPath =
    `catalog/${itemPart}-${stamp}-${random}.${extension}`;

  const { url, key } = await getSupabaseConfig();

  const response = await fetch(
    `${url}/storage/v1/object/upload/sign/` +
    `${encodeURIComponent(UNIFORM_IMAGE_BUCKET)}/` +
    `${storageObjectPath(objectPath)}`,
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
    } catch (error) {
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
    throw new Error(
      "Supabase did not return a signed upload URL."
    );
  }

  let signedUrl = returnedUrl;

  if (!/^https?:\/\//i.test(signedUrl)) {
    if (signedUrl.startsWith("/storage/v1/")) {
      signedUrl = `${url}${signedUrl}`;
    } else if (signedUrl.startsWith("/object/")) {
      signedUrl =
        `${url}/storage/v1${signedUrl}`;
    } else {
      signedUrl =
        `${url}/storage/v1/` +
        signedUrl.replace(/^\/+/, "");
    }
  }

  const tokenMatch =
    signedUrl.match(/[?&]token=([^&]+)/i);

  const token = tokenMatch
    ? decodeURIComponent(tokenMatch[1])
    : "";

  const publicUrl = storagePublicUrl(
    UNIFORM_IMAGE_BUCKET,
    objectPath,
    url
  );

  return {
    ok: true,
    mode: "CREATE_SIGNED_UPLOAD",
    requestId,
    fileName,
    mimeType,
    size,
    bucket: UNIFORM_IMAGE_BUCKET,
    objectPath,
    storagePath: objectPath,
    signedUrl,
    token,
    imageUrl: publicUrl,
    publicUrl
  };
}

async function completeUniformSignedUpload(input = {}) {
  const { agent } = await requireUniformAdmin();
  const { url } = await getSupabaseConfig();

  const requestId = cleanText(
    input.requestId ||
    input.request_id ||
    "",
    120
  );

  const objectPath = cleanText(
    input.objectPath ||
    input.storagePath ||
    input.object_path ||
    input.storage_path ||
    "",
    1000
  );

  const fileName = cleanText(
    input.fileName ||
    input.file_name ||
    "",
    240
  );

  const mimeType = cleanText(
    input.mimeType ||
    input.mime_type ||
    "",
    120
  ).toLowerCase();

  const size = Number(
    input.size ||
    input.fileSize ||
    input.file_size ||
    0
  );

  const itemId = cleanText(
    input.itemId ||
    input.item_id ||
    "",
    160
  );

  const extension = imageExtension(mimeType);

  if (
    !objectPath ||
    !objectPath.startsWith("catalog/")
  ) {
    throw new Error(
      "Invalid Uniform image storage path."
    );
  }

  if (!extension) {
    throw new Error(
      "Invalid Uniform image MIME type."
    );
  }

  if (
    !objectPath
      .toLowerCase()
      .endsWith(`.${extension}`)
  ) {
    throw new Error(
      "Uniform image extension does not match its MIME type."
    );
  }

  if (
    !Number.isFinite(size) ||
    size <= 0 ||
    size > MAX_UNIFORM_IMAGE_BYTES
  ) {
    throw new Error(
      "Invalid Uniform image size."
    );
  }

  const imageUrl = storagePublicUrl(
    UNIFORM_IMAGE_BUCKET,
    objectPath,
    url
  );

  const uploadedAt =
    new Date().toISOString();

  await logAudit(
    "uniform_image_uploaded",
    {
      entityTable: "uniform_catalog_items",
      entityId: itemId,
      message:
        "Uniform catalog image uploaded with signed Storage URL.",
      payload: {
        requestId,
        objectPath,
        imageUrl,
        fileName,
        mimeType,
        size
      }
    },
    agent
  );

  return {
    ok: true,
    mode: "COMPLETE_SIGNED_UPLOAD",
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


/* =========================================================
   SKU-DRIVEN STORAGE ASSETS
   ========================================================= */

function assetFileName(storagePath = "") {
  const parts = String(storagePath || "").split("/");
  return parts[parts.length - 1] || "";
}

function assetStem(storagePath = "") {
  return assetFileName(storagePath)
    .replace(/\.(png|jpe?g|webp|gif)$/i, "");
}

function assetMimeType(row = {}) {
  const metadata = row.metadata || {};
  const supplied = cleanText(
    metadata.mimetype ||
    metadata.mimeType ||
    metadata.contentType ||
    "",
    120
  ).toLowerCase();

  if (supplied) {
    return supplied;
  }

  const fileName = assetFileName(row.name).toLowerCase();

  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  if (fileName.endsWith(".webp")) return "image/webp";
  if (fileName.endsWith(".gif")) return "image/gif";

  return "";
}

function isSupportedUniformAsset(row = {}) {
  return Boolean(imageExtension(assetMimeType(row)));
}

function uniformAssetsForSku(storageRows = [], skuValue = "") {
  const sku = cleanUpper(skuValue, 80);

  if (!sku) {
    return {
      gallery: [],
      exactMainFound: false,
      matchedFiles: []
    };
  }

  const matches = (storageRows || [])
    .filter(isSupportedUniformAsset)
    .map(row => {
      const stem = assetStem(row.name);
      const upperStem = String(stem || "").toUpperCase();

      if (
        upperStem !== sku &&
        !upperStem.startsWith(`${sku}-`)
      ) {
        return null;
      }

      const exact = upperStem === sku;
      const fileName = assetFileName(row.name);
      const mimeType = assetMimeType(row);
      const storagePath = String(row.name || "");
      const publicUrl = storagePublicUrl(
        UNIFORM_IMAGE_BUCKET,
        storagePath
      );

      return {
        exact,
        storagePath,
        fileName,
        mimeType,
        publicUrl,
        createdAt: row.created_at || "",
        updatedAt: row.updated_at || ""
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.exact !== b.exact) {
        return a.exact ? -1 : 1;
      }

      return a.fileName.localeCompare(
        b.fileName,
        undefined,
        { sensitivity: "base" }
      );
    });

  const gallery = matches
    .slice(0, MAX_UNIFORM_IMAGES)
    .map((asset, index) => ({
      url: asset.publicUrl,
      imageUrl: asset.publicUrl,
      storagePath: asset.storagePath,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      alt: index === 0
        ? sku
        : `${sku} ${assetStem(asset.fileName).slice(sku.length + 1) || `image ${index + 1}`}`,
      sortOrder: index + 1,
      uploadedAt: asset.createdAt || asset.updatedAt || ""
    }));

  return {
    gallery,
    exactMainFound: matches.some(asset => asset.exact),
    matchedFiles: matches.map(asset => asset.storagePath)
  };
}

async function listUniformStorageAssets() {
  const rows = await supabaseRequest(
    "uniform_storage_assets?" +
    "select=name,metadata,created_at,updated_at&" +
    "order=name.asc&" +
    "limit=5000"
  );

  return Array.isArray(rows)
    ? rows
    : [];
}

/* =========================================================
   CLEANING / NORMALIZATION
   ========================================================= */

function cleanText(value, max = 255) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

function cleanKey(value, max = 100) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max);
}

function cleanUpper(value, max = 80) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, max);
}

function cleanError(error) {
  const message = String(
    error?.message ||
    error?.details ||
    error?.error ||
    error ||
    ""
  ).trim();

  return message ||
    "Uniform Center request failed.";
}

function intValue(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n)
    ? Math.round(n)
    : fallback;
}

function boolValue(value, fallback = true) {
  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return fallback;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(value || ""));
}

function arr(value) {
  if (Array.isArray(value)) {
    return value
      .map(v => cleanText(v, 80))
      .filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map(v => cleanText(v, 80))
    .filter(Boolean);
}

function cleanImageGallery(value) {
  const raw = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const gallery = [];

  for (const entry of raw) {
    const image =
      typeof entry === "string"
        ? { url: entry }
        : (entry || {});

    const url = cleanText(
      image.url ||
      image.imageUrl ||
      image.image_url,
      1000
    );

    if (!url) {
      continue;
    }

    gallery.push({
      url,
      imageUrl: url,
      storagePath: cleanText(
        image.storagePath ||
        image.imageStoragePath ||
        image.storage_path ||
        image.image_storage_path,
        1000
      ),
      mimeType: cleanText(
        image.mimeType ||
        image.imageMimeType ||
        image.mime_type ||
        image.image_mime_type,
        120
      ),
      fileName: cleanText(
        image.fileName ||
        image.file_name ||
        "",
        240
      ),
      alt: cleanText(
        image.alt ||
        image.title ||
        "",
        240
      ),
      sortOrder: intValue(
        image.sortOrder ||
        image.sort_order ||
        gallery.length + 1,
        gallery.length + 1
      ),
      uploadedAt: cleanText(
        image.uploadedAt ||
        image.uploaded_at ||
        image.imageUploadedAt ||
        image.image_uploaded_at ||
        new Date().toISOString(),
        80
      )
    });
  }

  return gallery.slice(0, MAX_UNIFORM_IMAGES);
}

/* =========================================================
   STAFF / ACCESS
   ========================================================= */

function displayName(agent = {}) {
  return (
    agent.display_name ||
    agent.displayName ||
    agent.full_name ||
    agent.fullName ||
    agent.name ||
    [
      agent.first_name || agent.firstName,
      agent.last_name || agent.lastName
    ]
      .filter(Boolean)
      .join(" ") ||
    agent.email ||
    agent.corporate_email_address ||
    agent.sk_id ||
    "Staff"
  );
}

function agentSkId(agent = {}) {
  return (
    agent.sk_id ||
    agent.skId ||
    agent.skID ||
    ""
  );
}

function agentEmail(agent = {}) {
  return (
    agent.email ||
    agent.corporate_email_address ||
    agent.loginEmail ||
    ""
  );
}

function agentRole(agent = {}) {
  return cleanKey(
    agent.role ||
    agent.position ||
    agent.job_title ||
    agent.jobTitle ||
    "ALL",
    80
  ).toUpperCase();
}

function agentDepartment(agent = {}) {
  return (
    agent.department ||
    agent.assigned_department ||
    agent.assignedDepartment ||
    agent.department_name ||
    agent.departmentName ||
    ""
  );
}

function agentBase(agent = {}) {
  return (
    agent.base ||
    agent.station ||
    agent.assigned_base ||
    agent.assignedBase ||
    agent.base_airport_iata ||
    agent.baseAirportIata ||
    ""
  );
}

function normalizeEligibilityToken(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s./]+/g, "_")
    .replace(/-+/g, "_")
    .replace(/_+/g, "_");
}

function eligibilityArray(value) {
  const values = Array.isArray(value)
    ? value
    : value === null || value === undefined || value === ""
      ? []
      : String(value)
          .split(",")
          .map(v => v.trim());

  return [...new Set(
    values
      .map(normalizeEligibilityToken)
      .filter(Boolean)
  )];
}

function dimensionAllows(allowed = [], candidates = []) {
  const rules = eligibilityArray(allowed);

  if (!rules.length || rules.includes("ALL")) {
    return true;
  }

  const actual = eligibilityArray(candidates);
  return actual.some(value => rules.includes(value));
}

function itemEligibleForAgent(row = {}, agent = {}) {
  const roles = [
    agent.role,
    agent.position,
    agent.job_title,
    agent.jobTitle,
    agentRole(agent)
  ];

  const departments = [
    agent.department,
    agent.assigned_department,
    agent.assignedDepartment,
    agent.department_name,
    agent.departmentName,
    agentDepartment(agent)
  ];

  const bases = [
    agent.base,
    agent.station,
    agent.assigned_base,
    agent.assignedBase,
    agent.base_airport_iata,
    agent.baseAirportIata,
    agentBase(agent)
  ];

  return (
    dimensionAllows(
      row.available_roles ||
      row.availableRoles ||
      [],
      roles
    ) &&
    dimensionAllows(
      row.available_departments ||
      row.availableDepartments ||
      [],
      departments
    ) &&
    dimensionAllows(
      row.available_bases ||
      row.availableBases ||
      [],
      bases
    )
  );
}

function agentCanManageUniform(agent = {}) {
  if (
    agent.can_manage_uniforms === true ||
    agent.canManageUniforms === true ||
    agent.can_manage === true ||
    agent.canManage === true
  ) {
    return true;
  }

  const role = String(
    agent.role ||
    agent.position ||
    agent.job_title ||
    agent.jobTitle ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return new Set([
    "owner",
    "company_owner",
    "admin",
    "super_admin",
    "superadmin",
    "manager",
    "operations_admin",
    "hr_admin",
    "hr_manager",
    "uniform_admin",
    "uniform_manager",
    "altea_admin"
  ]).has(role);
}

async function requireAgent() {
  const member =
    await currentMember
      .getMember()
      .catch(() => null);

  if (!member) {
    throw new Error(
      "Staff login required."
    );
  }

  const memberId =
    member._id ||
    member.id ||
    "";

  const email =
    member.loginEmail ||
    member.email ||
    member.contactDetails?.emails?.[0] ||
    "";

  const agent =
    await findAgentByMemberOrEmail({
      memberId,
      email
    });

  if (
    !agent ||
    !isAgentAuthorized(agent)
  ) {
    throw new Error(
      "You are not authorized to access Uniform Center."
    );
  }

  return { member, agent };
}

async function requireUniformAdmin() {
  const context = await requireAgent();

  if (
    !agentCanManageUniform(context.agent)
  ) {
    throw new Error(
      "Uniform Control admin permission required."
    );
  }

  return context;
}

/* =========================================================
   MAPPERS
   ========================================================= */

function mapCategory(row = {}) {
  return {
    id: row.id || "",
    categoryKey: row.category_key || "",
    title: row.title || "",
    description: row.description || "",
    sortOrder: row.sort_order || 100,
    active: row.active !== false,
    payload: row.payload || {}
  };
}

function mapCatalogItem(row = {}, storageRows = []) {
  const skuAssets = uniformAssetsForSku(
    storageRows,
    row.item_code || ""
  );

  const imageGallery = skuAssets.gallery;
  const primary = imageGallery[0] || {};

  return {
    _id: row.id || "",
    itemId: row.id || "",
    itemCode: row.item_code || "",
    title: row.title || "",
    categoryKey: row.category_key || "",
    category:
      row.category_title ||
      row.category_key ||
      "",
    subCategory:
      row.sub_category || "",
    availableRoles:
      eligibilityArray(row.available_roles || []),
    availableDepartments:
      eligibilityArray(row.available_departments || []),
    availableBases:
      eligibilityArray(row.available_bases || []),
    itemRegulations:
      row.item_regulations || "",
    pointsCost: row.points_cost || 0,
    stockStatus:
      row.stock_status ||
      "IN_STOCK",
    active: row.active !== false,
    sizes: Array.isArray(row.sizes)
      ? row.sizes
      : [],
    imageUrl:
      primary.url || "",
    imageStoragePath:
      primary.storagePath || "",
    imageMimeType:
      primary.mimeType || "",
    imageUploadedAt:
      primary.uploadedAt || "",
    imageGallery,
    imageUrls:
      imageGallery
        .map(img => img.url || img.imageUrl || "")
        .filter(Boolean),
    imageAssetSource: "SKU_STORAGE",
    imageAssetCount: imageGallery.length,
    imageAssetMainExact:
      skuAssets.exactMainFound,
    imageAssetFiles:
      skuAssets.matchedFiles,
    description:
      row.description || "",
    details:
      row.details || "",
    careInstructions:
      row.care_instructions || "",
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
    roleKey: row.role_key || "ALL",
    monthlyPoints:
      row.monthly_points || 0,
    summary: row.summary || "",
    active: row.active !== false,
    sortOrder:
      row.sort_order || 100,
    payload: row.payload || {}
  };
}

function mapWallet(row = {}) {
  return {
    id: row.id || "",
    walletId: row.id || "",
    agentUserId:
      row.agent_user_id || "",
    skId: row.sk_id || "",
    email: row.email || "",
    displayName:
      row.display_name || "",
    availablePoints:
      row.available_points || 0,
    heldPoints:
      row.held_points || 0,
    spentPoints:
      row.spent_points || 0,
    status: row.status || "active",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapOrder(row = {}, items = []) {
  return {
    id: row.id || "",
    orderId: row.id || "",
    orderNumber:
      row.order_number || "",
    agentUserId:
      row.agent_user_id || "",
    skId: row.sk_id || "",
    staffName:
      row.staff_name || "",
    email: row.email || "",
    status: row.status || "PENDING",
    totalPoints:
      row.total_points || 0,
    note: row.note || "",
    walletId:
      row.wallet_id || "",
    walletEffectStatus:
      row.wallet_effect_status || "",
    summary: items.length
      ? items
          .map(
            i =>
              `${i.quantity || 1}× ${i.title}` +
              `${i.size ? ` (${i.size})` : ""}`
          )
          .join(", ")
      : row.note || "",
    items,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function mapOrderItem(row = {}) {
  return {
    id: row.id || "",
    itemId: row.item_id || "",
    itemCode:
      row.item_code || "",
    title: row.title || "",
    category: row.category || "",
    size: row.size || "",
    quantity: row.quantity || 1,
    pointsCost:
      row.points_cost || 0,
    linePoints:
      row.line_points || 0,
    payload: row.payload || {}
  };
}

function mapPolicy(row = {}) {
  if (!row?.id) {
    return null;
  }

  return {
    id: row.id,
    policyId: row.id,
    policyKey:
      row.policy_key || "",
    title: row.title || "",
    policyVersion:
      row.policy_version || "",
    effectiveDate:
      row.effective_date || "",
    documentId:
      row.document_id || "",
    pdfUrl:
      row.pdf_url || "",
    body: row.body || "",
    active: row.active !== false,
    payload: row.payload || {}
  };
}

function mapAudit(row = {}) {
  return {
    id: row.id || "",
    eventType:
      row.event_type || "",
    entityTable:
      row.entity_table || "",
    entityId:
      row.entity_id || "",
    orderNumber:
      row.order_number || "",
    actorAgentUserId:
      row.actor_agent_user_id || "",
    actorSkId:
      row.actor_sk_id || "",
    actorName:
      row.actor_name || "",
    message: row.message || "",
    payload: row.payload || {},
    createdAt: row.created_at || ""
  };
}

/* =========================================================
   AUDIT / ORDERS / WALLETS
   ========================================================= */

async function logAudit(
  eventType,
  input = {},
  agent = {}
) {
  await supabaseRequest(
    "uniform_audit",
    {
      method: "POST",
      body: {
        event_type:
          cleanText(eventType, 120),
        entity_table:
          cleanText(
            input.entityTable,
            120
          ),
        entity_id:
          cleanText(
            input.entityId,
            160
          ),
        order_number:
          cleanText(
            input.orderNumber,
            80
          ),
        actor_agent_user_id:
          agent?.id || null,
        actor_sk_id:
          agentSkId(agent),
        actor_name:
          displayName(agent),
        message:
          cleanText(
            input.message ||
            eventType,
            1000
          ),
        payload:
          input.payload ||
          input ||
          {}
      },
      prefer: "return=minimal"
    }
  ).catch(() => null);
}

async function listOrderItems(
  orderIds = []
) {
  const ids =
    orderIds.filter(isUuid);

  if (!ids.length) {
    return {};
  }

  const rows =
    await supabaseRequest(
      `uniform_order_items?` +
      `order_id=in.(` +
      `${ids.map(encodeURIComponent).join(",")}` +
      `)&select=*&order=created_at.asc&limit=2000`
    );

  return (rows || []).reduce(
    (acc, row) => {
      const key = row.order_id;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(
        mapOrderItem(row)
      );

      return acc;
    },
    {}
  );
}

async function listOrders(
  pathBase =
    "uniform_orders?select=*&order=created_at.desc&limit=500"
) {
  const rows =
    await supabaseRequest(pathBase);

  const itemsByOrder =
    await listOrderItems(
      (rows || [])
        .map(row => row.id)
    );

  return (rows || []).map(
    row =>
      mapOrder(
        row,
        itemsByOrder[row.id] || []
      )
  );
}

async function latestPolicy() {
  const rows =
    await supabaseRequest(
      "uniform_policies?" +
      "select=*&active=eq.true&" +
      "order=created_at.desc&limit=1"
    );

  return mapPolicy(rows?.[0]);
}

async function activeAllowanceForAgent(
  agent = {}
) {
  const role = agentRole(agent);

  const rows =
    await supabaseRequest(
      "uniform_allowance_rules?" +
      "select=*&active=eq.true&" +
      `or=(role_key.eq.${encodeURIComponent(role)},role_key.eq.ALL)&` +
      "order=role_key.desc,sort_order.asc&limit=1"
    );

  return rows?.[0] || null;
}

async function ensureWallet(
  agent = {}
) {
  if (!agent?.id) {
    throw new Error(
      "Staff profile is missing an agent ID."
    );
  }

  const existing =
    await supabaseRequest(
      "uniform_wallets?" +
      "select=*&" +
      `agent_user_id=eq.${encodeURIComponent(agent.id)}&` +
      "limit=1"
    );

  if (existing?.[0]) {
    return existing[0];
  }

  const rule =
    await activeAllowanceForAgent(agent)
      .catch(() => null);

  const created =
    await supabaseRequest(
      "uniform_wallets?on_conflict=agent_user_id",
      {
        method: "POST",
        body: {
          agent_user_id: agent.id,
          sk_id: agentSkId(agent),
          email: agentEmail(agent),
          display_name:
            displayName(agent),
          available_points:
            intValue(
              rule?.monthly_points,
              0
            ),
          held_points: 0,
          spent_points: 0,
          status: "active",
          payload: {
            initializedFromRule:
              rule?.rule_key || ""
          },
          created_by_agent_user_id:
            agent.id
        },
        prefer:
          "resolution=merge-duplicates,return=representation"
      }
    );

  return created?.[0] || null;
}

async function getWalletByIdentity(
  input = {}
) {
  const skId = cleanUpper(
    input.skId ||
    input.skID ||
    input.sk_id,
    80
  );

  const email = cleanText(
    input.email,
    240
  ).toLowerCase();

  const agentUserId =
    cleanText(
      input.agentUserId ||
      input.agent_user_id,
      160
    );

  const filters = [];

  if (isUuid(agentUserId)) {
    filters.push(
      `agent_user_id.eq.${encodeURIComponent(agentUserId)}`
    );
  }

  if (skId) {
    filters.push(
      `sk_id.eq.${encodeURIComponent(skId)}`
    );
  }

  if (email) {
    filters.push(
      `email.eq.${encodeURIComponent(email)}`
    );
  }

  if (!filters.length) {
    return null;
  }

  const rows =
    await supabaseRequest(
      "uniform_wallets?" +
      "select=*&" +
      `or=(${filters.join(",")})&` +
      "limit=1"
    );

  return rows?.[0] || null;
}

async function getAgentByIdentity(
  input = {}
) {
  const skId = cleanUpper(
    input.skId ||
    input.skID ||
    input.sk_id,
    80
  );

  const email =
    cleanText(input.email, 240);

  const filters = [];

  if (skId) {
    filters.push(
      `sk_id.eq.${encodeURIComponent(skId)}`
    );
  }

  if (email) {
    filters.push(
      `email.eq.${encodeURIComponent(email)}`
    );

    filters.push(
      `corporate_email_address.eq.${encodeURIComponent(email)}`
    );
  }

  if (!filters.length) {
    return null;
  }

  const rows =
    await supabaseRequest(
      "agent_users?" +
      "select=*&" +
      `or=(${filters.join(",")})&` +
      "limit=1"
    ).catch(() => []);

  return rows?.[0] || null;
}

async function patchWallet(
  wallet,
  deltas = {},
  meta = {},
  actor = {}
) {
  const available =
    intValue(wallet.available_points) +
    intValue(deltas.available);

  const held =
    intValue(wallet.held_points) +
    intValue(deltas.held);

  const spent =
    intValue(wallet.spent_points) +
    intValue(deltas.spent);

  if (
    available < 0 ||
    held < 0 ||
    spent < 0
  ) {
    throw new Error(
      "Uniform wallet balance cannot go below zero."
    );
  }

  const updatedRows =
    await supabaseRequest(
      `uniform_wallets?id=eq.${encodeURIComponent(wallet.id)}`,
      {
        method: "PATCH",
        body: {
          available_points: available,
          held_points: held,
          spent_points: spent
        },
        prefer: "return=representation"
      }
    );

  const updated =
    updatedRows?.[0] ||
    wallet;

  await supabaseRequest(
    "uniform_wallet_ledger",
    {
      method: "POST",
      body: {
        wallet_id: wallet.id,
        agent_user_id:
          wallet.agent_user_id ||
          null,
        sk_id: wallet.sk_id || "",
        email: wallet.email || "",
        event_type:
          cleanText(
            meta.eventType ||
            "ADJUSTMENT",
            120
          ),
        points_delta:
          intValue(
            meta.pointsDelta ??
            deltas.available ??
            0
          ),
        available_after:
          available,
        held_after: held,
        spent_after: spent,
        order_id:
          isUuid(meta.orderId)
            ? meta.orderId
            : null,
        order_number:
          cleanText(
            meta.orderNumber,
            80
          ),
        reason:
          cleanText(
            meta.reason || "",
            1000
          ),
        payload:
          meta.payload || {},
        created_by_agent_user_id:
          actor?.id || null,
        created_by_name:
          displayName(actor)
      },
      prefer: "return=minimal"
    }
  ).catch(() => null);

  return updated;
}

function orderNumber() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const rand = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `UNI-${stamp}-${rand}`;
}

async function getCatalogItemByIdOrCode(
  value
) {
  const idOrCode =
    cleanText(value, 160);

  if (!idOrCode) {
    return null;
  }

  const query = isUuid(idOrCode)
    ? (
        "uniform_catalog_items?" +
        "select=*&" +
        `id=eq.${encodeURIComponent(idOrCode)}&` +
        "active=eq.true&limit=1"
      )
    : (
        "uniform_catalog_items?" +
        "select=*&" +
        `item_code=eq.${encodeURIComponent(idOrCode)}&` +
        "active=eq.true&limit=1"
      );

  const rows =
    await supabaseRequest(query);

  return rows?.[0] || null;
}

function normalizeOrderStatus(
  action
) {
  const value =
    cleanUpper(action, 60);

  const allowed = new Set([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "FULFILLMENT_READY",
    "COMPLETED",
    "CANCELLED",
    "RETURNED"
  ]);

  return allowed.has(value)
    ? value
    : "";
}

function itemSavePayload(
  item = {},
  agent = {}
) {
  const itemCode =
    cleanUpper(
      item.itemCode ||
      item.item_code,
      80
    );

  const categoryRaw =
    item.category ||
    item.categoryTitle ||
    item.category_key ||
    item.categoryKey ||
    "";

  const categoryKey =
    cleanKey(
      item.categoryKey ||
      item.category_key ||
      categoryRaw,
      100
    );

  return {
    ...(isUuid(
      item.itemId ||
      item.id ||
      item._id
    )
      ? {
          id:
            item.itemId ||
            item.id ||
            item._id
        }
      : {}),
    item_code:
      itemCode || null,
    title:
      cleanText(
        item.title,
        240
      ),
    category_key:
      categoryKey || null,
    category_title:
      cleanText(
        categoryRaw,
        180
      ),
    sub_category:
      cleanText(
        item.subCategory ||
        item.sub_category,
        180
      ),
    available_roles:
      eligibilityArray(
        item.availableRoles ||
        item.available_roles ||
        []
      ),
    available_departments:
      eligibilityArray(
        item.availableDepartments ||
        item.available_departments ||
        []
      ),
    available_bases:
      eligibilityArray(
        item.availableBases ||
        item.available_bases ||
        []
      ),
    item_regulations:
      cleanText(
        item.itemRegulations ||
        item.item_regulations,
        12000
      ),
    points_cost:
      Math.max(
        0,
        intValue(
          item.pointsCost ??
          item.points_cost,
          0
        )
      ),
    stock_status:
      cleanUpper(
        item.stockStatus ||
        item.stock_status ||
        "IN_STOCK",
        80
      ),
    active:
      boolValue(
        item.active,
        true
      ),
    sizes:
      arr(item.sizes),
    description:
      cleanText(
        item.description,
        8000
      ),
    details:
      cleanText(
        item.details,
        8000
      ),
    care_instructions:
      cleanText(
        item.careInstructions ||
        item.care_instructions,
        8000
      ),
    payload:
      item,
    created_by_agent_user_id:
      agent?.id || null
  };
}

async function uniformEligibilityOptions() {
  const rows = await supabaseRequest(
    "agent_users?" +
    "select=job_title,department,base,station&" +
    "limit=5000"
  ).catch(() => []);

  const fixedRoles = [
    "ALL",
    "GUIDE",
    "FIELD_STAFF",
    "DCS_AGENT",
    "SALES_AGENT",
    "DISPATCHER",
    "DESTINATION_CONTROLLER",
    "OCC_CONTROLLER",
    "UNIFORM_ADMIN",
    "UNIFORM_MANAGER",
    "HR_ADMIN",
    "HR_MANAGER",
    "MANAGER"
  ];

  const roles = new Set(fixedRoles);
  const departments = new Set(["ALL"]);
  const bases = new Set(["ALL"]);

  for (const row of rows || []) {
    if (row.job_title) {
      roles.add(normalizeEligibilityToken(row.job_title));
    }
    if (row.department) {
      departments.add(normalizeEligibilityToken(row.department));
    }
    if (row.base) {
      bases.add(normalizeEligibilityToken(row.base));
    }
    if (row.station) {
      bases.add(normalizeEligibilityToken(row.station));
    }
  }

  return {
    roles: [...roles].sort(),
    departments: [...departments].sort(),
    bases: [...bases].sort()
  };
}

/* =========================================================
   ADMIN EXPORTS
   ========================================================= */

export const getUniformAdminBootstrap =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const query =
          cleanText(
            input.query,
            120
          );

        const catalogParams = [
          "select=*",
          "stock_status=neq.DELETED",
          "order=title.asc",
          "limit=1000"
        ];

        if (query) {
          const q =
            encodeURIComponent(query);

          catalogParams.push(
            `or=(title.ilike.*${q}*,` +
            `item_code.ilike.*${q}*,` +
            `category_title.ilike.*${q}*,` +
            `sub_category.ilike.*${q}*)`
          );
        }

        const [
          catalogRows,
          categoryRows,
          ruleRows,
          walletRows,
          orders,
          auditRows,
          storageRows,
          policy,
          eligibilityOptions
        ] = await Promise.all([
          supabaseRequest(
            `uniform_catalog_items?${catalogParams.join("&")}`
          ),
          supabaseRequest(
            "uniform_categories?" +
            "select=*&" +
            "order=sort_order.asc,title.asc&" +
            "limit=1000"
          ),
          supabaseRequest(
            "uniform_allowance_rules?" +
            "select=*&" +
            "order=sort_order.asc,title.asc&" +
            "limit=1000"
          ),
          supabaseRequest(
            "uniform_wallets?" +
            "select=*&" +
            "order=updated_at.desc&" +
            "limit=1000"
          ),
          listOrders(),
          supabaseRequest(
            "uniform_audit?" +
            "select=*&" +
            "order=created_at.desc&" +
            "limit=300"
          ),
          listUniformStorageAssets(),
          latestPolicy(),
          uniformEligibilityOptions()
        ]);

        const categories =
          (categoryRows || [])
            .map(mapCategory);

        const catalog =
          (catalogRows || [])
            .map(row =>
              mapCatalogItem(
                row,
                storageRows
              )
            );

        const wallets =
          (walletRows || [])
            .map(mapWallet);

        const allowanceRules =
          (ruleRows || [])
            .map(mapRule);

        return {
          ok: true,
          session: {
            id: agent.id || "",
            skId: agentSkId(agent),
            displayName:
              displayName(agent),
            email:
              agentEmail(agent),
            role: agent.role || "",
            canManageUniforms: true
          },
          profile: {
            id: agent.id || "",
            skId: agentSkId(agent),
            displayName:
              displayName(agent),
            email:
              agentEmail(agent),
            role: agent.role || ""
          },
          apps: [],
          stats: {
            catalog: catalog.length,
            openOrders:
              orders.filter(
                o =>
                  ![
                    "COMPLETED",
                    "REJECTED",
                    "CANCELLED",
                    "RETURNED"
                  ].includes(o.status)
              ).length,
            wallets:
              wallets.length,
            categories:
              categories.length
          },
          orders,
          catalog,
          categories,
          allowanceRules,
          wallets,
          audit:
            (auditRows || [])
              .map(mapAudit),
          policy,
          eligibilityOptions,
          lastSync:
            new Date().toISOString()
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const adminSaveUniformPolicy =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const policy =
          input.policy ||
          input;

        const policyKey =
          cleanUpper(
            policy.policyKey ||
            policy.policy_key ||
            "SKANDI_UNIFORM_REGULATIONS",
            120
          ) || "SKANDI_UNIFORM_REGULATIONS";

        const title =
          cleanText(
            policy.title ||
            "SKANDI Uniform Regulations",
            240
          );

        const policyVersion =
          cleanText(
            policy.policyVersion ||
            policy.policy_version ||
            "CURRENT",
            80
          );

        const body =
          cleanText(
            policy.body,
            50000
          );

        if (!body) {
          throw new Error(
            "Uniform Regulations body is required."
          );
        }

        const existing =
          await supabaseRequest(
            "uniform_policies?" +
            "select=id&" +
            `policy_key=eq.${encodeURIComponent(policyKey)}&` +
            "limit=1"
          );

        const row = {
          policy_key: policyKey,
          title,
          policy_version:
            policyVersion,
          body,
          active:
            boolValue(
              policy.active,
              true
            ),
          effective_date:
            cleanText(
              policy.effectiveDate ||
              policy.effective_date,
              20
            ) || null,
          document_id:
            cleanText(
              policy.documentId ||
              policy.document_id,
              120
            ),
          pdf_url:
            cleanText(
              policy.pdfUrl ||
              policy.pdf_url,
              1000
            ),
          payload:
            policy.payload ||
            {},
          created_by_agent_user_id:
            agent.id
        };

        const result =
          await supabaseRequest(
            existing?.[0]?.id
              ? (
                  "uniform_policies?" +
                  `id=eq.${encodeURIComponent(existing[0].id)}`
                )
              : "uniform_policies",
            {
              method:
                existing?.[0]?.id
                  ? "PATCH"
                  : "POST",
              body: row,
              prefer:
                "return=representation"
            }
          );

        const saved =
          result?.[0] ||
          null;

        await logAudit(
          "uniform_policy_saved",
          {
            entityTable:
              "uniform_policies",
            entityId:
              saved?.id || "",
            message:
              "Uniform Regulations saved.",
            payload:
              saved
          },
          agent
        );

        return {
          ok: true,
          policy:
            mapPolicy(saved)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const adminUploadUniformImage =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const mode =
          cleanUpper(
            input.mode || "",
            40
          );

        if (
          mode ===
          "CREATE_SIGNED_UPLOAD"
        ) {
          return await createUniformSignedUpload(
            input
          );
        }

        if (
          mode ===
          "COMPLETE_SIGNED_UPLOAD"
        ) {
          return await completeUniformSignedUpload(
            input
          );
        }

        // Legacy Base64 fallback.
        const { agent } =
          await requireUniformAdmin();

        const uploaded =
          await uploadUniformImageToStorage(
            input
          );

        await logAudit(
          "uniform_image_uploaded",
          {
            entityTable:
              "uniform_catalog_items",
            entityId:
              cleanText(
                input.itemId ||
                input.item_id ||
                "",
                160
              ),
            message:
              "Uniform catalog image uploaded.",
            payload: {
              objectPath:
                uploaded.objectPath,
              imageUrl:
                uploaded.url,
              mimeType:
                uploaded.mimeType,
              size:
                uploaded.size
            }
          },
          agent
        );

        return {
          ok: true,
          imageUrl:
            uploaded.url,
          url:
            uploaded.url,
          storagePath:
            uploaded.objectPath,
          objectPath:
            uploaded.objectPath,
          mimeType:
            uploaded.mimeType,
          size:
            uploaded.size,
          fileName:
            cleanText(
              input.fileName ||
              input.file_name ||
              "",
              240
            ),
          image: {
            url:
              uploaded.url,
            imageUrl:
              uploaded.url,
            storagePath:
              uploaded.objectPath,
            mimeType:
              uploaded.mimeType,
            fileName:
              cleanText(
                input.fileName ||
                input.file_name ||
                "",
                240
              ),
            uploadedAt:
              new Date().toISOString()
          }
        };
      } catch (error) {
        // Self-contained error reporting so upload errors are not masked.
        const message = String(
          error?.message ||
          error?.details ||
          error?.error ||
          error ||
          ""
        ).trim();

        throw new Error(
          message ||
          "Uniform image request failed."
        );
      }
    }
  );

export const adminSaveUniformCatalogItem =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const row =
          itemSavePayload(
            input.item ||
            input,
            agent
          );

        if (!row.title) {
          throw new Error(
            "Uniform item title is required."
          );
        }

        if (
          row.category_key &&
          row.category_title
        ) {
          await supabaseRequest(
            "uniform_categories?" +
            "on_conflict=category_key",
            {
              method: "POST",
              body: {
                category_key:
                  row.category_key,
                title:
                  row.category_title,
                active: true,
                created_by_agent_user_id:
                  agent.id
              },
              prefer:
                "resolution=merge-duplicates,return=minimal"
            }
          ).catch(() => null);
        }

        const path = row.id
          ? (
              "uniform_catalog_items?" +
              `id=eq.${encodeURIComponent(row.id)}`
            )
          : "uniform_catalog_items";

        const result =
          await supabaseRequest(
            path,
            {
              method:
                row.id
                  ? "PATCH"
                  : "POST",
              body: row,
              prefer:
                "return=representation"
            }
          );

        const saved =
          result?.[0] || null;

        await logAudit(
          "uniform_item_saved",
          {
            entityTable:
              "uniform_catalog_items",
            entityId:
              saved?.id || "",
            message:
              "Uniform catalog item saved.",
            payload: saved
          },
          agent
        );

        const storageRows =
          await listUniformStorageAssets()
            .catch(() => []);

        return {
          ok: true,
          item:
            mapCatalogItem(
              saved,
              storageRows
            )
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const adminSaveUniformCategory =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const category =
          input.category ||
          input;

        const categoryKey =
          cleanKey(
            category.categoryKey ||
            category.category_key ||
            category.title,
            100
          );

        if (!categoryKey) {
          throw new Error(
            "Category key is required."
          );
        }

        const result =
          await supabaseRequest(
            "uniform_categories?" +
            "on_conflict=category_key",
            {
              method: "POST",
              body: {
                category_key:
                  categoryKey,
                title:
                  cleanText(
                    category.title ||
                    categoryKey,
                    180
                  ),
                description:
                  cleanText(
                    category.description,
                    1000
                  ),
                sort_order:
                  intValue(
                    category.sortOrder ??
                    category.sort_order,
                    100
                  ),
                active:
                  boolValue(
                    category.active,
                    true
                  ),
                payload:
                  category,
                created_by_agent_user_id:
                  agent.id
              },
              prefer:
                "resolution=merge-duplicates,return=representation"
            }
          );

        const saved =
          result?.[0] || null;

        await logAudit(
          "uniform_category_saved",
          {
            entityTable:
              "uniform_categories",
            entityId:
              saved?.id || "",
            message:
              "Uniform category saved.",
            payload:
              saved
          },
          agent
        );

        return {
          ok: true,
          category:
            mapCategory(saved)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const adminSaveUniformAllowanceRule =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const rule =
          input.rule ||
          input;

        const roleKey =
          cleanUpper(
            rule.roleKey ||
            rule.role_key ||
            "ALL",
            80
          );

        const ruleKey =
          cleanKey(
            rule.ruleKey ||
            rule.rule_key ||
            roleKey ||
            rule.title,
            100
          );

        if (!ruleKey) {
          throw new Error(
            "Allowance rule key is required."
          );
        }

        const result =
          await supabaseRequest(
            "uniform_allowance_rules?" +
            "on_conflict=rule_key",
            {
              method: "POST",
              body: {
                rule_key:
                  ruleKey,
                title:
                  cleanText(
                    rule.title ||
                    ruleKey,
                    180
                  ),
                role_key:
                  roleKey ||
                  "ALL",
                monthly_points:
                  Math.max(
                    0,
                    intValue(
                      rule.monthlyPoints ??
                      rule.monthly_points,
                      0
                    )
                  ),
                summary:
                  cleanText(
                    rule.summary,
                    1000
                  ),
                active:
                  boolValue(
                    rule.active,
                    true
                  ),
                sort_order:
                  intValue(
                    rule.sortOrder ??
                    rule.sort_order,
                    100
                  ),
                payload:
                  rule,
                created_by_agent_user_id:
                  agent.id
              },
              prefer:
                "resolution=merge-duplicates,return=representation"
            }
          );

        const saved =
          result?.[0] || null;

        await logAudit(
          "uniform_allowance_rule_saved",
          {
            entityTable:
              "uniform_allowance_rules",
            entityId:
              saved?.id || "",
            message:
              "Uniform allowance rule saved.",
            payload:
              saved
          },
          agent
        );

        return {
          ok: true,
          rule:
            mapRule(saved)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const adminUniformOrderAction =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const orderId =
          cleanText(
            input.orderId ||
            input.id,
            160
          );

        const action =
          normalizeOrderStatus(
            input.action
          );

        if (!isUuid(orderId)) {
          throw new Error(
            "Valid order ID is required."
          );
        }

        if (!action) {
          throw new Error(
            "Valid uniform order action is required."
          );
        }

        const orderRows =
          await supabaseRequest(
            "uniform_orders?" +
            "select=*&" +
            `id=eq.${encodeURIComponent(orderId)}&` +
            "limit=1"
          );

        const order =
          orderRows?.[0];

        if (!order) {
          throw new Error(
            "Uniform order was not found."
          );
        }

        const walletRows =
          order.wallet_id
            ? await supabaseRequest(
                "uniform_wallets?" +
                "select=*&" +
                `id=eq.${encodeURIComponent(order.wallet_id)}&` +
                "limit=1"
              )
            : [];

        const wallet =
          walletRows?.[0] || null;

        let walletEffectStatus =
          order.wallet_effect_status ||
          "NONE";

        const totalPoints =
          intValue(
            order.total_points,
            0
          );

        const patch = {
          status: action,
          action_note:
            cleanText(
              input.note,
              1000
            )
        };

        if (
          action === "APPROVED"
        ) {
          patch.approved_at =
            new Date().toISOString();

          if (
            wallet &&
            [
              "NONE",
              "RELEASED"
            ].includes(
              walletEffectStatus
            )
          ) {
            await patchWallet(
              wallet,
              {
                available:
                  -totalPoints,
                held:
                  totalPoints,
                spent: 0
              },
              {
                eventType:
                  "ORDER_HELD",
                pointsDelta:
                  -totalPoints,
                orderId:
                  order.id,
                orderNumber:
                  order.order_number,
                reason:
                  "Uniform order approved and points held."
              },
              agent
            );

            walletEffectStatus =
              "HELD";
          }
        }

        if (
          [
            "REJECTED",
            "CANCELLED",
            "RETURNED"
          ].includes(action)
        ) {
          patch.rejected_at =
            new Date().toISOString();

          if (
            wallet &&
            walletEffectStatus ===
              "HELD"
          ) {
            await patchWallet(
              wallet,
              {
                available:
                  totalPoints,
                held:
                  -totalPoints,
                spent: 0
              },
              {
                eventType:
                  "ORDER_RELEASED",
                pointsDelta:
                  totalPoints,
                orderId:
                  order.id,
                orderNumber:
                  order.order_number,
                reason:
                  `Uniform order ${action.toLowerCase()} and held points released.`
              },
              agent
            );

            walletEffectStatus =
              "RELEASED";
          }
        }

        if (
          action ===
          "FULFILLMENT_READY"
        ) {
          patch.fulfillment_ready_at =
            new Date().toISOString();
        }

        if (
          action === "COMPLETED"
        ) {
          if (
            !wallet ||
            walletEffectStatus !==
              "HELD"
          ) {
            throw new Error(
              "Uniform order must be approved with held points before completion."
            );
          }

          await patchWallet(
            wallet,
            {
              available: 0,
              held:
                -totalPoints,
              spent:
                totalPoints
            },
            {
              eventType:
                "ORDER_SPENT",
              pointsDelta:
                -totalPoints,
              orderId:
                order.id,
              orderNumber:
                order.order_number,
              reason:
                "Uniform order completed and held points spent."
            },
            agent
          );

          walletEffectStatus =
            "SPENT";

          patch.completed_at =
            new Date().toISOString();
        }

        patch.wallet_effect_status =
          walletEffectStatus;

        const updatedRows =
          await supabaseRequest(
            "uniform_orders?" +
            `id=eq.${encodeURIComponent(order.id)}`,
            {
              method: "PATCH",
              body: patch,
              prefer:
                "return=representation"
            }
          );

        const updated =
          updatedRows?.[0] ||
          order;

        await logAudit(
          "uniform_order_action",
          {
            entityTable:
              "uniform_orders",
            entityId:
              updated.id,
            orderNumber:
              updated.order_number,
            message:
              `Uniform order action: ${action}`,
            payload: {
              action,
              before: order,
              after: updated
            }
          },
          agent
        );

        return {
          ok: true,
          order:
            mapOrder(updated)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const adminAdjustUniformWallet =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const points =
          intValue(
            input.points,
            0
          );

        if (!points) {
          throw new Error(
            "Wallet point adjustment cannot be zero."
          );
        }

        let wallet =
          await getWalletByIdentity(
            input
          );

        if (!wallet) {
          const target =
            await getAgentByIdentity(
              input
            );

          if (!target?.id) {
            throw new Error(
              "Wallet or staff member was not found."
            );
          }

          wallet =
            await ensureWallet(
              target
            );
        }

        const updated =
          await patchWallet(
            wallet,
            {
              available: points,
              held: 0,
              spent: 0
            },
            {
              eventType:
                "ADMIN_ADJUSTMENT",
              pointsDelta:
                points,
              reason:
                cleanText(
                  input.reason ||
                  "Uniform Control wallet adjustment.",
                  1000
                ),
              payload:
                input
            },
            agent
          );

        await logAudit(
          "uniform_wallet_adjusted",
          {
            entityTable:
              "uniform_wallets",
            entityId:
              updated.id,
            message:
              "Uniform wallet adjusted.",
            payload: {
              points,
              reason:
                input.reason || "",
              wallet:
                updated
            }
          },
          agent
        );

        return {
          ok: true,
          wallet:
            mapWallet(updated)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const adminDeleteUniformItem =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireUniformAdmin();

        const itemId =
          cleanText(
            input.itemId ||
            input.id,
            160
          );

        if (!isUuid(itemId)) {
          throw new Error(
            "Valid uniform item ID is required."
          );
        }

        const updated =
          await supabaseRequest(
            "uniform_catalog_items?" +
            `id=eq.${encodeURIComponent(itemId)}`,
            {
              method: "PATCH",
              body: {
                active: false,
                stock_status:
                  "DELETED"
              },
              prefer:
                "return=representation"
            }
          );

        const saved =
          updated?.[0] ||
          null;

        await logAudit(
          "uniform_item_deleted",
          {
            entityTable:
              "uniform_catalog_items",
            entityId:
              itemId,
            message:
              "Uniform item deleted from active catalog.",
            payload:
              saved
          },
          agent
        );

        return {
          ok: true,
          deleted: true,
          itemId,
          item:
            mapCatalogItem(saved)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

/* =========================================================
   EMPLOYEE EXPORTS
   ========================================================= */

export const getUniformEmployeeBootstrap =
  webMethod(
    Permissions.Anyone,
    async () => {
      try {
        const { agent } =
          await requireAgent();

        const wallet =
          await ensureWallet(agent);

        const [
          catalogRows,
          categoryRows,
          orders,
          policy,
          storageRows
        ] = await Promise.all([
          supabaseRequest(
            "uniform_catalog_items?" +
            "select=*&" +
            "active=eq.true&" +
            "stock_status=neq.DELETED&" +
            "order=title.asc&" +
            "limit=1000"
          ),
          supabaseRequest(
            "uniform_categories?" +
            "select=*&" +
            "active=eq.true&" +
            "order=sort_order.asc,title.asc&" +
            "limit=1000"
          ),
          listOrders(
            "uniform_orders?" +
            "select=*&" +
            `agent_user_id=eq.${encodeURIComponent(agent.id)}&` +
            "order=created_at.desc&" +
            "limit=200"
          ),
          latestPolicy(),
          listUniformStorageAssets()
        ]);

        return {
          ok: true,
          profile: {
            id: agent.id || "",
            skId:
              agentSkId(agent),
            displayName:
              displayName(agent),
            email:
              agentEmail(agent),
            role:
              agent.role ||
              agent.position ||
              agent.job_title ||
              "",
            position:
              agent.position ||
              agent.job_title ||
              "",
            department:
              agentDepartment(agent),
            base:
              agentBase(agent)
          },
          wallet:
            mapWallet(wallet),
          catalog:
            (catalogRows || [])
              .filter(row =>
                itemEligibleForAgent(
                  row,
                  agent
                )
              )
              .map(row =>
                mapCatalogItem(
                  row,
                  storageRows
                )
              ),
          categories:
            (categoryRows || [])
              .map(mapCategory),
          orders,
          policy,
          lastSync:
            new Date().toISOString()
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const submitUniformEmployeeOrder =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireAgent();

        const cart =
          Array.isArray(input.items)
            ? input.items
            : [];

        if (!cart.length) {
          throw new Error(
            "Uniform order requires at least one item."
          );
        }

        const wallet =
          await ensureWallet(agent);

        const orderItems = [];
        let totalPoints = 0;

        for (const cartItem of cart) {
          const rawItemId =
            cartItem.itemId ||
            cartItem._id ||
            cartItem.id ||
            cartItem.itemCode;

          const catalogItem =
            await getCatalogItemByIdOrCode(
              rawItemId
            );

          if (!catalogItem) {
            throw new Error(
              "One or more uniform items are no longer available."
            );
          }

          if (
            !itemEligibleForAgent(
              catalogItem,
              agent
            )
          ) {
            throw new Error(
              `Uniform item ${catalogItem.item_code || catalogItem.title || ""} is not available for your role, department or base.`
            );
          }

          const quantity =
            Math.max(
              1,
              Math.min(
                20,
                intValue(
                  cartItem.quantity,
                  1
                )
              )
            );

          const size =
            cleanText(
              cartItem.size ||
              cartItem.selectedSize ||
              cartItem.activeSize,
              80
            );

          const pointsCost =
            Math.max(
              0,
              intValue(
                catalogItem.points_cost,
                0
              )
            );

          const linePoints =
            pointsCost *
            quantity;

          totalPoints +=
            linePoints;

          orderItems.push({
            item_id:
              catalogItem.id,
            item_code:
              catalogItem.item_code ||
              "",
            title:
              catalogItem.title ||
              "",
            category:
              catalogItem.category_title ||
              catalogItem.category_key ||
              "",
            size,
            quantity,
            points_cost:
              pointsCost,
            line_points:
              linePoints,
            payload: {
              requested:
                cartItem,
              catalogSnapshot:
                catalogItem
            }
          });
        }

        if (
          intValue(
            wallet.available_points
          ) < totalPoints
        ) {
          throw new Error(
            "Not enough uniform wallet points for this request."
          );
        }

        const number =
          orderNumber();

        const heldWallet =
          await patchWallet(
            wallet,
            {
              available:
                -totalPoints,
              held:
                totalPoints,
              spent: 0
            },
            {
              eventType:
                "ORDER_HELD",
              pointsDelta:
                -totalPoints,
              orderNumber:
                number,
              reason:
                "Uniform request submitted and points held.",
              payload: {
                cart
              }
            },
            agent
          );

        let order = null;
        let savedLines = [];

        try {
          const orderRows =
            await supabaseRequest(
              "uniform_orders",
              {
                method: "POST",
                body: {
                  order_number:
                    number,
                  agent_user_id:
                    agent.id,
                  sk_id:
                    agentSkId(agent),
                  staff_name:
                    displayName(agent),
                  email:
                    agentEmail(agent),
                  status:
                    "PENDING",
                  total_points:
                    totalPoints,
                  note:
                    cleanText(
                      input.note,
                      2000
                    ),
                  wallet_id:
                    heldWallet.id,
                  wallet_effect_status:
                    "HELD",
                  payload:
                    input,
                  created_by_agent_user_id:
                    agent.id
                },
                prefer:
                  "return=representation"
              }
            );

          order =
            orderRows?.[0] ||
            null;

          if (!order?.id) {
            throw new Error(
              "Uniform order was not created."
            );
          }

          const lines =
            orderItems.map(
              item => ({
                ...item,
                order_id:
                  order.id
              })
            );

          savedLines =
            await supabaseRequest(
              "uniform_order_items",
              {
                method: "POST",
                body: lines,
                prefer:
                  "return=representation"
              }
            );
        } catch (orderError) {
          // Release the hold if order creation fails.
          await patchWallet(
            heldWallet,
            {
              available:
                totalPoints,
              held:
                -totalPoints,
              spent: 0
            },
            {
              eventType:
                "ORDER_HOLD_ROLLBACK",
              pointsDelta:
                totalPoints,
              orderNumber:
                number,
              reason:
                "Uniform order creation failed; held points released.",
              payload: {
                originalError:
                  cleanError(orderError)
              }
            },
            agent
          ).catch(() => null);

          throw orderError;
        }

        await logAudit(
          "uniform_order_submitted",
          {
            entityTable:
              "uniform_orders",
            entityId:
              order.id,
            orderNumber:
              order.order_number,
            message:
              "Uniform order submitted.",
            payload: {
              order,
              items:
                savedLines
            }
          },
          agent
        );

        return {
          ok: true,
          order:
            mapOrder(
              order,
              (savedLines || [])
                .map(mapOrderItem)
            ),
          wallet:
            mapWallet(heldWallet)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const getUniformRegulationsBootstrap =
  webMethod(
    Permissions.Anyone,
    async () => {
      try {
        const { agent } =
          await requireAgent();

        const policy =
          await latestPolicy();

        return {
          ok: true,
          profile: {
            id: agent.id || "",
            skId:
              agentSkId(agent),
            displayName:
              displayName(agent),
            email:
              agentEmail(agent),
            role:
              agent.role ||
              agent.position ||
              agent.job_title ||
              "",
            department:
              agentDepartment(agent),
            base:
              agentBase(agent)
          },
          policy,
          lastSync:
            new Date().toISOString()
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

export const acknowledgeUniformPolicy =
  webMethod(
    Permissions.Anyone,
    async (input = {}) => {
      try {
        const { agent } =
          await requireAgent();

        const policyId =
          cleanText(
            input.policyId ||
            input.id,
            160
          );

        let policy = null;

        if (isUuid(policyId)) {
          const rows =
            await supabaseRequest(
              "uniform_policies?" +
              "select=*&" +
              `id=eq.${encodeURIComponent(policyId)}&` +
              "limit=1"
            );

          policy =
            rows?.[0] ||
            null;
        }

        if (!policy) {
          policy =
            await latestPolicy();
        }

        if (!policy?.id) {
          return {
            ok: true,
            acknowledged: false,
            message:
              "No active uniform policy exists."
          };
        }

        const result =
          await supabaseRequest(
            "uniform_policy_acknowledgements?" +
            "on_conflict=policy_key,policy_version,agent_user_id",
            {
              method: "POST",
              body: {
                policy_id:
                  policy.id,
                policy_key:
                  policy.policy_key ||
                  "",
                policy_version:
                  cleanText(
                    input.policyVersion ||
                    input.policy_version ||
                    policy.policy_version,
                    80
                  ),
                agent_user_id:
                  agent.id,
                sk_id:
                  agentSkId(agent),
                email:
                  agentEmail(agent),
                acknowledged_at:
                  new Date().toISOString(),
                payload:
                  input
              },
              prefer:
                "resolution=merge-duplicates,return=representation"
            }
          );

        await logAudit(
          "uniform_policy_acknowledged",
          {
            entityTable:
              "uniform_policy_acknowledgements",
            entityId:
              result?.[0]?.id ||
              "",
            message:
              "Uniform policy acknowledged.",
            payload:
              result?.[0] ||
              {}
          },
          agent
        );

        return {
          ok: true,
          acknowledged: true,
          policy:
            mapPolicy(policy)
        };
      } catch (error) {
        throw new Error(
          cleanError(error)
        );
      }
    }
  );

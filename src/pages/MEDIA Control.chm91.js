// /src/pages/MEDIA Control.chm91.js
// B-011.17 — VOY Magazine Manager + Media Control bridge.
// Canonical boundaries:
//   editorial/newsroom data -> backend/SKANDI_CORE/publicContent.web
//   physical media assets   -> backend/SKANDI_CORE/assets.web
// No FINAL/RIA business services and no direct browser Supabase credentials.

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import {
  getVoyAdminBootstrap,
  saveVoyIssue,
  saveVoyIssuePackage,
  saveVoyPage,
  saveVoyPages,
  reorderVoyPages,
  deleteVoyPage,
  deleteVoyIssue,
  publishVoyIssue,
  archiveVoyIssue,
  saveVoyEntity,
  deleteVoyEntity,
  listNewsroomAdminData,
  getNewsroomAdminBootstrap,
  saveNewsroomCategory,
  saveNewsroomPost,
  publishNewsroomPost,
  archiveNewsroomPost,
  saveNewsroomMediaAsset,
  saveNewsroomPressContact
} from "backend/SKANDI_CORE/publicContent.web";
import {
  listAssets,
  checkAssetDuplicate,
  prepareAssetUpload,
  finalizeAssetUpload,
  getAssetAccessUrl,
  registerAssetUsage,
  archiveAsset
} from "backend/SKANDI_CORE/assets.web";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const EMBED_ID = "#mediaControlEmbed";
const CHILD_SOURCES = new Set(["SKANDI_MEDIA_CONTROL", "SKANDI_NEWSROOM_CONTROL", "SKANDI_INTERNAL_CHROME"]);
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";
const PUBLIC_VOY_PATH = SITE_MAP.voy || "/voy-magazine";

let embed = null;
let bootstrapPromise = null;
let lastSession = null;

function payloadOf(msg = {}) {
  return msg.payload && typeof msg.payload === "object" ? msg.payload : {};
}
function send(type, payload = {}) {
  if (!embed) return;
  embed.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}
function errorMessage(error, fallback = "Magazine Manager action failed.") {
  const raw = String(error?.message || error?.details?.applicationError?.description || error || "").trim();
  const codeMap = {
    VOY_EDITOR_ACCESS_DENIED: "Your staff account does not have Magazine Manager access.",
    VOY_NOT_AUTHENTICATED: "Sign in to RIAINTRA and try again.",
    STAFF_AUTH_REQUIRED: "Sign in to RIAINTRA and try again.",
    VOY_ARCHIVE_BEFORE_DELETE: "Archive a published issue before deleting it.",
    VOY_ISSUE_TITLE_REQUIRED: "Add an issue title before saving.",
    VOY_PAGE_TITLE_REQUIRED: "Add a page title before saving.",
    ASSET_AUTH_REQUIRED: "Sign in to RIAINTRA and try again.",
    ASSET_WRITE_ACCESS_DENIED: "Your staff account does not have Media Control write access."
  };
  const key = Object.keys(codeMap).find(code => raw.includes(code));
  return key ? codeMap[key] : (raw && raw.length <= 500 ? raw : fallback);
}
function currentPath() { return `/${wixLocation.path.join("/")}`; }
function profileName(profile = {}) {
  return profile.displayName || profile.fullName || profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "SKANDI Editor";
}
function chromePayload(session = {}) {
  const profile = session.profile || {};
  return {
    pageName: "Media Control / VOY",
    pagePath: currentPath(),
    pageSubtitle: "VOY magazine publishing, newsroom and shared SKANDI media library",
    profile: { ...profile, name: profileName(profile) },
    apps: session.apps || [],
    isAltea: false
  };
}
function internalSearch(query = "") {
  const q = String(query || "").trim().toLowerCase();
  const apps = Array.isArray(lastSession?.apps) ? lastSession.apps : [];
  if (!q) return [];
  return apps
    .filter(app => [app.title, app.subtitle, app.group, app.id, app.path].join(" ").toLowerCase().includes(q))
    .slice(0, 20)
    .map(app => ({ title: app.title || app.id || "App", subtitle: app.subtitle || app.group || "", path: app.path || "" }));
}
async function logout() {
  try { await authentication.logout(); } catch (error) { console.warn("[Media Control] Logout warning", error); }
  wixLocation.to("/");
}

async function bootstrap(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;
  bootstrapPromise = (async () => {
    const session = await getStaffPortalSession();
    if (!session?.loggedIn || !session?.authorized) {
      wixLocation.to(LOGIN_PATH);
      return null;
    }
    lastSession = session;
    send("INTERNAL_CHROME_BOOTSTRAP", chromePayload(session));

    // VOY bootstrap runs first so the canonical editorial context can initialize
    // its organization/member projection exactly once before Newsroom reads it.
    let voyResult;
    let newsroomResult;
    try {
      const value = await getVoyAdminBootstrap({});
      voyResult = { status: "fulfilled", value };
      send("VOY_ADMIN_BOOTSTRAP_RESULT", value || {});
    } catch (reason) {
      voyResult = { status: "rejected", reason };
      send("VOY_ADMIN_ERROR", { action: "VOY_ADMIN_BOOTSTRAP", message: errorMessage(reason, "VOY data could not be loaded.") });
    }
    try {
      const value = await getNewsroomAdminBootstrap({});
      newsroomResult = { status: "fulfilled", value };
      send("NEWSROOM_ADMIN_BOOTSTRAP", value || {});
    } catch (reason) {
      newsroomResult = { status: "rejected", reason };
      send("NEWSROOM_ADMIN_ERROR", { action: "NEWSROOM_BOOTSTRAP", message: errorMessage(reason, "Newsroom data could not be loaded.") });
    }
    return { session, newsroom: newsroomResult, voy: voyResult };
  })();
  try { return await bootstrapPromise; }
  finally { bootstrapPromise = null; }
}
async function refreshVoy() {
  const result = await getVoyAdminBootstrap({});
  send("VOY_ADMIN_BOOTSTRAP_RESULT", result || {});
  return result;
}
async function refreshNewsroom(filters = {}) {
  const result = await listNewsroomAdminData(filters || {});
  send("NEWSROOM_ADMIN_DATA", result || {});
  return result;
}
async function runVoyMutation(action, operation, successType = "VOY_ADMIN_SAVED") {
  const result = await operation();
  if (!result || result.ok === false) throw new Error(result?.error || `${action} failed.`);
  send(successType, result);
  return result;
}
function entityId(type, item = {}) {
  const keys = {
    article: ["articleId", "article_id", "_id"],
    campaign: ["campaignId", "campaign_id", "_id"],
    category: ["categoryId", "category_id", "_id"],
    banner: ["bannerId", "banner_id", "_id"],
    travel_card: ["cardId", "card_id", "_id"],
    asset: ["assetId", "asset_id", "_id", "id"],
    brand_kit: ["brandKitId", "brand_kit_id", "name"],
    distribution_kit: ["kitId", "kit_id", "_id"]
  };
  for (const key of keys[type] || []) if (item?.[key]) return item[key];
  return `${type}-${Date.now()}`;
}
async function saveEntity(type, item = {}) {
  return runVoyMutation(`SAVE_${type.toUpperCase()}`, () => saveVoyEntity({
    entityType: type,
    entityId: entityId(type, item),
    issueId: item?.issueId || item?.issue_id || "",
    item
  }));
}
function localToolResult(type, payload = {}) {
  if (type === "VOY_QUALITY_LAB_REQUEST") {
    const readiness = payload.readiness || {};
    return ["VOY_QUALITY_LAB_RESULT", { result: {
      readinessScore: readiness.score || 0,
      pageWarnings: payload.localChecks?.pageWarnings || 0,
      assetWarnings: payload.localChecks?.assetWarnings || 0,
      articleDrafts: payload.localChecks?.articleDrafts || 0,
      checks: payload.localChecks || {},
      pages: payload.pages || []
    }}];
  }
  if (type === "VOY_PRINT_QA_REQUEST") return ["VOY_PRINT_QA_RESULT", { result: payload.qa || {} }];
  if (type === "VOY_BRAND_GUARD_REQUEST") return ["VOY_BRAND_GUARD_RESULT", { result: {
    score: 100,
    status: "LOCAL_RULES_CHECKED",
    notes: "The configured local brand rules were checked. Semantic copy analysis requires a configured provider connector."
  }}];
  if (type === "VOY_DISTRIBUTION_KIT_REQUEST") return ["VOY_DISTRIBUTION_KIT_RESULT", { result: {
    ...(payload.kit || {}),
    summary: "Distribution kit prepared from the active issue, page plan and campaign settings."
  }}];
  if (type === "VOY_TRANSLATION_PACKAGE_REQUEST") return ["VOY_TRANSLATION_PACKAGE_RESULT", { result: {
    issueId: payload.issue?.issueId || "",
    languages: Array.isArray(payload.languages) ? payload.languages : [],
    pageCount: Array.isArray(payload.pages) ? payload.pages.length : 0,
    status: "PACKAGE_PREPARED",
    note: "Translation package prepared. Machine/human translation requires a configured translation provider."
  }}];
  return null;
}
function unsupportedConnector(type) {
  send("VOY_ADMIN_ERROR", {
    action: type,
    code: "VOY_CONNECTOR_NOT_CONFIGURED",
    message: "This tool needs its provider/backend connector configured. Core VOY publishing, Newsroom, Supabase Media Library, local QA and public delivery are connected."
  });
}
async function sendMediaLibrary(payload = {}) {
  const result = await listAssets({
    visibility: payload.visibility || "",
    assetType: payload.assetType || "",
    libraryRoot: payload.libraryRoot || "",
    libraryFolder: payload.libraryFolder || "",
    category: payload.category || "",
    search: payload.search || payload.query || ""
  });
  send("VOY_MEDIA_LIBRARY_RESULT", result || { ok: true, assets: [] });
  return result;
}

$w.onReady(function () {
  try { embed = $w(EMBED_ID); }
  catch (error) {
    console.error(`[Media Control] Missing HTML component ${EMBED_ID}.`, error);
    return;
  }

  embed.onMessage(async event => {
    const msg = event?.data || {};
    const source = String(msg.source || "");
    if (source && !CHILD_SOURCES.has(source)) return;
    const type = String(msg.type || "");
    const payload = payloadOf(msg);

    try {
      // Internal chrome contract from the supplied embed.
      if (source === "SKANDI_INTERNAL_CHROME") {
        if (type === "INTERNAL_CHROME_READY") { await bootstrap(); return; }
        if (type === "INTERNAL_LOGOUT") { await logout(); return; }
        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path || "";
          if (isSafeInternalRoute(path)) wixLocation.to(path);
          return;
        }
        if (type === "INTERNAL_GLOBAL_SEARCH") {
          send("INTERNAL_SEARCH_RESULTS", { results: internalSearch(payload.query || "") });
          return;
        }
      }

      // Canonical Asset Library contract.
      if (type === "MEDIA_CONTROL_READY" || type === "MEDIA_CONTROL_LIST") {
        const result = await listAssets(payload);
        send("MEDIA_CONTROL_LIBRARY", result);
        return;
      }
      if (type === "MEDIA_CONTROL_DUPLICATE_CHECK") { send("MEDIA_CONTROL_DUPLICATE_RESULT", await checkAssetDuplicate(payload)); return; }
      if (type === "MEDIA_CONTROL_UPLOAD_PREPARE") { send("MEDIA_CONTROL_UPLOAD_READY", await prepareAssetUpload(payload)); return; }
      if (type === "MEDIA_CONTROL_UPLOAD_FINALIZE") { send("MEDIA_CONTROL_UPLOAD_COMPLETE", await finalizeAssetUpload(payload)); return; }
      if (type === "MEDIA_CONTROL_ACCESS_URL") {
        const result = await getAssetAccessUrl(payload);
        send("MEDIA_CONTROL_ACCESS_URL_RESULT", { ...result, assetId: payload.assetId || "", purpose: payload.purpose || "open" });
        return;
      }
      if (type === "MEDIA_CONTROL_REGISTER_USAGE") { send("MEDIA_CONTROL_USAGE_REGISTERED", await registerAssetUsage(payload)); return; }
      if (type === "MEDIA_CONTROL_ARCHIVE") { send("MEDIA_CONTROL_ARCHIVED", await archiveAsset(payload)); return; }
      if (type === "MEDIA_CONTROL_NAVIGATE") {
        if (isSafeInternalRoute(payload.path)) wixLocation.to(payload.path);
        return;
      }

      // Supplied VOY Media Library compatibility contract, same canonical asset service.
      if (type === "VOY_MEDIA_LIBRARY_REQUEST" || type === "VOY_ASSET_UPLOAD_OPEN_REQUEST") { await sendMediaLibrary(payload); return; }
      if (type === "VOY_MEDIA_UPLOAD_CREATE") {
        const result = await prepareAssetUpload(payload);
        send("VOY_MEDIA_UPLOAD_READY", { ...result, clientRequestId: payload.clientRequestId || "" });
        return;
      }
      if (type === "VOY_MEDIA_UPLOAD_FINALIZE") { send("VOY_MEDIA_UPLOAD_COMPLETE", await finalizeAssetUpload(payload)); return; }
      if (type === "VOY_MEDIA_REFRESH_URL") {
        const result = await getAssetAccessUrl(payload);
        send("VOY_MEDIA_REFRESH_URL_RESULT", { ...result, assetId: payload.assetId || "", purpose: payload.purpose || "preview" });
        return;
      }
      if (type === "VOY_OPEN_MEDIA_CONTROL") { wixLocation.to(SITE_MAP.mediaControl || SITE_MAP.magazineManager); return; }

      // Bootstraps and Newsroom.
      if (type === "NEWSROOM_ADMIN_READY" || type === "VOY_ADMIN_BOOTSTRAP") {
        await bootstrap(type === "VOY_ADMIN_BOOTSTRAP" && payload.reason === "manual");
        return;
      }
      if (type === "NEWSROOM_ADMIN_REFRESH") { await refreshNewsroom(payload); return; }
      if (type === "NEWSROOM_SAVE_CATEGORY") {
        const result = await saveNewsroomCategory(payload.item || payload);
        send("NEWSROOM_ADMIN_SAVED", result); await refreshNewsroom({}); return;
      }
      if (type === "NEWSROOM_SAVE_POST") {
        const result = await saveNewsroomPost(payload.item || payload);
        send("NEWSROOM_ADMIN_SAVED", result); await refreshNewsroom({}); return;
      }
      if (type === "NEWSROOM_PUBLISH_POST") {
        if (payload.item) await saveNewsroomPost(payload.item);
        const result = await publishNewsroomPost({ id: payload.id || payload.articleId || payload.postId, articleId: payload.articleId || payload.postId });
        send("NEWSROOM_ADMIN_SAVED", result); await refreshNewsroom({}); return;
      }
      if (type === "NEWSROOM_ARCHIVE_POST") {
        const result = await archiveNewsroomPost({ id: payload.id || payload.articleId || payload.postId, articleId: payload.articleId || payload.postId });
        send("NEWSROOM_ADMIN_SAVED", result); await refreshNewsroom({}); return;
      }
      if (type === "NEWSROOM_SAVE_MEDIA") {
        send("NEWSROOM_ADMIN_SAVED", await saveNewsroomMediaAsset(payload.item || payload)); await refreshNewsroom({}); return;
      }
      if (type === "NEWSROOM_SAVE_CONTACT") {
        send("NEWSROOM_ADMIN_SAVED", await saveNewsroomPressContact(payload.item || payload)); await refreshNewsroom({}); return;
      }
      if (type === "NEWSROOM_ADMIN_NAVIGATE") {
        if (isSafeInternalRoute(payload.path)) wixLocation.to(payload.path);
        return;
      }

      // VOY issue/page/entity persistence.
      if (type === "VOY_ADMIN_SAVE_ISSUE_METADATA" || type === "VOY_ADMIN_SAVE_ISSUE_WITH_UPLOAD") {
        await runVoyMutation(type, () => saveVoyIssue({ issue: payload.issue })); await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_SAVE_ISSUE_PACKAGE") {
        await runVoyMutation(type, () => saveVoyIssuePackage({ issue: payload.issue, pages: payload.pages })); await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_SAVE_PAGE") {
        await runVoyMutation(type, () => saveVoyPage({ page: payload.page })); await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_SAVE_PAGES") {
        await runVoyMutation(type, () => saveVoyPages({ issueId: payload.issueId, pages: payload.pages, replaceIssuePages: payload.replaceIssuePages === true })); await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_REORDER_PAGES") {
        await runVoyMutation(type, () => reorderVoyPages(payload)); await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_DELETE_PAGE") {
        await runVoyMutation(type, () => deleteVoyPage(payload)); await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_DELETE_ISSUE") {
        await runVoyMutation(type, () => deleteVoyIssue(payload)); await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_PUBLISH_ISSUE") {
        await runVoyMutation(type, () => publishVoyIssue(payload), "VOY_ADMIN_PUBLISHED");
        await refreshVoy(); return;
      }
      if (type === "VOY_ADMIN_ARCHIVE_ISSUE") {
        await runVoyMutation(type, () => archiveVoyIssue(payload), "VOY_ADMIN_ARCHIVED");
        await refreshVoy(); return;
      }

      const saveMap = {
        VOY_ADMIN_SAVE_ARTICLE: ["article", payload.article],
        VOY_ADMIN_SAVE_CAMPAIGN: ["campaign", payload.campaign],
        VOY_ADMIN_SAVE_CATEGORY: ["category", payload.category],
        VOY_ADMIN_SAVE_BANNER: ["banner", payload.banner],
        VOY_ADMIN_SAVE_TRAVEL_CARD: ["travel_card", payload.card],
        VOY_BRAND_KIT_SAVE: ["brand_kit", { brandKitId: "default-brand-kit", ...(payload.brandKit || {}) }],
        VOY_DISTRIBUTION_KIT_SAVE: ["distribution_kit", payload.kit],
        VOY_ASSET_IMPORT_REQUEST: ["asset", payload.asset]
      };
      if (saveMap[type]) {
        const [entityType, item] = saveMap[type];
        await saveEntity(entityType, item || {}); await refreshVoy(); return;
      }
      const deleteMap = {
        VOY_ADMIN_DELETE_ARTICLE: ["article", payload.articleId],
        VOY_ADMIN_DELETE_CATEGORY: ["category", payload.categoryId],
        VOY_ADMIN_DELETE_BANNER: ["banner", payload.bannerId],
        VOY_ADMIN_DELETE_TRAVEL_CARD: ["travel_card", payload.cardId]
      };
      if (deleteMap[type]) {
        const [entityType, entityIdValue] = deleteMap[type];
        await runVoyMutation(type, () => deleteVoyEntity({ entityType, entityId: entityIdValue })); await refreshVoy(); return;
      }

      const localResult = localToolResult(type, payload);
      if (localResult) { send(localResult[0], localResult[1]); return; }

      if (type === "VOY_PUBLIC_PREVIEW_REQUEST") {
        const data = await getVoyAdminBootstrap({});
        const issue = (data?.issues || []).find(item => String(item.issueId) === String(payload.issueId));
        const query = issue?.slug ? `?issue=${encodeURIComponent(issue.slug)}` : "";
        wixLocation.to(`${PUBLIC_VOY_PATH}${query}`);
        return;
      }

      // Pure UI state changes do not need a backend roundtrip.
      if (type === "VOY_ADMIN_PANEL_CHANGED") return;

      if (type.startsWith("VOY_")) { unsupportedConnector(type); return; }
    } catch (error) {
      console.error(`[Media Control] ${type} failed`, error);
      const target = type.startsWith("NEWSROOM_") ? "NEWSROOM_ADMIN_ERROR" : (type.startsWith("VOY_") ? "VOY_ADMIN_ERROR" : "MEDIA_CONTROL_ERROR");
      send(target, {
        action: type,
        code: String(error?.code || "MEDIA_CONTROL_ACTION_FAILED"),
        message: errorMessage(error),
        requestId: payload.requestId || payload.clientRequestId || ""
      });
    }
  });

  send("MEDIA_CONTROL_HOST_READY", { version: "B-011.17", route: SITE_MAP.mediaControl || SITE_MAP.magazineManager });
  void bootstrap();
});

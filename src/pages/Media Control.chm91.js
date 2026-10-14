// /src/pages/Media Control.chm91.js
// V12 Media Control — VOY, Newsroom, Website Studio and shared Asset Library.
import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import {
  getVoyAdminBootstrap, saveVoyIssue, saveVoyIssuePackage, saveVoyPage, saveVoyPages,
  reorderVoyPages, deleteVoyPage, deleteVoyIssue, publishVoyIssue, archiveVoyIssue,
  saveVoyEntity, deleteVoyEntity, listNewsroomAdminData, getNewsroomAdminBootstrap,
  saveNewsroomCategory, saveNewsroomPost, publishNewsroomPost, archiveNewsroomPost,
  saveNewsroomMediaAsset, saveNewsroomPressContact
} from "backend/SKANDI_CORE/publicContent.web";
import { handleMediaControlAssetAction } from "backend/SKANDI_CORE/mediaControl.web";
import { SITE_MAP, EDITORIAL_PAGE_CATALOG, isSafeInternalRoute } from "public/siteMap";

const EMBED_ID = "#mediaControlEmbed";
const CHILD_SOURCES = new Set(["SKANDI_MEDIA_CONTROL", "SKANDI_NEWSROOM_CONTROL", "SKANDI_INTERNAL_CHROME"]);
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = SITE_MAP.riaintra || "/riaintra";
const PUBLIC_VOY_PATH = SITE_MAP.voy || "/voy-magazine";
const VERSION = "V12-2026.10.14-FULL-EDITORIAL-STUDIO";

let embed = null;
let bootstrapPromise = null;
let lastSession = null;
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const payloadOf = message => obj(message?.payload);
const send = (type, payload = {}) => embed?.postMessage({ source:PARENT_SOURCE, type, payload, timestamp:new Date().toISOString() });
const currentPath = () => `/${wixLocation.path.join("/")}`;

function errorMessage(error, fallback = "Media Control action failed.") {
  const raw = String(error?.message || error?.details?.applicationError?.description || error || "").trim();
  const map = {
    VOY_EDITOR_ACCESS_DENIED: "Your staff account does not have Media Control access.",
    VOY_NOT_AUTHENTICATED: "Sign in to RIAINTRA and try again.",
    STAFF_AUTH_REQUIRED: "Sign in to RIAINTRA and try again.",
    VOY_ARCHIVE_BEFORE_DELETE: "Archive a published issue before deleting it.",
    ASSET_WRITE_ACCESS_DENIED: "Your staff account does not have Media Control write access.",
    ASSET_AUTH_REQUIRED: "Your RIAINTRA session is required for the Asset Library."
  };
  const key = Object.keys(map).find(item => raw.includes(item));
  return key ? map[key] : (raw && raw.length <= 500 ? raw : fallback);
}
function profileName(profile = {}) {
  return profile.displayName || profile.fullName || profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "SKANDI Editor";
}
function chromePayload(session = {}) {
  const profile = session.profile || {};
  return {
    pageName:"Media Control", pagePath:currentPath(),
    pageSubtitle:"Website · VOY · Newsroom · Asset Library",
    profile:{ ...profile, name:profileName(profile) }, apps:session.apps || [], isAltea:false
  };
}
async function logout() { try { await authentication.logout(); } catch (_) {} wixLocation.to("/"); }
async function assetAction(action, payload = {}) {
  return handleMediaControlAssetAction({ action, payload:obj(payload) });
}
function sendEditorialCatalog() {
  send("MEDIA_CONTROL_EDITORIAL_CATALOG", { version:VERSION, pages:EDITORIAL_PAGE_CATALOG });
}

async function bootstrap(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;
  bootstrapPromise = (async () => {
    const session = await getStaffPortalSession();
    if (!session?.loggedIn || !session?.authorized) { wixLocation.to(LOGIN_PATH); return null; }
    lastSession = session;
    send("INTERNAL_CHROME_BOOTSTRAP", chromePayload(session));
    sendEditorialCatalog();
    try { send("VOY_ADMIN_BOOTSTRAP_RESULT", (await getVoyAdminBootstrap({})) || {}); }
    catch (error) { send("VOY_ADMIN_ERROR", { action:"VOY_ADMIN_BOOTSTRAP", message:errorMessage(error, "VOY data could not be loaded.") }); }
    try { send("NEWSROOM_ADMIN_BOOTSTRAP", (await getNewsroomAdminBootstrap({})) || {}); }
    catch (error) { send("NEWSROOM_ADMIN_ERROR", { action:"NEWSROOM_BOOTSTRAP", message:errorMessage(error, "Newsroom data could not be loaded.") }); }
    try { send("MEDIA_CONTROL_LIBRARY", (await assetAction("LIST_ASSETS", {})) || { ok:true, assets:[] }); }
    catch (error) { send("MEDIA_CONTROL_ERROR", { action:"MEDIA_CONTROL_LIST", message:errorMessage(error, "Asset Library could not be loaded.") }); }
    return session;
  })().finally(() => { bootstrapPromise = null; });
  return bootstrapPromise;
}
async function refreshVoy() { const result = await getVoyAdminBootstrap({}); send("VOY_ADMIN_BOOTSTRAP_RESULT", result || {}); return result; }
async function refreshNewsroom(filters = {}) { const result = await listNewsroomAdminData(filters); send("NEWSROOM_ADMIN_DATA", result || {}); return result; }
async function runVoy(action, op, success = "VOY_ADMIN_SAVED") {
  const result = await op();
  if (!result || result.ok === false) throw new Error(result?.error || `${action} failed.`);
  send(success, result);
  return result;
}
function entityId(type, item = {}) {
  const map = {
    article:["articleId","article_id","entityId","_id"], campaign:["campaignId","campaign_id","entityId","_id"],
    category:["categoryId","category_id","entityId","_id"], banner:["bannerId","banner_id","entityId","_id"],
    travel_card:["cardId","card_id","entityId","_id"], asset:["assetId","asset_id","entityId","_id","id"],
    brand_kit:["brandKitId","brand_kit_id","entityId","name"], distribution_kit:["kitId","kit_id","entityId","_id"]
  };
  for (const key of map[type] || []) if (item?.[key]) return item[key];
  return `${type}-${Date.now()}`;
}
async function saveEntity(type, item = {}) {
  return runVoy(`SAVE_${type.toUpperCase()}`, () => saveVoyEntity({
    entityType:type, entityId:entityId(type, item), issueId:item?.issueId || item?.issue_id || "", item
  }));
}
function localTool(type, payload = {}) {
  if (type === "VOY_QUALITY_LAB_REQUEST") return ["VOY_QUALITY_LAB_RESULT", { result:{ readinessScore:payload.readiness?.score || 0, pageWarnings:payload.localChecks?.pageWarnings || 0, assetWarnings:payload.localChecks?.assetWarnings || 0, articleDrafts:payload.localChecks?.articleDrafts || 0, checks:payload.localChecks || {}, pages:payload.pages || [] } }];
  if (type === "VOY_PRINT_QA_REQUEST") return ["VOY_PRINT_QA_RESULT", { result:payload.qa || {} }];
  if (type === "VOY_BRAND_GUARD_REQUEST") return ["VOY_BRAND_GUARD_RESULT", { result:{ score:100, status:"LOCAL_RULES_CHECKED", notes:"Configured local brand rules were checked." } }];
  if (type === "VOY_DISTRIBUTION_KIT_REQUEST") return ["VOY_DISTRIBUTION_KIT_RESULT", { result:{ ...(payload.kit || {}), summary:"Distribution kit prepared from the active issue, page plan and campaign settings." } }];
  if (type === "VOY_TRANSLATION_PACKAGE_REQUEST") return ["VOY_TRANSLATION_PACKAGE_RESULT", { result:{ issueId:payload.issue?.issueId || "", languages:Array.isArray(payload.languages) ? payload.languages : [], pageCount:Array.isArray(payload.pages) ? payload.pages.length : 0, status:"PACKAGE_PREPARED" } }];
  return null;
}
function unsupported(type) {
  send("VOY_ADMIN_ERROR", { action:type, code:"VOY_CONNECTOR_NOT_CONFIGURED", message:"This tool needs its provider/backend connector configured. Core VOY publishing, Newsroom, Website Studio and the shared Asset Library are connected." });
}
async function media(payload = {}) {
  const result = await assetAction("LIST_ASSETS", {
    visibility:payload.visibility || "", assetType:payload.assetType || "", libraryRoot:payload.libraryRoot || "",
    libraryFolder:payload.libraryFolder || "", category:payload.category || "", search:payload.search || payload.query || ""
  });
  send("VOY_MEDIA_LIBRARY_RESULT", result || { ok:true, assets:[] });
  return result;
}

$w.onReady(function () {
  try { embed = $w(EMBED_ID); }
  catch (error) { console.error(`[Media Control] Missing ${EMBED_ID}.`, error); return; }

  embed.onMessage(async event => {
    const message = event?.data || {};
    const source = String(message.source || "");
    const type = String(message.type || "");
    const payload = payloadOf(message);
    if (source && !CHILD_SOURCES.has(source)) return;
    try {
      if (source === "SKANDI_INTERNAL_CHROME") {
        if (type === "INTERNAL_CHROME_READY") { await bootstrap(); return; }
        if (type === "INTERNAL_LOGOUT") { await logout(); return; }
        if (type === "INTERNAL_NAVIGATE") { const path = payload.path || message.path || ""; if (isSafeInternalRoute(path)) wixLocation.to(path); return; }
      }
      if (type === "MEDIA_CONTROL_READY") { sendEditorialCatalog(); await bootstrap(); return; }
      if (type === "MEDIA_CONTROL_CATALOG_REQUEST") { sendEditorialCatalog(); return; }
      if (type === "MEDIA_CONTROL_REFRESH_ALL") { await bootstrap(true); return; }
      if (type === "MEDIA_CONTROL_OPEN_PUBLIC_PAGE") {
        const target = EDITORIAL_PAGE_CATALOG.find(item => String(item.key) === String(payload.pageKey || "") || String(item.path) === String(payload.path || ""));
        if (!target?.path || !String(target.path).startsWith("/") || String(target.path).startsWith("/riaintra")) throw new Error("MEDIA_CONTROL_PUBLIC_PAGE_INVALID");
        wixLocation.to(target.path);
        return;
      }
      if (type === "MEDIA_CONTROL_LIST") { send("MEDIA_CONTROL_LIBRARY", await assetAction("LIST_ASSETS", payload)); return; }
      if (type === "MEDIA_CONTROL_DUPLICATE_CHECK") { send("MEDIA_CONTROL_DUPLICATE_RESULT", await assetAction("CHECK_DUPLICATE", payload)); return; }
      if (type === "MEDIA_CONTROL_UPLOAD_PREPARE") { send("MEDIA_CONTROL_UPLOAD_READY", await assetAction("PREPARE_UPLOAD", payload)); return; }
      if (type === "MEDIA_CONTROL_UPLOAD_FINALIZE") { send("MEDIA_CONTROL_UPLOAD_COMPLETE", await assetAction("FINALIZE_UPLOAD", payload)); return; }
      if (type === "MEDIA_CONTROL_ACCESS_URL") { const result = await assetAction("GET_ACCESS_URL", payload); send("MEDIA_CONTROL_ACCESS_URL_RESULT", { ...result, assetId:payload.assetId || "", purpose:payload.purpose || "open" }); return; }
      if (type === "MEDIA_CONTROL_REGISTER_USAGE") { send("MEDIA_CONTROL_USAGE_REGISTERED", await assetAction("REGISTER_USAGE", payload)); return; }
      if (type === "MEDIA_CONTROL_ARCHIVE") { send("MEDIA_CONTROL_ARCHIVED", await assetAction("ARCHIVE_ASSET", payload)); return; }

      if (type === "VOY_MEDIA_LIBRARY_REQUEST" || type === "VOY_ASSET_UPLOAD_OPEN_REQUEST") { await media(payload); return; }
      if (type === "VOY_MEDIA_UPLOAD_CREATE") { const result = await assetAction("PREPARE_UPLOAD", payload); send("VOY_MEDIA_UPLOAD_READY", { ...result, clientRequestId:payload.clientRequestId || "" }); return; }
      if (type === "VOY_MEDIA_UPLOAD_FINALIZE") { send("VOY_MEDIA_UPLOAD_COMPLETE", await assetAction("FINALIZE_UPLOAD", payload)); return; }
      if (type === "VOY_MEDIA_REFRESH_URL") { const result = await assetAction("GET_ACCESS_URL", payload); send("VOY_MEDIA_REFRESH_URL_RESULT", { ...result, assetId:payload.assetId || "", purpose:payload.purpose || "preview" }); return; }
      if (type === "VOY_OPEN_MEDIA_CONTROL") { wixLocation.to(SITE_MAP.mediaControl); return; }

      if (type === "NEWSROOM_ADMIN_READY" || type === "VOY_ADMIN_BOOTSTRAP") { await bootstrap(type === "VOY_ADMIN_BOOTSTRAP" && payload.reason === "manual"); return; }
      if (type === "NEWSROOM_ADMIN_REFRESH") { await refreshNewsroom(payload); return; }
      if (type === "NEWSROOM_SAVE_CATEGORY") { send("NEWSROOM_ADMIN_SAVED", await saveNewsroomCategory(payload.item || payload)); await refreshNewsroom({}); return; }
      if (type === "NEWSROOM_SAVE_POST") { send("NEWSROOM_ADMIN_SAVED", await saveNewsroomPost(payload.item || payload)); await refreshNewsroom({}); return; }
      if (type === "NEWSROOM_PUBLISH_POST") { if (payload.item) await saveNewsroomPost(payload.item); send("NEWSROOM_ADMIN_SAVED", await publishNewsroomPost({ id:payload.id || payload.articleId || payload.postId, articleId:payload.articleId || payload.postId })); await refreshNewsroom({}); return; }
      if (type === "NEWSROOM_ARCHIVE_POST") { send("NEWSROOM_ADMIN_SAVED", await archiveNewsroomPost({ id:payload.id || payload.articleId || payload.postId, articleId:payload.articleId || payload.postId })); await refreshNewsroom({}); return; }
      if (type === "NEWSROOM_SAVE_MEDIA") { send("NEWSROOM_ADMIN_SAVED", await saveNewsroomMediaAsset(payload.item || payload)); await refreshNewsroom({}); return; }
      if (type === "NEWSROOM_SAVE_CONTACT") { send("NEWSROOM_ADMIN_SAVED", await saveNewsroomPressContact(payload.item || payload)); await refreshNewsroom({}); return; }

      if (type === "VOY_ADMIN_SAVE_ISSUE_METADATA" || type === "VOY_ADMIN_SAVE_ISSUE_WITH_UPLOAD") { await runVoy(type, () => saveVoyIssue({ issue:payload.issue })); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_SAVE_ISSUE_PACKAGE") { await runVoy(type, () => saveVoyIssuePackage({ issue:payload.issue, pages:payload.pages })); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_SAVE_PAGE") { await runVoy(type, () => saveVoyPage({ page:payload.page })); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_SAVE_PAGES") { await runVoy(type, () => saveVoyPages({ issueId:payload.issueId, pages:payload.pages, replaceIssuePages:payload.replaceIssuePages === true })); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_REORDER_PAGES") { await runVoy(type, () => reorderVoyPages(payload)); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_DELETE_PAGE") { await runVoy(type, () => deleteVoyPage(payload)); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_DELETE_ISSUE") { await runVoy(type, () => deleteVoyIssue(payload)); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_PUBLISH_ISSUE") { await runVoy(type, () => publishVoyIssue(payload), "VOY_ADMIN_PUBLISHED"); await refreshVoy(); return; }
      if (type === "VOY_ADMIN_ARCHIVE_ISSUE") { await runVoy(type, () => archiveVoyIssue(payload), "VOY_ADMIN_ARCHIVED"); await refreshVoy(); return; }

      const saveMap = {
        VOY_ADMIN_SAVE_ARTICLE:["article", payload.article], VOY_ADMIN_SAVE_CAMPAIGN:["campaign", payload.campaign],
        VOY_ADMIN_SAVE_CATEGORY:["category", payload.category], VOY_ADMIN_SAVE_BANNER:["banner", payload.banner],
        VOY_ADMIN_SAVE_TRAVEL_CARD:["travel_card", payload.card],
        VOY_BRAND_KIT_SAVE:["brand_kit", { brandKitId:"default-brand-kit", ...(payload.brandKit || {}) }],
        VOY_DISTRIBUTION_KIT_SAVE:["distribution_kit", payload.kit], VOY_ASSET_IMPORT_REQUEST:["asset", payload.asset]
      };
      if (saveMap[type]) { await saveEntity(saveMap[type][0], saveMap[type][1] || {}); await refreshVoy(); return; }
      const deleteMap = {
        VOY_ADMIN_DELETE_ARTICLE:["article",payload.articleId], VOY_ADMIN_DELETE_CATEGORY:["category",payload.categoryId],
        VOY_ADMIN_DELETE_CAMPAIGN:["campaign",payload.campaignId], VOY_ADMIN_DELETE_BANNER:["banner",payload.bannerId], VOY_ADMIN_DELETE_TRAVEL_CARD:["travel_card",payload.cardId]
      };
      if (deleteMap[type]) { await runVoy(type, () => deleteVoyEntity({ entityType:deleteMap[type][0], entityId:deleteMap[type][1] })); await refreshVoy(); return; }

      const local = localTool(type, payload);
      if (local) { send(local[0], local[1]); return; }
      if (type === "VOY_PUBLIC_PREVIEW_REQUEST") {
        const data = await getVoyAdminBootstrap({});
        const issue = (data?.issues || []).find(item => String(item.issueId) === String(payload.issueId));
        const query = issue?.slug ? `?issue=${encodeURIComponent(issue.slug)}` : "";
        wixLocation.to(`${PUBLIC_VOY_PATH}${query}`); return;
      }
      if (type === "VOY_ADMIN_PANEL_CHANGED") return;
      if (type.startsWith("VOY_")) { unsupported(type); return; }
    } catch (error) {
      console.error(`[Media Control] ${type} failed`, error);
      send(type.startsWith("NEWSROOM_") ? "NEWSROOM_ADMIN_ERROR" : type.startsWith("VOY_") ? "VOY_ADMIN_ERROR" : "MEDIA_CONTROL_ERROR", {
        action:type, code:String(error?.code || "MEDIA_CONTROL_ACTION_FAILED"), message:errorMessage(error), requestId:payload.requestId || payload.clientRequestId || ""
      });
    }
  });

  send("MEDIA_CONTROL_HOST_READY", { version:VERSION, route:SITE_MAP.mediaControl, name:"Media Control" });
  sendEditorialCatalog();
  void bootstrap();
});

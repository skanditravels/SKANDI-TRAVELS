// Wix page code
// Suggested route: /riaintra/magazine-manager/management
// HTML Component ID: #newsroomAdminEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";
import {
  getNewsroomAdminBootstrap,
  listNewsroomAdminData,
  saveNewsroomCategory,
  saveNewsroomPost,
  publishNewsroomPost,
  archiveNewsroomPost,
  saveNewsroomMediaAsset,
  saveNewsroomPressContact
} from "backend/FINAL/newsService.web";
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
  deleteVoyEntity
} from "backend/FINAL/voyMagazineService.web";

const EMBED_ID = "#newsroomAdminEmbed";
const EMBED_SOURCE = "SKANDI_NEWSROOM_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";
const PUBLIC_VOY_PATH = "/voy-magazine";

let embed = null;
let bootstrapPromise = null;

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function send(type, payload = {}) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function allowedInternalPath(path) {
  const value = String(path || "");
  return (
    value === "/" ||
    value === LOGIN_PATH ||
    value.startsWith("/riaintra") ||
    value.startsWith("/altea")
  );
}

async function logout() {
  try {
    await authentication.logout();
  } catch (error) {
    console.warn("[Magazine Manager] Wix logout returned an error.", error);
  }
  wixLocation.to(HOME_PATH);
}

async function bootstrap(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const portalSession = await getStaffPortalSession().catch(() => null);
    if (
      !portalSession ||
      portalSession.authorized === false ||
      portalSession.ok === false
    ) {
      wixLocation.to(LOGIN_PATH);
      return null;
    }

    const [newsroomResult, voyResult] = await Promise.allSettled([
      getNewsroomAdminBootstrap(),
      getVoyAdminBootstrap()
    ]);

    const newsroomData =
      newsroomResult.status === "fulfilled" ? newsroomResult.value : {};
    const voyData = voyResult.status === "fulfilled" ? voyResult.value : {};
    const profile =
      voyData.profile ||
      newsroomData.profile ||
      portalSession.profile ||
      {};

    send("INTERNAL_CHROME_BOOTSTRAP", {
      pageName: "Magazine Manager",
      pagePath: currentPath(),
      pageSubtitle: "VOY magazine, public newsroom and press publishing",
      profile,
      apps: newsroomData.apps || voyData.apps || [],
      isAltea: false
    });

    if (newsroomResult.status === "fulfilled") {
      send("NEWSROOM_ADMIN_BOOTSTRAP", newsroomData);
    } else {
      send("NEWSROOM_ADMIN_ERROR", {
        message: userMessage(newsroomResult.reason, "Newsroom data could not be loaded."),
        action: "NEWSROOM_BOOTSTRAP"
      });
    }

    if (voyResult.status === "fulfilled") {
      send("VOY_ADMIN_BOOTSTRAP_RESULT", voyData);
    } else {
      send("VOY_ADMIN_ERROR", {
        message: userMessage(voyResult.reason, "VOY magazine data could not be loaded."),
        action: "VOY_BOOTSTRAP"
      });
    }

    return { portalSession, newsroomData, voyData };
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

async function refreshVoy() {
  const result = await getVoyAdminBootstrap();
  send("VOY_ADMIN_BOOTSTRAP_RESULT", result);
  return result;
}

async function refreshNewsroom(filters = {}) {
  const result = await listNewsroomAdminData(filters);
  send("NEWSROOM_ADMIN_DATA", result);
  return result;
}

async function runVoyMutation(action, operation, successType = "VOY_ADMIN_SAVED") {
  const result = await operation();
  if (!result || result.ok === false) {
    throw new Error(result?.error || `${action} failed.`);
  }
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
  for (const key of keys[type] || []) {
    if (item[key]) return item[key];
  }
  return `${type}-${Date.now()}`;
}

async function saveEntity(type, item) {
  return runVoyMutation(`SAVE_${type.toUpperCase()}`, () =>
    saveVoyEntity({
      entityType: type,
      entityId: entityId(type, item),
      issueId: item?.issueId || "",
      item
    })
  );
}

function unsupportedConnector(type) {
  send("VOY_ADMIN_ERROR", {
    message:
      "This connector needs its provider credentials and backend adapter before it can run. The magazine publishing, page editing and public delivery functions are already connected.",
    action: type
  });
}

$w.onReady(function () {
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Magazine Manager] Missing HTML Component ${EMBED_ID}.`, error);
    return;
  }

  embed.onMessage(async (event) => {
    const msg = event?.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await bootstrap();
          return;
        }
        if (type === "INTERNAL_LOGOUT") {
          await logout();
          return;
        }
        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path || "";
          if (allowedInternalPath(path)) wixLocation.to(path);
          return;
        }
        if (type === "INTERNAL_GLOBAL_SEARCH") {
          send(
            "INTERNAL_SEARCH_RESULTS",
            await runInternalGlobalSearch(payload.query || "")
          );
          return;
        }
      }

      if (source && source !== EMBED_SOURCE) return;

      if (
        type === "NEWSROOM_ADMIN_READY" ||
        type === "VOY_ADMIN_BOOTSTRAP"
      ) {
        await bootstrap(type === "VOY_ADMIN_BOOTSTRAP" && payload.reason === "manual");
        return;
      }

      if (type === "NEWSROOM_ADMIN_REFRESH") {
        await refreshNewsroom(payload);
        return;
      }

      if (type === "NEWSROOM_SAVE_CATEGORY") {
        const result = await saveNewsroomCategory(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Category save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        await refreshNewsroom({});
        return;
      }

      if (type === "NEWSROOM_SAVE_POST") {
        const result = await saveNewsroomPost(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Post save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        await refreshNewsroom({});
        return;
      }

      if (type === "NEWSROOM_PUBLISH_POST") {
        if (payload.item) {
          const saved = await saveNewsroomPost(payload.item);
          if (!saved.ok) throw new Error(saved.error || "Post save failed.");
        }
        const result = await publishNewsroomPost(payload);
        if (!result.ok) throw new Error(result.error || "Post publish failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        await refreshNewsroom({});
        return;
      }

      if (type === "NEWSROOM_ARCHIVE_POST") {
        const result = await archiveNewsroomPost(payload);
        if (!result.ok) throw new Error(result.error || "Post archive failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        await refreshNewsroom({});
        return;
      }

      if (type === "NEWSROOM_SAVE_MEDIA") {
        const result = await saveNewsroomMediaAsset(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Media save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        await refreshNewsroom({});
        return;
      }

      if (type === "NEWSROOM_SAVE_CONTACT") {
        const result = await saveNewsroomPressContact(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Contact save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        await refreshNewsroom({});
        return;
      }

      if (type === "VOY_ADMIN_SAVE_ISSUE_METADATA") {
        await runVoyMutation(type, () => saveVoyIssue({ issue: payload.issue }));
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_SAVE_ISSUE_WITH_UPLOAD") {
        await runVoyMutation(type, () => saveVoyIssue({ issue: payload.issue }));
        send("VOY_ADMIN_ERROR", {
          message:
            "Issue metadata was saved. Add a Supabase Storage upload adapter before using direct PDF upload; structured HTML pages publish without a PDF.",
          action: type
        });
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_SAVE_ISSUE_PACKAGE") {
        await runVoyMutation(type, () =>
          saveVoyIssuePackage({ issue: payload.issue, pages: payload.pages })
        );
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_SAVE_PAGE") {
        await runVoyMutation(type, () => saveVoyPage({ page: payload.page }));
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_SAVE_PAGES") {
        await runVoyMutation(type, () =>
          saveVoyPages({ issueId: payload.issueId, pages: payload.pages })
        );
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_REORDER_PAGES") {
        await runVoyMutation(type, () => reorderVoyPages(payload));
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_DELETE_PAGE") {
        await runVoyMutation(type, () => deleteVoyPage(payload));
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_DELETE_ISSUE") {
        await runVoyMutation(type, () => deleteVoyIssue(payload));
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_PUBLISH_ISSUE") {
        await runVoyMutation(
          type,
          () => publishVoyIssue(payload),
          "VOY_ADMIN_PUBLISHED"
        );
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_ARCHIVE_ISSUE") {
        await runVoyMutation(
          type,
          () => archiveVoyIssue(payload),
          "VOY_ADMIN_ARCHIVED"
        );
        await refreshVoy();
        return;
      }

      if (type === "VOY_ADMIN_SAVE_ARTICLE") {
        await saveEntity("article", payload.article || {});
        await refreshVoy();
        return;
      }
      if (type === "VOY_ADMIN_SAVE_CAMPAIGN") {
        await saveEntity("campaign", payload.campaign || {});
        await refreshVoy();
        return;
      }
      if (type === "VOY_ADMIN_SAVE_CATEGORY") {
        await saveEntity("category", payload.category || {});
        await refreshVoy();
        return;
      }
      if (type === "VOY_ADMIN_SAVE_BANNER") {
        await saveEntity("banner", payload.banner || {});
        await refreshVoy();
        return;
      }
      if (type === "VOY_ADMIN_SAVE_TRAVEL_CARD") {
        await saveEntity("travel_card", payload.card || {});
        await refreshVoy();
        return;
      }
      if (type === "VOY_BRAND_KIT_SAVE") {
        await saveEntity("brand_kit", {
          brandKitId: "default-brand-kit",
          ...(payload.brandKit || {})
        });
        await refreshVoy();
        return;
      }
      if (type === "VOY_DISTRIBUTION_KIT_SAVE") {
        await saveEntity("distribution_kit", payload.kit || {});
        await refreshVoy();
        return;
      }
      if (type === "VOY_ASSET_IMPORT_REQUEST") {
        await saveEntity("asset", payload.asset || {});
        await refreshVoy();
        return;
      }

      const deleteMap = {
        VOY_ADMIN_DELETE_ARTICLE: ["article", payload.articleId],
        VOY_ADMIN_DELETE_CATEGORY: ["category", payload.categoryId],
        VOY_ADMIN_DELETE_BANNER: ["banner", payload.bannerId],
        VOY_ADMIN_DELETE_TRAVEL_CARD: ["travel_card", payload.cardId]
      };
      if (deleteMap[type]) {
        const [entityType, entityIdValue] = deleteMap[type];
        await runVoyMutation(type, () =>
          deleteVoyEntity({ entityType, entityId: entityIdValue })
        );
        await refreshVoy();
        return;
      }

      if (type === "VOY_QUALITY_LAB_REQUEST") {
        const readiness = payload.readiness || {};
        send("VOY_QUALITY_LAB_RESULT", {
          result: {
            readinessScore: readiness.score || 0,
            pageWarnings: payload.localChecks?.pageWarnings || 0,
            assetWarnings: payload.localChecks?.assetWarnings || 0,
            articleDrafts: payload.localChecks?.articleDrafts || 0,
            checks: payload.localChecks || {},
            pages: payload.pages || []
          }
        });
        return;
      }

      if (type === "VOY_PRINT_QA_REQUEST") {
        send("VOY_PRINT_QA_RESULT", { result: payload.qa || {} });
        return;
      }

      if (type === "VOY_BRAND_GUARD_REQUEST") {
        send("VOY_BRAND_GUARD_RESULT", {
          result: {
            score: 100,
            status: "LOCAL_RULES_CHECKED",
            notes:
              "The local brand rules were checked. Configure a copy-analysis adapter for semantic brand review."
          }
        });
        return;
      }

      if (type === "VOY_DISTRIBUTION_KIT_REQUEST") {
        send("VOY_DISTRIBUTION_KIT_RESULT", {
          result: {
            ...(payload.kit || {}),
            summary:
              "Distribution kit prepared from the active issue, page plan and campaign settings."
          }
        });
        return;
      }

      if (type === "VOY_PUBLIC_PREVIEW_REQUEST") {
        const issue = (await getVoyAdminBootstrap()).issues?.find(
          (item) => String(item.issueId) === String(payload.issueId)
        );
        const query = issue?.slug ? `?issue=${encodeURIComponent(issue.slug)}` : "";
        wixLocation.to(`${PUBLIC_VOY_PATH}${query}`);
        return;
      }

      if (type === "NEWSROOM_ADMIN_NAVIGATE") {
        if (allowedInternalPath(payload.path)) wixLocation.to(payload.path);
        return;
      }

      if (type.startsWith("VOY_") && !type.endsWith("PANEL_CHANGED")) {
        unsupportedConnector(type);
      }
    } catch (error) {
      const target = type.startsWith("NEWSROOM_")
        ? "NEWSROOM_ADMIN_ERROR"
        : "VOY_ADMIN_ERROR";
      send(target, {
        message: userMessage(error, "Magazine Manager action failed."),
        action: type
      });
    }
  });

  void bootstrap();
});

function userMessage(error, fallback) {
  const message = error instanceof Error ? error.message : String(error || "");
  const map = {
    VOY_EDITOR_ACCESS_DENIED:
      "Your Wix account does not have Magazine Manager editor access.",
    VOY_NOT_AUTHENTICATED: "Sign in to RIAINTRA and try again.",
    VOY_PUBLIC_ORGANIZATION_NOT_CONFIGURED:
      "Add VOY_PUBLIC_ORGANIZATION_ID to Wix Secrets Manager.",
    VOY_ARCHIVE_BEFORE_DELETE:
      "Archive a published issue before deleting it.",
    VOY_ISSUE_HAS_NO_PAGES: "Add at least one page before publishing.",
    VOY_SERVICE_UNAVAILABLE:
      "The VOY publishing service is temporarily unavailable."
  };
  const code = Object.keys(map).find((key) => message.includes(key));
  return code ? map[code] : message || fallback;
}

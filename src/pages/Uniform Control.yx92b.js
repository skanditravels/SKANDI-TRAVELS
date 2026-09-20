// /src/pages/Uniform Control.yx92b.js
// SKANDI Uniform Control — canonical B-011.28 single-facade page bridge.
// Administrative apparel ERP. No direct Supabase, Payroll, Asset or HR logic belongs here.

import wixLocation from "wix-location-frontend";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap.js";
import { handleUniformAction } from "backend/SKANDI_CORE/uniform.web";

const HTML_ID = "#uniformControlEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_ADMIN";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = SITE_MAP.riaintra || "/riaintra";
const LEGACY_UNIFORM_CENTER_PATHS = new Set(["/riaintra/uniform", "/riaintra/altea/uniform-control"]);

function reply(html, type, requestId = "", payload = {}, extra = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId: requestId || "",
    payload: payload || {},
    ...extra,
    timestamp: new Date().toISOString()
  });
}

async function callUniform(type, payload = {}) {
  if (typeof handleUniformAction !== "function") {
    const error = new Error("Uniform backend facade is not the B-011.28 generation.");
    error.code = "UNIFORM_WEB_FACADE_MISMATCH";
    throw error;
  }
  const result = await handleUniformAction({ type, payload });
  if (!result || result.ok !== true) {
    const error = new Error(result?.payload?.message || "Uniform Control action failed.");
    error.code = result?.payload?.code || "UNIFORM_ACTION_FAILED";
    throw error;
  }
  return result;
}

async function dispatch(html, type, payload, requestId = "") {
  const result = await callUniform(type, payload);
  reply(html, result.responseType || "UNIFORM_ADMIN_SAVED", requestId, result.payload || {});
  return result;
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE) return;
    const type = String(msg.type || "");
    const payload = msg.payload || {};
    const requestId = String(msg.requestId || payload.requestId || "");

    try {
      if (type === "UNIFORM_ADMIN_NAVIGATE") {
        const requestedPath = String(payload.path || msg.path || "");
        const path = requestedPath === "/riaintra/uniform"
          ? SITE_MAP.uniformCenter
          : requestedPath === "/riaintra/altea/uniform-control"
            ? SITE_MAP.uniformControl
            : requestedPath;
        if ((LEGACY_UNIFORM_CENTER_PATHS.has(requestedPath) || isSafeInternalRoute(path)) && path) {
          wixLocation.to(path);
        }
        return;
      }

      if (type === "UNIFORM_ADMIN_READY") {
        await dispatch(html, "UNIFORM_ADMIN_BOOTSTRAP", {}, "");
        return;
      }

      if (type.startsWith("UNIFORM_ADMIN_") || type === "UNIFORM_SYSTEM_STATUS") {
        await dispatch(html, type, payload, requestId);
      }
    } catch (error) {
      if (["STAFF_AUTH_REQUIRED", "STAFF_PROFILE_NOT_FOUND", "STAFF_ACCESS_DENIED"].includes(String(error?.code || ""))) {
        wixLocation.to(LOGIN_PATH);
      }
      reply(html, "UNIFORM_ADMIN_ERROR", requestId, {
        code: error?.code || "UNIFORM_ADMIN_ERROR",
        message: error?.message || "Uniform Control action failed."
      }, {
        code: error?.code || "UNIFORM_ADMIN_ERROR",
        message: error?.message || "Uniform Control action failed."
      });
    }
  });

  // Bootstrap after listener attachment so a fast iframe never leaves a permanent spinner.
  dispatch(html, "UNIFORM_ADMIN_BOOTSTRAP", {}, "").catch((error) => {
    reply(html, "UNIFORM_ADMIN_ERROR", "", {
      code: error?.code || "UNIFORM_ADMIN_BOOTSTRAP_FAILED",
      message: error?.message || "Uniform Control could not synchronize."
    }, {
      code: error?.code || "UNIFORM_ADMIN_BOOTSTRAP_FAILED",
      message: error?.message || "Uniform Control could not synchronize."
    });
  });
});

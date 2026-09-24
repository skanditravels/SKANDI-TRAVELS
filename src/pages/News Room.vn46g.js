// /src/pages/News Room.vn46g.js
// SKANDI Newsroom — B-011.2 canonical public bridge.
// Editorial/newsroom content is managed from Media Control through publicContent.
// Newsletter subscription remains owned by customerSession.

import {
  getPublicNewsroomData
} from "backend/SKANDI_CORE/publicContent.web";
import {
  subscribeCustomerNewsletter
} from "backend/SKANDI_CORE/customerSession.web";

const EMBED_ID = "#newsroomEmbed";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const EMBED_SOURCE = "SKANDI_PUBLIC_NEWSROOM";
const VERSION = "BACKEND-BASE-1.0-B011.2";

let embed = null;
let bootstrapPromise = null;

function payloadOf(message = {}) {
  return message.payload && typeof message.payload === "object"
    ? message.payload
    : {};
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

function errorMessage(error, fallback = "Newsroom is temporarily unavailable.") {
  const message = String(
    error?.publicMessage ||
    error?.message ||
    error?.details?.applicationError?.description ||
    ""
  ).trim();
  return message && message.length <= 500 ? message : fallback;
}

async function loadNewsroom(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;

  bootstrapPromise = getPublicNewsroomData({});
  try {
    const result = await bootstrapPromise;
    if (!result || result.ok === false) {
      throw new Error(result?.error || "Newsroom data could not be loaded.");
    }
    send("NEWSROOM_DATA", result);
    return result;
  } finally {
    bootstrapPromise = null;
  }
}

async function subscribe(payload = {}) {
  const email = String(payload.email || payload.emailAddress || "").trim();
  const result = await subscribeCustomerNewsletter({
    emailAddress: email,
    source: "SKANDI Newsroom"
  });

  send("NEWSROOM_SUBSCRIBE_RESULT", {
    ...result,
    message:
      result?.message ||
      (result?.ok !== false
        ? "You are subscribed to SKANDI updates."
        : "Subscription could not be completed.")
  });
  return result;
}

$w.onReady(() => {
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Newsroom B-011.2] Missing HTML Component ${EMBED_ID}.`, error);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[Newsroom B-011.2] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = event?.data || {};
    if (message.source && message.source !== EMBED_SOURCE) return;

    const type = String(message.type || "");
    const payload = payloadOf(message);

    try {
      if (type === "NEWSROOM_READY") {
        await loadNewsroom();
        return;
      }

      if (type === "NEWSROOM_REFRESH") {
        await loadNewsroom(true);
        return;
      }

      if (type === "NEWSROOM_SUBSCRIBE") {
        await subscribe(payload);
      }
    } catch (error) {
      console.error("[Newsroom B-011.2] Public action failed.", error);
      send("NEWSROOM_ERROR", {
        message: errorMessage(error)
      });
    }
  });

  send("NEWSROOM_HOST_READY", {
    version: VERSION,
    embedId: EMBED_ID,
    dataOwner: "MEDIA_CONTROL"
  });

  void loadNewsroom();
});

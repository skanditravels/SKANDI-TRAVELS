// Wix page code
// Route: /about/news-room
// HTML Component ID: #newsroomEmbed

import {
  getPublicNewsroomData,
  subscribeToNewsroom
} from "backend/FINAL/newsroomService.web";

const EMBED_ID = "#newsroomEmbed";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const EMBED_SOURCE = "SKANDI_PUBLIC_NEWSROOM";

let embed = null;
let bootstrapPromise = null;

function send(type, payload = {}) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

async function loadNewsroom(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;
  bootstrapPromise = getPublicNewsroomData();
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

$w.onReady(function () {
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Newsroom] Missing HTML Component ${EMBED_ID}.`, error);
    return;
  }

  embed.onMessage(async (event) => {
    const msg = event?.data || {};
    if (msg.source && msg.source !== EMBED_SOURCE) return;

    const type = String(msg.type || "");
    const payload =
      msg.payload && typeof msg.payload === "object"
        ? msg.payload
        : msg;

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
        const result = await subscribeToNewsroom(payload || {});
        send("NEWSROOM_SUBSCRIBE_RESULT", result);
        return;
      }
    } catch (error) {
      console.error("[Newsroom] Public action failed.", error);
      send("NEWSROOM_ERROR", {
        message:
          error instanceof Error && error.message
            ? error.message
            : "Newsroom is temporarily unavailable."
      });
    }
  });

  void loadNewsroom();
});

import {
  getPublicNewsroomData,
  subscribeToNewsroom
} from "backend/FINAL/newsroomService.web";

const EMBED_ID = "#newsroomEmbed";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const EMBED_SOURCE = "SKANDI_PUBLIC_NEWSROOM";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const msg = event.data || {};
    const type = msg.type || "";
    const source = msg.source || "";

    if (source && source !== EMBED_SOURCE) return;

    try {
      if (type === "NEWSROOM_READY" || type === "NEWSROOM_REFRESH") {
        send("NEWSROOM_DATA", await getPublicNewsroomData());
        return;
      }

      if (type === "NEWSROOM_SUBSCRIBE") {
        send("NEWSROOM_SUBSCRIBE_RESULT", await subscribeToNewsroom(msg.payload || {}));
        return;
      }
    } catch (error) {
      send("NEWSROOM_ERROR", {
        message: error.message || "Newsroom is temporarily unavailable."
      });
    }
  });
});

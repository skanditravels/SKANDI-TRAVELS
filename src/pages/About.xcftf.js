import { getAboutPagePayload } from "src/backend/skandiAboutSignature.web";

const EMBED_ID = "#aboutSkandiEmbed";
const HTML_SOURCE = "SKANDI_ABOUT_PAGE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function parseMessage(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  return data && typeof data === "object" ? data : null;
}

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

async function load() {
  try {
    const payload = await getAboutPagePayload();
    send("ABOUT_PAGE_DATA", payload);
  } catch (error) {
    console.error("[ABOUT] Could not load page payload", error);
    send("ABOUT_PAGE_ERROR", {
      message: "About page content is temporarily unavailable."
    });
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message) return;
    if (message.source && message.source !== HTML_SOURCE) return;

    if (message.type === "ABOUT_PAGE_READY" || message.type === "ABOUT_PAGE_REFRESH") {
      await load();
    }
  });

  load();
});

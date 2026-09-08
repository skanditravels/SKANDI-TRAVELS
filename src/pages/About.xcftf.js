import { getAboutPagePayload } from "backend/publicAbout.web";

const EMBED_ID = "#aboutSkandiEmbed";
const HTML_SOURCE = "SKANDI_ABOUT_PAGE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

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
    send("ABOUT_PAGE_DATA", await getAboutPagePayload());
  } catch (error) {
    console.error("[About] Could not load public About payload", error);
    send("ABOUT_PAGE_ERROR", {
      message: "About page content is temporarily unavailable."
    });
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== HTML_SOURCE) return;

    if (message.type === "ABOUT_PAGE_READY" || message.type === "ABOUT_PAGE_REFRESH") {
      await load();
    }
  });

  load();
});

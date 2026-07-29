import {
  getPublicCareerData,
  submitCareerApplication
} from "src/backend/careersService.web";

const EMBED_ID = "#careersEmbed";
const HTML_SOURCE = "SKANDI_CAREERS_PUBLIC";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

async function loadData() {
  send("CAREERS_DATA", await getPublicCareerData());
}

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    if (source && source !== HTML_SOURCE) return;

    try {
      if (msg.type === "CAREERS_READY" || msg.type === "CAREERS_REFRESH") {
        await loadData();
        return;
      }

      if (msg.type === "CAREERS_APPLY") {
        const result = await submitCareerApplication(msg.payload?.application || {});
        send("CAREERS_APPLICATION_RESULT", result);
        return;
      }

      if (msg.type === "CAREERS_OPEN_PORTAL") {
        send("CAREERS_PORTAL_NAVIGATE", { path: "/careers/portal" });
        return;
      }
    } catch (error) {
      send("CAREERS_ERROR", { message: error.message || "Careers is temporarily unavailable." });
    }
  });

  loadData();
});

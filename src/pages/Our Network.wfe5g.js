import { getPublicNetworkMapData } from "backend/networkMapService.web";

const HTML_ID = "#htmlSkandiMap";
const HTML_SOURCE = "SKANDI_PUBLIC_NETWORK_MAP";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
  const mapHtml = $w(HTML_ID);

  async function sendMapData() {
    try {
      const mapData = await getPublicNetworkMapData();

      mapHtml.postMessage({
        source: PARENT_SOURCE,
        type: "SKANDI_MAP_DATA",
        payload: mapData
      });
    } catch (error) {
      console.error("[Our Network] Could not load public network payload", error);
      mapHtml.postMessage({
        source: PARENT_SOURCE,
        type: "SKANDI_MAP_ERROR",
        message: "Network information is temporarily unavailable."
      });
    }
  }

  mapHtml.onMessage(async (event) => {
    const msg = event.data || {};
    const type = typeof msg === "string" ? msg : msg.type;
    const source = msg.source || "";

    if (source && source !== HTML_SOURCE) return;

    if (type === "SKANDI_MAP_READY" || type === "SKANDI_MAP_REFRESH") {
      await sendMapData();
    }
  });

  sendMapData();
});

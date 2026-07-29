import { getPublicNetworkMapData } from "src/backend/networkMapService.web";

const HTML_ID = "#htmlSkandiMap";
const HTML_SOURCE = "SKANDI_PUBLIC_NETWORK_MAP";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
  const mapHtml = $w(HTML_ID);

  function normalizeIncomingMessage(data) {
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (error) {
        return { type: data };
      }
    }
    return data || {};
  }

  function postToMap(type, payload = {}, extra = {}) {
    mapHtml.postMessage({
      source: PARENT_SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString(),
      ...extra
    });
  }

  async function sendMapData(reason = "initial-load") {
    try {
      const mapData = await getPublicNetworkMapData();

      postToMap("SKANDI_MAP_DATA", {
        ...mapData,
        meta: {
          ...(mapData && mapData.meta ? mapData.meta : {}),
          page: "/network",
          htmlId: HTML_ID,
          reason
        }
      });
    } catch (error) {
      console.error("[SKANDI MAP] Data load failed:", error);

      postToMap(
        "SKANDI_MAP_ERROR",
        { message: "Network information is temporarily unavailable." },
        { message: "Network information is temporarily unavailable." }
      );
    }
  }

  mapHtml.onMessage(async (event) => {
    const msg = normalizeIncomingMessage(event.data);
    const type = msg.type || "";
    const source = msg.source || "";

    if (source && source !== HTML_SOURCE) return;

    if (type === "SKANDI_MAP_READY" || type === "SKANDI_MAP_REFRESH") {
      await sendMapData(type);
    }
  });

  sendMapData();
});

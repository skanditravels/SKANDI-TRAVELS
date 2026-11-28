import wixLocation from "wix-location-frontend";
import { getPublicNetworkMapData } from "backend/SKANDI_CORE/networkMap.web";
import { APP_ROUTES, SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const HTML_ID = "#htmlSkandiMap";
const HTML_SOURCE = "SKANDI_PUBLIC_NETWORK_MAP";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const TYPES = ["destination", "hotel", "airport", "airline", "route"];

function selection(query = {}) {
  const [type, ...parts] = String(query.pin || "").split(":");
  const id=parts.join(":");
  if (TYPES.includes(type) && id) return { type, id };
  const legacy = TYPES.find(key => query[key]);
  return legacy ? { type:legacy, id:String(query[legacy]) } : {};
}

$w.onReady(function () {
  const query=wixLocation.query||{};
  // Earlier Explore links used the map route with geographic query parameters.
  const legacyNetworkPin=/^city:[a-z0-9-]+:[a-z0-9-]*$/i.test(query.destination||"");
  if(!query.pin&&!legacyNetworkPin&&(query.country||query.state||query.region||query.destination||query.city||query.area||query.hotel||query.hotelId||query.view)) {
    const params=new URLSearchParams();
    for(const key of ["country","state","region","destination","city","area","hotel","hotelId","view"]) {
      if(typeof query[key]==="string"&&query[key].trim())params.set(key,query[key].trim().slice(0,160));
    }
    const route=params.has("hotel")||params.has("hotelId")||["hotels","hotel"].includes(params.get("view"))?APP_ROUTES.hotelList:APP_ROUTES.country;
    wixLocation.to(route+"?"+params.toString());
    return;
  }
  const mapHtml = $w(HTML_ID);
  let request;
  const send = (type, payload) => mapHtml.postMessage({ source:PARENT_SOURCE, type, payload });

  async function sendMapData() {
    try {
      if (!request) request = getPublicNetworkMapData().finally(() => { request = null; });
      const mapData = await request;
      send("SKANDI_MAP_DATA", {
        ...mapData,
        selection:selection(wixLocation.query),
        paths:{ atlas:SITE_MAP.destinations, explore:APP_ROUTES.country, hotels:APP_ROUTES.hotelList, booking:APP_ROUTES.bookingFlow }
      });
    } catch (error) {
      console.error("[Our Destinations]", error);
      send("SKANDI_MAP_ERROR", { message:"The map couldn’t load. Try again." });
    }
  }

  mapHtml.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== HTML_SOURCE) return;
    if (message.type === "SKANDI_MAP_READY" || message.type === "SKANDI_MAP_REFRESH") await sendMapData();
    if (message.type === "SKANDI_MAP_STATE") {
      const { type, id } = message.state || {};
      if (TYPES.includes(type) && typeof id === "string" && /^[a-z0-9_:-]{1,160}$/i.test(id)) {
        const pin = type + ":" + id;
        if (wixLocation.query?.pin !== pin) wixLocation.queryParams.add({ pin });
      } else if (!type && !id) {
        const keys = ["pin", ...TYPES].filter(key => wixLocation.query?.[key] !== undefined);
        if (keys.length) wixLocation.queryParams.remove(keys);
      }
    }
    if (message.type === "SKANDI_MAP_NAVIGATE") {
      const path = String(message.url || "");
      if (isSafeInternalRoute(path) && !/^\/_(?:functions|api)(?:\/|$)/i.test(path)) wixLocation.to(path);
    }
  });

  wixLocation.onChange(() => send("SKANDI_MAP_SELECTION", selection(wixLocation.query)));
});

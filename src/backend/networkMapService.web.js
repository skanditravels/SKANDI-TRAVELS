import { webMethod, Permissions } from "wix-web-module";
import { callPublicContentRpc } from "./publicContentSupabase";

export const getPublicNetworkMapData = webMethod(Permissions.Anyone, async () => {
  const payload = await callPublicContentRpc("get_public_network_map_payload");

  if (!payload || typeof payload !== "object") {
    throw new Error("NETWORK_PAYLOAD_INVALID");
  }

  return {
    type: "SKANDI_MAP_DATA",
    source: "SKANDI_WIX_PARENT",
    generatedAt: payload.generatedAt || new Date().toISOString(),
    destinations: Array.isArray(payload.destinations) ? payload.destinations : [],
    routes: Array.isArray(payload.routes) ? payload.routes : [],
    hotels: Array.isArray(payload.hotels) ? payload.hotels : [],
    stats: payload.stats || { destinations: 0, routes: 0, hotels: 0 },
    publicNote: payload.publicNote || "Only published, customer-visible network records are shown."
  };
});

import { callPublicContentRpc } from "backend/SKANDI_CORE/publicContent";
import { getDestinationFlowCatalogCore } from "backend/SKANDI_CORE/destinationFlow";


export async function getPublicNetworkMapDataCore() {
  const [payload, hierarchyResult] = await Promise.all([callPublicContentRpc("get_public_network_map_payload"),getDestinationFlowCatalogCore()]);


  if (!payload || typeof payload !== "object") {
    throw new Error("NETWORK_PAYLOAD_INVALID");
  }


  return {
    type: "SKANDI_MAP_DATA",
    source: "SKANDI_WIX_PARENT",
    generatedAt: payload.generatedAt || new Date().toISOString(),
    destinations: Array.isArray(payload.destinations) ? payload.destinations : [],
    inventoryHierarchy: hierarchyResult?.ok ? hierarchyResult.records.filter(r=>["COUNTRY","REGION","DESTINATION","AREA","HOTEL"].includes(r.entityType)).map(r=>({id:r.id,publicId:r.publicId,type:r.entityType,code:r.code,name:r.name,slug:r.slug,parentId:r.parentEntityId,details:{countryId:r.details?.countryId,regionId:r.details?.regionId,destinationId:r.details?.destinationId,areaId:r.details?.areaId},relations:(r.relations||[]).filter(x=>["COUNTRY","REGION","DESTINATION","AREA","PARENT"].includes(x.relationType)).map(x=>({type:x.relationType,id:x.targetEntityId}))})) : null,
    routes: Array.isArray(payload.routes) ? payload.routes : [],
    hotels: Array.isArray(payload.hotels) ? payload.hotels : [],
    airports: Array.isArray(payload.airports) ? payload.airports : [],
    airlines: Array.isArray(payload.airlines) ? payload.airlines : [],
    stats: payload.stats || { destinations: 0, routes: 0, hotels: 0 },
    publicNote: payload.publicNote || "Only published, customer-visible network records are shown."
  };
}

import { callPublicContentRpc } from "backend/SKANDI_CORE/publicContent";
import { getDestinationFlowCatalogCore } from "backend/SKANDI_CORE/destinationFlow";


export async function getPublicNetworkMapDataCore() {
  const [payload, hierarchyResult] = await Promise.all([callPublicContentRpc("get_public_network_map_payload"),getDestinationFlowCatalogCore()]);


  if (!payload || typeof payload !== "object") {
    throw new Error("NETWORK_PAYLOAD_INVALID");
  }


  const inventory = hierarchyResult?.ok ? hierarchyResult.records : [];
  const ranked = (items, type) => (Array.isArray(items) ? items : []).map(item => {
    const keys = [item.id, item.publicId, item.code, item.slug, item.iata].filter(Boolean).map(x => String(x).toUpperCase());
    let match = inventory.find(row => row.entityType === type && [row.id, row.publicId, row.code, row.slug].filter(Boolean).some(x => keys.includes(String(x).toUpperCase())));
    if (!match && type === "DESTINATION" && item.name && item.country) {
      const candidates = inventory.filter(row => row.entityType === type && String(row.name || "").trim().toUpperCase() === String(item.name).trim().toUpperCase() && String(row.details?.countryName || row.details?.country || "").trim().toUpperCase() === String(item.country).trim().toUpperCase());
      if (candidates.length === 1) match = candidates[0];
    }
    return {...item, searchPriority: match?.sortPriority ?? 51};
  }).sort((a,b) => a.searchPriority-b.searchPriority || String(a.name || a.title || a.iata || '').localeCompare(String(b.name || b.title || b.iata || '')));
  return {
    type: "SKANDI_MAP_DATA",
    source: "SKANDI_WIX_PARENT",
    generatedAt: payload.generatedAt || new Date().toISOString(),
    destinations: ranked(payload.destinations,"DESTINATION"),
    inventoryHierarchy: hierarchyResult?.ok ? hierarchyResult.records.filter(r=>["COUNTRY","REGION","DESTINATION","AREA","HOTEL"].includes(r.entityType)).map(r=>({id:r.id,publicId:r.publicId,type:r.entityType,code:r.code,name:r.name,slug:r.slug,searchPriority:r.sortPriority,parentId:r.parentEntityId,details:{countryId:r.details?.countryId,regionId:r.details?.regionId,destinationId:r.details?.destinationId,areaId:r.details?.areaId},relations:(r.relations||[]).filter(x=>["COUNTRY","REGION","DESTINATION","AREA","PARENT"].includes(x.relationType)).map(x=>({type:x.relationType,id:x.targetEntityId}))})) : null,
    routes: Array.isArray(payload.routes) ? payload.routes : [],
    hotels: ranked(payload.hotels,"HOTEL"),
    airports: ranked(payload.airports,"AIRPORT"),
    airlines: ranked(payload.airlines,"AIRLINE"),
    stats: payload.stats || { destinations: 0, routes: 0, hotels: 0 },
    publicNote: payload.publicNote || "Only published, customer-visible network records are shown."
  };
}

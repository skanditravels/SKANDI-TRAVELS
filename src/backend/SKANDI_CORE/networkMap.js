import { callPublicContentRpc } from "backend/SKANDI_CORE/publicContent";
import { getDestinationFlowCatalogCore } from "backend/SKANDI_CORE/destinationFlow";
import { createDestinationContent } from "public/destinationContent";


export async function getPublicNetworkMapDataCore() {
  const [payload, hierarchyResult] = await Promise.all([callPublicContentRpc("get_public_network_map_payload"),getDestinationFlowCatalogCore()]);


  if (!payload || typeof payload !== "object") {
    throw new Error("NETWORK_PAYLOAD_INVALID");
  }


  const inventory = hierarchyResult?.ok ? hierarchyResult.records : [];
  const content = createDestinationContent(() => inventory);
  const publishedLocations = inventory.filter(r => ["COUNTRY", "STATE", "REGION", "DESTINATION", "CITY", "AREA", "HOTEL"].includes(r.entityType));
  const keyOf = value => String(value || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
  const countryFor = item => content.byTypeSlug("COUNTRY", item.country) || content.byTypeSlug("COUNTRY",item.countryCode);
  const ranked = (items, type) => (Array.isArray(items) ? items : []).map(item => {
    const keys = [item.id, item.publicId, item.code, item.slug, item.iata].map(keyOf).filter(Boolean);
    const country = type==="DESTINATION"?countryFor(item):null;
    const candidates = inventory.filter(row=>(row.entityType===type||(type==="DESTINATION"&&row.entityType==="CITY"))&&(!country||content.isUnder(row,country)));
    const exact = candidates.filter(row=>[row.id,row.publicId,row.code,row.slug].map(keyOf).some(key=>keys.includes(key)));
    const byName = type==="DESTINATION"&&country&&item.name
      ? candidates.filter(row=>keyOf(row.name)===keyOf(item.name)):[];
    const match = exact.length===1?exact[0]:byName.length===1?byName[0]:null;
    const rankedItem = {...item, searchPriority: match?.sortPriority ?? 51};
    if(type==="HOTEL"&&match)rankedItem.detailPath=content.geographyPath(match);
    if(type==="DESTINATION") {
      const place=match||country;
      rankedItem.guideName=place?.name||"";
      rankedItem.explorePath=place?content.geographyPath(place):"";
      rankedItem.hotelsPath=match&&content.hotelsForScope(match).length?content.geographyPath(match,"hotels"):"";
      rankedItem.placeSummary=match?content.summaryOf(match):"";
    }
    return rankedItem;
  }).sort((a,b) => a.searchPriority-b.searchPriority || String(a.name || a.title || a.iata || '').localeCompare(String(b.name || b.title || b.iata || '')));
  return {
    type: "SKANDI_MAP_DATA",
    source: "SKANDI_WIX_PARENT",
    generatedAt: payload.generatedAt || new Date().toISOString(),
    destinations: ranked(payload.destinations,"DESTINATION"),
    inventoryHierarchy: hierarchyResult?.ok ? publishedLocations.map(r=>({
      id:r.id,publicId:r.publicId,type:r.entityType,code:r.code,name:r.name,slug:r.slug,searchPriority:r.sortPriority,
      parentId:content.ancestors(r)[0]?.id||"",
      details:{countryId:r.details?.countryId||r.details?.countryEntityId,stateId:r.details?.stateId,regionId:r.details?.regionId||r.details?.regionEntityId,
        destinationId:r.details?.destinationId||r.details?.destinationEntityId,cityId:r.details?.cityId,areaId:r.details?.areaId||r.details?.areaEntityId},
      relations:(r.relations||[]).filter(x=>["COUNTRY","STATE","REGION","DESTINATION","CITY","AREA","PARENT"].includes(x.relationType))
        .map(x=>({type:x.relationType,id:x.targetEntityId})),
      path:content.geographyPath(r),
      parentNames:content.breadcrumbsFor(r).filter(crumb=>crumb.name!==r.name).map(crumb=>crumb.name)
    })) : null,
    routes: Array.isArray(payload.routes) ? payload.routes : [],
    hotels: ranked(payload.hotels,"HOTEL"),
    airports: ranked(payload.airports,"AIRPORT"),
    airlines: ranked(payload.airlines,"AIRLINE"),
    stats: payload.stats || { destinations: 0, routes: 0, hotels: 0 },
    publicNote: payload.publicNote || "Only published, customer-visible network records are shown."
  };
}

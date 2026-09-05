import { webMethod, Permissions } from "wix-web-module";
import { restRequest } from "./RIA/supabaseServer.js";

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
function text(v){return String(v??"").trim()}
export const getDestinationHotelFinderData = webMethod(Permissions.Anyone, async () => {
  const [destinationRows,hotelRows,mediaRows] = await Promise.all([
    restRequest({table:"inventory_master_entities",query:{select:"*",entity_type:"eq.DESTINATION",status:"eq.PUBLISHED",active:"eq.true",customer_visible:"eq.true",order:"sort_priority.asc,name.asc",limit:1000}}),
    restRequest({table:"inventory_master_entities",query:{select:"*",entity_type:"eq.HOTEL",status:"eq.PUBLISHED",active:"eq.true",customer_visible:"eq.true",order:"sort_priority.asc,name.asc",limit:1000}}),
    restRequest({table:"inventory_media_assets",query:{select:"entity_id,url,is_hero,is_card,sort_order,active",active:"eq.true",order:"sort_order.asc",limit:3000}})
  ]);
  const destinations=arr(destinationRows), media=new Map();
  arr(mediaRows).forEach(m=>{if(!media.has(m.entity_id))media.set(m.entity_id,[]);media.get(m.entity_id).push(m)});
  const byId=new Map(destinations.map(d=>[d.id,d]));
  const countries=destinations.filter(d=>String(obj(d.details).level||"").toUpperCase()==="COUNTRY").map(d=>({id:d.id,name:d.name,title:d.name,slug:d.slug,image:media.get(d.id)?.[0]?.url||"",destinationIata:text(obj(d.details).searchAirportIata)}));
  const areas=destinations.filter(d=>["DESTINATION","AREA"].includes(String(obj(d.details).level||"").toUpperCase())).map(d=>({id:d.id,countryId:d.parent_entity_id||"",name:d.name,title:d.name,slug:d.slug,image:media.get(d.id)?.[0]?.url||"",destinationIata:text(obj(d.details).searchAirportIata)}));
  const hotels=arr(hotelRows).map(h=>{const d=obj(h.details),area=byId.get(d.areaId),dest=byId.get(d.destinationId)||byId.get(area?.parent_entity_id);const img=media.get(h.id)?.[0]?.url||"";return{id:h.id,hotelId:h.id,countryId:dest?.parent_entity_id||"",areaId:d.areaId||d.destinationId||"",name:h.name,location:d.address||[d.city,area?.name,dest?.name].filter(Boolean).join(", "),area:area?.name||dest?.name||"",country:"",rating:Number(d.skandiRating||d.officialStarRating||0),image:img,destinationIata:text(d.searchAirportIata),airportIata:text(d.searchAirportIata),nearestAirportIata:text(d.searchAirportIata),description:"",tags:[],slug:h.slug,providerAccommodationId:d.providerAccommodationId||h.source_reference||""}});
  return {countries,areas,hotels,source:"INVENTORY_CONTROL_V2"};
});

import { getPublicNetworkMapData } from "backend/destinationInventory.web";
const HTML_ID="#htmlSkandiMap",HTML_SOURCE="SKANDI_PUBLIC_NETWORK_MAP",PARENT_SOURCE="SKANDI_WIX_PARENT";
$w.onReady(function(){
  let html;try{html=$w(HTML_ID)}catch(error){console.error(error);return}
  function send(type,payload={}){html.postMessage({source:PARENT_SOURCE,type,payload,timestamp:new Date().toISOString()})}
  async function load(reason="initial-load"){try{const data=await getPublicNetworkMapData({language:"EN"});send("SKANDI_MAP_DATA",{...data,meta:{...(data.meta||{}),page:"/network",htmlId:HTML_ID,reason}})}catch(error){console.error("[Network]",error);send("SKANDI_MAP_ERROR",{message:"Network information is temporarily unavailable."})}}
  html.onMessage(async event=>{const m=event.data||{};if(m.source&&m.source!==HTML_SOURCE)return;if(m.type==="SKANDI_MAP_READY"||m.type==="SKANDI_MAP_REFRESH")await load(m.type)});
  load();
});

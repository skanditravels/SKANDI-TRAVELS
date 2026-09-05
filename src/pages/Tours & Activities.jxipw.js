import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import {
  getToursActivitiesBootstrap,
  searchToursActivities,
  getTourActivityDetail,
  searchNearbyToursActivities
} from "backend/destinationInventory.web";
import { createTourActivityBookingCart } from "backend/FINAL/toursActivitiesService.web";

const HTML_ID="#toursActivitiesHtml";
const HTML_SOURCE="SKANDI_TOURS_ACTIVITIES";
const PARENT_SOURCE="SKANDI_WIX_PARENT";
let settings={language:"EN",currency:"USD"};

function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
function parse(v){if(typeof v==="string"){try{return JSON.parse(v)}catch(_){return null}}return obj(v)}
function payload(m){return {...obj(m),...obj(m?.payload)}}
function send(el,type,data={},requestId=""){el.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...obj(data),requestId},timestamp:new Date().toISOString()})}
function navigate(path){const p=String(path||"").trim();if(p.startsWith("/")||/^https?:\/\//i.test(p))wixLocationFrontend.to(p)}
async function member(){try{return await currentMember.getMember()}catch(_){return null}}
async function login(){try{await authentication.promptLogin()}catch(_){}}
function normalizeSettings(v={}){return{language:String(v.language||"EN").toUpperCase(),currency:String(v.currency||"USD").toUpperCase()}}
function queryState(){const q=wixLocationFrontend.query||{};return{initialDestination:String(q.destination||""),initialCategory:String(q.category||""),initialActivity:String(q.activity||q.slug||"")}}

$w.onReady(function(){
  let el;try{el=$w(HTML_ID)}catch(error){console.error(error);return}
  el.onMessage(async event=>{
    const m=parse(event.data);if(!m||m.source!==HTML_SOURCE)return;
    const p=payload(m),id=String(m.requestId||p.requestId||"");
    try{
      if(m.type==="TOURS_READY"){
        settings=normalizeSettings(p.settings||settings);
        const initial=queryState();
        const bootstrap=await getToursActivitiesBootstrap({...settings,...initial});
        let initialActivity=null;
        if(initial.initialActivity){try{initialActivity=(await getTourActivityDetail({activityId:initial.initialActivity,...settings}))?.activity||null}catch(_){}}
        send(el,"TOURS_BOOTSTRAP_RESULT",{...(bootstrap||{}),initialActivity,...initial},id);
        return;
      }
      if(m.type==="UPDATE_SETTINGS"){settings=normalizeSettings(p);return}
      if(m.type==="TOURS_SEARCH"){const r=await searchToursActivities({...obj(p.search),...settings});send(el,"TOURS_SEARCH_RESULT",{...(r||{}),items:Array.isArray(r?.items)?r.items:[]},id);return}
      if(m.type==="TOURS_ACTIVITY_OPEN"){send(el,"TOURS_ACTIVITY_RESULT",await getTourActivityDetail({activityId:p.activityId,...settings}),id);return}
      if(m.type==="TOURS_NEARBY_SEARCH"){send(el,"TOURS_NEARBY_RESULT",await searchNearbyToursActivities({latitude:Number(p.latitude),longitude:Number(p.longitude),...settings}),id);return}
      if(m.type==="TOURS_BOOK_ACTIVITY"){
        if(!(await member()))await login();
        const result=await createTourActivityBookingCart({activity:p.activity,selection:p.selection,...settings});
        send(el,"TOURS_BOOK_RESULT",result||{},id);return;
      }
      if(m.type==="TOURS_NAVIGATE"){navigate(p.path);return}
      if(m.type==="TOURS_FAVORITE"){if(!(await member()))await login();send(el,"TOURS_FAVORITE_RESULT",{ok:true,activityId:p.activityId},id)}
    }catch(error){console.error("[Tours]",error);send(el,"TOURS_ERROR",{message:error?.message||"The request could not be completed."},id)}
  });
});

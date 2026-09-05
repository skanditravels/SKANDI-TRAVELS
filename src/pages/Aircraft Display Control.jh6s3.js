import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getAircraftDisplayBootstrap,
  getAircraftDisplayRecord,
  saveAircraftDisplayRecord,
  deleteAircraftDisplayRecord,
  saveAircraftCabin,
  deleteAircraftCabin,
  saveAircraftView,
  deleteAircraftView,
  saveAircraftHotspot,
  deleteAircraftHotspot,
  saveAircraftWalkScene,
  deleteAircraftWalkScene,
  saveAircraftSceneHotspot,
  deleteAircraftSceneHotspot
} from "backend/RIA/aircraftDisplayControl.web";

const EMBED_ID="#aircraftDisplayControlEmbed";
const SOURCE="SKANDI_AIRCRAFT_DISPLAY_CONTROL";
const PARENT="SKANDI_WIX_PARENT";
const LOGIN_PATH="/riaintra";
const HOME_PATH="/";

function parse(data){if(typeof data==="string"){try{return JSON.parse(data)}catch(_){return null}}return data&&typeof data==="object"?data:null}
function post(html,type,payload={},requestId=""){html?.postMessage?.({source:PARENT,type,payload,...(requestId?{requestId}:{}),timestamp:new Date().toISOString()})}
function cleanError(error){return String(error?.message||error?.code||"Aircraft Display Control request failed.").slice(0,500)}
async function authorized(){const session=await getStaffPortalSession().catch(()=>null);if(!session||session.loggedIn===false||session.authenticated===false||session.authorized===false||session.ok===false){wixLocation.to(LOGIN_PATH);return null}return session}
async function bootstrap(html,payload={},requestId=""){const session=await authorized();if(!session)return;const result=await getAircraftDisplayBootstrap(payload);post(html,"AIRCRAFT_CONTROL_BOOTSTRAP",{...result,portalSession:session},requestId)}

$w.onReady(async()=>{
  const html=$w(EMBED_ID);
  html.onMessage(async event=>{
    const m=parse(event.data);if(!m||m.source!==SOURCE)return;
    const type=m.type||"",payload=m.payload||{},requestId=m.requestId||"";
    try{
      if(type==="AIRCRAFT_CONTROL_READY"||type==="AIRCRAFT_CONTROL_REFRESH"){await bootstrap(html,payload,requestId);return}
      if(!(await authorized()))return;
      if(type==="AIRCRAFT_CONTROL_GET"){post(html,"AIRCRAFT_CONTROL_RECORD",await getAircraftDisplayRecord(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_SAVE_AIRCRAFT"){post(html,"AIRCRAFT_CONTROL_SAVED",await saveAircraftDisplayRecord(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_DELETE_AIRCRAFT"){post(html,"AIRCRAFT_CONTROL_DELETED",await deleteAircraftDisplayRecord(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_SAVE_CABIN"){post(html,"AIRCRAFT_CONTROL_CHILD_SAVED",await saveAircraftCabin(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_DELETE_CABIN"){post(html,"AIRCRAFT_CONTROL_CHILD_DELETED",await deleteAircraftCabin(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_SAVE_VIEW"){post(html,"AIRCRAFT_CONTROL_CHILD_SAVED",await saveAircraftView(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_DELETE_VIEW"){post(html,"AIRCRAFT_CONTROL_CHILD_DELETED",await deleteAircraftView(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_SAVE_HOTSPOT"){post(html,"AIRCRAFT_CONTROL_CHILD_SAVED",await saveAircraftHotspot(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_DELETE_HOTSPOT"){post(html,"AIRCRAFT_CONTROL_CHILD_DELETED",await deleteAircraftHotspot(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_SAVE_SCENE"){post(html,"AIRCRAFT_CONTROL_CHILD_SAVED",await saveAircraftWalkScene(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_DELETE_SCENE"){post(html,"AIRCRAFT_CONTROL_CHILD_DELETED",await deleteAircraftWalkScene(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_SAVE_SCENE_HOTSPOT"){post(html,"AIRCRAFT_CONTROL_CHILD_SAVED",await saveAircraftSceneHotspot(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_DELETE_SCENE_HOTSPOT"){post(html,"AIRCRAFT_CONTROL_CHILD_DELETED",await deleteAircraftSceneHotspot(payload),requestId);return}
      if(type==="AIRCRAFT_CONTROL_LOGOUT"){try{await authentication.logout()}catch(_){}wixLocation.to(HOME_PATH)}
    }catch(error){post(html,"AIRCRAFT_CONTROL_ERROR",{message:cleanError(error)},requestId)}
  });
  await bootstrap(html);
});

// /src/pages/Tours & Activities.jxipw.js
// SKANDI Tours & Activities V12 Wix page bridge; HTML -> postMessage -> SKANDI_CORE.
import wixLocationFrontend from 'wix-location-frontend';
import { authentication } from 'wix-members-frontend';
import { SITE_MAP, isSafeInternalRoute } from 'public/siteMap';
import { getCustomerHeaderSession } from 'backend/SKANDI_CORE/customerSession.web';
import {
  getToursActivitiesBootstrap, searchToursActivities, getTourActivityDetail,
  searchNearbyToursActivities, checkTourActivityBooking, saveTourFavorite
} from 'backend/SKANDI_CORE/toursActivities.web';

const HTML_ID = '#toursActivitiesHtml';
const HTML_SOURCE = 'SKANDI_TOURS_ACTIVITIES';
const PARENT_SOURCE = 'SKANDI_WIX_PARENT';
const languages = new Set(['EN','SV','NO','DA']);
const currencies = new Set(['USD','SEK','NOK','DKK','EUR']);
const object = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const norm = x => ({
  language: languages.has(String(x?.language || '').toUpperCase()) ? String(x.language).toUpperCase() : 'EN',
  currency: currencies.has(String(x?.currency || '').toUpperCase()) ? String(x.currency).toUpperCase() : 'USD'
});
let settings = norm({});
function send(el, type, data = {}, requestId = '') {
  el.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...object(data),requestId},timestamp:new Date().toISOString()});
}
function errorInfo(error) {
  return { code: String(error?.code || 'TOURS_ACTION_FAILED').slice(0,100),
    message: String(error?.publicMessage || error?.message || 'The experience request could not be completed.').slice(0,350) };
}
async function session(el) {
  const state = await getCustomerHeaderSession();
  send(el, 'CUSTOMER_HEADER_STATE', state || {loggedIn:false});
  return state;
}
function queryState() {
  const q = wixLocationFrontend.query || {};
  return {
    initialDestination:String(q.destination||'').slice(0,200),
    initialCategory:String(q.category||'').slice(0,60),
    initialActivity:String(q.activity||q.slug||'').slice(0,240)
  };
}
function navigate(input) {
  const value = String(input || '').trim();
  if (isSafeInternalRoute(value)) wixLocationFrontend.to(value);
  else throw new Error('This navigation target is not part of the SKANDI website.');
}
$w.onReady(() => {
  const el = $w(HTML_ID);
  el.onMessage(async event => {
    const m = typeof event.data === 'string' ? (()=>{try{return JSON.parse(event.data)}catch(_){return null}})() : event.data;
    if (!m || m.source !== HTML_SOURCE) return;
    const p = object(m.payload);
    const id = String(m.requestId || p.requestId || '').slice(0,80);
    try {
      switch (m.type) {
        case 'TOURS_READY': {
          settings = norm(p.settings || settings);
          const initial = queryState();
          const result = await getToursActivitiesBootstrap({...settings,...initial});
          send(el,'TOURS_BOOTSTRAP_RESULT',{...object(result),...initial},id);
          if(initial.initialActivity) {
            try { send(el,'TOURS_ACTIVITY_RESULT',await getTourActivityDetail({activityId:initial.initialActivity,...settings}),id); }
            catch (error) { send(el,'TOURS_ERROR',errorInfo(error),id); }
          }
          await session(el);
          return;
        }
        case 'UPDATE_SETTINGS': settings = norm(p); return;
        case 'TOURS_SEARCH': {
          send(el,'TOURS_SEARCH_RESULT',await searchToursActivities({...object(p.search),...settings}),id);
          return;
        }
        case 'TOURS_ACTIVITY_OPEN': {
          send(el,'TOURS_ACTIVITY_RESULT',await getTourActivityDetail({activityId:p.activityId,...settings}),id);
          return;
        }
        case 'TOURS_NEARBY_SEARCH': {
          send(el,'TOURS_NEARBY_RESULT',await searchNearbyToursActivities({latitude:p.latitude,longitude:p.longitude,...settings}),id);
          return;
        }
        case 'TOURS_BOOK_ACTIVITY': {
          send(el,'TOURS_BOOK_RESULT',await checkTourActivityBooking({activityId:p.activityId,selection:p.selection,...settings}),id);
          return;
        }
        case 'TOURS_FAVORITE': {
          const result = await session(el);
          if(!result?.loggedIn) {
            await authentication.promptLogin();
            await session(el);
            return;
          }
          send(el,'TOURS_FAVORITE_RESULT',await saveTourFavorite({activityId:p.activityId,...settings}),id);
          return;
        }
        case 'TOURS_NAVIGATE': navigate(p.path); return;
        case 'TOURS_MEMBER_LOGIN': await authentication.promptLogin(); await session(el); return;
        case 'TOURS_MEMBER_LOGOUT': await authentication.logout(); await session(el); return;
        default: return;
      }
    } catch (error) {
      console.error('[Tours V12]',m.type,error);
      send(el,'TOURS_ERROR',{action:m.type,...errorInfo(error)},id);
    }
  });
});

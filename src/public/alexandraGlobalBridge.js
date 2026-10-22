// SKANDI V12 — shared sitewide Alexandra LiveKit bridge.
// One canonical LiveKit Agents provider, session dispatcher and Supabase Support core.
// Sitewide mobile navigation and desktop chat share this Wix frontend coordinator.
import { session } from 'wix-storage-frontend';
import { currentMember } from 'wix-members-frontend';
import {
  startAlexandraLiveKitSession,
  createCustomerSupportCase
} from 'backend/SKANDI_CORE/customerSupport.web';

const LAUNCHER_ID = '#skandiAlexandraLauncherEmbed';
const PANEL_ID = '#skandiAlexandraGlobalEmbed';
const MOBILE_NAV_ID = '#skandiMobileAppNavEmbed';
const CHAT_SOURCE = 'SKANDI_SUPPORT_CHAT';
const LAUNCH_SOURCE = 'SKANDI_ALEXANDRA_LAUNCHER';
const PARENT_SOURCE = 'SKANDI_WIX_PARENT';
const STORAGE_KEY = 'skandi_alexandra_livekit_chat_v12';
const LEGACY_KEY = 'skandi_alexandra_wix_ai_chat_v127';
const clean = (x, n = 1500) => String(x ?? '').trim().slice(0,n);
const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const pathOf = x => { const p=clean(x,400);return p.startsWith('/')&&!p.startsWith('//')&&!/[\\\x00-\x1F]/.test(p)?p:''; };
const post = (el,type,payload={}) => { try { el?.postMessage({source:PARENT_SOURCE,type,payload}); } catch(_){} };
function transcript(raw={}) {
  const data=obj(raw), rawMessages=Array.isArray(data.messages)?data.messages:[];
  const rawHistory=Array.isArray(data.history)?data.history:[];
  return {
    open:data.open===true,
    messages:rawMessages.slice(-18).filter(m=>['user','assistant'].includes(m?.role)).map(m=>({role:m.role,content:clean(m.content,1900)})),
    history:rawHistory.slice(-8).filter(m=>['user','assistant'].includes(m?.role)).map(m=>({role:m.role,content:clean(m.content,900)}))
  };
}
function storageRead() {
  try {
    const current=session.getItem(STORAGE_KEY);
    if(current)return transcript(JSON.parse(current));
    const legacy=session.getItem(LEGACY_KEY);
    return legacy?transcript(JSON.parse(legacy)):transcript();
  } catch(_) {return transcript();}
}
function storageSave(value) {
  try {
    // LiveKit room credentials/tokens/dispatches are NEVER persisted to browser storage.
    session.setItem(STORAGE_KEY,JSON.stringify(transcript(value)));
    session.removeItem(LEGACY_KEY);
  } catch(_) {}
}
function hide(el) {try {el?.hide();} catch(_) {}}
function show(el) {try {el?.show();} catch(_) {}}
async function identity(){try{const m=await currentMember.getMember();return String(m?._id||'guest').slice(0,120);}catch(_){return 'guest';}}
function safeFailure(error){return clean(error?.publicMessage||error?.message||'Live customer assistance could not connect.',350);}

export function bindAlexandraGlobal({ wixSelector=$w, navigate, enabled=()=>true, mobileEnabled=()=>false }={}) {
  let launcher,panel,mobileNav;
  try{launcher=wixSelector(LAUNCHER_ID);}catch(_){}
  try{panel=wixSelector(PANEL_ID);}catch(_){}
  try{mobileNav=wixSelector(MOBILE_NAV_ID);}catch(_){}
  const desktopAvailable=Boolean(launcher&&panel&&typeof launcher.onMessage==='function'&&typeof panel.onMessage==='function');
  const mobileAvailable=Boolean(mobileNav&&typeof mobileNav.postMessage==='function');
  if(!desktopAvailable&&!mobileAvailable){
    console.warn('[Alexandra Global] Neither desktop chat nor mobile navigation is installed.');
    return {installed:false};
  }
  let memberId='guest',state=storageRead(),openRequested=state.open,currentPath='',busy=false;
  let activeDesktop=null,activeMobile=null,desktopInitialized=false;
  let desktopEpoch=0,mobileEpoch=0;
  const targetEl=target=>target==='mobile'?mobileNav:panel;
  const allowed=()=>enabled()!==false&&currentPath.startsWith('/')&&!/^\/(?:riaintra|altea|intra|staff|admin)(?:\/|$)/i.test(currentPath);
  function syncOpen(){
    if(!allowed()){hide(launcher);hide(panel);return;}
    if(mobileAvailable&&mobileEnabled()===true){hide(launcher);hide(panel);return;}
    if(desktopAvailable){show(launcher);if(openRequested)show(panel);else hide(panel);post(launcher,'SUPPORT_LAUNCHER_STATE',{open:openRequested});}
  }
  function save(next){state=transcript({...next,open:openRequested});storageSave(state);}
  function release(target){if(target==='mobile'){activeMobile=null;++mobileEpoch;}else{activeDesktop=null;++desktopEpoch;}}
  async function open(requestId='',target='desktop'){
    if(!allowed()||busy)return;
    if(target==='desktop'&&openRequested&&activeDesktop)return;
    const el=targetEl(target);
    if(!el)return;
    busy=true;
    if(target==='desktop')openRequested=true;
    const epoch=target==='mobile'?++mobileEpoch:++desktopEpoch;
    syncOpen();
    try {
      // Each room requires a freshly issued 15-minute LiveKit JWT and agent dispatch.
      // Do not attempt to reuse the old Wix AI session ID or a disconnected LiveKit room.
      const started=await startAlexandraLiveKitSession({pagePath:currentPath||'/about/support'});
      if(epoch!==(target==='mobile'?mobileEpoch:desktopEpoch))return;
      const room=obj(started?.session);
      if(!started?.ok||!room.sessionId||!room.url||!room.token||!room.roomName||!room.dispatchId)throw new Error('LiveKit did not confirm an Alexandra session and agent dispatch.');
      if(target==='mobile')activeMobile=room.sessionId;else activeDesktop=room.sessionId;
      save(state);
      post(el,'SUPPORT_CHAT_OPEN',{mode:'ALEXANDRA_LIVEKIT',alexandraSession:room,messages:state.messages,history:state.history,loggedIn:memberId!=='guest',requestId});
    }catch(e){
      release(target);
      if(target==='desktop'){openRequested=false;syncOpen();post(launcher,'SUPPORT_LAUNCHER_ERROR',{message:safeFailure(e)});}
      post(el,'SUPPORT_CHAT_ERROR',{message:safeFailure(e),requestId});
    }finally{busy=false;}
  }
  async function runCreateCase(msg,target='desktop'){
    const payload=obj(msg.payload),requestId=clean(payload.requestId||msg.requestId,100);
    try {
      const input=obj(payload.input);
      const result=await createCustomerSupportCase({input:{...input,source:'alexandra',sourceChannel:'ALEXANDRA_LIVEKIT',sourcePage:currentPath||'/about/support'}});
      post(targetEl(target),'SUPPORT_CHAT_CASE_CREATED',{...obj(result),requestId});
    }catch(e){post(targetEl(target),'SUPPORT_CHAT_ERROR',{message:safeFailure(e),requestId});}
  }
  async function handleChatMessage(msg,target){
    const payload=obj(msg.payload);
    switch(msg.type){
      case 'SUPPORT_CHAT_READY':
        // A new iframe is a new realtime connection; it must request fresh room credentials.
        if(target==='desktop'&&!desktopInitialized){desktopInitialized=true;if(openRequested)await open('','desktop');}
        return;
      case 'SUPPORT_CHAT_START_ALEXANDRA':await open(clean(payload.requestId||msg.requestId,100),target);return;
      case 'SUPPORT_CHAT_SNAPSHOT':save({...state,messages:payload.messages,history:payload.history});return;
      case 'SUPPORT_CHAT_PANEL_CLOSE':release(target);if(target==='desktop'){openRequested=false;save(state);syncOpen();}return;
      case 'SUPPORT_CHAT_ALEXANDRA_MESSAGE':
        // The browser sends on LiveKit lk.chat; do not fake/duplicate Wix AI responses.
        post(targetEl(target),'SUPPORT_CHAT_ERROR',{message:'Please reconnect Alexandra to LiveKit before sending.'});return;
      case 'SUPPORT_CHAT_SUBMIT_FORM':await runCreateCase(msg,target);return;
      case 'SUPPORT_CHAT_NAVIGATE':{const path=pathOf(payload.path);if(path&&typeof navigate==='function')navigate(path);return;}
      default:return;
    }
  }
  if(desktopAvailable){
    launcher.onMessage(async ev=>{const msg=obj(ev?.data);if(msg.source!==LAUNCH_SOURCE)return;if(msg.type==='SUPPORT_LAUNCHER_READY')syncOpen();if(msg.type==='SUPPORT_LAUNCHER_CLICK')await open(clean(msg.requestId,100),'desktop');});
    panel.onMessage(async ev=>{const msg=obj(ev?.data);if(msg.source!==CHAT_SOURCE)return;await handleChatMessage(msg,'desktop');});
  }
  const handleMobileMessage=async msg=>{
    if(!mobileAvailable||mobileEnabled()!==true||!allowed())return;
    const m=obj(msg);if(m.source===CHAT_SOURCE)await handleChatMessage(m,'mobile');
  };
  const refreshIdentity=async()=>{
    const id=await identity();
    try {const previous=session.getItem(STORAGE_KEY+'_identity');if(previous&&previous!==id){state=transcript();openRequested=false;storageSave(state);activeDesktop=null;activeMobile=null;}session.setItem(STORAGE_KEY+'_identity',id);}catch(_){}
    memberId=id;syncOpen();
  };
  refreshIdentity().catch(error=>console.warn('[Alexandra Global] Identity unavailable.',error));
  syncOpen();
  return {
    installed:true,handleMobileMessage,
    onRouteChange(path=''){currentPath=clean(path,350);syncOpen();if(desktopInitialized&&openRequested&&!activeDesktop&&allowed())void open('','desktop');},
    open:()=>open(),
    close:()=>{openRequested=false;release('desktop');save(state);syncOpen();},
    clear:()=>{openRequested=false;activeDesktop=null;activeMobile=null;state=transcript();storageSave(state);syncOpen();},
    refreshIdentity,isOpen:()=>openRequested
  };
}

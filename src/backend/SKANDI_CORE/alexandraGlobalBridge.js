// SKANDI V12.7 — shared site-wide Alexandra Wix AI bridge.
// Import and call bindAlexandraGlobal() from the existing site masterPage.js only.
// Sitewide Wix HTML components: #skandiAlexandraLauncherEmbed, #skandiAlexandraGlobalEmbed.
// No separate database or AI implementation. Core customer support ownership is unchanged.
import { session } from 'wix-storage-frontend';
import { currentMember } from 'wix-members-frontend';
import {
  startAlexandraSupportSession,
  sendAlexandraAiMessage,
  createCustomerSupportCase
} from 'backend/SKANDI_CORE/customerSupport.web';

const LAUNCHER_ID = '#skandiAlexandraLauncherEmbed';
const PANEL_ID = '#skandiAlexandraGlobalEmbed';
const CHAT_SOURCE = 'SKANDI_SUPPORT_CHAT';
const LAUNCH_SOURCE = 'SKANDI_ALEXANDRA_LAUNCHER';
const PARENT_SOURCE = 'SKANDI_WIX_PARENT';
const STORAGE_KEY = 'skandi_alexandra_wix_ai_chat_v127';
const clean = (x, n = 1500) => String(x ?? '').trim().slice(0, n);
const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const pathOf = x => { const p = clean(x, 400); return p.startsWith('/') && !p.startsWith('//') && !/[\\\x00-\x1F]/.test(p) ? p : ''; };
const post = (el,type,payload={}) => { try { el?.postMessage({source:PARENT_SOURCE,type,payload}); } catch(_){} };
const now = () => Date.now();
function sanitizeSnapshot(raw = {}) {
  const data = obj(raw);
  const session = obj(data.session);
  const expires = Date.parse(session.expiresAt || '');
  if (!Number.isFinite(expires) || expires <= now()) return null;
  return {
    session: { sessionId:clean(session.sessionId,100),expiresAt:new Date(expires).toISOString() },
    open:data.open === true,
    messages:(Array.isArray(data.messages)?data.messages:[]).slice(-18).filter(m=>['user','assistant'].includes(m?.role)).map(m=>({role:m.role,content:clean(m.content,1900)})),
    history:(Array.isArray(data.history)?data.history:[]).slice(-8).filter(m=>['user','assistant'].includes(m?.role)).map(m=>({role:m.role,content:clean(m.content,900)}))
  };
}
function hide(el) { try { el?.hide(); } catch(_){} }
function show(el) { try { el?.show(); } catch(_){} }
function storageRead() { try { return sanitizeSnapshot(JSON.parse(session.getItem(STORAGE_KEY) || 'null')); } catch(_) { return null; } }
function storageSave(value) { try {const row=sanitizeSnapshot(value);if(row)session.setItem(STORAGE_KEY,JSON.stringify(row));else session.removeItem(STORAGE_KEY);} catch(_){} }
async function identity() {try {const member=await currentMember.getMember();return String(member?._id||'guest').slice(0,120)} catch(_) {return 'guest'}}
function safeFailure(error) {return clean(error?.publicMessage || error?.message || 'This request could not be completed.',350)}

export function bindAlexandraGlobal({ wixSelector = $w, navigate, enabled = () => true } = {}) {
  let launcher, panel;
  try { launcher=wixSelector(LAUNCHER_ID);panel=wixSelector(PANEL_ID); } catch(_) {}
  if (!launcher || !panel || typeof launcher.onMessage!=='function' || typeof panel.onMessage!=='function') {
    console.warn('[Alexandra Global] Site-wide launcher or panel component not installed.');
    return {installed:false};
  }
  let memberId = 'guest';
  let state = storageRead();
  let openRequested = state?.open === true;
  let panelReady = false;
  let busy = false;
  let currentPath = '';
  const syncOpen = () => {
    // Public site only; the site master must supply the current path before showing.
    const canShow = enabled() !== false && currentPath.startsWith('/') && !/^\/(?:riaintra|altea|intra|staff|admin)(?:\/|$)/i.test(currentPath);
    if (!canShow) { hide(launcher);hide(panel);return; }
    show(launcher);
    if (openRequested) show(panel); else hide(panel);
    post(launcher,'SUPPORT_LAUNCHER_STATE',{open:openRequested});
  };
  const save = (next) => {state = sanitizeSnapshot(next); if(state){state.open=openRequested;storageSave(state)} else storageSave(null);};
  const open = async (requestId='') => {
    if(busy)return;
    busy=true;
    try {
      let current = state;
      if(!current?.session?.sessionId) {
        const start=await startAlexandraSupportSession();
        if(!start?.ok || !start.session?.sessionId)throw Error('Alexandra did not return a chat session.');
        current={session:start.session,messages:[],history:[]};
      }
      openRequested=true;
      save(current);
      syncOpen();
      post(panel,'SUPPORT_CHAT_OPEN',{mode:'ALEXANDRA',alexandraSession:state.session,messages:state.messages,history:state.history,loggedIn:memberId!=='guest',requestId});
    } catch(e) {post(panel,'SUPPORT_CHAT_ERROR',{message:safeFailure(e),requestId});post(launcher,'SUPPORT_LAUNCHER_ERROR',{message:safeFailure(e)})}
    finally{busy=false}
  };
  const runChatMessage = async msg => {
    const p=obj(msg.payload),requestId=clean(p.requestId||msg.requestId,100);
    try {
      if(!state?.session?.sessionId)throw Error('Open Alexandra to start a session.');
      const response=await sendAlexandraAiMessage({sessionId:state.session.sessionId,message:clean(p.message,1700),history:Array.isArray(p.history)?p.history.slice(-8):[]});
      post(panel,'SUPPORT_CHAT_ALEXANDRA_REPLY',{...obj(response),requestId});
    }catch(e){post(panel,'SUPPORT_CHAT_ERROR',{message:safeFailure(e),requestId})}
  };
  const runCreateCase = async msg => {
    const p=obj(msg.payload),requestId=clean(p.requestId||msg.requestId,100);
    try {
      const form=obj(p.input);
      const result=await createCustomerSupportCase({input:{...form,source:'alexandra',sourceChannel:'ALEXANDRA_WIX_AI',sourcePage:currentPath||'/about/support'}});
      post(panel,'SUPPORT_CHAT_CASE_CREATED',{...obj(result),requestId});
    }catch(e){post(panel,'SUPPORT_CHAT_ERROR',{message:safeFailure(e),requestId})}
  };
  launcher.onMessage(async ev => {
    const msg=obj(ev?.data); if(msg.source!==LAUNCH_SOURCE)return;
    if(msg.type==='SUPPORT_LAUNCHER_READY')syncOpen();
    if(msg.type==='SUPPORT_LAUNCHER_CLICK')await open(clean(msg.requestId,100));
  });
  panel.onMessage(async ev => {
    const msg=obj(ev?.data);if(msg.source!==CHAT_SOURCE)return;
    const payload=obj(msg.payload);
    switch(msg.type) {
      case 'SUPPORT_CHAT_READY':panelReady=true; if(openRequested && state?.session)post(panel,'SUPPORT_CHAT_OPEN',{mode:'ALEXANDRA',alexandraSession:state.session,messages:state.messages,history:state.history,loggedIn:memberId!=='guest'});return;
      case 'SUPPORT_CHAT_START_ALEXANDRA':await open(clean(msg.requestId,100));return;
      case 'SUPPORT_CHAT_PANEL_CLOSE':openRequested=false; if(state)save(state);syncOpen();return;
      case 'SUPPORT_CHAT_SNAPSHOT':if(state)save({...state,messages:payload.messages,history:payload.history});return;
      case 'SUPPORT_CHAT_ALEXANDRA_MESSAGE':await runChatMessage(msg);return;
      case 'SUPPORT_CHAT_SUBMIT_FORM':await runCreateCase(msg);return;
      case 'SUPPORT_CHAT_NAVIGATE':{const path=pathOf(payload.path);if(path&&typeof navigate==='function')navigate(path);return}
      default:return;
    }
  });
  identity().then(id=>{
    memberId=id;
    try {const prev=session.getItem(STORAGE_KEY+'_identity');if(prev&&prev!==id){state=null;openRequested=false;storageSave(null)}session.setItem(STORAGE_KEY+'_identity',id)}catch(_){}
    syncOpen();if(openRequested&&state?.session)open();
  });
  syncOpen();
  return {
    installed:true,
    onRouteChange(path=''){currentPath=clean(path,350);syncOpen()},
    open:()=>open(),
    close:()=>{openRequested=false; if(state)save(state);syncOpen()},
    clear:()=>{state=null;openRequested=false;storageSave(null);syncOpen()},
    isOpen:()=>openRequested
  };
}

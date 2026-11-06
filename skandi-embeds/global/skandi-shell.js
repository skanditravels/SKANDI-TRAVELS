/** SKANDI compiled public-shell runtime — no alternate backend, no local cart. */
const SKANDI_SHELL_SOURCE = 'SKANDI_SHELL';
const SKANDI_SHELL_PARENT = 'SKANDI_WIX_PARENT';
const shellRoot = document.getElementById('skandi-shell-root');
if (!shellRoot) throw new Error('SKANDI shell mount missing');
let toolWordmarks = {};
function appWordmark(system, label) {
  const logo = Object.hasOwn(toolWordmarks, system) ? toolWordmarks[system] : '';
  if (!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(logo || '')) return '';
  const mark = document.createElement('span');
  mark.className = 'skandi-app-wordmark';
  mark.setAttribute('aria-hidden','true');
  const systemLogo = document.createElement('img');
  systemLogo.src = logo;
  systemLogo.alt = '';
  const software = document.createElement('strong');
  software.className = 'skandi-app-software';
  if (label === 'GroupTalk') {
    const accent = document.createElement('span');
    accent.textContent = 'talk';
    software.append('group', accent);
  } else {
    software.textContent = label;
  }
  mark.append(systemLogo,software);
  return mark.outerHTML;
}
window.__SKANDI_SHELL__ = Object.freeze({
  mode:'compiled-single-embed',
  page:shellRoot.dataset.skandiPage || '',
  root:shellRoot,
  appWordmark
});
// A single iframe passes Home, Header, Footer and Mobile messages to the
// same Wix Velo HtmlComponent. Existing message source/type values remain.
// The Wix master controller supplies canonical route and session data.
window.addEventListener('message', event => {
  if (event.source !== window.parent) return;
  let message = event.data;
  if (typeof message === 'string') {
    try { message = JSON.parse(message); } catch (_) { return; }
  }
  if (!message || message.source !== SKANDI_SHELL_PARENT) return;
  if (message.type === 'SKANDI_MASTER_CONFIG') {
    shellRoot.dataset.skandiPath = String(message.payload?.currentPath || '/');
    const marks = message.payload?.brand?.assets?.toolWordmarks;
    if (marks && typeof marks === 'object') toolWordmarks = marks;
  }
  if (message.type === 'SKANDI_SCROLL_TOP' || message.type === 'MASTER_SCROLL_TOP') {
    document.getElementById('skandi-app-root')?.scrollTo({ top:0, behavior:'instant' });
  }
});
window.parent?.postMessage({
  source:SKANDI_SHELL_SOURCE,
  type:'SKANDI_SHELL_READY',
  payload:{page:shellRoot.dataset.skandiPage || ''},
  timestamp:new Date().toISOString()
}, '*');

// The universal receiver supplies this context only after canonical parent,
// manifest and digest validation. Legacy Home never opts into this handshake.
let shellAttempts = 0;
let shellConfigReceived = false;
let shellTimer;
function requestShellConfig() {
  if (++shellAttempts > 40 || shellConfigReceived) { clearInterval(shellTimer); return; }
  window.parent.postMessage({source:SKANDI_SHELL_SOURCE,type:'MASTER_CONFIG_REQUEST',payload:{context:'compiled-shell'}},'*');
}
window.addEventListener('message', event => {
  if (event.source !== window.parent) return;
  let message=event.data;
  if(typeof message==='string'){try{message=JSON.parse(message);}catch(_){return;}}
  if(message?.source===SKANDI_SHELL_PARENT && message.type==='SKANDI_MASTER_CONFIG') {
    shellConfigReceived=true;clearInterval(shellTimer);
  }
});
function startCompiledShell() {
  const context=window.__SKANDI_RECEIVER_CONTEXT__;
  if(context?.allowed===true && context.key===shellRoot.dataset.skandiKey) {
    window.parent.postMessage({source:SKANDI_SHELL_SOURCE,type:'SKANDI_COMPILED_READY',payload:{key:context.key}},'*');
  }
  shellTimer=setInterval(requestShellConfig,500);requestShellConfig();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startCompiledShell,{once:true});
else startCompiledShell();

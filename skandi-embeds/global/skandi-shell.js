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

// Renew staff sessions only in response to real interactions, never a timer.
if (shellRoot.dataset.skandiFamily === 'riaintra' || shellRoot.dataset.skandiFamily === 'altea') {
  let lastStaffActivity = 0;
  const reportStaffActivity = event => {
    if (!event.isTrusted || Date.now() - lastStaffActivity < 5000) return;
    const context = window.__SKANDI_RECEIVER_CONTEXT__;
    if (!context?.allowed || context.key !== shellRoot.dataset.skandiKey) return;
    lastStaffActivity = Date.now();
    window.parent.postMessage({source:SKANDI_SHELL_SOURCE,type:'SKANDI_STAFF_ACTIVITY',payload:{key:context.key}}, '*');
  };
  for (const type of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(type, reportStaffActivity, {passive:true});
  }
}

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

// Keep automatically populated photo cards distinct on the currently visible
// public page. Leave the card and its actions intact when no unique image exists.
if (shellRoot.dataset.skandiFamily === 'public') {
  (() => {
    const selectors = [
      '.mixed-card', '.dest-card .card-img', '.hotel-card .hotel-img',
      '.offer-card .offer-img', '.inspo-card', '.route-feature',
      '.route-stack-card', '.recent-card .recent-img', '.season-card',
      '.flight-card .flight-card-image', '.destination-card .destination-image',
      '.feature-card .feature-image', '.cruise-card .cruise-media > img',
      '.ta-dest-card > img', '.ta-exp-card .ta-exp-img > img', '.hs-card > img',
      '.product-card .product-media > img', '.category-orb-media',
      '.campaign-card', '.editorial-card', '.spotlight-card .spotlight-image',
      '.story-card .story-image', '.region-card > img', '.inspire-card > img',
      '.offer > img', '.collection-card-media > img',
      '#featuredDestinations .feature-card > img', '.saved-card > img',
      '.commerce-card .commerce-card-media',
      '.ti-entity-media:not(.ti-logo-media) > img', '.result-card .result-image'
    ].join(',');
    const duplicateClass = 'skandi-duplicate-card-image';
    const identity = raw => {
      if (!raw) return '';
      try {
        const u = new URL(raw, document.baseURI);
        if (u.protocol === 'data:') return raw;
        if (!['http:', 'https:'].includes(u.protocol)) return '';
        // Wix and Supabase can deliver the same asset at multiple image sizes.
        if (u.hostname === 'static.wixstatic.com') u.pathname = u.pathname.replace(/(\/media\/[^/]+)\/v1\/.*$/, '$1');
        const supabaseImage = u.pathname.includes('/storage/v1/render/image/public/') || u.pathname.includes('/storage/v1/object/public/');
        u.pathname = u.pathname.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/');
        if (supabaseImage || u.hostname === 'static.wixstatic.com' || u.hostname === 'images.unsplash.com') {
          for (const key of ['width','height','quality','format','resize','fit','auto','w','h','q']) u.searchParams.delete(key);
        }
        u.searchParams.sort();
        u.hash = '';
        return u.href;
      } catch (_) { return ''; }
    };
    const visible = el => {
      for (let node = el; node && node !== shellRoot; node = node.parentElement) {
        if (node.hidden || getComputedStyle(node).display === 'none' || getComputedStyle(node).visibility === 'hidden' && !node.classList.contains(duplicateClass)) return false;
      }
      return true;
    };
    const source = el => {
      if (el.tagName === 'IMG') return el.currentSrc || el.getAttribute('src') || '';
      const value = el.style.backgroundImage || '';
      const match = value.match(/url\(\s*["']?([^"')]+)["']?\s*\)/i);
      return match ? match[1] : '';
    };
    let scheduled = false;
    const observer = new MutationObserver(schedule);
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      (window.requestAnimationFrame || (callback => window.setTimeout(callback, 0)))(reconcile);
    }
    function reconcile() {
      scheduled = false;
      observer.disconnect();
      const used = new Set();
      shellRoot.querySelectorAll(selectors).forEach(el => {
        const key = identity(source(el));
        const show = visible(el);
        const duplicate = !!key && show && used.has(key);
        if (key && show && !duplicate) used.add(key);
        el.classList.toggle(duplicateClass, duplicate);
      });
      observer.observe(shellRoot, {subtree:true, childList:true, attributes:true, attributeFilter:['src','srcset','style','class','hidden']});
    }
    shellRoot.addEventListener('load', schedule, true);
    window.addEventListener('resize', schedule, {passive:true});
    schedule();
  })();
}

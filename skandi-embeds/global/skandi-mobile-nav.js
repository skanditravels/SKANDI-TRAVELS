const SOURCE = 'SKANDI_HOME_MOBILE_APP';
const PARENT = 'SKANDI_WIX_PARENT';
const BUTTONS = Array.from(document.querySelectorAll('#skandi-mobile-nav-root [data-route]'));
const routeFallbacks = Object.freeze({
  home:'/', destinations:'/destinations', bookingFlow:'/booking',
  myTrips:'/my-profile?tab=trips', myProfile:'/my-profile'
});
let routes = {...routeFallbacks};
let currentPath = '/';
const safePath = value => {
  const path = String(value || '').trim();
  return /^\/(?!\/)/.test(path) && !/[\\\u0000-\u0020]/.test(path) && !/%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(path) ? path : '';
};
function post(type, payload = {}) {
  window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},'*');
}
function updateActive() {
  const normalized = currentPath.split('?')[0];
  let active = 'home';
  if (normalized.startsWith('/destinations')) active = 'destinations';
  else if (normalized === '/booking') active = 'bookingFlow';
  else if (normalized.startsWith('/my-profile')) active = currentPath.includes('tab=trips') ? 'myTrips' : 'myProfile';
  else if (normalized !== '/') active = '';
  for (const button of BUTTONS) {
    if (button.dataset.route === active) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  }
}
for (const button of BUTTONS) button.addEventListener('click', () => {
  const path = safePath(routes[button.dataset.route] || routeFallbacks[button.dataset.route]);
  if (path) post('MASTER_NAVIGATE', {path});
});
window.addEventListener('message', event => {
  if (event.source !== window.parent) return;
  let message = event.data;
  if (typeof message === 'string') { try { message = JSON.parse(message); } catch (_) { return; } }
  if (!message || message.source !== PARENT) return;
  if (message.type === 'SKANDI_MASTER_CONFIG') {
    const payload = message.payload || {};
    for (const name of Object.keys(routeFallbacks)) {
      const candidate = safePath(payload.routes?.[name]);
      if (candidate) routes[name] = candidate;
    }
    currentPath = safePath(payload.currentPath) || currentPath;
    updateActive();
  }
});
post('MASTER_CONFIG_REQUEST',{context:'mobile-navigation'});
updateActive();

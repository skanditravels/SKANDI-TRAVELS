import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as routes from '../src/public/siteMap.js';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {parse}=require('acorn');
async function makeController(formFactor) {
  let code=await fs.readFile(new URL('../src/pages/MyRoster.l8p5m.js',import.meta.url),'utf8');
  for(const n of parse(code,{ecmaVersion:'latest',sourceType:'module'}).body.filter(n=>n.type==='ImportDeclaration').reverse())code=code.slice(0,n.start)+code.slice(n.end);
  let ready,handler;const posts=[],navigations=[];
  const embed={onMessage:fn=>handler=fn,postMessage:msg=>posts.push(msg)};
  const selector=Object.assign(id=>id==='#myRosterEmbed'?embed:null,{onReady:fn=>ready=fn});
  const ctx={console,$w:selector,wixLocation:{path:['riaintra','success-factors','altea','my-roster'],to:path=>navigations.push(path)},wixWindowFrontend:{formFactor},authentication:{logout:async()=>{}},APP_ROUTES:routes.APP_ROUTES,SITE_MAP:routes.SITE_MAP,getStaffPortalSession:async()=>({authorized:true,ok:true,apps:[]}),getMyRosterBootstrap:async()=>({ok:true,profile:{},apps:[]}),createTimeClockEvent:async()=>({ok:true}),requestTimeOff:async()=>({ok:true}),requestShiftChange:async()=>({ok:true}),searchOperationalFlights:async()=>({ok:true,flights:[]})};
  vm.createContext(ctx);vm.runInContext(code,ctx);ready();return {posts,navigations,handler:()=>handler};
}
test('desktop MyRoster connects its HTML to the authenticated staff bootstrap',async()=>{
 const h=await makeController('Desktop');assert.equal(typeof h.handler(),'function');
 await h.handler()({data:{source:'SKANDI_MYROSTER_EMBED',type:'MYROSTER_READY',payload:{}}});
 assert.ok(h.posts.some(p=>p.type==='MYROSTER_BOOTSTRAP'));assert.equal(h.navigations.length,0);
});
test('MyRoster mobile and tablet do not attach the desktop bridge',async()=>{
 const mobile=await makeController('Mobile');assert.equal(mobile.handler(),undefined);assert.deepEqual(mobile.navigations,[routes.SITE_MAP.eos]);
 const tablet=await makeController('Tablet');assert.equal(tablet.handler(),undefined);assert.deepEqual(tablet.navigations,[routes.SITE_MAP.alteaLaunchpad]);
});

test('desktop MyRoster echoes background refresh IDs from the staff bridge', async () => {
  const h = await makeController('Desktop');
  const requestId = 'MYROSTER-BACKGROUND-test';
  await h.handler()({ data: {
    source: 'SKANDI_MYROSTER_EMBED',
    type: 'MYROSTER_REFRESH_REQUEST',
    payload: { requestId }
  } });
  const response = h.posts.find(post => post.type === 'MYROSTER_BOOTSTRAP');
  assert.equal(response.payload.requestId, requestId);
  assert.equal(response.payload.supportsBackgroundRefresh, true);
});

test('MyRoster refreshes the applied date range and discards a superseded reply', async () => {
  const { JSDOM } = require('jsdom');
  const base = new URL('../altea-embeds/my-roster/', import.meta.url);
  const [html, script] = await Promise.all([
    fs.readFile(new URL('skandi-my-roster.html', base), 'utf8'),
    fs.readFile(new URL('skandi-my-roster.js', base), 'utf8')
  ]);
  const { window } = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
  const posts = [];
  let refresh;
  window.matchMedia = () => ({ matches: true });
  window.postMessage = message => posts.push(message);
  window.setInterval = (callback, interval) => {
    assert.equal(interval, 60000);
    refresh = callback;
    return 1;
  };
  const send = (type, payload) => window.dispatchEvent(new window.MessageEvent('message', {
    source: window,
    data: { source: 'SKANDI_WIX_PARENT', type, payload }
  }));
  const dateRange = { from: '2026-11-06', to: '2026-11-13' };
  const bootstrap = { ok: true, supportsBackgroundRefresh: true, dateRange, profile: {} };
  try {
    window.eval(script);
    send('MYROSTER_BOOTSTRAP', bootstrap);
    const dialog = window.document.querySelector('dialog');
    dialog.setAttribute('open', '');
    refresh();
    assert.equal(posts.at(-1).type, 'MYROSTER_READY');

    dialog.removeAttribute('open');
    window.document.querySelector('#dateFrom').value = '2026-11-20';
    refresh();
    const { type, payload } = posts.at(-1);
    assert.equal(type, 'MYROSTER_REFRESH_REQUEST');
    assert.equal(payload.from, dateRange.from);
    assert.equal(payload.to, dateRange.to);

    window.document.querySelector('#refreshBtn').click();
    assert.equal(posts.at(-1).payload.from, '2026-11-20');
    send('MYROSTER_BOOTSTRAP', { ...bootstrap, requestId: payload.requestId, ok: false });
    assert.equal(window.document.querySelector('#accessError').hidden, true);
  } finally {
    window.close();
  }
});

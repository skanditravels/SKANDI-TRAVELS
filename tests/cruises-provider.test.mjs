import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as registry from '../src/public/siteMap.js';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const {parse} = require('acorn');

async function makeActor(response) {
  const source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/cruises.js', import.meta.url), 'utf8');
  const node = parse(source, {ecmaVersion: 'latest', sourceType: 'module'}).body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'runRoyalCaribbeanActor');
  const context = {
    readSecret: async () => 'test-token', APIFY_TOKEN_SECRET: 'secret', APIFY_SYNC_URL: 'https://example.invalid',
    PROVIDER_SYNC_TIMEOUT_SECONDS: 1, PROVIDER_MEMORY_MB: 128, PROVIDER_MAX_ROWS: 20, PROVIDER_BUILD: 'test',
    fetch: async () => response, providerActorInput: () => ({}), clean: value => String(value || ''),
    publicError: (code, message) => Object.assign(new Error(message), {code}),
  };
  vm.createContext(context);
  return vm.runInContext(`(${source.slice(node.start, node.end)})`, context);
}

test('cruise provider reads the response and never treats malformed success as an empty result', async () => {
  const actor = await makeActor({ok: true, json: async () => [{id: 'sailing'}]});
  assert.equal((await actor('caribbean'))[0].id, 'sailing');
  for (const response of [
    {ok: true, json: async () => {throw new Error('invalid JSON');}},
    {ok: true, json: async () => ({unexpected: true})},
  ]) {
    const invalidActor = await makeActor(response);
    await assert.rejects(invalidActor('caribbean'), {code: 'CRUISES_PROVIDER_INVALID_RESPONSE'});
  }
  const deniedActor = await makeActor({ok: false, status: 401, json: async () => {throw new Error('invalid JSON');}});
  await assert.rejects(deniedActor('caribbean'), {code: 'CRUISES_PROVIDER_AUTH'});
});

test('public cruise bootstrap reads the catalogue without launching a provider run', async () => {
  const source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/cruises.js', import.meta.url), 'utf8');
  const node = parse(source, {ecmaVersion: 'latest', sourceType: 'module'}).body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'buildBootstrap');
  let calls = 0;
  const ctx = {upper:(v)=>String(v||'').toUpperCase(), requestedRegion:()=> 'US', REGION_CURRENCY:{US:'USD'},
    readCatalogue:async()=>{calls++;return []}, nowIso:()=> '2026-11-06T00:00:00Z', obj:v=>v||{},
    filtersFromCruises:()=>({}),countsFromCruises:()=>({}),PROVIDER:'ROYAL_CARIBBEAN',
    seedIfEmpty:()=>{throw new Error('Public request started a provider run')}};
  vm.createContext(ctx);
  const build = vm.runInContext(`(${source.slice(node.start,node.end)})`,ctx);
  const result=await build({});
  assert.equal(calls,1);assert.equal(result.cruises.length,0);
});

test('cruise bridge uses only its registered component and reports a catalogue failure', async () => {
  let source = await fs.readFile(new URL('../src/pages/masterPage.js',import.meta.url),'utf8');
  for (const n of parse(source,{ecmaVersion:'latest',sourceType:'module'}).body.filter(n=>n.type==='ImportDeclaration').reverse()) source=source.slice(0,n.start)+source.slice(n.end);
  let calls=0;const posts=[];
  const context={...registry,console,setTimeout,clearTimeout,setInterval,clearInterval,URL,URLSearchParams,
    wixWindowFrontend:{viewMode:'Site',formFactor:'Desktop'},wixLocationFrontend:{baseUrl:'https://www.skanditravels.com',path:[]},wixSiteFrontend:{currentPage:{url:'/cruises',name:'Cruises'}},
    local:{getItem:()=>null},session:{getItem:()=>null},consentPolicy:{getCurrentConsentPolicy:()=>({policy:{}})},$w:Object.assign(()=>[],{onReady:()=>{}}),
    getCruisesBootstrap:async()=>{calls++;return {ok:false,error:{message:'private upstream details'}}},refreshCruises:async()=>({ok:true,data:{cruises:[]}})};
  vm.createContext(context);vm.runInContext(source,context);
  const embed={id:'cruisesEmbed',onMessage(){},postMessage:m=>posts.push(m)};
  await context.handleMasterMessage({id:'other',postMessage(){}},{source:'SKANDI_CRUISES',type:'CRUISES_READY'});
  assert.equal(calls,0);
  await context.handleMasterMessage(embed,{source:'SKANDI_CRUISES',type:'CRUISES_READY'});
  assert.equal(calls,1);assert.equal(posts.at(-1).type,'CRUISES_ERROR');
  assert.doesNotMatch(posts.at(-1).payload.message,/private upstream/);
  await context.handleMasterMessage(embed,{source:'SKANDI_CRUISES',type:'CRUISES_REFRESH'});
  assert.equal(posts.at(-1).type,'CRUISES_BOOTSTRAP');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createSign,createVerify,generateKeyPairSync} from 'node:crypto';

const raw=await fs.readFile(new URL('../src/backend/SKANDI_CORE/mediaControlIntegrations.js',import.meta.url),'utf8');
const source=raw.replace(/^import .*;\n/gm,'').replace(/export /g,'');
const names=['listCanvaTemplatesCore','mediaCopyCore','destinationResearchCore','searchConsoleReportCore','testMediaConnectorCore'];
const factory=vm.runInNewContext(`(function(fetch,secrets,elevate,generateText,openai,createSign,ensureEditorialContext,searchMediaSourcesCore){${source};return {${names.join(',')}};})`,{Buffer,URL,URLSearchParams,Date});
const ok=data=>({ok:true,status:200,json:async()=>data});
function make(options={}){
 const sent=[];let authorized=true;
 const vault=options.vault||{};
 const api=factory(async(url,request={})=>{sent.push({url,request});return options.fetch?options.fetch(url,request):ok({});},{getSecretValue:async name=>{if(Object.hasOwn(vault,name))return {value:vault[name]};throw new Error('Secret not found');}},fn=>fn,options.generate|| (async()=>({text:'Suggested copy'})),x=>x,createSign,async()=>{if(!authorized)throw new Error('VOY_EDITOR_ACCESS_DENIED')},options.search|| (async()=>({items:[]})));
 return {api,sent,deny(){authorized=false}};
}

test('every integration enforces the existing staff editorial authorization',async()=>{
 const {api,deny,sent}=make();deny();
 for(const [name,input] of [['listCanvaTemplatesCore',{}],['mediaCopyCore',{text:'Text'}],['destinationResearchCore',{destination:'Stockholm'}],['searchConsoleReportCore',{}],['testMediaConnectorCore',{provider:'wikimedia'}]])await assert.rejects(api[name](input),/ACCESS_DENIED/);
 assert.equal(sent.length,0);
});

test('image service tests call the real discovery path and surface provider failures',async()=>{
 const calls=[];const {api}=make({search:async input=>{calls.push(input);if(input.provider==='openverse')throw new Error('MEDIA_SOURCE_HTTP_403');return {items:[{}]}}});
 assert.equal((await api.testMediaConnectorCore({provider:'wikimedia'})).count,1);
 assert.equal(calls[0].provider,'wikimedia');assert.equal(calls[0].query,'Stockholm');
 await assert.rejects(api.testMediaConnectorCore({provider:'openverse'}),/403/);
 await assert.rejects(api.testMediaConnectorCore({provider:'unlisted'}),/not available/);
});

test('Canva uses server-side service credentials and only returns trusted template links',async()=>{
 const vault={SKANDI_CANVA_SERVICE_CLIENT_ID:'client-id',SKANDI_CANVA_SERVICE_CLIENT_SECRET:'private-secret'};
 const {api,sent}=make({vault,fetch:async url=>url.includes('/oauth/token')?ok({access_token:'temporary-token'}):ok({items:[{id:'abc',title:'Campaign',create_url:'https://www.canva.com/design/abc/remix',view_url:'https://evil.example/steal'}]})});
 const result=await api.listCanvaTemplatesCore({});assert.equal(result.templates[0].title,'Campaign');assert.equal(result.templates[0].viewUrl,'');assert.match(result.templates[0].createUrl,/canva\.com/);
 assert.match(sent[0].request.headers.Authorization,/^Basic /);assert.equal(sent[1].request.headers.Authorization,'Bearer temporary-token');
 assert.doesNotMatch(JSON.stringify(result),/private-secret|temporary-token/);
 await assert.rejects(make().api.listCanvaTemplatesCore(),/not connected/);
});

test('editorial AI sends only requested copy and returns a reviewable suggestion',async()=>{
 let prompt;const {api}=make({generate:async args=>{prompt=args;return {text:'Revised text'}}});
 const result=await api.mediaCopyCore({title:'A heading',text:'Original copy',language:'sv'});
 assert.equal(result.suggestion,'Revised text');assert.equal(result.reviewRequired,true);assert.match(prompt.messages[0].content,/Original copy/);assert.match(prompt.messages[0].content,/Swedish/);
 await assert.rejects(api.mediaCopyCore({text:'',language:'en'}),/Add some copy/);
 await assert.rejects(api.mediaCopyCore({text:'Example',language:'xx'}),/supported language/);
});

test('research only returns verified Wikipedia links and validates language',async()=>{
 const {api,sent}=make({fetch:async()=>ok({query:{pages:[{title:'Stockholm',extract:'A city.',fullurl:'https://en.wikipedia.org/wiki/Stockholm'},{title:'Bad',extract:'Bad',fullurl:'https://evil.example/'}]}})});
 const result=await api.destinationResearchCore({destination:'Stockholm',language:'en'});assert.equal(result.sources.length,1);assert.equal(result.sources[0].title,'Stockholm');assert(result.reviewRequired);assert.match(sent[0].url,/^https:\/\/en\.wikipedia\.org\/w\/api\.php/);
 await assert.rejects(api.destinationResearchCore({destination:'Stockholm',language:'../../example'}),/supported language/);
});

test('Search Console signs a short-lived readonly service assertion and limits the site property',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
 const vault={SKANDI_SEARCH_CONSOLE_PROPERTY:'sc-domain:skanditravels.com',SKANDI_SEARCH_CONSOLE_SERVICE_ACCOUNT:JSON.stringify({type:'service_account',client_email:'editor@example.iam.gserviceaccount.com',private_key:privateKey})};
 const {api,sent}=make({vault,fetch:async url=>url.includes('oauth2.googleapis.com')?ok({access_token:'google-temporary-token'}):ok({rows:[{keys:['https://www.skanditravels.com/'],clicks:3,impressions:24,ctr:.125,position:4}]})});
 const result=await api.searchConsoleReportCore({days:28});assert.equal(result.rows[0].clicks,3);
 const form=new URLSearchParams(sent[0].request.body),jwt=form.get('assertion'),parts=jwt.split('.');assert.equal(parts.length,3);
 const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());assert.equal(payload.scope,'https://www.googleapis.com/auth/webmasters.readonly');assert(payload.exp-payload.iat<=3600);
 const verify=createVerify('RSA-SHA256');verify.update(parts[0]+'.'+parts[1]);assert(verify.verify(publicKey,Buffer.from(parts[2],'base64url')));
 assert.match(sent[1].url,/sc-domain%3Askanditravels\.com/);assert.equal(sent[1].request.headers.Authorization,'Bearer google-temporary-token');assert.doesNotMatch(JSON.stringify(result),/google-temporary-token|PRIVATE KEY/);
 await assert.rejects(make({vault:{...vault,SKANDI_SEARCH_CONSOLE_PROPERTY:'sc-domain:other.example'}}).api.searchConsoleReportCore({}),/verified SKANDI/);
});

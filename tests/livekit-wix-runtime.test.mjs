import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { parse } = require('acorn');
const key = 'test-key';
const secret = 'only-a-test-secret';
function claims(token) {
  const [header, payload, signature] = token.split('.');
  assert.equal(JSON.parse(Buffer.from(header, 'base64url')).alg, 'HS256');
  assert.equal(createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url'), signature);
  return JSON.parse(Buffer.from(payload, 'base64url'));
}
async function service(fetch) {
  let code = await fs.readFile(new URL('../src/backend/SKANDI_CORE/livekitServer.js', import.meta.url), 'utf8');
  for (const node of parse(code, { ecmaVersion:'latest', sourceType:'module' }).body.filter(x => x.type === 'ImportDeclaration').reverse()) code = code.slice(0,node.start) + code.slice(node.end);
  code = code.replace(/export (async )?function (\w+)/g, (_, a, n) => `globalThis.${n} = ${a || ''}function ${n}`);
  const values = { LIVEKIT_API_KEY:key, LIVEKIT_API_SECRET:secret, LIVEKIT_URL:'wss://example.livekit.cloud' };
  const ctx = { Buffer, createHash, createHmac, randomUUID, fetch, secrets:{getSecretValue:async name=>({value:values[name]})}, elevate:fn=>fn };
  vm.createContext(ctx); vm.runInContext(code,ctx); return ctx;
}
test('support room JWT is signed and preserves room-scoped listen-only grants', async()=>{
  const api = await service(()=>{throw new Error('unexpected request')});
  const session = await api.issueLiveKitRoomTokenCore({roomName:'support-test', identity:'visitor', canPublish:false, canSubscribe:true});
  const decoded = claims(session.token);
  assert.equal(decoded.iss,key); assert.equal(decoded.sub,'visitor'); assert.equal(decoded.exp-decoded.iat,900);
  assert.equal(decoded.video.room,'support-test'); assert.equal(decoded.video.roomJoin,true);
  assert.equal(decoded.video.canPublish,false); assert.equal(decoded.video.canPublishData,false); assert.equal(decoded.video.canSubscribe,true);
});
test('Alexandra dispatch uses a short-lived room-scoped admin token and returns a distinct join token', async()=>{
  let call;
  const api = await service(async (url,options)=>{call={url,options};return {ok:true,json:async()=>({id:'dispatch-123'})}});
  const session = await api.issueAlexandraLiveKitSessionCore({locale:'en-US'});
  assert.equal(call.url,'https://example.livekit.cloud/twirp/livekit.AgentDispatchService/CreateDispatch');
  assert.equal(call.options.method,'POST');
  const request = JSON.parse(call.options.body), admin = claims(call.options.headers.Authorization.slice(7)), join = claims(session.token);
  assert.equal(request.agent_name,'alexandra-prod'); assert.equal(request.room,session.roomName);
  assert.equal(admin.video.room,request.room); assert.equal(admin.video.roomAdmin,true); assert.equal(admin.exp-admin.iat,60);
  assert.equal(join.video.room,request.room); assert.equal(join.video.roomJoin,true); assert.equal(join.video.roomAdmin,undefined);
  assert.equal(session.dispatchId,'dispatch-123'); assert.notEqual(session.token,call.options.headers.Authorization.slice(7));
});
test('failed or unconfirmed dispatch cannot produce a successful chat session', async()=>{
  const failing = await service(async()=>({ok:false,status:403}));
  await assert.rejects(failing.issueAlexandraLiveKitSessionCore(),/ALEXANDRA_DISPATCH_HTTP_403/);
  const empty = await service(async()=>({ok:true,json:async()=>({})}));
  await assert.rejects(empty.issueAlexandraLiveKitSessionCore(),/ALEXANDRA_DISPATCH_UNCONFIRMED/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../src/pages/RIAINTRA.rc14z.js',import.meta.url),'utf8');
const runnable=source.replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm,'');
async function ready({active,authorized}) {
  const posts=[],navigations=[];let handler,logout=0,cleared=0;
  const session={active:()=>active,clear(){cleared++},start(){},touch:()=>true};
  const context={console,setTimeout,Date,Math,navigator:{userAgent:''},
    $w:Object.assign(()=>({onMessage(cb){handler=cb},postMessage(msg){posts.push(msg)}}),{onReady(cb){cb()}}),
    wixLocationFrontend:{to:path=>navigations.push(path)},authentication:{logout:async()=>{logout++}},local:{},
    createStaffActivitySession:()=>session,getStaffPortalSession:async()=>({loggedIn:authorized,authorized}),
    authenticateStaffWithDeviceTrust:async()=>{},verifyStaffOtpAndTrustDevice:async()=>{}};
  vm.runInNewContext(runnable,context);await handler({data:{source:'SKANDI_STAFF_LOGIN',type:'STAFF_LOGIN_READY',requestId:'r1'}});
  return {posts,navigations,logout,cleared};
}
test('visiting the login page does not redirect an authorized active session',async()=>{
 const r=await ready({active:true,authorized:true});assert.deepEqual(r.navigations,[]);assert.equal(r.logout,0);assert.equal(r.posts.at(-1).type,'STAFF_LOGIN_NOTICE');
});
test('an unverified session is cleared before the login form is offered',async()=>{
 const r=await ready({active:true,authorized:false});assert.deepEqual(r.navigations,[]);assert.equal(r.logout,1);assert.equal(r.cleared,1);assert.equal(r.posts.at(-1).type,'STAFF_LOGIN_NOTICE');
});

test('the Wix controller carries one strong device token through code verification and login',async()=>{
 const posts=[],navigations=[],stored=new Map([['skandi_device_token_v1','legacy-weak-token']]);
 const token=`v2_${'ab'.repeat(32)}`;let handler,issued=0,applied='',started=0,submitted='';
 const session={active:()=>false,clear(){},start(){started++},touch:()=>true};
 const context={console,setTimeout,Date,Math,navigator:{userAgent:'test browser'},
  $w:Object.assign(()=>({onMessage(cb){handler=cb},postMessage(msg){posts.push(msg)}}),{onReady(cb){cb()}}),
  wixLocationFrontend:{to:path=>navigations.push(path)},
  authentication:{logout:async()=>{},applySessionToken:async value=>{applied=value}},
  local:{getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)},
  createStaffActivitySession:()=>session,
  getStaffPortalSession:async()=>({loggedIn:true,authorized:true}),
  issueStaffDeviceToken:async()=>{issued++;return {ok:true,deviceToken:token}},
  authenticateStaffWithDeviceTrust:async input=>{submitted=input.deviceToken;return {ok:true,mfaRequired:true,maskedEmail:'st***@example.test'}},
  verifyStaffOtpAndTrustDevice:async input=>{assert.equal(input.deviceToken,token);assert.equal(input.code,'123456');return {ok:true,sessionToken:'verified-token'}}};
 vm.runInNewContext(runnable,context);
 await handler({data:{source:'SKANDI_STAFF_LOGIN',type:'STAFF_LOGIN_REQUEST',requestId:'login-1',payload:{skId:'AB1234',password:'test-pass'}}});
 assert.equal(submitted,token);assert.equal(issued,1);assert.equal(posts.at(-1).type,'STAFF_OTP_REQUIRED');
 await handler({data:{source:'SKANDI_STAFF_LOGIN',type:'STAFF_OTP_VERIFY',requestId:'otp-2',payload:{skId:'AB1234',code:'123456'}}});
 assert.equal(issued,1);assert.equal(stored.get('skandi_device_token_v1'),token);assert.equal(applied,'verified-token');assert.equal(started,1);
 assert.deepEqual(navigations,['/riaintra/success-factors']);assert.equal(posts.at(-1).type,'STAFF_LOGIN_OK');
});

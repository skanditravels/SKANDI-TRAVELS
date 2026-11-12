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

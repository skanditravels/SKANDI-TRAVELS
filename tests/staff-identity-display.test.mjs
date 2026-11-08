import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {parse}=require('acorn');
test('generic staff tables never render Wix member or contact identifiers',async()=>{
  const src=await fs.readFile(new URL('../riaintra-embeds/success-factors/success-factors.js',import.meta.url),'utf8');
  const ast=parse(src,{ecmaVersion:'latest',sourceType:'script'});let node;
  function visit(x){if(!x||typeof x!=='object')return;if(x.type==='FunctionDeclaration'&&x.id?.name==='genericColumns')node=x;for(const v of Object.values(x))if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v)}
  visit(ast);assert.ok(node);const fn=new Function('return ('+src.slice(node.start,node.end)+')')();
  const cols=fn([{skId:'SK1234',wix_member_id:'private-wix-id',wixMemberId:'private',memberId:'private',contact_id:'private',status:'hired'}]).map(x=>x[0]);
  assert.ok(cols.includes('Sk Id'));assert.ok(!cols.some(x=>/wix|member id|contact id/i.test(x)));
});

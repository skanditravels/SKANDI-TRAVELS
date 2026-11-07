import test from 'node:test';
import assert from 'node:assert/strict';
import { checkVoyBrandCopy } from '../src/public/brandGuard.js';

test('brand guard reports configured blocked and missing phrases in real copy', () => {
  const result=checkVoyBrandCopy({brandKit:{blockedWords:'guaranteed, cheap',requiredWords:'SKANDI Travels, curated'},issue:{title:'A curated getaway'},pages:[{title:'Stockholm',body:'A GUARANTEED view'}],articles:[{title:'SKANDI Travels',body:'Discover more'}]});
  assert.equal(result.checkedFields,5);
  assert.deepEqual(result.findings,[{type:'blocked',phrase:'guaranteed',location:'Page: Stockholm · body'}]);
  assert.match(result.scope,/does not verify facts/);
});
test('brand guard does not report a successful check when no copy is present', () => {
  const result=checkVoyBrandCopy({brandKit:{requiredWords:'travel',blockedWords:'cheap'}});
  assert.equal(result.checkedFields,0);
  assert.equal(result.findings.length,0);
  assert.match(result.summary,/No issue copy/);
});

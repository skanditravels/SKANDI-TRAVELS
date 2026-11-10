import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const raw = await fs.readFile(new URL('../src/backend/SKANDI_CORE/mediaControl.web.js', import.meta.url), 'utf8');
const code = raw.replace(/import\s+(?:\{[^}]*\}|[^;]+?)\s+from\s+["'][^"']+["'];\s*/gs, '').replace('export const handleMediaControlAssetAction', 'const handleMediaControlAssetAction');
const handlers = [
  'getWebsiteDesignCore','saveWebsiteDesignCore','getWebsitePreviewCore','searchMediaSourcesCore','importMediaSourceCore','importWebsiteImageCore','getWebsiteFontCore',
  'getHomeCardManagerCore','saveHomeCardManagerCore','testMediaConnectorCore','listCanvaTemplatesCore','mediaCopyCore','destinationResearchCore','searchConsoleReportCore',
  'listAssetsCore','checkAssetDuplicateCore','prepareAssetUploadCore','finalizeAssetUploadCore','getAssetAccessUrlCore','registerAssetUsageCore','archiveAssetCore'
];
function dispatcher(overrides = {}) {
  const context = { Permissions:{SiteMember:'member'}, webMethod:(_permission, fn)=>fn };
  for (const name of handlers) context[name] = overrides[name] || (async()=>({ok:true}));
  return vm.runInNewContext(`${code}\nhandleMediaControlAssetAction`, context);
}

test('integration failures cross Wix as fixed safe messages without leaking raw errors', async()=>{
  const known = Object.assign(new Error('secret provider detail'), {code:'CANVA_NOT_CONFIGURED'});
  const dispatch = dispatcher({listCanvaTemplatesCore:async()=>{throw known}});
  const result = await dispatch({action:'LIST_CANVA_TEMPLATES'});
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'CANVA_NOT_CONFIGURED');
  assert.match(result.error.message, /not connected/i);
  assert.doesNotMatch(JSON.stringify(result), /secret provider detail/);
  const unknown = dispatcher({testMediaConnectorCore:async()=>{throw new Error('private provider detail')}});
  const failed = await unknown({action:'TEST_MEDIA_CONNECTOR'});
  assert.equal(failed.error.code, 'MEDIA_CONTROL_INTEGRATION_FAILED');
  assert.doesNotMatch(JSON.stringify(failed), /private provider detail/);
});

test('integration success and existing non-integration exception behavior are preserved', async()=>{
  const dispatch = dispatcher({testMediaConnectorCore:async()=>({ok:true,count:4}),getWebsiteDesignCore:async()=>{throw new Error('existing error')}});
  assert.equal((await dispatch({action:'TEST_MEDIA_CONNECTOR'})).count, 4);
  await assert.rejects(dispatch({action:'GET_WEBSITE_DESIGN'}), /existing error/);
});

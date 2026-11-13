// RIAINTRA Automation Control. The global receiver is installed in #sfAutomationEmbed.
// All privileged operations are authorized again in the canonical backend.
import {
  getAutomationAdminSnapshot, getAutomationEmailPlatformSnapshot,
  inspectAutomationEmailAction, previewAutomationEmailAction,
  syncAutomationEmailAction, generateAutomationEmailActionMapping
} from 'backend/SKANDI_CORE/automationControl.web';
import {
  getAutomationWorkspace, getAutomationGraph, createAutomationDraft,
  createAutomationGraphDraft, syncAutomationDesignedEmail, setAutomationStatus,
  openAutomationDraft, createBlankAutomationDraft, saveAutomationDraft,
  validateAutomationDraft, publishAutomationDraft, deleteAutomationDraft,
  deleteAutomation, sendAutomationTestEmail, saveAutomationTemplate, deleteAutomationTemplate,
  setAutomationArchived
} from 'backend/SKANDI_CORE/automationsWorkspace.web';

const EMBED_ID = '#sfAutomationEmbed';
const CHILD = 'SKANDI_SF_AUTOMATIONS_EMBED';
const PARENT = 'SKANDI_WIX_PARENT';
const dict = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const str = (value, max = 500) => String(value ?? '').trim().slice(0, max);
let component;
let sequence = 0;

function send(type, payload = {}, requestId = '') {
  component?.postMessage({source:PARENT,type,payload,requestId,timestamp:new Date().toISOString()});
}
function presentError(error) {
  return {code:str(error?.code || 'AUTOMATION_ERROR',120),message:str(error?.publicMessage || 'The requested operation could not be completed.',600)};
}
async function bootstrap(requestId) {
  const [platform,live,workspace] = await Promise.all([
    getAutomationEmailPlatformSnapshot(),getAutomationAdminSnapshot(),getAutomationWorkspace()
  ]);
  if (!platform?.ok || !live?.ok || !workspace?.ok) throw new Error('The system did not return a complete response.');
  send('AUTOMATION_CONSOLE_BOOTSTRAP',{platform,live,workspace},requestId);
}
const methods = {
  AUTOMATION_CONSOLE_INSPECT: inspectAutomationEmailAction,
  AUTOMATION_CONSOLE_PREVIEW: previewAutomationEmailAction,
  AUTOMATION_CONSOLE_MAPPING: generateAutomationEmailActionMapping,
  AUTOMATION_CONSOLE_GRAPH: getAutomationGraph,
  AUTOMATION_CONSOLE_CREATE_DRAFT: createAutomationDraft,
  AUTOMATION_CONSOLE_CREATE_GRAPH: createAutomationGraphDraft,
  AUTOMATION_CONSOLE_SYNC_DESIGNED: syncAutomationDesignedEmail,
  AUTOMATION_CONSOLE_SET_STATUS: setAutomationStatus,
  AUTOMATION_CONSOLE_OPEN_DRAFT: openAutomationDraft,
  AUTOMATION_CONSOLE_CREATE_BLANK_DRAFT: createBlankAutomationDraft,
  AUTOMATION_CONSOLE_SAVE_DRAFT: saveAutomationDraft,
  AUTOMATION_CONSOLE_VALIDATE_DRAFT: validateAutomationDraft,
  AUTOMATION_CONSOLE_PUBLISH_DRAFT: publishAutomationDraft,
  AUTOMATION_CONSOLE_DELETE_DRAFT: deleteAutomationDraft,
  AUTOMATION_CONSOLE_DELETE: deleteAutomation,
  AUTOMATION_CONSOLE_SET_ARCHIVED: setAutomationArchived,
  AUTOMATION_CONSOLE_SEND_TEST_EMAIL: sendAutomationTestEmail,
  AUTOMATION_CONSOLE_SAVE_TEMPLATE: saveAutomationTemplate,
  AUTOMATION_CONSOLE_DELETE_TEMPLATE: deleteAutomationTemplate
};
async function dispatch(type, payload, requestId) {
  const data = dict(payload);
  if(type==='AUTOMATION_CONSOLE_READY'||type==='AUTOMATION_CONSOLE_REFRESH') return bootstrap(requestId);
  if(type==='AUTOMATION_CONSOLE_DRY_RUN'||type==='AUTOMATION_CONSOLE_SYNC') {
    const result=await syncAutomationEmailAction({...data,dryRun:type==='AUTOMATION_CONSOLE_DRY_RUN'});
    return send('AUTOMATION_CONSOLE_RESULT',{operation:type==='AUTOMATION_CONSOLE_DRY_RUN'?'DRY_RUN':'SYNC',data:result},requestId);
  }
  const method=methods[type];
  if(!method)return send('AUTOMATION_CONSOLE_ERROR',{code:'UNKNOWN_OPERATION',message:'This operation is not available.'},requestId);
  const result=await method(data);
  const operation=type.replace('AUTOMATION_CONSOLE_','');
  send('AUTOMATION_CONSOLE_RESULT',{operation,data:result},requestId);
}
$w.onReady(() => {
  try { component=$w(EMBED_ID); }
  catch(error) { console.error('[SKANDI][Automation Control] Missing component',presentError(error)); return; }
  if(!component||typeof component.onMessage!=='function'||typeof component.postMessage!=='function') {
    console.error('[SKANDI][Automation Control] The configured component is unavailable.'); return;
  }
  component.onMessage(async event=>{
    const message=dict(event?.data);
    if(message.source!==CHILD||!/^AUTOMATION_CONSOLE_[A-Z_]+$/.test(String(message.type||'')))return;
    const id=str(message.requestId,100)||`request-${++sequence}`;
    try { await dispatch(message.type,message.payload,id); }
    catch(error) { console.error('[SKANDI][Automation Control] Operation failed',message.type,presentError(error));send('AUTOMATION_CONSOLE_ERROR',{operation:message.type,...presentError(error)},id); }
  });
  send('AUTOMATION_CONSOLE_CONTROLLER_ATTACHED',{ok:true});
});

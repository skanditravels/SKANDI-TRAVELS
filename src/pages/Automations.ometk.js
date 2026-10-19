// SKANDI V12 — RIAINTRA Automations console; all Wix automation categories.
// REPLACES only the previous new Recruiting Automations page controller, not SuccessFactors.
// Existing HTML element ID #sfAutomationEmbed and event contracts retained.
import {
  getAutomationAdminSnapshot, getAutomationEmailPlatformSnapshot,
  inspectAutomationEmailAction,previewAutomationEmailAction,syncAutomationEmailAction,
  generateAutomationEmailActionMapping
} from 'backend/SKANDI_CORE/automationControl.web';
import {
  getAutomationWorkspace, createAutomationDraft,syncAutomationDesignedEmail,setAutomationStatus,
  getAutomationGraph,createAutomationGraphDraft
} from 'backend/SKANDI_CORE/automationWorkspace.web';
const ID='#sfAutomationEmbed', SOURCE='SKANDI_SF_AUTOMATIONS_EMBED', PARENT='SKANDI_WIX_PARENT';
const TYPES=new Set(['AUTOMATION_CONSOLE_READY','AUTOMATION_CONSOLE_REFRESH','AUTOMATION_CONSOLE_INSPECT','AUTOMATION_CONSOLE_DRY_RUN','AUTOMATION_CONSOLE_PREVIEW','AUTOMATION_CONSOLE_SYNC','AUTOMATION_CONSOLE_MAPPING','AUTOMATION_CONSOLE_CREATE_DRAFT','AUTOMATION_CONSOLE_SYNC_DESIGNED','AUTOMATION_CONSOLE_SET_STATUS','AUTOMATION_CONSOLE_GRAPH','AUTOMATION_CONSOLE_GRAPH_DRAFT']);
let embed;const dict=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};const clean=(v,n=500)=>String(v??'').trim().slice(0,n);
function send(type,payload={},requestId=''){embed.postMessage({source:PARENT,type,payload,requestId,timestamp:new Date().toISOString()});}
function err(e){return{code:clean(e?.code||e?.details?.applicationError?.code||'AUTOMATION_ERROR',100),message:clean(e?.publicMessage||e?.details?.applicationError?.description||e?.message||'Automation operation failed.',600)};}
async function boot(id){
  const [platform,live,workspace]=await Promise.allSettled([getAutomationEmailPlatformSnapshot(),getAutomationAdminSnapshot(),getAutomationWorkspace()]);
  if(platform.status==='rejected'||live.status==='rejected')throw(platform.reason||live.reason||new Error('Wix Automations unavailable.'));
  send('AUTOMATION_CONSOLE_BOOTSTRAP',{platform:platform.value,live:live.value,workspace:workspace.status==='fulfilled'?workspace.value:{ok:false,error:err(workspace.reason).message}},id);
}
async function request(type,data,id){
  const p=dict(data),target={automationId:clean(p.automationId,120),actionId:clean(p.actionId,120)};let result;
  switch(type){
    case 'AUTOMATION_CONSOLE_READY':case 'AUTOMATION_CONSOLE_REFRESH':await boot(id);return;
    case 'AUTOMATION_CONSOLE_INSPECT':result=await inspectAutomationEmailAction(target);break;
    case 'AUTOMATION_CONSOLE_PREVIEW':result=await previewAutomationEmailAction({...target,customPayload:{}});break;
    case 'AUTOMATION_CONSOLE_DRY_RUN':case 'AUTOMATION_CONSOLE_SYNC':result=await syncAutomationEmailAction({...target,workflowKey:clean(p.workflowKey,120),audience:clean(p.audience,40),expectedTriggerKey:clean(p.expectedTriggerKey,200),dryRun:type==='AUTOMATION_CONSOLE_DRY_RUN'});break;
    case 'AUTOMATION_CONSOLE_MAPPING':result=await generateAutomationEmailActionMapping({workflowKey:clean(p.workflowKey,120),audience:clean(p.audience,40),triggerSchemaContactIdPath:clean(p.contactPath||'contactId',240),notificationTopicId:clean(p.notificationTopicId,120),senderDetailsId:clean(p.senderDetailsId,120)});break;
    case 'AUTOMATION_CONSOLE_CREATE_DRAFT':result=await createAutomationDraft(p);break;
    case 'AUTOMATION_CONSOLE_GRAPH':result=await getAutomationGraph(p);break;
    case 'AUTOMATION_CONSOLE_GRAPH_DRAFT':result=await createAutomationGraphDraft(p);break;
    case 'AUTOMATION_CONSOLE_SYNC_DESIGNED':result=await syncAutomationDesignedEmail({...p,confirm:true,dryRun:false});break;
    case 'AUTOMATION_CONSOLE_SET_STATUS':result=await setAutomationStatus({...p,confirm:true});break;
    default:return;
  }
  send('AUTOMATION_CONSOLE_RESULT',{operation:type,data:result},id);
  if(['AUTOMATION_CONSOLE_CREATE_DRAFT','AUTOMATION_CONSOLE_SET_STATUS','AUTOMATION_CONSOLE_GRAPH_DRAFT'].includes(type)&&result?.ok)await boot('');
}
$w.onReady(()=>{
  try{embed=$w(ID);}catch(e){console.error('[SKANDI][Automations] Missing HTML component #sfAutomationEmbed');return;}
  if(!embed||typeof embed.onMessage!=='function'||typeof embed.postMessage!=='function'){console.error('[SKANDI][Automations] Element is not an HTML Component');return;}
  embed.onMessage(async event=>{const m=dict(event?.data);if(m.source!==SOURCE||!TYPES.has(m.type))return;try{await request(m.type,m.payload,clean(m.requestId,100));}catch(error){console.error('[SKANDI][Automations]',m.type,err(error));send('AUTOMATION_CONSOLE_ERROR',{operation:m.type,...err(error)},clean(m.requestId,100));}});
  send('AUTOMATION_CONSOLE_CONTROLLER_ATTACHED',{ok:true});
});

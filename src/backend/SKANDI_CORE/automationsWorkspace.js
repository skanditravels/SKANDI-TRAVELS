// SKANDI V12 — email designer and site-wide Wix Automations workspace.
// Canonical drafts: existing VOY editorial campaign records; Wix remains the live automation authority.
// No secrets, member-contact data, provider credentials, or automation input mappings are stored in templates.
import { automationsV2, triggerCatalog, actionCatalog } from '@wix/automations';
import { automationEmailAction } from '@wix/automations-email-actions';
import { auth } from '@wix/essentials';
import { randomUUID } from 'crypto';
import { requireStaffPortalSessionCore } from 'backend/SKANDI_CORE/staffAuth';
import { getVoyAdminBootstrapCore, saveVoyEntityCore, deleteVoyEntityCore } from 'backend/SKANDI_CORE/publicContent';
import { getAutomationAdminSnapshotCore } from 'backend/SKANDI_CORE/automationControl';
import { EMAIL_PLATFORM, EMAIL_WORKFLOWS, COMMON_DYNAMIC_VARIABLE_KEYS } from 'backend/SKANDI_CORE/automationEmailConfig';

const resolveTriggers = auth.elevate(triggerCatalog.resolveTriggers);
const resolveActions = auth.elevate(actionCatalog.resolveActions);
const getAutomation = auth.elevate(automationsV2.getAutomation);
const getAutomationRevision = auth.elevate(automationsV2.getAutomationRevision);
const createAutomation = auth.elevate(automationsV2.createAutomation);
const updateAutomation = auth.elevate(automationsV2.updateAutomation);
const validateAutomation = auth.elevate(automationsV2.validateAutomation);
const queryWithDrafts = auth.elevate(automationsV2.queryAutomationsWithDrafts);
const createDraftAutomation = auth.elevate(automationsV2.createDraftAutomation);
const getOrCreateDraftAutomation = auth.elevate(automationsV2.getOrCreateDraftAutomation);
const updateDraftAutomation = auth.elevate(automationsV2.updateDraftAutomation);
const publishDraftAutomation = auth.elevate(automationsV2.publishDraftAutomation);
const deleteDraftAutomation = auth.elevate(automationsV2.deleteDraftAutomation);
const deleteAutomation = auth.elevate(automationsV2.deleteAutomation);
const getEmailContent = auth.elevate(automationEmailAction.getEmailContent);
const setEmailContent = auth.elevate(automationEmailAction.setEmailContent);
const sendTestEmail = auth.elevate(automationEmailAction.sendTestEmail);
const generateActionInputMapping = auth.elevate(automationEmailAction.generateActionInputMapping);
const PRIVILEGED = new Set(['SUPER_ADMIN','OWNER','COMPANY_OWNER']);
const PREFIX = 'EMAIL-TEMPLATE-';
const TYPE = 'campaign';
const MAX_BLOCKS = 64;
const MAX_TRIGGERS = 500;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*){0,7}$/;
const TYPES = new Set(['text','heading','image','button','divider','spacer']);
const EMAIL_TYPES = new Set(['BUSINESS_TRANSACTIONAL','BUSINESS_CRITICAL','PROMOTIONAL']);
const safe = (v,n=1000) => String(v??'').trim().slice(0,n);
const dict = x => x && typeof x==='object' && !Array.isArray(x) ? x : {};
const arr = x => Array.isArray(x) ? x : [];
function problem(code, message) { const e = new Error(message); e.code = code; e.publicMessage=message; throw e; }
function validationPasses(value,acceptWarnings=false) { return value?.status==='VALID'||(acceptWarnings&&value?.status==='VALID_WITH_WARNINGS')||(value?.status==null&&value?.valid===true); }
function admin(session) {
  const role=safe(session?.accessRole,80).toUpperCase();
  const tags=[...arr(session?.permissionGroups),...arr(session?.permissionKeys)].map(x=>safe(x,100).toLowerCase());
  if (!(session?.isSystemAdmin===true||PRIVILEGED.has(role)||tags.includes('system-admin'))) problem('AUTOMATION_ADMIN_REQUIRED','System administrator access is required for Wix Automation modifications.');
}
async function session({manage=false}={}) {
  const s=await requireStaffPortalSessionCore();
  // Existing canonical VOY editorial methods enforce their own editorial permission boundary.
  if (!s?.profile && !s?.staffId && !s?.accessRole) problem('STAFF_AUTH_REQUIRED','An active RIAINTRA staff session is required.');
  if(manage) admin(s);
  return s;
}
const escapeXml = x => String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const safeUrl=x=>{const s=safe(x,2000);return /^https:\/\/[^\s<>"']+$/i.test(s)?s:'';};
const validLink=x=>!!safeUrl(x)||/^\$\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*){0,7}\}$/.test(safe(x,180));
const hexColor=(x,fallback)=>/^#[0-9a-f]{6}$/i.test(safe(x,8))?safe(x,8):fallback;
const clamp=(v,min,max,def)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.round(Number(v)))):def;
function normalizeTemplate(input={}) {
  const q=dict(input), blocks=arr(q.blocks);
  const sourceMode=safe(q.sourceMode,20).toUpperCase()==='HTML'?'HTML':'VISUAL';
  if(sourceMode==='VISUAL'&&(!blocks.length||blocks.length>MAX_BLOCKS)) problem('EMAIL_BLOCK_COUNT',`Add 1–${MAX_BLOCKS} email blocks.`);
  if(blocks.length>MAX_BLOCKS)problem('EMAIL_BLOCK_COUNT','Too many email blocks.');
  const htmlSource=sourceMode==='HTML'?String(q.htmlSource||''):'';
  if(sourceMode==='HTML'){if(htmlSource.length>180000||!/\s*<!doctype html/i.test(htmlSource)||!/<html\b/i.test(htmlSource))problem('EMAIL_HTML_INVALID','Provide a complete email HTML document under 180,000 characters.');if(/<script\b|<iframe\b|<object\b|<embed\b|\son[a-z]+\s*=|javascript\s*:/i.test(htmlSource))problem('EMAIL_HTML_UNSAFE','Executable scripts, event handlers and embed content are not permitted in an email.');}
  const title=safe(q.title,160), subject=safe(q.subject,250);
  if(!title||!subject) problem('EMAIL_REQUIRED_FIELDS','Template name and email subject are required.');
  const type=safe(q.emailType,32).toUpperCase();
  if(!EMAIL_TYPES.has(type)) problem('EMAIL_TYPE_INVALID','Choose a valid Wix email type.');
  const custom=arr(q.customVariables).slice(0,100).map(v=>({
    path:safe(v?.path,160), label:safe(v?.label,160), description:safe(v?.description,400), fallback:safe(v?.fallback,300)
  }));
  for(const v of custom) if(!KEY.test(v.path)) problem('EMAIL_VARIABLE_INVALID',`Invalid variable name: ${v.path}`);
  const normalized=blocks.map((block,i)=>{
    const b=dict(block),kind=safe(b.type,40);
    if(!TYPES.has(kind)) problem('EMAIL_BLOCK_TYPE',`Unsupported email block ${kind}`);
    const val={id:safe(b.id,100)||String(i), type:kind, text:safe(b.text,6000), url:safe(b.url,2000), alt:safe(b.alt,300), color:hexColor(b.color,'#022e64'), background:hexColor(b.background,'#ffffff'), align:['left','center','right'].includes(b.align)?b.align:'left', size:clamp(b.size,12,48,kind==='heading'?28:15), height:clamp(b.height,8,100,20)};
    if((kind==='image'&&!safeUrl(val.url))||(kind==='button'&&!validLink(val.url))) problem('EMAIL_IMAGE_OR_LINK_URL',`${kind} block requires an HTTPS URL or a validated dynamic button link.`);
    return val;
  });
  const id=safe(q.entityId||q.id,100);
  if(id && !/^EMAIL-TEMPLATE-[a-zA-Z0-9-]{8,85}$/.test(id)) problem('EMAIL_TEMPLATE_ID','Invalid email template identifier.');
  return { entityId:id||`${PREFIX}${randomUUID()}`, purpose:'SKANDI_AUTOMATION_EMAIL_TEMPLATE', title, sourceMode, htmlSource, subject, preheader:safe(q.preheader,320), emailType:type, audience:safe(q.audience,32)||'CUSTOMER', blocks:normalized, customVariables:custom, updatedAt:new Date().toISOString(), format:'SKANDI_EMAIL_BLOCKS_V12' };
}
function extractVariables(template) {
  const text=template.sourceMode==='HTML'?[template.subject,template.preheader,template.htmlSource].join('\n'):[template.subject,template.preheader,...template.blocks.flatMap(b=>[b.text,b.url,b.alt])].join('\n');
  const found=new Set();
  // Preserve native Wix placeholder ${path} syntax rather than interpolating on the server.
  for(const match of text.matchAll(/\$\{([^}]+)\}/g)){
    const p=match[1].trim(); if(!KEY.test(p)) problem('EMAIL_VARIABLE_INVALID',`Invalid email placeholder: ${p}`);found.add(p);
  }
  return [...found].sort();
}
function compileMJML(template){
  const body=template.blocks.map(b=>{
    if(b.type==='divider')return '<mj-divider border-color="#d8e1ea" border-width="1px" padding="14px 0" />';
    if(b.type==='spacer')return `<mj-spacer height="${b.height}px" />`;
    if(b.type==='image')return `<mj-image src="${escapeXml(b.url)}" alt="${escapeXml(b.alt)}" fluid-on-mobile="true" padding="12px 24px" />`;
    if(b.type==='button')return `<mj-button href="${escapeXml(b.url)}" background-color="${escapeXml(b.color)}" color="#ffffff" font-size="14px" font-weight="bold" border-radius="4px" padding="12px 24px">${escapeXml(b.text||'View details')}</mj-button>`;
    return `<mj-text align="${b.align}" color="${escapeXml(b.color)}" font-size="${b.size}px" font-weight="${b.type==='heading'?'700':'400'}" line-height="1.65" padding="12px 24px">${escapeXml(b.text).replace(/\n/g,'<br />')}</mj-text>`;
  }).join('');
  const logo=safeUrl(EMAIL_PLATFORM?.assets?.employeeLogoUrl)||safeUrl(EMAIL_PLATFORM?.assets?.customerLogoUrl);
  return `<mjml><mj-head><mj-attributes><mj-all font-family="Arial,Helvetica,sans-serif" /><mj-text color="#26354a" /></mj-attributes></mj-head><mj-body background-color="#eef3f8"><mj-section background-color="#022e64" padding="19px 16px"><mj-column>${logo?`<mj-image src="${escapeXml(logo)}" alt="SKANDI" width="132px" align="left" padding="0 10px" />`:'<mj-text color="#ffffff" font-weight="700" font-size="22px">SKANDI</mj-text>'}</mj-column></mj-section><mj-section background-color="#ffffff" padding="15px 12px"><mj-column>${body}</mj-column></mj-section><mj-section background-color="#eef3f8"><mj-column><mj-text color="#6b7280" align="center" font-size="11px">${escapeXml(EMAIL_PLATFORM.companyLegalName||'SKANDI GROUP')}</mj-text></mj-column></mj-section></mj-body></mjml>`;
}
function content(template){const raw=template.sourceMode==='HTML';return {editorType:raw?'HTML':'MJML', emailSubject:template.subject, emailPreheader:template.preheader, composer:{composerDataJson:JSON.stringify(raw?{html:template.htmlSource}:{mjml:compileMJML(template)})}};}
function schemaPaths(node,prefix='',set=new Set(),depth=0){
  if(depth>8||!node||typeof node!=='object') return set;
  for(const [key,value] of Object.entries(dict(node.properties))){
    const path=prefix?`${prefix}.${key}`:key;
    if(KEY.test(path))set.add(path);
    schemaPaths(value,path,set,depth+1);
  }
  return set;
}
function triggerRows(response){return arr(response?.results||response?.items||response?.triggers);}
async function siteTriggers(){
  const items=[];
  for(let offset=0;offset<MAX_TRIGGERS;offset+=100){
    const r=await resolveTriggers({query:{paging:{limit:100,offset}},basicFieldsOnly:false});
    const page=triggerRows(r);items.push(...page);
    if(page.length<100)break;
  }
  return items.filter(x=>x?.appId&&x?.triggerKey).map(t=>({
    appId:safe(t.appId,100),triggerKey:safe(t.triggerKey,160),displayName:safe(t.displayName||t.name||t.triggerKey,240),
    variablePaths:[...schemaPaths(t.payloadDataSchema)].sort(),
    schemaAvailable:!!dict(t.payloadDataSchema).properties,
    // Server keeps schema out of iframe, only safe field names are exposed.
  }));
}
async function siteActions(){
  const items=[];
  for(let offset=0;offset<MAX_TRIGGERS;offset+=100){
    const response=await resolveActions({query:{paging:{limit:100,offset}}});
    if(!Array.isArray(response?.actions))problem('AUTOMATION_ACTION_CATALOG_INVALID','The action catalog returned an unexpected response.');
    items.push(...response.actions);
    if(response.actions.length<100||response?.paging?.hasNext===false)break;
  }
  return items.filter(x=>x?.appId&&x?.actionKey).map(a=>({
    appId:safe(a.appId,120), actionKey:safe(a.actionKey,160),
    displayName:safe(a.displayName||a.actionKey,240), description:safe(a.description,500),
    inputSchema:dict(a.inputSchema)
  }));
}
async function allTemplates(){
  const base=await getVoyAdminBootstrapCore();
  return arr(base?.campaigns).filter(x=>x?.purpose==='SKANDI_AUTOMATION_EMAIL_TEMPLATE'&&String(x?.entityId||'').startsWith(PREFIX)).map(x=>({
    entityId:safe(x.entityId,100),purpose:x.purpose,title:x.title,subject:x.subject,preheader:x.preheader,emailType:x.emailType,audience:x.audience,
    blocks:arr(x.blocks),sourceMode:safe(x.sourceMode,20)||"VISUAL",htmlSource:String(x.htmlSource||""),customVariables:arr(x.customVariables),updatedAt:x.updatedAt,format:x.format
  }));
}
async function findTemplate(id){const result=(await allTemplates()).find(x=>x.entityId===id);if(!result)problem('EMAIL_TEMPLATE_NOT_FOUND','Email template not found.');return normalizeTemplate(result);}
function validTrigger(t, available){const record=available.find(x=>x.appId===safe(t?.appId,120)&&x.triggerKey===safe(t?.triggerKey,160));if(!record||!record.schemaAvailable)problem('EMAIL_TRIGGER_NOT_VERIFIED','Select a Wix trigger whose current site schema is available.');return record;}
function verifyVariables(template,trigger){const avail=new Set(trigger.variablePaths);const used=extractVariables(template);const invalid=used.filter(p=>!avail.has(p));if(invalid.length)problem('EMAIL_VARIABLE_UNAVAILABLE',`These placeholders are not in the selected Wix trigger schema: ${invalid.join(', ')}. Custom draft variables are not live Wix variables.`);return used;}
export async function getAutomationWorkspaceCore(){
  await session();
  const [templates,triggers,automations,actions] = await Promise.allSettled([allTemplates(),siteTriggers(),getAutomationAdminSnapshotCore(),siteActions()]);
  const savedTemplates=templates.status==='fulfilled'?templates.value:[];
  const variableDefinitions=[...new Map(savedTemplates.flatMap(t=>arr(t.customVariables)).filter(v=>v?.path).map(v=>[v.path,{...v,source:'SKANDI_EDITORIAL_DRAFT'}])).values()];
  return {ok:true,templates:savedTemplates,variableDefinitions,templateError:templates.status==='rejected'?safe(templates.reason?.message||'Templates unavailable',300):'',
    triggers:triggers.status==='fulfilled'?triggers.value:[],triggerError:triggers.status==='rejected'?safe(triggers.reason?.message||'Wix trigger registry unavailable',300):'',
    catalogVariables:COMMON_DYNAMIC_VARIABLE_KEYS.map(path=>({path,source:'SKANDI_CATALOG_ONLY'})),
    workflows:Object.entries(EMAIL_WORKFLOWS).map(([key,v])=>({key,category:v.category,audiences:v.audiences,referenceCode:v.referenceCode,emailType:v.emailType})),
    automations:automations.status==='fulfilled'?automations.value.automations:[],automationError:automations.status==='rejected'?safe(automations.reason?.message||'Automations unavailable',300):'',
    actions:actions.status==='fulfilled'?actions.value:[],actionError:actions.status==='rejected'?safe(actions.reason?.message||'Action catalog unavailable',300):'',
    retrievedAt:new Date().toISOString()};
}
export async function saveAutomationTemplateCore(input={}){
  await session();
  const template=normalizeTemplate(input);
  // Forbid overwriting campaign records that do not belong to this email studio.
  if(input?.entityId){const exists=(await allTemplates()).some(t=>t.entityId===template.entityId);if(!exists)problem('EMAIL_TEMPLATE_NOT_FOUND','Cannot overwrite a non-email campaign.');}
  const saved=await saveVoyEntityCore({entityType:TYPE,entityId:template.entityId,item:template});
  if(saved?.ok!==true||!saved.entity)problem('EMAIL_TEMPLATE_SAVE_FAILED','The canonical editorial store did not confirm the save.');
  return {ok:true,template};
}
export async function deleteAutomationTemplateCore(input={}){
  await session();
  const id=safe(input.entityId,100);
  if(!(await allTemplates()).some(t=>t.entityId===id))problem('EMAIL_TEMPLATE_NOT_FOUND','Email template not found.');
  const result=await deleteVoyEntityCore({entityType:TYPE,entityId:id});
  if(result?.ok!==true)problem('EMAIL_TEMPLATE_DELETE_FAILED','Template deletion was not confirmed.');
  return {ok:true,entityId:id};
}
function requireId(value,label){const id=safe(value,120);if(!GUID.test(id))problem('EMAIL_WIX_ID',`${label} must be an actual Wix GUID.`);return id;}
async function prepared(input={}){
  const template=await findTemplate(safe(input.entityId,100));
  const triggers=await siteTriggers();
  const trigger=validTrigger(input.trigger,triggers);
  const variables=verifyVariables(template,trigger);
  return {template,trigger,variables};
}
export async function createAutomationDraftCore(input={}){
  await session({manage:true});
  const {template,trigger,variables}=await prepared(input);
  const contactPath=safe(input.contactPath||'contactId',160);
  if(!trigger.variablePaths.includes(contactPath))problem('EMAIL_CONTACT_MAPPING_INVALID','The selected trigger does not supply this Wix contact ID property.');
  if(template.emailType==='BUSINESS_CRITICAL' && input.acknowledgeCritical!==true)problem('EMAIL_CRITICAL_APPROVAL','Business-critical classification requires explicit administrator confirmation.');
  if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm that the system may create a draft and its message content.');
  const action={emailType:template.emailType,recipients:{recipientType:'TRIGGER_CONTACT',triggerContactOptions:{contactIdPath:contactPath}}};
  if(template.emailType==='BUSINESS_TRANSACTIONAL')action.notificationTopicId=requireId(input.notificationTopicId,'Notification topic ID');
  if(input.senderDetailsId)action.senderDetailsId=requireId(input.senderDetailsId,'Sender details ID');
  const mapping=await generateActionInputMapping({action,content:content(template)});
  if(!mapping?.appId||!mapping?.actionKey||!mapping?.inputMapping)problem('EMAIL_MAPPING_FAILED','Wix did not return a complete single-use email action mapping.');
  const aid=randomUUID();
  const automation={name:safe(input.name||template.title,240),description:`SKANDI Media Control email template ${template.entityId}`,origin:'USER',configuration:{status:'INACTIVE',trigger:{appId:trigger.appId,triggerKey:trigger.triggerKey,filters:[]},rootActionIds:[aid],actions:{[aid]:{id:aid,type:'APP_DEFINED',namespace:'triggered-emails-1',appDefinedInfo:{appId:mapping.appId,actionKey:mapping.actionKey,inputMapping:mapping.inputMapping,postActionIds:[],skipConditionOrExpressionGroups:[]}}}}};
  const validation=await validateAutomation(automation);
  if(!validationPasses(validation,input.acceptWarnings===true)) return {ok:false,created:false,validation,reason:'Validation did not pass; no automation was created. The prepared email content may remain.'};
  const created=await createDraftAutomation({automation});
  const record=created?.automation||created;
  if(!record?._id)problem('EMAIL_WIX_CREATE_NOT_CONFIRMED','Wix did not return an automation ID. Review the Wix dashboard before retrying.');
  return {ok:true,created:true,draft:true,active:false,automationId:record._id,actionId:aid,triggerKey:trigger.triggerKey,variables,revision:record.revision||'',message:'Draft created. It will not run until published.'};
}
export async function syncAutomationDesignedEmailCore(input={}){
  await session({manage:true});
  const {template,trigger,variables}=await prepared(input);
  const automationId=requireId(input.automationId,'Automation ID'),actionId=requireId(input.actionId,'Email action ID');
  const fetched=await getAutomation(automationId);
  const automation=fetched?.automation||fetched;
  const config=dict(automation?.configuration);
  if(safe(config.trigger?.appId,100)!==trigger.appId||safe(config.trigger?.triggerKey,160)!==trigger.triggerKey)problem('EMAIL_WIX_TRIGGER_MISMATCH','The selected Wix automation uses a different trigger than this template.');
  const actions=dict(config.actions);const target=actions[actionId]||Object.values(actions).find(a=>a?._id===actionId||a?.id===actionId);
  if(!target||target.type!=='APP_DEFINED'||!new Set(['triggered-emails','send-email']).has(String(target.appDefinedInfo?.actionKey||'')))problem('EMAIL_WIX_ACTION_INVALID','Select an existing Wix Send an email action; other actions are never modified.');
  const prior=await getEmailContent({automationId,actionId});
  if(safe(prior?.content?.editorType,20).toUpperCase()!==(template.sourceMode==='HTML'?'HTML':'MJML'))problem('EMAIL_WIX_EDITOR_INCOMPATIBLE','The existing Wix action editor format must match the design. Create a new inactive action rather than overwriting incompatible content.');
  if(input.dryRun===true)return{ok:true,dryRun:true,automationId,actionId,templateId:template.entityId,variables,subject:template.subject};
  if(input.confirm!==true)problem('EMAIL_CONFIRMATION_REQUIRED','Confirm the email content change first.');
  await setEmailContent({automationId,actionId},{content:content(template)});
  return {ok:true,updated:true,automationId,actionId,templateId:template.entityId,variables,deliveryStatus:'NOT_SENT',message:'Wix acknowledged the content update. Sending, scenarios and activation remain controlled by Wix Automations.'};
}

export async function setAutomationStatusCore(input={}){
  await session({manage:true});
  const id=requireId(input.automationId,'Automation ID');
  if(typeof input.active!=='boolean') problem('AUTOMATION_STATUS_INVALID','Specify whether this automation should be active.');
  if(input.confirm!==true) problem('AUTOMATION_STATUS_CONFIRM','Confirm the requested automation status change.');
  const found=await getAutomation(id);
  const current=found?.automation||found;
  if(current?.settings?.readonly===true||current?.settings?.disableStatusChange===true)
    problem('AUTOMATION_CONTROL_RESTRICTED','The provider does not permit changing this automation’s status.');
  if(!current?.revision||!current?.configuration?.trigger||!current?.configuration?.actions)
    problem('AUTOMATION_CONFIG_UNAVAILABLE','Wix did not supply complete configuration and revision information.');
  const status=input.active?'ACTIVE':'INACTIVE';
  if(current.configuration.status===status)return{ok:true,unchanged:true,automationId:id,status};
  if(input.revision&&String(input.revision)!==String(current.revision))problem('AUTOMATION_REVISION_CHANGED','This automation changed since it was opened. Refresh and review it again.');
  // A normal GET omits optional trigger/action override schemas. Fetch this exact
  // revision with those fields before a full update so they are not cleared.
  let revisionResponse;
  try { revisionResponse=await getAutomationRevision(id,{revision:String(current.revision),fields:['OVERRIDE_SCHEMA']}); }
  catch (_) { problem('AUTOMATION_REVISION_UNAVAILABLE','The complete workflow revision could not be retrieved. Its status was not changed.'); }
  const complete=revisionResponse?.automation;
  if(!complete?.configuration?.trigger||!complete?.configuration?.actions||String(complete.revision)!==String(current.revision))
    problem('AUTOMATION_REVISION_UNAVAILABLE','The complete workflow revision could not be confirmed. Its status was not changed.');
  const update={...complete,configuration:{...complete.configuration,status}};
  if(status==='ACTIVE'){
    const verification=await validateAutomation(update);
    if(!validationPasses(verification,input.acceptWarnings===true))return{ok:false,validation:verification,reason:'Validation did not pass; the automation remains unchanged.'};
  }
  const changed=await updateAutomation(id,update);
  if(!changed?._id&&!changed?.automation?._id)problem('AUTOMATION_STATUS_UNCONFIRMED','Wix did not confirm the update. Check Wix before retrying.');
  const record=changed?.automation||changed;const changedId=record?._id||record?.id;
  let verified;
  try { verified=await getAutomation(changedId); }
  catch (_) { problem('AUTOMATION_STATUS_UNCONFIRMED','The change was submitted but could not be confirmed. Refresh before trying again.'); }
  const live=verified?.automation||verified;
  if(live?.configuration?.status!==status)problem('AUTOMATION_STATUS_UNCONFIRMED','The requested status could not be confirmed. Refresh before trying again.');
  return{ok:true,automationId:changedId,status,revision:live.revision||'',message:'The status change was confirmed.'};
}

export async function setAutomationArchivedCore(input={}){
  await session({manage:true});
  if(input.confirm!==true||typeof input.archived!=='boolean')problem('AUTOMATION_CONFIRM_REQUIRED','Confirm the requested archive change.');
  const id=requireId(input.automationId,'Automation ID');
  const response=await getAutomation(id),current=response?.automation||response;
  if(current?.settings?.readonly===true)problem('AUTOMATION_CONTROL_RESTRICTED','This workflow is read-only.');
  if(!current?.revision||String(current.revision)!==String(input.revision||''))problem('AUTOMATION_REVISION_CHANGED','The workflow changed. Refresh before continuing.');
  if(!!current.archived===input.archived)return{ok:true,unchanged:true,automationId:id,archived:input.archived};
  if(input.archived&&current.configuration?.status==='ACTIVE')problem('AUTOMATION_PAUSE_FIRST','Pause this workflow before moving it to the archive.');
  let fullResponse;
  try {fullResponse=await getAutomationRevision(id,{revision:String(current.revision),fields:['OVERRIDE_SCHEMA']});}
  catch (_) {problem('AUTOMATION_REVISION_UNAVAILABLE','The complete workflow revision could not be retrieved. No change was made.');}
  const complete=fullResponse?.automation;
  if(!complete?.configuration?.trigger||!complete?.configuration?.actions||String(complete.revision)!==String(current.revision))
    problem('AUTOMATION_REVISION_UNAVAILABLE','The complete workflow revision could not be confirmed. No change was made.');
  const changed=await updateAutomation(id,{...complete,archived:input.archived});
  const updated=changed?.automation||changed;
  if(!updated?._id&&!updated?.id)problem('AUTOMATION_ARCHIVE_UNCONFIRMED','The change was submitted but not confirmed. Refresh before trying again.');
  let verified;
  try {verified=await getAutomation(updated._id||updated.id);}
  catch (_) {problem('AUTOMATION_ARCHIVE_UNCONFIRMED','The change was submitted but not confirmed. Refresh before trying again.');}
  if(!!(verified?.automation||verified)?.archived!==input.archived)problem('AUTOMATION_ARCHIVE_UNCONFIRMED','The archive change could not be confirmed. Refresh before trying again.');
  return{ok:true,automationId:id,archived:input.archived};
}



// Workflow graph support. Read and project Wix's actual action DAG; never expose opaque input mappings.
function safeGraphProjection(row={}){
  const cfg=dict(row?.configuration),actions=dict(cfg.actions);
  const nodes=[{id:'trigger',type:'TRIGGER',label:safe(cfg.trigger?.triggerKey||'Wix trigger',240),appId:safe(cfg.trigger?.appId,120)}];
  const edges=[];
  for(const [key,a] of Object.entries(actions)){
    const id=safe(a?.id||a?._id||key,120),type=safe(a?.type,50);
    const label=type==='APP_DEFINED'?safe(a?.appDefinedInfo?.actionKey||'Wix action',200):type==='CONDITION'?'Condition':type==='DELAY'?'Delay':type||'Action';
    nodes.push({id,type,label,namespace:safe(a?.namespace,80),editorControlled:row.origin==='USER',delayAmount:safe(a?.delayInfo?.offsetExpression,100),delayUnit:safe(a?.delayInfo?.offsetTimeUnit,20),conditionsCount:arr(a?.conditionInfo?.orExpressionGroups).length});
    let post=type==='CONDITION'?[['THEN',a?.conditionInfo?.truePostActionIds],['ELSE',a?.conditionInfo?.falsePostActionIds]]:[['NEXT',type==='DELAY'?a?.delayInfo?.postActionIds:a?.appDefinedInfo?.postActionIds]];
    for(const [branch,ids] of post)for(const next of arr(ids))edges.push({source:id,target:safe(next,120),branch});
  }
  for(const next of arr(cfg.rootActionIds))edges.push({source:'trigger',target:safe(next,120),branch:'START'});
  return {automationId:safe(row._id||row.id,120),name:safe(row.name,240),status:safe(cfg.status,40),origin:safe(row.origin,40),revision:safe(row.revision,40),trigger:nodes[0],nodes,edges,readOnly:true,actionCount:nodes.length-1};
}
export async function getAutomationGraphCore({automationId}={}){
  await session({manage:true});const id=requireId(automationId,'Automation ID');const response=await getAutomation(id),row=response?.automation||response;
  if(!row||!row.configuration)problem('AUTOMATION_NOT_FOUND','Wix did not return this automation.');
  return {ok:true,graph:safeGraphProjection(row)};
}

// Draft changes are made against a freshly retrieved provider revision. Sensitive
// values stay on the server and are restored when a retained field is saved.
const PROTECTED_VALUE='[protected]';
const SENSITIVE_KEY=/(?:authorization|password|passphrase|secret|credential|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key)/i;
function protectedString(value){return typeof value==='string'&&(/\bBearer\s+\S+/i.test(value)||/[?&](?:token|secret|api[_-]?key|password)=/i.test(value)||/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value));}
function redactDefinition(value,key='',depth=0){
  if(depth>30)problem('AUTOMATION_DEFINITION_DEPTH','The workflow definition is too deeply nested.');
  if(SENSITIVE_KEY.test(key)||protectedString(value))return PROTECTED_VALUE;
  if(Array.isArray(value))return value.map(v=>redactDefinition(v,'',depth+1));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redactDefinition(v,k,depth+1)]));
  return value;
}
function restoreDefinition(value,old,key='',depth=0){
  if(depth>30)problem('AUTOMATION_DEFINITION_DEPTH','The workflow definition is too deeply nested.');
  if(SENSITIVE_KEY.test(key)||value===PROTECTED_VALUE){
    if(value!==PROTECTED_VALUE||old===undefined)problem('AUTOMATION_PROTECTED_FIELD','Protected values cannot be added or changed in this editor.');
    return old;
  }
  if(protectedString(value))problem('AUTOMATION_PROTECTED_FIELD','Credentials cannot be entered in this editor.');
  if(Array.isArray(value)){
    const original=Array.isArray(old)?old:[];
    const redacted=redactDefinition(original);
    if(JSON.stringify(redacted).includes(PROTECTED_VALUE)&&JSON.stringify(value)!==JSON.stringify(redacted))
      problem('AUTOMATION_PROTECTED_FIELD','A list containing protected values cannot be changed in this editor.');
    return value.map((v,i)=>restoreDefinition(v,original[i],'',depth+1));
  }
  if(value&&typeof value==='object'){
    const result={};
    for(const [k,v] of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(k))problem('AUTOMATION_FIELD_INVALID','The definition contains an invalid field.');
      result[k]=restoreDefinition(v,old?.[k],k,depth+1);
    }
    for(const [k,v] of Object.entries(dict(old)))if(SENSITIVE_KEY.test(k)&&!(k in result))result[k]=v;
    return result;
  }
  return value;
}
function connectionFields(value,path='',out={}){
  if(!value||typeof value!=='object')return out;
  for(const [key,item] of Object.entries(value)){
    const child=path?path+'.'+key:key;
    if(/^(?:postActionIds|truePostActionIds|falsePostActionIds|rootActionIds)$/.test(key))out[child]=item;
    else if(item&&typeof item==='object')connectionFields(item,child,out);
  }
  return out;
}
function draftView(row,originalRevision=''){
  return {id:safe(row?._id||row?.id,120),revision:safe(row?.revision,80),originalId:safe(row?.draftInfo?.originalAutomationId,120),originalRevision,
    definition:redactDefinition({name:row?.name||'',description:row?.description||'',configuration:row?.configuration||{}})};
}
async function standaloneDraft(id){
  let cursor='';const seen=new Set();
  for(let page=0;page<100;page++){
    const paging={limit:100};if(cursor)paging.cursor=cursor;
    const response=await queryWithDrafts({query:{cursorPaging:paging}});
    if(!Array.isArray(response?.automations))problem('AUTOMATION_QUERY_INVALID','The draft list returned an unexpected response.');
    const found=response.automations.find(x=>String(x?._id||x?.id)===id&&x?.draftInfo);
    if(found)return found;
    const next=safe(response?.pagingMetadata?.cursors?.next,64000);
    if(!next&&response?.pagingMetadata?.hasNext!==true)break;
    if(!next||seen.has(next))problem('AUTOMATION_QUERY_INCOMPLETE','The draft list could not be fully loaded.');
    seen.add(next);cursor=next;
  }
  problem('AUTOMATION_DRAFT_NOT_FOUND','The selected draft was not found. Refresh the list.');
}
async function currentDraft({draftId,originalId}={}){
  const id=requireId(draftId,'Draft ID');
  if(originalId){
    const original=requireId(originalId,'Automation ID');
    const response=await getOrCreateDraftAutomation(original);const row=response?.automation||response;
    if(String(row?._id||row?.id)!==id)problem('AUTOMATION_DRAFT_CHANGED','The selected draft changed. Refresh before continuing.');
    return row;
  }
  // The list response is used only to verify that this is a standalone draft.
  // Fetch the complete draft before an update; list projections may omit fields.
  await standaloneDraft(id);
  const response=await getOrCreateDraftAutomation(id),row=response?.automation||response;
  if(String(row?._id||row?.id)!==id||!row?.draftInfo)
    problem('AUTOMATION_DRAFT_CHANGED','The selected draft changed. Refresh before continuing.');
  return row;
}
export async function openAutomationDraftCore(input={}){
  await session({manage:true});
  const id=requireId(input.automationId,'Automation ID');
  if(input.standalone===true){const row=await standaloneDraft(id);return {ok:true,draft:draftView(row)};}
  const originalResponse=await getAutomation(id),original=originalResponse?.automation||originalResponse;
  if(!original?.configuration)problem('AUTOMATION_NOT_FOUND','The selected automation was not found.');
  if(original?.settings?.readonly===true)problem('AUTOMATION_CONTROL_RESTRICTED','This automation is read-only.');
  if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm creating or opening a draft.');
  const response=await getOrCreateDraftAutomation(id),row=response?.automation||response;
  if(!row?._id&&!row?.id)problem('AUTOMATION_DRAFT_UNCONFIRMED','The draft could not be confirmed. Refresh before trying again.');
  return {ok:true,draft:draftView(row,safe(original.revision,80))};
}
export async function createBlankAutomationDraftCore(input={}){
  await session({manage:true});
  const name=safe(input.name,240);if(!name)problem('AUTOMATION_NAME_REQUIRED','Enter a workflow name.');
  if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm creating a draft.');
  const response=await createDraftAutomation({automation:{name,origin:'USER'}}),row=response?.automation||response;
  if(!row?._id&&!row?.id)problem('AUTOMATION_DRAFT_UNCONFIRMED','Draft creation was not confirmed. Refresh before trying again.');
  return {ok:true,draft:draftView(row)};
}
export async function saveAutomationDraftCore(input={}){
  await session({manage:true});const current=await currentDraft(input);
  if(!current?.revision||String(current.revision)!==String(input.revision||''))problem('AUTOMATION_REVISION_CHANGED','The draft changed since it was opened. Reload before saving.');
  if(current?.settings?.readonly===true)problem('AUTOMATION_CONTROL_RESTRICTED','This draft is read-only.');
  const submitted=dict(input.definition);
  if(JSON.stringify(submitted).length>250000||!submitted.name||!submitted.configuration||Array.isArray(submitted.configuration))problem('AUTOMATION_DEFINITION_INVALID','Enter a name and a valid workflow configuration.');
  const config=restoreDefinition(submitted.configuration,current.configuration);
  config.status=current.configuration?.status||'INACTIVE';
  if(current.origin!=='USER'){
    if(JSON.stringify(config.trigger)!==JSON.stringify(current.configuration?.trigger))problem('AUTOMATION_TRIGGER_RESTRICTED','The event for this installed workflow is controlled by its provider.');
    const beforeActions=dict(current.configuration?.actions),afterActions=dict(config.actions);
    if(JSON.stringify(Object.keys(beforeActions).sort())!==JSON.stringify(Object.keys(afterActions).sort())||JSON.stringify(config.rootActionIds)!==JSON.stringify(current.configuration?.rootActionIds))
      problem('AUTOMATION_GRAPH_RESTRICTED','Adding, removing or reconnecting steps in this installed workflow is not supported here.');
    if(JSON.stringify(connectionFields(beforeActions))!==JSON.stringify(connectionFields(afterActions)))
      problem('AUTOMATION_GRAPH_RESTRICTED','Reconnecting steps in this installed workflow is not supported here.');
    for(const id of arr(current?.settings?.actionSettings?.permanentActionIds)){
      if(!afterActions[id]||afterActions[id].skipActionExpression!==beforeActions[id]?.skipActionExpression)problem('AUTOMATION_ACTION_PERMANENT','A permanent action or its skip condition was changed.');
    }
  }
  const restricted=arr(current?.settings?.actionSettings?.readonlyActionIds);
  for(const id of restricted)if(JSON.stringify(config.actions?.[id])!==JSON.stringify(current.configuration?.actions?.[id]))problem('AUTOMATION_ACTION_READONLY','A protected action was changed.');
  const update={...current,name:safe(submitted.name,500),description:safe(submitted.description,2000),configuration:config,origin:current.origin,draftInfo:current.draftInfo};
  const response=await updateDraftAutomation(String(current._id||current.id),update),row=response?.automation||response;
  if(!row?._id&&!row?.id)problem('AUTOMATION_DRAFT_UNCONFIRMED','The system did not confirm the save. Reload before trying again.');
  return {ok:true,draft:draftView(row,safe(input.originalRevision,80))};
}
export async function validateAutomationDraftCore(input={}){
  await session({manage:true});const draft=await currentDraft(input);
  if(String(draft?.revision||'')!==String(input.revision||''))problem('AUTOMATION_REVISION_CHANGED','The draft changed since it was opened. Reload before validating.');
  const validation=await validateAutomation(draft);
  return {ok:true,valid:validationPasses(validation,true),hasWarnings:validation?.status==='VALID_WITH_WARNINGS',validation:redactDefinition(validation)};
}
export async function publishAutomationDraftCore(input={}){
  await session({manage:true});if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm publishing and activating this workflow.');
  const draft=await currentDraft(input);
  if(String(draft?.revision||'')!==String(input.revision||''))problem('AUTOMATION_REVISION_CHANGED','The draft changed since it was opened. Reload before publishing.');
  if(draft?.draftInfo?.originalAutomationId){
    const found=await getAutomation(draft.draftInfo.originalAutomationId),original=found?.automation||found;
    if(original?.settings?.readonly||original?.settings?.disableStatusChange)problem('AUTOMATION_CONTROL_RESTRICTED','This workflow cannot be published or activated by this account.');
    if(input.originalRevision&&String(input.originalRevision)!==String(original?.revision))problem('AUTOMATION_REVISION_CHANGED','The live workflow changed since the draft was opened. Review it again.');
  }
  const validation=await validateAutomation(draft);
  if(!validationPasses(validation,input.acceptWarnings===true))return {ok:false,hasWarnings:validation?.status==='VALID_WITH_WARNINGS',validation:redactDefinition(validation),reason:validation?.status==='VALID_WITH_WARNINGS'?'Review the validation warnings before publishing.':'Validation did not pass; the draft was not published.'};
  const response=await publishDraftAutomation(String(draft._id||draft.id)),row=response?.automation||response;
  if(!row?._id&&!row?.id)problem('AUTOMATION_PUBLISH_UNCONFIRMED','Publication was not confirmed. Refresh before trying again.');
  return {ok:true,automationId:row._id||row.id,status:row?.configuration?.status||'',message:'The draft was published.'};
}
export async function deleteAutomationDraftCore(input={}){
  await session({manage:true});if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm deleting the draft.');
  const draft=await currentDraft(input);if(String(draft?.revision||'')!==String(input.revision||''))problem('AUTOMATION_REVISION_CHANGED','The draft changed. Reload before deleting.');
  await deleteDraftAutomation(String(draft._id||draft.id));return {ok:true,deleted:true};
}
export async function deleteAutomationCore(input={}){
  await session({manage:true});if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm deleting the automation.');
  const id=requireId(input.automationId,'Automation ID');const response=await getAutomation(id),row=response?.automation||response;
  if(row?.settings?.readonly||row?.settings?.disableDelete)problem('AUTOMATION_CONTROL_RESTRICTED','This automation cannot be deleted.');
  if(!row?.revision||String(row.revision)!==String(input.revision||''))problem('AUTOMATION_REVISION_CHANGED','The automation changed. Refresh before deleting.');
  await deleteAutomation(id);return {ok:true,deleted:true};
}
export async function sendAutomationTestEmailCore(input={}){
  await session({manage:true});if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm sending the test email.');
  const automationId=requireId(input.automationId,'Automation ID'),actionId=requireId(input.actionId,'Action ID');
  const toEmail=safe(input.toEmail,254);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail))problem('AUTOMATION_EMAIL_INVALID','Enter a valid recipient email address.');
  const response=await getAutomation(automationId),row=response?.automation||response;
  const action=dict(row?.configuration?.actions)[actionId];
  if(action?.type!=='APP_DEFINED'||action?.appDefinedInfo?.actionKey!=='triggered-emails')problem('AUTOMATION_EMAIL_ACTION_INVALID','Select a supported email action.');
  await sendTestEmail({automationId,actionId},{toEmail});return {ok:true,sent:true};
}
const NODE_TYPE=new Set(['EMAIL','DELAY','CONDITION']);
const TIME_UNIT=new Set(['MINUTES','HOURS','DAYS']);
const IF_OPERATOR=new Set(['eq','gte']);
function compileCondition(n,verifiedTrigger){
  const field=safe(n.field,150),op=safe(n.operator,20),value=safe(n.value,180);
  if(!KEY.test(field)||!verifiedTrigger.variablePaths.includes(field))problem('AUTOMATION_FIELD_NOT_VERIFIED',`Condition property is not a Wix trigger variable: ${field}`);
  if(!IF_OPERATOR.has(op))problem('AUTOMATION_OPERATOR_UNSUPPORTED','Supported Wix formula operators: equals and greater-than-or-equal.');
  if(op==='gte'&&!/^-?\d+(?:\.\d+)?$/.test(value))problem('AUTOMATION_COMPARISON_NUMBER','Numeric comparisons require a number.');
  if(op==='eq'&&!/^[A-Za-z0-9 _.,:@+\-]{1,160}$/.test(value))problem('AUTOMATION_COMPARISON_VALUE','Choose a plain-text literal for the comparison.');
  const compare=op==='gte'?value:`'${value}'`;
  return `{{ ${op}(var('payload.${field}') ; ${compare}) }}`;
}
export async function createAutomationGraphDraftCore(input={}){
  await session({manage:true});
  if(input.confirm!==true)problem('AUTOMATION_CONFIRM_REQUIRED','Confirm that the system may prepare message content and create a draft.');
  const available=await siteTriggers(),trigger=validTrigger(input.trigger,available);
  const nodes=arr(input.nodes),edges=arr(input.edges);
  if(!nodes.length||nodes.length>30||edges.length>60)problem('AUTOMATION_GRAPH_SIZE','Build a workflow with 1–30 steps and 60 connections or fewer.');
  const byId=new Map();for(const n of nodes){const id=requireId(n.id,'Graph node ID'),type=safe(n.type,50).toUpperCase();if(byId.has(id)||!NODE_TYPE.has(type))problem('AUTOMATION_GRAPH_NODE','Duplicate or unsupported workflow step.');byId.set(id,{...n,id,type});}
  const outputs=new Map();for(const e of edges){const src=safe(e.source,120),dst=safe(e.target,120),branch=safe(e.branch,20).toUpperCase();if((src!=='trigger'&&!byId.has(src))||!byId.has(dst)||src===dst)problem('AUTOMATION_GRAPH_EDGE','A graph connector refers to a missing or self-linked step.');const key=src+':'+(src==='trigger'?'START':byId.get(src).type==='CONDITION'?branch:'NEXT');if(outputs.has(key)||!['START','THEN','ELSE','NEXT'].includes(branch)||src!=='trigger'&&byId.get(src).type==='CONDITION'&&!['THEN','ELSE'].includes(branch)||src!=='trigger'&&byId.get(src).type!=='CONDITION'&&branch!=='NEXT')problem('AUTOMATION_GRAPH_BRANCH','Each connector can lead to only one next step; a condition uses THEN / ELSE.');outputs.set(key,dst);}
  const root=outputs.get('trigger:START');if(!root)problem('AUTOMATION_GRAPH_ROOT','Connect the trigger to a first step.');
  const visiting=new Set(),visited=new Set();function check(id){if(visiting.has(id))problem('AUTOMATION_GRAPH_CYCLE','Wix workflows cannot have cyclic graph connectors.');if(visited.has(id))return;visiting.add(id);const n=byId.get(id);for(const branch of n.type==='CONDITION'?['THEN','ELSE']:['NEXT']){const d=outputs.get(id+':'+branch);if(d)check(d);}visiting.delete(id);visited.add(id)}check(root);if(visited.size!==byId.size)problem('AUTOMATION_GRAPH_DISCONNECTED','Connect all workflow steps to the selected trigger.');
  const editorTypes=new Map();const actions={};let emailActionCount=0;
  const contactPath=safe(input.contactPath||'contactId',160);
  for(const n of nodes){const id=n.id,type=safe(n.type,50).toUpperCase();
    if(type==='DELAY'){const quantity=Number(n.amount),unit=safe(n.unit,20).toUpperCase();if(!Number.isInteger(quantity)||quantity<1||quantity>365||!TIME_UNIT.has(unit))problem('AUTOMATION_DELAY_VALUE','Delay must be 1–365 minutes, hours or days.');actions[id]={id,type:'DELAY',namespace:'SKANDI-DELAY',delayInfo:{offsetExpression:`{{${quantity}}}`,offsetTimeUnit:unit,postActionIds:[outputs.get(id+':NEXT')].filter(Boolean)}};continue;}
    if(type==='CONDITION'){actions[id]={id,type:'CONDITION',namespace:'SKANDI-CONDITION',conditionInfo:{orExpressionGroups:[{operator:'OR',booleanExpressions:[compileCondition(n,trigger)]}],truePostActionIds:[outputs.get(id+':THEN')].filter(Boolean),falsePostActionIds:[outputs.get(id+':ELSE')].filter(Boolean)}};continue;}
    const template=await findTemplate(safe(n.templateId,110));verifyVariables(template,trigger);
    if(!trigger.variablePaths.includes(contactPath))problem('AUTOMATION_CONTACT_NOT_IN_TRIGGER','Choose a valid contactId property in this Wix trigger.');
    if(template.emailType==='BUSINESS_CRITICAL'&&input.acknowledgeCritical!==true)problem('AUTOMATION_CRITICAL_APPROVAL','Explicit administrator confirmation is required for business-critical emails.');
    const setup={emailType:template.emailType,recipients:{recipientType:'TRIGGER_CONTACT',triggerContactOptions:{contactIdPath:contactPath}}};
    if(template.emailType==='BUSINESS_TRANSACTIONAL')setup.notificationTopicId=requireId(input.notificationTopicId,'Notification topic');
    if(input.senderDetailsId)setup.senderDetailsId=requireId(input.senderDetailsId,'Sender ID');
    const mapping=await generateActionInputMapping({action:setup,content:content(template)});
    if(!mapping?.appId||!mapping?.actionKey||!mapping?.inputMapping)problem('AUTOMATION_EMAIL_MAPPING','Wix did not provide a complete single-use Send Email mapping.');
    actions[id]={id,type:'APP_DEFINED',namespace:'triggered-emails-1',appDefinedInfo:{appId:mapping.appId,actionKey:mapping.actionKey,inputMapping:mapping.inputMapping,postActionIds:[outputs.get(id+':NEXT')].filter(Boolean),skipConditionOrExpressionGroups:[]}};emailActionCount++;
  }
  if(!emailActionCount)problem('AUTOMATION_GRAPH_NO_EMAIL','The first workflow draft creator requires at least one configured Send Email action. Other Wix action types can be inspected without modification.');
  const request={name:safe(input.name,240)||'SKANDI Workflow',description:'Created in RIAINTRA Automation Control with approved trigger and email template records.',origin:'USER',configuration:{status:'INACTIVE',trigger:{appId:trigger.appId,triggerKey:trigger.triggerKey,filters:[]},rootActionIds:[root],actions}};
  const validation=await validateAutomation(request);
  if(!validationPasses(validation,input.acceptWarnings===true))return{ok:false,created:false,validation,reason:'Validation rejected the workflow. No automation was created; prepared message content may remain.'};
  const response=await createDraftAutomation({automation:request}),record=response?.automation||response;
  if(!record?._id)problem('AUTOMATION_GRAPH_CREATE_UNCONFIRMED','Wix did not confirm the automation ID; check your Wix account before retrying.');
  return{ok:true,created:true,draft:true,active:false,automationId:record._id,actionCount:nodes.length,revision:record.revision||'',message:'Draft created. It will not run until published.'};
}

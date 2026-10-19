// SKANDI V12 — email designer and site-wide Wix Automations workspace.
// Canonical drafts: existing VOY editorial campaign records; Wix remains the live automation authority.
// No secrets, member-contact data, provider credentials, or automation input mappings are stored in templates.
import { automationsV2, triggerCatalog } from '@wix/automations';
import { automationEmailAction } from '@wix/automations-email-actions';
import { auth } from '@wix/essentials';
import { randomUUID } from 'crypto';
import { requireStaffPortalSessionCore } from 'backend/SKANDI_CORE/staffAuth';
import { getVoyAdminBootstrapCore, saveVoyEntityCore, deleteVoyEntityCore } from 'backend/SKANDI_CORE/publicContent';
import { getAutomationAdminSnapshotCore } from 'backend/SKANDI_CORE/automationControl';
import { EMAIL_PLATFORM, EMAIL_WORKFLOWS, COMMON_DYNAMIC_VARIABLE_KEYS } from 'backend/SKANDI_CORE/automationEmailConfig';

const resolveTriggers = auth.elevate(triggerCatalog.resolveTriggers);
const getAutomation = auth.elevate(automationsV2.getAutomation);
const createAutomation = auth.elevate(automationsV2.createAutomation);
const updateAutomation = auth.elevate(automationsV2.updateAutomation);
const validateAutomation = auth.elevate(automationsV2.validateAutomation);
const getEmailContent = auth.elevate(automationEmailAction.getEmailContent);
const setEmailContent = auth.elevate(automationEmailAction.setEmailContent);
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
function content(template){const raw=template.sourceMode==='HTML';return {editorType:raw?'HTML':'MJML', emailSubject:template.subject, emailPreheader:template.preheader, composer:{composerDataJson:raw?template.htmlSource:JSON.stringify({mjml:compileMJML(template)})}};}
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
  const [templates,triggers,automations] = await Promise.allSettled([allTemplates(),siteTriggers(),getAutomationAdminSnapshotCore()]);
  const savedTemplates=templates.status==='fulfilled'?templates.value:[];
  const variableDefinitions=[...new Map(savedTemplates.flatMap(t=>arr(t.customVariables)).filter(v=>v?.path).map(v=>[v.path,{...v,source:'SKANDI_EDITORIAL_DRAFT'}])).values()];
  return {ok:true,templates:savedTemplates,variableDefinitions,templateError:templates.status==='rejected'?safe(templates.reason?.message||'Templates unavailable',300):'',
    triggers:triggers.status==='fulfilled'?triggers.value:[],triggerError:triggers.status==='rejected'?safe(triggers.reason?.message||'Wix trigger registry unavailable',300):'',
    catalogVariables:COMMON_DYNAMIC_VARIABLE_KEYS.map(path=>({path,source:'SKANDI_CATALOG_ONLY'})),
    workflows:Object.entries(EMAIL_WORKFLOWS).map(([key,v])=>({key,category:v.category,audiences:v.audiences,referenceCode:v.referenceCode,emailType:v.emailType})),
    automations:automations.status==='fulfilled'?automations.value.automations:[],automationError:automations.status==='rejected'?safe(automations.reason?.message||'Wix automations unavailable',300):'',
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
  const action={emailType:template.emailType,triggerSchemaContactIdPath:contactPath};
  if(template.emailType==='BUSINESS_TRANSACTIONAL')action.notificationTopicId=requireId(input.notificationTopicId,'Notification topic ID');
  if(input.senderDetailsId)action.senderDetailsId=requireId(input.senderDetailsId,'Sender details ID');
  const mapping=await generateActionInputMapping({action,content:content(template)});
  if(!mapping?.appId||!mapping?.actionKey||!mapping?.inputMapping)problem('EMAIL_MAPPING_FAILED','Wix did not return a complete single-use email action mapping.');
  const aid=randomUUID();
  const automation={name:safe(input.name||template.title,240),description:`SKANDI Media Control email template ${template.entityId}`,origin:'USER',configuration:{status:'INACTIVE',trigger:{appId:trigger.appId,triggerKey:trigger.triggerKey,filters:[]},rootActionIds:[aid],actions:{[aid]:{id:aid,type:'APP_DEFINED',namespace:'triggered-emails-1',appDefinedInfo:{appId:mapping.appId,actionKey:mapping.actionKey,inputMapping:mapping.inputMapping,postActionIds:[],skipConditionOrExpressionGroups:[]}}}}};
  const validation=await validateAutomation(automation);
  if(validation?.valid!==true) return {ok:false,created:false,validation,reason:'Wix rejected this automation configuration; no Wix automation was created.'};
  const created=await createAutomation(automation);
  const record=created?.automation||created;
  if(!record?._id)problem('EMAIL_WIX_CREATE_NOT_CONFIRMED','Wix did not return an automation ID. Review the Wix dashboard before retrying.');
  return {ok:true,created:true,active:false,automationId:record._id,actionId:aid,triggerKey:trigger.triggerKey,variables,revision:record.revision||'',message:'Inactive automation created in Wix. Build conditions, approval steps and activation in the native Wix Automations builder.'};
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
  if(current?.origin!=='USER'||current?.settings?.readonly===true||current?.settings?.disableStatusChange===true)
    problem('AUTOMATION_CONTROL_RESTRICTED','Only editable user-created Wix automations can be activated or paused here.');
  if(!current?.revision||!current?.configuration?.trigger||!current?.configuration?.actions)
    problem('AUTOMATION_CONFIG_UNAVAILABLE','Wix did not supply complete configuration and revision information.');
  const status=input.active?'ACTIVE':'INACTIVE';
  if(current.configuration.status===status)return{ok:true,unchanged:true,automationId:id,status};
  const update={_id:id,revision:current.revision,name:current.name,description:current.description||'',origin:'USER',configuration:{...current.configuration,status}};
  if(status==='ACTIVE'){
    const verification=await validateAutomation(update);
    if(verification?.valid!==true)return{ok:false,validation:verification,reason:'Wix validation did not pass; automation remains unchanged.'};
  }
  const changed=await updateAutomation(id,update);
  if(!changed?._id&&!changed?.automation?._id)problem('AUTOMATION_STATUS_UNCONFIRMED','Wix did not confirm the update. Check Wix before retrying.');
  return{ok:true,automationId:id,status,revision:changed?.revision||changed?.automation?.revision||'',message:'Wix acknowledged the automation status change.'};
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
    const setup={emailType:template.emailType,triggerSchemaContactIdPath:contactPath};
    if(template.emailType==='BUSINESS_TRANSACTIONAL')setup.notificationTopicId=requireId(input.notificationTopicId,'Notification topic');
    if(input.senderDetailsId)setup.senderDetailsId=requireId(input.senderDetailsId,'Sender ID');
    const mapping=await generateActionInputMapping({action:setup,content:content(template)});
    if(!mapping?.appId||!mapping?.actionKey||!mapping?.inputMapping)problem('AUTOMATION_EMAIL_MAPPING','Wix did not provide a complete single-use Send Email mapping.');
    actions[id]={id,type:'APP_DEFINED',namespace:'triggered-emails-1',appDefinedInfo:{appId:mapping.appId,actionKey:mapping.actionKey,inputMapping:mapping.inputMapping,postActionIds:[outputs.get(id+':NEXT')].filter(Boolean),skipConditionOrExpressionGroups:[]}};emailActionCount++;
  }
  if(!emailActionCount)problem('AUTOMATION_GRAPH_NO_EMAIL','The first workflow draft creator requires at least one configured Send Email action. Other Wix action types can be inspected without modification.');
  const request={name:safe(input.name,240)||'SKANDI Workflow',description:'Created in RIAINTRA Automation Control with approved trigger and email template records.',origin:'USER',configuration:{status:'INACTIVE',trigger:{appId:trigger.appId,triggerKey:trigger.triggerKey,filters:[]},rootActionIds:[root],actions}};
  const validation=await validateAutomation(request);
  if(validation?.valid!==true)return{ok:false,created:false,validation,reason:'Wix rejected the workflow graph. No automation was created.'};
  if(input.confirm!==true)return{ok:true,created:false,validation,readyToCreate:true,actionCount:nodes.length,reason:'Wix validation passed. Confirm to create an inactive draft.'};
  const response=await createAutomation(request),record=response?.automation||response;
  if(!record?._id)problem('AUTOMATION_GRAPH_CREATE_UNCONFIRMED','Wix did not confirm the automation ID; check your Wix account before retrying.');
  return{ok:true,created:true,active:false,automationId:record._id,actionCount:nodes.length,revision:record.revision||'',message:'Wix created an inactive automation. Activate only after reviewing conditions and recipients.'};
}

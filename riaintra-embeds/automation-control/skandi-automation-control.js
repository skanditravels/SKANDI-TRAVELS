(()=>{'use strict';
const SOURCE='SKANDI_SF_AUTOMATIONS_EMBED',PARENT='SKANDI_WIX_PARENT';
const $=id=>document.getElementById(id);
const clean=value=>String(value??'').replace(/wix/gi,'system');
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const esc=value=>escapeHTML(clean(value));
let sequence=0,loading=false,automations=[],triggers=[],actions=[],templates=[],workflows=[],selected=null,draft=null,savedDefinition='';
const pending=new Map();
function notice(value,error=false){$('message').textContent=clean(value);$('message').classList.toggle('error',error)}
function call(operation,payload={}){
  return new Promise((resolve,reject)=>{
    const requestId='automation-control-'+(++sequence);
    const timer=setTimeout(()=>{pending.delete(requestId);reject(new Error('The system did not respond. Check your session and try again.'))},20000);
    pending.set(requestId,{resolve,reject,timer});
    window.parent.postMessage({source:SOURCE,type:'AUTOMATION_CONSOLE_'+operation,payload,requestId},'*');
  });
}
function show(section){document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===section));document.querySelectorAll('.section').forEach(s=>s.hidden=s.id!=='s-'+section)}
function write(id,value){$(id).textContent=clean(typeof value==='string'?value:JSON.stringify(value,null,2))}
function date(value){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function selectOptions(id,rows,label,value){const el=$(id),old=el.value;el.innerHTML='<option value="">Select</option>'+rows.map((r,i)=>`<option value="${escapeHTML(value?value(r,i):i)}">${esc(label(r,i))}</option>`).join('');if([...el.options].some(o=>o.value===old))el.value=old}
function renderCounts(){const live=automations.filter(a=>!a.draft&&!a.archived);$('countAutomations').textContent=String(live.length);$('countActive').textContent=String(live.filter(a=>a.status==='ACTIVE').length);$('countTriggers').textContent=String(triggers.length);$('countTemplates').textContent=String(templates.length)}
function renderList(){const q=$('automationSearch').value.trim().toLowerCase(),f=$('automationFilter').value;const rows=automations.filter(a=>(f==='ARCHIVED'?a.archived:!a.archived&&(f==='ALL'||(f==='DRAFT'?(a.draft||a.draftId):a.status===f)))&&[a.name,a.triggerKey,a.status].join(' ').toLowerCase().includes(q));$('listCount').textContent=String(rows.length);$('automationList').innerHTML=rows.length?rows.map(a=>`<button type="button" data-automation="${esc(a.id)}" class="${a.id===selected?.id?'selected':''}"><strong>${esc(a.name)}</strong><small>${a.archived?'Archived':a.draft?'Draft':esc(a.status==='ACTIVE'?'Active':'Inactive')}${a.draftId?' · draft available':''} · ${esc(a.triggerKey||'No event selected')}</small></button>`).join(''):'<p class="subtle">No matching workflows found.</p>'}
function renderSources(){
  selectOptions('editorTrigger',triggers,t=>t.displayName);selectOptions('draftTrigger',triggers,t=>t.displayName);selectOptions('triggerPick',triggers,t=>t.displayName);
  selectOptions('editorAction',actions,a=>a.displayName);selectOptions('actionPick',actions,a=>a.displayName);
  selectOptions('draftTemplate',templates,t=>t.title,t=>t.entityId);selectOptions('editTemplate',templates,t=>t.title,t=>t.entityId);
  selectOptions('catalogWorkflow',workflows,w=>`${w.workflowKey} · ${w.category}`,w=>w.workflowKey);
  selectOptions('emailAutomation',automations.filter(a=>!a.draft&&!a.archived),a=>a.name,a=>a.id);
  $('designList').innerHTML=templates.map(t=>`<div class="panel"><h3>${esc(t.title||'Untitled')}</h3><p>${esc(t.subject||'No subject')}</p><button class="text-action" data-template="${esc(t.entityId)}">Select template →</button></div>`).join('');
}
function render(data){
  automations=Array.isArray(data?.live?.automations)?data.live.automations:[];
  triggers=Array.isArray(data?.workspace?.triggers)?data.workspace.triggers:[];
  actions=Array.isArray(data?.workspace?.actions)?data.workspace.actions:[];
  templates=Array.isArray(data?.workspace?.templates)?data.workspace.templates:[];
  workflows=Array.isArray(data?.platform?.workflows)?data.platform.workflows:[];
  if(selected)selected=automations.find(a=>a.id===selected.id)||null;
  renderCounts();renderList();renderSources();
  const issues=[data?.live?.archiveError,data?.workspace?.triggerError,data?.workspace?.actionError,data?.workspace?.templateError].filter(Boolean);
  notice(issues.length?'Some sources could not be loaded: '+issues.map(clean).join('; '):`${automations.length} workflows available.`,!!issues.length);
}
async function load(){if(loading)return;loading=true;notice('Loading automation data…');try{render(await call('REFRESH'))}catch(e){notice(e.message,true)}finally{loading=false}}
async function selectAutomation(id){
  selected=automations.find(a=>a.id===id)||null;if(!selected)return;
  renderList();$('emptyDetail').hidden=true;$('automationDetail').hidden=false;
  $('detailTitle').textContent=clean(selected.name);$('detailDescription').textContent=clean(selected.description||'');$('detailStatus').textContent=selected.archived?'Archived':selected.draft?'Draft':selected.status==='ACTIVE'?'Active':'Inactive';
  $('detailTrigger').textContent=clean(selected.triggerKey||'Not selected');$('detailActions').textContent=String(selected.actionCount||0);$('detailUpdated').textContent=date(selected.updatedAt);
  $('toggleStatus').hidden=!!selected.draft||!!selected.archived;$('toggleStatus').disabled=selected.statusChangeAllowed===false;$('toggleStatus').textContent=selected.status==='ACTIVE'?'Pause':'Activate';
  $('removeAutomation').hidden=!!selected.draft;$('removeAutomation').disabled=selected.deleteAllowed===false;
  $('archiveAutomation').hidden=!!selected.draft;$('archiveAutomation').disabled=selected.editable===false;$('archiveAutomation').textContent=selected.archived?'Restore':'Archive';
  $('openDraft').disabled=selected.editable===false||!!selected.archived;$('openDraft').textContent=selected.draft?'Open draft':'Edit draft';
  $('graphView').textContent=selected.draft?'Open the draft to inspect its definition.':'Loading steps…';
  if(selected.draft)return;
  try{const result=await call('GRAPH',{automationId:id});if(selected?.id!==id)return;const nodes=result?.graph?.nodes||[];$('graphView').innerHTML=nodes.length?nodes.map(n=>`<div><strong>${esc(n.type==='TRIGGER'?'Event':n.type==='APP_DEFINED'?'Action':n.type)}</strong> · ${esc(n.label||'Step')}${n.delayAmount?` · ${esc(n.delayAmount)} ${esc(n.delayUnit)}`:''}</div>`).join(''):'<p>No steps returned.</p>'}
  catch(e){$('graphView').textContent=clean(e.message)}
}
function useDraft(value){draft=value;savedDefinition=JSON.stringify(value.definition,null,2);$('draftTitle').textContent=clean(value.definition?.name||'Workflow draft');$('draftMeta').textContent='Draft revision '+clean(value.revision||'—');$('draftDefinition').value=savedDefinition;$('editorEmpty').hidden=true;$('editorBody').hidden=false;write('draftResult','');show('editor')}
function draftArgs(){if(!draft)throw new Error('Open a draft first.');return {draftId:draft.id,originalId:draft.originalId,originalRevision:draft.originalRevision,revision:draft.revision}}
function definition(){try{const value=JSON.parse($('draftDefinition').value);if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value}catch(_){throw new Error('The workflow definition is not valid JSON.')}}
function updateDefinition(value){$('draftDefinition').value=JSON.stringify(value,null,2)}
function isDirty(){return $('draftDefinition').value!==savedDefinition}
async function perform(fn){try{return await fn()}catch(e){notice(e.message,true);return null}}
function getSelectedTrigger(id){const v=$(id).value;return v===''?null:triggers[Number(v)]}
function getSelectedAction(id){const v=$(id).value;return v===''?null:actions[Number(v)]}
function uuid(){if(window.crypto?.randomUUID)return window.crypto.randomUUID();throw new Error('This browser cannot generate a step identifier. Use a secure connection.')}
function addStep(){const d=definition();d.configuration=d.configuration||{};const config=d.configuration;config.actions=config.actions||{};config.rootActionIds=config.rootActionIds||[];const id=uuid(),type=$('stepType').value;let step={_id:id,type,namespace:'step-'+id.slice(0,8)};
  if(type==='DELAY')step.delayInfo={offsetExpression:'{{1}}',offsetTimeUnit:'DAYS',postActionIds:[]};
  else if(type==='CONDITION')step.conditionInfo={orExpressionGroups:[],truePostActionIds:[],falsePostActionIds:[]};
  else {const a=getSelectedAction('editorAction');if(!a)throw new Error('Choose a system action.');step.appDefinedInfo={appId:a.appId,actionKey:a.actionKey,inputMapping:{},postActionIds:[]}}
  const existing=Object.values(config.actions);config.actions[id]=step;
  if(!config.rootActionIds.length)config.rootActionIds=[id];
  else {const last=existing[existing.length-1];let link=last?.type==='DELAY'?last.delayInfo?.postActionIds:last?.type==='APP_DEFINED'?last.appDefinedInfo?.postActionIds:null;if(Array.isArray(link)&&!link.length)link.push(id);else notice('Step added. Connect it in the workflow definition before validation.')}
  updateDefinition(d);
}
function templatePayload(){const trigger=getSelectedTrigger('draftTrigger'),entityId=$('draftTemplate').value;if(!trigger||!entityId)throw new Error('Select a template and an event.');return{entityId,trigger:{appId:trigger.appId,triggerKey:trigger.triggerKey},name:$('draftName').value.trim(),contactPath:$('draftContact').value.trim()||'contactId',notificationTopicId:$('draftTopic').value.trim(),senderDetailsId:$('draftSender').value.trim(),acknowledgeCritical:$('draftCritical').checked}}
async function loadEmailActions(){const id=$('emailAutomation').value;$('emailAction').innerHTML='<option value="">Select an action</option>';if(!id)return;const response=await call('GRAPH',{automationId:id});const nodes=(response?.graph?.nodes||[]).filter(x=>x.type==='APP_DEFINED'&&x.label==='triggered-emails');selectOptions('emailAction',nodes,n=>n.label,n=>n.id);if(!nodes.length)notice('No supported message action was found for this workflow.')}
function emailTarget(){const automationId=$('emailAutomation').value,actionId=$('emailAction').value;if(!automationId||!actionId)throw new Error('Select a workflow and a message action.');return{automationId,actionId}}
window.addEventListener('message',event=>{
  if(event.source!==window.parent)return;const m=event.data;if(!m||m.source!==PARENT)return;
  if(m.type==='AUTOMATION_CONSOLE_CONTROLLER_ATTACHED'){load();return}
  const task=pending.get(m.requestId);if(!task)return;pending.delete(m.requestId);clearTimeout(task.timer);
  if(m.type==='AUTOMATION_CONSOLE_ERROR')task.reject(new Error(clean(m.payload?.message||'The request failed.')));
  else if(m.type==='AUTOMATION_CONSOLE_BOOTSTRAP')task.resolve(m.payload||{});
  else if(m.type==='AUTOMATION_CONSOLE_RESULT')task.resolve(m.payload?.data||{});
  else task.reject(new Error('The system returned an unexpected response.'));
});
document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.section)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.open)));
$('refresh').addEventListener('click',load);
$('automationSearch').addEventListener('input',renderList);$('automationFilter').addEventListener('change',renderList);
$('automationList').addEventListener('click',e=>{const b=e.target.closest('[data-automation]');if(b)selectAutomation(b.dataset.automation)});
$('newDraft').addEventListener('click',()=>perform(async()=>{const name=window.prompt('Name the new workflow:');if(!name?.trim())return;if(!window.confirm('Create a new workflow draft?'))return;const r=await call('CREATE_BLANK_DRAFT',{name:name.trim(),confirm:true});if(!r.ok)throw new Error(r.reason||'Draft creation failed.');useDraft(r.draft);notice('Draft created. It will not run until published.');await load()}));
$('openDraft').addEventListener('click',()=>perform(async()=>{if(!selected)return;if(!selected.draft&&!window.confirm('Create or open a draft for this workflow?'))return;const r=await call('OPEN_DRAFT',{automationId:selected.id,standalone:!!selected.draft,confirm:true});if(!r.ok)throw new Error(r.reason||'The draft could not be opened.');useDraft(r.draft);notice('Draft opened.')}));
$('toggleStatus').addEventListener('click',()=>perform(async()=>{if(!selected)return;const active=selected.status!=='ACTIVE';if(!window.confirm(`${active?'Activate':'Pause'} ${clean(selected.name)}?`))return;let r=await call('SET_STATUS',{automationId:selected.id,revision:selected.revision,active,confirm:true});if(!r.ok&&r.validation?.status==='VALID_WITH_WARNINGS'){write('graphView',r.validation);if(!window.confirm('Validation returned warnings. Review the details. Activate anyway?'))return;r=await call('SET_STATUS',{automationId:selected.id,revision:selected.revision,active,confirm:true,acceptWarnings:true})}if(!r.ok){if(r.validation)write('graphView',r.validation);throw new Error(r.reason||'The status was not changed.')}notice(r.message||'Status changed.');await load();await selectAutomation(r.automationId||selected.id)}));
$('archiveAutomation').addEventListener('click',()=>perform(async()=>{
  if(!selected)return;const archived=!selected.archived;
  if(archived&&selected.status==='ACTIVE')throw new Error('Pause this workflow before moving it to the archive.');
  if(!window.confirm(`${archived?'Archive':'Restore'} ${clean(selected.name)}? Restoring preserves its current status.`))return;
  const id=selected.id,r=await call('SET_ARCHIVED',{automationId:id,revision:selected.revision,archived,confirm:true});
  if(!r.ok)throw new Error('The archive change was not confirmed.');$('automationFilter').value=archived?'ARCHIVED':'ALL';await load();await selectAutomation(id);notice(archived?'Workflow archived.':'Workflow restored.');
}));
$('removeAutomation').addEventListener('click',()=>perform(async()=>{if(!selected)return;if(!window.confirm(`Delete ${clean(selected.name)}? For an installed workflow this may restore the original version.`))return;const r=await call('DELETE',{automationId:selected.id,revision:selected.revision,confirm:true});if(!r.ok)throw new Error('The workflow was not deleted.');selected=null;$('emptyDetail').hidden=false;$('automationDetail').hidden=true;await load();notice('Workflow deleted.')}));
$('stepType').addEventListener('change',()=>{$('editorActionField').hidden=$('stepType').value!=='APP_DEFINED'});
$('applyTrigger').addEventListener('click',()=>perform(async()=>{const t=getSelectedTrigger('editorTrigger');if(!t)throw new Error('Choose an event.');const d=definition();d.configuration=d.configuration||{};d.configuration.trigger={appId:t.appId,triggerKey:t.triggerKey,filters:[]};updateDefinition(d)}));
$('addStep').addEventListener('click',()=>perform(async()=>addStep()));
$('saveDraft').addEventListener('click',()=>perform(async()=>{const r=await call('SAVE_DRAFT',{...draftArgs(),definition:definition()});if(!r.ok)throw new Error(r.reason||'The draft was not saved.');useDraft(r.draft);notice('Draft saved.')}));
$('validateDraft').addEventListener('click',()=>perform(async()=>{if(isDirty())throw new Error('Save the draft before validating it.');const r=await call('VALIDATE_DRAFT',draftArgs());write('draftResult',r.validation||r);notice(r.valid?(r.hasWarnings?'Validation returned warnings. Review them before publishing.':'Validation passed.'):'Validation found issues. Review the details.',!r.valid)}));
$('publishDraft').addEventListener('click',()=>perform(async()=>{if(isDirty())throw new Error('Save the draft before publishing it.');if(!window.confirm('Publish this draft and activate the workflow? This can overwrite changes to the original workflow.'))return;let r=await call('PUBLISH_DRAFT',{...draftArgs(),confirm:true});if(!r.ok&&r.hasWarnings){write('draftResult',r.validation||r);if(!window.confirm('Validation returned warnings. Review the details. Publish and activate despite these warnings?'))return;r=await call('PUBLISH_DRAFT',{...draftArgs(),confirm:true,acceptWarnings:true})}if(!r.ok){write('draftResult',r.validation||r);throw new Error(r.reason||'The draft was not published.')}draft=null;$('editorBody').hidden=true;$('editorEmpty').hidden=false;await load();notice('Workflow published.')}));
$('deleteDraft').addEventListener('click',()=>perform(async()=>{if(!window.confirm('Delete this draft? This cannot be undone.'))return;const r=await call('DELETE_DRAFT',{...draftArgs(),confirm:true});if(!r.ok)throw new Error('The draft was not deleted.');draft=null;$('editorBody').hidden=true;$('editorEmpty').hidden=false;await load();notice('Draft deleted.')}));
$('emailAutomation').addEventListener('change',()=>perform(loadEmailActions));
$('inspectEmail').addEventListener('click',()=>perform(async()=>{const r=await call('INSPECT',emailTarget());write('emailResult',r);if(!r.ok)throw new Error(r.reason||'The message could not be inspected.')}));
$('previewEmail').addEventListener('click',()=>perform(async()=>{const r=await call('PREVIEW',emailTarget());if(!r.ok)throw new Error(r.reason||'The message could not be previewed.');$('emailPreview').srcdoc=String(r.html||'');$('emailPreview').hidden=false;write('emailResult',r.emailSubject||'Preview generated.')}));
$('sendTest').addEventListener('click',()=>perform(async()=>{const target=emailTarget(),toEmail=$('testEmail').value.trim();if(!toEmail)throw new Error('Enter a test recipient.');if(!window.confirm(`Send a real test message to ${toEmail}?`))return;const r=await call('SEND_TEST_EMAIL',{...target,toEmail,confirm:true});if(!r.ok)throw new Error('The test message was not confirmed.');notice('The system accepted the test message request.')}));
$('createEmailDraft').addEventListener('click',()=>perform(async()=>{const p=templatePayload();if(!window.confirm('Prepare message content and create a workflow draft?'))return;const r=await call('CREATE_DRAFT',{...p,confirm:true});write('templateResult',r);if(!r.ok)throw new Error(r.reason||'The draft was not created.');await load();notice('Message draft created. It will not run until published.')}));
$('syncDesigned').addEventListener('click',()=>perform(async()=>{const p={...templatePayload(),...emailTarget()};if(!window.confirm('Replace the selected message content? Changes to a live message can affect the next send.'))return;const r=await call('SYNC_DESIGNED',{...p,confirm:true});write('templateResult',r);if(!r.ok)throw new Error(r.reason||'The content was not updated.');notice('Message content updated.')}));
function catalogPayload(){const workflow=workflows.find(w=>w.workflowKey===$('catalogWorkflow').value);if(!workflow)throw new Error('Select an approved workflow.');const audience=$('catalogAudience').value;if(!(workflow.audiences||[]).includes(audience))throw new Error('This workflow does not support the selected audience.');return{...emailTarget(),workflowKey:workflow.workflowKey,audience,expectedTriggerKey:workflow.triggerKey||''}}
$('catalogValidate').addEventListener('click',()=>perform(async()=>{const r=await call('DRY_RUN',catalogPayload());write('catalogResult',r);if(!r.ok)throw new Error(r.reason||'The content could not be checked.');notice('Content checked. No message was changed.')}));
$('catalogSync').addEventListener('click',()=>perform(async()=>{const p=catalogPayload();if(!window.confirm('Replace the selected message with the approved content? Live messages may change on their next send.'))return;const r=await call('SYNC',p);write('catalogResult',r);if(!r.ok)throw new Error(r.reason||'The content was not updated.');notice('Approved content updated.')}));
$('openStudio').addEventListener('click',()=>window.parent.postMessage({source:SOURCE,type:'MASTER_NAVIGATE',payload:{path:'/riaintra/success-factors/media-control'}},'*'));
$('triggerPick').addEventListener('change',()=>{const t=getSelectedTrigger('triggerPick');write('triggerDetails',t?{name:t.displayName,fields:t.variablePaths,schemaAvailable:t.schemaAvailable}:'')});
$('actionPick').addEventListener('change',()=>{const a=getSelectedAction('actionPick');write('actionDetails',a?{name:a.displayName,appId:a.appId,actionKey:a.actionKey,inputSchema:a.inputSchema}:'')});
function editTemplate(id=''){
  const t=templates.find(x=>x.entityId===id)||null;$('editTemplate').value=t?.entityId||'';
  $('templateName').value=t?.title||'';$('templateSubject').value=t?.subject||'';$('templatePreheader').value=t?.preheader||'';
  $('templateType').value=t?.emailType||'PROMOTIONAL';$('templateAudience').value=t?.audience||'CUSTOMER';
  const visual=t?.sourceMode==='VISUAL';$('templateHTML').value=visual?'':(t?.htmlSource||'');$('templateHTML').disabled=!!visual;
  $('templateEditorNote').textContent=visual?'This visual template retains its existing blocks. Edit its content in the visual editor.':'Include the complete document, beginning with a doctype. Executable scripts and embedded frames are not accepted.';
  $('deleteTemplate').disabled=!t;
}
$('editTemplate').addEventListener('change',()=>editTemplate($('editTemplate').value));
$('resetTemplate').addEventListener('click',()=>editTemplate());
$('saveTemplate').addEventListener('click',()=>perform(async()=>{
  const old=templates.find(t=>t.entityId===$('editTemplate').value),visual=old?.sourceMode==='VISUAL';
  const value={...(old||{}),entityId:old?.entityId||'',title:$('templateName').value.trim(),subject:$('templateSubject').value.trim(),preheader:$('templatePreheader').value.trim(),emailType:$('templateType').value,audience:$('templateAudience').value,sourceMode:visual?'VISUAL':'HTML',htmlSource:visual?'':$('templateHTML').value,blocks:visual?(old.blocks||[]):[],customVariables:old?.customVariables||[]};
  const r=await call('SAVE_TEMPLATE',value);if(!r.ok)throw new Error('The template was not saved.');await load();editTemplate(r.template.entityId);notice('Template saved.');
}));
$('deleteTemplate').addEventListener('click',()=>perform(async()=>{
  const id=$('editTemplate').value,t=templates.find(x=>x.entityId===id);if(!t)return;if(!window.confirm('Delete this reusable template? Existing workflow messages will not be changed.'))return;
  const r=await call('DELETE_TEMPLATE',{entityId:id});if(!r.ok)throw new Error('The template was not deleted.');await load();editTemplate();notice('Template deleted.');
}));
$('designList').addEventListener('click',e=>{const b=e.target.closest('[data-template]');if(b){$('draftTemplate').value=b.dataset.template;editTemplate(b.dataset.template);$('templateEditor').scrollIntoView({behavior:'smooth'});}});
editTemplate();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();

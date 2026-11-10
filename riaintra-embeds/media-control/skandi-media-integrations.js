(()=>{"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pending=new Map();let seq=0;
function rpc(action,input={}){
  const requestId=`media-integration-${Date.now()}-${++seq}`;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(requestId);reject(new Error('The request timed out. Please try again.'))},30000);
    pending.set(requestId,{resolve,reject,timer});
    window.parent.postMessage({source:'SKANDI_MEDIA_CONTROL',type:'MEDIA_CONTROL_WEBSITE_ACTION',payload:{requestId,action,input}},'*');
  });
}
window.addEventListener('message',event=>{
  const message=event.data||{};if(event.source!==window.parent||message.source!=='SKANDI_WIX_PARENT')return;
  if(message.type!=='MEDIA_CONTROL_WEBSITE_RESULT'&&message.type!=='MEDIA_CONTROL_ERROR')return;
  const p=message.payload||{},item=pending.get(p.requestId);if(!item)return;
  clearTimeout(item.timer);pending.delete(p.requestId);
  if(message.type==='MEDIA_CONTROL_ERROR')item.reject(new Error(p.message||'The request failed.'));else item.resolve(p.result||{});
});
const cards=[['wikimedia','Wikimedia Commons','Editorial image discovery'],['openverse','Openverse','Openly licensed image discovery'],['fontsource','Fontsource','Website font discovery'],['canva','Canva','SKANDI brand templates'],['research','Wikipedia','Destination research sources'],['search-console','Google Search Console','Search performance for SKANDI Travels']];
function connectionView(host){
  if(host.dataset.mounted)return;host.dataset.mounted='1';
  host.innerHTML=`<section class="mi-intro"><h2>Connections</h2><p>Test a service to see its current response. The result applies to this session.</p></section><div class="mi-grid">${cards.map(([id,name,description])=>`<article class="mi-card" data-mi-card="${id}"><h3>${name}</h3><p>${description}</p><div class="mi-state" data-mi-state>Not tested</div><button type="button" class="btn" data-mi-test="${id}">Test connection</button><span data-mi-error role="alert"></span>${id==='canva'?'<button type="button" class="btn primary" data-mi-canva>Browse templates</button><div data-mi-canva-results></div>':''}${id==='search-console'?'<button type="button" class="btn primary" data-mi-search-report>View search report</button><div data-mi-search-results></div>':''}</article>`).join('')}</div><p class="mi-help">Writing suggestions are available from the page and article editors. Image optimization and other providers are not configured in this workspace.</p>`;
}
function researchView(host){
 if(host.dataset.mounted)return;host.dataset.mounted='1';
 host.innerHTML=`<section class="mi-card"><h2>Destination research</h2><p>Find source material for editorial review. Check details against official local sources before publishing.</p><div class="mi-form"><label>Destination<input type="text" class="input" data-mi-destination placeholder="Stockholm, Sweden" maxlength="120"></label><label>Language<select class="input" data-mi-language><option value="en">English</option><option value="sv">Swedish</option><option value="no">Norwegian Bokmål</option><option value="da">Danish</option><option value="fi">Finnish</option></select></label><button type="button" class="btn primary" data-mi-research>Find sources</button><span data-mi-error role="alert"></span></div><div data-mi-research-results></div></section>`;
}
function mount(){document.querySelectorAll('[data-media-connections]').forEach(connectionView);document.querySelectorAll('[data-media-research]').forEach(researchView)}
function errslot(button){let slot=button.nextElementSibling;if(!slot?.hasAttribute('data-mi-error')){slot=document.createElement('span');slot.dataset.miError='';slot.setAttribute('role','alert');button.insertAdjacentElement('afterend',slot)}return slot}
async function run(button,operation){
 const error=errslot(button);if(error)error.textContent='';button.disabled=true;const old=button.textContent;button.textContent='Working…';
 try{await operation()}catch(e){if(error)error.textContent=e.message||'The request failed.';if(button.dataset.miTest){const state=button.closest('.mi-card').querySelector('[data-mi-state]');state.textContent='Could not verify';state.dataset.state='error'}}finally{if(button.isConnected){button.disabled=false;button.textContent=old}}
}
function addWriter(button){
 let writer=button.parentElement.parentElement.querySelector('.mi-writer');if(writer){writer.hidden=!writer.hidden;return}
 const field=document.getElementById(button.dataset.mediaWriting);if(!field)return;
 writer=document.createElement('section');writer.className='mi-writer';
 writer.innerHTML=`<h3>Writing assistant</h3><p>Creates a suggestion from the current field. Review it before applying.</p><div class="mi-form"><label>Language<select class="input" data-mi-copy-language><option value="en">English</option><option value="sv">Swedish</option><option value="no">Norwegian Bokmål</option><option value="da">Danish</option><option value="fi">Finnish</option></select></label><label>Instruction<input class="input" data-mi-copy-instruction maxlength="400" placeholder="Improve clarity and tone"></label><button type="button" class="btn primary" data-mi-generate>Generate suggestion</button><span data-mi-error role="alert"></span></div><label>Suggestion<textarea data-mi-suggestion rows="7" placeholder="Your suggestion will appear here."></textarea></label><button type="button" class="btn" data-mi-apply disabled>Apply to field</button>`;
 writer._target=field;writer._snapshot='';button.parentElement.insertAdjacentElement('afterend',writer);
}
function appendCanvaTemplates(host,result,append=false){
 if(!append)host.innerHTML='';
 if(!result.templates.length&&!append)host.innerHTML='<p>No templates were returned for this service app.</p>';
 else if(result.templates.length)host.insertAdjacentHTML('beforeend',result.templates.map(x=>`<div class="mi-result"><b>${esc(x.title||'Untitled template')}</b>${x.createUrl?` <a href="${esc(x.createUrl)}" target="_blank" rel="noopener noreferrer">Open in Canva</a>`:''}</div>`).join(''));
 host.querySelector('[data-mi-canva-more]')?.remove();
 if(result.continuation)host.insertAdjacentHTML('beforeend',`<button type="button" class="btn" data-mi-canva-more="${esc(result.continuation)}">Load more templates</button>`);
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.mediaWriting){addWriter(button);return}
 if(button.dataset.miTest){run(button,async()=>{const result=await rpc('TEST_MEDIA_CONNECTOR',{provider:button.dataset.miTest});const state=button.closest('.mi-card').querySelector('[data-mi-state]');state.textContent=`Responded · ${result.count} result${result.count===1?'':'s'}`;state.dataset.state='ok'});return}
 if(button.hasAttribute('data-mi-canva')){run(button,async()=>{const result=await rpc('LIST_CANVA_TEMPLATES',{});appendCanvaTemplates(button.closest('.mi-card').querySelector('[data-mi-canva-results]'),result)});return}
 if(button.hasAttribute('data-mi-canva-more')){run(button,async()=>{const host=button.closest('[data-mi-canva-results]'),result=await rpc('LIST_CANVA_TEMPLATES',{continuation:button.dataset.miCanvaMore});appendCanvaTemplates(host,result,true)});return}
 if(button.hasAttribute('data-mi-search-report')){run(button,async()=>{const result=await rpc('GET_SEARCH_CONSOLE_REPORT',{days:28});const host=button.closest('.mi-card').querySelector('[data-mi-search-results]');host.innerHTML=`<p>${esc(result.startDate)} – ${esc(result.endDate)} · Google data may be delayed.</p>`+(result.rows.length?`<div class="mi-table-wrap"><table><thead><tr><th>Page</th><th>Clicks</th><th>Impressions</th></tr></thead><tbody>${result.rows.map(row=>`<tr><td>${esc(row.page)}</td><td>${esc(row.clicks)}</td><td>${esc(row.impressions)}</td></tr>`).join('')}</tbody></table></div>`:'<p>No rows were returned for this period.</p>')});return}
 if(button.hasAttribute('data-mi-research')){run(button,async()=>{const host=button.closest('[data-media-research]'),result=await rpc('RESEARCH_DESTINATION',{destination:host.querySelector('[data-mi-destination]').value,language:host.querySelector('[data-mi-language]').value});const out=host.querySelector('[data-mi-research-results]');out.innerHTML=result.sources.length?`<h3>Sources for ${esc(result.destination)}</h3>`+result.sources.map(source=>`<article class="mi-result"><h4><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></h4><p>${esc(source.summary)}</p></article>`).join(''):'<p>No matching sources were returned.</p>'});return}
 if(button.hasAttribute('data-mi-generate')){run(button,async()=>{const writer=button.closest('.mi-writer'),field=writer._target;if(!field?.isConnected)throw new Error('The original field is no longer open.');writer._snapshot=field.value;const result=await rpc('CREATE_EDITORIAL_SUGGESTION',{title:document.getElementById(field.id==='pageBody'?'pageTitle':'articleTitle')?.value||'',text:field.value,instruction:writer.querySelector('[data-mi-copy-instruction]').value,language:writer.querySelector('[data-mi-copy-language]').value});writer.querySelector('[data-mi-suggestion]').value=result.suggestion;writer.querySelector('[data-mi-apply]').disabled=false});return}
 if(button.hasAttribute('data-mi-apply')){const writer=button.closest('.mi-writer'),field=writer._target;if(!field?.isConnected){const error=errslot(button);if(error)error.textContent='The original field is no longer open.';return}if(field.value!==writer._snapshot&&!confirm('This field changed after the suggestion was generated. Replace the current text?'))return;field.value=writer.querySelector('[data-mi-suggestion]').value;field.dispatchEvent(new Event('input',{bubbles:true}));writer._snapshot=field.value;return}
});
let scheduled=false;new MutationObserver(()=>{if(scheduled||!document.body?.isConnected)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}).observe(document.body,{childList:true,subtree:true});mount();
})();

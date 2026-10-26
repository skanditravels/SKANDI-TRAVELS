(function(){
  'use strict';
  const requests=new Map(),clone=v=>JSON.parse(JSON.stringify(v));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let pages=[],assets=[],properties=[],root,frame,selected,previewHTML='',pageKey='',nonce='',revision=0,dirty=false,design={version:1,elements:[]},history=[],future=[];
  const el=id=>root?.querySelector('[data-we="'+id+'"]');
  function status(message,error=false){if(el('status')){el('status').textContent=message;el('status').dataset.error=String(error);}}
  function rpc(action,input){return new Promise((resolve,reject)=>{const requestId=crypto.randomUUID();const timer=setTimeout(()=>{requests.delete(requestId);reject(new Error('The server did not respond. Your unsaved changes are still here.'));},45000);requests.set(requestId,{resolve,reject,timer});parent.postMessage({source:'SKANDI_MEDIA_CONTROL',type:'MEDIA_CONTROL_WEBSITE_ACTION',payload:{action,input,requestId}},'*');});}
  function sendPreview(){frame?.contentWindow?.postMessage({source:'SKANDI_MEDIA_CONTROL',type:'WEBSITE_PREVIEW_DESIGN',nonce,payload:design},'*');}
  function snapshot(){history.push(clone(design));if(history.length>40)history.shift();future=[];dirty=true;}
  function current(){return selected&&design.elements.find(x=>x.selector===selected.selector);}
  function edit(change){if(!selected)return;snapshot();let item=current();if(!item){item={selector:selected.selector,styles:{all:{},tablet:{},mobile:{}}};design.elements.push(item);}change(item);sendPreview();status('Unsaved changes');}
  function styleControl(property,value,computed){
    const choices={display:['block','inline','inline-block','flex','inline-flex','grid','none'],'font-family':['Arial','Georgia','Tahoma','Montserrat','Inter','Playfair Display','Cormorant Garamond','serif','sans-serif'],'font-weight':['100','200','300','400','500','600','700','800','900'],'font-style':['normal','italic'],'text-align':['left','center','right','justify'],'text-transform':['none','uppercase','lowercase','capitalize'],'text-decoration':['none','underline','line-through'],'flex-direction':['row','column','row-reverse','column-reverse'],'flex-wrap':['nowrap','wrap','wrap-reverse'],'justify-content':['flex-start','center','flex-end','space-between','space-around','space-evenly'],'align-items':['stretch','flex-start','center','flex-end','baseline'],'align-content':['stretch','flex-start','center','flex-end','space-between','space-around'],'border-style':['none','solid','dashed','dotted','double'],'object-fit':['cover','contain','fill','scale-down','none'],'background-size':['cover','contain','auto'],'background-position':['center','top','bottom','left','right','left top','right top','left bottom','right bottom'],'object-position':['center','top','bottom','left','right'],'box-shadow':['none','0 2px 8px #0002','0 8px 24px #0003','0 16px 48px #0004']};
    choices['font-family']=[...new Set([...choices['font-family'],...(design.fonts||[]).map(f=>f.family)])];
    const label=property.replaceAll('-',' '),data=' data-we-style="'+property+'"';
    if(choices[property])return '<label>'+esc(label)+'<select'+data+'><option value="">Keep original</option>'+choices[property].map(v=>'<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>';
    if(['color','background-color','border-color'].includes(property)){
      const rgb=String(value||computed).match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
      const hex=/^#[a-f0-9]{6}$/i.test(value)?value:rgb?'#'+rgb.slice(1).map(v=>Number(v).toString(16).padStart(2,'0')).join(''):'#022e64';
      return '<label>'+esc(label)+'<input type="color"'+data+' value="'+hex+'"></label>';
    }
    if(/^(?:(?:min-|max-)?(?:width|height)|font-size|line-height|letter-spacing|padding(?:-.+)?|margin(?:-.+)?|gap|row-gap|column-gap|border-width|border-radius|flex-basis)$/.test(property)){
      const parts=String(value).match(/^(-?[\d.]+)(px|rem|em|%|vw|vh)?$/),defaultParts=String(computed).match(/^(-?[\d.]+)/),unit=parts?.[2]||(property==='line-height'?'':'px');
      return '<label>'+esc(label)+'<span class="we-size"><input type="number" step="any"'+data+' data-we-unit-input="1" value="'+esc(parts?.[1]||'')+'" placeholder="'+esc(defaultParts?.[1]||'Original')+'"><select data-we-unit="'+property+'">'+['px','rem','em','%','vw','vh',''].map(v=>'<option value="'+v+'" '+(v===unit?'selected':'')+'>'+(v||'Ratio')+'</option>').join('')+'</select></span></label>';
    }
    if(['opacity','order','flex-grow','flex-shrink'].includes(property))return '<label>'+esc(label)+'<input type="number" step="any"'+data+' value="'+esc(value)+'" placeholder="'+esc(computed)+'"></label>';
    return '<label>'+esc(label)+'<input'+data+' value="'+esc(value)+'" placeholder="'+esc(computed||'Keep original')+'"></label>';
  }
  function inspector(){
    if(!selected){el('inspector').innerHTML='<h3>Select an element</h3><p class="we-note">Click text, an image, a card or a section in the preview. Select its parent to style the surrounding layout.</p>';return;}
    const item=current()||{},viewport=el('viewport').value;
    const names={h1:'Heading',h2:'Heading',h3:'Heading',p:'Paragraph',article:'Card',section:'Section',div:'Container',a:'Link',img:'Image',button:'Button'};
    el('inspector').innerHTML='<h3>'+esc(names[selected.tag]||'Element')+'</h3><button class="btn" data-we-action="parent">Select parent</button><button class="btn" data-we-action="reset">Reset element</button>'+
      (selected.text!==null?'<label>Text<textarea data-we="text">'+esc(Object.hasOwn(item,'text')?item.text:selected.text)+'</textarea></label>':'')+
      (selected.tag==='a'?'<label>Link<input data-we="href" value="'+esc(item.href??selected.href)+'"></label>':'')+
      '<label>Image from Supabase<select data-we="asset"><option value="">Keep existing image</option>'+assets.filter(a=>a.visibility==='PUBLIC'&&a.assetType==='IMAGE'&&a.bucket==='skandi-public-assets').map(a=>'<option value="'+esc(a.id)+'" '+(a.id===item.assetId?'selected':'')+'>'+esc(a.displayName||a.originalName)+'</option>').join('')+'</select></label>'+
      '<label>Image placement<select data-we="imageMode"><option value="image" '+(selected.image?'selected':'')+'>Image element</option><option value="background" '+(!selected.image?'selected':'')+'>Background</option></select></label>'+
      '<label>Image description<input data-we="alt" value="'+esc(item.alt??selected.alt)+'"></label><p class="we-note">Upload images in Assets / Media, then reload this page’s assets. Existing images stay unchanged until you select a replacement.</p>'+
      (selected.currentImage?'<button class="btn" data-we-action="import-existing">Copy current image to Supabase</button>':'')+
      '<details open><summary>Appearance — '+esc(viewport)+'</summary>'+properties.filter(p=>p!=='background-image').map(p=>styleControl(p,item.styles?.[viewport]?.[p]||'',selected.styles?.[p]||'')).join('')+'</details>';
  }
  function preview(html){
    nonce=crypto.randomUUID();
    const doc=new DOMParser().parseFromString(html,'text/html');
    // The editor displays a layout preview, never executes booking, authentication,
    // payment or page-controller actions from the document being edited.
    doc.querySelectorAll('script,iframe,object,embed,base,meta[http-equiv]').forEach(n=>n.remove());
    doc.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes])if(/^on/i.test(a.name))n.removeAttribute(a.name);});
    const config=doc.createElement('script');config.textContent='window.SKANDI_WEBSITE_DESIGN_CONFIG='+JSON.stringify({preview:true,nonce,properties})+';('+window.SKANDIWebsiteDesignRuntime.toString()+')();';doc.body.append(config);
    frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;
  }
  async function load(key){
    if(dirty&&!confirm('Discard unsaved changes and open another page?')){el('page').value=pageKey;return;}
    status('Loading page and draft…');
    const result=await rpc('GET_WEBSITE_DESIGN',{pageKey:key});
    const source=await rpc('GET_WEBSITE_PREVIEW',{pageKey:key});
    pageKey=result.page.key;revision=result.revision;design=clone(result.draft);selected=null;dirty=false;history=[];future=[];previewHTML=source.html;preview(previewHTML);inspector();status('Draft loaded. Changes are private until you publish.');
  }
  async function save(action){
    if(!pageKey)throw new Error('Open a page first.');
    if(action==='PUBLISH'&&!confirm('Publish this page’s presentation changes?'))return;
    status(action==='PUBLISH'?'Publishing…':'Saving…');
    const result=await rpc('SAVE_WEBSITE_DESIGN',{pageKey,action,expectedRevision:revision,design});
    revision=result.revision;design=clone(result.draft);dirty=false;history=[];future=[];sendPreview();inspector();status(action==='PUBLISH'?'Published. Open public pages refresh within about a minute.':action==='ROLLBACK'?'Previous published version restored.':'Draft saved.');
  }
  async function search(){status('Searching…');const result=await rpc('SEARCH_MEDIA_SOURCES',{provider:el('provider').value,query:el('query').value});el('results').innerHTML=(result.items||[]).map((x,i)=>'<article class="we-source-card">'+(x.thumbnail?'<img src="'+esc(x.thumbnail)+'" alt="'+esc(x.title)+'" loading="lazy">':'')+'<strong>'+esc(x.title)+'</strong><small>'+esc([x.creator,x.license].filter(Boolean).join(' · '))+'</small><a href="'+esc(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Source and license</a>'+(x.provider==='fontsource'?'<p><button class="btn" data-font-index="'+i+'">Use font on selected element</button></p>':'<p><button class="btn" data-import-index="'+i+'">Import to Supabase</button></p>')+'</article>').join('')||'<p>No results.</p>';el('results')._items=result.items||[];status('Search complete. Review each asset’s source and license before importing.');}
  window.SKANDIWebsiteStudioMount=function(data={}){
    pages=data.pages||pages;assets=data.assets||assets;
    const section=document.getElementById('panel-websiteeditor');if(!section)return;
    if(root===section){if(el('page').options.length<=1)pageOptions();return;}
    root=section;root.innerHTML='<div class="we-toolbar"><select data-we="page"><option value="">Select a public page</option></select><button class="btn" data-we-action="load">Load page</button><select data-we="viewport"><option value="all">Desktop / all sizes</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select><button class="btn" data-we-action="undo">Undo</button><button class="btn" data-we-action="redo">Redo</button><button class="btn" data-we-action="save">Save draft</button><button class="btn primary" data-we-action="publish">Publish</button><button class="btn" data-we-action="restore">Discard draft</button><button class="btn" data-we-action="rollback">Roll back publication</button></div><div class="we-status" data-we="status" role="status"></div><p class="we-note">Layout preview. Live inventory, account and booking data run on the public site. Pages without a successful published build cannot be previewed yet.</p><div class="we-workspace"><div class="we-canvas"><iframe data-we="preview" title="Public website layout preview" sandbox="allow-scripts"></iframe></div><aside class="we-inspector" data-we="inspector"></aside></div><details><summary>Discover media and fonts</summary><div class="we-toolbar"><select data-we="provider"><option value="wikimedia">Wikimedia Commons</option><option value="openverse">Openverse</option><option value="fontsource">Fontsource</option></select><input data-we="query" placeholder="Search by subject or font family"><button class="btn" data-we-action="search">Search</button></div><div class="we-media-results" data-we="results"></div></details>';
    frame=el('preview');pageOptions();inspector();
    root.addEventListener('click',async event=>{try{
      const action=event.target.closest('[data-we-action]')?.dataset.weAction;
      if(action==='load')await load(el('page').value);
      if(action==='save')await save('SAVE');if(action==='publish')await save('PUBLISH');
      if(action==='restore'&&confirm('Replace this draft with the currently published version?'))await save('RESTORE_PUBLISHED');
      if(action==='rollback'&&confirm('Restore the previous published version?'))await save('ROLLBACK');
      if(action==='search')await search();
      if(action==='import-existing'&&selected?.currentImage){status('Copying the existing image into Supabase…');const target=selected.selector,result=await rpc('IMPORT_WEBSITE_IMAGE',{pageKey,url:selected.currentImage});if(!result.asset)throw new Error('The image needs duplicate review in Assets / Media.');assets=[result.asset,...assets.filter(a=>a.id!==result.asset.id)];if(selected?.selector!==target){status('Image imported. Select it from the library to apply it.');return;}edit(item=>{item.assetId=result.asset.id;item.assetUrl=result.asset.publicUrl;item.imageMode=selected.image?'image':'background';});inspector();status('Image copied to Supabase and applied to the draft.');}
      if(action==='parent'&&selected)frame.contentWindow.postMessage({source:'SKANDI_MEDIA_CONTROL',type:'WEBSITE_PREVIEW_PARENT',nonce,payload:{selector:selected.selector}},'*');
      if(action==='reset'&&selected){snapshot();design.elements=design.elements.filter(x=>x.selector!==selected.selector);sendPreview();inspector();}
      if(action==='undo'&&history.length){future.push(clone(design));design=history.pop();dirty=true;sendPreview();inspector();}
      if(action==='redo'&&future.length){history.push(clone(design));design=future.pop();dirty=true;sendPreview();inspector();}
      const fontButton=event.target.closest('[data-font-index]');
      if(fontButton){if(!selected)throw new Error('Select an element in the preview first.');const choice=el('results')._items[Number(fontButton.dataset.fontIndex)],target=selected.selector;const result=await rpc('GET_WEBSITE_FONT',{id:choice.id,weight:choice.weights?.includes(400)?400:choice.weights?.[0]||400});if(selected?.selector!==target)throw new Error('Selection changed; choose the font again.');edit(item=>{design.fonts=[...(design.fonts||[]).filter(f=>f.id!==result.font.id),result.font];item.styles.all['font-family']=result.font.family;item.styles.all['font-weight']=String(result.font.weight);});inspector();status('Font applied to the draft.');}
      const importButton=event.target.closest('[data-import-index]');
      if(importButton){const item=el('results')._items[Number(importButton.dataset.importIndex)];if(!confirm('Have you reviewed the license and source for this image and confirmed it can be used on SKANDI?'))return;status('Importing into Supabase…');const result=await rpc('IMPORT_MEDIA_SOURCE',{provider:item.provider,id:item.id,licenseReviewed:true});if(!result.asset)throw new Error(result.needsReview?'A possible duplicate needs review in Assets / Media.':'Import did not return an asset.');assets=[result.asset,...assets.filter(a=>a.id!==result.asset.id)];inspector();status('Imported into the Supabase Asset Library. Select the image in the inspector.');}
    }catch(error){status(error.message,true);}});
    root.addEventListener('change',event=>{try{
      const target=event.target,name=target.dataset.we;
      if(name==='viewport'){frame.style.width=target.value==='mobile'?'390px':target.value==='tablet'?'820px':'100%';inspector();return;}
      if(!selected)return;
      if(target.dataset.weStyle||target.dataset.weUnit){const property=target.dataset.weStyle||target.dataset.weUnit,input=root.querySelector('[data-we-style="'+property+'"]'),unit=root.querySelector('[data-we-unit="'+property+'"]');const value=input.value.trim()+(input.value.trim()&&unit?unit.value:'');if(value&&!CSS.supports(property,value))throw new Error('Invalid '+property+' value.');edit(item=>{const mode=el('viewport').value;item.styles[mode]||={};if(value)item.styles[mode][property]=value;else delete item.styles[mode][property];});}
      if(['text','alt','href'].includes(name))edit(item=>item[name]=target.value);
      if(name==='asset'){const asset=assets.find(a=>a.id===target.value);edit(item=>{if(asset){item.assetId=asset.id;item.assetUrl=asset.publicUrl;item.imageMode=el('imageMode').value;item.alt=el('alt').value;}else {delete item.assetId;delete item.assetUrl;}});}
      if(name==='imageMode'&&current()?.assetId)edit(item=>item.imageMode=target.value);
    }catch(error){status(error.message,true);}});
  };
  function pageOptions(){const value=el('page').value;el('page').innerHTML='<option value="">Select a public page</option>'+pages.filter(p=>p.path&&!/^\/(riaintra|altea)(\/|$)/.test(p.path)).map(p=>'<option value="'+esc(p.key)+'">'+esc(p.label)+'</option>').join('');el('page').value=value;}
  window.addEventListener('message',event=>{
    const m=event.data||{};
    if(event.source===parent&&m.source==='SKANDI_WIX_PARENT'){
      if(m.type==='MEDIA_CONTROL_EDITORIAL_CATALOG'){pages=m.payload?.pages||[];properties=m.payload?.styleProperties||[];if(root){pageOptions();inspector();}}
      if(m.type==='MEDIA_CONTROL_LIBRARY'){assets=m.payload?.assets||assets;if(root)inspector();}
      if(m.type==='MEDIA_CONTROL_WEBSITE_RESULT'||m.type==='MEDIA_CONTROL_ERROR'){const pending=requests.get(m.payload?.requestId);if(pending){clearTimeout(pending.timer);requests.delete(m.payload.requestId);m.type==='MEDIA_CONTROL_ERROR'?pending.reject(new Error(m.payload.message)):pending.resolve(m.payload.result);}}
    }
    if(event.source===frame?.contentWindow&&m.source==='SKANDI_WEBSITE_PREVIEW'&&m.nonce===nonce){if(m.type==='WEBSITE_PREVIEW_READY')sendPreview();if(m.type==='WEBSITE_PREVIEW_SELECTED'){selected=m.payload;inspector();}}
  });
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  window.SKANDIWebsiteStudioMount();
  parent.postMessage({source:'SKANDI_MEDIA_CONTROL',type:'MEDIA_CONTROL_CATALOG_REQUEST',payload:{}},'*');
})();

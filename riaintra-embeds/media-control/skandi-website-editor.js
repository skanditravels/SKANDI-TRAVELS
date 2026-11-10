(function(){
  'use strict';
  const requests=new Map(),clone=v=>JSON.parse(JSON.stringify(v)),arr=v=>Array.isArray(v)?v:[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let pages=[],assets=[],properties=[],root,frame,selected,previewHTML='',pageKey='',nonce='',revision=0,dirty=false,design={version:1,elements:[]},history=[],future=[];
  let homeCards=[],homeCardAssets=[],homeCardId='',homeCardsLoaded=false,homeCardDirty=false,activeMode='visual',busy=false;
  const busyControls=new Map();
  function setBusy(value){busy=value;if(value){root.querySelectorAll('button,input,select,textarea').forEach(control=>{busyControls.set(control,control.disabled);control.disabled=true})}else{busyControls.forEach((disabled,control)=>{if(control.isConnected)control.disabled=disabled});busyControls.clear()}}
  const el=id=>root?.querySelector('[data-we="'+id+'"]');
  const homeEl=id=>root?.querySelector('[data-home="'+id+'"]');
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
  function publicImageAssets(){return assets.filter(a=>a.visibility==='PUBLIC'&&a.status==='ACTIVE'&&a.assetType==='IMAGE'&&['skandi-public-assets','inventory-media','aircraft-assets','uniform-assets'].includes(a.bucket));}
  function blocksEditor(item){
    if(!selected?.canAddBlocks)return '';
    const blocks=arr(item.blocks);
    return '<details class="we-block-editor"><summary>Added content ('+blocks.length+')</summary><p class="we-note">Add content inside this selected section. Existing page elements and operational data stay in place.</p><div class="we-block-add"><button class="btn" type="button" data-we-add-block="heading">+ Heading</button><button class="btn" type="button" data-we-add-block="text">+ Text</button><button class="btn" type="button" data-we-add-block="button">+ Button</button><button class="btn" type="button" data-we-add-block="image">+ Image</button></div>'+blocks.map((block,index)=>'<div class="we-block-row"><strong>'+esc(block.type)+'</strong>'+(['heading','text','button'].includes(block.type)?'<label>Text<textarea data-we-block-id="'+esc(block.id)+'" data-we-block-field="text">'+esc(block.text||'')+'</textarea></label>':'')+(block.type==='button'?'<label>Destination link<input data-we-block-id="'+esc(block.id)+'" data-we-block-field="href" value="'+esc(block.href||'')+'" placeholder="/destinations"></label>':'')+(block.type==='image'?'<label>Image<select data-we-block-id="'+esc(block.id)+'" data-we-block-field="assetId"><option value="">Choose an image</option>'+publicImageAssets().map(a=>'<option value="'+esc(a.id)+'" '+(a.id===block.assetId?'selected':'')+'>'+esc(a.name||a.id)+'</option>').join('')+'</select></label><label>Image description<input data-we-block-id="'+esc(block.id)+'" data-we-block-field="alt" value="'+esc(block.alt||'')+'"></label>':'')+'<div class="we-block-actions"><button type="button" class="btn" data-we-block-move="up" data-we-block-id="'+esc(block.id)+'" '+(index===0?'disabled':'')+'>Move up</button><button type="button" class="btn" data-we-block-move="down" data-we-block-id="'+esc(block.id)+'" '+(index===blocks.length-1?'disabled':'')+'>Move down</button><button type="button" class="btn" data-we-block-remove="'+esc(block.id)+'">Remove</button></div></div>').join('')+'</details>';
  }
  function setMobileView(view){const workspace=el('workspace');if(!workspace)return;workspace.dataset.mobileView=view;root.querySelectorAll('[data-we-mobile-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.weMobileView===view)));}
  function inspector(){
    if(!selected){el('inspector').innerHTML='<h3>Select an element</h3><p class="we-note">Click text, an image, a card or a section in the preview. Select its parent to style the surrounding layout.</p>';return;}
    const item=current()||{},viewport=el('viewport').value;
    const names={h1:'Heading',h2:'Heading',h3:'Heading',p:'Paragraph',article:'Card',section:'Section',div:'Container',a:'Link',img:'Image',button:'Button'};
    el('inspector').innerHTML='<h3>'+esc(names[selected.tag]||'Element')+'</h3><button class="btn" data-we-action="parent">Select parent</button><button class="btn" data-we-action="reset">Reset element</button>'+
      (selected.text!==null&&!['input','textarea'].includes(selected.tag)?'<label>Text<textarea data-we="text">'+esc(Object.hasOwn(item,'text')?item.text:selected.text)+'</textarea></label>':'')+
      (selected.tag==='a'?'<label>Link<input data-we="href" value="'+esc(item.href??selected.href)+'"></label>':'')+
      (['input','textarea'].includes(selected.tag)?'<label>Placeholder text<input data-we="placeholder" value="'+esc(item.placeholder??selected.placeholder)+'"></label>':'')+
      '<label>Choose an image<select data-we="asset"><option value="">Keep existing image</option>'+assets.filter(a=>a.visibility==='PUBLIC'&&a.status==='ACTIVE'&&a.assetType==='IMAGE'&&['skandi-public-assets','inventory-media','aircraft-assets','uniform-assets'].includes(a.bucket)).map(a=>'<option value="'+esc(a.id)+'" '+(a.id===item.assetId?'selected':'')+'>'+esc(a.displayName||a.originalName)+'</option>').join('')+'</select></label>'+
      '<label>Image placement<select data-we="imageMode"><option value="image" '+(selected.image?'selected':'')+'>Image element</option><option value="background" '+(!selected.image?'selected':'')+'>Background</option></select></label>'+
      '<label>Image description<input data-we="alt" value="'+esc(item.alt??selected.alt)+'"></label><p class="we-note">Upload images in Asset Library, then reload this page’s assets. Existing images stay unchanged until you select a replacement.</p>'+
      (selected.currentImage?'<button class="btn" data-we-action="import-existing">Add current image to library</button>':'')+
      blocksEditor(item)+'<details><summary>Appearance — '+esc(viewport)+'</summary>'+properties.filter(p=>p!=='background-image').map(p=>styleControl(p,item.styles?.[viewport]?.[p]||'',selected.styles?.[p]||'')).join('')+'</details>';
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
    if(!key)throw new Error('Choose a page first.');
    if(dirty&&!confirm('Discard unsaved changes and open another page?')){el('page').value=pageKey;return;}
    status('Loading page and draft…');
    const result=await rpc('GET_WEBSITE_DESIGN',{pageKey:key});
    const source=await rpc('GET_WEBSITE_PREVIEW',{pageKey:key});
    pageKey=result.page.key;revision=result.revision;design=clone(result.draft);selected=null;dirty=false;history=[];future=[];previewHTML=source.html;preview(previewHTML);inspector();status('Draft loaded. Changes are private until you publish.');
  }
  async function save(action){
    if(!pageKey)throw new Error('Open a page first.');
    if(el('page').value!==pageKey)throw new Error('Load the selected page before saving.');
    if(action==='PUBLISH'&&!confirm('Publish this page’s presentation changes?'))return;
    status(action==='PUBLISH'?'Publishing…':'Saving…');
    const result=await rpc('SAVE_WEBSITE_DESIGN',{pageKey,action,expectedRevision:revision,design});
    revision=result.revision;design=clone(result.draft);dirty=false;history=[];future=[];sendPreview();inspector();status(action==='PUBLISH'?'Published. Open public pages refresh within about a minute.':action==='ROLLBACK'?'Previous published version restored.':'Draft saved.');
  }
  async function search(){status('Searching…');const result=await rpc('SEARCH_MEDIA_SOURCES',{provider:el('provider').value,query:el('query').value});el('results').innerHTML=(result.items||[]).map((x,i)=>'<article class="we-source-card">'+(x.thumbnail?'<img src="'+esc(x.thumbnail)+'" alt="'+esc(x.title)+'" loading="lazy">':'')+'<strong>'+esc(x.title)+'</strong><small>'+esc([x.creator,x.license].filter(Boolean).join(' · '))+'</small><a href="'+esc(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Source and license</a>'+(x.provider==='fontsource'?'<p><button class="btn" data-font-index="'+i+'">Use font on selected element</button></p>':'<p><button class="btn" data-import-index="'+i+'">Import to Supabase</button></p>')+'</article>').join('')||'<p>No results.</p>';el('results')._items=result.items||[];status('Search complete. Review each asset’s source and license before importing.');}
  function homeField(name){return root?.querySelector('[data-home-field="'+name+'"]');}
  function homeCardStatus(message,error=false){const host=homeEl('status');if(host){host.textContent=message||'';host.dataset.error=String(error);}}
  async function loadHomeCards(){
    homeCardStatus('Loading featured Home cards…');
    const result=await rpc('GET_HOME_CARD_MANAGER',{});
    homeCards=result.cards||[];homeCardAssets=result.assets||[];homeCardsLoaded=true;
    if(!homeCardId||!homeCards.some(card=>card.publicId===homeCardId))homeCardId=homeCards[0]?.publicId||'';
    homeCardDirty=false;renderHomeCards();homeCardStatus('Featured Home cards loaded.');
  }
  function currentHomeCard(){return homeCards.find(card=>card.publicId===homeCardId)||null;}
  function collectHomeCardForm(){
    const card=currentHomeCard();if(!card)return null;
    const value=name=>homeField(name)?.value??'';
    const checked=name=>homeField(name)?.checked===true;
    const packageAddOns=[...root.querySelectorAll('[data-addon-row]')].map(row=>({
      name:row.querySelector('[data-addon-name]')?.value.trim()||'',
      retailAmount:row.querySelector('[data-addon-amount]')?.value??'',
      quantity:row.querySelector('[data-addon-quantity]')?.value??'1'
    })).filter(item=>item.name||item.retailAmount!=='');
    return {
      publicId:card.publicId,
      productType:value('productType'),
      productStatus:value('productStatus'),
      customerVisible:checked('customerVisible'),
      priceEnabled:checked('priceEnabled'),
      currency:value('currency'),
      basePrice:value('basePrice'),
      marginPct:value('marginPct'),
      imageAssetId:value('imageAssetId'),
      imageAlt:value('imageAlt'),
      homePrice:{
        origin:value('origin'),destination:value('destination'),departureDaysOut:value('departureDaysOut'),
        returnDaysOut:value('returnDaysOut'),adults:value('adults'),
        childAges:value('childAges').split(',').map(v=>v.trim()).filter(Boolean).map(Number),
        cabinClass:value('cabinClass'),maxConnections:value('maxConnections'),supplierTimeout:value('supplierTimeout'),packageAddOns
      }
    };
  }
  function renderHomeCards(){
    const host=homeEl('content');if(!host)return;
    const selected=currentHomeCard();
    const list=homeCards.map(card=>'<button type="button" class="hc-card '+(card.publicId===homeCardId?'active':'')+'" data-home-card="'+esc(card.publicId)+'"><span class="hc-thumb">'+(card.imageUrl?'<img src="'+esc(card.imageUrl)+'" alt="'+esc(card.imageAlt||'')+'" loading="lazy">':'')+'</span><span><b>'+esc(card.title||card.publicId)+'</b><small>'+esc(card.entityType||'Home card')+' · '+esc(card.publicId)+'</small><small>'+esc(card.cachedPrice!==null&&card.cachedPrice!==undefined?new Intl.NumberFormat('en-US',{style:'currency',currency:card.cacheCurrency||card.currency||'USD'}).format(Number(card.cachedPrice)):card.cacheStatus||'Price not configured')+'</small></span></button>').join('');
    if(!selected){host.innerHTML='<div class="hc-empty">No featured Home cards are available. Mark a public inventory item as Homepage Featured, then refresh.</div>';return;}
    const hp=selected.homePrice||{},assets=homeCardAssets.filter(asset=>asset.visibility==='PUBLIC'&&asset.assetType==='IMAGE'&&asset.bucket==='skandi-public-assets'&&asset.status==='ACTIVE');
    const options='<option value="">Use the inventory image</option>'+assets.map(asset=>'<option value="'+esc(asset.id)+'" '+(asset.id===selected.imageAssetId?'selected':'')+'>'+esc(asset.displayName||asset.originalName||asset.id)+'</option>').join('');
    const addOns=arr(hp.packageAddOns).map((item,index)=>'<div class="hc-addon" data-addon-row><label>Name<input data-addon-name value="'+esc(item.name||'')+'" maxlength="120" placeholder="Airport transfer"></label><label>Retail amount<input data-addon-amount type="number" min="0" step="0.01" value="'+esc(item.retailAmount??'')+'"></label><label>Qty<input data-addon-quantity type="number" min="1" max="99" step="1" value="'+esc(item.quantity??1)+'"></label><button type="button" class="btn" data-home-action="remove-addon" data-addon-index="'+index+'" aria-label="Remove add-on">Remove</button></div>').join('');
    host.innerHTML='<div class="hc-layout"><aside class="hc-list"><div class="hc-list-head"><h3>Featured Home cards</h3><button type="button" class="btn" data-home-action="refresh">Refresh</button></div>'+list+'</aside><section class="hc-editor"><div class="hc-heading"><div><h3>'+esc(selected.title||'Home card')+'</h3><p>'+esc(selected.entityType||'')+' · '+esc(selected.publicId)+'</p></div><div class="hc-price-state"><b>'+esc(selected.cacheStatus||'PENDING')+'</b><small>'+(selected.checkedAt?'Checked '+esc(new Date(selected.checkedAt).toLocaleString()):'No cached price')+'</small></div></div><div class="hc-grid"><label>Product type<select data-home-field="productType"><option value="flight_only" '+(selected.productType==='flight_only'?'selected':'')+'>Flight only</option><option value="charter_package" '+(selected.productType==='charter_package'?'selected':'')+'>Charter package</option></select></label><label>Product status<select data-home-field="productStatus"><option value="DRAFT" '+(selected.productStatus==='DRAFT'?'selected':'')+'>Draft</option><option value="PUBLISHED" '+(['PUBLISHED','ACTIVE'].includes(selected.productStatus)?'selected':'')+'>Published</option></select></label><label>Currency<select data-home-field="currency">'+['USD','SEK','NOK','DKK','EUR'].map(code=>'<option value="'+code+'" '+((selected.currency||'USD')===code?'selected':'')+'>'+code+'</option>').join('')+'</select></label><label class="hc-check"><input data-home-field="customerVisible" type="checkbox" '+(selected.customerVisible?'checked':'')+'> Customer visible</label><label class="hc-check"><input data-home-field="priceEnabled" type="checkbox" '+(selected.priceEnabled?'checked':'')+'> Enable dynamic flight pricing</label><label>Origin IATA<input data-home-field="origin" value="'+esc(hp.origin||'')+'" maxlength="3" placeholder="JFK"></label><label>Destination IATA<input data-home-field="destination" value="'+esc(hp.destination||'')+'" maxlength="3" placeholder="ARN"></label><label>Departure days from today<input data-home-field="departureDaysOut" type="number" min="1" max="330" value="'+esc(hp.departureDaysOut??60)+'"></label><label>Return days from today<input data-home-field="returnDaysOut" type="number" min="2" max="365" value="'+esc(hp.returnDaysOut??'')+'" placeholder="Optional"></label><label>Adults<input data-home-field="adults" type="number" min="1" max="9" value="'+esc(hp.adults??1)+'"></label><label>Child ages, comma separated<input data-home-field="childAges" value="'+esc(arr(hp.childAges).join(', '))+'" placeholder="7, 12"></label><label>Cabin<select data-home-field="cabinClass">'+[['economy','Economy'],['premium_economy','Premium Economy'],['business','Business'],['first','First']].map(([value,label])=>'<option value="'+value+'" '+((hp.cabinClass||'economy')===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label><label>Maximum connections<select data-home-field="maxConnections">'+[0,1,2].map(value=>'<option value="'+value+'" '+(Number(hp.maxConnections??1)===value?'selected':'')+'>'+value+'</option>').join('')+'</select></label><label>Package base price<input data-home-field="basePrice" type="number" min="0" step="0.01" value="'+esc(selected.basePrice??0)+'"></label><label>Margin %<input data-home-field="marginPct" type="number" min="0" max="1000" step="0.01" value="'+esc(selected.marginPct??0)+'"></label><label>Supplier timeout (ms)<input data-home-field="supplierTimeout" type="number" min="2000" max="20000" step="1000" value="'+esc(hp.supplierTimeout??15000)+'"></label></div><div class="hc-note hc-publish-note">Set Product status to Published and enable Customer visible for the photo and price to appear on public Home.</div><div class="hc-addon-section"><div class="hc-list-head"><div><h4>Charter package add-ons</h4><p>Each amount is multiplied by quantity and added to the package base.</p></div><button type="button" class="btn" data-home-action="add-addon">Add add-on</button></div>'+(addOns||'<p class="hc-note">No Media Manager add-ons configured. Existing travel product components are also included.</p>')+'<p class="hc-note">For flight-only cards, add-ons are ignored. Keep amounts in '+esc(selected.currency||'USD')+'.</p></div><div class="hc-photo"><div><h4>Home card photo</h4><p>Select a public image from the Supabase Asset Library. This overrides the inventory image on Home only.</p><label>Image<select data-home-field="imageAssetId">'+options+'</select></label><label>Alt text<input data-home-field="imageAlt" value="'+esc(selected.imageAlt||'')+'" maxlength="500" placeholder="Describe the destination photo"></label></div><div class="hc-photo-preview" data-home-photo-preview>'+((selected.imageUrl||selected.fallbackImage)?'<img src="'+esc(selected.imageUrl||selected.fallbackImage)+'" alt="'+esc(selected.imageAlt||'')+'">':'<span>No photo selected</span>')+'</div></div><div class="hc-actions"><button type="button" class="btn primary" data-home-action="save">Save Home card</button><span class="hc-note">Price refresh runs every six hours. Final fare is checked in Booking.</span></div></section></div>';
  }
  async function setMode(mode){
    activeMode=mode;
    el('visual-panel').hidden=mode!=='visual';el('homecards-panel').hidden=mode!=='homecards';
    root.querySelectorAll('[data-we-mode]').forEach(button=>button.classList.toggle('active',button.dataset.weMode===mode));
    if(mode==='homecards'&&!homeCardsLoaded)await loadHomeCards();
  }
  async function saveHomeCard(){
    const input=collectHomeCardForm();if(!input)return;
    homeCardStatus('Saving Home card settings…');
    const result=await rpc('SAVE_HOME_CARD_MANAGER',input);
    homeCards=result.cards||[];homeCardAssets=result.assets||homeCardAssets;homeCardsLoaded=true;
    homeCardId=input.publicId;homeCardDirty=false;renderHomeCards();homeCardStatus('Saved. Home will use this image and price configuration.');
  }
  function syncHomeFormToCard(){
    const input=collectHomeCardForm(),card=currentHomeCard();if(!input||!card)return;
    Object.assign(card,{productType:input.productType,productStatus:input.productStatus,customerVisible:input.customerVisible,currency:input.currency,basePrice:Number(input.basePrice),marginPct:Number(input.marginPct),priceEnabled:input.priceEnabled,homePrice:input.homePrice,imageAssetId:input.imageAssetId,imageAlt:input.imageAlt});
    const asset=homeCardAssets.find(row=>row.id===input.imageAssetId);card.imageUrl=asset?.publicUrl||card.fallbackImage||'';
  }
  window.SKANDIWebsiteStudioMount=function(data={}){
    pages=data.pages||pages;assets=data.assets||assets;
    const section=document.getElementById('panel-websiteeditor');if(!section)return;
    if(root===section){if(el('page').options.length<=1)pageOptions();return;}
    root=section;root.innerHTML='<div class="we-intro"><h2>Make your website yours</h2><p>Choose a page, select an element in the preview, then save and publish your changes.</p></div><div class="we-modebar"><button type="button" class="active" data-we-mode="visual">Page editor</button><button type="button" data-we-mode="homecards">Home cards &amp; pricing</button></div><div data-we="visual-panel"><div class="we-toolbar"><label class="we-page-search">Find page<input type="search" data-we="pageQuery" placeholder="Search pages"></label><label class="we-page-picker">Page<select data-we="page"><option value="">Select a public page</option></select></label><button class="btn" data-we-action="load">Open page</button><label class="we-viewport-picker">Preview<select data-we="viewport"><option value="all">Desktop / all sizes</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select></label><button class="btn" data-we-action="save">Save draft</button><button class="btn primary" data-we-action="publish">Publish</button><details class="we-more"><summary>More actions</summary><div><button class="btn" data-we-action="undo">Undo</button><button class="btn" data-we-action="redo">Redo</button><button class="btn" data-we-action="restore">Discard draft</button><button class="btn" data-we-action="rollback">Roll back publication</button></div></details></div><div class="we-status" data-we="status" role="status"></div><p class="we-note">Layout preview. Live inventory, account and booking data run on the public site. Pages without a successful published build cannot be previewed yet.</p><div class="we-mobile-switch"><button type="button" data-we-mobile-view="preview" aria-pressed="true">Page preview</button><button type="button" data-we-mobile-view="inspector" aria-pressed="false">Edit selection</button></div><div class="we-workspace" data-we="workspace" data-mobile-view="preview"><div class="we-canvas"><iframe data-we="preview" title="Public website layout preview" sandbox="allow-scripts"></iframe></div><aside class="we-inspector" data-we="inspector"></aside></div><details><summary>Discover media and fonts</summary><div class="we-toolbar"><select data-we="provider"><option value="wikimedia">Wikimedia Commons</option><option value="openverse">Openverse</option><option value="fontsource">Fontsource</option></select><input data-we="query" placeholder="Search by subject or font family"><button class="btn" data-we-action="search">Search</button></div><div class="we-media-results" data-we="results"></div></details></div><section data-we="homecards-panel" hidden><div class="hc-status" data-home="status" role="status"></div><div data-home="content"></div></section>';
    frame=el('preview');pageOptions();inspector();
    root.addEventListener('click',async event=>{try{
      if(busy)return;
      const mobile=event.target.closest('[data-we-mobile-view]')?.dataset.weMobileView;if(mobile){setMobileView(mobile);return;}
      const addBlock=event.target.closest('[data-we-add-block]')?.dataset.weAddBlock;
      if(addBlock&&selected?.canAddBlocks){const id='block-'+crypto.randomUUID();edit(item=>{item.blocks||=[];if(item.blocks.length>=30)throw new Error('This section has reached its content limit.');item.blocks.push({id,type:addBlock,...(addBlock==='image'?{alt:''}:{text:''})});});inspector();return;}
      const removeBlock=event.target.closest('[data-we-block-remove]')?.dataset.weBlockRemove;if(removeBlock){edit(item=>{item.blocks=arr(item.blocks).filter(block=>block.id!==removeBlock)});inspector();return;}
      const moveButton=event.target.closest('[data-we-block-move]');if(moveButton){edit(item=>{const blocks=arr(item.blocks),index=blocks.findIndex(block=>block.id===moveButton.dataset.weBlockId),target=index+(moveButton.dataset.weBlockMove==='up'?-1:1);if(index>=0&&target>=0&&target<blocks.length)[blocks[index],blocks[target]]=[blocks[target],blocks[index]];item.blocks=blocks});inspector();return;}
      const mode=event.target.closest('[data-we-mode]')?.dataset.weMode;
      if(mode==='visual'||mode==='homecards'){await setMode(mode);return;}
      const cardButton=event.target.closest('[data-home-card]');
      if(cardButton){const next=cardButton.dataset.homeCard;if(next!==homeCardId&&homeCardDirty&&!confirm('Discard unsaved changes to this Home card?'))return;homeCardId=next;homeCardDirty=false;renderHomeCards();homeCardStatus('Editing '+(currentHomeCard()?.title||homeCardId)+'.');return;}
      const homeAction=event.target.closest('[data-home-action]')?.dataset.homeAction;
      if(homeAction==='refresh'){if(homeCardDirty&&!confirm('Discard unsaved Home card changes and refresh?'))return;await loadHomeCards();return;}
      if(homeAction==='save'){setBusy(true);try{await saveHomeCard()}finally{setBusy(false)}return;}
      if(homeAction==='add-addon'){syncHomeFormToCard();homeCards.find(card=>card.publicId===homeCardId).homePrice.packageAddOns.push({name:'',retailAmount:'',quantity:1});homeCardDirty=true;renderHomeCards();homeCardStatus('Unsaved changes');return;}
      if(homeAction==='remove-addon'){syncHomeFormToCard();const item=homeCards.find(card=>card.publicId===homeCardId);item.homePrice.packageAddOns.splice(Number(event.target.closest('[data-home-action]').dataset.addonIndex),1);homeCardDirty=true;renderHomeCards();homeCardStatus('Unsaved changes');return;}
      const action=event.target.closest('[data-we-action]')?.dataset.weAction;
      if(['load','save','publish','restore','rollback'].includes(action)&&busy)return;
      if(['load','save','publish','restore','rollback'].includes(action))setBusy(true);
      try{
      if(action==='load')await load(el('page').value);
      if(action==='save')await save('SAVE');if(action==='publish')await save('PUBLISH');
      if(action==='restore'&&confirm('Replace this draft with the currently published version?'))await save('RESTORE_PUBLISHED');
      if(action==='rollback'&&confirm('Restore the previous published version?'))await save('ROLLBACK');
      }finally{if(busy)setBusy(false)}
      if(action==='search')await search();
      if(action==='import-existing'&&selected?.currentImage){status('Adding the existing image to the library…');const target=selected.selector,result=await rpc('IMPORT_WEBSITE_IMAGE',{pageKey,url:selected.currentImage});if(!result.asset)throw new Error('The image needs duplicate review in Assets / Media.');assets=[result.asset,...assets.filter(a=>a.id!==result.asset.id)];if(selected?.selector!==target){status('Image imported. Select it from the library to apply it.');return;}edit(item=>{item.assetId=result.asset.id;item.assetUrl=result.asset.publicUrl;item.imageMode=selected.image?'image':'background';});inspector();status('Image added to the library and applied to the draft.');}
      if(action==='parent'&&selected)frame.contentWindow.postMessage({source:'SKANDI_MEDIA_CONTROL',type:'WEBSITE_PREVIEW_PARENT',nonce,payload:{selector:selected.selector}},'*');
      if(action==='reset'&&selected){snapshot();design.elements=design.elements.filter(x=>x.selector!==selected.selector);sendPreview();inspector();}
      if(action==='undo'&&history.length){future.push(clone(design));design=history.pop();dirty=true;sendPreview();inspector();}
      if(action==='redo'&&future.length){history.push(clone(design));design=future.pop();dirty=true;sendPreview();inspector();}
      const fontButton=event.target.closest('[data-font-index]');
      if(fontButton){if(!selected)throw new Error('Select an element in the preview first.');const choice=el('results')._items[Number(fontButton.dataset.fontIndex)],target=selected.selector;const result=await rpc('GET_WEBSITE_FONT',{id:choice.id,weight:choice.weights?.includes(400)?400:choice.weights?.[0]||400});if(selected?.selector!==target)throw new Error('Selection changed; choose the font again.');edit(item=>{design.fonts=[...(design.fonts||[]).filter(f=>f.id!==result.font.id),result.font];item.styles.all['font-family']=result.font.family;item.styles.all['font-weight']=String(result.font.weight);});inspector();status('Font applied to the draft.');}
      const importButton=event.target.closest('[data-import-index]');
      if(importButton){const item=el('results')._items[Number(importButton.dataset.importIndex)];if(!confirm('Have you reviewed the license and source for this image and confirmed it can be used on SKANDI?'))return;status('Adding image to the library…');const result=await rpc('IMPORT_MEDIA_SOURCE',{provider:item.provider,id:item.id,licenseReviewed:true});if(!result.asset)throw new Error(result.needsReview?'A possible duplicate needs review in Assets / Media.':'Import did not return an asset.');assets=[result.asset,...assets.filter(a=>a.id!==result.asset.id)];inspector();status('Imported into the Asset Library. Select the image in the inspector.');}
    }catch(error){activeMode==='homecards'?homeCardStatus(error.message,true):status(error.message,true);}});
    root.addEventListener('input',event=>{if(event.target.dataset.we==='pageQuery'){pageOptions();return}if(event.target.dataset.homeField){homeCardDirty=true;homeCardStatus('Unsaved Home card changes')}else if(event.target.dataset.weBlockField||['text','alt','href','placeholder'].includes(event.target.dataset.we)){dirty=true;status('Unsaved changes')} });
    root.addEventListener('change',event=>{try{
      const target=event.target,name=target.dataset.we;
      if(target.dataset.homeCard){const next=target.dataset.homeCard;if(next!==homeCardId&&homeCardDirty&&!confirm('Discard unsaved changes to this Home card?')){renderHomeCards();return;}homeCardId=next;homeCardDirty=false;renderHomeCards();return;}
      if(target.dataset.homeField){homeCardDirty=true;homeCardStatus('Unsaved Home card changes');if(target.dataset.homeField==='imageAssetId'){const asset=homeCardAssets.find(row=>row.id===target.value),image=asset?.publicUrl||currentHomeCard()?.fallbackImage||'',preview=root.querySelector('[data-home-photo-preview]');if(preview)preview.innerHTML=image?'<img src="'+esc(image)+'" alt="'+esc(homeField('imageAlt')?.value||asset?.altText||'')+'">':'<span>No photo selected</span>';}if(target.dataset.homeField==='imageAlt'){const img=root.querySelector('[data-home-photo-preview] img');if(img)img.alt=target.value;}return;}
      if(name==='viewport'){frame.style.width=target.value==='mobile'?'390px':target.value==='tablet'?'820px':'100%';inspector();return;}
      if(!selected)return;
      if(target.dataset.weStyle||target.dataset.weUnit){const property=target.dataset.weStyle||target.dataset.weUnit,input=root.querySelector('[data-we-style="'+property+'"]'),unit=root.querySelector('[data-we-unit="'+property+'"]');const value=input.value.trim()+(input.value.trim()&&unit?unit.value:'');if(value&&!CSS.supports(property,value))throw new Error('Invalid '+property+' value.');edit(item=>{const mode=el('viewport').value;item.styles[mode]||={};if(value)item.styles[mode][property]=value;else delete item.styles[mode][property];});}
      if(['text','alt','href','placeholder'].includes(name))edit(item=>item[name]=target.value);
      if(target.dataset.weBlockField){const id=target.dataset.weBlockId,field=target.dataset.weBlockField;edit(item=>{const block=arr(item.blocks).find(entry=>entry.id===id);if(!block)return;if(field==='assetId'){const asset=publicImageAssets().find(entry=>entry.id===target.value);if(asset){block.assetId=asset.id;block.assetUrl=asset.publicUrl}else{delete block.assetId;delete block.assetUrl}}else block[field]=target.value;});}
      if(name==='asset'){const asset=assets.find(a=>a.id===target.value);edit(item=>{if(asset){item.assetId=asset.id;item.assetUrl=asset.publicUrl;item.imageMode=el('imageMode').value;item.alt=el('alt').value;}else {delete item.assetId;delete item.assetUrl;}});}
      if(name==='imageMode'&&current()?.assetId)edit(item=>item.imageMode=target.value);
    }catch(error){status(error.message,true);}});
  };
  function pageOptions(){const value=el('page').value||pageKey,query=String(el('pageQuery')?.value||'').trim().toLowerCase();const available=pages.filter(p=>p.path&&!/^\/(riaintra|altea)(\/|$)/.test(p.path)&&(String(p.key)===value||!query||[p.label,p.path,p.key].some(part=>String(part||'').toLowerCase().includes(query))));el('page').innerHTML='<option value="">Select a public page</option>'+available.map(p=>'<option value="'+esc(p.key)+'">'+esc(p.label)+'</option>').join('');el('page').value=value;}
  window.addEventListener('message',event=>{
    const m=event.data||{};
    if(event.source===parent&&m.source==='SKANDI_WIX_PARENT'){
      if(m.type==='MEDIA_CONTROL_EDITORIAL_CATALOG'){pages=m.payload?.pages||[];properties=m.payload?.styleProperties||[];if(root){pageOptions();inspector();}}
      if(m.type==='MEDIA_CONTROL_LIBRARY'){assets=m.payload?.assets||assets;if(root)inspector();}
      if(m.type==='MEDIA_CONTROL_WEBSITE_RESULT'||m.type==='MEDIA_CONTROL_ERROR'){const pending=requests.get(m.payload?.requestId);if(pending){clearTimeout(pending.timer);requests.delete(m.payload.requestId);m.type==='MEDIA_CONTROL_ERROR'?pending.reject(new Error(m.payload.message)):pending.resolve(m.payload.result);}}
    }
    if(event.source===frame?.contentWindow&&m.source==='SKANDI_WEBSITE_PREVIEW'&&m.nonce===nonce){if(m.type==='WEBSITE_PREVIEW_READY')sendPreview();if(m.type==='WEBSITE_PREVIEW_ACTIVITY')parent.postMessage({source:'SKANDI_SHELL',type:'SKANDI_STAFF_ACTIVITY',payload:{key:'mediaControl'}},'*');if(m.type==='WEBSITE_PREVIEW_SELECTED'){selected=m.payload;inspector();if(window.matchMedia&&window.matchMedia('(max-width: 760px)').matches)setMobileView('inspector');}}
  });
  window.addEventListener('beforeunload',event=>{if(dirty||homeCardDirty){event.preventDefault();event.returnValue='';}});
  window.SKANDIWebsiteStudioMount();
  parent.postMessage({source:'SKANDI_MEDIA_CONTROL',type:'MEDIA_CONTROL_CATALOG_REQUEST',payload:{}},'*');
})();

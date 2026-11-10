window.SKANDIWebsiteDesignRuntime = function () {
  'use strict';
  if (window.__skandiWebsiteDesign) return;
  window.__skandiWebsiteDesign = true;
  const config=window.SKANDI_WEBSITE_DESIGN_CONFIG||{};
  const shell=document.getElementById('skandi-shell-root');
  if(shell&&shell.dataset.skandiFamily!=='public')return;
  const preview=config.preview===true,nonce=config.nonce;
  let design={elements:[]},selected=null,scheduled=false,stopped=false,refreshTimer;
  const originals=new Map(),addedHosts=new Set();
  const css=document.createElement('style');css.dataset.websiteDesign='published';document.head.append(css);
  let credits;
  const blocked='script,style,iframe,object,embed,head,meta,link,select,option,input[type=password],input[type=hidden],input[type=file]';
  const send=(type,payload)=>parent.postMessage({source:preview?'SKANDI_WEBSITE_PREVIEW':'SKANDI_PRESENTATION',type,nonce,payload},'*');
  function selectorFor(el) {
    const parts=[];
    while(el&&el!==document.documentElement){
      let hook;
      for(const name of ['data-content-id','data-media-slot-id','data-section-id']){
        const value=el.getAttribute(name);
        if(value&&/^[A-Za-z0-9_-]+$/.test(value)){
          const candidate='['+name+'="'+value+'"]';
          if(document.querySelectorAll(candidate).length===1){hook=candidate;break;}
        }
      }
      if(hook){parts.unshift(hook);break;}
      if(el.id&&/^[A-Za-z_][\w-]*$/.test(el.id)&&document.querySelectorAll('#'+el.id).length===1){parts.unshift('#'+el.id);break;}
      const parent=el.parentElement;
      const same=parent?[...parent.children].filter(n=>n.tagName===el.tagName):[el];
      parts.unshift(el.tagName.toLowerCase()+(same.length>1?':nth-of-type('+(same.indexOf(el)+1)+')':''));el=parent;
    }
    return parts.join(' > ');
  }
  function textNode(el) {return [...el.childNodes].find(n=>n.nodeType===3&&n.nodeValue.trim())||(!el.children.length?[...el.childNodes].find(n=>n.nodeType===3):null);}
  function remember(el) {
    if(!originals.has(el)) originals.set(el,{text:textNode(el),value:textNode(el)?.nodeValue,src:el.getAttribute('src'),srcset:el.getAttribute('srcset'),alt:el.getAttribute('alt'),href:el.getAttribute('href'),placeholder:el.getAttribute('placeholder'),background:el.style.getPropertyValue('background-image')});
    return originals.get(el);
  }
  function restore() {
    for(const [el,old] of originals){if(old.text&&old.text.parentNode===el)old.text.nodeValue=old.value;for(const name of ['src','srcset','alt','href','placeholder'])old[name]===null?el.removeAttribute(name):el.setAttribute(name,old[name]);old.background?el.style.setProperty('background-image',old.background):el.style.removeProperty('background-image');}
    originals.clear();
    for(const host of addedHosts)host.remove();addedHosts.clear();
  }
  function renderBlocks(el,blocks) {
    if(!blocks?.length||!el.closest('#skandi-app-root')||!el.matches('main,section,article,div,aside,header,footer')||el.closest('form,nav,button,a,[data-website-design-protected]'))return;
    let host=[...el.children].find(child=>addedHosts.has(child));
    if(!host){host=document.createElement('div');host.setAttribute('data-website-design-added','');el.append(host);addedHosts.add(host)}
    const signature=JSON.stringify(blocks);if(host.dataset.signature===signature)return;host.dataset.signature=signature;host.replaceChildren();
    for(const block of blocks){
      let node;if(block.type==='heading'){node=document.createElement('h3');node.textContent=block.text||'';}
      else if(block.type==='text'){node=document.createElement('p');node.textContent=block.text||'';}
      else if(block.type==='button'){node=document.createElement('a');node.textContent=block.text||'';const href=String(block.href||'');if(/^(?:\/(?!\/)|#[\w-]|https:\/\/|mailto:|tel:)/.test(href)&&!/[<>\u0000-\u0020]/.test(href))node.setAttribute('href',href);}
      else if(block.type==='image'&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/(?:skandi-public-assets|inventory-media|aircraft-assets|uniform-assets)\//i.test(block.assetUrl||'')){node=document.createElement('img');node.src=block.assetUrl;node.alt=block.alt||'';}
      if(node){node.setAttribute('data-website-design-block',block.id);host.append(node)}
    }
  }
  function apply() {
    if(stopped)return;
    scheduled=false;observer.disconnect();
    const rules={all:[],tablet:[],mobile:[]};
    for(const item of design.elements||[]) {
      let elements;try{elements=document.querySelectorAll(item.selector);}catch{continue;}
      if(!elements.length)continue;
      for(const el of elements) {
        if(el.matches(blocked)||el.closest('[data-website-design-protected]'))continue;
        const old=remember(el);
        if(Object.hasOwn(item,'text')&&el.tagName!=='INPUT'&&el.tagName!=='TEXTAREA'){const node=textNode(el);if(node&&node.nodeValue!==item.text)node.nodeValue=item.text;}
        if(Object.hasOwn(item,'href')&&el.tagName==='A')el.setAttribute('href',item.href);
        if(Object.hasOwn(item,'placeholder')&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'))el.setAttribute('placeholder',item.placeholder);
        renderBlocks(el,item.blocks);
        if(Object.hasOwn(item,'alt')&&el.tagName==='IMG')el.setAttribute('alt',item.alt);
        if(item.assetUrl&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/(?:skandi-public-assets|inventory-media|aircraft-assets|uniform-assets)\//i.test(item.assetUrl)) {
          if(item.imageMode==='background')el.style.setProperty('background-image','url("'+item.assetUrl.replace(/["\\\n\r]/g,'')+'")','important');
          else if(el.tagName==='IMG'){el.removeAttribute('srcset');el.src=item.assetUrl;}
        }
      }
      for(const viewport of ['all','tablet','mobile']) {
        const values=Object.entries(item.styles?.[viewport]||{}).filter(([key,value])=>/^[a-z-]+$/.test(key)&&typeof value==='string'&&!/[{};<>\\]|url\s*\(|expression\s*\(/i.test(value));
        if(values.length)rules[viewport].push(item.selector+'{'+values.map(([key,value])=>key+':'+value+'!important').join(';')+'}');
      }
    }
    const fonts=(design.fonts||[]).filter(font=>/^[a-zA-Z0-9 _-]+$/.test(font.family)&&/^https:\/\/cdn\.jsdelivr\.net\/fontsource\/fonts\/[a-z0-9-]+@[\w.-]+\/[a-z0-9-]+\.woff2$/.test(font.url)).map(font=>'@font-face{font-family:"'+font.family+'";font-weight:'+Number(font.weight)+';font-style:normal;font-display:swap;src:url("'+font.url+'") format("woff2")}');
    const addedCss='[data-website-design-added]{display:grid;gap:12px;margin:16px 0}[data-website-design-added] h3,[data-website-design-added] p{margin:0;white-space:pre-wrap}[data-website-design-added] img{display:block;max-width:100%;height:auto}[data-website-design-added] a{display:inline-block;justify-self:start;padding:11px 16px;border-radius:7px;background:#022e64;color:#fff;text-decoration:none;font-weight:700}';
    const text=addedCss+'\n'+fonts.join('\n')+'\n'+rules.all.join('\n')+'\n@media(max-width:1023px){'+rules.tablet.join('\n')+'}\n@media(max-width:767px){'+rules.mobile.join('\n')+'}';
    if(css.textContent!==text)css.textContent=text;
    if(!preview){
      const values=[...new Set((design.elements||[]).flatMap(item=>[item.credit,...(item.blocks||[]).map(block=>block.credit)]).filter(Boolean))];
      if(values.length){
        if(!credits){credits=document.createElement('details');credits.setAttribute('data-website-design-protected','');credits.style.cssText='padding:12px 24px;font:12px/1.5 sans-serif;background:#fff;color:#526274';document.body.append(credits);}
        const signature=JSON.stringify(values);
        if(credits.dataset.signature!==signature){credits.replaceChildren();credits.dataset.signature=signature;const summary=document.createElement('summary');summary.textContent='Image credits';credits.append(summary);values.forEach(value=>{const p=document.createElement('p');p.textContent=value;credits.append(p);});}
      }else if(credits){credits.remove();credits=null;}
    }
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  const observer=new MutationObserver(()=>{if(!stopped&&!scheduled){scheduled=true;(window.requestAnimationFrame||window.setTimeout)(apply);}});
  function destroy(){stopped=true;observer.disconnect();clearInterval(refreshTimer);}
  window.__skandiWebsiteDesign={destroy};window.addEventListener('pagehide',destroy,{once:true});
  function update(next){observer.disconnect();restore();design=next&&Array.isArray(next.elements)?next:{elements:[]};apply();}
  function describe(el){
    const computed=getComputedStyle(el),styles={};
    for(const key of config.properties||[])styles[key]=computed.getPropertyValue(key);
    return {selector:selectorFor(el),tag:el.tagName.toLowerCase(),text:textNode(el)?.nodeValue??null,alt:el.getAttribute('alt')||'',href:el.getAttribute('href')||'',placeholder:el.getAttribute('placeholder')||'',canAddBlocks:Boolean(el.closest('#skandi-app-root')&&el.matches('main,section,article,div,aside,header,footer')&&!el.closest('form,nav,button,a,[data-website-design-protected]')),image:el.tagName==='IMG',currentImage:el.tagName==='IMG'?el.src:(computed.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]||''),styles};
  }
  window.addEventListener('message',event=>{
    if(event.source!==parent)return;
    const message=event.data||{};
    if(preview){
      if(message.source!=='SKANDI_MEDIA_CONTROL'||message.nonce!==nonce)return;
      if(message.type==='WEBSITE_PREVIEW_DESIGN')update(message.payload);
      if(message.type==='WEBSITE_PREVIEW_PARENT'&&selected?.parentElement&&selected!==document.body){selected.style.outline='';selected=selected.parentElement;selected.style.outline='2px solid #285ca8';send('WEBSITE_PREVIEW_SELECTED',describe(selected));}
    }
    else if(message.source==='SKANDI_WIX_PARENT'&&message.type==='SKANDI_PRESENTATION_DATA'&&(!message.payload?.path||message.payload.path===config.path))update(message.payload?.websiteDesign);
  });
  if(preview){
    let lastPreviewActivity=0;
    const reportActivity=event=>{if(!event.isTrusted||Date.now()-lastPreviewActivity<5000)return;lastPreviewActivity=Date.now();send('WEBSITE_PREVIEW_ACTIVITY',{});};
    for(const type of ['pointerdown','pointermove','keydown','wheel','touchstart'])document.addEventListener(type,reportActivity,{passive:true});
    document.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();const el=event.target;if(el.matches(blocked)||el.closest('[data-website-design-added],[data-website-design-protected]'))return;if(selected)selected.style.outline='';selected=el;selected.style.outline='2px solid #285ca8';send('WEBSITE_PREVIEW_SELECTED',describe(el));},true);
    document.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();},true);
    send('WEBSITE_PREVIEW_READY',{});
  }else{
    send('SKANDI_PRESENTATION_READY',{pageKey:config.pageKey});
    refreshTimer=setInterval(()=>send('SKANDI_PRESENTATION_READY',{pageKey:config.pageKey,refresh:true}),60000);
  }
  apply();
};
if(window.SKANDI_WEBSITE_DESIGN_CONFIG)window.SKANDIWebsiteDesignRuntime();

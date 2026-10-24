
(()=>{
const SOURCE="SKANDI_PUBLIC_NEWSROOM";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}catch(_){return"*"}
})();

let categories=[];
let posts=[];
let media=[];
let contacts=[];
let settings={};
let activeCat="all";
let selected=null;

const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>'"]/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function fmt(value){
  if(!value)return"";
  const d=new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"});
}

function toast(message){
  const el=$("toast");
  el.textContent=String(message||"");
  el.style.display="block";
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.style.display="none",2800);
}

function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  try{
    const url=new URL(raw,window.location.origin);
    if(["https:","http:"].includes(url.protocol))return url.href;
  }catch(_){}
  return"";
}

function sanitizeRichHtml(value){
  const template=document.createElement("template");
  template.innerHTML=String(value||"");

  template.content.querySelectorAll("script,style,iframe,object,embed,form,link,meta").forEach(node=>node.remove());

  template.content.querySelectorAll("*").forEach(node=>{
    [...node.attributes].forEach(attr=>{
      const name=attr.name.toLowerCase();
      if(name.startsWith("on")||name==="style"||name==="srcdoc"){
        node.removeAttribute(attr.name);
        return;
      }
      if((name==="href"||name==="src")){
        const val=String(attr.value||"").trim();
        if(/^javascript:/i.test(val)||/^data:text\/html/i.test(val))node.removeAttribute(attr.name);
      }
    });

    if(node.tagName==="A"){
      const href=String(node.getAttribute("href")||"").trim();
      if(href && !/^(https?:|mailto:|\/)/i.test(href))node.removeAttribute("href");
      node.setAttribute("rel","noopener noreferrer");
    }
  });

  return template.innerHTML;
}

function categoryTitle(id){
  return categories.find(c=>c.categoryId===id)?.title||id||"News";
}

function filtered(){
  const query=($("search").value||"").toLowerCase().trim();
  const type=$("typeFilter").value;
  return posts.filter(item=>{
    if(activeCat!=="all"&&item.categoryId!==activeCat)return false;
    if(type!=="all"&&String(item.contentType||"")!==type)return false;
    if(!query)return true;
    return[
      item.title,
      item.summary,
      item.bodyPlainText,
      Array.isArray(item.tags)?item.tags.join(" "):item.tags,
      item.location,
      item.contentType,
      categoryTitle(item.categoryId)
    ].join(" ").toLowerCase().includes(query);
  });
}

function renderTabs(){
  const all=[{categoryId:"all",title:"All"},...categories];
  $("tabs").innerHTML=all.map(c=>`
    <button class="tab ${activeCat===c.categoryId?"active":""}" type="button"
      data-cat="${esc(c.categoryId)}">${esc(c.title)}</button>
  `).join("");
}

function renderTypes(){
  const current=$("typeFilter").value||"all";
  const types=[...new Set(posts.map(p=>String(p.contentType||"").trim()).filter(Boolean))].sort();
  $("typeFilter").innerHTML=`<option value="all">All content</option>`+
    types.map(type=>`<option value="${esc(type)}">${esc(type)}</option>`).join("");
  if(types.includes(current))$("typeFilter").value=current;
}

function mediaMarkup(item,className){
  const video=safeUrl(item.heroVideoUrl);
  const image=safeUrl(item.heroImage||item.thumbnailImage||item.imageUrl);
  if(video){
    return `<video class="${className}" autoplay muted loop playsinline ${image?`poster="${esc(image)}"`:""}>
      <source src="${esc(video)}" type="video/mp4">
    </video>`;
  }
  if(image)return `<img class="${className}" src="${esc(image)}" alt="${esc(item.title||"Newsroom")}">`;
  return `<div class="feature-placeholder">SKANDI Newsroom</div>`;
}

function renderHero(){
  const rows=filtered();
  const item=
    (selected&&rows.some(row=>row.postId===selected.postId)?selected:null) ||
    rows.find(row=>row.featured===true) ||
    rows[0];

  if(!item){
    selected=null;
    $("hero").innerHTML=`<div class="empty" style="align-self:stretch;display:grid;place-items:center">No published newsroom posts yet.</div>`;
    return;
  }

  selected=item;
  $("hero").innerHTML=`
    <div class="feature-media" data-media-role="newsroom-featured-media">${mediaMarkup(item,"")}</div>
    <div class="feature-copy">
      <div class="kicker">${esc(item.kicker||categoryTitle(item.categoryId))}</div>
      <h2>${esc(item.title)}</h2>
      <p>${esc(item.summary||"")}</p>
      <div class="meta" style="margin-bottom:16px">${esc(fmt(item.publishDate))}${item.location?" · "+esc(item.location):""}</div>
      <button class="btn" type="button" data-open="${esc(item.postId)}">Read article</button>
    </div>`;
}

function renderGrid(){
  const rows=filtered();
  $("grid").innerHTML=rows.map(item=>{
    const image=safeUrl(item.thumbnailImage||item.heroImage||item.imageUrl);
    return `<article class="card" data-open="${esc(item.postId)}" tabindex="0" role="button" aria-label="Open ${esc(item.title)}">
      <div class="card-media">
        ${image
          ? `<img src="${esc(image)}" alt="${esc(item.title)}">`
          : `<div class="card-placeholder">SKANDI Newsroom</div>`}
      </div>
      <div class="card-body">
        <div class="kicker">${esc(categoryTitle(item.categoryId))}</div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary||"")}</p>
        <div class="meta">${esc(fmt(item.publishDate))}${item.location?" · "+esc(item.location):""}</div>
      </div>
    </article>`;
  }).join("")||`<div class="empty">No matching newsroom posts found.</div>`;
}

function renderDetail(item){
  if(!item){
    $("detail").classList.remove("active");
    return;
  }

  const image=safeUrl(item.heroImage||item.thumbnailImage||item.imageUrl);
  const content=item.bodyHtml
    ? sanitizeRichHtml(item.bodyHtml)
    : `<p>${esc(item.bodyPlainText||item.summary||"")}</p>`;

  $("detail").classList.add("active");
  $("detail").innerHTML=`
    ${image?`<div class="detail-hero"><img src="${esc(image)}" alt="${esc(item.title)}"></div>`:""}
    <div class="detail-body">
      <button class="btn secondary" type="button" data-close-detail>← Back to newsroom</button>
      <h2>${esc(item.title)}</h2>
      <div class="detail-meta">${esc(categoryTitle(item.categoryId))} · ${esc(fmt(item.publishDate))}${item.location?" · "+esc(item.location):""}</div>
      <div class="detail-content">${content}</div>
    </div>`;

  setTimeout(()=>$("detail").scrollIntoView({behavior:"smooth",block:"start"}),50);
}

function renderMedia(){
  $("mediaGrid").innerHTML=media.map(asset=>{
    const fileUrl=safeUrl(asset.fileUrl||asset.url);
    const preview=safeUrl(asset.previewImage||asset.imageUrl);
    return `<article class="media-card">
      <div class="media-thumb">${preview?`<img src="${esc(preview)}" alt="${esc(asset.title||"Media asset")}">`:"Media asset"}</div>
      <h3>${esc(asset.title||"Media asset")}</h3>
      <p>${esc(asset.description||"")}</p>
      ${fileUrl?`<a class="btn" href="${esc(fileUrl)}" target="_blank" rel="noopener noreferrer" ${asset.downloadName?`download="${esc(asset.downloadName)}"`:""}>Open asset</a>`:""}
      <div class="rights">
        <strong>${esc(asset.licenseType||"Press Use")}</strong><br>
        ${esc(asset.creditLine||"© SKANDI Group")}<br>
        ${esc(asset.usageRights||"Use only according to the listed rights.")}
      </div>
    </article>`;
  }).join("")||`<div class="empty">No public media assets are available yet.</div>`;
}

function renderContacts(){
  $("contacts").innerHTML=contacts.map(contact=>`
    <article class="contact-card">
      <h3>${esc(contact.name||"SKANDI Media Relations")}</h3>
      <p><strong>${esc(contact.roleTitle||"Press contact")}</strong>${contact.region?`<br>${esc(contact.region)}`:""}</p>
      ${contact.email?`<p><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></p>`:""}
      ${contact.phone?`<p>${esc(contact.phone)}</p>`:""}
      ${contact.availabilityText?`<p>${esc(contact.availabilityText)}</p>`:""}
    </article>
  `).join("")||`<div class="empty">Media contacts will be added through Media Control.</div>`;
}

function render(){
  renderTabs();
  renderTypes();
  renderHero();
  renderGrid();
  renderMedia();
  renderContacts();
}

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){
    try{message=JSON.parse(message)}catch(_){return}
  }
  if(!message||typeof message!=="object")return;
  if(message.source&&message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="NEWSROOM_DATA"){
    categories=Array.isArray(payload.categories)?payload.categories:[];
    posts=Array.isArray(payload.posts)?payload.posts:[];
    media=Array.isArray(payload.mediaAssets)?payload.mediaAssets:[];
    contacts=Array.isArray(payload.pressContacts)?payload.pressContacts:[];
    settings=payload.settings&&typeof payload.settings==="object"?payload.settings:{};
    selected=null;
    render();
    return;
  }

  if(message.type==="NEWSROOM_SUBSCRIBE_RESULT"){
    toast(payload.message||payload.error||"Subscription updated.");
    if(payload.ok!==false)$("subEmail").value="";
    return;
  }

  if(message.type==="NEWSROOM_ERROR"){
    toast(payload.message||"Newsroom unavailable.");
  }
});

document.addEventListener("click",event=>{
  const tab=event.target.closest("[data-cat]");
  if(tab){
    activeCat=tab.dataset.cat||"all";
    selected=null;
    renderTabs();
    renderHero();
    renderGrid();
    return;
  }

  const open=event.target.closest("[data-open]");
  if(open){
    const item=posts.find(post=>String(post.postId)===String(open.dataset.open));
    if(item){
      selected=item;
      renderHero();
      renderDetail(item);
    }
    return;
  }

  if(event.target.closest("[data-close-detail]")){
    $("detail").classList.remove("active");
    document.querySelector("[data-section-id='newsroom-posts']")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
});

document.addEventListener("keydown",event=>{
  const card=event.target.closest(".card[data-open]");
  if(card&&(event.key==="Enter"||event.key===" ")){
    event.preventDefault();
    card.click();
  }
});

$("search").addEventListener("input",()=>{
  selected=null;
  renderHero();
  renderGrid();
});
$("typeFilter").addEventListener("change",()=>{
  selected=null;
  renderHero();
  renderGrid();
});
$("mediaToggle").addEventListener("click",()=>{
  const grid=$("mediaGrid");
  const hidden=grid.classList.toggle("hidden");
  $("mediaToggle").textContent=hidden?"View media":"Hide media";
});
$("subBtn").addEventListener("click",()=>{
  const email=$("subEmail").value.trim();
  if(!email||!email.includes("@")){
    toast("Enter a valid email address.");
    return;
  }
  post("NEWSROOM_SUBSCRIBE",{email,interests:[activeCat]});
});

post("NEWSROOM_READY",{});
})();

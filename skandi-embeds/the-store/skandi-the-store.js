
(function(){
"use strict";
  const STOREFRONT_SOURCE = "SKANDI_STOREFRONT"; 
  const SUPPORT_SOURCE = "SKANDI_SUPPORT_PUBLIC"; 
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";
let PRODUCTS=[],CATEGORIES=[],CART={lineItems:[]},BANNERS=[],TRAVEL_CARDS=[];
let STOREFRONT_CONNECTED=false;
let STOREFRONT_REQUEST_ATTEMPTS=0;
let STOREFRONT_RETRY_TIMER=null;
let ACTIVE="",ACTIVE_PRODUCT=null,ACTIVE_GIFT_STYLE="",FILTERS={stock:false,sale:false},VISIBLE_LIMIT=12;
let INITIAL_CATEGORY_APPLIED=false;
let SAVED=new Set(loadSaved());
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const post=(type,payload={})=>window.parent.postMessage({source:STOREFRONT_SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
const supportPost=(type,payload={})=>window.parent.postMessage({source:SUPPORT_SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
let MASTER_CONFIG_STATE=null;

function masterAsset(key){
  const logos=MASTER_CONFIG_STATE?.brand?.assets?.logos||{};
  const root=MASTER_CONFIG_STATE?.brand?.assets||{};
  return String(logos[key]||root[key]||"").trim();
}
function currentMasterSlogan(){
  const slogans=MASTER_CONFIG_STATE?.brand?.slogans||{};
  const language=String(MASTER_CONFIG_STATE?.settings?.language||"EN").trim().toLowerCase();
  return String(slogans[language]||slogans.en||"").trim();
}
function renderMasterBranding(){
  const headerLogo=masterAsset("storeNavy");
  const footerLogo=masterAsset("storeWhite");
  const slogan=currentMasterSlogan();

  if(headerLogo){
    document.querySelectorAll('[data-master-logo="storeNavy"]').forEach(img=>{
      img.src=headerLogo;
    });
  }
  if(footerLogo&&$("storeWhite"))$("storeWhite").src=footerLogo;
  if(slogan&&$("storeSlogan"))$("storeSlogan").textContent=slogan;
}

function requestStorefront(reason="html-ready"){
  if(STOREFRONT_CONNECTED)return;

  STOREFRONT_REQUEST_ATTEMPTS+=1;

  status(
    STOREFRONT_REQUEST_ATTEMPTS===1
      ? "Connecting to The Store…"
      : `Connecting to The Store… attempt ${STOREFRONT_REQUEST_ATTEMPTS}`
  );

  post("STOREFRONT_READY",{
    reason,
    attempt:STOREFRONT_REQUEST_ATTEMPTS
  });

  clearTimeout(STOREFRONT_RETRY_TIMER);

  if(STOREFRONT_REQUEST_ATTEMPTS<8){
    STOREFRONT_RETRY_TIMER=setTimeout(
      ()=>requestStorefront("retry"),
      1500
    );
  }else{
    status(
      "We apologize. The Store did not answer. Please try again later.",
      "error"
    );
  }
}


function loadSaved(){
  try{return JSON.parse(localStorage.getItem("skandiStoreSaved")||"[]")}catch(_){return[]}
}
function persistSaved(){
  try{localStorage.setItem("skandiStoreSaved",JSON.stringify([...SAVED]))}catch(_){}
}
function status(message,type=""){
  const el=$("status");if(!el)return;
  if(!message){el.className="status";el.textContent="";return}
  el.textContent=message;el.className="status show "+type;
}
function toast(message){
  const el=$("toast");if(!el)return;
  el.textContent=message;el.style.display="block";clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.display="none",2600);
}
function money(price){
  if(!price)return"—";if(price.formatted)return price.formatted;
  const amount=Number(price.amount||0);
  return `${price.currency||""} ${amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`.trim();
}
function textOf(p){return [p.name,p.brand,p.description,p.summary,p.sku,(p.categoryNames||[]).join(" "),p.ribbon,p.badge,p.recommendation].join(" ").toLowerCase()}
function giftCardArtwork(style={},amount=""){
  const bg=String(style.background||"#022e64"),secondary=String(style.secondary||"#063f78"),accent=String(style.accent||"#5FC7CF"),text=String(style.text||"#FFFFFF");
  const label=String(style.name||"SKANDI Gift Card"),value=String(amount||""),motif=String(style.motif||"wave");
  const motifSvg={
    wave:`<path d="M-90 545 C170 402 345 704 630 522 C850 382 1018 552 1285 402" fill="none" stroke="${accent}" stroke-width="22" opacity=".92"/><path d="M-90 598 C172 456 354 744 648 566 C878 428 1036 597 1285 456" fill="none" stroke="${text}" stroke-width="4" opacity=".46"/>`,
    horizon:`<circle cx="925" cy="216" r="126" fill="none" stroke="${accent}" stroke-width="3" opacity=".45"/><path d="M675 215h500M735 155h380M735 275h380" stroke="${accent}" stroke-width="2" opacity=".28"/><path d="M-60 515 C230 460 445 545 730 500 C935 468 1080 487 1280 442" fill="none" stroke="${accent}" stroke-width="13" opacity=".85"/><path d="M816 197l145 35-145 35 28-35-28-35Z" fill="${text}" opacity=".92"/>`,
    nordic:`<path d="M730 112h350v350H730z" fill="none" stroke="${accent}" stroke-width="2" opacity=".22"/><path d="M730 112l350 350M1080 112L730 462" stroke="${accent}" stroke-width="2" opacity=".22"/><path d="M78 540h760" stroke="${accent}" stroke-width="8"/><circle cx="1008" cy="552" r="82" fill="${secondary}" opacity=".7"/><circle cx="1008" cy="552" r="43" fill="none" stroke="${accent}" stroke-width="5"/>`,
    celebration:`<g fill="${accent}" opacity=".9"><circle cx="820" cy="170" r="8"/><circle cx="930" cy="116" r="6"/><circle cx="1055" cy="205" r="10"/><circle cx="890" cy="310" r="7"/><circle cx="1120" cy="344" r="6"/></g><g stroke="${text}" stroke-width="5" opacity=".7"><path d="M770 98l22 42M990 260l33 26M1088 112l-20 42M852 246l-37 22M1142 252l31-22"/></g><path d="M-70 605 C210 470 380 720 665 570 C895 449 1030 565 1280 460" fill="none" stroke="${accent}" stroke-width="16" opacity=".82"/>`,
    platinum:`<defs><linearGradient id="metal" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity=".16"/><stop offset=".48" stop-color="${text}" stop-opacity=".62"/><stop offset="1" stop-color="${accent}" stop-opacity=".12"/></linearGradient></defs><rect x="686" y="88" width="420" height="430" rx="28" fill="url(#metal)" opacity=".52"/><path d="M720 142h350M720 194h350M720 246h350M720 298h350M720 350h350M720 402h350" stroke="${text}" stroke-width="1" opacity=".22"/><path d="M72 548h1035" stroke="${accent}" stroke-width="3" opacity=".75"/>`
  }[motif]||"";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${secondary}"/></linearGradient></defs><rect width="1200" height="760" rx="42" fill="url(#g)"/>${motifSvg}<text x="82" y="122" fill="${text}" font-family="Arial,Helvetica,sans-serif" font-size="48" font-weight="700" letter-spacing="6">SKANDI</text><text x="82" y="178" fill="${text}" font-family="Arial,Helvetica,sans-serif" font-size="24" letter-spacing="5">GIFT CARD</text><text x="82" y="618" fill="${text}" font-family="Arial,Helvetica,sans-serif" font-size="30">${esc(label)}</text><text x="1112" y="650" text-anchor="end" fill="${text}" font-family="Arial,Helvetica,sans-serif" font-size="76" font-weight="700">${esc(value)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function hydrateGiftCardProduct(product={}){
  const amount=product.giftCardValue?.formatted||product.price?.formatted||money(product.price);
  const styles=(product.styles||[]).map(style=>({...style,imageUrl:giftCardArtwork(style,amount)}));
  const images=[...styles.map(style=>style.imageUrl),...(product.imageCandidates||[]),product.imageUrl].filter(Boolean);
  return normalizeProductImage({...product,styles,imageCandidates:[...new Set(images)],imageUrl:images[0]||product.imageUrl||""});
}
function browserImageUrl(value){
  if(typeof value!=="string")return"";
  const raw=value.trim();if(!raw)return"";
  if(/^https?:\/\//i.test(raw))return raw;
  if(raw.startsWith("//"))return`https:${raw}`;
  if(raw.startsWith("wix:image://v1/")){
    const path=raw.slice("wix:image://v1/".length).split("#")[0];
    let mediaId;
    try{mediaId=decodeURIComponent(path.split("/")[0]||"")}catch(_){return""}
    return /^[A-Za-z0-9_.~-]+$/.test(mediaId)?`https://static.wixstatic.com/media/${mediaId}`:"";
  }
  if(raw.startsWith("/media/"))return`https://static.wixstatic.com${raw}`;
  if(/^[A-Za-z0-9_-]+_[A-Za-z0-9_-]+~mv2(?:\.[A-Za-z0-9]+)?$/i.test(raw))return`https://static.wixstatic.com/media/${raw}`;
  return raw;
}
function imageUrlOf(value,depth=0){
  if(!value||depth>5)return"";
  if(typeof value==="string")return browserImageUrl(value);
  if(typeof value!=="object")return"";
  const candidates=value.mediaType==="VIDEO"?[value.thumbnail]:[
    value.image,value.url,value.src,value.imageUrl,value.imageInfo,
    value.main,value.mainMedia,value.thumbnail,value._id,value.id
  ];
  for(const candidate of candidates){const url=imageUrlOf(candidate,depth+1);if(url)return url}
  return"";
}
function productImageCandidates(product={}){
  const items=
    product.media?.itemsInfo?.items||
    product.media?.items||
    product.mediaItemsInfo?.items||
    product.mediaItemsInfo?.mediaItems||
    product.mediaItems||
    product.images||
    (Array.isArray(product.media)?product.media:[]);

  const list=[
    product.imageUrl,
    product.thumbnailUrl,
    product.thumbnail,
    ...(Array.isArray(product.imageCandidates)?product.imageCandidates:[]),
    product.variantImageUrl,
    ...(Array.isArray(product.mediaUrls)?product.mediaUrls:[]),
    product.image,
    product.mainImage,
    product.media?.main,
    product.media?.mainMedia,
    product.mainMedia,
    ...(Array.isArray(items)?items:[])
  ]
    .map(value=>imageUrlOf(value))
    .filter(Boolean);

  return [...new Set(list)];
}

function normalizeProductImage(product={}){
  const imageCandidates=productImageCandidates(product);
  return {
    ...product,
    imageCandidates,
    imageUrl:imageCandidates[0]||""
  };
}

function imageStyle(url){
  const src=imageUrlOf(url);
  return src?esc(`background-image:url(${JSON.stringify(src)})`):"";
}

function imageTagForProduct(product={},alt="",className=""){
  const candidates=
    Array.isArray(product.imageCandidates)&&product.imageCandidates.length
      ? product.imageCandidates
      : productImageCandidates(product);

  if(!candidates.length)return"";

  const src=candidates[0];
  const fallbacks=candidates.slice(1);

  const fallbackAttr=
    fallbacks.length
      ? ` data-image-fallbacks="${esc(JSON.stringify(fallbacks))}"`
      : "";

  return `<img${className?` class="${esc(className)}"`:""} src="${esc(src)}"${fallbackAttr} alt="${esc(alt)}" decoding="async" loading="eager">`;
}

function imageTag(url,alt="",className=""){
  const src=imageUrlOf(url);
  return src?`<img${className?` class="${esc(className)}"`:""} src="${esc(src)}" alt="${esc(alt)}" decoding="async" loading="eager">`:"";
}

// One handler owns both fallback retries and the final placeholder.
document.addEventListener("error",(event)=>{
  const img=event.target;
  if(!(img instanceof HTMLImageElement))return;
  let fallbacks=[];
  try{const parsed=JSON.parse(img.getAttribute("data-image-fallbacks")||"[]");if(Array.isArray(parsed))fallbacks=parsed}catch(_){}
  const candidates=[...new Set(fallbacks.map(value=>imageUrlOf(value)).filter(Boolean))]
    .filter(url=>url!==img.getAttribute("src"));
  const next=candidates.shift();
  if(next){
    img.setAttribute("data-image-fallbacks",JSON.stringify(candidates));
    img.src=next;
    return;
  }
  const parent=img.parentElement;
  img.remove();
  if(parent?.classList.contains("product-media")&&!parent.querySelector(".product-placeholder")){
    parent.insertAdjacentHTML("afterbegin",'<span class="product-placeholder">SKANDI</span>');
  }
},true);
function productBrand(p){return p.brand||p.brandName||(p.categoryNames||[])[0]||"SKANDI"}
function categoryValue(category,...keys){for(const key of keys){const value=category?.[key];if(value!==undefined&&value!==null&&value!=="")return value}return""}
function categoryImage(category){
  const raw=categoryValue(category,"imageUrl","image","mainImage","media");
  if(typeof raw==="string")return raw;
  return raw?.url||raw?.src||raw?.image?.url||raw?.mainMedia?.image?.url||category?.coverImage?.url||"";
}
function flattenCategories(input,parent=null,output=[]){
  (Array.isArray(input)?input:[]).forEach((raw,index)=>{
    if(!raw)return;
    const id=String(categoryValue(raw,"id","_id","categoryId","slug")||`category-${output.length}-${index}`);
    const name=String(categoryValue(raw,"name","title","label")||"").trim();
    const parentObject=raw.parentCategory||raw.parent||null;
    const parentIdRaw=categoryValue(raw,"parentCategoryId","parentId")||(typeof parentObject==="object"?categoryValue(parentObject,"id","_id","categoryId","slug"):parentObject)||parent?.id||"";
    const parentNameRaw=categoryValue(raw,"parentCategoryName","parentName")||(typeof parentObject==="object"?categoryValue(parentObject,"name","title","label"):"")||parent?.name||"";
    const record={
      raw,id,name,
      description:String(categoryValue(raw,"description","summary","shortDescription","body")||"").trim(),
      imageUrl:categoryImage(raw),
      parentId:String(parentIdRaw||""),parentName:String(parentNameRaw||""),
      order:Number(categoryValue(raw,"rank","order","sortOrder","displayOrder")||output.length),
      slug:String(categoryValue(raw,"slug","urlSlug")||"")
    };
    if(name)output.push(record);
    const children=raw.children||raw.subCategories||raw.subcategories||raw.childCategories||[];
    if(Array.isArray(children)&&children.length)flattenCategories(children,record,output);
  });
  return output;
}
function categoryRecords(){return flattenCategories(CATEGORIES)}
function categoryNames(){return [...new Set([...categoryRecords().map(c=>c.name),...PRODUCTS.flatMap(p=>p.categoryNames||[])].filter(Boolean))]}
function productForCategory(name){return PRODUCTS.find(p=>(p.categoryNames||[]).some(c=>String(c).toLowerCase()===String(name).toLowerCase())&&p.imageUrl)||PRODUCTS.find(p=>textOf(p).includes(String(name).toLowerCase())&&p.imageUrl)}
function inferCategoryParent(record,records){
  if(record.parentName)return record.parentName;
  if(record.parentId){const parent=records.find(c=>String(c.id)===String(record.parentId));if(parent)return parent.name}
  const separators=[" > "," / "," — "," - "];
  for(const separator of separators){if(record.name.includes(separator))return record.name.split(separator)[0].trim()}
  return"";
}
function subcategoryRecords(){
  const records=categoryRecords();
  return records.map(record=>({...record,resolvedParentName:inferCategoryParent(record,records)})).filter(record=>record.resolvedParentName&&record.name&&record.name!==record.resolvedParentName).sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name));
}
function isSale(p){return !!(p.comparePrice&&Number(p.comparePrice.amount)>Number(p.price?.amount||0))||/sale|offer|deal/i.test(`${p.ribbon||""} ${p.badge||""} ${(p.categoryNames||[]).join(" ")}`)}
function bagCount(){return (CART.lineItems||[]).reduce((sum,item)=>sum+Number(item.quantity||0),0)}

function parseRoute(){
  const raw=(location.hash||"#/home").replace(/^#\/?/,"");
  const [pathPart,queryString=""]=raw.split("?");
  const bits=pathPart.split("/").filter(Boolean);
  const page=bits[0]||"home";
  const params=new URLSearchParams(queryString);
  return {page,id:bits.slice(1).join("/"),params};
}
function routeHash(page,params={}){
  let hash="#/"+page;
  if(page==="product"&&params.id)hash+="/"+encodeURIComponent(params.id);
  const q=new URLSearchParams();
  if(params.category)q.set("category",params.category);
  if(params.q)q.set("q",params.q);
  if(params.stock)q.set("stock","1");
  if(params.sale)q.set("sale","1");
  const qs=q.toString();if(qs)hash+="?"+qs;
  return hash;
}
function navigate(page,params={},replace=false){
  const hash=routeHash(page,params);
  if(location.hash===hash){applyRoute();return}
  if(replace)history.replaceState(null,"",hash);else location.hash=hash;
  if(replace)applyRoute();
}
function showPage(page){
  document.querySelectorAll(".page-view").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
  document.body.className=document.body.className.replace(/\bpage-\S+/g,"").trim();
  document.body.classList.add("page-"+page);
  document.querySelectorAll("[data-route]").forEach(btn=>{
    const route=btn.dataset.route;
    btn.classList.toggle("active",(route==="home"&&page==="home")||(route==="shop"&&(page==="shop"||page==="product"))||(route===page));
  });
}
function closeMenus(){
  $("categoryMenu")?.classList.remove("show");
  $("categoryMenu")?.setAttribute("aria-hidden","true");
  $("mobileNav")?.classList.remove("show");
  $("mobileNav")?.setAttribute("aria-hidden","true");
  document.body.classList.remove("locked");
}
function applyRoute(){
  closeMenus();
  const route=parseRoute();
  const allowed=["home","shop","product","saved","bag","orders","support"];
  const page=allowed.includes(route.page)?route.page:"notfound";

  if(page==="shop"){
    ACTIVE=route.params.get("category")||"";
    FILTERS.stock=route.params.get("stock")==="1";
    FILTERS.sale=route.params.get("sale")==="1";
    const q=route.params.get("q")||"";
    $("query").value=q;
    VISIBLE_LIMIT=12;
    renderShop();
  }else if(page==="product"){
    renderProductPage(decodeURIComponent(route.id||""));
  }else if(page==="saved"){
    renderSavedPage();
  }else if(page==="bag"){
    post("STOREFRONT_CART_REQUEST",{});
    renderBagPage();
  }else if(page==="orders"){
    renderOrdersPage();
  }else if(page==="home"){
    renderHomeProducts();
  }else if(page==="support"){
    filterSupportTopics();
  }

  showPage(page);
  window.scrollTo({top:0,behavior:"auto"});
}
function openCategory(name){navigate("shop",{category:name||""})}
function currentShopParams(overrides={}){
  return {
    category:overrides.category!==undefined?overrides.category:ACTIVE,
    q:overrides.q!==undefined?overrides.q:$("query").value.trim(),
    stock:overrides.stock!==undefined?overrides.stock:FILTERS.stock,
    sale:overrides.sale!==undefined?overrides.sale:FILTERS.sale
  };
}

function filtered(){
  const q=String($("query")?.value||"").toLowerCase().trim();
  const sort=$("sort")?.value||"recommended";
  let rows=PRODUCTS.filter(p=>{
    if(q&&!textOf(p).includes(q))return false;
    if(ACTIVE&&!textOf(p).includes(ACTIVE.toLowerCase())&&!((p.categoryNames||[]).some(c=>String(c).toLowerCase()===ACTIVE.toLowerCase())))return false;
    if(FILTERS.stock&&p.inStock===false)return false;
    if(FILTERS.sale&&!isSale(p))return false;
    return true;
  });
  rows.sort((a,b)=>{
    if(sort==="name")return String(a.name||"").localeCompare(String(b.name||""));
    if(sort==="priceAsc")return Number(a.price?.amount||0)-Number(b.price?.amount||0);
    if(sort==="priceDesc")return Number(b.price?.amount||0)-Number(a.price?.amount||0);
    if(sort==="newest")return new Date(b.updatedAt||0)-new Date(a.updatedAt||0);
    return Number(b.recommendationScore||0)-Number(a.recommendationScore||0);
  });
  return rows;
}

function categoryItem(name){
  const p=productForCategory(name),url=p?.imageUrl||"",initials=String(name).split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return `<button class="category-orb" data-category="${esc(name)}"><span class="category-orb-media" style="${imageStyle(url)}">${url?"":`<span class="category-initials">${esc(initials)}</span>`}</span><span class="category-orb-label">${esc(name)}</span></button>`;
}
function renderCategories(){
  const defaults=["Travel Essentials","Luggage","SKANDI","Beach","Family","Gifts","Gift Cards"];
  const names=[...new Set([...categoryNames(),...defaults])].slice(0,12);
  $("popularCategories").innerHTML=names.slice(0,6).map(categoryItem).join("");
  $("categoryMenuList").innerHTML=`<button data-category="">All products</button>`+names.map(n=>`<button data-category="${esc(n)}">${esc(n)}</button>`).join("");
}
function productCard(p){
  const disabled=p.inStock===false||p.canAddToCart===false;
  const label=p.virtualGiftCard?"":(p.accessLabel||p.ribbon||(p.inStock===false?"Sold out":isSale(p)?"Offer":""));
  const action=p.virtualGiftCard
    ? `<button data-view="${esc(p.id)}">Choose design</button>`
    : `<button data-add="${esc(p.id)}" ${disabled?"disabled":""}>${disabled?"Unavailable":"Add to bag"}</button>`;
  return `<article class="product-card">
    <div class="product-media">
      ${imageTagForProduct(p,p.name||"Product")}
      ${p.imageUrl?"":`<span class="product-placeholder">SKANDI</span>`}
      ${label?`<span class="product-ribbon">${esc(label)}</span>`:""}
      <button class="save-button" data-save="${esc(p.id)}" aria-label="Save ${esc(p.name)}">${SAVED.has(String(p.id))?"♥":"♡"}</button>
      <div class="product-overlay"><button data-view="${esc(p.id)}">View product</button>${action}</div>
    </div>
    <div class="product-content">
      <button class="product-card-link" data-view="${esc(p.id)}">
        <div class="product-brand">${esc(productBrand(p))}</div>
        <strong class="product-name">${esc(p.name||"Product")}</strong>
        <div class="product-summary">${esc(p.summary||p.description||"")}</div>
        <div class="customer-access">Available to all customers</div>
        <div class="price-row"><span>${esc(money(p.price))}</span>${p.comparePrice?.amount?`<span class="old-price">${esc(money(p.comparePrice))}</span>`:""}</div>
        ${p.inStock===false?`<div class="stock-note">Currently unavailable</div>`:""}
      </button>
    </div>
  </article>`;
}
function renderHomeProducts(){
  const rows=[...PRODUCTS].sort((a,b)=>Number(b.recommendationScore||0)-Number(a.recommendationScore||0)).slice(0,8);
  $("homeProductGrid").innerHTML=rows.length?rows.map(productCard).join(""):`<div class="empty-state">Products will appear here when they become available.</div>`;
}
function renderShop(){
  const rows=filtered(),shown=rows.slice(0,VISIBLE_LIMIT);
  $("categoryTitle").textContent=ACTIVE||($("query").value.trim()?`Search results`:"All products");
  $("categoryDescription").textContent=ACTIVE?`Browse ${ACTIVE} products.`:$("query").value.trim()?`Results for “${$("query").value.trim()}”.`:"Browse all products available from SKANDI The Store.";
  $("shopBreadcrumb").textContent=ACTIVE||"Shop";
  $("productGrid").innerHTML=shown.length?shown.map(productCard).join(""):`<div class="empty-state">No products match the selected filters.<div class="shop-empty-actions"><button class="cta ghost" data-clear-shop>Clear filters</button></div></div>`;
  $("productCount").textContent=`${rows.length} product${rows.length===1?"":"s"}`;
  $("loadMoreBtn").classList.toggle("hidden",shown.length>=rows.length||rows.length===0);
  document.querySelectorAll('[data-filter="stock"]').forEach(b=>b.classList.toggle("active",FILTERS.stock));
  document.querySelectorAll('[data-filter="sale"]').forEach(b=>b.classList.toggle("active",FILTERS.sale));
  if(PRODUCTS.length)status("");
}
function productOptions(p,scope="productPageOptions"){
  return (p.options||[]).map(o=>`<div class="option-row"><label>${esc(o.name)}</label><select data-option="${esc(o.name)}" data-option-scope="${scope}">${(o.choices||[]).map(c=>`<option value="${esc(c.value||c.description||c)}">${esc(c.description||c.value||c)}</option>`).join("")}</select></div>`).join("");
}
function selectedChoices(scope){
  const out={};
  document.querySelectorAll(`[data-option-scope="${scope}"]`).forEach(s=>out[s.dataset.option]=s.value);
  return out;
}
function selectGiftStyle(styleId){
  const p=ACTIVE_PRODUCT;
  if(!p?.virtualGiftCard)return;
  const style=(p.styles||[]).find(item=>String(item.id)===String(styleId));
  if(!style)return;
  ACTIVE_GIFT_STYLE=style.id;
  document.querySelectorAll("[data-gift-style]").forEach(button=>button.classList.toggle("active",button.dataset.giftStyle===style.id));
  const image=$("giftCardHeroImage");if(image)image.src=style.imageUrl||p.imageUrl||"";
  const label=$("giftCardSelectedStyle");if(label)label.textContent=style.name||"Selected design";
}
function renderGiftCardProductPage(p,host){
  ACTIVE_PRODUCT=p;
  ACTIVE_GIFT_STYLE=p.styles?.[0]?.id||"";
  $("relatedSection").classList.remove("hidden");
  $("productBreadcrumb").textContent=p.name||"SKANDI Gift Card";
  const selected=p.styles?.[0]||{};
  const today=new Date().toISOString().slice(0,10);
  host.innerHTML=`<div class="product-page gift-card-product-page">
    <div class="gift-card-gallery">
      <div class="gift-card-main"><img id="giftCardHeroImage" src="${esc(selected.imageUrl||p.imageUrl||"")}" alt="${esc(selected.name||p.name||"SKANDI Gift Card")}"></div>
      <div class="gift-card-thumbnails" aria-label="Gift card designs">${(p.styles||[]).map(style=>`<button type="button" class="gift-card-style ${style.id===ACTIVE_GIFT_STYLE?"active":""}" data-gift-style="${esc(style.id)}" aria-label="${esc(style.name)}"><img src="${esc(style.imageUrl||"")}" alt="${esc(style.name)}"><span>${esc(style.name)}</span></button>`).join("")}</div>
    </div>
    <div class="product-page-info">
      <div class="product-page-kicker">SKANDI Gift Card</div>
      <h1 class="product-page-title">${esc(p.name||"SKANDI Gift Card")}</h1>
      <div class="product-page-price">${esc(money(p.price))}</div>
      <p class="product-page-description">${esc(p.description||p.summary||"")}</p>
      <div class="gift-card-selection-copy">Selected design: <strong id="giftCardSelectedStyle">${esc(selected.name||"")}</strong></div>
      <div class="gift-card-form" id="giftCardForm">
        <div class="gift-card-field"><label for="giftRecipientName">Who is the Gift Card for?</label><input id="giftRecipientName" maxlength="200" autocomplete="name" placeholder="Recipient name"></div>
        <div class="gift-card-field"><label for="giftRecipientEmail">Recipient email</label><input id="giftRecipientEmail" type="email" maxlength="254" autocomplete="email" placeholder="recipient@example.com"></div>
        <div class="gift-card-field"><label for="giftSenderName">From who should it be from?</label><input id="giftSenderName" maxlength="200" placeholder="Your name"></div>
        <div class="gift-card-field gift-card-field-wide"><label for="giftMessage">Personal message</label><textarea id="giftMessage" maxlength="500" rows="4" placeholder="Add an optional message"></textarea><small>Up to 500 characters.</small></div>
        <div class="gift-card-field"><label for="giftDeliveryDate">Delivery date</label><input id="giftDeliveryDate" type="date" min="${today}"><small>Leave blank to send after payment.</small></div>
      </div>
      <div class="product-page-actions gift-card-actions">
        <button class="cta navy" data-gift-card-add="${esc(p.id)}">Add gift card to bag</button>
        <button class="icon-square" data-save="${esc(p.id)}" aria-label="Save gift card">${SAVED.has(String(p.id))?"♥":"♡"}</button>
      </div>
      <div class="product-page-meta">
        <div><small>Gift card value</small><strong>${esc(p.giftCardValue?.formatted||money(p.price))}</strong></div>
        <div><small>Delivery</small><strong>Digital</strong></div>
      </div>
      <div class="accordion">
        <details open><summary>How it works</summary><p>Choose a design and recipient. After payment, SKANDI issues the Gift Card and sends the chosen design.</p></details>
        <details><summary>Using the gift card</summary><p>The recipient receives a redemption code that can be applied as a gift card payment method during SKANDI checkout.</p></details>
      </div>
    </div>
  </div>`;
  const related=PRODUCTS.filter(x=>x.virtualGiftCard&&String(x.id)!==String(p.id)).slice(0,4);
  $("relatedProductGrid").innerHTML=related.map(productCard).join("");
}
function giftCardPurchasePayload(p){
  const recipientName=String($("giftRecipientName")?.value||"").trim();
  const recipientEmail=String($("giftRecipientEmail")?.value||"").trim();
  const senderName=String($("giftSenderName")?.value||"").trim();
  const message=String($("giftMessage")?.value||"").trim();
  const deliveryDate=String($("giftDeliveryDate")?.value||"").trim();
  if(!ACTIVE_GIFT_STYLE){toast("Choose a gift card design.");return null}
  if(!recipientName){toast("Enter the recipient's name.");$("giftRecipientName")?.focus();return null}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)){toast("Enter a valid recipient email address.");$("giftRecipientEmail")?.focus();return null}
  if(!senderName){toast("Enter the sender name.");$("giftSenderName")?.focus();return null}
  return {
    virtualProductId:p.id,
    giftCardProductId:p.giftCardProductId,
    giftCardVariantId:p.giftCardVariantId,
    amount:p.giftCardValue?.amount||p.price?.amount,
    styleId:ACTIVE_GIFT_STYLE,
    recipientName,recipientEmail,senderName,message,deliveryDate
  };
}
function renderProductPage(id){
  const p=PRODUCTS.find(x=>String(x.id)===String(id));
  const host=$("productPageContent");
  if(!p){
    ACTIVE_PRODUCT=null;
    host.innerHTML=`<div class="not-found"><h1>Product unavailable</h1><p>This product could not be found in the current store response.</p><button class="cta navy" data-route="shop">Return to products</button></div>`;
    $("relatedSection").classList.add("hidden");
    $("productBreadcrumb").textContent="Product unavailable";
    return;
  }
  if(p.virtualGiftCard){renderGiftCardProductPage(p,host);return}
  ACTIVE_PRODUCT=p;
  ACTIVE_GIFT_STYLE="";
  $("relatedSection").classList.remove("hidden");
  $("productBreadcrumb").textContent=p.name||"Product";
  const disabled=p.inStock===false||p.canAddToCart===false;
  host.innerHTML=`<div class="product-page">
    <div class="product-gallery-main">${imageTagForProduct(p,p.name||"Product")}${p.imageUrl?"":"SKANDI"}${p.ribbon?`<span class="product-ribbon">${esc(p.ribbon)}</span>`:""}</div>
    <div class="product-page-info">
      <div class="product-page-kicker">${esc(productBrand(p))}</div>
      <h1 class="product-page-title">${esc(p.name||"Product")}</h1>
      <div class="product-page-price">${esc(money(p.price))}${p.comparePrice?.amount?` <span class="old-price">${esc(money(p.comparePrice))}</span>`:""}</div>
      <p class="product-page-description">${esc(p.description||p.summary||"")}</p>
      <div id="productPageOptions">${productOptions(p)}</div>
      <div class="option-row"><label for="productPageQty">Quantity</label><input id="productPageQty" type="number" min="1" value="1"></div>
      <div class="product-page-actions">
        <button class="cta navy" data-product-add="${esc(p.id)}" ${disabled?"disabled":""}>${p.canAddToCart===false?(p.accessLabel||"Unavailable"):p.inStock===false?"Sold out":"Add to bag"}</button>
        <button class="icon-square" data-save="${esc(p.id)}" aria-label="Save product">${SAVED.has(String(p.id))?"♥":"♡"}</button>
      </div>
      <div class="product-page-meta">
        <div><small>Availability</small><strong>${p.inStock===false?"Currently unavailable":"In stock"}</strong></div>
        <div><small>Product code</small><strong>${esc(p.sku||p.id||"—")}</strong></div>
      </div>
      <div class="accordion">
        <details open><summary>Product details</summary><p>${esc(p.description||"Product details are currently unavailable.")}</p></details>
        <details><summary>Delivery and returns</summary><p>Available shipping, pickup and return options are shown during checkout and in your order details.</p></details>
        <details><summary>SKANDI recommendation</summary><p>${esc(p.recommendation||"Recommended for SKANDI travelers.")}</p></details>
      </div>
    </div>
  </div>`;
  const categories=(p.categoryNames||[]).map(String);
  const related=PRODUCTS.filter(x=>String(x.id)!==String(p.id)&&((x.categoryNames||[]).some(c=>categories.includes(String(c))))).slice(0,4);
  $("relatedProductGrid").innerHTML=(related.length?related:PRODUCTS.filter(x=>String(x.id)!==String(p.id)).slice(0,4)).map(productCard).join("");
}
function renderSavedPage(){
  const items=PRODUCTS.filter(p=>SAVED.has(String(p.id)));
  $("savedPageGrid").innerHTML=items.length?items.map(productCard).join(""):`<div class="empty-state">You have not saved any products yet.<div class="shop-empty-actions"><button class="cta navy" data-route="shop">Browse products</button></div></div>`;
}
function renderBagPage(){
  const items=CART.lineItems||[];
  $("bagCount").textContent=String(bagCount());
  $("bagItemCount").textContent=String(bagCount());
  $("bagPageItems").innerHTML=items.length?items.map(item=>`<article class="bag-page-item">
    <div class="bag-page-thumb">${imageTag(item.imageUrl,item.name||"Product")}</div>
    <div class="bag-page-copy"><strong>${esc(item.name||"Product")}</strong><span>Quantity ${esc(item.quantity||1)}</span><span>${esc(item.optionsLabel||"")}</span></div>
    <div class="bag-page-price">${esc(item.priceLabel||"")}</div>
  </article>`).join(""):`<div class="empty-state">Your shopping bag is empty.<div class="shop-empty-actions"><button class="cta navy" data-route="shop">Start shopping</button></div></div>`;
  $("bagTotal").textContent=CART.totalLabel||"—";
  $("checkoutBtn").disabled=items.length===0;
}
function renderOrdersPage(){
  }
function renderHeroAndCampaigns(){
  const defaults=[
    {title:"Travel smarter",body:"Airport, cabin and destination essentials selected for SKANDI journeys.",kicker:"For the journey"},
    {title:"SKANDI collection",body:"Branded pieces created for every SKANDI traveler.",kicker:"SKANDI",category:"SKANDI"},
    {title:"Destination ready",body:"Useful additions for beach, city and long-haul travel.",kicker:"Selected for you"}
  ];
  const source=BANNERS.length?BANNERS:defaults;
  const hero=source.find(x=>x.placement==="hero"||x.isHero)||source[0];
  if(hero){
    $("heroTitle").textContent=hero.title||"Everything for the journey";
    $("heroText").textContent=hero.body||hero.subtitle||"Travel-ready essentials available to every SKANDI customer.";
    if(hero.imageUrl)$("heroBanner").style.backgroundImage=`url('${esc(hero.imageUrl)}')`;
  }
  const campaigns=[...source.filter(x=>x!==hero),...TRAVEL_CARDS,...defaults].slice(0,3);
  $("bannerRow").innerHTML=campaigns.map(x=>`<article class="campaign-card ${x.imageUrl?"":"no-image"}" style="${imageStyle(x.imageUrl)}"><div class="campaign-copy"><small>${esc(x.kicker||x.category||"SKANDI The Store")}</small><h3>${esc(x.title||"Selected for your journey")}</h3><p>${esc(x.body||x.subtitle||x.description||"Discover products chosen for SKANDI travelers.")}</p>${x.linkUrl?`<button class="cta white" data-open-path="${esc(x.linkUrl)}">Explore</button>`:`<button class="cta white" data-category="${esc(x.category||x.kicker||"")}">Explore</button>`}</div></article>`).join("");
}
function renderTravelCards(){
  const cards=subcategoryRecords().slice(0,3).map(category=>{
    const product=productForCategory(category.name);
    return {
      eyebrow:category.resolvedParentName,
      title:category.name,
      description:category.description||`Explore products in ${category.name}.`,
      imageUrl:category.imageUrl||product?.imageUrl||"",
      category:category.name
    };
  });
  $("travelCards").innerHTML=cards.length?cards.map(card=>`<article class="editorial-card" style="${imageStyle(card.imageUrl)}"><div class="editorial-content"><small>${esc(card.eyebrow)}</small><h3>${esc(card.title)}</h3><p>${esc(card.description)}</p><button class="cta white" data-category="${esc(card.category)}">Shop products</button></div></article>`).join(""):`<div class="empty-state" style="grid-column:1/-1">Travel inspiration will appear when store subcategories are available.</div>`;
}
function renderHeaderCounts(){
  $("savedCount").textContent=String(SAVED.size);
  $("bagCount").textContent=String(bagCount());
}
let ADDING=false;
function addToCart(id,qty=1,choices={}){
  if(ADDING)return;
  const p=PRODUCTS.find(x=>String(x.id)===String(id));if(!p)return;
  if(p.virtualGiftCard){navigate("product",{id});toast("Choose a design and recipient details first.");return}
  if(p.canAddToCart===false||p.inStock===false){toast(p.accessMessage||"This product is currently unavailable.");return}
  if((p.options||[]).some(o=>!choices[o.name])){navigate("product",{id});toast("Choose your product options first.");return}
  ADDING=true;
  toast("Adding to bag…");
  post("STOREFRONT_ADD_TO_CART",{productId:id,quantity:Number(qty||1),choices});
}
function toggleCategoryMenu(){
  const el=$("categoryMenu"),show=!el.classList.contains("show");
  el.classList.toggle("show",show);el.setAttribute("aria-hidden",String(!show));
}
function openOrders(){
  toast("Opening your orders…");
  post("STOREFRONT_ORDERS",{});
}
function refresh(){
  toast("Refreshing store…");status("Refreshing store…");post("STOREFRONT_REFRESH",{});
}
function clearShop(){
  ACTIVE="";FILTERS={stock:false,sale:false};$("query").value="";$("sort").value="recommended";VISIBLE_LIMIT=12;
  navigate("shop",{},true);
}

const supportSubCategories={
  order_management:["Order status","Order confirmation not received","Change delivery address before dispatch","Change or cancel order","Duplicate order","Pre-order or backorder","Invoice, receipt or tax document","Order split into multiple shipments"],
  shipping_delivery:["Tracking not updating","Delivery delayed","Marked delivered but not received","Parcel lost","Partial delivery or missing package","Damaged parcel","Wrong delivery address","Shipping method or charge","International delivery, customs or duties","Pickup or collection issue"],
  returns_exchanges:["Start a return","Return eligibility","Return label","Return shipping issue","Exchange size, color or product","Return received but no update","Return rejected","Final sale or non-returnable item","Gift return"],
  refunds_credits:["Refund status","Refund amount incorrect","Refund to original payment method","Refund to gift card or store credit","Partial refund","Bank dispute or chargeback","Store credit balance"],
  payments_checkout:["Payment declined","Payment pending","Charged but order not created","Duplicate charge","Incorrect amount charged","Split payment issue","Gift card payment issue","Tax calculation issue","Currency or conversion question","Checkout error","Fraud or identity verification"],
  product_information:["Product information","Size, fit or dimensions","Compatibility question","Materials or care instructions","Stock or restock question","Personalization or customization","Price discrepancy","Product image or description mismatch"],
  damaged_wrong_missing:["Damaged item","Defective or not working","Wrong item received","Missing item","Missing component or accessory","Quality concern","Packaging damage"],
  warranty_repairs:["Warranty eligibility","Warranty claim","Repair request","Replacement request","Spare part request","Care instructions","Manufacturer support"],
  promotions_gift_cards:["Promo code not working","Promotion eligibility","Discount missing","Gift card purchase","Gift card delivery","Gift card balance","Gift card redemption","SKANDI Club reward issue","Price promotion question"],
  account_security:["Sign-in issue","Password reset","Change email or phone number","Address book issue","Order history missing","Suspicious account activity","Account locked","Close account"],
  privacy_data:["Access my personal data","Correct my personal data","Delete my personal data","Marketing preferences","Cookie or privacy question","Payment or security concern"],
  technical_accessibility:["Website error","Product page issue","Shopping bag issue","Checkout issue","Mobile display issue","Browser compatibility","Accessibility support","Email or SMS notification issue"],
  business_bulk:["Corporate order","Bulk quantity request","Wholesale inquiry","Tax-exempt purchase","Purchase order","Custom branding","Business invoice"],
  feedback_other:["General inquiry","Complaint","Product or service feedback","Compliment","Partnership inquiry","Other request"]
};
function supportValue(id){return String($(id)?.value||"").trim()}
function setSupportStatus(message,mode=""){
  const node=$("supportStatus");if(!node)return;
  node.textContent=message||"";node.className=message?`support-status show ${mode}`:"support-status";
}
function setSupportRequired(ids,required){ids.forEach(id=>{const el=$(id);if(!el)return;required?el.setAttribute("required",""):el.removeAttribute("required")})}
function toggleSupportOrderFields(){
  const show=supportValue("hasOrder")==="yes";
  $("orderFields")?.classList.toggle("show",show);
  setSupportRequired(["orderNumber"],show);
}
function updateSupportCategory(preferred=""){
  const category=supportValue("caseCategory"),select=$("caseSubCategory");if(!select)return;
  select.innerHTML='<option value="">Select specific topic</option>';
  (supportSubCategories[category]||[]).forEach(topic=>{const option=document.createElement("option");option.value=topic;option.textContent=topic;select.appendChild(option)});
  if(preferred&&[...select.options].some(option=>option.value===preferred))select.value=preferred;

  const moduleIds=["shippingDetailsModule","returnDetailsModule","paymentDetailsModule","productDetailsModule","promotionDetailsModule","technicalDetailsModule","businessDetailsModule"];
  moduleIds.forEach(id=>$(id)?.classList.remove("show"));
  setSupportRequired(["productName","companyName","bulkQuantity"],false);

  const showShipping=["shipping_delivery","order_management"].includes(category);
  const showReturn=["returns_exchanges","refunds_credits","damaged_wrong_missing","warranty_repairs"].includes(category);
  const showPayment=["payments_checkout","refunds_credits"].includes(category);
  const showProduct=["product_information","damaged_wrong_missing","warranty_repairs","returns_exchanges"].includes(category);
  const showPromotion=category==="promotions_gift_cards";
  const showTechnical=category==="technical_accessibility";
  const showBusiness=category==="business_bulk";

  $("shippingDetailsModule")?.classList.toggle("show",showShipping);
  $("returnDetailsModule")?.classList.toggle("show",showReturn);
  $("paymentDetailsModule")?.classList.toggle("show",showPayment);
  $("productDetailsModule")?.classList.toggle("show",showProduct);
  $("promotionDetailsModule")?.classList.toggle("show",showPromotion);
  $("technicalDetailsModule")?.classList.toggle("show",showTechnical);
  $("businessDetailsModule")?.classList.toggle("show",showBusiness);

  setSupportRequired(["productName"],showProduct);
  setSupportRequired(["companyName","bulkQuantity"],showBusiness);
}
function supportFiles(){return Array.from($("fileInput")?.files||[]).slice(0,3)}
function validateSupportFiles(files=supportFiles()){
  const allowed=new Set(["application/pdf","image/jpeg","image/png"]),total=files.reduce((sum,file)=>sum+Number(file.size||0),0);
  if(files.length>3)return"Choose no more than 3 files.";
  if(files.some(file=>!allowed.has(file.type)&&!/\.(pdf|jpe?g|png)$/i.test(file.name)))return"Only PDF, JPG and PNG files are accepted.";
  if(total>10*1024*1024)return"The selected files exceed the 10 MB total limit.";
  return"";
}
function renderSupportFiles(){
  const files=supportFiles(),error=validateSupportFiles(files),summary=$("fileSummary");if(!summary)return;
  summary.innerHTML=error?`<span style="color:var(--danger)">${esc(error)}</span>`:files.length?files.map(file=>`<span>${esc(file.name)} · ${(file.size/1024/1024).toFixed(2)} MB</span>`).join(""):"";
}
function focusSupportForm(category="",subcategory=""){
  navigate("support");
  setTimeout(()=>{
    if(category){$("caseCategory").value=category;updateSupportCategory(subcategory)}
    $("supportFormCard")?.scrollIntoView({behavior:"smooth",block:"start"});
    $("caseSubject")?.focus({preventScroll:true});
  },50);
}
function filterSupportTopics(){
  const query=supportValue("supportSearchInput").toLowerCase();let visible=0;
  document.querySelectorAll("[data-support-topic]").forEach(button=>{const show=!query||button.textContent.toLowerCase().includes(query)||String(button.dataset.supportCategory||"").includes(query)||String(button.dataset.supportSubcategory||"").toLowerCase().includes(query);button.classList.toggle("hidden",!show);if(show)visible++});
  $("supportNoResults")?.style.setProperty("display",visible?"none":"block");
}
function submitSupportRequest(event){
  event.preventDefault();const form=$("publicSupportForm");if(!form)return;
  if(!form.checkValidity()){form.reportValidity();return}
  const fileError=validateSupportFiles();if(fileError){setSupportStatus(fileError,"error");return}
  $("submitBtn").disabled=true;setSupportStatus("Submitting your request…");$("supportConfirmation")?.classList.remove("show");
  const firstName=supportValue("firstName"),lastName=supportValue("lastName");
  supportPost("PUBLIC_SUPPORT_CREATE_CASE",{
    firstName,lastName,fullName:`${firstName} ${lastName}`.trim(),email:supportValue("email"),phone:`${supportValue("phonePrefix")} ${supportValue("phone")}`.trim(),countryOfResidence:supportValue("countryOfResidence"),preferredContact:supportValue("preferredContact"),
    hasOrder:supportValue("hasOrder"),purchaseChannel:supportValue("purchaseChannel"),orderNumber:supportValue("orderNumber"),orderEmail:supportValue("orderEmail"),orderDate:supportValue("orderDate"),orderTotal:supportValue("orderTotal"),
    category:supportValue("caseCategory"),subCategory:supportValue("caseSubCategory"),subject:supportValue("caseSubject"),message:supportValue("caseDescription"),
    carrier:supportValue("carrierName"),trackingNumber:supportValue("trackingNumber"),expectedDeliveryDate:supportValue("expectedDeliveryDate"),deliveryPostcode:supportValue("deliveryPostcode"),
    returnNumber:supportValue("returnNumber"),returnSentDate:supportValue("returnSentDate"),itemCondition:supportValue("itemCondition"),requestedResolution:supportValue("requestedResolution"),
    paymentMethod:supportValue("paymentMethod"),transactionDate:supportValue("transactionDate"),transactionAmount:supportValue("transactionAmount"),paymentLast4:supportValue("paymentLast4"),paymentError:supportValue("paymentError"),
    productName:supportValue("productName"),productSku:supportValue("productSku"),productQuantity:supportValue("productQuantity"),dateReceived:supportValue("dateReceived"),
    promotionCode:supportValue("promotionCode"),promotionName:supportValue("promotionName"),giftCardLast4:supportValue("giftCardLast4"),expectedDiscount:supportValue("expectedDiscount"),
    deviceType:supportValue("deviceType"),browser:supportValue("browserName"),pageUrl:supportValue("pageUrl"),technicalError:supportValue("technicalError"),
    companyName:supportValue("companyName"),companyTaxId:supportValue("companyTaxId"),bulkQuantity:supportValue("bulkQuantity"),requiredByDate:supportValue("requiredByDate"),
    attachedFileNames:supportFiles().map(file=>file.name),priority:"Low",source:"store-customer-service"
  });
}
function resetSupportForm(){
  $("publicSupportForm")?.reset();toggleSupportOrderFields();updateSupportCategory();renderSupportFiles();$("submitBtn").disabled=false;
}

function handleClick(event){
  const route=event.target.closest("[data-route]");
  if(route){navigate(route.dataset.route);return}
  const category=event.target.closest("[data-category]");
  if(category){openCategory(category.dataset.category||"");return}
  const view=event.target.closest("[data-view]");
  if(view){navigate("product",{id:view.dataset.view});return}
  const add=event.target.closest("[data-add]");
  if(add){addToCart(add.dataset.add,1,{});return}
  const giftStyle=event.target.closest("[data-gift-style]");
  if(giftStyle){selectGiftStyle(giftStyle.dataset.giftStyle);return}
  const giftAdd=event.target.closest("[data-gift-card-add]");
  if(giftAdd){
    const p=PRODUCTS.find(x=>String(x.id)===String(giftAdd.dataset.giftCardAdd));
    if(!p)return;
    const payload=giftCardPurchasePayload(p);if(!payload)return;
    if(ADDING)return;ADDING=true;toast("Adding gift card to bag…");post("STOREFRONT_ADD_GIFT_CARD",payload);return;
  }
  const detailAdd=event.target.closest("[data-product-add]");
  if(detailAdd){addToCart(detailAdd.dataset.productAdd,$("productPageQty")?.value||1,selectedChoices("productPageOptions"));return}
  const save=event.target.closest("[data-save]");
  if(save){
    const id=String(save.dataset.save);
    SAVED.has(id)?SAVED.delete(id):SAVED.add(id);persistSaved();renderHeaderCounts();
    const routeNow=parseRoute();
    if(routeNow.page==="home")renderHomeProducts();
    if(routeNow.page==="shop")renderShop();
    if(routeNow.page==="product")renderProductPage(decodeURIComponent(routeNow.id||""));
    if(routeNow.page==="saved")renderSavedPage();
    toast(SAVED.has(id)?"Product saved":"Product removed from saved list");return;
  }
  const supportTopic=event.target.closest("[data-support-topic]");
  if(supportTopic){focusSupportForm(supportTopic.dataset.supportCategory||"",supportTopic.dataset.supportSubcategory||"");return}
  const supportPrefill=event.target.closest("[data-support-prefill]");
  if(supportPrefill){focusSupportForm(supportPrefill.dataset.supportPrefill||"");return}
  if(event.target.closest("[data-support-form]")){focusSupportForm();return}
  const path=event.target.closest("[data-open-path]");
  if(path){post("STOREFRONT_NAVIGATE",{path:path.dataset.openPath});return}
  const back=event.target.closest("[data-back]");
  if(back){history.length>1?history.back():navigate("shop");return}
  const clear=event.target.closest("[data-clear-shop]");
  if(clear){clearShop();return}
  const close=event.target.closest("[data-close]");
  if(close?.dataset.close==="mobile"){closeMenus();return}
}
document.addEventListener("click",handleClick);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenus()});
window.addEventListener("hashchange",applyRoute);

$("query").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();navigate("shop",currentShopParams({q:$("query").value.trim()}))}
});
$("query").addEventListener("input",()=>{
  if(parseRoute().page==="shop"){VISIBLE_LIMIT=12;renderShop()}
});
$("sort").addEventListener("change",()=>{VISIBLE_LIMIT=12;renderShop()});
$("searchBtn").onclick=()=>{$("query").focus();window.scrollTo({top:0,behavior:"smooth"})};
$("categoriesBtn").onclick=toggleCategoryMenu;
$("shopCategoriesBtn").onclick=toggleCategoryMenu;
$("footerCategoriesBtn").onclick=toggleCategoryMenu;
$("mobileCategoriesBtn").onclick=()=>{closeMenus();navigate("home");setTimeout(()=>$("popularCategories")?.scrollIntoView({behavior:"smooth"}),40)};
$("bagBtn").onclick=()=>navigate("bag");
$("savedBtn").onclick=()=>navigate("saved");
$("ordersBtn").onclick=()=>{navigate("orders");openOrders()};
$("ordersPageBtn").onclick=openOrders;
$("refreshStoreBtn").onclick=refresh;
$("checkoutBtn").onclick=()=>{toast("Opening checkout…");post("STOREFRONT_CHECKOUT",{})};
$("mobileMenuBtn").onclick=()=>{$("mobileNav").classList.add("show");$("mobileNav").setAttribute("aria-hidden","false");document.body.classList.add("locked")};
$("loadMoreBtn").onclick=()=>{VISIBLE_LIMIT+=12;renderShop()};
$("clearFiltersBtn").onclick=clearShop;
document.querySelectorAll('[data-filter="stock"]').forEach(btn=>btn.onclick=()=>{FILTERS.stock=!FILTERS.stock;VISIBLE_LIMIT=12;navigate("shop",currentShopParams(),true)});
document.querySelectorAll('[data-filter="sale"]').forEach(btn=>btn.onclick=()=>{FILTERS.sale=!FILTERS.sale;VISIBLE_LIMIT=12;navigate("shop",currentShopParams(),true)});
document.querySelectorAll('[data-filter="category"]').forEach(btn=>btn.onclick=toggleCategoryMenu);

$("hasOrder")?.addEventListener("change",toggleSupportOrderFields);
$("caseCategory")?.addEventListener("change",()=>updateSupportCategory());
$("publicSupportForm")?.addEventListener("submit",submitSupportRequest);
$("supportSearchInput")?.addEventListener("input",filterSupportTopics);
$("supportSearchInput")?.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();filterSupportTopics()}});
$("supportSearchBtn")?.addEventListener("click",filterSupportTopics);
$("fileInput")?.addEventListener("change",renderSupportFiles);
$("supportFileDrop")?.addEventListener("click",()=>$("fileInput")?.click());
$("supportFileDrop")?.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();$("fileInput")?.click()}});
["dragenter","dragover"].forEach(type=>$("supportFileDrop")?.addEventListener(type,event=>{event.preventDefault();$("supportFileDrop").classList.add("dragging")}));
["dragleave","drop"].forEach(type=>$("supportFileDrop")?.addEventListener(type,event=>{event.preventDefault();$("supportFileDrop").classList.remove("dragging")}));
$("supportFileDrop")?.addEventListener("drop",event=>{const transfer=new DataTransfer();Array.from(event.dataTransfer?.files||[]).slice(0,3).forEach(file=>transfer.items.add(file));if($("fileInput"))$("fileInput").files=transfer.files;renderSupportFiles()});
toggleSupportOrderFields();updateSupportCategory();renderSupportFiles();


window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;
  const message=event.data||{};if(message.source!==PARENT_SOURCE)return;
  const payload=message.payload||{};

  if(message.type==="SKANDI_MASTER_CONFIG"){
    MASTER_CONFIG_STATE=payload&&typeof payload==="object"?payload:{};
    renderMasterBranding();
    return;
  }

  if(message.type==="STOREFRONT_PARENT_READY"){
    console.log("[SKANDI Storefront] Wix parent bridge ready.",payload);
    requestStorefront("parent-ready");
    return;
  }

  if(message.type==="STOREFRONT_PRODUCTS"){
    STOREFRONT_CONNECTED=true;
    clearTimeout(STOREFRONT_RETRY_TIMER);
    const storeProducts=(payload.products||[]).map(normalizeProductImage);
    const giftCardProducts=(payload.giftCardProducts||[]).map(hydrateGiftCardProduct);
    PRODUCTS=[...giftCardProducts,...storeProducts];
    CATEGORIES=payload.categories||[];
    BANNERS=payload.banners||[];
    TRAVEL_CARDS=payload.travelCards||[];

    console.log("[SKANDI Storefront] Wix products received:", {
      products: PRODUCTS.length,
      categories: CATEGORIES.length,
      meta: payload.meta || {},
      imageCheck: PRODUCTS.slice(0,3).map(p=>({
        name:p.name,
        imageUrl:p.imageUrl,
        imageCandidates:p.imageCandidates
      }))
    });

    renderHeroAndCampaigns();
    renderTravelCards();
    renderCategories();
    renderHomeProducts();
    renderHeaderCounts();
    if(!INITIAL_CATEGORY_APPLIED&&String(payload.initialCategory||"").trim().toLowerCase()==="gift cards"){
      INITIAL_CATEGORY_APPLIED=true;
      navigate("shop",{category:"Gift Cards"},true);
    }else{
      applyRoute();
    }

    status(
      PRODUCTS.length
        ? `${PRODUCTS.length} products loaded in SKANDI The Store.`
        : "The Store returned 0 visible products.",
      PRODUCTS.length ? "ok" : "warn"
    );
    return;
  }
  if(message.type==="STOREFRONT_CART_UPDATED"){
    ADDING=false;CART=payload.cart||CART;renderHeaderCounts();toast("Added to your bag");
    if(parseRoute().page==="bag")renderBagPage();return;
  }
  if(message.type==="STOREFRONT_CART"){
    CART=payload.cart||{};renderHeaderCounts();
    if(parseRoute().page==="bag")renderBagPage();
    return;
  }
  if(message.type==="PUBLIC_SUPPORT_CASE_CREATED"){
    const reference=payload.caseNumber||payload.ticketNumber||payload.reference||payload.id||payload.caseId||"";
    setSupportStatus("","");
    $("supportConfirmationTitle").textContent=reference?`Request ${reference} submitted`:"Request submitted";
    $("supportConfirmationText").textContent="SKANDI Support will follow up using the email address you provided.";
    $("supportConfirmation").classList.add("show");
    resetSupportForm();$("supportConfirmation")?.scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  if(message.type==="PUBLIC_SUPPORT_ERROR"){
    setSupportStatus(payload.message||"Support request failed. Please review the form and try again.","error");$("submitBtn").disabled=false;return;
  }
  if(message.type==="STOREFRONT_PROGRESS"){status(payload.message||"Working…");toast(payload.message||"Working…");return}
  if(message.type==="STOREFRONT_ERROR"){
    ADDING=false;
    console.error("[SKANDI Storefront] Parent error:",payload);
    status(payload.message||"Store action failed.","error");
    toast(payload.message||"Store action failed.");
    return
  }
});

$("footerYear").textContent=String(new Date().getFullYear());
post("MASTER_CONFIG_REQUEST",{context:"the-store"});
renderHeroAndCampaigns();renderTravelCards();renderCategories();renderHomeProducts();renderHeaderCounts();
if(!location.hash)history.replaceState(null,"","#/home");
applyRoute();
requestStorefront("initial");
})();

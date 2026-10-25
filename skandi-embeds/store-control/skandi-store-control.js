

const SOURCE="SKANDI_STORE_CONTROL_V3";
const PARENT="SKANDI_WIX_PARENT";
const STOREFRONT_APP_ID="215238eb-22a5-4c36-9e7b-e7c08025e04e";
let backendResponded=false, BUSY=false;
let detail=null,lastMutation=null;
function busy(v){BUSY=v;document.querySelectorAll("button").forEach(b=>b.disabled=v)}
let state={
  session:{},
  stats:{products:"—",orders:"—",openOrders:"—",lowStock:"—",collections:"—",revenue:"—"},
  products:[],
  orders:[],
  inventory:[],
  collections:[],
  promotions:[],
  audit:[],
  editingProductId:"",
  productUploads:[],
  mainUploadIndex:null,
  storeUrl:""
};

const $=id=>document.getElementById(id);
const money=(v,c="USD")=>{const n=Number(v||0);try{return new Intl.NumberFormat("en-US",{style:"currency",currency:c||"USD"}).format(n)}catch(e){return "$"+n.toFixed(2)}}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function post(type,payload={}){
  if(/^STORE_CONTROL_(CREATE_|SAVE_|SET_|BULK_|DELETE_|UPDATE_)/.test(type)){if(BUSY)return;lastMutation={type,payload};busy(true);status("Saving to Wix…")}
  window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")
}
function audit(action,detail,mode=""){state.audit.unshift({time:new Date().toISOString(),action,detail,mode});renderAudit()}
function status(msg,mode=""){const e=$("status");e.textContent=msg||"";e.style.display=msg?"block":"none";e.style.background=mode==="error"?"#b91c1c":mode==="ok"?"#15803d":mode==="warn"?"#b45309":"#020617"}
function arr(v){return Array.isArray(v)?v:String(v||"").split(/[\n,]/).map(x=>x.trim()).filter(Boolean)}
function bool(v){return v===true||String(v)==="true"}
function activePanel(name){
  const labels={
    dashboard:["Store Control Center","Live store operations, product maintenance, order fulfilment, and inventory control."],
    orders:["Storefront Orders","Operate payment, picking, fulfilment, tracking, and cancellations."],
    products:["Product Catalog","Create, update, hide, and publish Storefront products."],
    inventory:["Inventory Control","Update product and variant stock through SKANDI Storefront inventory."],
    collections:["Collection Manager","Manage store collections and product routing."],
    discounts:["Promotions","Draft and send promotion/coupon payloads to SKANDI Storefront."],
    audit:["Session Activity","Actions confirmed during this browser session."]
  };
  document.querySelectorAll("[data-panel]").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
  document.querySelectorAll(".panel[id^='panel-']").forEach(p=>p.classList.toggle("active",p.id===`panel-${name}`));
  if($("currentWorkspaceTitle")&&labels[name])$("currentWorkspaceTitle").textContent=labels[name][0];
  if($("currentWorkspaceSubtitle")&&labels[name])$("currentWorkspaceSubtitle").textContent=labels[name][1];
}
document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>activePanel(b.dataset.panel));
document.querySelectorAll("[data-panel-jump]").forEach(b=>b.onclick=()=>activePanel(b.dataset.panelJump));

function seedData(){
  state={
    ...state,
    stats:{products:"—",orders:"—",openOrders:"—",lowStock:"—",collections:"—",revenue:"—"},
    products:[],
    inventory:[],
    orders:[],
    collections:[],
    promotions:[],
    audit:[{time:new Date().toISOString(),action:"SESSION_START",detail:"Storefront session initialized.",mode:"ok"}]
  };
}

function render(p={}){
  state={...state,...p};
  if(p && Object.keys(p).length){backendResponded=true}
  if($("apiBadge")){
    $("apiBadge").textContent=backendResponded?(Object.keys(state.serviceErrors||{}).length?"Partially connected":"Storefront connected"):"Connection pending";
    $("apiBadge").className="pill "+(backendResponded?"ok":"warn");
  }
  renderStats();
  renderHealth();
  renderProducts();
  renderInventory();
  renderOrders();
  renderCollections();
  renderPromotions();
  renderAudit();
  renderCollectionOptions();
}
function renderStats(){
  const stats=[
    ["Products",state.stats.products??state.products.length],
    ["Open orders (latest 100)",state.stats.openOrders??"Unavailable"],
    ["Low Stock",state.stats.lowStock??"Unavailable"],
    ["Collections",state.stats.categories??"—"]
  ];
  $("statsGrid").innerHTML=stats.map(([k,v])=>`<div class="kv-tile"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join("");
}
function renderHealth(){
  const checks=[
    ["Product service",backendResponded?"Connected":"Waiting for Storefront connection",backendResponded?"live":"warn"],
    ["Inventory service",state.serviceErrors?.inventory|| (backendResponded?"Ready":"Connection required"),backendResponded&&!state.serviceErrors?.inventory?"live":"warn"],
    ["Order service",state.serviceErrors?.orders||(backendResponded?"Latest 100 orders":"Connection required"),backendResponded&&!state.serviceErrors?.orders?"live":"warn"],
    ["Store session",backendResponded?"Live":"Pending",backendResponded?"live":"warn"]
  ];
  $("healthFeed").innerHTML=checks.map(([a,b,m])=>`<article class="admin-row"><div><div class="item-title">${esc(a)}</div><div class="item-sub">${esc(b)}</div></div><span class="pill ${m==="live"?"ok":"warn"}">${m==="live"?"Ready":"Pending"}</span></article>`).join("");
  const low=state.inventory.filter(i=>Number(i.quantity)<=5).slice(0,5);
  $("lowStockFeed").innerHTML=low.length?low.map(i=>`<article class="admin-row"><div><div class="item-title">${esc(i.name)}</div><div class="item-sub">${esc(i.sku)} · ${esc(i.variant||"Default")}</div></div><span class="pill bad">${esc(i.quantity)} left</span></article>`).join(""):`<div class="item-sub">No low-stock items returned.</div>`;
}
function stockClass(q){q=Number(q||0);return q<=0?"stock-low":q<=5?"stock-watch":"stock-ok"}
function renderProducts(){
  const q=($("query")?.value||"").toLowerCase();
  const rows=state.products.filter(p=>!q||[p.name,p.sku,p.id].join(" ").toLowerCase().includes(q));
  $("productsTable").innerHTML=rows.map(p=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(p.name)}</div>
        <div class="item-sub"><span class="mono">${esc(p.id||"")}</span> · SKU ${esc(p.sku||"—")} · ${esc(money(p.price,p.currency))}</div>
      </div>
      <div class="row">
        <span class="pill ${p.stock==null?"info":Number(p.stock)<=0?"bad":Number(p.stock)<=5?"warn":"ok"}">${esc(p.stock??"—")} stock</span>
        <span class="pill ${p.visible!==false?"ok":"warn"}">${p.visible!==false?"Visible":"Hidden"}</span>
        <button class="btn" data-edit-product="${esc(p.id)}" type="button">Adjust</button>
      </div>
    </article>`).join("") || `<div class="empty">No products returned.</div>`;
  document.querySelectorAll("[data-edit-product]").forEach(btn=>btn.onclick=()=>editProduct(btn.dataset.editProduct));
}

function renderInventory(){
  const q=($("query")?.value||"").toLowerCase();
  const rows=state.inventory.filter(i=>!q||[i.name,i.sku,i.productId,i.variantId].join(" ").toLowerCase().includes(q));
  $("inventoryTable").innerHTML=rows.map(i=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(i.name)} · ${esc(i.variant||"Default")}</div>
        <div class="item-sub"><span class="mono">${esc(i.productId||"")}</span> · SKU ${esc(i.sku||"—")} · ${esc(i.variantId||"base")} · Location ${esc(i.locationId||"default")}</div>
      </div>
      <div class="row">
        <span class="pill ${Number(i.quantity||0)<=0?"bad":Number(i.quantity||0)<=5?"warn":"ok"}">${esc(i.quantity??"—")} qty</span>
        <span class="pill ${i.tracked!==false?"info":"warn"}">${i.tracked!==false?"Tracked":"Not tracked"}</span>
        <button class="btn" data-inv-product="${esc(i.productId)}" data-inventory-id="${esc(i.id)}" data-inv-variant="${esc(i.variantId||"")}" type="button">Adjust</button>
      </div>
    </article>`).join("") || `<div class="empty">No inventory records returned.</div>`;
  document.querySelectorAll("[data-inv-product]").forEach(btn=>btn.onclick=()=>{
    const item=state.inventory.find(i=>i.id===btn.dataset.inventoryId);
    if(!item)return;
    $("inventoryRecord").value=item.id;
    $("inventoryProductId").value=item.productId||"";
    $("inventoryVariantId").value=item.variantId||"";
    $("inventorySku").value=item.sku||"";
    $("inventoryQuantity").value=item.quantity??"";
    $("inventoryTracked").value=String(item.tracked!==false);
    activePanel("inventory");
  });
}

function orderLane(status,label){
  const rows=state.orders.filter(o=>String(o.fulfillmentStatus||"").toUpperCase()===status || (status==="UNFULFILLED" && !o.fulfillmentStatus));
  return rows.map(o=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(label)} · #${esc(o.number||o.id)}</div>
        <div class="item-sub">${esc(o.customer||"Customer")} · ${esc(o.items||0)} items · ${esc(money(o.total,o.currency))}</div>
      </div>
      <div class="row">
        <span class="pill info">${esc(label)}</span>
        <button class="btn" data-order-fill="${esc(o.id)}" type="button">Action</button>
      </div>
    </article>`).join("");
}

function renderOrders(){
  const filter=$("orderFilter")?.value||"ALL";
  const rows=state.orders.filter(o=>filter==="ALL"||filter==="all"||!filter||o.fulfillmentStatus===filter||o.paymentStatus===filter||o.status===filter);
  $("orderPipeline").innerHTML=rows.map(o=>`
    <article class="admin-row">
      <div>
        <div class="item-title">#${esc(o.number||o.id)} · ${esc(o.customer||"Customer")}</div>
        <div class="item-sub">${esc(o.items||0)} items · ${esc(money(o.total,o.currency))} · ${esc(o.paymentStatus||"—")} · ${esc(new Date(o.created||Date.now()).toLocaleString())}</div>
      </div>
      <div class="row">
        <span class="pill ${String(o.fulfillmentStatus||"UNFULFILLED").toUpperCase()==="FULFILLED"?"ok":String(o.fulfillmentStatus||"").toUpperCase()==="READY"?"info":"warn"}">${esc(o.fulfillmentStatus||"UNFULFILLED")}</span>
        <button class="btn" data-order-fill="${esc(o.id)}" type="button">Action</button>
      </div>
    </article>`).join("") || `<div class="empty">No orders returned.</div>`;
  document.querySelectorAll("[data-order-fill]").forEach(btn=>btn.onclick=()=>{
    $("fulfillmentOrderId").value=btn.dataset.orderFill;
    activePanel("orders");
  });
}

function renderCollections(){
  $("collectionsList").innerHTML=state.collections.map(c=>`
    <article class="admin-row">
      <div><div class="item-title">${esc(c.name)}</div><div class="item-sub code">${esc(c.id)} · /${esc(c.slug||"")}</div></div>
      <div class="row"><span class="pill ${c.visible!==false?"ok":"warn"}">${c.visible!==false?"Visible":"Hidden"}</span><span class="pill info">${esc(c.products||0)} products</span></div>
    </article>`).join("") || `<div class="item-sub">No collections returned.</div>`;
}
function renderCollectionOptions(){
  const select=$("productCollection");
  const value=select.value;
  select.innerHTML=`<option value="">No collection</option>`+state.collections.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  if([...select.options].some(o=>o.value===value)) select.value=value;
  const collection=$("collectionId"),selected=collection.value;
  collection.innerHTML='<option value="">Select collection for assignment</option>'+state.collections.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");collection.value=selected;
  const inv=$("inventoryRecord"),iv=inv.value;
  inv.innerHTML='<option value="">Select stock record</option>'+state.inventory.map(i=>`<option value="${esc(i.id)}">${esc(i.name)} · ${esc(i.variantId)} · ${esc(i.locationId||"default")}</option>`).join("");inv.value=iv;
}
function renderPromotions(){
  $("promotionsList").innerHTML=state.promotions.map(p=>`
    <article class="admin-row">
      <div><div class="item-title">${esc(p.name)}</div><div class="item-sub">${esc(p.code)} · ${esc(p.type)} ${esc(p.value||"")}</div></div>
      <span class="pill ${p.status==="Active"?"ok":"warn"}">${esc(p.status||"Draft")}</span>
    </article>`).join("") || `<div class="item-sub">No promotions returned.</div>`;
}
function renderAudit(){
  $("auditTable").innerHTML=state.audit.map(a=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(a.action)}</div>
        <div class="item-sub">${esc(a.detail)}</div>
      </div>
      <span class="pill ${a.mode==="warn"?"warn":a.mode==="error"?"bad":"info"}">${esc(new Date(a.time).toLocaleString())}</span>
    </article>
  `).join("") || `<div class="empty">No audit records.</div>`;
}

function editProduct(id){status("Loading full product and variants…");post("STORE_CONTROL_OPEN_PRODUCT",{productId:id})}
function fillProduct(p){
  detail=p;state.editingProductId=p.id;
  $("productModeBadge").textContent="Editing "+p.name;
  $("productName").value=p.name||"";$("productCurrency").value=p.currency||state.currency||"USD";
  $("productCollection").value=p.categoryIds?.[0]||"";$("productVisible").value=String(p.visible!==false);
  $("productDescription").value=p.plainDescription||"";
  $("productVariant").innerHTML=(p.variants||[]).map(v=>`<option value="${esc(v.id)}">${esc(v.label||v.sku||v.id)}</option>`).join("");
  fillVariant();activePanel("products");
}
function fillVariant(){const v=detail?.variants?.find(x=>x.id===$("productVariant").value);if(!v)return;$("productSku").value=v.sku||"";$("productPrice").value=v.actualPrice??"";$("productWeight").value=v.weight??"";$("productTrackInventory").value=String(v.inventory?.some(i=>i.trackQuantity));$("productTrackInventory").disabled=true;}
function clearProduct(){
  state.editingProductId="";detail=null;$("productVariant").innerHTML="";$("productTrackInventory").disabled=false;
  state.productUploads=[];
  state.mainUploadIndex=null;
  $("productModeBadge").textContent="New product";
  ["productName","productSku","productPrice","productCurrency","productCollection","productWeight","productDescription"].forEach(id=>$(id).value=id==="productCurrency"?"USD":"");
  $("productVisible").value="true";
  $("productTrackInventory").value="true";
  renderMediaPreview();
}
function renderMediaPreview(){const box=$("productMediaPreview");if(box)box.textContent="Manage product media in Media Control."}
function saveProduct(){
  const name=$("productName").value.trim(),price=$("productPrice").value;
  if(!name||price===""||!Number.isFinite(Number(price))||Number(price)<0){status("Name and a non-negative price are required.","error");return}
  const variant={id:$("productVariant").value,sku:$("productSku").value.trim(),actualPrice:Number(price),weight:Number($("productWeight").value||0)};
  const selected=$("productCollection").value;
  const product={name,description:$("productDescription").value.trim(),visible:bool($("productVisible").value),...variant,trackQuantity:bool($("productTrackInventory").value),quantity:0,inStock:true,categoryIds:selected?[selected]:[]};
  if(detail){
    // Preserve other memberships when changing the primary collection shown here.
    const ids=[...new Set([...(detail.categoryIds||[]).slice(1),...(selected?[selected]:[])])];
    post("STORE_CONTROL_SAVE_CORE",{productId:detail.id,patch:{name:product.name,description:product.description,visible:product.visible,revision:detail.revision,variant,categoryIds:ids}});
  }else post("STORE_CONTROL_CREATE_PRODUCT",{product});
}
function deleteProduct(){
  if(!state.editingProductId){status("Select a product first.","warn");return}
  post("STORE_CONTROL_SET_VISIBILITY",{productId:state.editingProductId,visible:false});
}
function updateInventory(){
  const record=state.inventory.find(i=>i.id===$("inventoryRecord").value);
  if(!record){status("Select a stock record and location first.","error");return}
  const q=$("inventoryQuantity").value;
  if(q===""||!Number.isInteger(Number(q))||Number(q)<0){status("Enter a non-negative whole-number quantity.","error");return}
  post("STORE_CONTROL_UPDATE_INVENTORY",{inventoryId:record.id,revision:record.revision,mode:$("inventoryMode").value,quantity:Number(q),tracked:bool($("inventoryTracked").value),reason:$("inventoryReason").value.trim()});
}
function sendFulfillment(){
  const payload={
    orderId:$("fulfillmentOrderId").value.trim(),
    action:$("fulfillmentStatus").value,
    carrier:$("carrier").value.trim(),
    trackingNumber:$("trackingNumber").value.trim(),
    note:$("orderNote").value.trim()
  };
  if(!payload.orderId){status("Order ID is required.","error");return}
  if(["CANCELED","FULFILLED"].includes(payload.action)){
    const verb=payload.action==="CANCELED"?"CANCEL":"FULFILL";
    const detail=verb==="CANCEL"?"Cancellation does not refund or restock the order.":"This fulfills all remaining items. Wix may send its configured shipping notification.";
    if(!window.confirm(detail+" Continue?"))return;
    payload.confirmation=verb+" "+payload.orderId;
  }
  post("STORE_CONTROL_UPDATE_ORDER",payload);
}
function saveCollection(assignOnly=false){
  const payload={
    name:$("collectionTitle").value.trim(),
    slug:$("collectionSlug").value.trim(),
    description:$("collectionDescription").value.trim(),
    productIds:arr($("collectionProductIds").value),
    assignOnly,categoryId:$("collectionId").value
  };
  if(!payload.name && !assignOnly){status("Collection name is required.","error");return}
  if(assignOnly && !payload.productIds.length){status("Add product IDs before assigning.","error");return}
  if(assignOnly&&!payload.categoryId){status("Select an existing collection.","error");return}
  post("STORE_CONTROL_SAVE_COLLECTION",payload);
}
function savePromo(){
  const payload={
    name:$("promoName").value.trim(),
    code:$("promoCode").value.trim(),
    type:$("promoType").value,
    value:Number($("promoValue").value||0),
    starts:$("promoStarts").value,
    ends:$("promoEnds").value,
    scope:$("promoScope").value.trim()
  };
  if(!payload.name || !payload.code){status("Promotion name and code are required.","error");return}
  post("STORE_CONTROL_SAVE_PROMOTION",payload);
}
function load(){post("STORE_CONTROL_READY",{})}
function refresh(){status("Refreshing Wix data…");post("STORE_CONTROL_REFRESH",{query:$("query").value})}
window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;const m=event.data||{};if(m.source!==PARENT)return;const p=m.payload||{};
  if(m.type==="STORE_CONTROL_PARENT_READY"){load();return}
  if(m.type==="STORE_CONTROL_BOOTSTRAP"){
    backendResponded=true;
    const inventory=(p.inventory||[]).map(i=>({...i,tracked:i.trackQuantity,name:p.products?.find(x=>x.id===i.productId)?.name||i.productId}));
    render({...p,inventory,products:(p.products||[]).map(x=>({...x,price:x.minPrice,stock:!p.serviceErrors?.inventory && inventory.some(i=>i.productId===x.id&&i.tracked)?inventory.filter(i=>i.productId===x.id&&i.tracked).reduce((n,i)=>n+Number(i.quantity||0),0):null})),collections:(p.categories||[]).map(c=>({...c,products:c.itemCounter}))});
    const errors=Object.values(p.serviceErrors||{});status(errors.length?errors.join(" "):p.scope||"Wix data refreshed.",errors.length?"warn":"");return;
  }
  if(m.type==="STORE_CONTROL_PRODUCT"){fillProduct(p.product);status("Product loaded.");return}
  if(m.type==="STORE_CONTROL_PROGRESS"){busy(true);status(p.message||"Working…");return}
  if(m.type==="STORE_CONTROL_IDLE"){busy(false);return}
  if(m.type==="STORE_CONTROL_MUTATION_OK"){
    if(p.product)fillProduct(p.product);
    status(p.message||"Saved to Wix.","ok");audit(p.action||"SAVE",(p.message||"Wix confirmed the update.")+(lastMutation?.payload?.reason?" Session note: "+lastMutation.payload.reason:""),"ok");
    (p.results||[]).filter(x=>!x.ok).forEach(x=>audit("ASSIGNMENT_FAILED",x.productId,"error"));return;
  }
  if(m.type==="STORE_CONTROL_BULK_RESULT"){status(`${p.succeeded||0} updated; ${p.failed||0} failed.`,p.failed?"warn":"ok");(p.results||[]).forEach(x=>audit("BULK_PRICE",x.productId+": "+(x.ok?"Saved":x.message),x.ok?"ok":"error"));return}
  if(m.type==="STORE_CONTROL_ERROR"){busy(false);status(p.message||"The action failed. Refresh before retrying.","error");audit(p.stage||"ERROR",p.message||"Action failed.","error");}
});

if($("refreshBtn")) $("refreshBtn").onclick=load;
if($("syncStoreBtn")) $("syncStoreBtn").onclick=()=>refresh("SKANDI_STOREFRONT_FULL_SYNC");
if($("openStoreBtn")) $("openStoreBtn").onclick=()=>{post("STORE_CONTROL_NAVIGATE",{path:"/the-store"});};
$("refreshOrdersBtn").onclick=()=>refresh("SKANDI_STOREFRONT_ORDERS_REFRESH");
if($("refreshProductsBtn")) $("refreshProductsBtn").onclick=()=>refresh("SKANDI_STOREFRONT_PRODUCTS_REFRESH");
$("refreshInventoryBtn").onclick=()=>refresh("SKANDI_STOREFRONT_INVENTORY_REFRESH");
if($("refreshCollectionsBtn")) $("refreshCollectionsBtn").onclick=()=>refresh("SKANDI_STOREFRONT_COLLECTIONS_REFRESH");
$("openMediaControlBtn")?.addEventListener("click",()=>post("STORE_CONTROL_NAVIGATE",{path:"/riaintra/success-factors/media-control"}));
$("saveProductBtn").onclick=saveProduct;
$("clearProductBtn").onclick=clearProduct;
$("deleteProductBtn").onclick=deleteProduct;
$("updateInventoryBtn").onclick=updateInventory;
$("clearInventoryBtn").onclick=()=>["inventoryRecord","inventoryProductId","inventoryVariantId","inventorySku","inventoryQuantity","inventoryReason"].forEach(id=>$(id).value="");
$("sendFulfillmentBtn").onclick=sendFulfillment;
$("clearFulfillmentBtn").onclick=()=>["fulfillmentOrderId","carrier","trackingNumber","orderNote"].forEach(id=>$(id).value="");
$("saveCollectionBtn").onclick=()=>saveCollection(false);
$("assignCollectionBtn").onclick=()=>saveCollection(true);
$("clearCollectionBtn").onclick=()=>["collectionTitle","collectionSlug","collectionDescription","collectionProductIds"].forEach(id=>$(id).value="");
$("savePromoBtn").onclick=savePromo;
$("clearPromoBtn").onclick=()=>["promoName","promoCode","promoValue","promoStarts","promoEnds","promoScope"].forEach(id=>$(id).value="");
$("clearAuditBtn").onclick=()=>{state.audit=[];renderAudit();};
$("query").addEventListener("input",()=>{renderProducts();renderInventory();});
$("orderFilter").addEventListener("change",renderOrders);

$("productVariant").onchange=fillVariant;
$("inventoryRecord").onchange=()=>{const i=state.inventory.find(x=>x.id===$("inventoryRecord").value);if(!i)return;$("inventoryProductId").value=i.productId;$("inventoryVariantId").value=i.variantId;$("inventoryQuantity").value=i.quantity??"";$("inventoryTracked").value=String(i.tracked);};
$("bulkPriceBtn").onclick=()=>{const value=$("bulkPriceValue").value;if(value===""||!Number.isFinite(Number(value))){status("Enter a price adjustment.","error");return}post("STORE_CONTROL_BULK_PRICE",{productIds:arr($("bulkProductIds").value),operation:$("bulkPriceOperation").value,value:Number(value),compareAtMode:"KEEP"})};
seedData();render();load();


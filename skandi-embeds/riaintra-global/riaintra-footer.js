
(()=>{
  const SOURCE="SKANDI_RIAINTRA_FOOTER",PARENT="SKANDI_WIX_PARENT";
  const LEGAL_PATH="/riaintra/success-factors/legal-internal";
  let config=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
  const post=(type,payload={})=>window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");

  function render(){
    const legalPath=String(config?.routes?.legalInternal||LEGAL_PATH);
    const links=Array.isArray(config?.internal?.footer?.links)?[...config.internal.footer.links]:[];
    if(!links.some(i=>String(i?.path||"")===legalPath)){
      links.push({label:"Legal & Policies",path:legalPath});
    }
    $("links").innerHTML=links.map(i=>`<button data-path="${esc(i.path)}">${esc(i.label)}</button>`).join("");
  }

  document.addEventListener("click",e=>{
    const path=e.target.closest("[data-path]")?.dataset.path;
    if(path)post("MASTER_NAVIGATE",{path});
  });

  window.addEventListener("message",e=>{
    const m=e.data||{};if(m.source!==PARENT)return;
    if(m.type==="SKANDI_MASTER_CONFIG"){config=m.payload||{};render()}
  });

  post("MASTER_CONFIG_REQUEST",{context:"riaintra-footer"});
})();

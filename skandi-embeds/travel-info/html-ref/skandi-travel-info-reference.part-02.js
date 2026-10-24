
(()=>{
"use strict";
const REDUCED=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
const FINE=window.matchMedia?.("(pointer:fine)")?.matches===true;
const REVEAL_SELECTOR=[
  ".ti-heading-row",
  ".ti-stage-btn",
  ".ti-featured-main",
  ".ti-question-btn",
  ".ti-gateway",
  ".ti-entity",
  ".ti-support-grid",
  ".ti-profile-hero",
  ".ti-story-section",
  ".ti-aside-card"
].join(",");
const REACTIVE_SELECTOR=[
  ".ti-stage-btn",
  ".ti-featured-main",
  ".ti-gateway",
  ".ti-entity"
].join(",");
const seen=new WeakSet();
let observer=null;

if(!REDUCED&&"IntersectionObserver" in window){
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.add("ti-motion-visible");
      observer.unobserve(entry.target);
    }
  },{threshold:.10,rootMargin:"0px 0px -6% 0px"});
}

function enhanceNode(root=document){
  const nodes=[];
  if(root.nodeType===1&&root.matches?.(REVEAL_SELECTOR))nodes.push(root);
  root.querySelectorAll?.(REVEAL_SELECTOR).forEach(node=>nodes.push(node));
  nodes.forEach(node=>{
    if(seen.has(node))return;
    seen.add(node);
    node.classList.add("ti-motion-reveal");
    if(node.matches(REACTIVE_SELECTOR))node.classList.add("ti-reactive-card");
    if(observer)observer.observe(node);
    else node.classList.add("ti-motion-visible");
  });
}

enhanceNode(document);

const mutationObserver=new MutationObserver(records=>{
  records.forEach(record=>{
    record.addedNodes.forEach(node=>{
      if(node.nodeType===1)enhanceNode(node);
    });
  });
});
mutationObserver.observe(document.body,{childList:true,subtree:true});

const hero=document.querySelector(".ti-atlas");
if(hero&&!REDUCED&&FINE){
  hero.addEventListener("pointermove",event=>{
    const rect=hero.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=((event.clientX-rect.left)/rect.width)*100;
    const y=((event.clientY-rect.top)/rect.height)*100;
    hero.style.setProperty("--hero-x",`${x.toFixed(1)}%`);
    hero.style.setProperty("--hero-y",`${y.toFixed(1)}%`);
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{
    hero.style.setProperty("--hero-x","72%");
    hero.style.setProperty("--hero-y","24%");
  },{passive:true});
}

if(!REDUCED&&FINE){
  let active=null;
  document.addEventListener("pointermove",event=>{
    const card=event.target.closest?.(REACTIVE_SELECTOR);
    if(active&&active!==card){
      active.style.transform="";
      active.style.removeProperty("--fx-x");
      active.style.removeProperty("--fx-y");
    }
    active=card||null;
    if(!card)return;
    const rect=card.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=((event.clientX-rect.left)/rect.width)*100;
    const y=((event.clientY-rect.top)/rect.height)*100;
    const rotateY=(x-50)*0.025;
    const rotateX=(50-y)*0.020;
    card.style.setProperty("--fx-x",`${x.toFixed(1)}%`);
    card.style.setProperty("--fx-y",`${y.toFixed(1)}%`);
    card.style.transform=`perspective(1000px) translateY(-4px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  },{passive:true});
  document.addEventListener("pointerout",event=>{
    const card=event.target.closest?.(REACTIVE_SELECTOR);
    if(!card||card.contains(event.relatedTarget))return;
    card.style.transform="";
    card.style.removeProperty("--fx-x");
    card.style.removeProperty("--fx-y");
    if(active===card)active=null;
  },{passive:true});
}

window.addEventListener("pagehide",()=>{
  mutationObserver.disconnect();
  observer?.disconnect();
},{once:true});
})();

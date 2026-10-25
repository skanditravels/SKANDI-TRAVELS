
(()=>{
"use strict";

const SOURCE="SKANDI_CLUB_INFO";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const $=id=>document.getElementById(id);

const DEFAULT_TIERS=[
  {key:"member",name:"Member",minPoints:0,maxPoints:24999,multiplier:1},
  {key:"silver",name:"Silver",minPoints:25000,maxPoints:49999,multiplier:1.25},
  {key:"gold",name:"Gold",minPoints:50000,maxPoints:99999,multiplier:1.5},
  {key:"diamond",name:"Diamond",minPoints:100000,maxPoints:null,multiplier:2}
];

let DATA={
  program:{name:"SKANDI Club",pointsName:"SKANDI Points"},
  tiers:DEFAULT_TIERS,
  rewards:[],
  faqs:[],
  settings:{pointsToCreditRate:.01,creditExample:"$10",programSubtitle:"Travel further, together."}
};

let STATUS={loggedIn:false};

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function toast(message){
  const node=$("toast");
  node.textContent=String(message||"");
  node.style.display="block";
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.style.display="none",2600);
}

function formatPoints(value){
  return Number(value||0).toLocaleString(undefined,{maximumFractionDigits:0});
}

function rangeLabel(tier={}){
  const min=Number(tier.minPoints||0);
  const max=tier.maxPoints===null||tier.maxPoints===undefined?null:Number(tier.maxPoints);
  return max===null
    ?`${formatPoints(min)}+`
    :`${formatPoints(min)}–${formatPoints(max)}`;
}

function multiplierLabel(value){
  const n=Number(value||1);
  return `${Number.isInteger(n)?n:n.toFixed(2).replace(/0+$/,"").replace(/\.$/,"")}× earn rate`;
}

function normalizedTiers(){
  const incoming=Array.isArray(DATA.tiers)?DATA.tiers:[];
  const byKey=new Map(incoming.map(tier=>[String(tier.key||"").toLowerCase(),tier]));
  return DEFAULT_TIERS.map(fallback=>({
    ...fallback,
    ...(byKey.get(fallback.key)||{})
  }));
}

function renderTiers(){
  normalizedTiers().forEach(tier=>{
    const card=document.querySelector(`[data-tier-key="${CSS.escape(tier.key)}"]`);
    if(!card)return;
    const range=card.querySelector("[data-tier-range]");
    const multiplier=card.querySelector("[data-tier-multiplier]");
    const name=card.querySelector(".tier-name");
    if(range)range.textContent=rangeLabel(tier);
    if(multiplier)multiplier.textContent=multiplierLabel(tier.multiplier);
    if(name)name.textContent=tier.name||tier.key;
  });
}

function money(value){
  return "$"+Number(value||0).toLocaleString(undefined,{
    minimumFractionDigits:0,
    maximumFractionDigits:2
  });
}

function calc(){
  const points=Math.max(0,Number($("pointsInput").value||0));
  const rate=Number(DATA.settings?.pointsToCreditRate||.01);
  $("calcResult").textContent=money(points*rate);
}

function renderRewards(){
  const rewards=Array.isArray(DATA.rewards)?DATA.rewards:[];
  $("rewardList").innerHTML=rewards.length
    ?rewards.map(reward=>`
      <article class="reward">
        <h3>${esc(reward.name||reward.title||"SKANDI Reward")}</h3>
        <p>${esc(reward.description||"Connected SKANDI Club reward.")}</p>
        <span class="tag">${esc(reward.pointsCost||reward.requiredPoints||"")} ${esc(DATA.program?.pointsName||"points")}</span>
      </article>
    `).join("")
    :`
      <article class="reward">
        <h3>SKANDI Credit</h3>
        <p>Eligible Club points can connect to SKANDI Credit according to the active reward rules in your account.</p>
        <span class="tag">Connected reward</span>
      </article>
      <article class="reward">
        <h3>Member offers</h3>
        <p>Club-linked offers and account benefits are surfaced through your signed-in SKANDI profile when available.</p>
        <span class="tag">Club benefit</span>
      </article>`;
}

function renderFaqs(){
  const incoming=Array.isArray(DATA.faqs)?DATA.faqs:[];
  const faqs=incoming.length?incoming:[
    {q:"Is SKANDI Club free?",a:"Yes. Customers can join SKANDI Club for free."},
    {q:"Which Club levels are available?",a:"The Club programme uses Member, Silver, Gold and Diamond tiers."},
    {q:"Where do I see my current tier?",a:"Sign in and open My Profile. Your live tier, points balance and progress are shown there."},
    {q:"How are tiers calculated?",a:"The public tier thresholds and earning multipliers shown on this page come from the active SKANDI Club tier configuration."}
  ];

  $("faqList").innerHTML=faqs.map((faq,index)=>`
    <article class="faq-item ${index===0?"open":""}">
      <button class="faq-q" type="button" aria-expanded="${index===0?"true":"false"}">
        <span>${esc(faq.q||faq.question||"Club question")}</span>
        <span>+</span>
      </button>
      <div class="faq-a">${esc(faq.a||faq.answer||"")}</div>
    </article>
  `).join("");
}

function render(){
  const program=DATA.program||{};
  const settings=DATA.settings||{};

  $("programName").textContent=program.name||"SKANDI Club";
  $("programSub").textContent=settings.programSubtitle||"Travel further, together.";
  $("pointsName").textContent=program.pointsName||settings.pointsName||"SKANDI Points";

  $("memberStatus").textContent=STATUS.loggedIn
    ?`Signed in as ${STATUS.name||"SKANDI Club member"}. Open My Profile for your live tier and points.`
    :"Not a member yet? Join free and start with Member tier.";

  renderTiers();
  renderRewards();
  renderFaqs();
  calc();
  requestHeight();
}

document.addEventListener("click",event=>{
  const auth=event.target.closest("[data-auth]");
  if(auth){
    post("SKANDI_CLUB_AUTH_OPEN",{mode:auth.dataset.auth||"signup"});
    return;
  }

  const profile=event.target.closest("[data-profile]");
  if(profile){
    post("SKANDI_CLUB_PROFILE_OPEN",{});
    return;
  }

  const faq=event.target.closest(".faq-q");
  if(faq){
    const item=faq.closest(".faq-item");
    const open=item.classList.toggle("open");
    faq.setAttribute("aria-expanded",open?"true":"false");
    requestHeight();
  }
});

$("calcBtn").addEventListener("click",calc);
$("pointsInput").addEventListener("input",calc);

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){
    try{message=JSON.parse(message)}catch(_){return}
  }
  if(!message||typeof message!=="object")return;
  if(message.source&&message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="SKANDI_CLUB_INFO_DATA"){
    DATA={
      ...DATA,
      ...payload,
      program:{...DATA.program,...(payload.program||{})},
      settings:{...DATA.settings,...(payload.settings||{})},
      tiers:Array.isArray(payload.tiers)?payload.tiers:DATA.tiers,
      rewards:Array.isArray(payload.rewards)?payload.rewards:DATA.rewards,
      faqs:Array.isArray(payload.faqs)?payload.faqs:DATA.faqs
    };
    render();
    return;
  }

  if(message.type==="SKANDI_CLUB_MEMBER_STATUS"){
    STATUS=payload.status||payload||{loggedIn:false};
    render();
    return;
  }

  if(message.type==="SKANDI_CLUB_INFO_ERROR"){
    toast(payload.message||"SKANDI Club information is unavailable.");
  }
});

let heightTimer=0;
function requestHeight(){
  clearTimeout(heightTimer);
  heightTimer=setTimeout(()=>{
    post("SKANDI_CLUB_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },60);
}

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

post("SKANDI_CLUB_INFO_READY",{});
render();
})();

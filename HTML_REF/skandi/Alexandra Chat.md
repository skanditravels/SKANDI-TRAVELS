# SKANDI ALEXANDRA CHAT — V12.6 WIX AI

## INFO / LOG
- System: SKANDI public Customer Service chat; belongs to `/about/support`.
- Wix page controller: `src/pages/How can we help_.k0iqp.js`.
- Existing Wix HTML component ID (do not rename): `#skandiSupportChatEmbed`.
- This source is the **complete replacement intended embed**, not a second Support page or a new component ID.
- Parent bridge: `SKANDI_WIX_PARENT`; chat bridge: `SKANDI_SUPPORT_CHAT`.
- Wix frontend facade: `backend/SKANDI_CORE/customerSupport.web.js`.
- AI backend: `backend/SKANDI_CORE/alexandraWixAi.js` + `alexandraKnowledge.js`.
- Canonical Support persistence/agent controls: existing `backend/SKANDI_CORE/customerSupport.js` with `customer_support_cases`, `customer_support_messages`.
- Human case routing remains the existing canonical method. AI replies cannot access or update customer records.
- Provider: Wix AI APIs through Wix AI SDK; *not* Wix AI Site-Chat (official docs say Site-Chat is Wix Editor only, current site uses Wix Studio).
- Verified: source and message shape checks. Requires live Wix AI credits/package installation, Studio embed sizing, and end-to-end testing.
- Existing primary Help Center `#skandiHelpCenterEmbed` HTML in `HTML_REF/skandi/How can we help.md` is **not changed** by this package.

## CHANGE LOG
- 2026-10-20 V12.6: New separately documented, complete Alexandra chat source for the existing shared Wix HTML component. The preceding chat embed's exact live source was unavailable in Git/HTML_REF; compare any newer Wix-only approved source before replacing it. Migrated Alexandra responses from LiveKit Agents to Wix AI SDK, retained existing UI bootstrap/open/case/human handoff bridge names and added `SUPPORT_CHAT_ALEXANDRA_MESSAGE`/`SUPPORT_CHAT_ALEXANDRA_REPLY` for text responses. No duplicate ticket store or customer-data lookup was added. Staff/Human support itself remains under canonical Support and may still depend on LiveKit.

## COMPLETE LIVE HTML SOURCE (replace only `#skandiSupportChatEmbed`)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Alexandra · SKANDI Customer Service</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#022e64;--deep:#03111f;--aqua:#5fc7cf;--ivory:#fbfaf6;--line:#dce3e8;--slate:#48596b}
*{box-sizing:border-box}html,body{min-height:100%;margin:0}body{font-family:Inter,system-ui,sans-serif;color:#16283c;background:transparent}button,textarea,input{font:inherit}button{cursor:pointer}button:disabled{opacity:.48;cursor:not-allowed}.hidden{display:none!important}
#chat{display:none;width:100%;max-width:590px;height:min(740px,calc(100dvh - 22px));min-height:480px;margin:0 auto;border:1px solid #cadce8;border-radius:20px;overflow:hidden;background:var(--ivory);box-shadow:0 20px 65px rgba(3,17,31,.19)}#chat.open{display:flex;flex-direction:column}
.head{display:flex;align-items:center;gap:13px;flex:none;padding:18px 19px;background:linear-gradient(135deg,#062749,#022e64);color:white}
.avatar{display:grid;place-items:center;width:43px;height:43px;flex:none;border:1px solid rgba(95,199,207,.55);border-radius:13px;background:rgba(95,199,207,.12);font:700 19px Montserrat,sans-serif;color:#9de0e5}
.head h1{margin:0;font:600 18px Montserrat,sans-serif;letter-spacing:-.03em}.head p{margin:4px 0 0;font-size:10px;color:rgba(255,255,255,.68)}.spacer{flex:1}.head button{border:1px solid rgba(255,255,255,.25);border-radius:30px;background:transparent;color:white;padding:7px 12px;font-size:11px;font-weight:700}
.disclaimer{flex:none;padding:10px 18px;border-bottom:1px solid var(--line);background:#f1f7f7;font-size:10px;color:#3f5b68;line-height:1.6}
.messages{flex:1;overflow:auto;min-height:0;padding:20px 17px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain}.bubble{max-width:91%;padding:12px 14px;border:1px solid #dbe4e7;border-radius:14px 14px 14px 3px;background:white;color:#273a4b;font-size:12px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}.bubble.user{align-self:flex-end;border-color:#022e64;background:#022e64;color:white;border-radius:14px 14px 3px 14px}.meta{font-size:9px;color:#77899a;margin-bottom:5px;font-weight:700;letter-spacing:.03em}.bubble.user .meta{color:#cbdce9}.status{flex:none;min-height:22px;padding:2px 17px;font-size:10px;color:#527584}.status.error{color:#983c37}.footer{flex:none;padding:12px 15px 15px;border-top:1px solid var(--line);background:white}.compose{display:flex;gap:9px}.compose textarea{flex:1;resize:none;min-width:0;min-height:48px;max-height:125px;padding:12px;border:1px solid #cbd7de;border-radius:12px;background:var(--ivory);font-size:12px;line-height:1.4}.compose button,.actions button,.case-form button{border:0;border-radius:12px;background:#022e64;color:white;padding:0 16px;min-height:45px;font-size:11px;font-weight:700}.compose button{min-width:68px}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.actions button{background:#eaf3f4;color:#022e64;min-height:37px}.actions button.primary{background:#022e64;color:#fff}
.case-form{display:none;padding:15px 17px;border-top:1px solid var(--line);background:#f4f6f7}.case-form.open{display:block}.case-form h2{margin:0 0 10px;font:600 14px Montserrat,sans-serif}.case-form p{margin:0 0 12px;color:#637386;font-size:11px;line-height:1.6}.case-form label{display:block;margin-bottom:8px;color:#44576a;font-size:10px;font-weight:700}.case-form input,.case-form textarea{display:block;width:100%;margin-top:5px;padding:9px 10px;border:1px solid #cad8e2;border-radius:9px;background:white;color:#17283a;font-size:12px}.case-form button{width:100%}#reopen{display:none}
@media(max-width:620px){#chat{height:100dvh;max-width:none;min-height:0;border-radius:0;border:0;box-shadow:none}.head{padding-top:max(15px,env(safe-area-inset-top));padding-bottom:15px}.messages{padding:15px 12px}.footer{padding-bottom:max(14px,env(safe-area-inset-bottom))}.bubble{max-width:95%}}
</style>
</head>
<body>
<section id="chat" role="region" aria-label="Alexandra SKANDI Customer Service">
  <header class="head"><div class="avatar" aria-hidden="true">A</div><div><h1>Alexandra</h1><p>SKANDI Digital Customer Service · AI</p></div><div class="spacer"></div><button id="close" type="button">Close</button></header>
  <div class="disclaimer">General travel guidance only. For bookings, payments, personal data or changes, use secure My Profile or contact SKANDI Customer Service. Please do not send card, passport or login information here.</div>
  <main id="messages" class="messages" role="log" aria-live="polite" aria-relevant="additions"></main>
  <div id="status" class="status" role="status" aria-live="polite"></div>
  <div class="footer"><form id="composeForm" class="compose"><textarea id="question" maxlength="1700" rows="2" placeholder="Ask Alexandra a travel question…" aria-label="Message Alexandra" required></textarea><button id="send" type="submit">Send</button></form><div class="actions"><button id="support" class="primary" type="button">SKANDI Customer Service</button><button id="newCase" type="button">Request follow-up</button><button id="travelHelp" type="button">Travel Assistant</button></div></div>
  <form id="caseForm" class="case-form"><h2>Request a Customer Service follow-up</h2><p>Support requests use SKANDI's case system. A ticket is created only when SKANDI confirms it. Do not send full payment, identity or passport information.</p><label>Your name<input id="caseName" maxlength="120" required autocomplete="name"></label><label>Email address<input id="caseEmail" type="email" maxlength="250" autocomplete="email" required></label><label>Subject<input id="caseSubject" maxlength="160" required value="Travel assistance request"></label><label>How can SKANDI help?<textarea id="caseDetails" rows="3" maxlength="2400" required></textarea></label><button type="submit" id="submitCase">Submit support request</button></form>
</section>
<script>
(()=>{'use strict';
const SOURCE='SKANDI_SUPPORT_CHAT',PARENT='SKANDI_WIX_PARENT';
const $=id=>document.getElementById(id);
let session='',pending=false,currentRequest='',counter=0,history=[],loggedIn=false,casePending=false,responseTimer=null,caseTimer=null;
const makeId=()=>`ax_${Date.now().toString(36)}_${(++counter).toString(36)}`;
const post=(type,payload={})=>window.parent.postMessage({source:SOURCE,type,requestId:payload.requestId||'',payload},'*');
const status=(message,bad=false)=>{$('status').textContent=message||'';$('status').classList.toggle('error',!!bad)};
function say(role,value){const text=String(value||'').slice(0,2400);if(!text)return;const node=document.createElement('div');node.className='bubble'+(role==='user'?' user':'');const meta=document.createElement('div');meta.className='meta';meta.textContent=role==='user'?'You':'Alexandra';const body=document.createElement('div');body.textContent=text;node.append(meta,body);$('messages').appendChild(node);$('messages').scrollTop=$('messages').scrollHeight;}
function busy(v){pending=!!v;$('send').disabled=v;$('question').disabled=v;}
function open(mode,info){$('chat').classList.add('open');if(mode==='FORM'){ $('caseForm').classList.add('open');return; }$('caseForm').classList.remove('open');if(mode==='ALEXANDRA'){session=String(info.alexandraSession?.sessionId||'');loggedIn=info.loggedIn===true;history=[];$('messages').replaceChildren();say('assistant','Welcome to SKANDI Travels. I’m Alexandra, your AI travel assistant. How can I help?');status(session?'Ask a question below.':'The assistant session could not start.',!session);}}
$('close').addEventListener('click',()=>{$('chat').classList.remove('open');$('caseForm').classList.remove('open')});
$('composeForm').addEventListener('submit',event=>{event.preventDefault();const message=$('question').value.trim();if(!message||pending||!session)return;const requestId=makeId();currentRequest=requestId;say('user',message);$('question').value='';busy(true);status('Alexandra is preparing a response…');clearTimeout(responseTimer);responseTimer=setTimeout(()=>{if(currentRequest===requestId&&pending){busy(false);status('Alexandra did not respond in time. Please try again.',true)}},35000);post('SUPPORT_CHAT_ALEXANDRA_MESSAGE',{requestId,sessionId:session,message,history:history.slice(-8)});history.push({role:'user',content:message});});
$('newCase').addEventListener('click',()=>{$('caseForm').classList.toggle('open');$('caseDetails').value=$('caseDetails').value||'I would like help from SKANDI Customer Service.'});
$('support').addEventListener('click',()=>{post('SUPPORT_CHAT_NAVIGATE',{path:'/my-profile/support'})});
$('travelHelp').addEventListener('click',()=>{post('SUPPORT_CHAT_NAVIGATE',{path:'/my-profile/travel-assistance'})});
$('caseForm').addEventListener('submit',event=>{event.preventDefault();if(casePending)return;casePending=true;$('submitCase').disabled=true;status('Submitting to SKANDI Customer Service…');clearTimeout(caseTimer);caseTimer=setTimeout(()=>{if(casePending){casePending=false;$('submitCase').disabled=false;status('SKANDI did not confirm the request in time. Please check your cases before retrying.',true)}},35000);const fullName=$('caseName').value.trim(),names=fullName.split(/\s+/);const details=$('caseDetails').value.trim();post('SUPPORT_CHAT_SUBMIT_FORM',{requestId:makeId(),input:{firstName:names[0]||'',lastName:names.slice(1).join(' '),fullName,email:$('caseEmail').value.trim(),subject:$('caseSubject').value.trim(),message:details,category:'general',subCategory:'general-question',source:'help-center',sourceChannel:'HELP_CENTER'}})});
window.addEventListener('message',event=>{if(event.source!==window.parent)return;let m=event.data;if(typeof m==='string'){try{m=JSON.parse(m)}catch(_){return}}if(!m||m.source!==PARENT)return;const p=m.payload||{};switch(m.type){
 case 'SUPPORT_CHAT_BOOTSTRAP':return;
 case 'SUPPORT_CHAT_OPEN':open(p.mode,p);return;
 case 'SUPPORT_CHAT_ALEXANDRA_REPLY':if(p.requestId!==currentRequest)return;clearTimeout(responseTimer);busy(false);status('');say('assistant',p.reply||'I could not prepare an answer.');if(p.reply)history.push({role:'assistant',content:p.reply});return;
 case 'SUPPORT_CHAT_CASE_CREATED':clearTimeout(caseTimer);casePending=false;$('submitCase').disabled=false;if(p.caseId||p.caseRef){$('caseForm').classList.remove('open');status(`Your SKANDI Customer Service case was submitted: ${p.caseRef||p.caseId}.`);}else status('Support did not return a case number. Please try the support page.',true);return;
 case 'SUPPORT_CHAT_HUMAN_HANDOFF':status(p.caseRef||p.caseId?`A Customer Service case was created: ${p.caseRef||p.caseId}. Continue in My Support.`:'The handoff did not return a case reference. Please contact Customer Service.',!(p.caseRef||p.caseId));return;
 case 'SUPPORT_CHAT_ERROR':clearTimeout(responseTimer);clearTimeout(caseTimer);busy(false);casePending=false;$('submitCase').disabled=false;status(p.message||'The request could not be completed.',true);return;
 default:return;
 }});
post('SUPPORT_CHAT_READY');
})();
</script>
</body>
</html>
```

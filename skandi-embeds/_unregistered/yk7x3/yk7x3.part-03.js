
(function(){
  "use strict";
  const SKANDI_R0037_LIVEKIT_MEMBER_SUPPORT=true;
  const PARENT="SKANDI_WIX_PARENT";
  const DEFAULT_TOPIC="skandi.support.chat";
  let room=null,session=null,connecting=null,activeCaseId="";
  const escLK=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  async function disconnect(){try{if(room)await room.disconnect();}catch(_){} room=null;session=null;connecting=null;}
  async function connect(s){
    if(!s?.url||!s?.token||!window.LivekitClient)return null;
    if(room&&session?.roomName===s.roomName&&room.state==="connected")return room;
    if(connecting)return connecting;
    connecting=(async()=>{await disconnect();const r=new window.LivekitClient.Room({adaptiveStream:true,dynacast:true});const topic=s.textTopic||DEFAULT_TOPIC;
      r.registerTextStreamHandler(topic,async(reader,participant)=>{if(participant?.identity===r.localParticipant?.identity)return;const text=await reader.readAll();const box=document.getElementById("messages");if(!box||!text)return;const wrap=document.createElement("div");wrap.className="msg-wrapper agent";wrap.innerHTML=`<div class="chat-avatar agent">S</div><div class="msg-content"><span class="msg-sender">SKANDI Support</span><div class="msg-bubble">${escLK(text)}</div></div>`;box.appendChild(wrap);box.scrollTop=box.scrollHeight;});
      await r.connect(s.url,s.token);room=r;session=s;return r;})().finally(()=>connecting=null);return connecting;
  }
  async function publish(sent,s){const text=String(sent?.message||sent?.content||"").trim();if(!text)return;const r=await connect(s);if(!r)return;await r.localParticipant.sendText(text,{topic:s?.textTopic||DEFAULT_TOPIC,attributes:{caseId:activeCaseId,messageId:String(sent?.messageId||sent?.message_id||""),senderType:"customer"}});}
  window.addEventListener("message",e=>{const m=e.data||{};if(m.source!==PARENT)return;const p=m.payload||{};if(m.type==="CUSTOMER_CASE_DETAIL"){activeCaseId=String(p.case?.caseId||p.case?.case_id||"");connect(p.livekitSession).catch(()=>{});}if(m.type==="CUSTOMER_REPLY_SENT"){activeCaseId=String(p.case?.caseId||p.case?.case_id||activeCaseId);publish(p.sentMessage,p.livekitSession).catch(()=>{});}if(m.type==="CUSTOMER_CASE_CREATED"){activeCaseId=String(p.caseId||p.case?.caseId||p.case?.case_id||activeCaseId);connect(p.livekitSession).catch(()=>{});}});
})();

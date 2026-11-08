
/* V12 realtime rule: customer text reaches this room only after the canonical Customer Support backend has persisted it to Supabase. Agent replies publish to LiveKit only after AGENT_REPLY_SENT confirms canonical persistence. */
(function(){
  "use strict";
  const SKANDI_R0071_LIVEKIT_AGENT_SUPPORT=true;
  const PARENT="SKANDI_WIX_PARENT";const DEFAULT_TOPIC="skandi.support.chat";let room=null,session=null,connecting=null,activeCaseId="",audioEnabled=false,audioRequest=0,audioRequested=false;const audioElements=new Set();
  const escLK=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  function clearAudio(){for(const el of audioElements)el.remove();audioElements.clear()}
  function attachAudio(track){if(!audioEnabled||track?.kind!=="audio")return;const el=track.attach();el.autoplay=true;document.body.appendChild(el);audioElements.add(el)}
  async function disconnect(){audioEnabled=false;clearAudio();try{if(room)await room.disconnect();}catch(_){}room=null;session=null;connecting=null;}
  async function connect(s){if(!s?.url||!s?.token||!window.LivekitClient)return null;if(room&&session?.roomName===s.roomName&&room.state==="connected")return room;if(connecting)return connecting;connecting=(async()=>{await disconnect();const r=new window.LivekitClient.Room({adaptiveStream:true,dynacast:true});const topic=s.textTopic||DEFAULT_TOPIC;r.on(window.LivekitClient.RoomEvent.TrackSubscribed,attachAudio);r.on(window.LivekitClient.RoomEvent.Disconnected,()=>{if(audioEnabled){audioEnabled=false;clearAudio();window.dispatchEvent(new CustomEvent("skandi-support-audio-failed"))}});r.registerTextStreamHandler(topic,async(reader,participant)=>{if(participant?.identity===r.localParticipant?.identity)return;const text=await reader.readAll();const box=document.getElementById("conversation");if(!box||!text)return;const article=document.createElement("article");article.className="msg customer";article.innerHTML=`<div class="avatar">T</div><div class="bubble"><div class="mmeta"><b>Traveler</b><span>now</span><span class="mkind">LiveKit</span></div><div class="mtext">${escLK(text)}</div></div>`;box.appendChild(article);box.scrollTop=box.scrollHeight;});await r.connect(s.url,s.token);room=r;session=s;return r;})().finally(()=>connecting=null);return connecting;}
  async function publish(sent,s){const text=String(sent?.message||sent?.content||"").trim();if(!text||!s)return;const r=await connect(s);if(!r)return;await r.localParticipant.sendText(text,{topic:s.textTopic||DEFAULT_TOPIC,attributes:{caseId:activeCaseId,messageId:String(sent?.messageId||sent?.message_id||""),senderType:"agent"}});}
  window.addEventListener("message",e=>{const m=e.data||{};if(m.source!==PARENT)return;const p=m.payload||{};
    if(m.type==="AGENT_CASE_DETAIL"){activeCaseId=String(p.case?.caseId||p.case?.case_id||activeCaseId);connect(p.livekitSession).catch(()=>{});}
    if(m.type==="AGENT_LIVEKIT_SESSION"){
      activeCaseId=String(p.case?.caseId||p.case?.case_id||activeCaseId);
      if(!audioRequested)return;
      const request=audioRequest;
      (async()=>{const r=await connect(p.livekitSession);if(!r)throw new Error("Support audio unavailable");if(!audioRequested||request!==audioRequest)return;audioEnabled=true;await r.startAudio();await r.localParticipant.setMicrophoneEnabled(true);if(!audioRequested||request!==audioRequest){await r.localParticipant.setMicrophoneEnabled(false);return}for(const participant of r.remoteParticipants.values())for(const publication of participant.trackPublications.values())if(publication.track)attachAudio(publication.track);window.dispatchEvent(new CustomEvent("skandi-support-audio-ready"));})().catch(async()=>{audioEnabled=false;clearAudio();try{await room?.localParticipant?.setMicrophoneEnabled(false)}catch(_){}if(request===audioRequest)window.dispatchEvent(new CustomEvent("skandi-support-audio-failed"))});
    }
    if(m.type==="AGENT_REPLY_SENT"&&p.privateNote!==true&&p.livekitSession){activeCaseId=String(p.case?.caseId||p.case?.case_id||activeCaseId);publish(p.sentMessage,p.livekitSession).catch(()=>{});}
  });
  window.addEventListener("skandi-support-audio-start",()=>{audioRequest++;audioRequested=true});
  window.addEventListener("skandi-support-audio-end",()=>{audioRequest++;audioRequested=false;audioEnabled=false;clearAudio();room?.localParticipant?.setMicrophoneEnabled(false).catch(()=>{})});
  window.addEventListener("skandi-support-audio-mute",async()=>{if(!audioEnabled||!room)return;try{const muted=room.localParticipant.isMicrophoneEnabled;await room.localParticipant.setMicrophoneEnabled(!muted);window.dispatchEvent(new CustomEvent("skandi-support-audio-mute-changed",{detail:{muted}}))}catch(_){window.dispatchEvent(new CustomEvent("skandi-support-audio-failed"))}});
})();

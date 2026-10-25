
(()=>{'use strict';const SOURCE='SKANDI_SUPPORT_CHAT',PARENT='SKANDI_WIX_PARENT',$=id=>document.getElementById(id);let sessionId='',pending=false,casePending=false,currentRequest='',loggedIn=false,counter=0,history=[],messages=[],responseTimer=null,caseTimer=null,opened=false,connected=false,liveRoom=null,liveEpoch=0,replyArrived=false;
const makeId=()=>`ax_${Date.now().toString(36)}_${(++counter).toString(36)}`;
const post=(type,payload={})=>window.parent.postMessage({source:SOURCE,type,requestId:payload.requestId||'',payload},'*');
const status=(message,bad=false)=>{$('status').textContent=message||'';$('status').classList.toggle('error',bad)};
const video=document.querySelector('video');if(video){video.playbackRate=0.75;video.addEventListener('ratechange',()=>{if(video.playbackRate!==0.75)video.playbackRate=0.75})}
function say(role,text,save=true){const content=String(text||'').slice(0,1900);if(!content)return;const node=document.createElement('div');node.className='bubble'+(role==='user'?' user':'');const meta=document.createElement('div');meta.className='meta';meta.textContent=role==='user'?'You':'Alexandra';const body=document.createElement('div');body.textContent=content;node.append(meta,body);$('messages').append(node);$('messages').scrollTop=$('messages').scrollHeight;if(save){messages.push({role,content});messages=messages.slice(-18);snapshot()}}
function snapshot(){post('SUPPORT_CHAT_SNAPSHOT',{messages:messages.slice(-18),history:history.slice(-8)})}
function busy(flag){pending=flag;$('send').disabled=flag||!connected;$('question').disabled=flag||!connected}
function disconnectLive(){liveEpoch++;const old=liveRoom;liveRoom=null;connected=false;clearTimeout(responseTimer);busy(false);try{old?.disconnect()}catch(_){}}
async function connectLive(session){
  disconnectLive();const epoch=liveEpoch,sdk=window.LivekitClient;
  if(!sdk?.Room||!session?.url||!session?.token){status('LiveKit could not initialize. Reload the page and retry.',true);return}
  const room=new sdk.Room({adaptiveStream:true,dynacast:true});liveRoom=room;
  const onText=async(reader,participant)=>{
    if(epoch!==liveEpoch||participant?.identity===room.localParticipant?.identity)return;
    try{const text=String(await reader.readAll()||'').trim().slice(0,1900);if(!text||epoch!==liveEpoch||room!==liveRoom)return;
      replyArrived=true;clearTimeout(responseTimer);busy(false);say('assistant',text);history.push({role:'assistant',content:text});history=history.slice(-8);snapshot();status('');
    }catch(_){if(epoch===liveEpoch)status('Alexandra response could not be read.',true)}
  };
  room.registerTextStreamHandler('lk.transcription',onText);
  room.registerTextStreamHandler('lk.chat',onText);
  room.on(sdk.RoomEvent.Disconnected,()=>{if(epoch!==liveEpoch)return;connected=false;busy(false);status('Alexandra disconnected. Minimise and reopen to reconnect.',true)});
  try{await room.connect(session.url,session.token);if(epoch!==liveEpoch){room.disconnect();return}connected=true;busy(false);status('')}
  catch(_){if(epoch===liveEpoch){connected=false;busy(false);status('LiveKit connection failed. Minimise and reopen Alexandra.',true)}}
}
function open(info){
  opened=true;const next=info?.alexandraSession;
  if(!next?.sessionId||!next?.url||!next?.token){status('Alexandra did not confirm the LiveKit session.',true);return}
  const isNew=next.sessionId!==sessionId;sessionId=String(next.sessionId);loggedIn=info.loggedIn===true;
  if(isNew){messages=[];history=[];$('messages').replaceChildren();if(Array.isArray(info?.messages)&&info.messages.length){
      for(const item of info.messages.slice(-18))if(item&&['user','assistant'].includes(item.role))say(item.role,item.content,false);
      messages=info.messages.slice(-18).filter(item=>item&&['user','assistant'].includes(item.role));history=Array.isArray(info.history)?info.history.slice(-8):[];
    }else say('assistant','Welcome to SKANDI Travels. I’m Alexandra, your AI travel assistant. How can I help?')}
  snapshot();status('Connecting to Alexandra...');void connectLive(next);
}
$('close').addEventListener('click',()=>{$('caseForm').classList.remove('open');disconnectLive();post('SUPPORT_CHAT_PANEL_CLOSE')});
$('composeForm').addEventListener('submit',async event=>{
  event.preventDefault();const message=$('question').value.trim();
  if(!message||pending)return;
  if(!connected||!liveRoom){status('Alexandra is disconnected. Reopen chat to try again.',true);return}
  const id=makeId();currentRequest=id;replyArrived=false;busy(true);status('Sending to Alexandra...');
  try{await liveRoom.localParticipant.sendText(message,{topic:'lk.chat'});if(currentRequest!==id)return;
    say('user',message);$('question').value='';history.push({role:'user',content:message});history=history.slice(-8);snapshot();
    if(!replyArrived){status('Alexandra is preparing a response...');clearTimeout(responseTimer);
      responseTimer=setTimeout(()=>{if(currentRequest===id&&pending){busy(false);status('Alexandra did not respond. You can try again.',true)}},35000);}
  }catch(_){if(currentRequest===id){busy(false);status('Message not sent through LiveKit. Please retry.',true)}}
});
$('newCase').addEventListener('click',()=>{$('caseForm').classList.toggle('open');$('caseDetails').value=$('caseDetails').value||'I would like assistance from SKANDI Customer Service.'});$('support').addEventListener('click',()=>post('SUPPORT_CHAT_NAVIGATE',{path:loggedIn?'/my-profile?section=support&view=cases':'/about/support'}));
$('caseForm').addEventListener('submit',event=>{event.preventDefault();if(casePending)return;casePending=true;$('submitCase').disabled=true;status('Submitting your request...');clearTimeout(caseTimer);caseTimer=setTimeout(()=>{if(casePending){casePending=false;$('submitCase').disabled=false;status('SKANDI did not confirm the request. Check My Support before retrying.',true)}},35000);const fullName=$('caseName').value.trim(),names=fullName.split(/\s+/);post('SUPPORT_CHAT_SUBMIT_FORM',{requestId:makeId(),input:{firstName:names[0]||'',lastName:names.slice(1).join(' '),fullName,email:$('caseEmail').value.trim(),subject:$('caseSubject').value.trim(),message:$('caseDetails').value.trim(),category:'general'}})});
window.addEventListener('message',event=>{if(event.source!==window.parent)return;let m=event.data;if(typeof m==='string'){try{m=JSON.parse(m)}catch(_){return}}if(!m||m.source!==PARENT)return;const p=m.payload||{};switch(m.type){case 'SUPPORT_CHAT_OPEN':open(p);return;case 'SUPPORT_CHAT_CASE_CREATED':clearTimeout(caseTimer);casePending=false;$('submitCase').disabled=false;if(p.caseId||p.caseRef){$('caseForm').classList.remove('open');status('Case submitted: '+(p.caseRef||p.caseId))}else status('The server did not confirm the case.',true);return;case 'SUPPORT_CHAT_ERROR':clearTimeout(caseTimer);casePending=false;$('submitCase').disabled=false;status(p.message||'Request failed.',true);return;default:return}});
busy(false);post('SUPPORT_CHAT_READY');setTimeout(()=>{if(!opened)post('SUPPORT_CHAT_READY')},900);setTimeout(()=>{if(!opened)post('SUPPORT_CHAT_READY')},2600);
})();

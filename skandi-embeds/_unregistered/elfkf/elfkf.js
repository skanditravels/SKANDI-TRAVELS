
  (() => {
    'use strict';
    const SOURCE='SKANDI_DUFFEL_ASSISTANT', PARENT='SKANDI_WIX_PARENT';
    const el=id=>document.getElementById(id), choices=[];
    let usable=false,pending=false,loadingScript=null,requestId='',keyTimer=null,currentCaseId='',notificationCount=0,staffCaseId='',prefillBooking='',prefillIssue='',activeBookingId='',activeResourceType='',mobileAutoOpenAttempted=false;
    const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},'*')}
    function status(message,isError=false){el('supportStatus').textContent=String(message||'');el('supportStatus').classList.toggle('error',isError);el('mobileStatus').textContent=String(message||'');el('mobileStatus').style.color=isError?'#ffbcb7':''}
    function pendingState(value){pending=!!value;el('open').disabled=pending||!usable;el('open').textContent=pending?'Preparing Assistant…':'Open Duffel Assistant';el('mobileOpen').disabled=pending||!usable;el('mobileOpen').textContent=pending?'Preparing secure session…':'Open Duffel Assistant'}
    function loadScript(){
      if(typeof window.openDuffelAssistant==='function')return Promise.resolve();
      if(loadingScript)return loadingScript;
      loadingScript=new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src='https://assets.duffel.com/assistant/custom-element.js';script.async=true;
        script.onload=()=>typeof window.openDuffelAssistant==='function'?resolve():reject(new Error('Duffel Assistant did not initialize.'));
        script.onerror=()=>reject(new Error('Duffel Assistant resources were blocked or unavailable. Check the Wix embed permissions.'));
        document.head.appendChild(script);
      }).catch(error=>{loadingScript=null;throw error});
      return loadingScript;
    }
    function renderTrips(trips){
      choices.length=0;const select=el('trip');select.replaceChildren(new Option('All linked Duffel trips',''));
      for(const trip of Array.isArray(trips)?trips:[]){
        if(!trip?.bookingId||!['air','stay'].includes(trip.resourceType))continue;
        const optionIndex=String(choices.length);
        const label=[trip.kind,trip.label,trip.route,trip.departureDate].filter(Boolean).join(' · ').slice(0,245);
        choices.push({bookingId:trip.bookingId,resourceType:trip.resourceType});select.add(new Option(label,optionIndex));
      }
      el('heroTrips').textContent=String(choices.length);
      if(prefillBooking){
        const index=choices.findIndex(x=>x.bookingId===prefillBooking);
        if(index>=0)select.value=String(index);
      }
      el('verify').disabled=!usable||!currentCaseId||select.value===''||choices[Number(select.value)]?.bookingId!==activeBookingId||choices[Number(select.value)]?.resourceType!==activeResourceType;
    }
    function renderActivity(data){
      if(!data?.supportCaseId)return;
      currentCaseId=String(data.supportCaseId);
      el('heroCase').textContent=String(data.supportCaseRef||'Assigned');
      const events=Array.isArray(data.events)?data.events:[];
      const skandi=Array.isArray(data.skandiMessages)?data.skandiMessages:[];
      const timeline=[...events.map(x=>({...x,sender:'Duffel Assistant activity'})),...skandi.map(x=>({...x,sender:x.sender||'SKANDI Customer Service'}))];
      timeline.sort((a,b)=>new Date(b.at||0)-new Date(a.at||0));
      el('activityCaption').textContent=`${events.length} recorded events · ${skandi.length} SKANDI messages`;
      el('activityHistory').innerHTML=timeline.length?timeline.slice(0,60).map(event=>{
        const date=event.at?new Date(event.at).toLocaleString():'';
        const message=String(event.text||'');
        return `<div class="history-entry"><time>${esc(date)}</time><div><strong>${esc(event.sender)}</strong><p>${esc(message)}</p></div></div>`;
      }).join(''):'<div class="history-empty">Your SKANDI Customer Service case is linked. Assistant activity and SKANDI customer-visible messages will appear here.</div>';
    }
    function eventLog(eventType){if(currentCaseId)post('DUFFEL_ASSISTANT_EVENT',{supportCaseId:currentCaseId,eventType})}
    function openAssistant(){
      if(pending||!usable)return;
      const index=el('trip').value,choice=index===''?null:choices[Number(index)];
      if(index!==''&&!choice){status('Your booking list changed. Refresh and try again.',true);return}
      pendingState(true);status('Preparing secure Duffel travel support and linking Customer Service…');
      requestId=`das_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
      post('DUFFEL_ASSISTANT_KEY_REQUEST',{requestId,bookingId:choice?.bookingId||'',resourceType:choice?.resourceType||'',issueType:el('issue').value,supportCaseId:staffCaseId});
      clearTimeout(keyTimer);
      keyTimer=setTimeout(()=>{if(!pending)return;pendingState(false);requestId='';status('The Assistant could not be prepared in time. Try again or contact SKANDI Support.',true)},45000);
    }
    el('open').addEventListener('click',openAssistant);
    el('mobileOpen').addEventListener('click',openAssistant);
    el('mobileSupport').addEventListener('click',()=>post('DUFFEL_ASSISTANT_SUPPORT'));
    el('mobileSignIn').addEventListener('click',()=>post('DUFFEL_ASSISTANT_SIGN_IN'));
    el('trip').addEventListener('change',()=>{
      const chosen=choices[Number(el('trip').value)];
      el('verify').disabled=!usable||el('trip').value===''||!currentCaseId||chosen?.bookingId!==activeBookingId||chosen?.resourceType!==activeResourceType;
    });
    el('verify').addEventListener('click',()=>{
      if(!currentCaseId||el('trip').value===''){
        status('Open Assistant for the selected booking before verifying supplier status.',true);return;
      }
      status('Checking live Duffel booking information against the linked SKANDI support record…');
      const chosen=choices[Number(el('trip').value)];
      post('DUFFEL_ASSISTANT_VERIFY',{supportCaseId:currentCaseId,bookingId:chosen?.bookingId||'',resourceType:chosen?.resourceType||''});
    });
    el('refresh').addEventListener('click',()=>{status('Refreshing your SKANDI trips…');post('DUFFEL_ASSISTANT_LIST')});
    el('refreshNav').addEventListener('click',()=>el('refresh').click());
    el('signIn').addEventListener('click',()=>post('DUFFEL_ASSISTANT_SIGN_IN'));
    ['supportAside','supportNav'].forEach(id=>el(id)?.addEventListener('click',()=>post('DUFFEL_ASSISTANT_SUPPORT')));
    document.querySelectorAll('[data-category-toggle]').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.side-category');const open=!item.classList.contains('open');item.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}));
    document.querySelectorAll('[data-scroll-to]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-scroll-to]').forEach(x=>x.classList.remove('active'));button.classList.add('active');el(button.dataset.scrollTo)?.scrollIntoView({behavior:'smooth',block:'start'})}));
    window.addEventListener('message',async event=>{
      const data=event.data;
      if(event.origin==='https://assets.duffel.com'&&data&&typeof data==='object'){
        if(data.type==='duffel-assistant-minimise'){status('Assistant minimised. Open it again to continue.');eventLog('MINIMISED')}
        if(data.type==='duffel-assistant-new-message'){notificationCount++;status(`Duffel has sent ${notificationCount} new message notification${notificationCount===1?'':'s'}. Open Assistant to view messages.`);eventLog('NEW_MESSAGE_NOTICE')}
        return;
      }
      if(event.source!==window.parent)return;
      let message=data;if(typeof message==='string'){try{message=JSON.parse(message)}catch{return}}
      if(!message||message.source!==PARENT)return;
      const payload=message.payload||{};
      switch(message.type){
        case 'DUFFEL_ASSISTANT_HOST_READY':
          staffCaseId=String(payload.prefill?.supportCaseId||'');
          prefillBooking=String(payload.prefill?.bookingId||'');
          prefillIssue=String(payload.prefill?.issueType||'');
          if(['change','cancellation','other'].includes(prefillIssue))el('issue').value=prefillIssue;
          post('DUFFEL_ASSISTANT_READY');break;
        case 'DUFFEL_ASSISTANT_TRIPS':
          usable=true;renderTrips(payload.trips);pendingState(false);el('signIn').classList.add('hidden');el('mobileSignIn').classList.add('hidden');
          status(choices.length?'Choose a flight or hotel booking, or open Assistant for all linked Duffel trips.':'No eligible bookings are listed yet. You can still open Assistant for your Duffel account.');
          // Try the provider's native mobile UI automatically once. If iOS Safari requires a
          // click gesture, the accessible Open Duffel Assistant button remains available.
          if(window.matchMedia('(max-width:620px), (max-width:950px) and (pointer:coarse)').matches&&!mobileAutoOpenAttempted){mobileAutoOpenAttempted=true;openAssistant();}
          break;
        case 'DUFFEL_ASSISTANT_OPEN':
          if(payload.requestId!==requestId||!pending)return;
          clearTimeout(keyTimer);requestId='';currentCaseId=String(payload.supportCaseId||'');
          el('heroCase').textContent=String(payload.supportCaseRef||'Assigned');
          activeBookingId=String(payload.activeSessionBookingId||'');activeResourceType=String(payload.activeSessionResourceType||'');
          el('trip').dispatchEvent(new Event('change'));
          if(!payload.clientKey){pendingState(false);status('Duffel did not issue a secure client key.',true);return}
          try{
            await loadScript();
            const config={clientKey:payload.clientKey,showMinimiseButton:true};
            if(['cancellation','change','other'].includes(payload.issueType))config.context={issueType:payload.issueType};
            if(payload.handoffSummary){
              config.context={...config.context,summary:String(payload.handoffSummary).slice(0,1800),issueType:payload.issueType||'other'};
              el('handoffNote').classList.remove('hidden');
              el('handoffNote').textContent='A SKANDI Customer Service agent prepared context for Duffel travel support. The summary will be passed when you open Assistant.';
            }else{
              el('handoffNote').classList.add('hidden');
            }
            window.openDuffelAssistant(config);
            eventLog('UI_HANDOFF_REQUESTED');
            if(payload.handoffSummary)eventLog('STAFF_CONTEXT_SUBMITTED');
            status('Duffel Assistant opened. Service activity is recorded under your SKANDI Customer Service reference.');
          }catch(err){eventLog('LAUNCH_FAILED');status(err?.message||'The Assistant could not open.',true)}
          finally{pendingState(false)}
          break;
        case 'DUFFEL_ASSISTANT_ACTIVITY':renderActivity(payload);break;
        case 'DUFFEL_ASSISTANT_VERIFICATION':
          if(payload.checked){status(payload.discrepancy?'Duffel confirms a supplier-state discrepancy. SKANDI Customer Service must reconcile booking, documents and any customer refund.':payload.reviewRequired?'Duffel booking state verified; Customer Service review is required.':'Live Duffel booking status checked; no confirmed servicing discrepancy was identified.');}
          else status('Provider verification was not available for this booking. Contact SKANDI Customer Service.',true);
          break;
        case 'DUFFEL_ASSISTANT_VERIFICATION_ERROR':status(payload.message||'Supplier verification could not be completed.',true);break;
        case 'DUFFEL_ASSISTANT_ACTIVITY_ERROR':status(payload.message||'The Customer Service activity could not be loaded.',true);break;
        case 'DUFFEL_ASSISTANT_ERROR':
          if(payload.requestId&&requestId&&payload.requestId!==requestId)return;
          clearTimeout(keyTimer);requestId='';pendingState(false);status(payload.message||'Duffel Assistant is unavailable.',true);
          if(payload.code==='LOGIN_REQUIRED'){el('signIn').classList.remove('hidden');el('mobileSignIn').classList.remove('hidden');}
          break;
        default:break;
      }
    });
    post('DUFFEL_ASSISTANT_READY');[350,1000,2400].forEach(delay=>setTimeout(()=>{if(!usable)post('DUFFEL_ASSISTANT_READY')},delay));
  })();
  
const SOURCE='SKANDI_HOME_MOBILE_APP';
  const PARENT='SKANDI_WIX_PARENT';
  const ROUTE_FALLBACKS=Object.freeze({
    home:'/', destinations:'/destinations', 
    myTrips:'/my-profile?tab=trips', myProfile:'/my-profile'
  });
  const defaults={
    ...ROUTE_FALLBACKS,
    travelInfo:'/travel-info',flights:'/flights',hotels:'/hotels',packages:'/packages',
    cruises:'/cruises',tours:'/tours',carRental:'/car-rental',transfers:'/transfers',
    skandiCollection:'/skandi-collection',voy:'/voy-magazine',club:'/skandi-club',
    support:'/about/support',theStore:'/the-store',about:'/about'
  };
  const groups=[
    {title:'Book & travel',keys:[['Flights','flights'],['Hotels','hotels'],['Packages','packages'],['Cruises','cruises'],['Tours & Activities','tours'],['Car rental','carRental'],['Transfers','transfers']]},
    {title:'Explore',keys:[['Destinations','destinations'],['SKANDI Collection','skandiCollection'],['VOY Magazine','voy'],['Travel information','travelInfo']]},
    {title:'Your SKANDI',keys:[['My Trips','myTrips'],['SKANDI Club','club'],['My Profile','myProfile'],['The Store','theStore'],['Help Center','support'],['About SKANDI','about']]}
  ];
  const $=id=>document.getElementById(id);
  const BUTTONS=Array.from(document.querySelectorAll('#skandi-mobile-nav-root [data-route]'));
  const menuButton=BUTTONS.find(btn=>btn.dataset.route==='menu');
  const drawer=$('drawer');
  const status=$('status');
  const state={routes:{...defaults},currentPath:'/',request:0,drawerOpen:false,drawerPending:'',drawerTimer:null,chatOpen:false,lastFocused:null};
  let focusTransitionToken=0;
  const safePath=value=>{
    const path=String(value||'').trim();
    return /^\/(?!\/)/.test(path) && !/[\\\u0000-\u0020]/.test(path) && !/%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(path)?path:'';
  };
  const nextId=key=>key+'-'+Date.now()+'-'+(++state.request);
  function post(type,payload={},requestId=''){
    const message={source:SOURCE,type,payload,timestamp:new Date().toISOString()};
    if(requestId)message.requestId=requestId;
    window.parent.postMessage(message,'*');
  }
  function pathFor(key){return safePath(state.routes[key])||safePath(defaults[key]);}
  function updateActive(){
    const current=safePath(state.currentPath)||'/';
    const normalized=current.split('?')[0];
    let active='';
    if(normalized==='/')active='home';
    else if(normalized.startsWith('/destinations'))active='destinations';
    else if(normalized.startsWith('/my-profile')&&(/(?:\?|&)tab=trips(?:&|$)/.test(current)))active='myTrips';
    for(const button of BUTTONS){
      if(button.dataset.route===active)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    }
  }
  function navigate(key){
    const path=pathFor(key);
    if(!path)return;
    closeDrawer();
    post('MASTER_NAVIGATE',{path},nextId('nav'));
  }
  function renderMenu(){
    const root=$('drawerLinks');
    root.replaceChildren();
    for(const group of groups){
      const heading=document.createElement('div');
      heading.className='group-heading';heading.textContent=group.title;
      root.appendChild(heading);
      for(const [label,key] of group.keys){
        const button=document.createElement('button');
        button.type='button';button.className='drawer-link';
        const text=document.createElement('span');text.textContent=label;
        const chevron=document.createElement('b');chevron.textContent='›';chevron.setAttribute('aria-hidden','true');
        button.append(text,chevron);
        button.addEventListener('click',()=>navigate(key));
        root.appendChild(button);
      }
    }
  }
  function preferredHeight(open){
    if(!open)return 88; // Canonical V12 host closed geometry: 88px; visual bar is 68px.
    return Math.max(220,Math.round(window.visualViewport?.height||window.innerHeight||844)-52);
  }
  function requestSize(open,requestId){
    post('HOME_APP_DRAWER_RESIZE',{open,height:preferredHeight(open)},requestId);
  }
  function announce(message){status.textContent=String(message||'');}
  function setDrawerVisible(open){
    state.drawerOpen=Boolean(open);
    document.body.classList.toggle('drawer-open',state.drawerOpen);
    drawer.setAttribute('aria-hidden',String(!state.drawerOpen));
    menuButton.setAttribute('aria-expanded',String(state.drawerOpen));
    $('overlay').setAttribute('aria-hidden',String(!state.drawerOpen));
    if(!state.drawerOpen)stopChat();
  }
  function openDrawer(){
    if(state.drawerOpen||state.drawerPending)return;
    state.lastFocused=document.activeElement;
    announce('');
    if(window.parent===window){setDrawerVisible(true);$('closeBtn').focus({preventScroll:true});return;}
    const requestId=nextId('drawer-open');
    state.drawerPending=requestId;
    requestSize(true,requestId);
    clearTimeout(state.drawerTimer);
    state.drawerTimer=setTimeout(()=>{
      if(state.drawerPending!==requestId)return;
      state.drawerPending='';
      announce('The menu could not open. Please try again.');
    },5000);
  }
  function closeDrawer(){
    const wasOpen=state.drawerOpen||Boolean(state.drawerPending);
    if(!wasOpen)return;
    ++focusTransitionToken;
    clearTimeout(state.drawerTimer);
    state.drawerPending='';
    setDrawerVisible(false);
    if(window.parent!==window)requestSize(false,nextId('drawer-close'));
    const target=state.lastFocused instanceof HTMLElement?state.lastFocused:menuButton;
    target.focus({preventScroll:true});
    state.lastFocused=null;
  }
  function forceCloseDrawer(){
    ++focusTransitionToken;
    clearTimeout(state.drawerTimer);
    state.drawerPending='';
    setDrawerVisible(false);
  }
  function acceptOpenWhenResized(requestId){
    const token=++focusTransitionToken;
    const started=Date.now();
    function check(){
      if(token!==focusTransitionToken||state.drawerPending!==requestId)return;
      if(window.innerHeight>=220){
        clearTimeout(state.drawerTimer);
        state.drawerPending='';
        setDrawerVisible(true);
        $('closeBtn').focus({preventScroll:true});
        return;
      }
      if(Date.now()-started>=1100){
        state.drawerPending='';
        clearTimeout(state.drawerTimer);
        announce('The menu needs a page-level mobile embed that can expand.');
        requestSize(false,nextId('drawer-recover'));
        return;
      }
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }
  function chatSend(type,payload={}){post('SKANDI_SUPPORT_CHAT',{type,payload},nextId('chat'));}
  function stopChat(){
    if(!state.chatOpen)return;
    chatSend('SUPPORT_CHAT_PANEL_CLOSE');
    state.chatOpen=false;
    drawer.classList.remove('chat-mode');
    $('drawer-title').textContent='Explore SKANDI';
  }
  function openChat(){
    state.chatOpen=true;
    drawer.classList.add('chat-mode');
    $('drawer-title').textContent='Alexandra';
    $('chatStatus').textContent='Connecting to Alexandra…';
    chatSend('SUPPORT_CHAT_START_ALEXANDRA',{requestId:nextId('alexandra-open')});
    $('chatInput').focus({preventScroll:true});
  }
  function bubble(message,mine=false){
    const div=document.createElement('div');
    div.className='bubble'+(mine?' mine':'');
    div.textContent=String(message||'').slice(0,4000);
    $('chatLog').appendChild(div);
    div.scrollIntoView({block:'end'});
  }
  for(const button of BUTTONS){
    button.addEventListener('click',()=>{
      if(button.dataset.route==='menu'){
        if(state.drawerOpen)closeDrawer();else openDrawer();
      } else navigate(button.dataset.route);
    });
  }
  $('overlay').addEventListener('click',closeDrawer);
  $('closeBtn').addEventListener('click',()=>state.chatOpen?stopChat():closeDrawer());
  $('profileLink').addEventListener('click',()=>navigate('myProfile'));
  $('searchLink').addEventListener('click',()=>{
    closeDrawer();
    post('HOME_APP_FOCUS_SEARCH',{},nextId('focus'));
  });
  $('alexandraLink').addEventListener('click',openChat);
  $('chatForm').addEventListener('submit',event=>{
    event.preventDefault();
    const input=$('chatInput');
    const message=input.value.trim();
    if(!message)return;
    bubble(message,true);
    input.value='';
    chatSend('SUPPORT_CHAT_SUBMIT_FORM',{message,text:message});
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(state.chatOpen)stopChat();else closeDrawer();
    }
    if(event.key==='Tab'&&state.drawerOpen){
      const visible=Array.from(drawer.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled])'))
        .filter(el=>el.getClientRects().length>0);
      if(!visible.length){event.preventDefault();drawer.focus();return;}
      const first=visible[0],last=visible[visible.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  window.addEventListener('message',event=>{
    if(event.source!==window.parent)return;
    let message=event.data;
    if(typeof message==='string'){try{message=JSON.parse(message);}catch(_){return;}}
    if(!message||typeof message!=='object'||message.source!==PARENT)return;
    if(message.type==='SKANDI_MASTER_CONFIG'){
      const config=message.payload||{};
      for(const key of Object.keys(defaults)){
        const candidate=safePath(config.routes?.[key]);
        if(candidate)state.routes[key]=candidate;
      }
      state.currentPath=safePath(config.currentPath)||state.currentPath;
      updateActive();
      return;
    }
    if(message.type==='HOME_APP_DRAWER_RESIZE_ACK'){
      const requestId=String(message.requestId||'');
      if(message.payload?.open===true){
        if(state.drawerPending&&requestId===state.drawerPending)acceptOpenWhenResized(requestId);
        else requestSize(false,nextId('drawer-stale-ack'));
      }
      return;
    }
    if(message.type==='HOME_APP_DRAWER_FORCE_CLOSE'){forceCloseDrawer();return;}
    if(message.type==='HOME_APP_DRAWER_RESIZE_ERROR'){
      clearTimeout(state.drawerTimer);
      state.drawerPending='';
      announce(message.payload?.message||'The menu could not open.');
      return;
    }
    if(message.type==='SUPPORT_CHAT_OPEN'){if(state.chatOpen)$('chatStatus').textContent='Connected to Alexandra';return;}
    if(message.type==='SUPPORT_CHAT_ERROR'){if(state.chatOpen)$('chatStatus').textContent=message.payload?.message||'Chat connection unavailable';return;}
    if(message.type==='SUPPORT_CHAT_SNAPSHOT'&&state.chatOpen){
      const data=message.payload||{};
      if(Array.isArray(data.messages))for(const item of data.messages.slice(-15))if(item?.text||item?.message)bubble(item.text||item.message,Boolean(item.mine));
      return;
    }
    if(message.type==='SUPPORT_CHAT_CASE_CREATED'&&state.chatOpen){$('chatStatus').textContent='Case created';return;}
  });
  window.addEventListener('resize',()=>{
    if(state.drawerOpen&&window.parent!==window)requestSize(true,nextId('viewport-resize'));
  });
  renderMenu();
  updateActive();
  post('MASTER_CONFIG_REQUEST',{context:'mobile-navigation'});
  post('HOME_APP_READY',{},nextId('ready'));

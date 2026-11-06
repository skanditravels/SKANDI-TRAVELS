const SOURCE='SKANDI_HOME_MOBILE_APP';
  const PARENT='SKANDI_WIX_PARENT';
  const ROUTE_FALLBACKS=Object.freeze({
    home:'/', destinations:'/destinations',
    myTrips:'/my-profile?tab=trips', myProfile:'/my-profile', bookingFlow:'/booking'
  });
  const defaults={
    ...ROUTE_FALLBACKS,
    travelInfo:'/travel-info',flights:'/flights',hotels:'/hotels',packages:'/packages',
    cruises:'/cruises',tours:'/tours-activities',carRental:'/car-rental',transfers:'/travel-info?section=transfers',
    skandiCollection:'/skandi-collection',voy:'/voy-magazine',club:'/skandi-club',
    support:'/about/support',theStore:'/the-store',about:'/about'
  };
  const publicGroups=[
    {title:'Book & travel',keys:[['Book a trip','home'],['Flights','flights'],['Hotels','hotels'],['Packages','packages'],['Cruises','cruises'],['Tours & Activities','tours'],['Car rental','carRental'],['Transfers','transfers']]},
    {title:'Explore',keys:[['Destinations','destinations'],['SKANDI Collection','skandiCollection'],['VOY Magazine','voy']]},
    {title:'Travel help',keys:[['Travel information','travelInfo'],['Flight status','flightStatus'],['Passport & visa','passportVisa'],['Baggage allowance','baggageAllowance'],['Travel insurance','travelInsurance'],['Special assistance','specialAssistance'],['Help Center','support']]},
    {title:'Your SKANDI',keys:[['My Trips','myTrips'],['SKANDI Club','club'],['My Profile','myProfile'],['The Store','theStore']]},
    {title:'About SKANDI',keys:[['About','about'],['Newsroom','newsroom'],['Careers','careers'],['Legal','legal'],['Policies','policies'],['Cookie preferences','cookiePreferences'],['Staff login','riaintra']]}
  ];
  const $=id=>document.getElementById(id);
  const bar=$('skandi-mobile-nav-root');
  const BUTTONS=Array.from(bar.querySelectorAll('[data-route]'));
  const menuButton=BUTTONS.find(btn=>btn.dataset.route==='menu');
  const drawer=$('drawer');
  const status=$('status');
  const shell=window.__SKANDI_SHELL__?.root;
  const family=shell?.dataset.skandiFamily||'public';
  const isStaff=family==='riaintra'||family==='altea';
  const brand=family==='altea'?'ALTEA':family==='riaintra'?'RIAINTRA':'SKANDI TRAVELS';
  const staffIcons={
    workspace:'M3 9l9-6 9 6v11H3z M9 20v-7h6v7',
    mail:'M3 5h18v14H3z M3 6l9 7 9-7',
    docs:'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h8',
    altea:'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
    reservations:'M3 7h18v10H3z M8 7v10 M13 11h5',
    eos:'M7 3h10v18H7z M10 17h4'
  };
  const drawerTitle=isStaff?brand+' menu':'Explore SKANDI';
  const state={routes:{...defaults},currentPath:'/',request:0,drawerOpen:false,drawerPending:'',drawerTimer:null,chatOpen:false,lastFocused:null,staffNavigation:null};
  bar.setAttribute('aria-label',brand+' mobile navigation');
  $('drawer-brand').textContent=brand;
  $('drawer-title').textContent=drawerTitle;
  if(isStaff) {
    drawer.dataset.staffMenu='';
    $('drawer-actions').hidden=true;
  }
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
    for(const button of BUTTONS){
      const key=button.dataset.route;
      const path=isStaff?safePath(button.dataset.path):pathFor(key);
      const active=path&&(path.includes('?')?current===path:normalized===path || key==='destinations'&&normalized.startsWith('/destinations/'));
      if(active)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    }
  }
  function navigatePath(path){
    if(!safePath(path))return;
    closeDrawer();
    post('MASTER_NAVIGATE',{path},nextId('nav'));
  }
  function navigate(key){navigatePath(pathFor(key));}
  function renderMenu(){
    const root=$('drawerLinks');
    const openTitles=new Set(Array.from(root.querySelectorAll('details[open] summary'),item=>item.textContent));
    const focused=document.activeElement;
    const focusedKey=root.contains(focused)?focused.dataset.menuKey:'';
    const renderedItems=new Map();
    const groups=isStaff?(state.staffNavigation?.groups||[]):publicGroups.map(group=>({
      title:group.title, links:group.keys.map(([label,key])=>({label,path:pathFor(key)}))
    }));
    root.replaceChildren();
    for(const group of groups){
      const links=(group.links||[]).filter(link=>safePath(link.path));
      if(!links.length)continue;
      const section=document.createElement('details');
      section.className='drawer-group';
      section.open=openTitles.has(group.title)||(!openTitles.size&&links.some(link=>link.path===state.currentPath));
      const heading=document.createElement('summary');
      heading.className='group-heading';heading.textContent=group.title;
      heading.dataset.menuKey=group.title;renderedItems.set(group.title,heading);
      section.appendChild(heading);
      for(const link of links){
        const button=document.createElement('button');
        button.type='button';button.className='drawer-link';
        button.dataset.menuKey=link.path;renderedItems.set(link.path,button);
        const text=document.createElement('span');text.textContent=link.label;
        const chevron=document.createElement('b');chevron.textContent='›';chevron.setAttribute('aria-hidden','true');
        button.append(text,chevron);
        button.addEventListener('click',()=>navigatePath(link.path));
        section.appendChild(button);
      }
      root.appendChild(section);
    }
    if(isStaff&&!root.childElementCount){
      const notice=document.createElement('p');
      notice.textContent=state.staffNavigation?'No navigation is available for this session.':'Loading navigation…';
      root.appendChild(notice);
    }
    if(isStaff){
      const tabs=state.staffNavigation?.tabs||[];
      BUTTONS.filter(button=>button!==menuButton).forEach((button,index)=>{
        const tab=tabs[index];
        button.hidden=!safePath(tab?.path);
        button.dataset.path=safePath(tab?.path);
        button.querySelector('span').textContent=tab?.shortLabel||tab?.label||'';
        const icon=staffIcons[tab?.icon];
        const svg=button.querySelector('svg');
        if(icon){
          const path=document.createElementNS('http://www.w3.org/2000/svg','path');
          path.setAttribute('d',icon);
          svg.replaceChildren(path);
        }
        button.setAttribute('aria-label',tab?.label||'Navigation');
      });
    }
    if(focusedKey)renderedItems.get(focusedKey)?.focus({preventScroll:true});
    updateActive();
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
    // The drawer is modal inside a compiled embed. Keep page controls out of its focus order.
    const app=shell?.querySelector('#skandi-app-root');
    if(app)app.inert=state.drawerOpen;
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
    $('drawer-title').textContent=drawerTitle;
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
      } else if(isStaff)navigatePath(button.dataset.path);
      else navigate(button.dataset.route);
    });
  }
  $('overlay').addEventListener('click',closeDrawer);
  $('closeBtn').addEventListener('click',()=>state.chatOpen?stopChat():closeDrawer());
  $('staffSignOut').addEventListener('click',()=>{
    closeDrawer();
    post('RIAINTRA_LOGOUT',{},nextId('sign-out'));
  });
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
      const visible=Array.from(drawer.querySelectorAll('summary,button:not([disabled]),input:not([disabled]),textarea:not([disabled])'))
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
      for(const key of Object.keys(config.routes||{})){
        const candidate=safePath(config.routes?.[key]);
        if(candidate)state.routes[key]=candidate;
      }
      state.currentPath=safePath(config.currentPath)||state.currentPath;
      if(isStaff&&config.mobileNavigation?.family===family){
        state.staffNavigation=config.mobileNavigation;
        $('staff-drawer-actions').hidden=!state.staffNavigation.groups?.length;
      }
      if(isStaff){
        const logo=config.brand?.assets?.toolWordmarks?.[family];
        if(/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(logo||'')){
          $('drawer-logo').src=logo;
          $('drawer-logo').hidden=false;
          $('drawer-brand').hidden=true;
        }
      }
      renderMenu();
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
    if(state.drawerOpen&&shell&&window.innerWidth>1020)closeDrawer();
    else if(state.drawerOpen&&window.parent!==window)requestSize(true,nextId('viewport-resize'));
  });
  renderMenu();
  post('MASTER_CONFIG_REQUEST',{context:'mobile-navigation'});
  post('HOME_APP_READY',{},nextId('ready'));

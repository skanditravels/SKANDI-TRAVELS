// /src/pages/Booking.e8twe.js
// SKANDI V12 — single HTML booking journey using the existing canonical booking API.
// The complete offer-to-confirmation journey is mounted inside the Home embed.
import { session } from 'wix-storage';
import { readBookingSearch } from 'public/bookingSearch';
import { openCustomerLogin } from 'public/customerAuthUi';
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from 'public/siteMap';
import {
  searchUnifiedOffers, createBookingCartFromOffer, loadBookingCart,
  acceptBookingOffer, loadBookingExtras, storeBookingExtras,
  loadSignatureTransfers, storeSignatureTransfer, saveBookingTravelers,
  saveHotelGuests, loadBookingRequirements, refreshBookingRequirements,
  loadSeatMaps, storeSeatSelections, prepareBookingPayment,
  prepareHotelPayment, commitBooking, commitHotelBooking,
  loadBookingConfirmation, loadBookingDocuments
} from 'backend/SKANDI_CORE/customerBooking.web';

const SOURCE='SKANDI_BOOKING_OFFER';
const PARENT='SKANDI_WIX_PARENT';
const STEP_ORDER=['offer','extras','hotels','transfer','upsell','apis','seats','payment','confirmation','documents'];
const MUTATIONS=new Set(['BOOKING_SEARCH_SELECT','BOOKING_OFFER_ACCEPTED','BOOKING_EXTRAS_SAVE','SIGNATURE_TRANSFER_SELECT','SIGNATURE_TRANSFER_SKIP','APIS_SAVE_AND_CONTINUE','SEATMAP_SAVE','SEATMAP_SKIP','PAYMENT_COMMIT']);
let html=null, locationApi=null, onReturnHome=()=>{}, searchContext=null, cartId='', cartToken='', step='offer', ready=false, startupDone=false, startupError='', currentSearch=null, inFlight=false, paymentInFlight=false, lastResponse=null;
let searchJob=null, selectedSearchItem=null;

const text=(x='')=>String(x??'');
function bookingError(error){
  const code=text(error?.code).toUpperCase();
  const translations={
    LOGIN_REQUIRED:'Sign in to continue your booking.',
    BOOKING_OFFER_EXPIRED:'The selected offer has expired. Search again.',
    BOOKING_CART_NOT_FOUND:'Your secure booking session could not be found.',
    BOOKING_CART_ACCESS_DENIED:'You do not have access to this booking.',
    BOOKING_RECONCILIATION_REQUIRED:'Your supplier booking is being reconciled. Do not pay again; contact SKANDI.',
    PAYMENT_NOT_AUTHORIZED:'Payment authorization is not ready.',
    PAYMENT_AMOUNT_MISMATCH:'Your booking price changed. Verify your total before paying.',
    SERVICE_UNAVAILABLE:'A selected service is no longer available.',
    SEAT_UNAVAILABLE:'The selected seat is no longer available.'
  };
  return translations[code]||text(error?.publicMessage||error?.message||'The booking request could not be completed.').replace(/BOOKING_[A-Z0-9_]+/g,'booking');
}
function send(type,payload={},extra={}){
  if(!html||typeof html.postMessage!=='function')return;
  const message={source:PARENT,type,payload,...extra,timestamp:new Date().toISOString()};
  if(['BOOKING_SEARCH_RESULTS','BOOKING_CART_LOADED','BOOKING_EXTRAS_LOADED','SIGNATURE_TRANSFER_OPTIONS','APIS_CART_RULES_LOADED','SEATMAP_LOADED','PAYMENT_SESSION_LOADED','CONFIRMATION_LOADED','BOOKING_DOCUMENTS_LOADED'].includes(type))lastResponse=message;
  if(ready)html.postMessage(message);
}
function errorToUi(error,retryable=true){
  const code=text(error?.code||'BOOKING_REQUEST_FAILED');
  console.error('[SKANDI][Booking]',step,code);
  send('BOOKING_ERROR',{}, {message:bookingError(error),code,retryable});
}
function bounded(promise,timeout=30000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('The booking request timed out; check your existing booking before trying again.'),{code:'BOOKING_TIMEOUT'})),timeout)})]).finally(()=>clearTimeout(timer))}
function persistCart(id,token=''){
  cartId=text(id);cartToken=text(token);
  if(cartId)session.setItem('SKANDI_BOOKING_CART_ID',cartId);else session.removeItem('SKANDI_BOOKING_CART_ID');
  if(cartToken)session.setItem('SKANDI_BOOKING_CART_TOKEN',cartToken);else session.removeItem('SKANDI_BOOKING_CART_TOKEN');
}
function access(msg={}){
  const requested=text(msg.cartId||msg.payload?.cartId);
  if(requested&&cartId&&requested!==cartId)throw Object.assign(new Error('This action references another booking.'),{code:'BOOKING_CART_ACCESS_DENIED'});
  if(!cartId)throw new Error('No booking cart is active. Search and select an offer.');
  return {cartId,cartToken};
}
function isHotelCart(cart){return text(cart?.productType).toUpperCase()==='HOTEL_ONLY'}
function isPackageCart(cart){return ['PACKAGE','MIXED_PACKAGE'].includes(text(cart?.productType).toUpperCase())}
function lastServerStep(cart={}){
  if(cart.status==='Confirmed')return 'confirmation';
  if(['PaymentPending','Committing','ReconciliationRequired'].includes(cart.status))return 'payment';
  const flow=text(cart.flow?.currentStep).toLowerCase();
  if(STEP_ORDER.includes(flow))return flow;
  const byStatus={Open:'offer',OfferAccepted:'extras',ExtrasSaved:'transfer',TravelersPending:'apis',TravelersSaved:'seats',PaymentReady:'payment',PaymentPending:'payment',Confirmed:'confirmation'};
  return byStatus[cart.status]||'offer';
}
function normalStep(requested){let v=text(requested).toLowerCase();return STEP_ORDER.includes(v)?v:'offer'}
async function cart(){return bounded(loadBookingCart(access()),30000)}
async function withLoginCart(read){
  try{return await read()}catch(e){if(/LOGIN_REQUIRED|sign in|login required|forbidden/i.test(`${e?.code||''} ${e?.message||''}`)){await openCustomerLogin({sourcePage:'BOOKING',reason:'BOOKING_CART_AUTH'});return read()}throw e}
}
function allowedStep(requested,c){
  const want=normalStep(requested),resume=lastServerStep(c);
  if(c.status==='Confirmed')return want==='documents'?'documents':'confirmation';
  if(['PaymentPending','Committing','ReconciliationRequired'].includes(c.status))return 'payment';
  const index=STEP_ORDER.indexOf(want),max=STEP_ORDER.indexOf(resume);
  if(want==='hotels'&&max>=STEP_ORDER.indexOf('transfer'))return want;
  if(want==='upsell'&&max>=STEP_ORDER.indexOf('apis')&&isPackageCart(c))return want;
  return index<=max?want:resume;
}
function updateUrl(){
  if(!locationApi.queryParams?.add)return;
  try{const params={step};if(cartId)params.cartId=cartId;locationApi.queryParams.add(params)}catch(_){/* URL sync is optional; the backend cart remains authoritative. */}
}
async function goStep(next,{silentUrl=false}={}){
  step=normalStep(next);
  if(!silentUrl)updateUrl();
  lastResponse=null;
  send('BOOKING_STEP_ACTIVE',{step});
  if(!ready)return;
  try{await initialize()}catch(e){errorToUi(e,step!=='payment')}
}
async function initialize(){
  if(startupError){send('BOOKING_ERROR',{}, {message:startupError,retryable:false});return}
  if(step==='offer'){
    if(!cartId)return searchOffers();
    const c=await withLoginCart(cart);
    send('BOOKING_CART_LOADED',{cart:c});
    return;
  }
  const c=await withLoginCart(cart);
  if(c.status==='Confirmed'&&!['confirmation','documents'].includes(step)){await goStep('confirmation');return}
  if(['Committing','ReconciliationRequired'].includes(c.status)&&step!=='payment'){await goStep('payment');return}
  if(step==='extras')send('BOOKING_EXTRAS_LOADED',await bounded(loadBookingExtras(access())));
  else if(step==='hotels'||step==='upsell')send('BOOKING_STEP_ACTIVE',{step,cart:c});
  else if(step==='transfer')send('SIGNATURE_TRANSFER_OPTIONS',await bounded(loadSignatureTransfers(access())));
  else if(step==='apis'){
    const [view,rules]=await bounded(Promise.all([loadBookingCart({...access(),view:'apis'}),loadBookingRequirements(access())]));
    send('APIS_CART_RULES_LOADED',{cart:view,rules});
  }
  else if(step==='seats')send('SEATMAP_LOADED',await bounded(loadSeatMaps(access())));
  else if(step==='payment'){
    if(c.status==='Confirmed'){await goStep('confirmation');return}
    if(['Committing','ReconciliationRequired'].includes(c.status)){
      send('BOOKING_ERROR',{}, {message:'Your booking is processing or awaiting reconciliation. Do not authorize payment again.',code:'BOOKING_RECONCILIATION_REQUIRED',retryable:false});
      return;
    }
    const payment=isHotelCart(c)?await bounded(prepareHotelPayment(access()),45000):await bounded(prepareBookingPayment(access()),45000);
    send('PAYMENT_SESSION_LOADED',payment);
  }
  else if(step==='confirmation')send('CONFIRMATION_LOADED',{confirmation:await bounded(loadBookingConfirmation(access()),45000)});
  else if(step==='documents')send('BOOKING_DOCUMENTS_LOADED',await bounded(loadBookingDocuments(access()),45000));
}
async function searchOffers(force=false){
  if(cartId)return;
  if(!searchContext)throw new Error('Your search has expired. Return to Home and start a new search.');
  if(searchJob&&!force){const j=await searchJob;send('BOOKING_SEARCH_RESULTS',j);return}
  send('BOOKING_SEARCH_LOADING',{search:searchContext.search});
  const promise=bounded(searchUnifiedOffers({search:searchContext.search}),85000);
  searchJob=promise;
  try{
    const result=await promise;
    if(searchJob!==promise)return;
    if(!Array.isArray(result?.items))throw new Error('No valid live search result was returned.');
    currentSearch={items:result.items,search:searchContext.search,errors:result.errors||[]};
    send('BOOKING_SEARCH_RESULTS',currentSearch);
  }finally{if(searchJob===promise)searchJob=null}
}
async function selectOffer(msg){
  const id=text(msg.offerId||msg.payload?.offerId);
  const item=currentSearch?.items?.find(x=>text(x.id||x.staySearchResultId)===id);
  if(!item)throw Object.assign(new Error('That offer is no longer available. Refresh the search.'),{code:'BOOKING_LIVE_OFFER_INVALID'});
  const select=()=>createBookingCartFromOffer({offer:item,search:searchContext.search});
  let result=await bounded(select(),80000);
  if(result?.requiresLogin){await openCustomerLogin({sourcePage:'BOOKING',reason:'BOOKING_CART_AUTH'});result=await bounded(select(),80000)}
  if(result?.requiresLogin)throw Object.assign(new Error('Sign in to continue.'),{code:'LOGIN_REQUIRED'});
  if(!result?.cartId)throw new Error('A booking could not be created. Verify My Booking before selecting another offer.');
  persistCart(result.cartId,result.cartToken||'');selectedSearchItem=item;
  await goStep('offer');
}
function routeForPath(path){
  const [pathname='',query='']=text(path).split('?',2);
  const p=pathname.toLowerCase();
  if(p==='/home')return 'home';
  if(p==='/'){
    const requested=new URLSearchParams(query).get('step');
    return STEP_ORDER.includes(requested)?requested:'home';
  }
  const parts=p.split('/').filter(Boolean);
  if(parts[0]==='booking'&&STEP_ORDER.includes(parts[1]))return parts[1];
  return '';
}
async function navigate(raw){
  const path=text(raw);
  const page=routeForPath(path);
  if(page==='home'){onReturnHome();return}
  if(page){if(!cartId){await goStep('offer');return}const c=await withLoginCart(cart);await goStep(allowedStep(page,c));return}
  if(!isSafeInternalRoute(path))throw new Error('Invalid SKANDI navigation destination.');
  const allow=[SITE_MAP.home,APP_ROUTES.bookingFlow,APP_ROUTES.myProfile,SITE_MAP.travelInfo,SITE_MAP.support,SITE_MAP.search].some(x=>path===x||path.startsWith(`${x}/`)||path.startsWith(`${x}?`));
  if(!allow)throw new Error('This booking link is not allowed.');
  locationApi.to(path);
}
async function processMessage(msg){
  const t=text(msg.type);
  if(t==='BOOKING_OFFER_READY'){
    if(ready){send('BOOKING_HOST_READY',{step});if(lastResponse)html.postMessage(lastResponse);return}
    ready=true;send('BOOKING_HOST_READY',{step});
    if(startupDone)await goStep(step,{silentUrl:true});
    return;
  }
  if(!ready||!startupDone)return;
  if(t==='BOOKING_NAVIGATE')return navigate(msg.path);
  if(t==='BOOKING_RETRY'){
    if(!cartId)return searchOffers(true);
    const c=await withLoginCart(cart);
    return goStep(allowedStep(step,c));
  }
  if(t==='BOOKING_SEARCH_REFRESH'&&!cartId)return searchOffers(true);
  if(t==='BOOKING_BACK_TO_RESULTS'&&searchContext){
    persistCart('');selectedSearchItem=null;
    try{locationApi.queryParams?.remove(['cartId','cartToken'])}catch(_){}
    return goStep('offer');
  }
  if(t==='BOOKING_SEARCH_SELECT'&&step==='offer'&&!cartId)return selectOffer(msg);
  if(t==='BOOKING_OFFER_ACCEPTED'&&step==='offer'){
    if(msg.termsAccepted!==true)throw Object.assign(new Error('Accept the supplier conditions to continue.'),{code:'TERMS_REQUIRED'});
    await bounded(acceptBookingOffer({...access(msg),termsAccepted:true}),45000);
    return goStep('extras');
  }
  if(t==='BOOKING_EXTRAS_SAVE'&&step==='extras'){
    const selections=Array.isArray(msg.selectedExtras)?msg.selectedExtras:[];
    await bounded(storeBookingExtras({...access(msg),selectedExtras:selections}),45000);
    return goStep('hotels');
  }
  if(t==='BOOKING_HOTEL_CONTINUE'&&step==='hotels')return goStep('transfer');
  if((t==='SIGNATURE_TRANSFER_SELECT'||t==='SIGNATURE_TRANSFER_SKIP')&&step==='transfer'){
    await bounded(storeSignatureTransfer({...access(msg),transfer:t==='SIGNATURE_TRANSFER_SKIP'?null:msg.transfer||null}),45000);
    const c=await withLoginCart(cart);
    return goStep(isPackageCart(c)?'upsell':'apis');
  }
  if(t==='BOOKING_UPSELL_CONTINUE'&&step==='upsell')return goStep('apis');
  if(t==='APIS_RULES_REFRESH'&&step==='apis'){
    send('APIS_REQUIREMENTS_RESULT',{rules:await bounded(refreshBookingRequirements({...access(msg),travelers:Array.isArray(msg.travelers)?msg.travelers:[]}))});return;
  }
  if(t==='APIS_SAVE_AND_CONTINUE'&&step==='apis'){
    const c=await withLoginCart(cart);
    const travelers=Array.isArray(msg.travelers)?msg.travelers:[];
    if(isHotelCart(c))await bounded(saveHotelGuests({...access(msg),guests:travelers,email:msg.contact?.email,phoneNumber:msg.contact?.phoneNumber||msg.contact?.phone}),65000);
    else await bounded(saveBookingTravelers({...access(msg),travelers,contact:msg.contact||{}}),65000);
    return goStep('seats');
  }
  if(['SEATMAP_SAVE','SEATMAP_SKIP'].includes(t)&&step==='seats'){
    await bounded(storeSeatSelections({...access(msg),selections:t==='SEATMAP_SKIP'?{}:msg.selections||{},skipped:t==='SEATMAP_SKIP'}),45000);
    return goStep('payment');
  }
  if(t==='PAYMENT_COMMIT'&&step==='payment'){
    if(paymentInFlight)return;
    if(msg.termsAccepted!==true)throw Object.assign(new Error('Payment terms must be accepted.'),{code:'TERMS_REQUIRED'});
    paymentInFlight=true;
    send('PAYMENT_PROGRESS',{}, {message:'Verifying payment and creating the supplier booking…'});
    try{
      const c=await withLoginCart(cart);
      const fn=isHotelCart(c)?commitHotelBooking:commitBooking;
      const result=await bounded(fn({...access(msg),termsAccepted:true,paymentIntentId:text(msg.paymentIntentId)}),95000);
      if(result?.reconciliationRequired||result?.status==='ReconciliationRequired')throw Object.assign(new Error('The supplier booking is being reconciled. Do not pay again.'),{code:'BOOKING_RECONCILIATION_REQUIRED'});
      if(result?.status!=='Confirmed')throw Object.assign(new Error('The booking status could not be confirmed. Check the existing booking before attempting another payment.'),{code:'BOOKING_PAYMENT_NOT_COMPLETE'});
      return goStep('confirmation');
    }finally{paymentInFlight=false}
  }
}

export function createBookingFlowHost({html:hostHtml,location,onReturnHome:returnHome}={}) {
  html=hostHtml;locationApi=location;onReturnHome=typeof returnHome==='function'?returnHome:()=>{};
  if(!html||typeof html.postMessage!=='function')throw new Error('The #bookingFlowEmbed HTML component is required for the booking flow.');
  if(!locationApi)throw new Error('Wix location context is required for the booking flow.');
  return {announceReady,startSearch,startFromLocation,handleMessage,reportError};
}
function announceReady(){
  if(!html||typeof html.postMessage!=='function')return;
  html.postMessage({source:PARENT,type:'BOOKING_HOST_READY',payload:{step},timestamp:new Date().toISOString()});
}
async function startSearch(searchId){
  const next=readBookingSearch(text(searchId));
  if(!next)throw Object.assign(new Error('Your search has expired. Return to Home and start a new search.'),{code:'BOOKING_SEARCH_EXPIRED'});
  searchContext=next;persistCart('');currentSearch=null;selectedSearchItem=null;searchJob=null;startupError='';step='offer';startupDone=true;
  try{locationApi.queryParams?.remove(['cartId','cartToken']);locationApi.queryParams?.add({step:'offer',searchId:text(searchId)})}catch(_){}
  if(ready)await goStep('offer',{silentUrl:true});
}
async function startFromLocation(){
  const query=locationApi.query||{};
  const searchId=text(query.searchId),queryCart=text(query.cartId),queryStep=text(query.step);
  try{
    searchContext=searchId?readBookingSearch(searchId):null;
    if(searchContext)persistCart('');
    else if(searchId&&!queryCart)persistCart('');
    else {
      const restoredCart=session.getItem('SKANDI_BOOKING_CART_ID')||'';
      persistCart(queryCart||restoredCart,text(query.cartToken)||session.getItem('SKANDI_BOOKING_CART_TOKEN')||'');
    }
    if(cartId){
      const c=await withLoginCart(cart);
      if(c.productType==='CAR_RENTAL_ONLY'){locationApi.to(SITE_MAP.carRental+'?cartId='+encodeURIComponent(cartId));return true}
      step=allowedStep(queryStep||lastServerStep(c),c);
    }else if(!searchContext){
      step=normalStep(queryStep||'offer');
      startupError='Your search session is missing or has expired. Return to Home and search again.';
    }else {step='offer';startupError=''}
    startupDone=true;
    if(ready)await goStep(step,{silentUrl:true});
    return true;
  }catch(e){startupDone=true;startupError=bookingError(e);errorToUi(e,false);return true}
}
async function handleMessage(msg){
  if(!msg||msg.source!==SOURCE)return;
  if(inFlight&&msg.type!=='BOOKING_OFFER_READY')return;
  const mutation=MUTATIONS.has(msg.type);
  if(mutation)inFlight=true;
  try{await processMessage(msg)}
  catch(e){errorToUi(e,!['PAYMENT_COMMIT','BOOKING_SEARCH_SELECT'].includes(msg.type))}
  finally{if(mutation)inFlight=false}
}
function reportError(error){errorToUi(error,false)}

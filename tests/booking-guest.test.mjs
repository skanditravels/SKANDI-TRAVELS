import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash, randomBytes, randomUUID} from 'node:crypto';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const {parse} = require('acorn');
const read = file => fs.readFile(new URL('../' + file, import.meta.url), 'utf8');
const clone = value => value == null ? value : structuredClone(value);
const text = (x='',max=10000) => String(x ?? '').trim().slice(0,max);
const lower = (x='',max=10000) => text(x,max).toLowerCase();
const upper = (x='',max=10000) => text(x,max).toUpperCase();
const record = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const error = (code,message) => Object.assign(new Error(message),{code,publicMessage:message});

async function moduleInVm(path, bindings, exports) {
  let code = await read(path);
  const ast = parse(code,{ecmaVersion:'latest',sourceType:'module'});
  for (const node of ast.body.filter(n => n.type === 'ImportDeclaration').reverse()) {
    code = code.slice(0,node.start) + code.slice(node.end);
  }
  code = code.replace(/^export\s+/gm,'');
  const context = vm.createContext({console,URL,URLSearchParams,Date,Map,Set,Promise,setTimeout,clearTimeout,...bindings});
  vm.runInContext(code + '\n;globalThis.__exports = {' + exports.join(',') + '};',context,{filename:path});
  return context.__exports;
}

function database() {
  const carts = [];
  const matches = (r,q={}) => Object.entries(q).every(([k,v]) => {
    if (['select','limit','order'].includes(k)) return true;
    const actual = k.startsWith('payload->>') ? r.payload?.[k.slice(10)] : r[k];
    if (v === 'is.null') return actual == null;
    if (String(v).startsWith('eq.')) return String(actual ?? '') === String(v).slice(3);
    if (String(v).startsWith('gte.')) return String(actual ?? '') >= String(v).slice(4);
    return false;
  });
  async function restRequest({table,method='GET',query={},body}) {
    assert.equal(table,'booking_carts');
    if (method === 'POST') {carts.push(clone(body));return [clone(body)]}
    const found = carts.filter(r => matches(r,query));
    if (method === 'PATCH') found.forEach(r => Object.assign(r,clone(body)));
    return clone(found.slice(0,query.limit || found.length));
  }
  return {carts,restRequest};
}

test('guest capabilities scope every read and write, expire, and do not replace member ownership', async () => {
  const db = database();
  const api = await moduleInVm('src/backend/SKANDI_CORE/bookingCart.js',
    {...db,randomUUID,text,lower,record},
    ['createOwnedCart','getOwnedCart','getOwnedCartByOffer','listOwnedCarts','updateOwnedCart','transitionOwnedCart']);
  const a={guestHash:'a'.repeat(64)},b={guestHash:'b'.repeat(64)},member={memberId:'member-1'};
  const guest=await api.createOwnedCart(a,{cartId:'cart-a',selectedOfferId:'off-a',payload:{trip:'flight'}});
  const originalExpiry=guest.payload.guestAccessExpiresAt;
  assert.equal(guest.member_id,null);
  assert.equal(guest.payload.guestAccessHash,a.guestHash);
  assert.ok(Date.parse(originalExpiry)>Date.now()+6*86400000);
  await api.createOwnedCart(member,{cartId:'member-cart'});
  assert.equal((await api.getOwnedCart(a,'cart-a')).cart_id,'cart-a');
  assert.equal(await api.getOwnedCart(b,'cart-a'),null);
  assert.equal(await api.getOwnedCart(member,'cart-a'),null);
  assert.equal(await api.getOwnedCart(a,'member-cart'),null);
  assert.equal(await api.getOwnedCartByOffer(b,'off-a'),null);
  await assert.rejects(() => api.listOwnedCarts(a),{code:'LOGIN_REQUIRED'});
  assert.equal(await api.updateOwnedCart(b,'cart-a',{status:'Confirmed'}),null);
  assert.equal(await api.transitionOwnedCart(b,'cart-a','Open','Committing'),null);
  const changed=await api.updateOwnedCart(a,'cart-a',{payload:{trip:'updated',guestAccessHash:b.guestHash,guestAccessExpiresAt:'9999-01-01'}});
  assert.equal(changed.payload.guestAccessHash,a.guestHash);
  assert.equal(changed.payload.guestAccessExpiresAt,originalExpiry);
  assert.equal((await api.transitionOwnedCart(a,'cart-a','Open','Committing')).status,'Committing');
  assert.equal(await api.transitionOwnedCart(a,'cart-a','Open','Committing'),null);
  db.carts.find(x=>x.cart_id==='cart-a').payload.guestAccessExpiresAt='2000-01-01T00:00:00.000Z';
  assert.equal(await api.getOwnedCart(a,'cart-a'),null);
  assert.equal(await api.transitionOwnedCart(a,'cart-a','Committing','Confirmed'),null);
});

test('visitor-facing checkout authenticates the capability server-side and guards ownership', async () => {
  const allowed = new Map();
  const calls=[];
  let member=null;
  const coreNames=['searchLiveFlightOffersCore','getFlightUpsellsCore','searchUnifiedOffersCore',
    'createFlightCartCore','listCustomerBookingCartsCore','acceptBookingOfferCore','loadBookingExtrasCore',
    'storeBookingExtrasCore','loadSignatureTransfersCore','storeSignatureTransferCore','saveBookingTravelersCore',
    'loadSeatMapsCore','storeSeatSelectionsCore','prepareBookingPaymentCore','commitBookingCore','reconcileBookingCore',
    'loadBookingConfirmationCore','loadBookingDocumentsCore','searchLiveStaysCore','fetchStayRatesCore','quoteStayCore',
    'createHotelCartCore','saveHotelGuestsCore','prepareHotelPaymentCore','commitHotelBookingCore','searchLiveCarsCore',
    'quoteCarCore','getCarQuoteCore','createCarCartCore','saveCarDriverCore','prepareCarCheckoutCore','commitCarBookingCore',
    'createCustomerCarBookingCore','loadBookingRequirementsCore','refreshBookingRequirementsCore',
    'createCarComponentClientKeyCore','loadCustomerCarBookingCore','cancelCustomerCarBookingCore'];
  const stubs=Object.fromEntries(coreNames.map(name=>[name,async (ctx,input)=>{calls.push({name,ctx,input});return {ok:true}}]));
  Object.assign(stubs,{
    createBookingCartFromOfferCore:async (ctx)=>{allowed.set('cart-1',ctx.guestHash||ctx.memberId);return {cartId:'cart-1'}},
    loadBookingCartCore:async (ctx,input)=>{
      if(allowed.get(input.cartId)!==(ctx.guestHash||ctx.memberId))throw error('CART_NOT_FOUND','Not found');
      return {row:{cart_id:input.cartId,status:'TravelersSaved',payload:{}},cart:{cartId:input.cartId}};
    },
    dispatchConfirmedBookingEmailCore:async()=>{},prepareGuestConfirmationCore:async()=>{}
  });
  const api=await moduleInVm('src/backend/SKANDI_CORE/customerBooking.web.js',{
    ...stubs,randomBytes,createHash,currentMember:{getMember:async()=>member},
    Permissions:{Anyone:'anyone',SiteMember:'member'},webMethod:(permission,fn)=>Object.assign(fn,{permission})
  },['beginGuestBookingSession','createBookingCartFromOffer','loadBookingCart','saveBookingTravelers','listCustomerBookingCarts']);
  const capability=(await api.beginGuestBookingSession()).cartToken;
  assert.match(capability,/^[a-f0-9]{64}$/);
  const created=await api.createBookingCartFromOffer({cartToken:capability,memberId:'forged'});
  assert.equal(created.cartToken,capability);
  assert.equal(allowed.get('cart-1'),createHash('sha256').update(capability).digest('hex'));
  assert.deepEqual(JSON.parse(JSON.stringify(await api.loadBookingCart({cartId:'cart-1',cartToken:capability}))),{cartId:'cart-1'});
  assert.equal(api.loadBookingCart.permission,'anyone');
  assert.equal(api.listCustomerBookingCarts.permission,'member');
  await assert.rejects(()=>api.saveBookingTravelers({cartId:'cart-1',cartToken:'b'.repeat(64),memberId:'forged'}),{code:'CART_NOT_FOUND'});
  await assert.rejects(()=>api.saveBookingTravelers({cartId:'cart-1',cartToken:'bad'}),{code:'BOOKING_SESSION_EXPIRED'});
  await assert.rejects(()=>api.saveBookingTravelers({cartId:'cart-1',memberId:'forged'}),{code:'LOGIN_REQUIRED'});
  assert.equal(calls.length,0,'no handler should run for an unauthorized cart');
  member={_id:'signed-in',loginEmail:'member@example.com'};
  await api.saveBookingTravelers({cartId:'cart-1',cartToken:capability});
  assert.equal(calls.at(-1).ctx.guestHash,allowed.get('cart-1'),'signing in must not strand an existing guest cart');
});

async function hostHarness(query,store,handlers={}) {
  const messages=[], observed=[];
  const storage={getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val),removeItem:key=>store.delete(key)};
  const current={...query};
  const location={query:current,to:()=>{},queryParams:{remove:keys=>keys.forEach(k=>delete current[k]),add:values=>Object.assign(current,values)}};
  const offer={id:'off_1',itemType:'flight',price:{amount:100,currency:'USD'}};
  const data={status:'Open',cartId:'cart-1',productType:'FLIGHT_ONLY',flow:{currentStep:'offer'}};
  const defaults={
    searchUnifiedOffers:async()=>({items:[offer]}),
    beginGuestBookingSession:async()=>({cartToken:'a'.repeat(64)}),
    createBookingCartFromOffer:async input=>({cartId:'cart-1',cartToken:input.cartToken}),
    loadBookingCart:async input=>{observed.push(clone(input));if(input.cartToken!=='a'.repeat(64))throw error('CART_NOT_FOUND','Not found');return clone(data)}
  };
  const names=['getFlightUpsells','acceptBookingOffer','loadBookingExtras','storeBookingExtras','loadSignatureTransfers','storeSignatureTransfer','saveBookingTravelers','saveHotelGuests','loadBookingRequirements','refreshBookingRequirements','loadSeatMaps','storeSeatSelections','prepareBookingPayment','prepareHotelPayment','commitBooking','commitHotelBooking','loadBookingConfirmation','loadBookingDocuments'];
  for(const name of names)defaults[name]=async()=>({});
  const api=await moduleInVm('src/public/bookingFlowHost.js',{
    ...defaults,...handlers,session:storage,readBookingSearch:()=>({search:{origin:'JFK',destination:'ARN'}}),
    SITE_MAP:{home:'/',carRental:'/car-rental',support:'/about/support',travelInfo:'/travel-info',search:'/search'},
    APP_ROUTES:{bookingFlow:'/booking',myProfile:'/my-profile'},isSafeInternalRoute:()=>true
  },['createBookingFlowHost']);
  const host=api.createBookingFlowHost({html:{postMessage:m=>messages.push(m)},location});
  return {host,messages,observed,current};
}

test('selecting an offer starts a guest checkout and reload restores it without a login dialog', async () => {
  const store=new Map();
  const first=await hostHarness({searchId:'search-1'},store);
  await first.host.startFromLocation();
  await first.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_OFFER_READY'});
  await first.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_1'});
  assert.equal(store.get('SKANDI_BOOKING_CART_ID'),'cart-1');
  assert.equal(store.get('SKANDI_BOOKING_CART_TOKEN'),'a'.repeat(64));
  assert.equal(first.current.cartId,'cart-1');
  assert.equal(first.current.cartToken,undefined);
  assert.ok(first.messages.some(m=>m.type==='BOOKING_CART_LOADED'));
  const reloaded=await hostHarness(first.current,store);
  await reloaded.host.startFromLocation();
  assert.equal(reloaded.observed[0].cartToken,'a'.repeat(64));
  await reloaded.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_OFFER_READY'});
  assert.ok(reloaded.messages.some(m=>m.type==='BOOKING_CART_LOADED'));
  assert.ok(reloaded.messages.every(m=>!JSON.stringify(m).includes('a'.repeat(64))));
});

test('a token in a URL is ignored and cannot authorize a different cart', async () => {
  const store=new Map([['SKANDI_BOOKING_CART_ID','cart-1'],['SKANDI_BOOKING_CART_TOKEN','a'.repeat(64)]]);
  const page=await hostHarness({cartId:'another-cart',cartToken:'a'.repeat(64)},store);
  await page.host.startFromLocation();
  assert.equal(page.observed[0].cartToken,'');
  assert.equal(page.current.cartToken,undefined);
  assert.equal(store.get('SKANDI_BOOKING_CART_ID'),'cart-1');
});

test('a guest can return to results and safely retry an offer with the original capability', async () => {
  const store=new Map(),tokens=[];
  const page=await hostHarness({searchId:'search-1'},store,{
    createBookingCartFromOffer:async input=>{tokens.push(input.cartToken);return {cartId:'cart-1',cartToken:input.cartToken}}
  });
  await page.host.startFromLocation();
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_OFFER_READY'});
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_1'});
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_BACK_TO_RESULTS'});
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_1'});
  assert.deepEqual(tokens,['a'.repeat(64),'a'.repeat(64)]);
});

for (const type of ['flight','package','hotel']) {
  test('overlapping '+type+' confirmations make at most one supplier request', async () => {
    const productType=type==='package'?'PACKAGE':type==='hotel'?'HOTEL_ONLY':'FLIGHT_ONLY';
    let row={cart_id:'cart-1',member_id:'member',status:'PaymentPending',total:'100.00',currency:'USD',
      payload:{productType,flightOfferId:'off_1',secureTravelers:'encrypted',payment:{paymentIntentId:'pi_1',amountMinor:10000,currency:'USD'},stayQuote:{id:'quote_1'}}};
    let requests=0;
    const sensitive={passengers:[{id:'p1',givenName:'Sam',familyName:'Example'}],guests:[{givenName:'Sam',familyName:'Example'}],contact:{email:'test@example.com',phoneNumber:'+12125550123'}};
    const api=await moduleInVm('src/backend/SKANDI_CORE/customerBooking.js',{
      text,upper,lower,record,bookingError:error,
      getOwnedCart:async()=>clone(row),toPublicCart:r=>clone(r),
      decryptBookingData:async()=>clone(sensitive),
      transitionOwnedCart:async (_context,_id,from,to)=>{if(row.status!==from)return null;row={...row,status:to};return clone(row)},
      updateOwnedCart:async (_context,_id,patch)=>{row={...row,...clone(patch)};return clone(row)},
      combineServiceSelections:()=>[],toDuffelOrderPassengers:x=>x,
      createDuffelOrderCore:async()=>{requests++;await new Promise(r=>setTimeout(r,15));return {order:{id:'order_1',bookingReference:'ABC123'}}},
      createDuffelStayBookingCore:async()=>{requests++;await new Promise(r=>setTimeout(r,15));return {reconciliationRequired:true}},
      retrieveStripePaymentIntent:async()=>({status:'requires_capture'}),assertStripeAuthorization:()=>{},
      captureStripePaymentIntent:async()=>({status:'succeeded'}),recordPaymentEventOnce:async()=>{},
      markBookingReconciliationRequired:async()=>{row={...row,status:'ReconciliationRequired'};return clone(row)}
    },['commitBookingCore','commitHotelBookingCore']);
    const fn=type==='hotel'?api.commitHotelBookingCore:api.commitBookingCore;
    const input={cartId:'cart-1',termsAccepted:true,paymentIntentId:'pi_1'};
    const outcomes=await Promise.allSettled([fn({memberId:'member'},input),fn({memberId:'member'},input)]);
    assert.equal(requests,1);
    assert.ok(outcomes.some(x=>x.status==='rejected'&&x.reason.code==='BOOKING_COMMIT_IN_PROGRESS'));
  });
}

test('guest confirmation uses the verified cart email without creating a contact', async () => {
  const guest={guestHash:'a'.repeat(64)};
  let row={cart_id:'cart-1',email:'guest@example.com',status:'PaymentReady',payload:{guestAccessHash:guest.guestHash}};
  const api=await moduleInVm('src/backend/SKANDI_CORE/bookingConfirmationEmail.js',{
    text,auth:{elevate:fn=>fn},elevate:fn=>fn,
    customTrigger:{runTrigger:async()=>{}},secrets:{getSecretValue:async name=>({value:name==='SKANDI_GUEST_BOOKING_CONFIRMATION_READY'?'true':'d6e83a13-8b05-45d0-965e-a4515f340342'})},
    restRequest:async()=>[],loadBookingCartCore:async()=>({row:clone(row),cart:{}}),
    updateOwnedCart:async (_context,_id,patch)=>{row={...row,...clone(patch)};return clone(row)}
  },['prepareGuestConfirmationCore','dispatchConfirmedBookingEmailCore']);
  await api.prepareGuestConfirmationCore(guest,'cart-1');
  assert.equal(row.payload.guestReceiptEmail,'guest@example.com');
  row.email='different@example.com';
  row.status='Confirmed';
  await assert.rejects(()=>api.dispatchConfirmedBookingEmailCore(guest,'cart-1'),{code:'BOOKING_EMAIL_RECIPIENT_MISMATCH'});
});

test('flight checkout skips hotel placeholders and preserves guest capability after redirect', async () => {
  const store=new Map(),steps=[];
  let status='Open';
  const page=await hostHarness({searchId:'search-1'},store,{
    loadBookingCart:async input=>({cartId:input.cartId,status,productType:'FLIGHT_ONLY',flow:{currentStep:status==='Open'?'offer':status==='OfferAccepted'?'extras':'transfer'}}),
    acceptBookingOffer:async()=>{status='OfferAccepted'},
    loadBookingExtras:async()=>({items:[]}),
    storeBookingExtras:async()=>{status='ExtrasSaved'},
    loadSignatureTransfers:async()=>({options:[]})
  });
  const advance=async type=>page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type,termsAccepted:true,selectedExtras:[]});
  await page.host.startFromLocation();
  await advance('BOOKING_OFFER_READY');
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_1'});
  await advance('BOOKING_OFFER_ACCEPTED');
  await advance('BOOKING_EXTRAS_SAVE');
  steps.push(...page.messages.filter(m=>m.type==='BOOKING_STEP_ACTIVE').map(m=>m.payload.step));
  assert.ok(steps.includes('transfer'));
  assert.ok(!steps.includes('hotels'));
  assert.equal(store.get('SKANDI_BOOKING_CART_TOKEN'),'a'.repeat(64));
});

test('traveler details and contact are restored, and passport errors appear beside the action', async t => {
  const {JSDOM}=require('jsdom');
  const outer=new JSDOM('<!doctype html><iframe></iframe>',{runScripts:'outside-only',url:'https://www.skanditravels.com/'});
  t.after(()=>outer.window.close());
  const frame=outer.window.document.querySelector('iframe').contentWindow;
  frame.scrollTo=()=>{};
  frame.document.body.innerHTML=await read('skandi-embeds/booking/skandi-booking-flow.html');
  const sent=[];
  outer.window.postMessage=m=>sent.push(m);
  frame.eval(await read('skandi-embeds/booking/skandi-booking-flow.js'));
  const cart={cartId:'cart-1',productType:'FLIGHT_ONLY',travelerCount:1,selectedOffer:{passengers:[{id:'p1'}]},search:{adults:1},
    travelers:[{id:'p1',title:'mr',givenName:'Sam',familyName:'Example',bornOn:'1990-01-01',gender:'m',nationality:'US',documentNumber:'ABC123',documentCountry:'US',documentExpiry:'2035-01-01'}],
    contact:{email:'guest@example.com',phoneNumber:'+12125550123'}};
  frame.dispatchEvent(new frame.MessageEvent('message',{source:outer.window,data:{source:'SKANDI_WIX_PARENT',type:'APIS_CART_RULES_LOADED',payload:{cart}}}));
  const doc=frame.document;
  assert.equal(doc.querySelector('#pax-0-title').value,'mr');
  assert.equal(doc.querySelector('#pax-0-documentNumber').value,'ABC123');
  assert.equal(doc.querySelector('#contactEmail').value,'guest@example.com');
  const issuing=doc.querySelector('#pax-0-documentCountry');
  issuing.value='USA';issuing.dispatchEvent(new frame.Event('input',{bubbles:true}));
  doc.querySelector('[data-action="apis-save"]').click();
  assert.match(doc.querySelector('.action-error').textContent,/passport/i);
  assert.equal(sent.filter(x=>x.type==='APIS_SAVE_AND_CONTINUE').length,0);
  issuing.value='US';issuing.dispatchEvent(new frame.Event('input',{bubbles:true}));
  doc.querySelector('[data-action="apis-save"]').click();
  const message=sent.find(x=>x.type==='APIS_SAVE_AND_CONTINUE');
  assert.equal(message.contact.email,'guest@example.com');
  assert.equal(message.travelers[0].identityDocuments[0].issuingCountryCode,'US');
});

test('an existing supplier order must match the cart and payment before it can be recovered', async () => {
  let reference='another-cart',verifyCount=0,postOrders=0;
  const api=await moduleInVm('src/backend/SKANDI_CORE/duffelAir.js',{
    duffelRequest:async (path,options)=>{
      if(path.includes('/actions/price'))return {data:{id:'off_1',total_amount:'100.00',total_currency:'USD'}};
      if(path==='/air/orders'&&options.method==='POST'){postOrders++;throw new Error('unexpected order creation')}
      if(path==='/air/orders')return {data:[{id:'ord_1',offer_id:'off_1',type:'instant',metadata:{internal_reference:reference,payment_intent_id:'pi_1'}}]};
      throw new Error('unexpected request '+path);
    },
    retrieveStripePaymentIntent:async()=>({id:'pi_1'}),assertStripeAuthorization:()=>{verifyCount++},
    ProviderError:class extends Error{}
  },['createDuffelOrderCore','orderMatchesCheckout']);
  const input={offerId:'off_1',orderType:'instant',internalReference:'cart-1',paymentIntentId:'pi_1',passengers:[]};
  const wrong=await api.createDuffelOrderCore(input);
  assert.equal(wrong.reconciliationRequired,true);
  assert.equal(wrong.order,null);
  assert.equal(verifyCount,0);
  reference='cart-1';
  const valid=await api.createDuffelOrderCore(input);
  assert.equal(valid.recoveredExistingOrder,true);
  assert.equal(verifyCount,1);
  assert.equal(postOrders,0);
});

test('flight reconciliation does not capture funds for an unrelated supplier order', async () => {
  let captures=0;
  const api=await moduleInVm('src/backend/SKANDI_CORE/bookingReconciliation.js',{
    bookingError:error,
    getDuffelOrderByOfferCore:async()=>({order:{id:'ord_1',metadata:{internal_reference:'other-cart'}}}),
    orderMatchesCheckout:()=>false,
    retrieveStripePaymentIntent:async()=>{throw new Error('must not retrieve')},
    captureStripePaymentIntent:async()=>{captures++}
  },['reconcileFlightCart']);
  const result=await api.reconcileFlightCart({memberId:'member'},{cart_id:'cart-1',payload:{flightOfferId:'off_1',payment:{paymentIntentId:'pi_1'}}});
  assert.equal(result.resolved,false);
  assert.equal(result.order,undefined);
  assert.equal(captures,0);
});

test('package reconciliation never finalizes only the flight portion', async () => {
  let flightReconciliations=0;
  const row={cart_id:'cart-1',status:'ReconciliationRequired',payload:{productType:'PACKAGE'}};
  const api=await moduleInVm('src/backend/SKANDI_CORE/customerBooking.js',{
    text,upper,lower,record,bookingError:error,getOwnedCart:async()=>clone(row),
    toPublicCart:r=>clone(r),reconcileFlightCart:async()=>{flightReconciliations++;return {}}
  },['reconcileBookingCore']);
  const result=await api.reconcileBookingCore({memberId:'member'},{cartId:'cart-1'});
  assert.equal(result.resolved,false);
  assert.equal(flightReconciliations,0);
});

test('cart selections cannot be modified while a payment session is active', async () => {
  const row={cart_id:'cart-1',status:'PaymentPending',payload:{productType:'FLIGHT_ONLY'}};
  const api=await moduleInVm('src/backend/SKANDI_CORE/customerBooking.js',{
    text,upper,lower,record,bookingError:error,getOwnedCart:async()=>clone(row)
  },['storeSeatSelectionsCore']);
  await assert.rejects(()=>api.storeSeatSelectionsCore({memberId:'member'},{cartId:'cart-1',skipped:true}),{code:'BOOKING_PAYMENT_IN_PROGRESS'});
});

for (const released of [false,true]) {
  test('supplier rejection '+(released?'only retries after confirmed cancellation':'holds the cart for review when cancellation is unknown'), async () => {
    let row={cart_id:'cart-1',status:'PaymentPending',currency:'USD',total:'100.00',
      payload:{productType:'FLIGHT_ONLY',flightOfferId:'off_1',secureTravelers:'x',payment:{paymentIntentId:'pi_1'}}};
    const api=await moduleInVm('src/backend/SKANDI_CORE/customerBooking.js',{
      text,upper,lower,record,bookingError:error,getOwnedCart:async()=>clone(row),
      toPublicCart:r=>clone(r),decryptBookingData:async()=>({passengers:[{id:'p1'}]}),
      transitionOwnedCart:async()=>{row.status='Committing';return clone(row)},
      combineServiceSelections:()=>[],toDuffelOrderPassengers:x=>x,
      createDuffelOrderCore:async()=>{throw error('DUFFEL_REJECTED','Declined')},
      voidUnusedAuthorization:async()=>released?{status:'canceled'}:null,
      updateOwnedCart:async (_context,_id,patch)=>{row={...row,...clone(patch)};return clone(row)},
      markBookingReconciliationRequired:async (_context,_row,details)=>{row={...row,status:'ReconciliationRequired',payload:{...row.payload,reconciliation:details}};return clone(row)}
    },['commitBookingCore']);
    await assert.rejects(()=>api.commitBookingCore({memberId:'member'},{cartId:'cart-1',termsAccepted:true,paymentIntentId:'pi_1'}),
      {code:released?'DUFFEL_REJECTED':'BOOKING_RECONCILIATION_REQUIRED'});
    assert.equal(row.status,released?'PaymentReady':'ReconciliationRequired');
    if(released)assert.equal(row.payload.payment.status,'authorization_released');
  });
}

test('a new payment attempt uses a stable new idempotency key after a released authorization', async () => {
  const keys=[];
  const api=await moduleInVm('src/backend/SKANDI_CORE/duffelAir.js',{
    duffelRequest:async()=>({data:{id:'off_1',total_amount:'100.00',total_currency:'USD'}}),
    createStripePaymentIntent:async input=>{keys.push(input.idempotencyKey);return {id:'pi_new',status:'requires_payment_method'}},
    getStripePublishableKey:async()=>('pk_test'),
    ProviderError:class extends Error{}
  },['prepareDuffelPaymentCore']);
  const input={offerId:'off_1',idempotencyContext:'cart-1',idempotencySuffix:'_pi_previous'};
  await api.prepareDuffelPaymentCore(input);await api.prepareDuffelPaymentCore(input);
  assert.deepEqual(keys,['skandi_auth_cart-1_10000_usd_pi_previous','skandi_auth_cart-1_10000_usd_pi_previous']);
});

test('guest confirmation payload includes only verified itinerary and fare data', async () => {
  const api=await moduleInVm('src/backend/SKANDI_CORE/bookingConfirmationEmail.js',{
    text,auth:{elevate:fn=>fn},elevate:fn=>fn,customTrigger:{runTrigger:async()=>{}},
    secrets:{getSecretValue:async()=>({value:''})}
  },['confirmedPayload']);
  const row={cart_id:'cart-1',email:'guest@example.com',status:'Confirmed',total:'850.00',currency:'USD',created_at:'2026-11-09T10:00:00Z',
    payload:{productType:'FLIGHT_ONLY',bookingReference:'ABC123',airOrder:{id:'ord_1',bookingReference:'ABC123'},
      payment:{status:'succeeded'},selectedOffer:{conditions:{refund_before_departure:{allowed:false},change_before_departure:{allowed:true,penalty_amount:'30.00',penalty_currency:'USD'}}},
      flow:{confirmedAt:'2026-11-09T10:10:00Z'}}};
  const cart={travelerCount:1,travelers:[{givenName:'Alex',familyName:'Example'}],
    airOrder:{slices:[{segments:[{marketingCarrier:{iataCode:'SK',name:'SAS'},operatingCarrier:{name:'SAS'},marketingFlightNumber:'904',origin:{iataCode:'JFK'},destination:{iataCode:'ARN'},departingAt:'2027-02-14T17:25:00',arrivingAt:'2027-02-15T07:35:00'}]}]}};
  const data=api.confirmedPayload(row,cart,'','');
  assert.equal(data.customerEmail,'guest@example.com');
  assert.equal(data.bookingDate,'2026-11-09T10:00:00Z');
  assert.match(data.flightDetails,/JFK → ARN/);
  assert.match(data.cancellationTerms,/Refund before departure: not allowed/);
  assert.match(data.cancellationTerms,/USD 30.00/);
  assert.equal(data.manageBookingUrl,'https://www.skanditravels.com/about/support');
  assert.equal('contactId' in data,false);
  assert.equal('memberId' in data,false);
});

test('guest payment fails closed when confirmation delivery has not been enabled', async () => {
  let writes=0;
  const row={cart_id:'cart-1',email:'guest@example.com',status:'PaymentReady',payload:{}};
  const api=await moduleInVm('src/backend/SKANDI_CORE/bookingConfirmationEmail.js',{
    text,auth:{elevate:fn=>fn},elevate:fn=>fn,customTrigger:{runTrigger:async()=>{}},
    secrets:{getSecretValue:async name=>({value:name==='SKANDI_GUEST_BOOKING_CONFIRMATION_READY'?'false':'d6e83a13-8b05-45d0-965e-a4515f340342'})},
    loadBookingCartCore:async()=>({row,cart:{}}),updateOwnedCart:async()=>{writes++}
  },['prepareGuestConfirmationCore']);
  await assert.rejects(()=>api.prepareGuestConfirmationCore({guestHash:'a'.repeat(64)},'cart-1'),{code:'BOOKING_CONFIRMATION_UNAVAILABLE'});
  assert.equal(writes,0);
});

test('a card verification return restores the cart only with its same-tab capability', async () => {
  const store=new Map([['SKANDI_BOOKING_CART_ID','cart-1'],['SKANDI_BOOKING_CART_TOKEN','a'.repeat(64)]]);
  const page=await hostHarness({cartId:'cart-1',step:'payment',payment_intent:'pi_1',payment_intent_client_secret:'pi_1_secret_fake'},store,{
    loadBookingCart:async input=>({cartId:input.cartId,status:'PaymentPending',productType:'FLIGHT_ONLY',flow:{currentStep:'payment'}}),
    prepareBookingPayment:async input=>({cart:{cartId:input.cartId},payment:{paymentIntentId:'pi_1'}})
  });
  await page.host.startFromLocation();
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_OFFER_READY'});
  assert.ok(page.messages.some(m=>m.type==='PAYMENT_SESSION_LOADED'));
  assert.equal(page.current.payment_intent_client_secret,undefined);
  assert.equal(store.get('SKANDI_BOOKING_CART_TOKEN'),'a'.repeat(64));
});

test('choosing a different offer creates a different guest capability', async () => {
  const store=new Map(),tokens=[];
  let count=0;
  const page=await hostHarness({searchId:'search-1'},store,{
    searchUnifiedOffers:async()=>({items:[{id:'off_1',itemType:'flight'},{id:'off_2',itemType:'flight'}]}),
    beginGuestBookingSession:async()=>({cartToken:(++count===1?'a':'b').repeat(64)}),
    createBookingCartFromOffer:async input=>{tokens.push(input.cartToken);return {cartId:input.offer.id,cartToken:input.cartToken}},
    loadBookingCart:async input=>({cartId:input.cartId,status:'Open',productType:'FLIGHT_ONLY'})
  });
  await page.host.startFromLocation();
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_OFFER_READY'});
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_1'});
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_BACK_TO_RESULTS'});
  await page.host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_2'});
  assert.deepEqual(tokens,['a'.repeat(64),'b'.repeat(64)]);
});

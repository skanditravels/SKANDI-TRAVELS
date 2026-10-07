// /src/pages/Booking.e8twe.js
// SKANDI Booking Flow — V12 canonical multi-state controller.
// Route: /booking
// State box: #bookingFlowStates
// Customer-facing HTML states remain UI-only; booking mutations remain in customerBooking.web.

import wixLocation from "wix-location-frontend";
import { session } from "wix-storage";
import { readBookingSearch } from "public/bookingSearch";
import { openCustomerLogin } from "public/customerAuthUi";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer,
  loadBookingCart,
  acceptBookingOffer as saveOfferDecision,
  loadBookingExtras as getBookingExtras,
  storeBookingExtras as saveBookingExtras,
  loadSignatureTransfers as getSignatureTransferOptions,
  storeSignatureTransfer as saveSignatureTransfer,
  saveBookingTravelers,
  saveHotelGuests,
  prepareBookingPayment as prepareFlightPayment,
  prepareHotelPayment,
  commitBooking as commitFlightBooking,
  commitHotelBooking,
  loadBookingRequirements as getApisRulesForCart,
  refreshBookingRequirements as refreshTravelRequirements,
  loadSeatMaps as getSeatmapForCart,
  storeSeatSelections as saveSeatSelections,
  loadBookingConfirmation as getSourceAwareBookingConfirmation,
  loadBookingDocuments as getTravelDocumentsForCart
} from "backend/SKANDI_CORE/customerBooking.web";

const VERSION = "V12";
const STATEBOX_ID = "#bookingFlowStates";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const STEPS = {
  offer: { state: "stateOffer", embed: "#bookingOfferEmbed", source: "SKANDI_BOOKING_OFFER" },
  extras: { state: "stateExtras", embed: "#bookingExtrasEmbed", source: "SKANDI_BOOKING_EXTRAS" },
  transfer: { state: "stateTransfer", embed: "#signatureTransferEmbed", source: "SKANDI_SIGNATURE_TRANSFER" },
  apis: { state: "stateApis", embed: "#apisHtml", source: "SKANDI_BOOKING_APIS_V2" },
  seats: { state: "stateSeatMap", embed: "#seatmapEmbed", source: "SKANDI_BOOKING_SEATMAP" },
  payment: { state: "statePayment", embed: "#paymentEmbed", source: "SKANDI_BOOKING_PAYMENT" },
  confirmation: { state: "stateConfirmation", embed: "#confirmationEmbed", source: "SKANDI_BOOKING_CONFIRMATION_V2" },
  documents: { state: "stateDocuments", embed: "#bookingDocumentsEmbed", source: "SKANDI_BOOKING_DOCUMENTS" }
};

const SOURCE_TO_STEP = Object.keys(STEPS).reduce((acc, step) => {
  acc[STEPS[step].source] = step;
  return acc;
}, {});

const READY_TYPES = {
  offer: "BOOKING_OFFER_READY",
  extras: "BOOKING_EXTRAS_READY",
  transfer: "SIGNATURE_TRANSFER_READY",
  apis: "APIS_HTML_READY",
  seats: "SEATMAP_READY",
  payment: "PAYMENT_READY",
  confirmation: "CONFIRMATION_READY",
  documents: "BOOKING_DOCUMENTS_READY"
};

const MUTATING_MESSAGE_TYPES = new Set([
  "BOOKING_SEARCH_SELECT",
  "BOOKING_OFFER_ACCEPTED",
  "BOOKING_EXTRAS_SAVE",
  "SIGNATURE_TRANSFER_SELECT",
  "SIGNATURE_TRANSFER_SKIP",
  "APIS_SAVE_AND_CONTINUE",
  "SEATMAP_SAVE",
  "SEATMAP_SKIP",
  "PAYMENT_COMMIT"
]);

const STEP_ORDER = ["offer", "extras", "transfer", "apis", "seats", "payment", "confirmation", "documents"];

let activeProductType = "FLIGHT";
let embeds = {};
let currentStep = "offer";
let cartId = "";
let cartToken = "";
let paymentCommitInFlight = false;
let startupReady=false, startupError=null, searchContext=null, searchJob=null, selectionJob=null;
const requestIds = new Map();
const boundEmbeds = new Set();
const lastLoaded = new Map();
function boundedRead(promise, milliseconds=30000) {
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error("The request took too long. Please retry."),{code:"BOOKING_TIMEOUT"})),milliseconds);})]).finally(()=>clearTimeout(timer));
}
async function searchOffers(force=false) {
  if(!searchContext)throw new Error("This search has expired. Return to Home and search again.");
  if(selectionJob)return;
  if(searchJob&&!force){if(searchJob.result)postToStep("offer","BOOKING_SEARCH_RESULTS",searchJob.result);return searchJob.promise;}
  const job={promise:null,result:null};searchJob=job;
  postToStep("offer","BOOKING_SEARCH_LOADING",{search:searchContext.search});
  job.promise=(async()=>{
    const result=await boundedRead(searchUnifiedOffers({search:searchContext.search}),85000);
    if(searchJob!==job)return;
    if(!Array.isArray(result?.items))throw new Error("Travel results are temporarily unavailable.");
    job.result={items:result.items,search:searchContext.search,errors:(result.errors||[]).map(e=>({source:["flight","hotel","car"].includes(e.source)?e.source:"search",code:/^[A-Z0-9_]{2,80}$/.test(e.code||"")?e.code:"SEARCH_FAILED"}))};
    postToStep("offer","BOOKING_SEARCH_RESULTS",job.result);
  })().catch(e=>{if(searchJob===job)searchJob=null;throw e;});return job.promise;
}
async function selectSearchOffer(message) {
  if(selectionJob)return selectionJob;
  const id=String(message.offerId||message.payload?.offerId||"");
  const offer=searchJob?.result?.items.find(i=>String(i.id||i.staySearchResultId||"")===id);
  if(!offer)throw new Error("This offer is no longer available. Search again.");
  selectionJob=(async()=>{
    let result=await createBookingCartFromOffer({offer,search:searchContext.search});
    if(result?.requiresLogin){await openCustomerLogin({sourcePage:"BOOKING",reason:"BOOKING_CART_AUTH"});result=await createBookingCartFromOffer({offer,search:searchContext.search});}
    if(result?.requiresLogin)throw new Error("Sign in to continue with this offer.");
    if(!result?.cartId)throw new Error("The booking cart could not be confirmed. Check My Booking before trying again.");
    setCartId(result.cartId);cartToken="";session.removeItem("SKANDI_BOOKING_CART_TOKEN");if(result.cartToken)setCartToken(result.cartToken);
    const cart=await boundedRead(getBookingCart({cartId}));
    if(cart.productType==="CAR_RENTAL_ONLY"){wixLocation.to(SITE_MAP.carRental+"?cartId="+encodeURIComponent(cartId));return;}
    if(wixLocation.queryParams?.remove)wixLocation.queryParams.remove(["searchId"]);
    updateBookingUrl("offer");postToStep("offer","BOOKING_CART_LOADED",{cart});
  })();
  try{await selectionJob;}finally{selectionJob=null;}
}

const readyEmbeds = new Set();
const initializedSteps = new Set();
const initializationPromises = new Map();
const actionsInFlight = new Set();

async function getBookingCart(input = {}) {
  const cart = await loadBookingCart(input);
  activeProductType = String(cart.productType || "FLIGHT").toUpperCase();
  return cart;
}

function isHotelCart() {
  return activeProductType === "HOTEL_ONLY";
}

async function bookingHasFlight(input) {
  const cart = await getBookingCart(input);
  return Boolean(
    cart.selectedOffer?.id &&
    !["HOTEL_ONLY", "CAR_RENTAL_ONLY"].includes(activeProductType)
  );
}

async function savePassengerApisAndReprice(input) {
  await getBookingCart(input);

  if (isHotelCart()) {
    return saveHotelGuests({
      ...input,
      guests: input.travelers,
      email: input.contact?.email,
      phoneNumber:
        input.contact?.phoneNumber ||
        input.contact?.phone
    });
  }

  return saveBookingTravelers(input);
}

async function prepareBookingPayment(input) {
  await getBookingCart(input);
  return isHotelCart()
    ? prepareHotelPayment(input)
    : prepareFlightPayment(input);
}

async function authorizePaymentAndCommitBooking(input) {
  await getBookingCart(input);
  return isHotelCart()
    ? commitHotelBooking(input)
    : commitFlightBooking(input);
}

$w.onReady(async function () {
  const searchId=String(wixLocation.query.searchId||"");
  searchContext=searchId?readBookingSearch(searchId):null;
  if(!searchId){cartId=wixLocation.query.cartId||session.getItem("SKANDI_BOOKING_CART_ID")||"";cartToken=wixLocation.query.cartToken||session.getItem("SKANDI_BOOKING_CART_TOKEN")||"";}
  if(cartId)setCartId(cartId);if(cartToken)setCartToken(cartToken);
  if(String(wixLocation.query.step||"").toLowerCase()==="home"){wixLocation.to(SITE_MAP.home);return;}
  bindEmbeds();
  try {
    if(searchId||!cartId){
      currentStep="offer";startupReady=true;
      if(!searchContext)startupError="This search is missing or has expired. Return to Home and search again.";
      await goStep("offer",{silentUrl:true});
    } else {
      let cart;
      try{cart=await boundedRead(getBookingCart({cartId}));}
      catch(error){if(/login|required|sign in|forbidden/i.test(String(error?.code||"")+" "+String(error?.message||""))){await openCustomerLogin({sourcePage:"BOOKING",reason:"BOOKING_CART_AUTH"});cart=await boundedRead(getBookingCart({cartId}));}else throw error;}
      if(cart.productType==="CAR_RENTAL_ONLY"){wixLocation.to(SITE_MAP.carRental+"?cartId="+encodeURIComponent(cartId));return;}
      currentStep=resolveInitialStep(cart,wixLocation.query.step||"");startupReady=true;
      await goStep(currentStep,{silentUrl:true});
    }
  }catch(error){startupReady=true;startupError=publicBookingError(error);postError(currentStep,startupError);}
});

function getElement(selector) {
  try {
    return $w(selector);
  } catch (_) {
    return null;
  }
}

function bindEmbeds() {
  Object.keys(STEPS).forEach(step=>{
    const el=getElement(STEPS[step].embed);
    if(!el||typeof el.onMessage!=="function")return;
    embeds[step]=el;
    const key=el.id||STEPS[step].embed;
    if(!boundEmbeds.has(key)){el.onMessage(event=>handleBookingMessage(event,step));boundEmbeds.add(key);}
    postToStep(step,"BOOKING_HOST_READY",{step,state:STEPS[step].state});
  });
}

function normalizeStep(step) {
  const value = String(step || "").toLowerCase();
  return STEPS[value] ? value : "offer";
}

function statusResumeStep(cart = {}) {
  const flowStep = String(cart.flow?.currentStep || "").toLowerCase();
  if (STEPS[flowStep]) return flowStep;

  const byStatus = {
    Open: "offer",
    OfferAccepted: "extras",
    ExtrasSaved: "transfer",
    TravelersPending: "apis",
    TravelersSaved: "seats",
    PaymentReady: "payment",
    PaymentPending: "payment",
    Committing: "payment",
    ReconciliationRequired: "payment",
    Confirmed: "confirmation"
  };

  return byStatus[String(cart.status || "")] || "offer";
}

function resolveInitialStep(cart = {}, requestedRaw = "") {
  const requested = String(requestedRaw || "").toLowerCase();
  const resume = statusResumeStep(cart);
  const product = String(cart.productType || "").toUpperCase();

  if (String(cart.status || "") === "Confirmed") {
    return requested === "documents" ? "documents" : "confirmation";
  }

  if (
    ["PaymentPending", "Committing", "ReconciliationRequired"].includes(
      String(cart.status || "")
    )
  ) {
    return "payment";
  }


  if (!STEPS[requested]) return resume;

  const requestedIndex = STEP_ORDER.indexOf(requested);
  const resumeIndex = STEP_ORDER.indexOf(resume);

  // Before payment authorization, allow customers to reload a previous
  // editable state, but never use the URL to jump ahead of the cart.
  if (requestedIndex >= 0 && requestedIndex <= resumeIndex) {
    
    
    return requested;
  }

  return resume;
}

function setCartId(value) {
  if (!value) return;
  cartId = String(value);
  session.setItem("SKANDI_BOOKING_CART_ID", cartId);
}

function setCartToken(value) {
  if (!value) return;
  cartToken = String(value);
  session.setItem("SKANDI_BOOKING_CART_TOKEN", cartToken);
}

function getCartId(msg = {}) {
  const supplied=msg.cartId||msg.payload?.cartId;
  if(supplied&&cartId&&String(supplied)!==String(cartId))throw new Error("This action belongs to a different booking. Reload this page.");
  const value=cartId||wixLocation.query.cartId||session.getItem("SKANDI_BOOKING_CART_ID");
  if(!value)throw new Error("This booking link is missing its cart reference. Return to Home and select a live offer again.");
  return String(value);
}

function getCartToken() {return cartToken||"";}

function bookingAccess(msg = {}) {
  return {
    cartId: getCartId(msg),
    cartToken: getCartToken(msg)
  };
}

function postToStep(step, type, payload = {}, extra = {}) {
  const html = embeds[step];
  if(/_LOADED$|^BOOKING_SEARCH_RESULTS$|^SIGNATURE_TRANSFER_OPTIONS$/.test(type))lastLoaded.set(step,{type,payload,extra});
  if (!html) return;

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...extra,
    requestId:requestIds.get(step)||"",
    timestamp: new Date().toISOString()
  });
}

function postError(step, message, extra = {}) {
  postToStep(
    step,
    "BOOKING_ERROR",
    {},
    {
      message: message || "Booking step failed.",
      ...extra
    }
  );
}

function publicBookingError(error) {
  const raw = String(
    error?.publicMessage ||
    error?.message ||
    "The booking request could not be completed."
  ).trim();

  const messages = {
    LOGIN_REQUIRED:
      "Sign in to your SKANDI account to continue with this booking.",
    BOOKING_CART_ACCESS_DENIED:
      "This secure booking session has expired. Return to Home and select the offer again.",
    BOOKING_CART_NOT_FOUND:
      "This booking session could not be found. Return to Home and select the offer again.",
    CART_NOT_FOUND:
      "This booking session could not be found or belongs to another account.",
    BOOKING_OFFER_EXPIRED:
      "This flight offer has expired. Search again for a current option.",
    BOOKING_LIVE_OFFER_INVALID:
      "This flight offer is no longer valid. Search again for a current option.",
    BOOKING_HOTEL_RESULT_INVALID:
      "This hotel offer is no longer valid. Search again for current availability.",
    BOOKING_HOTEL_RATE_UNAVAILABLE:
      "This hotel rate is no longer available. Search again for current availability.",
    BOOKING_SEAT_UNAVAILABLE:
      "That seat is no longer available. Choose another seat or continue without seats.",
    SEAT_UNAVAILABLE:
      "That seat is no longer available. Choose another seat or continue without seats.",
    BOOKING_SEATMAP_UNAVAILABLE:
      "Seat selection is not available for this flight right now.",
    PAYMENT_NOT_AUTHORIZED:
      "The card authorization is not ready for booking.",
    BOOKING_PAYMENT_NOT_COMPLETE:
      "Payment has not completed yet. Check the payment status before retrying.",
    BOOKING_PAYMENT_AMOUNT_MISMATCH:
      "The booking price changed after payment was prepared. Refresh the booking before trying again.",
    PAYMENT_AMOUNT_MISMATCH:
      "The authorized amount no longer matches the current booking price.",
    BOOKING_RECONCILIATION_REQUIRED:
      "This reservation needs supplier/payment reconciliation. Do not pay again. SKANDI must resolve the existing booking attempt.",
    BOOKING_CONTACT_PHONE_INVALID:
      "Enter the mobile number in international format, including the + country code.",
    BOOKING_CONTACT_EMAIL_INVALID:
      "Enter a valid contact email address.",
    INVALID_PHONE:
      "Enter the mobile number in international format, including the + country code.",
    INVALID_EMAIL:
      "Enter a valid contact email address.",
    INVALID_PASSENGER_TITLE:
      "Choose a valid title for each traveler.",
    INVALID_PASSENGER_GENDER:
      "Choose a valid gender for each traveler.",
    TERMS_REQUIRED:
      "Accept the applicable booking terms before continuing."
  };

  if (messages[raw]) return messages[raw];

  if (/network request failed|could not be reached/i.test(raw)) {
    return "The live travel provider could not be reached. Try again.";
  }

  if (/rate limit|rate limiting/i.test(raw)) {
    return "Live availability is temporarily busy. Try again shortly.";
  }

  return raw.replace(
    /BOOKING_[A-Z0-9_]+/g,
    "The booking request could not be completed."
  );
}

async function changeStatebox(step) {
  const box=getElement(STATEBOX_ID),stateId=STEPS[step]?.state;
  if(!box||typeof box.changeState!=="function")throw new Error("The booking state box is unavailable. Please contact SKANDI.");
  if(Array.isArray(box.states)&&!box.states.some(state=>state.id===stateId))throw new Error("Booking state "+stateId+" is not installed. Please contact SKANDI.");
  await box.changeState(stateId);
}

function updateBookingUrl(step, extraQuery = {}) {
  const query = { step, ...extraQuery };
  if (cartId) query.cartId = cartId;
  if (cartToken) query.cartToken = cartToken;

  if (wixLocation.queryParams && wixLocation.queryParams.add) {
    try {
      wixLocation.queryParams.add(query);
      return;
    } catch (_) {}
  }

  const qs = Object.keys(query)
    .filter(
      key =>
        query[key] !== undefined &&
        query[key] !== null &&
        String(query[key]) !== ""
    )
    .map(
      key =>
        `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
    )
    .join("&");

  wixLocation.to(
    `${APP_ROUTES.bookingFlow}${qs ? `?${qs}` : ""}`
  );
}

async function goStep(step, options = {}) {
  const next=normalizeStep(step),previous=currentStep;
  await changeStatebox(next);
  currentStep=next;initializedSteps.delete(next);lastLoaded.delete(next);bindEmbeds();
  if(previous!==next)postToStep(previous,"BOOKING_STEP_INACTIVE",{step:previous});
  if(!options.silentUrl)updateBookingUrl(next,options.query||{});
  postToStep(next,"BOOKING_STEP_ACTIVE",{step:next});
  if(startupReady&&readyEmbeds.has(next)){
    try{await initializeStep(next);}catch(error){postError(next,publicBookingError(error),{retryable:true});}
  }
}

function stepFromPath(path) {
  const p = String(path || "").toLowerCase();

  if (p === "/home" || p === "/") return "home";
  if (p.includes("/booking/offer")) return "offer";
  if (p.includes("/booking/extras")) return "extras";
  if (p.includes("/booking/transfer")) return "transfer";
  if (p.includes("/booking/apis")) return "apis";
  if (p.includes("/booking/seats")) return "seats";
  if (p.includes("/booking/payment") || p === "/payment") return "payment";
  if (
    p.includes("/booking/confirmation") ||
    p === "/confirmation"
  ) return "confirmation";
  if (p.includes("/booking/documents")) return "documents";

  return "";
}

async function handleBookingMessage(event, expectedStep) {
  const msg = event.data || {};
  const step = SOURCE_TO_STEP[msg.source];

  if (!step || step !== expectedStep) {
    console.warn(
      `[Booking ${VERSION}] Ignored unexpected source ${msg.source || "unknown"} from ${expectedStep}.`
    );
    return;
  }

  if(msg.type!==READY_TYPES[step]&&step!==currentStep)return;
  if(msg.requestId)requestIds.set(step,String(msg.requestId).slice(0,160));
  const actionKey = "booking-mutation";
  const isMutatingAction = MUTATING_MESSAGE_TYPES.has(msg.type);

  if(actionsInFlight.has(actionKey)&&msg.type!==READY_TYPES[step])return;
  if (isMutatingAction && actionsInFlight.has(actionKey)) return;
  if (isMutatingAction) actionsInFlight.add(actionKey);

  try {
    if(msg.type==="BOOKING_RETRY"){
      initializedSteps.delete(step);startupError=null;
      if(!cartId){if(step==="offer")return await searchOffers(true);throw new Error("Return to Home and select an offer.");}
      const cart=await boundedRead(getBookingCart(bookingAccess()));
      return await goStep(resolveInitialStep(cart),{reason:"status-check"});
    }
    if (msg.type === READY_TYPES[step]) {
      readyEmbeds.add(step);
      if (step === currentStep && startupReady) await initializeStep(step);
      return;
    }

    if(msg.type==="BOOKING_NAVIGATE"){await handleGenericNavigate(msg);return;}
    if (step === "offer") await handleOffer(msg);
    else if (step === "extras") await handleExtras(msg);
    else if (step === "transfer") await handleTransfer(msg);
    else if (step === "apis") await handleApis(msg);
    else if (step === "seats") await handleSeats(msg);
    else if (step === "payment") await handlePayment(msg);
    else if (step === "confirmation") await handleConfirmation(msg);
    else if (step === "documents") await handleDocuments(msg);

  } catch (error) {
    console.error(`[Booking ${VERSION}] ${step}:${msg.type || "unknown"} failed`,String(error?.code||"BOOKING_REQUEST_FAILED"));
    postError(step, publicBookingError(error),{retryable:!["PAYMENT_COMMIT","BOOKING_SEARCH_SELECT"].includes(msg.type),code:error?.code||"BOOKING_REQUEST_FAILED"});
  } finally {
    if (isMutatingAction) actionsInFlight.delete(actionKey);
  }
}

async function initializeStep(step) {
  if(startupError){postError(step,startupError);return;}
  if(initializedSteps.has(step)){const cached=lastLoaded.get(step);if(cached)postToStep(step,cached.type,cached.payload,cached.extra);return;}
  if (initializationPromises.has(step)) {
    return initializationPromises.get(step);
  }

  const message = {
    source: STEPS[step].source,
    type: READY_TYPES[step]
  };

  const promise = (async () => {
    if (step === "offer") await handleOffer(message);
    else if (step === "extras") await handleExtras(message);
    else if (step === "transfer") await handleTransfer(message);
    else if (step === "apis") await handleApis(message);
    else if (step === "seats") await handleSeats(message);
    else if (step === "payment") await handlePayment(message);
    else if (step === "confirmation") await handleConfirmation(message);
    else if (step === "documents") await handleDocuments(message);

    initializedSteps.add(step);
  })();

  initializationPromises.set(step, promise);

  try {
    await promise;
  } finally {
    initializationPromises.delete(step);
  }
}

async function handleOffer(msg) {
  if(msg.type==="BOOKING_SEARCH_SELECT")return selectSearchOffer(msg);
  if(msg.type==="BOOKING_SEARCH_REFRESH"){if(cartId)return;return searchOffers(true);}
  if(msg.type==="BOOKING_BACK_TO_RESULTS"){
    if(!searchContext){wixLocation.to(SITE_MAP.home);return;}
    cartId="";cartToken="";session.removeItem("SKANDI_BOOKING_CART_ID");session.removeItem("SKANDI_BOOKING_CART_TOKEN");wixLocation.queryParams?.remove(["cartId","cartToken"]);wixLocation.queryParams?.add({step:"offer",searchId:searchContext.id});
    return searchOffers();
  }
  if(msg.type==="BOOKING_OFFER_READY"&&!cartId)return searchOffers();
  const access=bookingAccess(msg);
  if(msg.type==="BOOKING_OFFER_READY"){const cart=await boundedRead(getBookingCart(access));postToStep("offer","BOOKING_CART_LOADED",{cart});return;}
  if(msg.type==="BOOKING_OFFER_ACCEPTED"){await saveOfferDecision({...access,termsAccepted:msg.termsAccepted===true});await goStep("extras",{reason:"offer-accepted"});}
}

async function handleExtras(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "BOOKING_EXTRAS_READY") {
    const payload = await boundedRead(getBookingExtras(access));
    postToStep("extras", "BOOKING_EXTRAS_LOADED", payload);
    return;
  }

  if (msg.type === "BOOKING_EXTRAS_SAVE") {
    const result = await saveBookingExtras({
      ...access,
      selectedExtras: msg.selectedExtras || []
    });

    await goStep("transfer",{reason:"extras-saved"});
  }
}

async function handleTransfer(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "SIGNATURE_TRANSFER_READY") {
    const payload = await boundedRead(getSignatureTransferOptions(access));
    postToStep(
      "transfer",
      "SIGNATURE_TRANSFER_OPTIONS",
      payload
    );
    return;
  }

  if (msg.type === "SIGNATURE_TRANSFER_SELECT") {
    await saveSignatureTransfer({
      ...access,
      transfer: msg.transfer || null
    });

    await goStep("apis", {
      reason: "transfer-selected"
    });
    return;
  }

  if (msg.type === "SIGNATURE_TRANSFER_SKIP") {
    await saveSignatureTransfer({
      ...access,
      transfer: null
    });

    await goStep("apis", {
      reason: "transfer-skipped"
    });
  }
}

async function handleApis(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "APIS_HTML_READY") {
    const [cart, rules] = await boundedRead(Promise.all([
      getBookingCart({
        ...access,
        view: "apis"
      }),
      getApisRulesForCart(access)
    ]));

    postToStep(
      "apis",
      "APIS_CART_RULES_LOADED",
      { cart, rules }
    );
    return;
  }

  if (msg.type === "APIS_RULES_REFRESH") {
    const rules = await refreshTravelRequirements({
      ...access,
      travelers: msg.travelers || []
    });

    postToStep(
      "apis",
      "APIS_REQUIREMENTS_RESULT",
      { rules }
    );
    return;
  }

  if (msg.type === "APIS_SAVE_AND_CONTINUE") {
    await savePassengerApisAndReprice({
      ...access,
      travelers: msg.travelers || [],
      contact: msg.contact || {}
    });

    await goStep("seats",{reason:"apis-saved"});
  }
}

async function handleSeats(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "SEATMAP_READY") {
    const payload = await boundedRead(getSeatmapForCart(access));
    postToStep(
      "seats",
      "SEATMAP_LOADED",
      payload
    );
    return;
  }

  if (msg.type === "SEATMAP_SAVE") {
    await saveSeatSelections({
      ...access,
      selections: msg.selections || {}
    });

    await goStep("payment", {
      reason: "seats-saved"
    });
    return;
  }

  if (msg.type === "SEATMAP_SKIP") {
    await saveSeatSelections({
      ...access,
      selections: {},
      skipped: true
    });

    await goStep("payment", {
      reason: "seats-skipped"
    });
  }
}

async function handlePayment(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "PAYMENT_READY") {
    const cart=await boundedRead(getBookingCart(access));
    if(cart.status==="Confirmed"){await goStep("confirmation");return;}
    if(["Committing","ReconciliationRequired"].includes(cart.status)){postError("payment","This reservation is being processed or reviewed. Check its status or contact SKANDI before making another payment.",{retryable:false});return;}
    const result = await prepareBookingPayment(access);

    postToStep(
      "payment",
      "PAYMENT_SESSION_LOADED",
      result
    );
    return;
  }

  if (msg.type === "PAYMENT_COMMIT") {
    if (paymentCommitInFlight) return;

    paymentCommitInFlight = true;

    postToStep(
      "payment",
      "PAYMENT_PROGRESS",
      {},
      {
        message:
          "Verifying payment and creating your reservation..."
      }
    );

    try {
      const result =
        await authorizePaymentAndCommitBooking({
          ...access,
          termsAccepted:
            msg.termsAccepted === true,
          paymentIntentId: String(
            msg.paymentIntentId ||
            msg.payload?.paymentIntentId ||
            ""
          )
        });

      if (
        result?.reconciliationRequired === true ||
        String(result?.status || "") ===
          "ReconciliationRequired"
      ) {
        postError(
          "payment",
          "The supplier booking is being reconciled. Do not pay again. SKANDI must resolve the existing booking attempt.",{retryable:false}
        );
        return;
      }

      if(result?.status!=="Confirmed")throw new Error("The reservation is not confirmed yet. Check its status before paying again.");
      await goStep("confirmation", {
        reason: "payment-committed",
        query: {
          ref: result?.bookingReference || ""
        }
      });
    } finally {
      paymentCommitInFlight = false;
    }
  }
}

async function handleConfirmation(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "CONFIRMATION_READY") {
    const confirmation =
      await boundedRead(getSourceAwareBookingConfirmation(access));

    postToStep(
      "confirmation",
      "CONFIRMATION_LOADED",
      { confirmation }
    );
    return;
  }

  if (
    msg.type === "CONFIRMATION_NAVIGATE" &&
    msg.path
  ) {
    const step = stepFromPath(msg.path);

    if (step === "home") {
      wixLocation.to(SITE_MAP.home);
      return;
    }

    if (step) {
      await goStep(step, {
        reason: "confirmation-navigate"
      });
      return;
    }

    navigateInternal(msg.path);
  }
}

async function handleDocuments(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "BOOKING_DOCUMENTS_READY") {
    const payload =
      await boundedRead(getTravelDocumentsForCart(access));

    postToStep(
      "documents",
      "BOOKING_DOCUMENTS_LOADED",
      payload
    );
  }
}

async function handleGenericNavigate(msg) {
  if(msg.type!=="BOOKING_NAVIGATE"||!msg.path)return;
  const next=stepFromPath(msg.path);
  if(next==="home"){wixLocation.to(SITE_MAP.home);return;}
  if(next){
    if(!cartId){if(next==="offer")await goStep("offer");return;}
    const cart=await boundedRead(getBookingCart(bookingAccess()));
    const allowed=resolveInitialStep(cart,next);
    await goStep(allowed,{reason:"back-navigation"});return;
  }
  navigateInternal(msg.path);
}

function navigateInternal(rawPath) {
  const path = String(rawPath || "").trim();

  if (!isSafeInternalRoute(path)) {
    throw new Error(
      "Invalid booking navigation destination."
    );
  }

  const allowedPrefixes = [
    SITE_MAP.home,
    APP_ROUTES.bookingFlow,
    APP_ROUTES.myProfile,
    SITE_MAP.travelInfo,
    SITE_MAP.support,
    SITE_MAP.search
  ];

  const allowed = allowedPrefixes.some(
    prefix =>
      path === prefix ||
      path.startsWith(`${prefix}?`) ||
      path.startsWith(`${prefix}/`)
  );

  if (!allowed) {
    throw new Error(
      "Invalid booking navigation destination."
    );
  }

  wixLocation.to(path);
}

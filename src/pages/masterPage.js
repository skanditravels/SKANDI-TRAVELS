// masterPage.js
// SKANDI GLOBAL CHROME CONTROL — Backend Base 1.0 / B-011 canonical route convergence
// Single source of truth for public/internal chrome, routes, assets and safe navigation.

import wixLocationFrontend from "wix-location-frontend";
import wixSiteFrontend from "wix-site-frontend";
import wixWindowFrontend, { consentPolicy } from "wix-window-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { local, memory } from "wix-storage-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/SKANDI_CORE/customerSession.web";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import { getPublicTravelInfoPayload } from "backend/SKANDI_CORE/publicContent.web";
import { getPublicPagePresentation } from "backend/SKANDI_CORE/presentation.web";
import { getEosBootstrap, searchEosFlights, searchEosStations, createEosClockEvent, submitEosOpsAction } from "backend/SKANDI_CORE/eos.web";
import { SITE_MAP, APP_ROUTES, GLOBAL_CHROME, isSafeInternalRoute, PAGE_BUILD_INTEGRATIONS, INTERNAL_PATH_PREFIXES, CHROME_FREE_PATHS, getPageFamily, getPageChrome, resolveBuildRoute } from "public/siteMap";
import { bindAlexandraGlobal } from "public/alexandraGlobalBridge.js";

const MASTER_VERSION = "BACKEND-BASE-1.0-B011.20-BRANCH-MEDIA-CONTROL";
const MASTER_ENV = "PRD";
const SETTINGS_STORAGE_KEY = "skandi_customer_settings_v1";
const RIAINTRA_MANUAL_SESSION_KEY = "skandi_riaintra_manual_session_v1";
const RIAINTRA_EXIT_LOGOUT_PENDING_KEY = "skandi_riaintra_exit_logout_pending_v1";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CUSTOMER_HEADER_SOURCE = GLOBAL_CHROME.customerHeader.source;
const CUSTOMER_FOOTER_SOURCE = GLOBAL_CHROME.customerFooter.source;
const COOKIE_BANNER_SOURCE = GLOBAL_CHROME.cookieBanner?.source || "SKANDI_COOKIE_BANNER";
const COOKIE_PREFERENCES_SOURCE = "SKANDI_COOKIE_PREFERENCES";
const COOKIE_CONSENT_SOURCES = new Set([COOKIE_BANNER_SOURCE, COOKIE_PREFERENCES_SOURCE]);
const RIAINTRA_HEADER_SOURCE = GLOBAL_CHROME.riaintraHeader.source;
const ALTEA_HEADER_SOURCE = GLOBAL_CHROME.alteaHeader.source;
const ALTEA_FOOTER_SOURCE = GLOBAL_CHROME.alteaFooter.source;
const SPECIAL_ASSISTANCE_SOURCE = "SKANDI_ASSISTANCE_PAGE";
const EOS_SOURCE = "SKANDI_EOS_EMBED";
const EOS_EMBED_ID = "#eosEmbed";
const MOBILE_APP_SOURCE = "SKANDI_HOME_MOBILE_APP";
const GLOBAL_MOBILE_NAV_ID = "#skandiMobileAppNavEmbed";
const GLOBAL_MOBILE_TOP_COVER_ID = "#skandiMobileTopCoverEmbed";
const LEGACY_HOME_MOBILE_NAV_ID = "#homeMobileAppEmbed";
const MOBILE_APP_BAR_HEIGHT = 88;
const MOBILE_TOP_COVER_HEIGHT = 52;
const SCROLL_TOP_MESSAGE_TYPES = new Set(["MASTER_SCROLL_TOP", "SKANDI_SCROLL_TOP", "SKANDI_VIEW_OPENED", "SKANDI_PAGE_OPENED"]);
const CONTENT_RESIZE_SOURCES = new Set([
  "SKANDI_INSURANCE_PAGE",
  "SKANDI_PASSPORT_VISA_PAGE",
  "SKANDI_ASSISTANCE_PAGE",
  "SKANDI_BAGGAGE_PAGE",
  "SKANDI_SIGNATURE_COLLECTION",
  COOKIE_PREFERENCES_SOURCE
]);
const CONTENT_RESIZE_MIN = 680;
const CONTENT_RESIZE_MAX = 30000;
const BRAND_ASSET_ROOT = "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/";
const brandLogo = file => `${BRAND_ASSET_ROOT}logos/${file}`;
const CUSTOMER_FOOTER_LOGO = brandLogo("SKANDI_TRAVELS-LIGHT-STACKED-WAVE.svg");
const brandBadge = file => `${BRAND_ASSET_ROOT}icons/${file}`;
const LANGUAGE_ALIASES = Object.freeze({ SE:"SV", DK:"DA" });

const MASTER_CONFIG = Object.freeze({
  brand: Object.freeze({
    groupName: "SKANDI Group",
    travelName: "SKANDI Travels",
    internalName: "RIAINTRA",
    alteaName: "ALTEA",
    slogans: Object.freeze({
      travels:Object.freeze({
        en:"Unforgettable Holidays", sv:"När du längtar bort", no:"Når du lengter bort", da:"Når du længes væk", fi:"Kun kaipaat pois"
      }),
      store:Object.freeze({
        en:"Your Holiday Starts Here", sv:"Semestern börjar här", no:"Ferien starter her", da:"Når du længes væk", fi:"Lomasi alkaa tästä"
      }),
      club:Object.freeze({
        en:"Travel. Earn. Repeat.", sv:"Mer av varje resa", no:"Mer ut av hver reise", da:"Mere ud af hver rejse", fi:"Enemmän irti jokaisesta matkasta"
      }),
      collection:Object.freeze({}),
      voy:Object.freeze({
        en:"More to Discover", sv:"Mer att upptäcka", no:"Mer å oppdage", da:"Mere at opdage", fi:"Aina uutta löydettävää"
      }),
      altea:Object.freeze({ en:"Excellence On Site" }),
      eos:Object.freeze({}),
      riaintra:Object.freeze({ en:"One Team. One Platform" }),
      group:Object.freeze({})
    }),
    languages: Object.freeze(["EN", "SV", "NO", "DA", "FI"]),
    currencies: Object.freeze(["USD", "SEK", "NOK", "DKK", "EUR"]),
    assets: Object.freeze({
      logos: Object.freeze({
        groupMemberLoader:brandLogo("SKANDI_GROUP-MEMBER-LIGHT.svg"),
        groupMemberHeader:brandLogo("SKANDI_GROUP-MEMBER-NAVY.svg"),
        groupFooter:brandLogo("SKANDI_GROUP-WHITE.svg"),
        groupNavy:brandLogo("SKANDI_GROUP-NAVY.svg"),
        groupWhite:brandLogo("SKANDI_GROUP-WHITE.svg"),
        groupMemberWhite:brandLogo("SKANDI_GROUP-MEMBER-LIGHT.svg"),
        groupMemberNavy:brandLogo("SKANDI_GROUP-MEMBER-NAVY.svg"),
        skandiSoloNavy:brandLogo("SKANDI-NAVY.svg"),
        customerHeader:brandLogo("SKANDI_TRAVELS-NAVY-SIDE-WAVE.svg"),
        customerFooter:brandLogo("SKANDI_TRAVELS_LIGHT-WORDMARKK.svg"),
        customerLoader:brandLogo("dark%20background%20logos/SKANDI_TRAVELS-LIGHT-SIDE.svg"),
        skandiNavyStacked:brandLogo("SKANDI_TRAVELS_LIGHT.svg"),
        skandiWhiteStacked:brandLogo("SKANDI_TRAVELS-LIGHT-STACKED-WAVE.svg"),
        skandiNavySide:brandLogo("SKANDI_TRAVELS-NAVY-SIDE-WAVE.svg"),
        skandiWhiteSide:brandLogo("SKANDI_TRAVELS-LIGHT-SIDE-WAVE.svg"),
        skandiNavyNoWave:brandLogo("SKANDI-NAVY.svg"),
        skandiWhiteNoWave:brandLogo("SKANDI_TRAVELS_LIGHT.svg"),
        skandiWave:brandLogo("SKANDI_TRAVELS_WAVE.svg"),
        skandiBadgeRound:brandLogo("SKANDI_TRAVELS-ROUND.svg"),
        storeNavy:brandLogo("THE_STORE_NAVY.svg"),
        storeWhite:brandLogo("THE_STORE_LIGHT.svg"),
        clubWhite:brandLogo("SKANDI_CLUB-LIGHT.svg"),
        clubNavy:brandLogo("SKANDI_CLUB-NAVY-STACKED-SLOGAN.svg"),
        clubWordmark:brandLogo("CLUB-TEXTMARK.svg"),
        collectionWhite:brandLogo("SKANDI_COLLECTION-LIGHT.svg"),
        collectionNavy:brandLogo("SKANDI_COLECTION-NAVY.svg"),
        collectionWaveNavy:brandLogo("SKANDI_COLLECTION-NAV-WAVE.svg"),
        collectionWaveLight:brandLogo("SKANDI_COLLECTION-WHITE.svg"),
        voyBySkNavy:brandLogo("VOY-NAVY-BY_SKANDI.svg"),
        voyBySkWhite:brandLogo("VOY-LIGHT-BY_SKANDI.svg"),
        voyLightBlue:brandLogo("VOY-NAVY.svg"),
        alteaNavy:brandLogo("ALTEA_LOGO-NAVY.svg"),
        alteaLight:brandLogo("ALTEA_LOGO-LIGHT.svg"),
        alteaHeader:brandLogo("ALTEA_LOGO-LIGHT.svg"),
        alteaFooter:brandLogo("ALTEA_LOGO-LIGHT.svg"),
        alteaIconNavy:brandLogo("ALTEAEOS_LOGO-NAVY.svg"),
        alteaIconLight:brandLogo("ALTEAEOS_LOGO-LIGHT.svg"),
        eosNavy:brandLogo("ALTEAEOS_LOGO-NAVY.svg"),
        eosLight:brandLogo("ALTEAEOS_LOGO-LIGHT.svg"),
        eosIconNavy:brandLogo("ALTEAEOS_LOGO-NAVY.svg"),
        eosIconLight:brandLogo("ALTEAEOS_LOGO-LIGHT.svg"),
        riaNavy:brandLogo("RIAINTRA-NAVY.svg"),
        riaLight:brandLogo("RIAINTRA-LIGHT.svg"),
        riaHeader:brandLogo("RIAINTRA-LIGHT.svg"),
        riaFooter:brandLogo("RIAINTRA-LIGHT.svg")
      }),
      images: Object.freeze({
        clubLoginHero: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/skandi_club/SKANDI_MARKETING_CUSTOMER-LIFESTYLE_GREECE_SANTORINI_PREMIUM-TRAVEL_01.png"
      }),
      badges: Object.freeze({
        collectionSelectBadge:brandBadge("SELECT_COLECTION-BADGE.svg"),
        collectionSignatureBadge:brandBadge("SIGNATURE_COLLECTION-BADGE.svg"),
        collectionExcelsiorBadgeGold:brandBadge("EXCELSIOR_COLLECTION-GOLD-BADGE.svg"),
        collectionExcelsiorBadgeCrystal:brandBadge("EXCELSIOR_COLLECTION-CRYSTAL-BADGE.svg")
      }),
      icons: Object.freeze({
        home: "", bookings: "", favorites: "", documents: "", travelers: "",
        wallet: "", support: "", settings: "", notifications: ""
      })
    })
  }),
  routes: Object.freeze({ ...SITE_MAP, ...APP_ROUTES }),
  customer: Object.freeze({
    header: Object.freeze({
      primaryNav: Object.freeze([
        { id:"home", label:"Book", path:SITE_MAP.home },
        { id:"destinations", label:"Destinations", path:SITE_MAP.destinations },
        { id:"packages", label:"Packages", path:SITE_MAP.packages },
        { id:"tours", label:"Tours & Activities", path:SITE_MAP.tours },
        { id:"travelInfo", label:"Travel Info", path:SITE_MAP.travelInfo }
      ]),
      secondaryNav: Object.freeze([
        { id:"signature", label:"SKANDI Collection", path:SITE_MAP.skandiCollection },
        { id:"voy", label:"VOY Magazine", path:SITE_MAP.voy },
        { id:"newsroom", label:"Newsroom", path:SITE_MAP.newsroom }
      ]),
      accountNav: Object.freeze([
        { id:"myTrip", label:"My Trips", path:"/my-profile?tab=trips" },
        { id:"club", label:"SKANDI Club", path:SITE_MAP.club }
      ])
    }),
    footer: Object.freeze({
      columns: Object.freeze([
        Object.freeze({
          title:"BOOK & TRAVEL",
          links:Object.freeze([
            { label:"Book a trip", path:SITE_MAP.home },
            { label:"Manage your booking", path:"/my-profile?tab=trips" },
            { label:"Airport Transfer", path:SITE_MAP.transfers },
            { label:"Our Destinations", path:SITE_MAP.destinations },
            { label:"Hotels", path:SITE_MAP.hotels },
            { label:"Tours & Activities", path:SITE_MAP.tours },
            { label:"Car Rental", path:SITE_MAP.carRental },
            { label:"Last Chance", path:APP_ROUTES.bookingFlow }
          ])
        }),
        Object.freeze({
          title:"HELP & TRAVEL INFO",
          links:Object.freeze([
            { label:"Information Center", path:SITE_MAP.travelInfo },
            { label:"Passport & Visa", path:APP_ROUTES.passportVisa },
            { label:"Baggage Allowance", path:APP_ROUTES.baggageAllowance },
            { label:"Travel Insurance", path:APP_ROUTES.travelInsurance },
            { label:"Special Assistance", path:APP_ROUTES.specialAssistance },
            { label:"Flight Status", path:APP_ROUTES.flightStatus },
            { label:"Help Center", path:SITE_MAP.support }
          ])
        }),
        Object.freeze({
          title:"SKANDI",
          links:Object.freeze([
            { label:"Join SKANDI Club", path:SITE_MAP.club },
            { label:"Log In to My Club", path:"/my-profile" },
            { label:"SKANDI Collection", path:SITE_MAP.skandiCollection },
            { label:"THE STORE", path:SITE_MAP.theStore },
            { label:"VOY Magazine", path:SITE_MAP.voy }
          ])
        }),
        Object.freeze({
          title:"ABOUT SKANDI",
          links:Object.freeze([
            { label:"About SKANDI", path:SITE_MAP.about },
            { label:"Careers", path:"/about/careers" },
            { label:"Newsroom", path:SITE_MAP.newsroom },
            { label:"Our Network", path:SITE_MAP.ourNetwork }
          ])
        })
      ]),
      newsletter:Object.freeze({
        title:"Get SKANDI offers and travel inspiration",
        description:"Receive destination guides, SKANDI Collections updates and member offers.",
        buttonLabel:"Sign up",
        placeholder:"Email address"
      }),
      socialLinks:Object.freeze([
        Object.freeze({ label:"Instagram", url:"https://www.instagram.com/skanditravels", iconAssetKey:"[LEAVE_PLACEHOLDER]" }),
        Object.freeze({ label:"Facebook", url:"https://www.facebook.com/skanditravels", iconAssetKey:"[LEAVE_PLACEHOLDER]" }),
        Object.freeze({ label:"TikTok", url:"https://www.tiktok.com/@skanditravels", iconAssetKey:"[LEAVE_PLACEHOLDER]" }),
        Object.freeze({ label:"Snapchat", url:"https://www.snapchat.com/@skanditravels", iconAssetKey:"[LEAVE_PLACEHOLDER]" }),
        Object.freeze({ label:"LinkedIn", url:"https://www.linkedin.com/en/skanditravels", iconAssetKey:"[LEAVE_PLACEHOLDER]" })
      ]),
      bottomLinks:Object.freeze([
        Object.freeze({ label:"Legal", path:SITE_MAP.legal }),
        Object.freeze({ label:"Policies", path:SITE_MAP.policies }),
        Object.freeze({ label:"Staff Login", path:SITE_MAP.riaintra })
      ]),
      termsText:"Payment methods, supplier terms and package travel conditions may vary by product.",
      staffLogin:Object.freeze({ label:"Staff Login", path:SITE_MAP.riaintra })
    })
  }),
  internal: Object.freeze({
    header:Object.freeze({
      productName:"RIAINTRA",
      productContext:"Enterprise Workforce Suite",
      primaryNav:Object.freeze([
        { id:"my-roster", label:"MyRoster", path:APP_ROUTES.myRoster },
        { id:"alteaLaunchpad", label:"ALTEA", path:SITE_MAP.alteaLaunchpad },
        { id:"mail", label:"Mail", path:SITE_MAP.mail },
        { id:"docunet", label:"DocuNet", path:SITE_MAP.docunet },
        { id:"helpdesk", label:"HelpDesk", path:SITE_MAP.serviceDesk }
      ]),
      managementNav:Object.freeze([
        { id:"magazine-manager", label:"Magazine Manager", path:SITE_MAP.mediaControl || SITE_MAP.magazineManager },
        { id:"payroll", label:"Payroll", path:SITE_MAP.payroll }
      ])
    }),
    footer:Object.freeze({
      links:Object.freeze([
        { label:"RIAINTRA", path:SITE_MAP.riaintra },
        { label:"SKANDI TRAVELS.com", path:SITE_MAP.home },
        { label:"DocuNet", path:SITE_MAP.docunet },
        { label:"HelpDesk", path:SITE_MAP.serviceDesk }
      ])
    })
  }),
  altea:Object.freeze({
    header:Object.freeze({
      productName:"ALTEA",
      productContext:"SKANDI SYSTEMS",
      primaryNav:Object.freeze([
        Object.freeze({ id:"altea-home", label:"ALTEA Apps", path:SITE_MAP.alteaLaunchpad }),
        Object.freeze({ id:"reservations", label:"Reservations", path:SITE_MAP.alteaReservations }),
        Object.freeze({ id:"inventory", label:"Inventory", path:SITE_MAP.inventoryControl }),
        Object.freeze({ id:"my-roster", label:"MyRoster", path:APP_ROUTES.myRoster }),
        Object.freeze({ id:"grouptalk", label:"GroupTalk", path:APP_ROUTES.groupTalk }),
        Object.freeze({ id:"helpdesk", label:"HelpDesk", path:SITE_MAP.serviceDesk })
      ])
    })
  })
});

const IDS = Object.freeze({
  customerHeaders:[...GLOBAL_CHROME.customerHeader.elementIds],
  customerFooters:[...GLOBAL_CHROME.customerFooter.elementIds],
  cookieBanners:[...(GLOBAL_CHROME.cookieBanner?.elementIds || ["#skandiCookieBannerEmbed"])],
  cookiePreferenceEmbeds:["#cookiePreferencesEmbed"],
  internalHeaders:[...GLOBAL_CHROME.riaintraHeader.elementIds],
  internalFooters:["#riaintraFooterEmbed", "#riaintraFooter"],
  alteaHeaders:[...GLOBAL_CHROME.alteaHeader.elementIds],
  alteaFooters:[...GLOBAL_CHROME.alteaFooter.elementIds]
});

const INTERNAL_PREFIXES = INTERNAL_PATH_PREFIXES;

const MOBILE_FOOTER_GATE_PATHS = Object.freeze(new Set([
  "/search",
  "/flights",
  "/car-rental",
  "/hotels",
  "/packages",
  "/tours",
  "/activities",
  "/transfers",
  "/my-profile/support",
  "/riaintra/success-factors",
  "/riaintra/success-factors/legal-internal",
  "/riaintra/success-factors/legal-internal/policies-internal",
  "/riaintra/success-factors/policy-control",
  "/riaintra/success-factors/altea",
  "/riaintra/success-factors/altea/reservations",
  "/riaintra/success-factors/altea/inventory-control",
  "/riaintra/success-factors/altea/timatic",
  "/riaintra/success-factors/mail",
  "/riaintra/success-factors/docunet",
  "/riaintra/success-factors/helpdesk",
  "/riaintra/success-factors/media-control",
  "/riaintra/success-factors/store-control",
  "/riaintra/success-factors/payroll",
  "/riaintra/success-factors/uniform",
  "/riaintra/success-factors/uniform/admin-control",
  "/my-profile",
  APP_ROUTES.myRoster,
  "/travel-info/flight-status"
].map(normalizePath)));
const MOBILE_FOOTER_GATE_POLL_MS = 120;
const MOBILE_FOOTER_GATE_SCROLL_THRESHOLD = 1;

let alteaRuntimeContext = { workArea:"A", crypticActive:false, officeId:"", lmcMode:false };
let customerSettings = readCustomerSettings();
const wiredEmbeds = new WeakSet();
let locationChangeWired = false;
let presentationState = { path:"", value:null, promise:null };
let mobileFooterGateTimer = null;
let mobileFooterGatePath = "";
let mobileFooterGateRevealed = false;
let mobileFooterGateBusy = false;
let mobileDrawerResizeEpoch = 0;
let alexandraGlobal = null;
let manualRiaintraSessionActive = false;
let observedPath = "";
let riaintraLogoutPromise = null;
let riaintraLifecycleWired = false;

// Only a successfully loaded universal receiver opts into compiled chrome.
// Legacy Home and all other existing embeds keep their current behavior.
const compiledEmbeds = new Map();
function compiledIdentity(embed, staff = {}) {
  const match = resolveBuildRoute(currentPathString());
  const binding = match && PAGE_BUILD_INTEGRATIONS[match.key];
  if (!binding || binding.binding === "multi-component") return { allowed:false, reason:"No verified single-component integration for this route." };
  const id = "#" + String(embed.id || "").replace(/^#/, "");
  let correct = binding.embedIds.includes(id);
  if (binding.binding === "handshake") {
    const chromeIds = new Set(Object.values(GLOBAL_CHROME).flatMap(part => part.elementIds || []).concat([GLOBAL_MOBILE_NAV_ID, GLOBAL_MOBILE_TOP_COVER_ID, LEGACY_HOME_MOBILE_NAV_ID]));
    const content = allHtmlComponents().filter(el => !chromeIds.has("#" + el.id));
    correct = content.length === 1 && content[0] === embed;
  }
  if (!correct) return { allowed:false, reason:"Install the receiver in the owning page HTML component; its ID could not be verified." };
  const family = getPageFamily(match.route);
  const requiresStaff = family !== "public" && binding.publicEntry !== true;
  if (requiresStaff && staff.authorized !== true) return { allowed:false, reason:"An authorized staff session is required." };
  return { allowed:true, key:match.key, route:match.route, family, chrome:getPageChrome(match.route), embedId:id, staffAuthorized:staff.authorized === true };
}
function activeCompiledPage() {
  const match = resolveBuildRoute(currentPathString());
  return match && Array.from(compiledEmbeds.values()).find(p => p.key === match.key);
}

const CHROME_BY_SOURCE = Object.freeze(Object.fromEntries(
  Object.values(GLOBAL_CHROME).map(definition => [definition.source, definition])
));

function normalizeCustomerSettings(value = {}) {
  const requestedLanguage = String(value?.language || "").trim().toUpperCase();
  const language = LANGUAGE_ALIASES[requestedLanguage] || requestedLanguage;
  const currency = String(value?.currency || "").trim().toUpperCase();
  return {
    language:MASTER_CONFIG.brand.languages.includes(language) ? language : "EN",
    currency:MASTER_CONFIG.brand.currencies.includes(currency) ? currency : "USD"
  };
}
function readCustomerSettings() {
  try {
    const raw = local.getItem(SETTINGS_STORAGE_KEY);
    return raw ? normalizeCustomerSettings(JSON.parse(raw)) : { language:"EN", currency:"USD" };
  } catch (_) {
    return { language:"EN", currency:"USD" };
  }
}
function persistCustomerSettings(value = {}) {
  customerSettings = normalizeCustomerSettings(value);
  try { local.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(customerSettings)); } catch (_) {}
  return { ...customerSettings };
}

function normalizeConsentPolicy(value = {}, { gpc = false } = {}) {
  return {
    essential:true,
    functional:value?.functional === true,
    analytics:value?.analytics === true,
    advertising:value?.advertising === true,
    dataToThirdParty:gpc ? false : value?.dataToThirdParty === true
  };
}
function normalizeConsentDetails(details = {}) {
  const created = details?.createdDate instanceof Date
    ? details.createdDate.toISOString()
    : (details?.createdDate ? String(details.createdDate) : "");
  return {
    ok:true,
    defaultPolicy:details?.defaultPolicy === true,
    createdDate:created,
    policy:normalizeConsentPolicy(details?.policy || {})
  };
}
function readConsentDetails() {
  try {
    return normalizeConsentDetails(consentPolicy.getCurrentConsentPolicy() || {});
  } catch (error) {
    console.error("[MasterPage] Consent policy read failed.", error);
    return { ok:false, defaultPolicy:true, createdDate:"", policy:normalizeConsentPolicy({}), message:"Privacy preferences are temporarily unavailable." };
  }
}
function pushConsentState(embed) {
  if (embed) postToEmbed(embed, "SKANDI_CONSENT_STATE", readConsentDetails());
}
function pushConsentStateToAll() {
  const state = readConsentDetails();
  for (const embed of allHtmlComponents()) postToEmbed(embed, "SKANDI_CONSENT_STATE", state);
}
async function saveConsentPolicy(embed, value = {}, { gpc = false } = {}) {
  const policy = normalizeConsentPolicy(value, { gpc });
  try {
    const details = await consentPolicy.setConsentPolicy(policy);
    const state = normalizeConsentDetails(details || consentPolicy.getCurrentConsentPolicy() || { policy, defaultPolicy:false });
    postToEmbed(embed, "SKANDI_CONSENT_SAVED", { ...state, ok:true, reloadRequired:true });
    postToEmbed(embed, "SKANDI_CONSENT_STATE", state);
    return state;
  } catch (error) {
    console.error("[MasterPage] Consent policy save failed.", error);
    postToEmbed(embed, "SKANDI_CONSENT_SAVED", { ok:false, message:"We could not save your privacy preferences. Please try again." });
    return null;
  }
}

async function currentPagePresentation({ force = false } = {}) {
  const path = currentPathString();
  if (!force && presentationState.path === path && presentationState.value && Date.now() - (presentationState.loadedAt || 0) < 60000) return presentationState.value;
  if (!force && presentationState.path === path && presentationState.promise) return presentationState.promise;
  const promise = getPublicPagePresentation({ path })
    .then(result => {
      const value = result || { ok:true, path, contentBlocks:[], mediaSlots:[], pagePlans:[] };
      presentationState = { path, value, promise:null, loadedAt:Date.now() };
      return value;
    })
    .catch(error => {
      if (presentationState.path === path) presentationState = { path, value:null, promise:null };
      throw error;
    });
  presentationState = { path, value:null, promise };
  return promise;
}

function safeEl(id) {
  try { return $w(id); } catch (_) { return null; }
}
function isHtmlEmbed(element) {
  return Boolean(element && typeof element.onMessage === "function" && typeof element.postMessage === "function");
}
function firstExisting(ids = []) {
  for (const id of ids) {
    const el = safeEl(id);
    if (el) return el;
  }
  return null;
}
function firstHtml(ids = []) {
  for (const id of ids) {
    const el = safeEl(id);
    if (isHtmlEmbed(el)) return el;
  }
  return null;
}
function globalMobileNavEl() { return firstHtml([GLOBAL_MOBILE_NAV_ID]); }
function globalMobileTopCoverEl() { return firstHtml([GLOBAL_MOBILE_TOP_COVER_ID]); }
function isPublicMobileChromePath(path = currentPathString()) {
  return isMobileDevice() && !isInternalPath(path);
}
function isGlobalMobileNavMessage(embed, message) {
  return isHtmlEmbed(embed) && embed.id === GLOBAL_MOBILE_NAV_ID.slice(1) && message?.source === MOBILE_APP_SOURCE;
}
function postGlobalMobileNav(type, payload = {}, requestId = "") {
  const embed = globalMobileNavEl();
  if (!embed) return false;
  try {
    embed.postMessage({ source:PARENT_SOURCE, type, payload, requestId, timestamp:new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn("[MasterPage] Mobile navigation response failed.", error);
    return false;
  }
}
async function resetGlobalMobileDrawer() {
  ++mobileDrawerResizeEpoch;
  const nav = globalMobileNavEl();
  if (!nav) return;
  try {
    nav.customClassList?.remove("skandi-mobile-nav-open");
    nav.customClassList?.add("skandi-mobile-nav-closed");
  } catch (_) {}
  postGlobalMobileNav("HOME_APP_DRAWER_FORCE_CLOSE", {});
}

async function handleGlobalMobileDrawerResize(embed, message) {
  const requestId = String(message.requestId || "").slice(0, 160);
  const opening = message.payload?.open === true;
  const epoch = ++mobileDrawerResizeEpoch;

  if (isInternalPath()) {
    postGlobalMobileNav("HOME_APP_DRAWER_RESIZE_ERROR", { open: opening, message: "This menu is unavailable on this page." }, requestId);
    return;
  }

  try {
    let height = MOBILE_APP_BAR_HEIGHT;
    if (opening) {
      const dimensions = await wixWindowFrontend.getBoundingRect();
      const viewportHeight = Number(dimensions?.window?.height) || 844;
      height = Math.max(220, Math.floor(viewportHeight) - MOBILE_TOP_COVER_HEIGHT);
    }
    if (epoch !== mobileDrawerResizeEpoch) return;

    // Toggle the global.css height classes instead of embed.height
    if (opening) {
      embed.customClassList?.remove("skandi-mobile-nav-closed");
      embed.customClassList?.add("skandi-mobile-nav-open");
    } else {
      embed.customClassList?.remove("skandi-mobile-nav-open");
      embed.customClassList?.add("skandi-mobile-nav-closed");
    }

    // Send the ACK that the embed is waiting for before sliding the drawer open!
    postGlobalMobileNav("HOME_APP_DRAWER_RESIZE_ACK", { open: opening, height }, requestId);
  } catch (error) {
    console.warn("[MasterPage] Global mobile drawer failed.", error);
    postGlobalMobileNav("HOME_APP_DRAWER_RESIZE_ERROR", { open: opening, message: "The menu could not be displayed. Please try again." }, requestId);
  }
}
function customerHeaderEl() { return firstHtml(IDS.customerHeaders); }
function customerFooterEl() { return firstHtml(IDS.customerFooters); }
function cookieBannerEl() { return firstHtml(IDS.cookieBanners); }
function internalHeaderEl() { return firstHtml(IDS.internalHeaders); }
function internalFooterEl() { return firstHtml(IDS.internalFooters); }
function alteaHeaderEl() { return firstHtml(IDS.alteaHeaders); }
function alteaFooterEl() { return firstHtml(IDS.alteaFooters); }

function allHtmlComponents() {
  try {
    const result = $w("HtmlComponent");
    if (!result) return [];
    if (Array.isArray(result)) return result.filter(isHtmlEmbed);
    if (typeof result[Symbol.iterator] === "function") return Array.from(result).filter(isHtmlEmbed);
    if (typeof result.length === "number") return Array.from(result).filter(isHtmlEmbed);
    return isHtmlEmbed(result) ? [result] : [];
  } catch (error) {
    console.warn("[MasterPage] Could not enumerate HTML Components.", error);
    return [];
  }
}

function currentWixPageInfo() {
  try {
    const page = wixSiteFrontend.currentPage || {};
    return {
      name:String(page.name || "").trim(),
      url:String(page.url || "").trim(),
      type:String(page.type || "").trim(),
      isHomePage:page.isHomePage === true
    };
  } catch (_) {
    return { name:"", url:"", type:"", isHomePage:false };
  }
}
function currentPathString() {
  const page = currentWixPageInfo();
  // Wix reports the static homepage URL as "/home" even though its canonical
  // route in SITE_MAP is "/". Resolve the explicit homepage marker first so
  // compiledIdentity can find the verified Home integration and receiver.
  if (page.isHomePage) return SITE_MAP.home;
  if (page.url && page.url.startsWith("/")) return page.url.split("?")[0].replace(/\/+$/, "") || "/";
  const path = wixLocationFrontend.path || [];
  return "/" + path.join("/");
}
function normalizePath(path = "") {
  return String(path || "").toLowerCase().split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}
function isRiaintraPath(path = currentPathString()) {
  const value = normalizePath(path);
  return value === "/riaintra" || value.startsWith("/riaintra/");
}
function isRiaintraChildPath(path = currentPathString()) {
  return normalizePath(path).startsWith("/riaintra/");
}
async function logoutRiaintraSession() {
  manualRiaintraSessionActive = false;
  try { memory.removeItem(RIAINTRA_MANUAL_SESSION_KEY); } catch (_) {}
  try { local.removeItem(RIAINTRA_EXIT_LOGOUT_PENDING_KEY); } catch (_) {}
  if (riaintraLogoutPromise) return riaintraLogoutPromise;
  riaintraLogoutPromise = (async () => {
    try { await authentication.logout(); }
    catch (error) { console.warn("[MasterPage] RIAINTRA logout could not be confirmed.", error); }
  })();
  try { await riaintraLogoutPromise; }
  finally { riaintraLogoutPromise = null; }
}
function hasManualRiaintraSession() {
  if (manualRiaintraSessionActive) return true;
  try {
    manualRiaintraSessionActive = memory.getItem(RIAINTRA_MANUAL_SESSION_KEY) === "typed";
  } catch (_) { manualRiaintraSessionActive = false; }
  return manualRiaintraSessionActive;
}
async function requireManualRiaintraLogin() {
  await logoutRiaintraSession();
  if (normalizePath(currentPathString()) !== "/riaintra") {
    wixLocationFrontend.to(SITE_MAP.riaintra, { disableScrollToTop:false });
  }
}
function wireRiaintraLifecycle() {
  if (riaintraLifecycleWired) return;
  riaintraLifecycleWired = true;
  try {
    window.addEventListener("pagehide", () => {
      if (!isRiaintraPath()) return;
      manualRiaintraSessionActive = false;
      try { memory.removeItem(RIAINTRA_MANUAL_SESSION_KEY); } catch (_) {}
      try { local.setItem(RIAINTRA_EXIT_LOGOUT_PENDING_KEY, "yes"); } catch (_) {}
      try {
        const pendingLogout = authentication.logout();
        if (pendingLogout && typeof pendingLogout.catch === "function") {
          pendingLogout.catch(error => console.warn("[MasterPage] RIAINTRA close logout could not be confirmed.", error));
        }
      } catch (error) {
        console.warn("[MasterPage] RIAINTRA close logout could not be started.", error);
      }
    });
    window.addEventListener("pageshow", () => {
      if (isRiaintraChildPath() && !hasManualRiaintraSession()) void requireManualRiaintraLogin();
    });
  } catch (error) {
    console.warn("[MasterPage] RIAINTRA page lifecycle logout hooks are unavailable.", error);
  }
}
function isInternalPath(path = currentPathString()) {
  const value = normalizePath(path);
  return INTERNAL_PREFIXES.some(prefix => value === prefix || value.startsWith(prefix + "/"));
}
function isAlteaPath(path = currentPathString()) {
  return getPageFamily(path) === "altea";
}
function isChromeFreePath(path = currentPathString()) {
  return CHROME_FREE_PATHS.includes(normalizePath(path));
}
function isMobileDevice() {
  try { return wixWindowFrontend.formFactor === "Mobile"; } catch (_) { return false; }
}
function isMobileFooterGatePath(path = currentPathString()) {
  const value = normalizePath(path);
  return !activeCompiledPage() && isMobileDevice() && !isChromeFreePath(value) && MOBILE_FOOTER_GATE_PATHS.has(value);
}
function footerElementForPath(path = currentPathString()) {
  const internal = isInternalPath(path);
  if (!internal) return firstExisting(IDS.customerFooters);
  if (isAlteaPath(path)) return firstExisting(IDS.alteaFooters);
  return firstExisting(IDS.internalFooters);
}
function isSafeRoute(path) { return isSafeInternalRoute(path); }

function postToEmbed(embed, type, payload = {}) {
  if (!isHtmlEmbed(embed)) return false;
  try {
    embed.postMessage({ source:PARENT_SOURCE, type, payload, timestamp:new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn(`[MasterPage] postMessage failed for ${embed.id || "unknown embed"}.`, error);
    return false;
  }
}
function pushScrollTopToEmbeds(reason = "") {
  for (const embed of allHtmlComponents()) postToEmbed(embed, "SKANDI_SCROLL_TOP", { reason });
}
function scrollViewportToTop(reason = "") {
  try {
    const result = wixWindowFrontend.scrollTo(0, 0);
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch (_) {}
  pushScrollTopToEmbeds(reason);
}
function scheduleScrollViewportToTop(reason = "") {
  scrollViewportToTop(reason);
  setTimeout(() => scrollViewportToTop(reason), 60);
  setTimeout(() => scrollViewportToTop(reason), 220);
}
function wireLocationChangeScroll() {
  if (locationChangeWired || typeof wixLocationFrontend.onChange !== "function") return;
  locationChangeWired = true;
  try {
    wixLocationFrontend.onChange(async () => {
      const nextPath = currentPathString();
      const previousPath = observedPath || nextPath;
      if (isRiaintraPath(previousPath) && !isRiaintraPath(nextPath)) {
        await logoutRiaintraSession();
        try { await alexandraGlobal?.refreshIdentity?.(); } catch (_) {}
      } else if (isRiaintraChildPath(nextPath) && !hasManualRiaintraSession()) {
        observedPath = nextPath;
        await requireManualRiaintraLogin();
        return;
      }
      observedPath = nextPath;
      alexandraGlobal?.onRouteChange?.(currentPathString());
      await resetGlobalMobileDrawer();
      scheduleScrollViewportToTop("location-change");
      stopMobileFooterGate();
      await applyChromeVisibility();
      startMobileFooterGate();
      pushConfigToAll();
      pushConsentStateToAll();
    });
  } catch (_) {}
}

function resolveBrandBranch(path = currentPathString()) {
  const value = normalizePath(path);
  const under = route => Boolean(route) && (value === route || value.startsWith(route + "/"));
  if (under(SITE_MAP.eos)) return "eos";
  if (under(SITE_MAP.theStore)) return "store";
  if (under(SITE_MAP.club)) return "club";
  if (under(SITE_MAP.skandiCollection)) return "collection";
  if (value === SITE_MAP.voy || value === "/voy") return "voy";
  if (under(SITE_MAP.alteaLaunchpad) || isAlteaPath(value)) return "altea";
  if (under(SITE_MAP.riaintra)) return "riaintra";
  if (under(SITE_MAP.ourNetwork)) return "group";
  return "travels";
}
function masterPayload(extra = {}) {
  const page = currentWixPageInfo();
  const path = currentPathString();
  const altea = isAlteaPath(path);
  const branch = resolveBrandBranch(path);
  return {
    version:MASTER_VERSION,
    env:MASTER_ENV,
    settings:{ ...customerSettings },
    mode:isInternalPath(path) ? "internal" : "customer",
    isInternal:isInternalPath(path),
    isAltea:altea,
    currentPath:path,
    currentPage:page,
    baseUrl:String(wixLocationFrontend.baseUrl || "").trim(),
    brand:{ ...MASTER_CONFIG.brand, currentBranch:branch },
    routes:MASTER_CONFIG.routes,
    customer:MASTER_CONFIG.customer,
    internal:MASTER_CONFIG.internal,
    altea:{
      ...MASTER_CONFIG.altea,
      env:MASTER_ENV,
      ...(altea ? { systemName:page.name || "", pageName:page.name || "", pageUrl:page.url || "" } : {}),
      ...alteaRuntimeContext
    },
    ...extra
  };
}
function pushMasterConfig(embed, extra = {}) { postToEmbed(embed, "SKANDI_MASTER_CONFIG", masterPayload(extra)); }
function pushNavigation(embed) {
  postToEmbed(embed, "SKANDI_MASTER_NAVIGATION", {
    customer:MASTER_CONFIG.customer,
    internal:MASTER_CONFIG.internal,
    altea:MASTER_CONFIG.altea,
    routes:MASTER_CONFIG.routes,
    currentPath:currentPathString()
  });
}
function closeCustomerHeaderPanels() { postToEmbed(customerHeaderEl(), "CLOSE_CUSTOMER_HEADER_PANELS", {}); }
function navigate(path) {
  const value = String(path || "").trim();
  if (!isSafeRoute(value)) {
    console.warn("[MasterPage] Blocked unsafe navigation path:", value);
    return;
  }
  closeCustomerHeaderPanels();
  scheduleScrollViewportToTop("navigation");
  wixLocationFrontend.to(value, { disableScrollToTop:false });
}

async function getCustomerState() {
  try {
    const member = await currentMember.getMember();
    if (!member) return { loggedIn:false, displayName:"", points:0, tierName:"", menu:[] };
    const session = await getCustomerHeaderSession();
    return {
      loggedIn:true,
      displayName:session?.displayName || member?.profile?.nickname || member?.loginEmail || "",
      email:session?.email || member?.loginEmail || "",
      points:Number(session?.points || session?.clubPoints || 0),
      tierName:session?.tierName || session?.tier || "",
      menu:Array.isArray(session?.menu) ? session.menu : []
    };
  } catch (error) {
    console.warn("[MasterPage] Customer session unavailable.", error);
    return { loggedIn:false, displayName:"", points:0, tierName:"", menu:[] };
  }
}
async function pushCustomerHeaderState(embed = customerHeaderEl()) {
  if (embed) postToEmbed(embed, "CUSTOMER_HEADER_STATE", await getCustomerState());
}
async function getStaffState() {
  try {
    const result = await getStaffPortalSession();
    if (!result || result.ok === false || result.authorized === false) return { authorized:false, profile:{} };
    return {
      authorized:true,
      profile:result.profile || {},
      permissions:result.permissions || [],
      apps:result.apps || []
    };
  } catch (error) {
    console.warn("[MasterPage] Staff session unavailable.", error);
    return { authorized:false, profile:{} };
  }
}
async function pushStaffHeaderState(embed = internalHeaderEl()) {
  if (!embed) return;
  const staff = await getStaffState();
  pushMasterConfig(embed, { staff });
  postToEmbed(embed, "RIAINTRA_HEADER_STATE", {
    ...staff,
    navigation:MASTER_CONFIG.internal.header,
    assets:MASTER_CONFIG.brand.assets
  });
}
function pushCustomerSettingsState(embed = customerHeaderEl(), type = "CUSTOMER_SETTINGS_STATE") {
  if (embed) postToEmbed(embed, type, { ...customerSettings });
}

function alteaChromeState(staff = { authorized:false, profile:{} }) {
  const page = currentWixPageInfo();
  const profile = staff?.profile || {};
  const context = String(
    alteaRuntimeContext.systemContext || alteaRuntimeContext.context || page.name || "ALTEA DASHBOARD"
  ).trim();
  return {
    env:MASTER_ENV,
    connected:alteaRuntimeContext.connected !== undefined ? Boolean(alteaRuntimeContext.connected) : Boolean(staff?.authorized),
    context,
    systemName:String(alteaRuntimeContext.systemName || page.name || "ALTEA").trim(),
    pageName:page.name || "",
    pageUrl:page.url || "",
    station:String(alteaRuntimeContext.station || profile.station || profile.stationCode || "").trim().toUpperCase(),
    timeZone:String(alteaRuntimeContext.timeZone || profile.timeZone || "").trim(),
    workArea:String(alteaRuntimeContext.workArea || "A").trim().toUpperCase().slice(0,1) || "A",
    crypticActive:Boolean(alteaRuntimeContext.crypticActive),
    officeId:String(alteaRuntimeContext.officeId || profile.officeId || profile.office_id || "").trim().toUpperCase(),
    lmcMode:Boolean(alteaRuntimeContext.lmcMode),
    systemMessage:alteaRuntimeContext.systemMessage || {
      text:staff?.authorized ? "READY" : "SESSION REQUIRED",
      type:staff?.authorized ? "success" : "error"
    },
    profile
  };
}
async function pushAlteaChromeState() {
  if (!isAlteaPath() || isChromeFreePath()) return;
  const staff = await getStaffState();
  const state = alteaChromeState(staff);
  const header = alteaHeaderEl();
  const footer = alteaFooterEl();
  if (header) {
    pushMasterConfig(header, { staff });
    postToEmbed(header, "ALTEA_HEADER_STATE", state);
    postToEmbed(header, "ALTEA_HEADER_CONTEXT", state);
  }
  if (footer) {
    pushMasterConfig(footer, { staff });
    postToEmbed(footer, "ALTEA_FOOTER_STATE", state);
  }
}

async function handleMasterMessage(embed, message = {}) {
  const type = String(message?.type || "");
  const source = String(message?.source || "");
  const payload = message?.payload && typeof message.payload === "object" ? message.payload : {};

  if (source === EOS_SOURCE) {
    if (wixWindowFrontend.formFactor === "Desktop") { navigate(SITE_MAP.alteaLaunchpad); return true; }
    if ("#" + String(embed.id || "").replace(/^#/, "") !== EOS_EMBED_ID) return true;
    const identity=compiledIdentity(embed,await getStaffState());
    if (!identity.allowed || identity.key !== "eos") return true;
    compiledEmbeds.set(embed.id,identity);
    const requestId=String(message.requestId||payload.requestId||"").slice(0,160);
    const reply=(responseType,result)=>postToEmbed(embed,responseType,{...(result&&typeof result==="object"?result:{}),requestId});
    try {
      if (type === "SKANDI_MASTER_CONFIG_REQUEST" || type === "MASTER_CONFIG_REQUEST") { pushMasterConfig(embed); return true; }
      if (type === "EOS_BOOTSTRAP_REQUEST") { reply("EOS_BOOTSTRAP_RESPONSE",await getEosBootstrap(payload)); return true; }
      if (type === "EOS_FLIGHT_SEARCH") { reply("EOS_FLIGHT_SEARCH_RESULT",await searchEosFlights(payload)); return true; }
      if (type === "EOS_STATION_SEARCH") { reply("EOS_STATION_SEARCH_RESULT",await searchEosStations(payload)); return true; }
      if (type === "EOS_CLOCK_EVENT") { reply("EOS_CLOCK_EVENT_RESULT",await createEosClockEvent(payload)); return true; }
      if (type === "EOS_OPS_ACTION") { reply("EOS_OPS_ACTION_RESULT",await submitEosOpsAction(payload)); return true; }
      if (type === "EOS_NAVIGATE") {
        const path=String(payload.path||"");
        if (path !== SITE_MAP.groupTalk) { reply("EOS_ERROR",{code:"EOS_NAVIGATION_BLOCKED",message:"That ALTEA destination is unavailable."}); return true; }
        navigate(path); return true;
      }
      if (type === "EOS_LOGOUT") {
        await logoutRiaintraSession();
        alexandraGlobal?.clear?.();
        try { await alexandraGlobal?.refreshIdentity?.(); } catch (_) {}
        wixLocationFrontend.to(MASTER_CONFIG.routes.home,{disableScrollToTop:false});
        return true;
      }
    } catch (error) {
      reply("EOS_ERROR",{code:String(error?.code||error?.message||"EOS_FAILED").slice(0,100),message:String(error?.publicMessage||error?.message||"EOS could not complete the request.").slice(0,500)});
      return true;
    }
    return true;
  }

  if (embed?.id === GLOBAL_MOBILE_NAV_ID.slice(1) && source === 'SKANDI_SUPPORT_CHAT') {
    if (!isPublicMobileChromePath()) return true;
    if (typeof alexandraGlobal?.handleMobileMessage === 'function') {
      await alexandraGlobal.handleMobileMessage(message);
    } else {
      postToEmbed(embed, 'SUPPORT_CHAT_ERROR', { message:'Alexandra is not available yet. Please try again.' });
    }
    return true;
  }

  if (isGlobalMobileNavMessage(embed, message)) {
    if (type === "HOME_APP_READY") {
      pushMasterConfig(embed);
      postGlobalMobileNav("HOME_APP_READY_ACK", { route:currentPathString(), mobile:isPublicMobileChromePath() }, String(message.requestId || ""));
      return true;
    }
    if (type === "HOME_APP_DRAWER_RESIZE") {
      await handleGlobalMobileDrawerResize(embed, message);
      return true;
    }
    if (type === "HOME_APP_FOCUS_SEARCH" && normalizePath(currentPathString()) !== "/") {
      navigate(SITE_MAP.home);
      return true;
    }
    // On Home, its existing V12 page controller still owns focus-search and refresh.
    // Other navigation intents retain the canonical MASTER_NAVIGATE contract below.
  }

  if (source === "SKANDI_SHELL" && type === "SKANDI_COMPILED_READY") {
    if (payload.key === "eos" && wixWindowFrontend.formFactor === "Desktop") {
      navigate(SITE_MAP.alteaLaunchpad);
      return true;
    }
    const identity = compiledIdentity(embed, isInternalPath() ? await getStaffState() : {});
    if (identity.allowed && identity.key === payload.key) {
      compiledEmbeds.set(embed.id, identity);
      stopMobileFooterGate();
      await applyChromeVisibility();
      pushMasterConfig(embed);
    }
    return true;
  }
  // Internal global components report their standalone height; never apply
  // those component heights to a complete compiled application iframe.
  if (compiledEmbeds.has(embed.id) && type === "SKANDI_EMBED_RESIZE" && CHROME_BY_SOURCE[source]) return true;

  if (compiledEmbeds.has(embed.id) && source === MOBILE_APP_SOURCE) {
    if (type === "HOME_APP_FOCUS_SEARCH") {
      if (normalizePath(currentPathString()) === "/") postToEmbed(embed,"HOME_FOCUS_SEARCH",{});
      else navigate(SITE_MAP.home);
      return true;
    }
    if (type === "SKANDI_SUPPORT_CHAT" && typeof alexandraGlobal?.handleMobileMessage === "function") {
      await alexandraGlobal.handleMobileMessage({ source:"SKANDI_SUPPORT_CHAT", type:payload.type, payload:payload.payload || {}, requestId:message.requestId });
      return true;
    }
  }

  if (SCROLL_TOP_MESSAGE_TYPES.has(type)) {
    scheduleScrollViewportToTop(type.toLowerCase());
    return true;
  }
  if (type === "MASTER_CONFIG_REQUEST" || type === "SKANDI_MASTER_CONFIG_REQUEST") {
    const extra = isInternalPath() ? { staff:await getStaffState() } : { customerSession:await getCustomerState() };
    if (source === "SKANDI_UNIVERSAL_RECEIVER" && payload.receiverProtocol === 1) {
      extra.receiverRequestId = String(payload.receiverRequestId || "").slice(0,160);
      extra.compiledPage = compiledIdentity(embed, extra.staff);
    }
    pushMasterConfig(embed, extra);
    if ((source === ALTEA_HEADER_SOURCE || source === ALTEA_FOOTER_SOURCE) && isAlteaPath() && !isChromeFreePath()) {
      const state = alteaChromeState(extra.staff || {});
      if (source === ALTEA_HEADER_SOURCE) postToEmbed(embed, "ALTEA_HEADER_CONTEXT", state);
      if (source === ALTEA_FOOTER_SOURCE) postToEmbed(embed, "ALTEA_FOOTER_STATE", state);
    }
    return true;
  }
  if (COOKIE_CONSENT_SOURCES.has(source)) {
    if (type === "SKANDI_CONSENT_REQUEST") {
      pushConsentState(embed);
      return true;
    }
    if (type === "SKANDI_CONSENT_ACCEPT_ALL") {
      await saveConsentPolicy(embed, { essential:true, functional:true, analytics:true, advertising:true, dataToThirdParty:true }, { gpc:payload.gpc === true });
      return true;
    }
    if (type === "SKANDI_CONSENT_REJECT_OPTIONAL") {
      await saveConsentPolicy(embed, { essential:true, functional:false, analytics:false, advertising:false, dataToThirdParty:false }, { gpc:payload.gpc === true });
      return true;
    }
    if (type === "SKANDI_CONSENT_SAVE") {
      await saveConsentPolicy(embed, payload.policy || {}, { gpc:payload.gpc === true });
      return true;
    }
    if (type === "SKANDI_CONSENT_NAVIGATE") {
      navigate(message.path || payload.path || SITE_MAP.cookiePreferences);
      return true;
    }
  }
  if (type === "SKANDI_PRESENTATION_READY") {
    try {
      const result = await currentPagePresentation();
      postToEmbed(embed, "SKANDI_PRESENTATION_DATA", result || { ok:true, contentBlocks:[], mediaSlots:[] });
    } catch (error) {
      console.warn("[MasterPage] Presentation projection unavailable.", error);
    }
    return true;
  }
  if (type === "MASTER_ASSETS_REQUEST") {
    postToEmbed(embed, "SKANDI_MASTER_ASSETS", MASTER_CONFIG.brand.assets);
    return true;
  }
  if (type === "MASTER_NAVIGATION_REQUEST") {
    pushNavigation(embed);
    return true;
  }
  if (type === "MASTER_NAVIGATE") {
    navigate(message.path || payload.path || "");
    return true;
  }

  if (source === SPECIAL_ASSISTANCE_SOURCE) {
    if (type === "SPECIAL_ASSISTANCE_READY" || type === "SPECIAL_ASSISTANCE_REFRESH") {
      const requestedLanguage = String(payload.language || customerSettings.language || "EN").trim().toUpperCase();
      try {
        const result = await getPublicTravelInfoPayload({ language:requestedLanguage });
        postToEmbed(embed, "SPECIAL_ASSISTANCE_DATA", result || { ok:true });
      } catch (error) {
        console.error("[MasterPage] Special Assistance data load failed.", error);
        postToEmbed(embed, "SPECIAL_ASSISTANCE_ERROR", { message:"Special assistance information is temporarily unavailable. Please try again." });
      }
      return true;
    }
    if (type === "SPECIAL_ASSISTANCE_NAVIGATE") {
      navigate(message.path || payload.path || "");
      return true;
    }
  }

  if (type === "ALTEA_SYSTEM_CONTEXT" && isInternalPath()) {
    const next = {
      systemName:String(payload.systemName || "").trim().slice(0,80),
      systemContext:String(payload.systemContext || "").trim().slice(0,120),
      station:String(payload.station || "").trim().toUpperCase().slice(0,12),
      timeZone:String(payload.timeZone || "").trim().slice(0,80),
      context:String(payload.context || "").trim().slice(0,120),
      officeId:String(payload.officeId || "").trim().toUpperCase().slice(0,20),
      workArea:String(payload.workArea || "").trim().toUpperCase().slice(0,1),
      connected:typeof payload.connected === "boolean" ? payload.connected : undefined,
      lmcMode:typeof payload.lmcMode === "boolean" ? payload.lmcMode : undefined,
      systemMessage:payload.systemMessage && typeof payload.systemMessage === "object" ? payload.systemMessage : undefined
    };
    alteaRuntimeContext = {
      ...alteaRuntimeContext,
      ...Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined && value !== ""))
    };
    await pushAlteaChromeState();
    return true;
  }

  if (type === "SKANDI_CONTENT_RESIZE" && CONTENT_RESIZE_SOURCES.has(source)) {
    const requested = Number(payload.height);
    if (!Number.isFinite(requested)) return true;
    const height = Math.max(CONTENT_RESIZE_MIN, Math.min(CONTENT_RESIZE_MAX, Math.round(requested)));
    try { if ("height" in embed) embed.height = height; } catch (_) {}
    return true;
  }
  if (type === "SKANDI_EMBED_RESIZE" && CHROME_BY_SOURCE[source]) {
    const definition = CHROME_BY_SOURCE[source];
    const requested = Number(payload.height);
    const minimum = Math.max(0, Number(definition.collapsedHeight || 0));
    const maximum = Math.max(minimum || 1, Number(definition.maxHeight || 1200));
    const fallback = minimum || 30;
    const height = Number.isFinite(requested) ? Math.max(minimum, Math.min(maximum, Math.round(requested))) : fallback;
    try { if ("height" in embed) embed.height = height; } catch (_) {}
    return true;
  }

  if (source === CUSTOMER_HEADER_SOURCE) {
    switch (type) {
      case "HEADER_READY":
        pushMasterConfig(embed, { customerSession:await getCustomerState() });
        await pushCustomerHeaderState(embed);
        return true;
      case "HEADER_NAVIGATE": navigate(message.path || payload.path); return true;
      case "HEADER_SEARCH": navigate(MASTER_CONFIG.routes.search); return true;
      case "HEADER_LOGIN":
        closeCustomerHeaderPanels();
        try { await authentication.promptLogin(); } catch (_) {}
        await pushCustomerHeaderState(embed);
        return true;
      case "HEADER_LOGIN_SUBMIT":
        try {
          await authentication.login(message.email || payload.email, message.password || payload.password);
          await pushCustomerHeaderState(embed);
        } catch (_) {
          postToEmbed(embed, "HOME_ERROR", { message:"Invalid email or password. Please try again." });
        }
        return true;
      case "HEADER_FORGOT_PASSWORD":
        closeCustomerHeaderPanels();
        try { await authentication.promptForgotPassword(); } catch (_) {}
        return true;
      case "HEADER_LOGOUT":
        closeCustomerHeaderPanels();
        try { await authentication.logout(); } catch (_) {}
        alexandraGlobal?.clear?.();
        scheduleScrollViewportToTop("logout-navigation");
        wixLocationFrontend.to(MASTER_CONFIG.routes.home, { disableScrollToTop:false });
        return true;
      case "CUSTOMER_SETTINGS_REQUEST":
      case "SKANDI_SETTINGS_REQUEST":
        pushCustomerSettingsState(embed);
        return true;
      case "UPDATE_SETTINGS": {
        const state = persistCustomerSettings(payload?.settings || payload || message);
        postToEmbed(embed, "CUSTOMER_SETTINGS_SAVED", { ok:true, state });
        pushCustomerSettingsState(embed);
        pushMasterConfig(embed, { settings:state });
        pushConfigToAll();
        return true;
      }
      default: break;
    }
  }

  if (source === CUSTOMER_FOOTER_SOURCE) {
    switch (type) {
      case "FOOTER_READY":
        pushMasterConfig(embed);
        postToEmbed(embed, "CUSTOMER_FOOTER_STATE", {
          ready:true,
          navigation:MASTER_CONFIG.customer.footer,
          assets:MASTER_CONFIG.brand.assets
        });
        return true;
      case "FOOTER_NAVIGATE": navigate(message.path || payload.path); return true;
      case "FOOTER_STAFF_LOGIN": navigate(MASTER_CONFIG.routes.riaintra); return true;
      case "FOOTER_NEWSLETTER_SIGNUP": {
        const email = String(message.email || payload.email || "").trim();
        if (!email) {
          postToEmbed(embed, "FOOTER_NEWSLETTER_RESULT", { ok:false, code:"EMAIL_REQUIRED", message:"Please enter your email address." });
          return true;
        }
        try {
          const result = await subscribeCustomerNewsletter({ email, source:payload.source || "Footer" });
          postToEmbed(embed, "FOOTER_NEWSLETTER_RESULT", {
            ok:true,
            code:result?.status === "updated" ? "ALREADY_ACTIVE" : "SUBSCRIBED",
            message:result?.status === "updated" ? "Your subscription is already active." : "Thank you for subscribing.",
            ...(result || {})
          });
        } catch (error) {
          postToEmbed(embed, "FOOTER_NEWSLETTER_RESULT", { ok:false, code:"SIGNUP_FAILED", message:error?.message || "Newsletter signup failed." });
        }
        return true;
      }
      default: break;
    }
  }

  if (source === ALTEA_HEADER_SOURCE || source === ALTEA_FOOTER_SOURCE) {
    if (type === "ALTEA_HEADER_READY" || type === "ALTEA_FOOTER_READY") {
      await pushAlteaChromeState();
      return true;
    }
    if (type === "ALTEA_WORK_AREA_CHANGE") {
      const area = String(payload.area || "").trim().toUpperCase();
      if (["A","B","C","D","E","F"].includes(area)) alteaRuntimeContext.workArea = area;
      await pushAlteaChromeState();
      return true;
    }
    if (type === "ALTEA_TOGGLE_CRYPTIC") {
      alteaRuntimeContext.crypticActive = Boolean(payload.active);
      await pushAlteaChromeState();
      return true;
    }
    if (type === "ALTEA_OFFICE_CHANGE") {
      const officeId = String(payload.officeId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,20);
      if (officeId) alteaRuntimeContext.officeId = officeId;
      await pushAlteaChromeState();
      return true;
    }
  }

  if (type === "RIAINTRA_HEADER_READY" || type === "INTERNAL_HEADER_READY") {
    if (!isAlteaPath() && !isChromeFreePath()) await pushStaffHeaderState(embed);
    return true;
  }
  if (type === "RIAINTRA_NAVIGATE" || type === "INTERNAL_MASTER_NAVIGATE") {
    navigate(message.path || payload.path);
    return true;
  }
  if (type === "RIAINTRA_LOGOUT" || type === "INTERNAL_MASTER_LOGOUT") {
    await logoutRiaintraSession();
    alexandraGlobal?.clear?.();
    try { await alexandraGlobal?.refreshIdentity?.(); } catch (_) {}
    scheduleScrollViewportToTop("logout-navigation");
    wixLocationFrontend.to(MASTER_CONFIG.routes.home, { disableScrollToTop:false });
    return true;
  }
  return false;
}

function wireHtmlComponent(embed) {
  if (!isHtmlEmbed(embed) || wiredEmbeds.has(embed)) return;
  wiredEmbeds.add(embed);
  const key = embed.id || "unknown embed";
  embed.onMessage(async event => {
    try { await handleMasterMessage(embed, event?.data || {}); }
    catch (error) { console.error(`[MasterPage] Message handling failed for ${embed.id || key}.`, error); }
  });
  pushMasterConfig(embed);
  if (!isInternalPath()) {
    currentPagePresentation()
      .then(result => postToEmbed(embed, "SKANDI_PRESENTATION_DATA", result || { ok:true, contentBlocks:[], mediaSlots:[] }))
      .catch(() => {});
  }
}
function wireAllHtmlComponents() {
  const found = new Map();
  const idGroups = [
    ...IDS.customerHeaders,
    ...IDS.customerFooters,
    ...IDS.cookieBanners,
    ...IDS.cookiePreferenceEmbeds,
    ...IDS.internalHeaders,
    ...IDS.internalFooters,
    ...IDS.alteaHeaders,
    ...IDS.alteaFooters,
    GLOBAL_MOBILE_NAV_ID,
    GLOBAL_MOBILE_TOP_COVER_ID
  ];
  for (const id of idGroups) {
    const el = safeEl(id);
    if (isHtmlEmbed(el)) found.set(el.id || id, el);
  }
  for (const el of allHtmlComponents()) found.set(el.id || String(el), el);
  for (const el of found.values()) wireHtmlComponent(el);
}
async function setElementVisible(element, visible) {
  if (!element) return;
  try {
    if (visible) {
      if (typeof element.show === "function") await element.show();
      if (typeof element.expand === "function") await element.expand();
    } else {
      if (typeof element.hide === "function") await element.hide();
      if (typeof element.collapse === "function") await element.collapse();
    }
  } catch (_) {}
}
async function setElementDisplayPreserveLayout(element, visible) {
  if (!element) return;
  try {
    if (typeof element.expand === "function") await element.expand();
    if (visible) {
      if (typeof element.show === "function") await element.show();
    } else if (typeof element.hide === "function") {
      await element.hide();
    }
  } catch (_) {}
}
async function syncMobileFooterGate({ force = false } = {}) {
  const path = currentPathString();
  if (!isMobileFooterGatePath(path)) {
    stopMobileFooterGate();
    return;
  }
  if (mobileFooterGateBusy && !force) return;
  mobileFooterGateBusy = true;
  try {
    const info = await wixWindowFrontend.getBoundingRect();
    if (!info) return;
    const scrollY = Math.max(0, Number(info?.scroll?.y || 0));
    const reveal = scrollY > MOBILE_FOOTER_GATE_SCROLL_THRESHOLD;
    if (!force && reveal === mobileFooterGateRevealed && mobileFooterGatePath === normalizePath(path)) return;
    mobileFooterGatePath = normalizePath(path);
    mobileFooterGateRevealed = reveal;
    await setElementDisplayPreserveLayout(footerElementForPath(path), reveal);
  } catch (_) {
    // If the viewport API is temporarily unavailable, keep the footer hidden but expanded.
  } finally {
    mobileFooterGateBusy = false;
  }
}
function stopMobileFooterGate() {
  if (mobileFooterGateTimer) clearInterval(mobileFooterGateTimer);
  mobileFooterGateTimer = null;
  mobileFooterGatePath = "";
  mobileFooterGateRevealed = false;
  mobileFooterGateBusy = false;
}
function startMobileFooterGate() {
  stopMobileFooterGate();
  if (!isMobileFooterGatePath()) return;
  syncMobileFooterGate({ force:true });
  mobileFooterGateTimer = setInterval(() => syncMobileFooterGate(), MOBILE_FOOTER_GATE_POLL_MS);
}

async function applyChromeVisibility() {
  if (activeCompiledPage()) {
    const chromeIds = [...IDS.customerHeaders, ...IDS.customerFooters, ...IDS.internalHeaders, ...IDS.internalFooters, ...IDS.alteaHeaders, ...IDS.alteaFooters, GLOBAL_MOBILE_NAV_ID, GLOBAL_MOBILE_TOP_COVER_ID, LEGACY_HOME_MOBILE_NAV_ID];
    await Promise.all(chromeIds.map(id => setElementVisible(safeEl(id), false)));
    await setElementVisible(cookieBannerEl(), !isInternalPath());
    return;
  }
  const path = currentPathString();
  const chromeFree = isChromeFreePath(path);
  const internal = isInternalPath(path);
  const altea = internal && isAlteaPath(path);
  const showCustomerChrome = !chromeFree && !internal;
  const showRiaintraChrome = !chromeFree && internal && !altea;
  const showAlteaChrome = !chromeFree && internal && altea;

  const mobileGate = isMobileFooterGatePath(path);
  const globalNav = globalMobileNavEl();
  const globalTopCover = globalMobileTopCoverEl();
  const showGlobalMobile = isPublicMobileChromePath(path);
  // The sitewide mobile nav may be hosted by the existing global footer section.
  // Do not hide/collapse its parent on mobile gated routes or chrome-free checkout.
  const keepMobileFooterHost = showGlobalMobile && Boolean(globalNav);
  const legacyHomeNav = globalNav ? firstExisting([LEGACY_HOME_MOBILE_NAV_ID]) : null;
  const customerFooter = firstExisting(IDS.customerFooters);
  const internalFooter = firstExisting(IDS.internalFooters);
  const alteaFooter = firstExisting(IDS.alteaFooters);

  await Promise.all([
    setElementVisible(globalNav, showGlobalMobile),
    setElementVisible(globalTopCover, showGlobalMobile),
    setElementVisible(legacyHomeNav, false),
    setElementVisible(cookieBannerEl(), !internal),
    setElementVisible(firstExisting(IDS.customerHeaders), showCustomerChrome && !showGlobalMobile),
    mobileGate && showCustomerChrome && !keepMobileFooterHost
      ? setElementDisplayPreserveLayout(customerFooter, false)
      : setElementVisible(customerFooter, showCustomerChrome || keepMobileFooterHost),
    setElementVisible(firstExisting(IDS.internalHeaders), showRiaintraChrome),
    mobileGate && showRiaintraChrome
      ? setElementDisplayPreserveLayout(internalFooter, false)
      : setElementVisible(internalFooter, showRiaintraChrome),
    setElementVisible(firstExisting(IDS.alteaHeaders), showAlteaChrome),
    mobileGate && showAlteaChrome
      ? setElementDisplayPreserveLayout(alteaFooter, false)
      : setElementVisible(alteaFooter, showAlteaChrome)
  ]);
}
function pushConfigToAll() {
  for (const embed of allHtmlComponents()) pushMasterConfig(embed);
}
$w.onReady(async function () {
  let closeLogoutPending = false;
  try {
    closeLogoutPending = local.getItem(RIAINTRA_EXIT_LOGOUT_PENDING_KEY) === "yes";
    local.removeItem(RIAINTRA_EXIT_LOGOUT_PENDING_KEY);
  } catch (_) {}
  if (closeLogoutPending) {
    try { await authentication.logout(); }
    catch (error) { console.warn("[MasterPage] Pending RIAINTRA logout could not be confirmed.", error); }
  }
  observedPath = currentPathString();
  wireRiaintraLifecycle();
  manualRiaintraSessionActive = hasManualRiaintraSession();
  if (isRiaintraChildPath(observedPath) && !manualRiaintraSessionActive) {
    await requireManualRiaintraLogin();
    return;
  }
  await applyChromeVisibility();
  startMobileFooterGate();
  scheduleScrollViewportToTop("page-ready");
  wireLocationChangeScroll();
  wireAllHtmlComponents();
  await resetGlobalMobileDrawer();
  alexandraGlobal = bindAlexandraGlobal({
    wixSelector: $w,
    navigate,
    enabled: () => !isInternalPath(currentPathString()),
    mobileEnabled: () => isPublicMobileChromePath(),
    mobileTarget: () => allHtmlComponents().find(el => compiledEmbeds.has(el.id) && compiledEmbeds.get(el.id).key === resolveBuildRoute(currentPathString())?.key) || null
  });
  alexandraGlobal?.onRouteChange?.(currentPathString());

  const path = currentPathString();
  const chromeFree = isChromeFreePath(path);
  const internal = isInternalPath(path);
  const altea = internal && isAlteaPath(path);

  if (!internal) pushConsentState(cookieBannerEl());

  if (!chromeFree && !internal) {
    const header = customerHeaderEl();
    const footer = customerFooterEl();
    if (header) await pushCustomerHeaderState(header);
    if (footer) pushMasterConfig(footer);
  } else if (!chromeFree && altea) {
    if (alteaHeaderEl() || alteaFooterEl()) await pushAlteaChromeState();
  } else if (!chromeFree && internal) {
    const header = internalHeaderEl();
    const footer = internalFooterEl();
    if (header) await pushStaffHeaderState(header);
    if (footer) pushMasterConfig(footer, { staff:await getStaffState() });
  }

  try {
    authentication.onLogin(() => {
      alexandraGlobal?.refreshIdentity?.().catch(error => console.warn("[MasterPage] Alexandra identity refresh failed.", error));
      if (!isChromeFreePath() && !isInternalPath()) {
        const currentHeader = customerHeaderEl();
        if (currentHeader) pushCustomerHeaderState(currentHeader);
      }
    });
  } catch (_) {}

  try {
    consentPolicy.onConsentPolicyChanged(() => pushConsentStateToAll());
  } catch (_) {}

  setTimeout(async () => { wireAllHtmlComponents(); await applyChromeVisibility(); await syncMobileFooterGate({ force:true }); pushConfigToAll(); if (!isInternalPath()) pushConsentStateToAll(); }, 250);
  setTimeout(async () => { wireAllHtmlComponents(); await applyChromeVisibility(); await syncMobileFooterGate({ force:true }); pushConfigToAll(); if (!isInternalPath()) pushConsentStateToAll(); }, 1200);
});

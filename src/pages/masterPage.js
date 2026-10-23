// masterPage.js
// SKANDI GLOBAL CHROME CONTROL — Backend Base 1.0 / B-011 canonical route convergence
// Single source of truth for public/internal chrome, routes, assets and safe navigation.

import wixLocationFrontend from "wix-location-frontend";
import wixSiteFrontend from "wix-site-frontend";
import wixWindowFrontend, { consentPolicy } from "wix-window-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { local } from "wix-storage-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/SKANDI_CORE/customerSession.web";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import { getPublicTravelInfoPayload } from "backend/SKANDI_CORE/publicContent.web";
import { getPublicPagePresentation } from "backend/SKANDI_CORE/presentation.web";
import { SITE_MAP, APP_ROUTES, GLOBAL_CHROME, isSafeInternalRoute } from "public/siteMap";
import { bindAlexandraGlobal } from "public/alexandraGlobalBridge.js";

const MASTER_VERSION = "BACKEND-BASE-1.0-B011.18-GLOBAL-CHROME";
const MASTER_ENV = "PRD";
const SETTINGS_STORAGE_KEY = "skandi_customer_settings_v1";
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

const MASTER_CONFIG = Object.freeze({
  brand: Object.freeze({
    groupName: "SKANDI Group",
    travelName: "SKANDI Travels",
    internalName: "RIAINTRA",
    alteaName: "ALTEA",
    slogans: Object.freeze({
      en: "Unforgettable Moments.",
      sv: "När du längtar bort",
      no: "Når du lengter bort",
      da: "Når du længes væk",
      fi: "Kun kaipaat pois",
      altea: "WE MAKE DOOR TO DOOR STAY IN SYNC"
    }),
    languages: Object.freeze(["EN", "SV", "NO", "DA"]),
    currencies: Object.freeze(["USD", "SEK", "NOK", "DKK", "EUR"]),
    assets: Object.freeze({
      logos: Object.freeze({
        customerHeader: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-SIDE-WAVE.svg",
        customerFooter: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-LIGHT-STACKED-WAVE.svg",
        storeHeader: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-SIDE-WAVE.svg",
        storeFooter: "https://static.wixstatic.com/media/394052_cd31153a91694b14a27c5f756f8089bd~mv2.png",
        skandiPrimary: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWhite: "https://static.wixstatic.com/media/394052_01730d7e719548178e24009021b261ae~mv2.png",
        skandiTravels: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWave: "https://static.wixstatic.com/media/394052_26dde0904052424faf8f2390ecc4cfd6~mv2.png",
        skandiGroup: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-NAVY.svg",
        skandiGroupWhite: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_GROUP-MEMBER-LIGHT.svg",
        riaintra: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/RIAINTRA-LIGHT.svg",
        altea: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/ALTEA_LOGO-LIGHT.svg",
        alteaWhite: "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",
        alteaIconWhite: "https://static.wixstatic.com/media/394052_e551cf4d47a749248311125bce5846d7~mv2.png",
        voy: "https://static.wixstatic.com/media/394052_30b8bebbf5ee493da7d47329d04de494~mv2.png",
        voyWhite: "https://static.wixstatic.com/media/394052_3770b6753c474d73a77c674b20eab305~mv2.png",
        skandiClub: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_CLUB-LIGHT.svg",
        signatureCollection: "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/SIGNATURE_COLLECTION-BADGE.svg"
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
            { label:"Last Chance", path:SITE_MAP.offers }
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
        Object.freeze({ label:"Instagram", url:"https://www.instagram.com/skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_3140fd0b593e44bd993a64412b94011e~mv2.png" }),
        Object.freeze({ label:"Facebook", url:"https://www.facebook.com/skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_80ea7848b9a142ef9f5c3c0beb8a3230~mv2.png" }),
        Object.freeze({ label:"TikTok", url:"https://www.tiktok.com/@skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_74976eb394d14952af79f14988bb17b3~mv2.png" }),
        Object.freeze({ label:"Snapchat", url:"https://www.snapchat.com/@skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_1c961ca84c314ebc966444cb5449c618~mv2.png" }),
        Object.freeze({ label:"LinkedIn", url:"https://www.linkedin.com/en/skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_a7bf9a6382bc4b8785c1e4ebae385cda~mv2.png" })
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
        { id:"success-factors", label:"SAP RIAINTRA Dashboard", path:SITE_MAP.successFactors },
        { id:"my-roster", label:"MyRoster", path:"/riaintra/success-factors/my-roster" },
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
        Object.freeze({ id:"altea-home", label:"Home", path:SITE_MAP.alteaLaunchpad }),
        Object.freeze({ id:"reservations", label:"Reservations", path:SITE_MAP.alteaReservations }),
        Object.freeze({ id:"inventory", label:"Inventory", path:SITE_MAP.inventoryControl }),
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

const INTERNAL_PREFIXES = ["/riaintra", "/altea", "/_functions"];
const CHROME_FREE_PATHS = Object.freeze([
  "/riaintra/success-factors/altea/grouptalk",
  "/riaintra",
  "/booking",
  "/the-store/store-checkout/order-confirmation",
  "/the-store/store-checkout",
  "/the-store"
]);

const MOBILE_FOOTER_GATE_PATHS = Object.freeze(new Set([
  "/search",
  "/flights",
  "/car-rental",
  "/hotels",
  "/packages",
  "/tours",
  "/activities",
  "/transfers",
  "/offers",
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
  "/riaintra/success-factors/my-roster",
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

const CHROME_BY_SOURCE = Object.freeze(Object.fromEntries(
  Object.values(GLOBAL_CHROME).map(definition => [definition.source, definition])
));

function normalizeCustomerSettings(value = {}) {
  const language = String(value?.language || "").trim().toUpperCase();
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
  if (!force && presentationState.path === path && presentationState.value) return presentationState.value;
  if (!force && presentationState.path === path && presentationState.promise) return presentationState.promise;
  const promise = getPublicPagePresentation({ path })
    .then(result => {
      const value = result || { ok:true, path, contentBlocks:[], mediaSlots:[], pagePlans:[] };
      presentationState = { path, value, promise:null };
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
  if (page.url && page.url.startsWith("/")) return page.url.split("?")[0].replace(/\/+$/, "") || "/";
  const path = wixLocationFrontend.path || [];
  return "/" + path.join("/");
}
function normalizePath(path = "") {
  return String(path || "").toLowerCase().split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}
function isInternalPath(path = currentPathString()) {
  const value = normalizePath(path);
  return INTERNAL_PREFIXES.some(prefix => value === prefix || value.startsWith(prefix + "/"));
}
function isAlteaPath(path = currentPathString()) {
  const value = normalizePath(path);
  return ["/riaintra/success-factors/altea", "/riaintra/altea", "/altea"]
    .some(prefix => value === prefix || value.startsWith(prefix + "/"));
}
function isChromeFreePath(path = currentPathString()) {
  return CHROME_FREE_PATHS.includes(normalizePath(path));
}
function isMobileDevice() {
  try { return wixWindowFrontend.formFactor === "Mobile"; } catch (_) { return false; }
}
function isMobileFooterGatePath(path = currentPathString()) {
  const value = normalizePath(path);
  return isMobileDevice() && !isChromeFreePath(value) && MOBILE_FOOTER_GATE_PATHS.has(value);
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

function masterPayload(extra = {}) {
  const page = currentWixPageInfo();
  const path = currentPathString();
  const altea = isAlteaPath(path);
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
    brand:MASTER_CONFIG.brand,
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

  if (SCROLL_TOP_MESSAGE_TYPES.has(type)) {
    scheduleScrollViewportToTop(type.toLowerCase());
    return true;
  }
  if (type === "MASTER_CONFIG_REQUEST" || type === "SKANDI_MASTER_CONFIG_REQUEST") {
    const extra = isInternalPath() ? { staff:await getStaffState() } : { customerSession:await getCustomerState() };
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
    try { await authentication.logout(); } catch (_) {}
    alexandraGlobal?.clear?.();
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
    mobileEnabled: () => isPublicMobileChromePath()
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

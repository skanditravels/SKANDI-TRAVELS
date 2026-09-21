// masterPage.js
// SKANDI GLOBAL CHROME CONTROL — Backend Base 1.0 / B-011 canonical route convergence
// Single source of truth for public/internal chrome, routes, assets and safe navigation.


import wixLocationFrontend from "wix-location-frontend";
import wixSiteFrontend from "wix-site-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { local } from "wix-storage-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/SKANDI_CORE/customerSession.web";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import { SITE_MAP, APP_ROUTES, GLOBAL_CHROME, isSafeInternalRoute } from "public/siteMap";




const MASTER_VERSION = "BACKEND-BASE-1.0-B011.18-GLOBAL-CHROME";
const MASTER_ENV = "PRD";
const SETTINGS_STORAGE_KEY = "skandi_customer_settings_v1";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CUSTOMER_HEADER_SOURCE = GLOBAL_CHROME.customerHeader.source;
const CUSTOMER_FOOTER_SOURCE = GLOBAL_CHROME.customerFooter.source;
const RIAINTRA_HEADER_SOURCE = GLOBAL_CHROME.riaintraHeader.source;
const ALTEA_HEADER_SOURCE = GLOBAL_CHROME.alteaHeader.source;
const ALTEA_FOOTER_SOURCE = GLOBAL_CHROME.alteaFooter.source;


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
        customerHeader: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        customerFooter: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiPrimary: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWhite: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiTravels: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWave: "",
        skandiGroup: "https://static.wixstatic.com/media/394052_02ed0c030fea4f14b5e5677fdaeae197~mv2.png",
        riaintra: "https://static.wixstatic.com/media/394052_1024542c47664bff8f4e145d1adf472d~mv2.png",
        altea: "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",
        voy: "https://static.wixstatic.com/media/394052_30b8bebbf5ee493da7d47329d04de494~mv2.png",
        voyWhite: "https://static.wixstatic.com/media/394052_3770b6753c474d73a77c674b20eab305~mv2.png",
        skandiClub: "",
        signatureCollection: "https://static.wixstatic.com/media/394052_8e09fa73724c443aa305ebedb11d094d~mv2.png"
      }),
      icons: Object.freeze({
        home: "", bookings: "", favorites: "", documents: "", travelers: "",
        wallet: "", support: "", settings: "", notifications: ""
      })
    })
  }),


  routes: Object.freeze({
    ...SITE_MAP,
    ...APP_ROUTES
  }),


  customer: Object.freeze({
    header: Object.freeze({
      primaryNav: Object.freeze([
        { id:"flights", label:"Flights", path:SITE_MAP.flights },
        { id:"hotels", label:"Hotels", path:SITE_MAP.hotels },
        { id:"packages", label:"Packages", path:SITE_MAP.packages },
        { id:"tours", label:"Tours & Activities", path:SITE_MAP.tours },
        { id:"transfers", label:"Transfers", path:SITE_MAP.transfers },
        { id:"travelInfo", label:"Travel Info", path:SITE_MAP.travelInfo }
      ]),
      secondaryNav: Object.freeze([
        { id:"destinations", label:"Destinations", path:SITE_MAP.destinations },
        { id:"signature", label:"SKANDI Collection", path:SITE_MAP.skandiCollection },
        { id:"voy", label:"VOY Magazine", path:SITE_MAP.voy },
        { id:"newsroom", label:"Newsroom", path:SITE_MAP.newsroom }
      ]),
      accountNav: Object.freeze([
        { id:"myTrip", label:"My Trips", path:SITE_MAP.myProfile },
        { id:"club", label:"SKANDI Club", path:SITE_MAP.club }
      ])
    }),
    footer: Object.freeze({
      columns: Object.freeze([
        {
          title:"BOOK & TRAVEL",
          links:Object.freeze([
            { label:"Book a trip", path:SITE_MAP.home },
            { label:"Manage your booking", path:SITE_MAP.myProfile },
            { label:"Our Destinations", path:SITE_MAP.destinations },
            { label:"Flights", path:SITE_MAP.flights },
            { label:"Hotels", path:SITE_MAP.hotels },
            { label:"Tours & Activities", path:SITE_MAP.tours },
            { label:"Car Rental", path:SITE_MAP.carRental },
            { label:"Airport Transfer", path:SITE_MAP.transfers },
            { label:"Last Chance", path:SITE_MAP.offers }
          ])
        },
        {
          title:"HELP & TRAVEL INFO",
          links:Object.freeze([
            { label:"Before you travel", path:SITE_MAP.travelInfo },
            { label:"Passport & Visa", path:APP_ROUTES.passportVisa },
            { label:"Baggage Allowence", path:APP_ROUTES.baggageAllowance },
            { label:"Travel Insurance", path:APP_ROUTES.travelInsurance },
            { label:"Special Assistance", path:APP_ROUTES.specialAssistance },
            { label:"Flight Status", path:APP_ROUTES.flightStatus },
            { label:"Help Center", path:SITE_MAP.support }
          ])
        },
        {
          title:"SKANDI",
          links:Object.freeze([
            { label:"Join SKANDI Club", path:SITE_MAP.club },
            { label:"Log In to My Club", path:SITE_MAP.myProfile },
            { label:"SKANDI Collection", path:SITE_MAP.skandiCollection },
            { label:"THE STORE", path:SITE_MAP.theStore },
            { label:"VOY Magazine", path:SITE_MAP.voy }
          ])
        },
        {
          title:"ABOUT SKANDI",
          links:Object.freeze([
            { label:"About SKANDI", path:SITE_MAP.about },
            { label:"Careers", path:SITE_MAP.careers },
            { label:"Newsroom", path:SITE_MAP.newsroom },
            { label:"Our Network", path:SITE_MAP.ourNetwork }
          ])
        }
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
        Object.freeze({ label:"YouTube", url:"https://www.youtube.com/skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_6e9d971d747649afa5bd544e00870cbf~mv2.png" }),
        Object.freeze({ label:"Snapchat", url:"https://www.snapchat.com/@skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_1c961ca84c314ebc966444cb5449c618~mv2.png" }),
        Object.freeze({ label:"LinkedIn", url:"https://www.linkedin.com/en/skanditravels", iconUrl:"https://static.wixstatic.com/media/394052_a7bf9a6382bc4b8785c1e4ebae385cda~mv2.png" })
      ]),
      bottomLinks:Object.freeze([
        Object.freeze({ label:"Legal", path:SITE_MAP.legal }),
        Object.freeze({ label:"Policies", path:SITE_MAP.policies }),
        Object.freeze({ label:"Staff Login", path:SITE_MAP.riaintra })
      ]),
      termsText:"Payment methods, supplier terms and package travel conditions may vary by product.   © SKANDI GROUP Inc. & SKANDI GROUP AB. All rights reserved. SKANDI TRAVELS™ is a trademark of the SKANDI GROUP. ",
      staffLogin: Object.freeze({ label:"Staff Login", path:SITE_MAP.riaintra })
    })
  }),


  internal: Object.freeze({
    header: Object.freeze({
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
        { id:"magazine-manager", label:"Media Manager", path:SITE_MAP.magazineManager },
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
        Object.freeze({ id:"altea-home", label:"Start", path:SITE_MAP.alteaLaunchpad }),
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
  internalHeaders:[...GLOBAL_CHROME.riaintraHeader.elementIds],
  internalFooters:["#riaintraFooterEmbed", "#riaintraFooter"],
  alteaHeaders:[...GLOBAL_CHROME.alteaHeader.elementIds],
  alteaFooters:[...GLOBAL_CHROME.alteaFooter.elementIds]
});


const INTERNAL_PREFIXES = ["/riaintra", "/altea", "/_functions"];
const GROUPTALK_CHROME_FREE_PATHS = Object.freeze([
  "/riaintra/success-factors/altea/grouptalk"
]);


let alteaRuntimeContext = { workArea:"A", crypticActive:false, officeId:"", lmcMode:false };
let customerSettings = readCustomerSettings();
const wiredEmbeds = new Set();

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
    if (!raw) return { language:"EN", currency:"USD" };
    return normalizeCustomerSettings(JSON.parse(raw));
  } catch (_) {
    return { language:"EN", currency:"USD" };
  }
}
function persistCustomerSettings(value = {}) {
  customerSettings = normalizeCustomerSettings(value);
  try { local.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(customerSettings)); } catch (_) {}
  return { ...customerSettings };
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
function customerHeaderEl() { return firstHtml(IDS.customerHeaders); }
function customerFooterEl() { return firstHtml(IDS.customerFooters); }
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
function isInternalPath(path = currentPathString()) {
  return INTERNAL_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + "/"));
}
function isAlteaPath(path = currentPathString()) {
  const value = String(path || "").toLowerCase();
  return ["/riaintra/success-factors/altea", "/riaintra/altea", "/altea"]
    .some(prefix => value === prefix || value.startsWith(prefix + "/"));
}
function isChromeFreeInternalPath(path = currentPathString()) {
  const value = String(path || "").toLowerCase().split("?")[0].replace(/\/+$/, "") || "/";
  return GROUPTALK_CHROME_FREE_PATHS.some(p => value === p || value.startsWith(p + "/"));
}
function isSafeRoute(path) {
  return isSafeInternalRoute(path);
}


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
function pushMasterConfig(embed, extra = {}) {
  postToEmbed(embed, "SKANDI_MASTER_CONFIG", masterPayload(extra));
}
function pushNavigation(embed) {
  postToEmbed(embed, "SKANDI_MASTER_NAVIGATION", {
    customer:MASTER_CONFIG.customer,
    internal:MASTER_CONFIG.internal,
    altea:MASTER_CONFIG.altea,
    routes:MASTER_CONFIG.routes,
    currentPath:currentPathString()
  });
}
function closeCustomerHeaderPanels() {
  postToEmbed(customerHeaderEl(), "CLOSE_CUSTOMER_HEADER_PANELS", {});
}
function navigate(path) {
  const value = String(path || "").trim();
  if (!isSafeRoute(value)) {
    console.warn("[MasterPage] Blocked unsafe navigation path:", value);
    return;
  }
  closeCustomerHeaderPanels();
  wixLocationFrontend.to(value);
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
  if (!embed) return;
  postToEmbed(embed, "CUSTOMER_HEADER_STATE", await getCustomerState());
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
  if (!embed) return;
  postToEmbed(embed, type, { ...customerSettings });
}

function alteaChromeState(staff = { authorized:false, profile:{} }) {
  const page = currentWixPageInfo();
  const profile = staff?.profile || {};
  const fallbackBase = String(profile.base || profile.baseCode || "ARN").trim().toUpperCase().slice(0,3) || "ARN";
  const context = String(
    alteaRuntimeContext.systemContext ||
    alteaRuntimeContext.context ||
    page.name ||
    "ALTEA DASHBOARD"
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
    officeId:String(alteaRuntimeContext.officeId || profile.officeId || `${fallbackBase}1A0900`).trim().toUpperCase(),
    lmcMode:Boolean(alteaRuntimeContext.lmcMode),
    systemMessage:alteaRuntimeContext.systemMessage || {
      text:staff?.authorized ? "READY" : "SESSION REQUIRED",
      type:staff?.authorized ? "success" : "error"
    },
    profile
  };
}

async function pushAlteaChromeState() {
  if (!isAlteaPath()) return;
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


  if (type === "MASTER_CONFIG_REQUEST" || type === "SKANDI_MASTER_CONFIG_REQUEST") {
    const extra = isInternalPath()
      ? { staff:await getStaffState() }
      : { customerSession:await getCustomerState() };
    pushMasterConfig(embed, extra);


    if ((source === ALTEA_HEADER_SOURCE || source === ALTEA_FOOTER_SOURCE) && isAlteaPath()) {
      const state = alteaChromeState(extra.staff || {});
      if (source === ALTEA_HEADER_SOURCE) postToEmbed(embed, "ALTEA_HEADER_CONTEXT", state);
      if (source === ALTEA_FOOTER_SOURCE) postToEmbed(embed, "ALTEA_FOOTER_STATE", state);
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
      ...Object.fromEntries(Object.entries(next).filter(([, value]) => Boolean(value)))
    };
    await pushAlteaChromeState();
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
      case "HEADER_NAVIGATE":
        navigate(message.path || payload.path);
        return true;
      case "HEADER_SEARCH":
        navigate(MASTER_CONFIG.routes.search);
        return true;
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
        wixLocationFrontend.to(MASTER_CONFIG.routes.home);
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
        return true;
      }
      default:
        break;
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
      case "FOOTER_NAVIGATE":
        navigate(message.path || payload.path);
        return true;
      case "FOOTER_STAFF_LOGIN":
        navigate(MASTER_CONFIG.routes.riaintra);
        return true;
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
      default:
        break;
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
    await pushStaffHeaderState(embed);
    return true;
  }
  if (type === "RIAINTRA_NAVIGATE" || type === "INTERNAL_MASTER_NAVIGATE") {
    navigate(message.path || payload.path);
    return true;
  }
  if (type === "RIAINTRA_LOGOUT" || type === "INTERNAL_MASTER_LOGOUT") {
    try { await authentication.logout(); } catch (_) {}
    wixLocationFrontend.to(MASTER_CONFIG.routes.home);
    return true;
  }


  return false;
}


function wireHtmlComponent(embed) {
  if (!isHtmlEmbed(embed)) return;
  const key = embed.id || String(embed);
  if (wiredEmbeds.has(key)) return;
  wiredEmbeds.add(key);
  embed.onMessage(async event => {
    try { await handleMasterMessage(embed, event?.data || {}); }
    catch (error) { console.error(`[MasterPage] Message handling failed for ${embed.id || key}.`, error); }
  });
  // Initial push is useful for components that are already loaded; components also request it when ready.
  pushMasterConfig(embed);
}


function wireAllHtmlComponents() {
  const found = new Map();
  const idGroups = [
    ...IDS.customerHeaders,
    ...IDS.customerFooters,
    ...IDS.internalHeaders,
    ...IDS.internalFooters,
    ...IDS.alteaHeaders,
    ...IDS.alteaFooters
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


async function applyChromeVisibility() {
  const path = currentPathString();
  const internal = isInternalPath(path);
  const altea = isAlteaPath(path);
  const chromeFree = isChromeFreeInternalPath(path);


  await Promise.all([
    setElementVisible(firstExisting(IDS.customerHeaders), !internal),
    setElementVisible(firstExisting(IDS.customerFooters), !internal),
    setElementVisible(firstExisting(IDS.internalHeaders), internal && !chromeFree),
    setElementVisible(firstExisting(IDS.internalFooters), internal && !chromeFree),
    setElementVisible(firstExisting(IDS.alteaHeaders), internal && altea && !chromeFree),
    setElementVisible(firstExisting(IDS.alteaFooters), internal && altea && !chromeFree)
  ]);
}


function pushConfigToAll() {
  for (const embed of allHtmlComponents()) pushMasterConfig(embed);
}


$w.onReady(async function () {
  wireAllHtmlComponents();
  await applyChromeVisibility();


  const header = customerHeaderEl();
  const footer = customerFooterEl();
  const internalHeader = internalHeaderEl();
  const alteaHeader = alteaHeaderEl();
  const alteaFooter = alteaFooterEl();


  if (!isInternalPath()) {
    if (header) await pushCustomerHeaderState(header);
    if (footer) pushMasterConfig(footer);
  } else {
    if (internalHeader) await pushStaffHeaderState(internalHeader);
    if (isAlteaPath() && (alteaHeader || alteaFooter)) {
      await pushAlteaChromeState();
    }
  }


  try {
    authentication.onLogin(() => {
      const currentHeader = customerHeaderEl();
      if (currentHeader) pushCustomerHeaderState(currentHeader);
    });
  } catch (_) {}


  // Re-enumerate after Wix has mounted page-level HTML Components.
  setTimeout(() => { wireAllHtmlComponents(); pushConfigToAll(); }, 250);
  setTimeout(() => { wireAllHtmlComponents(); pushConfigToAll(); }, 1200);
});

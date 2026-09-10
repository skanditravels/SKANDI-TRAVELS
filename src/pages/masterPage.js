// masterPage.js
// SKANDI GLOBAL CHROME CONTROL — V9 FINAL
// Single source of truth for public/internal chrome, routes, assets and safe navigation.


import wixLocationFrontend from "wix-location-frontend";
import wixSiteFrontend from "wix-site-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";


const MASTER_VERSION = "2026.09.10.12.1";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CUSTOMER_HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const CUSTOMER_FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const ALTEA_HEADER_SOURCE = "SKANDI_ALTEA_HEADER";


const MASTER_CONFIG = Object.freeze({
  brand: Object.freeze({
    groupName: "SKANDI Group",
    travelName: "SKANDI Travels",
    internalName: "RIAINTRA",
    alteaName: "ALTEA",
    slogans: Object.freeze({
      en: "Signature Travels, Unforgettable Moments.",
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
        skandiWhite: "https://static.wixstatic.com/media/394052_fafffe6d26434eddbf62eb645ee9c844~mv2.png",
        skandiTravels: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWave: "https://static.wixstatic.com/media/394052_0c1aaf1dba2c4548ad53ccd8509d338c~mv2.png",
        skandiGroup: "https://static.wixstatic.com/media/394052_02ed0c030fea4f14b5e5677fdaeae197~mv2.png",
        riaintra: "https://static.wixstatic.com/media/394052_1024542c47664bff8f4e145d1adf472d~mv2.png",
        altea: "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",
        voy: "https://static.wixstatic.com/media/394052_30b8bebbf5ee493da7d47329d04de494~mv2.png",
        voyWhite: "https://static.wixstatic.com/media/394052_3770b6753c474d73a77c674b20eab305~mv2.png",
        skandiClub: "https://static.wixstatic.com/media/394052_191b0c7832294e6db41f8d81f678f03b~mv2.png",
        signatureCollection: "https://static.wixstatic.com/media/394052_8e09fa73724c443aa305ebedb11d094d~mv2.png"
      }),
      icons: Object.freeze({
        home: "https://static.wixstatic.com/media/394052_d44e97e6ec66459bb69b19f8a9cfbc82~mv2.png", bookings: "https://static.wixstatic.com/media/394052_c10010c35d594e1590400524a04c8fb2~mv2.png", favorites: "https://static.wixstatic.com/media/394052_4084f82a4f9342beb83237d648504c46~mv2.png", documents: "https://static.wixstatic.com/media/394052_f941a08c326143728a0e05e566546296~mv2.png", travelers: "https://static.wixstatic.com/media/394052_10152e32f8cb4af3bfb06eb5e7ea1c36~mv2.png",
        wallet: "https://static.wixstatic.com/media/394052_ed65c346875642aca102f881a8e0f045~mv2.png", support: "https://static.wixstatic.com/media/394052_70b6b37f2c62423ebd7949f1cb7bc053~mv2.png", settings: "https://static.wixstatic.com/media/394052_856c7430a7b640ee8f062ab0d23b1dc4~mv2.png", notifications: ""
      })
    })
  }),


  routes: Object.freeze({
    home: "/",
    search: "/search",
    flights: "/flights",
    carRental: "/car-rental",
    hotels: "/hotels",
    packages: "/packages",
    tours: "/tours",
    activities: "/activities",
    transfers: "/transfers",
    destinations: "/destinations",
    offers: "/offers",
    travelInfo: "/travel-info",
    skandiCollection: "/skandi-collection",
    voy: "/voy-magazine",
    myTrip: "/my-profile?tab=trips",
    club: "/skandi-club",
    about: "/about",
    support: "/about/support",
    newsroom: "/about/news-room",
    theStore: "/the-store",
    storeCheckout: "/the-store/store-checkout",
    storeConfirmation: "/the-store/store-checkout/order-confirmation",
    ourNetwork: "/about/our-network",
    legal: "/about/legal",
    policies: "/about/legal/policies",
    riaintra: "/riaintra",
    staffLogin: "/riaintra",
    successFactors: "/riaintra/success-factors",
    alteaLaunchpad: "/riaintra/success-factors/altea",
    alteaReservations: "/riaintra/success-factors/altea/reservations",
    alteaTicketing: "/riaintra/success-factors/altea/ticketing",
    alteaTimatic: "/riaintra/success-factors/altea/timatic",
    mail: "/riaintra/success-factors/mail",
    docunet: "/riaintra/success-factors/docunet",
    serviceDesk: "/riaintra/success-factors/helpdesk",
    magazineManager: "/riaintra/success-factors/media-control",
    inventoryControl: "/riaintra/success-factors/altea/inventory-control"
  }),


  customer: Object.freeze({
    header: Object.freeze({
      primaryNav: Object.freeze([
        { id:"flights", label:"Flights", path:"/flights" },
        { id:"hotels", label:"Hotels", path:"/hotels" },
        { id:"packages", label:"Packages", path:"/packages" },
        { id:"tours", label:"Tours & Activities", path:"/tours" },
        { id:"transfers", label:"Transfers", path:"/transfers" }
      ]),
      secondaryNav: Object.freeze([
        { id:"destinations", label:"Our Destinations", path:"/destinations" },
        { id:"signature", label:"SKANDI Collection", path:"/skandi-collection" },
        { id:"voy", label:"VOY Magazine", path:"/voy-magazine" },
        { id:"newsroom", label:"Newsroom", path:"/about/news-room" }
      ]),
      accountNav: Object.freeze([
        { id:"myTrip", label:"My Trips", path:"/my-profile?tab=trips" },
        { id:"club", label:"SKANDI Club", path:"/skandi-club" }
      ])
    }),
    footer: Object.freeze({
      columns: Object.freeze([
        {
          title:"BOOK & TRAVEL",
          links:Object.freeze([
            { label:"Book a trip", path:"/" },
            { label:"Manage your booking", path:"/my-profile?tab=trips" },
            { label:"Our Destinations", path:"/destinations" },
            { label:"Flights", path:"/flights" },
            { label:"Hotels", path:"/hotels" },
            { label:"Tours & Activities", path:"/tours" },
            { label:"Car Rental", path:"/car-rental" },
            { label:"Airport Transfer", path:"/transfers" },
            { label:"Last Chance", path:"/offers" }
          ])
        },
        {
          title:"HELP & TRAVEL INFO",
          links:Object.freeze([
            { label:"Before you travel", path:"/travel-info" },
            { label:"Passport & Visa", path:"/travel-info/passport-visa" },
            { label:"Baggage Allowence", path:"/travel-info/baggage-allowence" },
            { label:"Travel Insurance", path:"/travel-info/insurance" },
            { label:"Special Assistance", path:"/travel-info/special-assistance" },
            { label:"Flight Status", path:"/travel-info/flight-status" },
            { label:"Help Center", path:"/about/support" }
          ])
        },
        {
          title:"SKANDI",
          links:Object.freeze([
            { label:"Join SKANDI Club", path:"/skandi-club" },
            { label:"Log In to My Club", path:"/my-profile" },
            { label:"SKANDI Collection", path:"/skandi-collection" },
            { label:"THE STORE", path:"/the-store" },
            { label:"VOY Magazine", path:"/voy-magazine" }
          ])
        },
        {
          title:"ABOUT SKANDI",
          links:Object.freeze([
            { label:"About SKANDI", path:"/about" },
            { label:"Careers", path:"/about/careers" },
            { label:"Newsroom", path:"/about/news-room" },
            { label:"Our Network", path:"/about/our-network" }
          ])
        }
      ]),
      staffLogin: Object.freeze({ label:"Staff Login", path:"/riaintra" })
    })
  }),


  internal: Object.freeze({
    header: Object.freeze({
      productName:"SRIAINTRA",
      productContext:"SKANDI Enterprise Workforce Suite",
      primaryNav:Object.freeze([
        { id:"success-factors", label:"SAP RIAINTRA Dashboard", path:"/riaintra/success-factors" },
        { id:"my-roster", label:"MyRoster", path:"/riaintra/success-factors/my-roster" },
        { id:"alteaLaunchpad", label:"ALTEA", path:"/riaintra/success-factors/altea" },
        { id:"mail", label:"Mail", path:"/riaintra/success-factors/mail" },
        { id:"docunet", label:"DocuNet", path:"/riaintra/success-factors/docunet" },
        { id:"service-desk", label:"ServiceDesk", path:"/riaintra/success-factors/helpdesk" }
      ]),
      managementNav:Object.freeze([
        { id:"magazine-manager", label:"Media Manager", path:"/riaintra/success-factors/media-control" },
        { id:"inventory-control", label:"Inventory Control", path:"/riaintra/success-factors/altea/inventory-control" }
      ])
    }),
    footer:Object.freeze({
      links:Object.freeze([
        { label:"RIAINTRA", path:"/riaintra" },
        { label:"Legal", path:"/riaintra/success-factors/legal" },
        { label:"ServiceDesk", path:"/riaintra/success-factors/helpdesk" }
      ])
    })
  })
});


const IDS = Object.freeze({
  customerHeaders:["#skandiHeaderEmbed", "#skandiCustomerHeaderEmbed"],
  customerFooters:["#skandiFooterEmbed", "#skandiCustomerFooterEmbed"],
  internalHeaders:["#riaintraHeaderEmbed", "#riaintraHeader", "#staffInternalChromeEmbed"],
  internalFooters:["#riaintraFooterEmbed", "#riaintraFooter"],
  alteaHeaders:["#alteaHeaderEmbed", "#alteaHeader"],
  pageEmbeds:["#travelInfoHtml", "#inventoryControlEmbed", "#alteaInventoryControlEmbed", "#masterInventoryEmbed", "#alteaReservationsEmbed"]
});


const INTERNAL_PREFIXES = ["/riaintra", "/altea", "/_functions"];
const GROUPTALK_CHROME_FREE_PATHS = Object.freeze([
  "/riaintra/success-factors/altea/grouptalk"
]);


let alteaRuntimeContext = {};
const wiredEmbeds = new Set();


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
  const value = String(path || "").trim();
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !/^(javascript|data|vbscript):/i.test(value));
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


async function handleMasterMessage(embed, message = {}) {
  const type = String(message?.type || "");
  const source = String(message?.source || "");
  const payload = message?.payload && typeof message.payload === "object" ? message.payload : {};


  if (type === "MASTER_CONFIG_REQUEST" || type === "SKANDI_MASTER_CONFIG_REQUEST") {
    const extra = isInternalPath()
      ? { staff:await getStaffState() }
      : { customerSession:await getCustomerState() };
    pushMasterConfig(embed, extra);


    if (source === ALTEA_HEADER_SOURCE && isAlteaPath()) {
      const page = currentWixPageInfo();
      const staff = extra.staff || {};
      postToEmbed(embed, "ALTEA_HEADER_CONTEXT", {
        systemName:page.name || "ALTEA",
        pageName:page.name || "",
        pageUrl:page.url || "",
        station:alteaRuntimeContext.station || staff?.profile?.station || staff?.profile?.stationCode || "",
        timeZone:alteaRuntimeContext.timeZone || staff?.profile?.timeZone || ""
      });
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
      timeZone:String(payload.timeZone || "").trim().slice(0,80)
    };
    alteaRuntimeContext = {
      ...alteaRuntimeContext,
      ...Object.fromEntries(Object.entries(next).filter(([, value]) => Boolean(value)))
    };
    postToEmbed(alteaHeaderEl(), "ALTEA_HEADER_CONTEXT", alteaRuntimeContext);
    return true;
  }


  if (source === CUSTOMER_HEADER_SOURCE && type === "SKANDI_EMBED_RESIZE") {
    const requested = Number(payload.height);
    const height = Number.isFinite(requested) ? Math.max(118, Math.min(1200, Math.round(requested))) : 118;
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
    ...IDS.pageEmbeds
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
    setElementVisible(firstExisting(IDS.alteaHeaders), internal && altea && !chromeFree)
  ]);
}


function registeredHtmlComponents() {
  const found = new Map();

  const idGroups = [
    ...IDS.customerHeaders,
    ...IDS.customerFooters,
    ...IDS.internalHeaders,
    ...IDS.internalFooters,
    ...IDS.alteaHeaders,
    ...IDS.pageEmbeds
  ];

  for (const id of idGroups) {
    const el = safeEl(id);
    if (isHtmlEmbed(el)) found.set(el.id || id, el);
  }

  for (const el of allHtmlComponents()) {
    found.set(el.id || String(el), el);
  }

  return Array.from(found.values());
}

function pushConfigToAll() {
  for (const embed of registeredHtmlComponents()) pushMasterConfig(embed);
}


$w.onReady(async function () {
  wireAllHtmlComponents();
  await applyChromeVisibility();


  const header = customerHeaderEl();
  const footer = customerFooterEl();
  const internalHeader = internalHeaderEl();
  const alteaHeader = alteaHeaderEl();


  if (!isInternalPath()) {
    if (header) await pushCustomerHeaderState(header);
    if (footer) pushMasterConfig(footer);
  } else {
    if (internalHeader) await pushStaffHeaderState(internalHeader);
    if (alteaHeader && isAlteaPath()) {
      pushMasterConfig(alteaHeader, { staff:await getStaffState() });
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

// masterPage.js
// SKANDI GLOBAL CHROME CONTROL
// Single source of truth for customer header/footer, RIAINTRA navigation, and brand assets.

import wixLocationFrontend from "wix-location-frontend";
import wixSiteFrontend from "wix-site-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

const MASTER_VERSION = "2026.08.25.1";

const MASTER_CONFIG = Object.freeze({
  brand: Object.freeze({
    groupName: "SKANDI Group",
    travelName: "SKANDI Travels",
    internalName: "RIAINTRA",
    alteaName: "ALTEA",
    slogans: Object.freeze({
      en: "Unforgettable Moments",
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
        customerHeader:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiPrimary: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWhite: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiTravels:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWave: "",
        skandiGroup: "",
        riaintra: "https://static.wixstatic.com/media/394052_1024542c47664bff8f4e145d1adf472d~mv2.png",
        altea: "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",
        voy: "https://static.wixstatic.com/media/394052_30b8bebbf5ee493da7d47329d04de494~mv2.png",
        voyWhite: "https://static.wixstatic.com/media/394052_3770b6753c474d73a77c674b20eab305~mv2.png",
        skandiClub: "",
        signatureCollection: ""
      }),
      icons: Object.freeze({
        home: "",
        bookings: "",
        favorites: "",
        documents: "",
        travelers: "",
        wallet: "",
        support: "",
        settings: "",
        notifications: ""
      })
    })
  }),
  routes: Object.freeze({
    home: "/home",
    search: "/home?focus=search",
    flights: "/flights",
    hotels: "/hotels",
    packages: "/packages",
    tours: "/tours",
    activities: "/activities",
    transfers: "/transfers",
    destinations: "/destinations",
    signatureCollection: "/skandi-collection",
    voy: "/voy-magazine",
    newsroom: "/about/news-room",
    myTrip: "/my-trip",
    club: "/skandi-club",
    support: "/about/support",
    contact: "/about/contact",
    about: "/about",
    legal: "/about/legal",
    staffLogin: "/riaintra",
    staffPortal: "/riaintra/staff-portal",
    successFactors: "/riaintra/success-factors",
    altea: "/riaintra/success-factors/altea",
    mail: "/riaintra/mail",
    docunet: "/riaintra/docunet",
    serviceDesk: "/riaintra/service-desk",
    magazineManager: "/riaintra/media-control"
  }),
  customer: Object.freeze({
    header: Object.freeze({
      primaryNav: Object.freeze([
        { id: "flights", label: "Flights", path: "/flights" },
        { id: "hotels", label: "Hotels", path: "/hotels" },
        { id: "packages", label: "Packages", path: "/packages" },
        { id: "tours", label: "Tours & Activities", path: "/tours" },
        { id: "transfers", label: "Transfers", path: "/transfers" }
      ]),
      secondaryNav: Object.freeze([
        { id: "destinations", label: "Destinations", path: "/destinations" },
        { id: "signature", label: "SKANDI Collection", path: "/skandi-collection" },
        { id: "voy", label: "VOY Magazine", path: "/voy-magazine" },
        { id: "newsroom", label: "Newsroom", path: "/about/news-room" }
      ]),
      accountNav: Object.freeze([
        { id: "myTrip", label: "My Trip", path: "/my-trip" },
        { id: "club", label: "SKANDI Club", path: "/skandi-club" },
        { id: "support", label: "Support", path: "/about/support" }
      ])
    }),
    footer: Object.freeze({
      columns: Object.freeze([
        {
          title: "Travel",
          links: Object.freeze([
            { label: "Flights", path: "/flights" },
            { label: "Hotels", path: "/hotels" },
            { label: "Packages", path: "/packages" },
            { label: "Tours & Activities", path: "/tours" },
            { label: "Transfers", path: "/transfers" }
          ])
        },
        {
          title: "Discover",
          links: Object.freeze([
            { label: "Destinations", path: "/destinations" },
            { label: "SKANDI Collection", path: "/skandi-collection" },
            { label: "VOY Magazine", path: "/voy-magazine" },
            { label: "Newsroom", path: "/about/news-room" }
          ])
        },
        {
          title: "SKANDI",
          links: Object.freeze([
            { label: "About SKANDI", path: "/about" },
            { label: "Contact", path: "/about/contact" },
            { label: "Support", path: "/about/support" },
            { label: "Legal", path: "/about/legal" }
          ])
        }
      ]),
      staffLogin: Object.freeze({ label: "Staff Login", path: "/riaintra" })
    })
  }),
  internal: Object.freeze({
    header: Object.freeze({
      productName: "SKANDI TRAVELS",
      productContext: "RIAINTRA Enterprise Workforce Suite",
      primaryNav: Object.freeze([
        { id: "dashboard", label: "Dashboard", path: "/riaintra/staff-portal" },
        { id: "success-factors", label: "SuccessFactors", path: "/riaintra/success-factors" },
        { id: "altea", label: "ALTEA", path: "/riaintra/success-factors/altea" },
        { id: "mail", label: "Mail", path: "/riaintra/mail" },
        { id: "docunet", label: "DocuNet", path: "/riaintra/docunet" },
        { id: "service-desk", label: "ServiceDesk", path: "/riaintra/service-desk" }
      ]),
      managementNav: Object.freeze([
        { id: "magazine-manager", label: "Magazine Manager", path: "/riaintra/media-control" }
      ])
    }),
    footer: Object.freeze({
      links: Object.freeze([
        { label: "Staff Portal", path: "/riaintra/staff-portal" },
        { label: "DocuNet", path: "/riaintra/docunet" },
        { label: "ServiceDesk", path: "/riaintra/service-desk" }
      ])
    })
  })
});

const CUSTOMER_HEADER_EMBED = "#skandiCustomerHeaderEmbed";
const CUSTOMER_FOOTER_EMBED = "#skandiCustomerFooterEmbed";
const RIAINTRA_HEADER_EMBED = "#riaintraHeaderEmbed";
const RIAINTRA_FOOTER_EMBED = "#riaintraFooterEmbed";
const ALTEA_HEADER_EMBED = "#altea-header";

const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CUSTOMER_HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const CUSTOMER_FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const ALTEA_HEADER_SOURCE = "SKANDI_ALTEA_HEADER";
const INTERNAL_PREFIXES = ["/riaintra", "/altea", "/_functions"];
const GROUPTALK_CHROME_FREE_PATHS = Object.freeze([
  "/riaintra/altea/grouptalk",
  "/riaintra/success-factors/altea/grouptalk"
]);

// Runtime ALTEA module context supplied by the currently open ALTEA application.
let alteaRuntimeContext = {};



function safeEl(id) {
  try { return $w(id); } catch (_) { return null; }
}

function allHtmlComponents() {
  try {
    const result = $w("HtmlComponent");
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (typeof result[Symbol.iterator] === "function") return Array.from(result);
    if (typeof result.length === "number") return Array.from(result);
    return [result];
  } catch (error) {
    console.warn("[MasterPage] Could not enumerate HTML Components.", error);
    return [];
  }
}

function currentWixPageInfo() {
  try {
    const page = wixSiteFrontend.currentPage || {};

    return {
      name: String(page.name || "").trim(),
      url: String(page.url || "").trim(),
      type: String(page.type || "").trim(),
      isHomePage: page.isHomePage === true
    };
  } catch (error) {
    console.warn("[MasterPage] Could not read wixSiteFrontend.currentPage.", error);

    return {
      name: "",
      url: "",
      type: "",
      isHomePage: false
    };
  }
}

function currentPathString() {
  const page = currentWixPageInfo();

  // Prefer the Wix page definition when available.
  // This keeps the master chrome aligned with the actual Wix page.
  if (page.url && page.url.startsWith("/")) {
    return page.url.split("?")[0].replace(/\/+$/, "") || "/";
  }

  const path = wixLocationFrontend.path || [];
  return "/" + path.join("/");
}

function isInternalPath(path = currentPathString()) {
  return INTERNAL_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + "/"));
}

function isAlteaPath(path = currentPathString()) {
  const value = String(path || "").toLowerCase();
  const prefixes = [
    "/riaintra/success-factors/altea",
    "/riaintra/altea", // legacy fallback
    "/altea"           // legacy fallback
  ];
  return prefixes.some(prefix => value === prefix || value.startsWith(prefix + "/"));
}

function isChromeFreeInternalPath(path = currentPathString()) {
  const value = String(path || "")
    .toLowerCase()
    .split("?")[0]
    .replace(/\/+$/, "") || "/";

  return GROUPTALK_CHROME_FREE_PATHS.some(
    groupTalkPath =>
      value === groupTalkPath ||
      value.startsWith(groupTalkPath + "/")
  );
}

function isSafeRoute(path) {
  const value = String(path || "").trim();
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !/^(javascript|data|vbscript):/i.test(value));
}

function postToEmbed(embed, type, payload = {}) {
  if (!embed || typeof embed.postMessage !== "function") return false;

  try {
    embed.postMessage({
      source: PARENT_SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    });

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
    version: MASTER_VERSION,
    mode: isInternalPath(path) ? "internal" : "customer",
    isInternal: isInternalPath(path),
    isAltea: altea,
    currentPath: path,

    // Wix page metadata is the source of truth for the ALTEA system title.
    currentPage: page,

    brand: MASTER_CONFIG.brand,
    routes: MASTER_CONFIG.routes,
    customer: MASTER_CONFIG.customer,
    internal: MASTER_CONFIG.internal,

    altea: {
      ...(altea
        ? {
            systemName: page.name || "",
            pageName: page.name || "",
            pageUrl: page.url || ""
          }
        : {}),
      ...alteaRuntimeContext
    },

    ...extra
  };
}

function pushMasterConfig(embed, extra = {}) {
  postToEmbed(embed, "SKANDI_MASTER_CONFIG", masterPayload(extra));
}

function closeCustomerHeaderPanels() {
  postToEmbed(safeEl(CUSTOMER_HEADER_EMBED), "CLOSE_CUSTOMER_HEADER_PANELS", {});
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
    if (!member) return { loggedIn: false, displayName: "", points: 0, tierName: "", menu: [] };
    const session = await getCustomerHeaderSession();
    return {
      loggedIn: true,
      displayName: session?.displayName || member?.profile?.nickname || member?.loginEmail || "",
      points: Number(session?.points || session?.clubPoints || 0),
      tierName: session?.tierName || session?.tier || "",
      menu: Array.isArray(session?.menu) ? session.menu : []
    };
  } catch (error) {
    console.warn("[MasterPage] Customer session unavailable.", error);
    return { loggedIn: false, displayName: "", points: 0, tierName: "", menu: [] };
  }
}

async function pushCustomerHeaderState(embed = safeEl(CUSTOMER_HEADER_EMBED)) {
  if (!embed) return;
  postToEmbed(embed, "CUSTOMER_HEADER_STATE", await getCustomerState());
}

async function getStaffState() {
  try {
    const result = await getStaffPortalSession();
    if (!result || result.ok === false || result.authorized === false) return { authorized: false, profile: {} };
    return {
      authorized: true,
      profile: result.profile || {},
      permissions: result.permissions || [],
      apps: result.apps || []
    };
  } catch (error) {
    console.warn("[MasterPage] Staff session unavailable.", error);
    return { authorized: false, profile: {} };
  }
}

async function pushStaffHeaderState(embed = safeEl(RIAINTRA_HEADER_EMBED)) {
  if (!embed) return;
  const staff = await getStaffState();
  pushMasterConfig(embed, { staff });
  postToEmbed(embed, "RIAINTRA_HEADER_STATE", {
    ...staff,
    navigation: MASTER_CONFIG.internal.header,
    assets: MASTER_CONFIG.brand.assets
  });
}

async function handleMasterMessage(embed, message = {}) {
  const type = String(message?.type || "");
  const source = String(message?.source || "");
  const payload = message?.payload && typeof message.payload === "object" ? message.payload : {};

  if (type === "MASTER_CONFIG_REQUEST" || type === "SKANDI_MASTER_CONFIG_REQUEST") {
    const extra = isInternalPath()
      ? { staff: await getStaffState() }
      : { customerSession: await getCustomerState() };

    pushMasterConfig(embed, extra);

    // The ALTEA header gets the real Wix page name directly.
    if (source === ALTEA_HEADER_SOURCE && isAlteaPath()) {
      const page = currentWixPageInfo();
      const staff = extra.staff || {};

      postToEmbed(embed, "ALTEA_HEADER_CONTEXT", {
        systemName: page.name || "ALTEA",
        pageName: page.name || "",
        pageUrl: page.url || "",
        station:
          alteaRuntimeContext.station ||
          staff?.profile?.station ||
          staff?.profile?.stationCode ||
          "USNYC",
        timeZone:
          alteaRuntimeContext.timeZone ||
          staff?.profile?.timeZone ||
          ""
      });
    }

    return true;
  }

  if (type === "MASTER_ASSETS_REQUEST") {
    postToEmbed(embed, "SKANDI_MASTER_ASSETS", MASTER_CONFIG.brand.assets);
    return true;
  }

  if (type === "MASTER_NAVIGATION_REQUEST") {
    postToEmbed(embed, "SKANDI_MASTER_NAVIGATION", {
      customer: MASTER_CONFIG.customer,
      internal: MASTER_CONFIG.internal,
      routes: MASTER_CONFIG.routes,
      currentPath: currentPathString()
    });
    return true;
  }

  // ALTEA applications can tell the master page which system/module is open.
  // This is useful when several ALTEA systems run inside the same Wix route.
  if (type === "ALTEA_SYSTEM_CONTEXT" && isInternalPath()) {
    const clean = {
      systemName: String(payload.systemName || "").trim().slice(0, 80),
      systemContext: String(payload.systemContext || "").trim().slice(0, 120),
      station: String(payload.station || "").trim().toUpperCase().slice(0, 12),
      timeZone: String(payload.timeZone || "").trim().slice(0, 80)
    };

    alteaRuntimeContext = {
      ...alteaRuntimeContext,
      ...Object.fromEntries(
        Object.entries(clean).filter(([, value]) => Boolean(value))
      )
    };

    const alteaHeader = safeEl(ALTEA_HEADER_EMBED);

    if (alteaHeader) {
      postToEmbed(
        alteaHeader,
        "ALTEA_HEADER_CONTEXT",
        alteaRuntimeContext
      );
    }

    return true;
  }

  if (type === "MASTER_NAVIGATE") {
    navigate(message.path || payload.path || "");
    return true;
  }

  if (source === CUSTOMER_HEADER_SOURCE) {
    switch (type) {
      case "HEADER_READY":
        pushMasterConfig(embed, { customerSession: await getCustomerState() });
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
          postToEmbed(embed, "HOME_ERROR", { message: "Invalid email or password. Please try again." });
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
          ready: true,
          navigation: MASTER_CONFIG.customer.footer,
          assets: MASTER_CONFIG.brand.assets
        });
        return true;
      case "FOOTER_NAVIGATE":
        navigate(message.path || payload.path);
        return true;
      case "FOOTER_STAFF_LOGIN":
        navigate(MASTER_CONFIG.routes.staffLogin);
        return true;
      case "FOOTER_NEWSLETTER_SIGNUP": {
        const email = String(message.email || payload.email || "").trim();
        if (!email) {
          postToEmbed(embed, "FOOTER_NEWSLETTER_RESULT", { ok: false, message: "Please enter your email address." });
          return true;
        }
        try {
          const result = await subscribeCustomerNewsletter({ email, source: payload.source || "Footer" });
          postToEmbed(embed, "FOOTER_NEWSLETTER_RESULT", result);
        } catch (error) {
          postToEmbed(embed, "FOOTER_NEWSLETTER_RESULT", { ok: false, message: error?.message || "Newsletter signup failed." });
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

const wiredEmbedIds = new Set();

function wireHtmlComponent(embed) {
  if (!embed || typeof embed.onMessage !== "function") return;

  const key = embed.id || String(embed);
  if (wiredEmbedIds.has(key)) return;
  wiredEmbedIds.add(key);

  embed.onMessage(async event => {
    try {
      await handleMasterMessage(embed, event?.data || {});
    } catch (error) {
      console.error(`[MasterPage] Message handling failed for ${embed.id}.`, error);
    }
  });
  pushMasterConfig(embed);
}

function wireAllHtmlComponents() {
  const globalIds = new Set([
    CUSTOMER_HEADER_EMBED,
    CUSTOMER_FOOTER_EMBED,
    RIAINTRA_HEADER_EMBED,
    RIAINTRA_FOOTER_EMBED,
    ALTEA_HEADER_EMBED
  ].map(value => value.replace(/^#/, "")));

  const components = allHtmlComponents();

  if (isChromeFreeInternalPath()) {
    components
      .filter(embed => {
        const id = String(embed?.id || "").replace(/^#/, "");
        return !globalIds.has(id);
      })
      .forEach(wireHtmlComponent);

    return;
  }

  [
    safeEl(CUSTOMER_HEADER_EMBED),
    safeEl(CUSTOMER_FOOTER_EMBED),
    safeEl(RIAINTRA_HEADER_EMBED),
    safeEl(RIAINTRA_FOOTER_EMBED),
    safeEl(ALTEA_HEADER_EMBED),
    ...components
  ]
    .filter(Boolean)
    .forEach(wireHtmlComponent);
}

async function showChromeElement(element) {
  if (!element) return;
  try { if (typeof element.expand === "function") await element.expand(); } catch (_) {}
  try { if (typeof element.show === "function") await element.show(); } catch (_) {}
}

async function hideChromeElement(element) {
  if (!element) return;
  try { if (typeof element.hide === "function") await element.hide(); } catch (_) {}
  try { if (typeof element.collapse === "function") await element.collapse(); } catch (_) {}
}

async function applyChromeVisibility() {
  const internal = isInternalPath();
  const altea = isAlteaPath();

  const customerHeader = safeEl(CUSTOMER_HEADER_EMBED);
  const customerFooter = safeEl(CUSTOMER_FOOTER_EMBED);
  const riaHeader = safeEl(RIAINTRA_HEADER_EMBED);
  const riaFooter = safeEl(RIAINTRA_FOOTER_EMBED);
  const alteaHeader = safeEl(ALTEA_HEADER_EMBED);

  /*
   * GroupTalk owns the complete viewport/application surface.
   * Do not stack RIAINTRA, ALTEA, customer header, or any global footer
   * on /riaintra/altea/grouptalk.
   */
  if (isChromeFreeInternalPath()) {
    await hideChromeElement(customerHeader);
    await hideChromeElement(customerFooter);
    await hideChromeElement(riaHeader);
    await hideChromeElement(riaFooter);
    await hideChromeElement(alteaHeader);
    return;
  }

  if (internal) {
    await hideChromeElement(customerHeader);
    await hideChromeElement(customerFooter);
    await showChromeElement(riaHeader);
    await showChromeElement(riaFooter);

    if (altea) {
      await showChromeElement(alteaHeader);

      const staff = await getStaffState();
      const page = currentWixPageInfo();

      pushMasterConfig(alteaHeader, { staff });

      // Explicit page/system context for the stacked ALTEA header.
      postToEmbed(alteaHeader, "ALTEA_HEADER_CONTEXT", {
        systemName: page.name || "ALTEA",
        pageName: page.name || "",
        pageUrl: page.url || "",
        station:
          alteaRuntimeContext.station ||
          staff?.profile?.station ||
          staff?.profile?.stationCode ||
          "USNYC",
        timeZone:
          alteaRuntimeContext.timeZone ||
          staff?.profile?.timeZone ||
          ""
      });
    } else {
      await hideChromeElement(alteaHeader);
    }

    await pushStaffHeaderState(riaHeader);
  } else {
    await showChromeElement(customerHeader);
    await showChromeElement(customerFooter);
    await hideChromeElement(riaHeader);
    await hideChromeElement(riaFooter);
    await hideChromeElement(alteaHeader);
    await pushCustomerHeaderState(customerHeader);
    if (customerFooter) pushMasterConfig(customerFooter);
  }
}

$w.onReady(async function () {
  const page = currentWixPageInfo();

  console.log("[MasterPage] Current Wix page:", {
    name: page.name,
    url: page.url,
    type: page.type,
    isAltea: isAlteaPath()
  });

  wireAllHtmlComponents();
  await applyChromeVisibility();

  authentication.onLogin(async () => {
    if (isChromeFreeInternalPath()) return;
    if (isInternalPath()) await pushStaffHeaderState();
    else await pushCustomerHeaderState();
  });

  setTimeout(() => {
    if (isChromeFreeInternalPath()) {
      return;
    }

    allHtmlComponents().forEach(embed => pushMasterConfig(embed));
  }, 500);
});

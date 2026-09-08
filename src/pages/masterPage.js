// masterPage.js
// SKANDI GLOBAL CHROME CONTROLLER
// Customer chrome + one master-driven internal header for RIAINTRA / ALTEA.
// Internal staff identity/access is resolved by backend/RIA/staffPortalAuth.web.js
// from Supabase public.agent_users.

import wixLocationFrontend from "wix-location-frontend";
import wixWindowFrontend from "wix-window-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CUSTOMER_HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const CUSTOMER_FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const INTERNAL_HEADER_SOURCE = "SKANDI_INTERNAL_HEADER";
const SETTINGS_LIGHTBOX_NAME = "SKANDI Language & Currency";
const MASTER_VERSION = "2026.09.07.2";

const ALLOWED_LANGUAGES = new Set(["EN", "SV", "NO", "DA", "FI"]);
const ALLOWED_CURRENCIES = new Set(["USD", "SEK", "NOK", "DKK", "EUR"]);

const wiredEmbeds = new WeakSet();
const customerHeaderEmbeds = new Set();
const internalHeaderEmbeds = new Set();

let settingsPopupPromise = null;
let staffStatePromise = null;

const MASTER_CONFIG = {
  version: MASTER_VERSION,

  brand: {
    groupName: "SKANDI Group",
    travelName: "SKANDI Travels",
    slogans: {
      en: "Unforgettable Moments",
      sv: "När du längtar bort",
      no: "Når du lengter bort",
      da: "Når du længes væk",
      fi: "Kun kaipaat pois"
    },
    languages: ["EN", "SV", "NO", "DA", "FI"],
    currencies: ["USD", "SEK", "NOK", "DKK", "EUR"],
    assets: {
      logos: {
        customerHeader: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        customerFooter: "https://static.wixstatic.com/media/394052_fafffe6d26434eddbf62eb645ee9c844~mv2.png",
        skandiPrimary: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        riaintraLight: "https://static.wixstatic.com/media/394052_635532ed8a8d446ab22f4fc09ef65858~mv2.png",
        skandiTravels: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png"
      }
    }
  },

  routes: {
    home: "/home",
    search: "/search",
    flights: "/flights",
    hotels: "/hotels",
    packages: "/packages",
    tours: "/tours",
    activities: "/activities",
    transfers: "/transfers",
    carRental: "/car-rental",
    destinations: "/our-destinations",
    skandiCollection: "/skandi-collection",
    voy: "/voy-magazine",
    newsroom: "/about/news-room",
    myTrip: "/my-profile?tab=trips",
    club: "/skandi-club",
    support: "/about/support",
    about: "/about",
    legal: "/about/legal",
    riaintra: "/riaintra",
    riaintraHome: "/riaintra/success-factors",
    altea: "/riaintra/success-factors/altea"
  },

  customer: {
    header: {
      primaryNav: [
        { id: "destinations", label: "Destinations", path: "/our-destinations" },
        { id: "tours", label: "Tours & Activities", path: "/tours" },
        { id: "travelInfo", label: "Travel Info", path: "/travel-info" },
        { id: "signature", label: "SKANDI Collection", path: "/skandi-collection" }
      ],
      accountNav: [
        { id: "myTrip", label: "My Trips", path: "/my-profile?tab=trips" },
        { id: "club", label: "SKANDI Club", path: "/skandi-club" }
      ]
    },

    footer: {
      newsletter: {
        title: "Get SKANDI offers and travel inspiration",
        description: "Receive destination guides, Signature Collection updates and member offers.",
        placeholder: "Email address",
        buttonLabel: "Sign up"
      },
      columns: [
        {
          title: "BOOK & TRAVEL",
          links: [
            { label: "Book a trip", path: "/" },
            { label: "Manage your booking", path: "/my-profile?tab=trips" },
            { label: "Our Destinations", path: "/our-destinations" },
            { label: "Flights", path: "/flights" },
            { label: "Hotels", path: "/hotels" },
            { label: "Tours & Activities", path: "/tours" },
            { label: "Car Rental", path: "/car-rental" },
            { label: "Airport Transfer", path: "/transfers" }
          ]
        },
        {
          title: "HELP & TRAVEL INFO",
          links: [
            { label: "Before you travel", path: "/travel-info" },
            { label: "Passport & Visa", path: "/travel-info/passport-visa" },
            { label: "Baggage Allowance", path: "/travel-info/baggage-allowence" },
            { label: "Travel Insurance", path: "/travel-info/insurance" },
            { label: "Special Assistance", path: "/travel-info/special-assistance" },
            { label: "Flight Status", path: "/travel-info/flight-status" },
            { label: "Help Center", path: "/about/support" }
          ]
        },
        {
          title: "SKANDI",
          links: [
            { label: "Join SKANDI Club", path: "/skandi-club" },
            { label: "Log In to My Club", path: "/my-profile" },
            { label: "SKANDI Collection", path: "/skandi-collection" },
            { label: "THE STORE", path: "/the-store" },
            { label: "VOY Magazine", path: "/voy-magazine" }
          ]
        },
        {
          title: "ABOUT SKANDI",
          links: [
            { label: "About SKANDI", path: "/about" },
            { label: "Careers", path: "/about/careers" },
            { label: "Newsroom", path: "/about/news-room" },
            { label: "Our Network", path: "/about/our-network" }
          ]
        }
      ],
      bottomLinks: [
        { label: "Legal", path: "/about/legal" },
        { label: "Privacy", path: "/about/legal/policies?policy=privacy" },
        { label: "Terms", path: "/about/legal/policies?policy=terms" },
        { label: "Accessibility", path: "/about/legal/policies?policy=accessibility" },
        { label: "Staff Login", path: "/riaintra" }
      ]
    }
  },

  internal: {
    header: {
      logoKey: "riaintraLight",
      contexts: {
        riaintra: {
          productName: "RIAINTRA",
          nav: [
            { id: "home", label: "Home", path: "/riaintra/success-factors" },
            { id: "altea", label: "ALTEA", path: "/riaintra/success-factors/altea" },
            { id: "mail", label: "Mail", path: "/riaintra/success-factors/mail" },
            { id: "payroll", label: "MyPayroll", path: "/riaintra/success-factors/my-payroll" },
            { id: "docunet", label: "DocuNet", path: "/riaintra/success-factors/docunet" },
            { id: "uniform", label: "Uniform Center", path: "/riaintra/success-factors/uniform" },
            { id: "help", label: "HelpDesk", path: "/riaintra/success-factors/helpdesk" }
          ]
        },
        altea: {
          productName: "ALTEA",
          nav: [
            { id: "altea-home", label: "ALTEA Home", path: "/riaintra/success-factors/altea" },
            { id: "reservations", label: "Reservations", path: "/riaintra/success-factors/altea/reservations" },
            { id: "grouptalk", label: "GroupTalk", path: "/riaintra/success-factors/altea/grouptalk" },
            { id: "docunet", label: "DocuNet", path: "/riaintra/success-factors/docunet" },
            { id: "ria-home", label: "RIAINTRA", path: "/riaintra/success-factors" }
          ]
        }
      }
    }
  }
};

function currentPath() {
  try {
    return "/" + (wixLocationFrontend.path || []).join("/");
  } catch (_) {
    return "/";
  }
}

function isInternalPath(path = currentPath()) {
  const value = String(path || "").toLowerCase();
  return value === "/riaintra" || value.startsWith("/riaintra/") || value === "/altea" || value.startsWith("/altea/");
}

function isAlteaPath(path = currentPath()) {
  const value = String(path || "").toLowerCase();
  return value === "/altea" || value.startsWith("/altea/") || value.includes("/altea");
}

function isStaffLoginPath(path = currentPath()) {
  return String(path || "").toLowerCase() === "/riaintra";
}

function parseMessage(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (_) {
      return null;
    }
  }
  return data && typeof data === "object" ? data : null;
}

function post(embed, type, payload = {}) {
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
    console.error("[SKANDI MASTER] postMessage failed", embed?.id, error);
    return false;
  }
}

function normalizeAgentProfile(profile = {}) {
  if (!profile || typeof profile !== "object") return null;

  return {
    id: profile.id || "",
    agentId: profile.agentId || profile.agent_id || "",
    skId: profile.skId || profile.sk_id || "",
    firstName: profile.firstName || profile.first_name || "",
    lastName: profile.lastName || profile.last_name || "",
    preferredName: profile.preferredName || profile.preferred_name || "",
    displayName:
      profile.displayName ||
      profile.display_name ||
      profile.name ||
      [profile.firstName || profile.first_name, profile.lastName || profile.last_name]
        .filter(Boolean)
        .join(" ") ||
      "Staff",
    jobTitle: profile.jobTitle || profile.job_title || "",
    department: profile.department || "",
    station: profile.station || profile.base || "",
    base: profile.base || profile.station || "",
    email: profile.email || "",
    corporateEmailAddress: profile.corporateEmailAddress || profile.corporate_email_address || "",
    badgePhotoUrl: profile.badgePhotoUrl || profile.badge_photo_url || "",
    employmentStatus: profile.employmentStatus || profile.employment_status || "",
    status: profile.status || "",
    active: profile.active === true,
    portalAccess: profile.portalAccess === true || profile.portal_access === true,
    authorized: profile.authorized === true,
    canManage: profile.canManage === true || profile.can_manage === true,
    permissions:
      profile.permissions && typeof profile.permissions === "object"
        ? profile.permissions
        : {}
  };
}

async function getInternalState(force = false) {
  if (!isInternalPath()) {
    return {
      loggedIn: false,
      authenticated: false,
      authorized: false,
      profile: null,
      apps: [],
      permissions: {},
      code: "NOT_INTERNAL"
    };
  }

  if (!staffStatePromise || force) {
    staffStatePromise = getStaffPortalSession()
      .then((session) => {
        const rawProfile = session?.profile || session?.staff || session?.agent || null;
        const profile = normalizeAgentProfile(rawProfile);

        return {
          loggedIn: session?.loggedIn === true || session?.authenticated === true,
          authenticated: session?.authenticated === true || session?.loggedIn === true,
          authorized: session?.authorized === true && profile?.authorized === true,
          profile,
          apps: Array.isArray(session?.apps) ? session.apps : [],
          permissions:
            session?.permissions && typeof session.permissions === "object"
              ? session.permissions
              : profile?.permissions || {},
          checkedAt: session?.checkedAt || new Date().toISOString(),
          code: session?.code || ""
        };
      })
      .catch((error) => {
        console.warn("[SKANDI MASTER] agent_users session unavailable", error);
        return {
          loggedIn: false,
          authenticated: false,
          authorized: false,
          profile: null,
          apps: [],
          permissions: {},
          code: "STAFF_STATE_FAILED"
        };
      })
      .finally(() => {
        setTimeout(() => {
          staffStatePromise = null;
        }, 250);
      });
  }

  return staffStatePromise;
}

function appAllowsPath(app, path) {
  const appPath = String(app?.path || "").replace(/\/$/, "");
  const target = String(path || "").replace(/\/$/, "");
  if (!appPath || !target) return false;

  return (
    target === appPath ||
    target.startsWith(`${appPath}/`) ||
    appPath.startsWith(`${target}/`)
  );
}

function canOpenInternalPath(state, path) {
  if (state?.authorized !== true) return false;
  if (state?.profile?.canManage === true) return true;

  const apps = Array.isArray(state?.apps) ? state.apps : [];
  return apps.some((app) => appAllowsPath(app, path));
}

function buildInternalHeader(path, state) {
  const contextKey = isAlteaPath(path) ? "altea" : "riaintra";
  const base = MASTER_CONFIG.internal.header;
  const context = base.contexts[contextKey];

  const primaryNav = (context.nav || []).filter((item) =>
    canOpenInternalPath(state, item.path)
  );

  return {
    logoKey: base.logoKey,
    context: contextKey,
    productName: context.productName,
    primaryNav
  };
}

function masterPayload(staffState = null) {
  const path = currentPath();
  const state = staffState || {
    authorized: false,
    profile: null,
    apps: [],
    permissions: {}
  };

  return {
    ...MASTER_CONFIG,
    internal: {
      ...MASTER_CONFIG.internal,
      header: buildInternalHeader(path, state)
    },
    currentPath: path,
    mode: isInternalPath(path) ? "internal" : "customer",
    isInternal: isInternalPath(path),
    isAltea: isAlteaPath(path)
  };
}

function sendMasterConfig(embed, staffState = null) {
  post(embed, "SKANDI_MASTER_CONFIG", masterPayload(staffState));
}

async function getCustomerState() {
  try {
    const member = await currentMember.getMember();

    if (!member) {
      return {
        loggedIn: false,
        displayName: "",
        email: "",
        points: 0,
        tierName: "",
        menu: []
      };
    }

    const displayName =
      member?.profile?.nickname ||
      member?.profile?.firstName ||
      member?.contactDetails?.firstName ||
      member?.loginEmail ||
      "Member";

    return {
      loggedIn: true,
      displayName,
      email: String(member?.loginEmail || "").trim(),
      points: 0,
      tierName: "",
      menu: []
    };
  } catch (error) {
    console.warn("[SKANDI MASTER] customer member state unavailable", error);
    return {
      loggedIn: false,
      displayName: "",
      email: "",
      points: 0,
      tierName: "",
      menu: []
    };
  }
}

async function sendCustomerHeaderState(embed) {
  post(embed, "CUSTOMER_HEADER_STATE", await getCustomerState());
}

async function sendInternalHeaderState(embed, force = false) {
  const state = await getInternalState(force);
  sendMasterConfig(embed, state);
  post(embed, "INTERNAL_HEADER_STATE", state);
}

function normalizeLanguage(value) {
  const result = String(value || "EN").trim().toUpperCase();
  return ALLOWED_LANGUAGES.has(result) ? result : "EN";
}

function normalizeCurrency(value) {
  const result = String(value || "USD").trim().toUpperCase();
  return ALLOWED_CURRENCIES.has(result) ? result : "USD";
}

function normalizeSettings(value = {}) {
  return {
    language: normalizeLanguage(value.language),
    currency: normalizeCurrency(value.currency)
  };
}

function sendSettingsToHeaders(settings) {
  const normalized = normalizeSettings(settings);
  for (const embed of customerHeaderEmbeds) {
    post(embed, "CUSTOMER_SETTINGS_APPLY", normalized);
  }
}

async function openInitialSettingsPopup(requestingEmbed, payload = {}) {
  if (isInternalPath()) return;
  if (requestingEmbed) customerHeaderEmbeds.add(requestingEmbed);
  if (settingsPopupPromise) return settingsPopupPromise;

  const defaults = normalizeSettings(payload);

  settingsPopupPromise = wixWindowFrontend
    .openLightbox(SETTINGS_LIGHTBOX_NAME, defaults)
    .then((result) => {
      if (!result || typeof result !== "object") return null;

      const language = String(result.language || "").trim().toUpperCase();
      const currency = String(result.currency || "").trim().toUpperCase();

      if (!ALLOWED_LANGUAGES.has(language) || !ALLOWED_CURRENCIES.has(currency)) {
        return null;
      }

      const settings = { language, currency };
      sendSettingsToHeaders(settings);
      if (requestingEmbed) {
        post(requestingEmbed, "CUSTOMER_SETTINGS_APPLY", settings);
      }
      return settings;
    })
    .catch((error) => {
      console.error("[SKANDI MASTER] initial settings popup failed", error);
      return null;
    })
    .finally(() => {
      settingsPopupPromise = null;
    });

  return settingsPopupPromise;
}

function navigate(rawPath, internalOnly = false) {
  const path = String(rawPath || "").trim();

  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /^(javascript|data|vbscript):/i.test(path)
  ) {
    return;
  }

  if (internalOnly && !isInternalPath(path)) {
    console.warn("[SKANDI MASTER] blocked non-internal navigation", path);
    return;
  }

  wixLocationFrontend.to(path);
}

async function showEmbed(embed) {
  if (!embed) return;
  try {
    if (typeof embed.expand === "function") await embed.expand();
  } catch (_) {}
  try {
    if (typeof embed.show === "function") await embed.show();
  } catch (_) {}
}

async function hideEmbed(embed) {
  if (!embed) return;
  try {
    if (typeof embed.hide === "function") await embed.hide();
  } catch (_) {}
  try {
    if (typeof embed.collapse === "function") await embed.collapse();
  } catch (_) {}
}

function isCustomerChromeSource(source) {
  return source === CUSTOMER_HEADER_SOURCE || source === CUSTOMER_FOOTER_SOURCE;
}

async function syncChromeVisibility(embed, source) {
  if (isCustomerChromeSource(source)) {
    if (isInternalPath()) {
      await hideEmbed(embed);
    } else {
      await showEmbed(embed);
    }
    return;
  }

  if (source === INTERNAL_HEADER_SOURCE) {
    if (isInternalPath() && !isStaffLoginPath()) {
      await showEmbed(embed);
    } else {
      await hideEmbed(embed);
    }
  }
}

function runSearch(message, payload) {
  const query = String(
    payload?.query ||
    message?.query ||
    payload?.value ||
    message?.value ||
    ""
  ).trim();

  navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
}

async function handleMessage(embed, event) {
  const message = parseMessage(event?.data);
  if (!message) return;

  const source = String(message.source || "");
  const type = String(message.type || "");
  const payload =
    message.payload && typeof message.payload === "object"
      ? message.payload
      : {};

  if (source === CUSTOMER_HEADER_SOURCE) customerHeaderEmbeds.add(embed);
  if (source === INTERNAL_HEADER_SOURCE) internalHeaderEmbeds.add(embed);

  await syncChromeVisibility(embed, source);

  if (source === CUSTOMER_HEADER_SOURCE && type === "INITIAL_SETTINGS_REQUIRED") {
    await openInitialSettingsPopup(embed, payload);
    return;
  }

  if (type === "MASTER_CONFIG_REQUEST" || type === "SKANDI_MASTER_CONFIG_REQUEST") {
    if (source === INTERNAL_HEADER_SOURCE) {
      await sendInternalHeaderState(embed);
      return;
    }

    sendMasterConfig(embed);

    if (source === CUSTOMER_HEADER_SOURCE) {
      await sendCustomerHeaderState(embed);
    }

    if (source === CUSTOMER_FOOTER_SOURCE) {
      post(embed, "CUSTOMER_FOOTER_STATE", { ready: true });
    }
    return;
  }

  if (source === INTERNAL_HEADER_SOURCE && type === "INTERNAL_HEADER_READY") {
    internalHeaderEmbeds.add(embed);
    await sendInternalHeaderState(embed, true);
    return;
  }

  if (source === INTERNAL_HEADER_SOURCE && type === "INTERNAL_NAVIGATE") {
    const path = payload.path || message.path;
    const state = await getInternalState();

    if (!canOpenInternalPath(state, path)) {
      console.warn("[SKANDI MASTER] agent_users access blocked navigation", path);
      post(embed, "INTERNAL_HEADER_ERROR", { code: "ACCESS_DENIED" });
      return;
    }

    navigate(path, true);
    return;
  }

  if (source === INTERNAL_HEADER_SOURCE && type === "INTERNAL_PROFILE_REFRESH") {
    await sendInternalHeaderState(embed, true);
    return;
  }

  if (source === INTERNAL_HEADER_SOURCE && type === "INTERNAL_LOGOUT") {
    try {
      await authentication.logout();
    } catch (_) {}
    navigate("/riaintra");
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "HEADER_READY") {
    customerHeaderEmbeds.add(embed);
    sendMasterConfig(embed);
    await sendCustomerHeaderState(embed);
    return;
  }

  if (source === CUSTOMER_FOOTER_SOURCE && type === "FOOTER_READY") {
    sendMasterConfig(embed);
    post(embed, "CUSTOMER_FOOTER_STATE", { ready: true });
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "UPDATE_SETTINGS") return;

  if (source === CUSTOMER_HEADER_SOURCE && type === "HEADER_NAVIGATE") {
    navigate(payload.path || message.path);
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "HEADER_SEARCH") {
    runSearch(message, payload);
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "HEADER_LOGIN") {
    try {
      await authentication.promptLogin();
    } catch (_) {}
    await sendCustomerHeaderState(embed);
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "HEADER_LOGIN_SUBMIT") {
    try {
      await authentication.login(
        String(payload.email || message.email || "").trim(),
        String(payload.password || message.password || "")
      );
      await sendCustomerHeaderState(embed);
    } catch (error) {
      console.warn("[SKANDI MASTER] customer login failed", error);
      post(embed, "HOME_ERROR", {
        message: "Invalid email or password. Please try again."
      });
    }
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "HEADER_FORGOT_PASSWORD") {
    try {
      await authentication.promptForgotPassword();
    } catch (_) {}
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "HEADER_LOGOUT") {
    try {
      await authentication.logout();
    } catch (_) {}
    await sendCustomerHeaderState(embed);
    navigate("/");
    return;
  }

  if (source === CUSTOMER_HEADER_SOURCE && type === "SKANDI_EMBED_RESIZE") {
    const requested = Number(payload.height);
    if (Number.isFinite(requested)) {
      try {
        embed.height = Math.max(118, Math.min(1200, Math.round(requested)));
      } catch (_) {}
    }
    return;
  }

  if (source === CUSTOMER_FOOTER_SOURCE && type === "FOOTER_NAVIGATE") {
    navigate(payload.path || message.path);
    return;
  }

  if (source === CUSTOMER_FOOTER_SOURCE && type === "FOOTER_STAFF_LOGIN") {
    navigate("/riaintra");
    return;
  }

  if (type === "MASTER_NAVIGATE") {
    navigate(payload.path || message.path);
  }
}

function wireEmbed(embed) {
  if (
    !embed ||
    wiredEmbeds.has(embed) ||
    typeof embed.onMessage !== "function"
  ) {
    return;
  }

  wiredEmbeds.add(embed);

  embed.onMessage(async (event) => {
    try {
      await handleMessage(embed, event);
    } catch (error) {
      console.error("[SKANDI MASTER] message failure", embed?.id, error);
    }
  });
}

async function refreshCustomerHeaders() {
  const state = await getCustomerState();
  for (const embed of customerHeaderEmbeds) {
    post(embed, "CUSTOMER_HEADER_STATE", state);
  }
}

async function refreshInternalHeaders(force = true) {
  if (!isInternalPath()) return;

  const state = await getInternalState(force);

  for (const embed of internalHeaderEmbeds) {
    sendMasterConfig(embed, state);
    post(embed, "INTERNAL_HEADER_STATE", state);
  }
}

async function syncKnownChromeVisibility() {
  for (const embed of customerHeaderEmbeds) {
    await syncChromeVisibility(embed, CUSTOMER_HEADER_SOURCE);
  }

  for (const embed of internalHeaderEmbeds) {
    await syncChromeVisibility(embed, INTERNAL_HEADER_SOURCE);
  }
}

$w.onReady(async function () {
  console.log("[SKANDI MASTER] READY", MASTER_VERSION, currentPath());

  let components = [];

  try {
    components = $w("HtmlComponent") || [];
  } catch (error) {
    console.error("[SKANDI MASTER] HtmlComponent selector failed", error);
  }

  components.forEach(wireEmbed);

  setTimeout(() => {
    try {
      ($w("HtmlComponent") || []).forEach(wireEmbed);
    } catch (error) {
      console.error("[SKANDI MASTER] retry failed", error);
    }
  }, 1000);

  authentication.onLogin(async () => {
    try {
      await refreshCustomerHeaders();
      await refreshInternalHeaders(true);
      await syncKnownChromeVisibility();
    } catch (_) {}
  });
});

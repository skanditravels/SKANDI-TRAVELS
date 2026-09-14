import { SITE_MAP } from "public/siteMap.js";
// /src/backend/SKANDI_CORE/customerSupport.js
// SKANDI R-007.3 — canonical Customer Support + Alexandra + HelpDesk business core.
// Chatwoot is the case/message source of truth. Wix CMS stores SKANDI routing/config/link metadata only.
// LiveKit is realtime transport only; every customer/agent message is persisted to Chatwoot before realtime fanout.


import wixData from "wix-data";
import { currentMember } from "wix-members-backend";
import { fetch } from "wix-fetch";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { createHash, randomUUID } from "crypto";
import { getStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth.js";
import { issueSupportLiveKitSessionCore, issueAlexandraLiveKitSessionCore } from "backend/SKANDI_CORE/livekitServer.js";


const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const OPTS = { suppressAuth: true, suppressHooks: false };


const CMS = Object.freeze({
  links: "SupportCaseLinks",
  categories: "SupportCategories",
  routing: "SupportInboxRouting",
  articles: "SupportHelpArticles",
  events: "SupportCaseEvents"
});


const SUPPORT_PERMISSION_TOKENS = new Set([
  "customer-support", "customer_service", "customer-service", "customer support",
  "support", "support-agent", "support_admin", "support-admin", "contact-center",
  "customer-support.read", "customer-support.write", "customer-service-agent",
  "/riaintra/customer-service"
]);


const LEGACY_CATEGORY_ALIASES = Object.freeze({ claim: "refund" });
const ROUTING_FALLBACKS = Object.freeze({
  baggage: ["baggage", "claim"],
  refund: ["refund", "claim"],
  flight: ["flight", "booking"],
  hotel: ["hotel", "booking"],
  tech: ["tech", "general"],
  documents: ["documents", "booking"],
  payment: ["payment", "booking"],
  club: ["club", "general"],
  booking: ["booking"],
  general: ["general"]
});


const BASE_WORKFLOWS = Object.freeze({
  general: {
    key: "general",
    title: "General Support",
    summary: "General questions that do not fit another category.",
    topics: [
      { key: "general-question", title: "General Question" },
      { key: "feedback", title: "Feedback" },
      { key: "other", title: "Other" }
    ],
    requiredFields: ["subject", "message"]
  },
  booking: {
    key: "booking",
    title: "Booking Help",
    summary: "Existing SKANDI bookings, changes and booking questions.",
    topics: [
      { key: "manage-booking", title: "Manage My Booking" },
      { key: "booking-document", title: "Booking Document" },
      { key: "booking-other", title: "Other Booking Question" }
    ],
    requiredFields: ["subject", "message"]
  },
  flight: {
    key: "flight",
    title: "Flights",
    summary: "Flight changes, disruptions, connections and airline issues.",
    topics: [
      { key: "schedule-change", title: "Schedule Change / Cancellation" },
      { key: "name-correction", title: "Name Correction" },
      { key: "missed-connection", title: "Missed Connection" },
      { key: "upgrade-inquiry", title: "Upgrade Inquiry" }
    ],
    requiredFields: ["flightAirline", "flightNumber", "depAirport", "arrAirport", "subject", "message"]
  },
  baggage: {
    key: "baggage",
    title: "Baggage",
    summary: "Delayed, damaged or missing baggage and property.",
    topics: [
      { key: "delayed-baggage", title: "Delayed Baggage" },
      { key: "damaged-baggage", title: "Damaged Baggage" },
      { key: "lost-items-on-board", title: "Lost Items on Board" }
    ],
    requiredFields: ["bagType", "bagColor", "bagBrand", "subject", "message"],
    conditionalRequirements: [
      { when: { field: "hasPir", equals: "yes" }, required: ["pirNumber"] }
    ],
    guidance: {
      noPir: "A SKANDI support case does not replace the formal baggage irregularity report required by the operating airline or airport ground handler. If no PIR has been filed, the traveler should report the missing/damaged checked baggage to the operating carrier or baggage service as soon as possible."
    }
  },
  hotel: {
    key: "hotel",
    title: "Hotel & Destination",
    summary: "Hotel, room, destination and in-resort support.",
    topics: [
      { key: "room-modification", title: "Room Modification" },
      { key: "check-in-issue", title: "Check-in Issue" },
      { key: "quality-complaint", title: "Quality Complaint" }
    ],
    requiredFields: ["subject", "message"]
  },
  refund: {
    key: "refund",
    title: "Refunds & Compensation",
    summary: "Refund, compensation and duplicate-charge requests.",
    topics: [
      { key: "flight-delay-compensation", title: "Flight Delay / Compensation" },
      { key: "cancelled-trip-refund", title: "Cancelled Trip Refund" },
      { key: "duplicate-charge", title: "Duplicate Charge" }
    ],
    requiredFields: ["subject", "message"]
  },
  documents: {
    key: "documents",
    title: "Travel Documents",
    summary: "Booking confirmations, tickets, vouchers and travel documents.",
    topics: [
      { key: "missing-document", title: "Missing Travel Document" },
      { key: "incorrect-document", title: "Incorrect Travel Document" },
      { key: "document-question", title: "Document Question" }
    ],
    requiredFields: ["subject", "message"]
  },
  payment: {
    key: "payment",
    title: "Payment",
    summary: "Payment, receipts and billing questions.",
    topics: [
      { key: "payment-failed", title: "Payment Failed" },
      { key: "receipt-invoice", title: "Receipt / Invoice" },
      { key: "payment-other", title: "Other Payment Question" }
    ],
    requiredFields: ["subject", "message"]
  },
  club: {
    key: "club",
    title: "SKANDI Club",
    summary: "Membership, points, tier and account questions.",
    topics: [
      { key: "points", title: "Points" },
      { key: "tier", title: "Membership Tier" },
      { key: "club-account", title: "Club Account" }
    ],
    requiredFields: ["subject", "message"]
  },
  tech: {
    key: "tech",
    title: "Technical & Account",
    summary: "Website, app, account and sign-in issues.",
    topics: [
      { key: "cannot-access-account", title: "Cannot Access Account" },
      { key: "booking-error", title: "Error During Booking" },
      { key: "website-issue", title: "Other Website Issue" }
    ],
    requiredFields: ["subject", "message"]
  }
});


function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value, max = 5000) { return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, max); }
function lower(value, max = 5000) { return clean(value, max).toLowerCase(); }
function upper(value, max = 5000) { return clean(value, max).toUpperCase(); }
function now() { return new Date(); }
function nowIso() { return new Date().toISOString(); }
function truthy(value) { return value === true || value === 1 || value === "1" || lower(value) === "true" || lower(value) === "yes"; }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value, 254)); }
function makeCaseRef() { return `SKS-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`; }
function normalizePriority(value) { const v = lower(value, 20); return ["low", "normal", "high", "urgent"].includes(v) ? v : "normal"; }
function normalizeStatus(value) { const v = lower(value, 30).replace(/_/g, "-"); return ["new", "open", "pending", "on-hold", "solved", "resolved", "closed"].includes(v) ? (v === "resolved" ? "solved" : v) : "open"; }
function initials(name) { return clean(name, 120).split(/\s+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase(); }


async function readSecret(name, fallback = "", required = false) {
  try {
    const result = await elevatedGetSecretValue(name);
    const raw = typeof result === "string" ? result : result?.value ?? result?.secretValue ?? result?.secret?.value ?? "";
    const value = clean(raw, 12000);
    if (value) return value;
  } catch (_) {}
  if (required) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return fallback;
}


let configPromise = null;
async function config() {
  if (!configPromise) {
    configPromise = (async () => {
      const [baseUrl, accountIdRaw, apiToken, defaultInboxRaw, legacyInboxRaw, websiteToken, websiteInboxIdentifier] = await Promise.all([
        readSecret("CHATWOOT_BASE_URL", "https://app.chatwoot.com"),
        readSecret("CHATWOOT_ACCOUNT_ID", "", true),
        readSecret("CHATWOOT_API_ACCESS_TOKEN", "", true),
        readSecret("CHATWOOT_DEFAULT_INBOX_ID", ""),
        readSecret("CHATWOOT_INBOX_ID", ""),
        readSecret("CHATWOOT_WEBSITE_TOKEN", ""),
        readSecret("CHATWOOT_WEBSITE_INBOX_IDENTIFIER", "")
      ]);
      const accountId = Number(accountIdRaw);
      const defaultInboxId = Number(defaultInboxRaw || legacyInboxRaw || 0);
      if (!/^https:\/\//i.test(baseUrl) || !Number.isInteger(accountId) || accountId <= 0 || !apiToken) {
        throw new Error("CHATWOOT_CONFIGURATION_INVALID");
      }
      return {
        baseUrl: baseUrl.replace(/\/+$/, ""),
        accountId,
        apiToken,
        defaultInboxId: Number.isInteger(defaultInboxId) && defaultInboxId > 0 ? defaultInboxId : 0,
        websiteToken,
        websiteInboxIdentifier
      };
    })().catch(error => { configPromise = null; throw error; });
  }
  return configPromise;
}


function queryString(query = {}) {
  const pairs = [];
  for (const [key, raw] of Object.entries(query || {})) {
    if (raw === undefined || raw === null || raw === "") continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return pairs.length ? `?${pairs.join("&")}` : "";
}


async function chatwootRequest(path, { method = "GET", body, query } = {}) {
  const c = await config();
  const response = await fetch(`${c.baseUrl}${path}${queryString(query)}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      api_access_token: c.apiToken
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
  if (!response.ok) {
    const error = new Error(clean(data?.message || data?.description || data?.error || `CHATWOOT_HTTP_${response.status}`, 800));
    error.code = `CHATWOOT_HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }
  return data;
}


async function memberSafe() {
  try { return await currentMember.getMember({ fieldsets: ["FULL"] }); } catch (_) { return null; }
}


function memberProfile(member) {
  if (!member?._id) return { loggedIn: false, memberId: "", email: "", firstName: "", lastName: "", displayName: "", phone: "" };
  const profile = obj(member.profile);
  const contact = obj(member.contactDetails);
  const email = clean(member.loginEmail || arr(contact.emails)[0] || contact.email, 254).toLowerCase();
  const firstName = clean(profile.firstName || contact.firstName, 100);
  const lastName = clean(profile.lastName || contact.lastName, 100);
  const displayName = clean(profile.nickname || profile.name || [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0], 200);
  const phone = clean(profile.phone || arr(contact.phones)[0] || contact.phone, 80);
  return { loggedIn: true, memberId: member._id, email, firstName, lastName, displayName, phone };
}


function profileFromTrustedCustomer(customer = {}) {
  const firstName = clean(customer.firstName || customer.first_name, 100);
  const lastName = clean(customer.lastName || customer.last_name, 100);
  const email = clean(customer.email, 254).toLowerCase();
  const displayName = clean(customer.displayName || customer.name || [firstName, lastName].filter(Boolean).join(" ") || (email ? email.split("@")[0] : "Traveler"), 200);
  return {
    loggedIn: Boolean(clean(customer.memberId || customer.member_id, 200)),
    memberId: clean(customer.memberId || customer.member_id, 200),
    email,
    firstName,
    lastName,
    displayName,
    phone: clean(customer.phone, 80)
  };
}


async function audit(eventType, payload = {}, actor = {}) {
  try {
    await wixData.insert(CMS.events, {
      eventType: clean(eventType, 120),
      payload,
      actorMemberId: clean(actor.memberId || actor.id, 200),
      actorEmail: clean(actor.email, 254),
      actorName: clean(actor.displayName || actor.name, 200),
      createdAt: now()
    }, OPTS);
  } catch (_) {}
}


async function cmsCategories() {
  try {
    const rows = await wixData.query(CMS.categories).ne("active", false).ascending("sortOrder").limit(1000).find(OPTS);
    return rows.items || [];
  } catch (_) { return []; }
}


function safeJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch (_) { return null; }
}


async function supportWorkflows() {
  const workflows = Object.fromEntries(Object.entries(BASE_WORKFLOWS).map(([key, value]) => [key, JSON.parse(JSON.stringify(value))]));
  const categories = await cmsCategories();
  for (const row of categories) {
    const rawKey = lower(row.key || row.slug || row.title, 80).replace(/\s+/g, "-");
    if (!rawKey) continue;
    const key = LEGACY_CATEGORY_ALIASES[rawKey] || rawKey;
    const existing = workflows[key] || { key, title: clean(row.title || key, 120), summary: clean(row.summary || row.description, 500), topics: [], requiredFields: ["subject", "message"] };
    existing.title = clean(row.title || existing.title, 120);
    existing.summary = clean(row.summary || row.description || existing.summary, 500);
    const wf = safeJson(row.workflowJson || row.workflow || row.formSchema);
    const topics = safeJson(row.subcategoriesJson || row.topicsJson || row.topics);
    if (wf && typeof wf === "object") Object.assign(existing, wf, { key });
    if (Array.isArray(topics)) existing.topics = topics.map(t => typeof t === "string" ? { key: lower(t, 80).replace(/[^a-z0-9]+/g, "-"), title: clean(t, 160) } : { key: clean(t.key || t.id || t.value, 80), title: clean(t.title || t.label || t.key, 160) }).filter(t => t.key && t.title);
    workflows[key] = existing;
  }
  return workflows;
}


export async function getSupportWorkflowCore({ category = "" } = {}) {
  const workflows = await supportWorkflows();
  const key = lower(category, 80);
  return key ? { workflow: workflows[key] || workflows.general, workflows: Object.values(workflows) } : { workflows: Object.values(workflows) };
}


async function helpArticles() {
  try {
    const rows = await wixData.query(CMS.articles).ne("active", false).ascending("sortOrder").limit(1000).find(OPTS);
    return (rows.items || []).map(row => ({
      id: row._id,
      title: clean(row.title, 240),
      summary: clean(row.summary || row.description, 1000),
      excerpt: clean(row.summary || row.description, 1000),
      category: clean(row.category, 120),
      keywords: clean(row.keywords, 1000),
      path: clean(row.path || row.url, 1000),
      url: clean(row.path || row.url, 1000)
    }));
  } catch (_) { return []; }
}


async function routeForCategory(categoryKey) {
  const c = await config();
  const normalized = clean(categoryKey, 80);
  const candidates = ROUTING_FALLBACKS[normalized] || [normalized];
  for (const candidate of candidates) {
    try {
      const rows = await wixData.query(CMS.routing).eq("categoryKey", candidate).eq("active", true).limit(1).find(OPTS);
      const row = rows.items?.[0];
      if (row) {
        return {
          inboxId: Number(row.inboxId || c.defaultInboxId || 0),
          inboxKey: clean(row.inboxKey || candidate || "default", 120),
          defaultPriority: normalizePriority(row.defaultPriority),
          labels: arr(row.labels).length ? arr(row.labels).map(x => clean(x, 80)).filter(Boolean) : clean(row.labels, 1000).split(",").map(x => clean(x, 80)).filter(Boolean),
          matchedCategoryKey: candidate
        };
      }
    } catch (_) {}
  }
  return {
    inboxId: c.defaultInboxId,
    inboxKey: "default",
    defaultPriority: "normal",
    labels: [normalized].filter(Boolean),
    matchedCategoryKey: "default"
  };
}


function stableContactIdentifier(profile, email) {
  const seed = clean(profile?.memberId, 300) || clean(email, 254).toLowerCase();
  return `skandi-${createHash("sha256").update(seed || randomUUID()).digest("hex").slice(0, 32)}`;
}


function contactFromResponse(response = {}) {
  return response?.payload?.contact || response?.payload?.[0] || response?.contact || response?.data || response;
}


function conversationFromResponse(response = {}) {
  return response?.conversation || response?.payload?.conversation || response?.data?.conversation || response?.data || response;
}


async function searchContactByEmail(email) {
  const c = await config();
  if (!email) return null;
  try {
    const result = await chatwootRequest(`/api/v1/accounts/${c.accountId}/contacts/search`, { query: { q: email } });
    const rows = arr(result.payload || result.data || result);
    return rows.find(item => lower(item.email, 254) === lower(email, 254)) || null;
  } catch (_) { return null; }
}


function contactInboxSource(contact, inboxId) {
  const rows = arr(contact?.contact_inboxes || contact?.contactInboxes);
  const row = rows.find(item => Number(item?.inbox?.id || item?.inbox_id || item?.inboxId) === Number(inboxId));
  return clean(row?.source_id || row?.sourceId, 300);
}


async function ensureContactInbox(contact, inboxId) {
  const c = await config();
  const existing = contactInboxSource(contact, inboxId);
  if (existing) return existing;
  const sourceId = `skandi-${contact?.id || "contact"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const response = await chatwootRequest(`/api/v1/accounts/${c.accountId}/contacts/${contact.id}/contact_inboxes`, {
    method: "POST",
    body: { inbox_id: Number(inboxId), source_id: sourceId }
  });
  return clean(response?.source_id || response?.sourceId || sourceId, 300);
}


async function findOrCreateContact({ profile, name, email, phone, inboxId, bookingRef, pnr }) {
  const c = await config();
  let contact = await searchContactByEmail(email);
  if (!contact) {
    contact = contactFromResponse(await chatwootRequest(`/api/v1/accounts/${c.accountId}/contacts`, {
      method: "POST",
      body: {
        inbox_id: Number(inboxId),
        name: name || profile.displayName || email,
        email,
        phone_number: phone || profile.phone || undefined,
        identifier: stableContactIdentifier(profile, email),
        blocked: false,
        additional_attributes: { source: "SKANDI Travels" },
        custom_attributes: {
          skandiMemberId: profile.memberId || "",
          bookingRef: bookingRef || "",
          pnr: pnr || ""
        }
      }
    }));
  } else {
    try {
      await chatwootRequest(`/api/v1/accounts/${c.accountId}/contacts/${contact.id}`, {
        method: "PUT",
        body: {
          name: name || contact.name || profile.displayName || email,
          email,
          phone_number: phone || profile.phone || contact.phone_number || undefined,
          identifier: contact.identifier || stableContactIdentifier(profile, email),
          blocked: false,
          additional_attributes: { ...(obj(contact.additional_attributes)), source: "SKANDI Travels" },
          custom_attributes: {
            ...(obj(contact.custom_attributes)),
            skandiMemberId: profile.memberId || obj(contact.custom_attributes).skandiMemberId || "",
            bookingRef: bookingRef || obj(contact.custom_attributes).bookingRef || "",
            pnr: pnr || obj(contact.custom_attributes).pnr || ""
          }
        }
      });
    } catch (_) {}
  }
  if (!contact?.id) throw new Error("CHATWOOT_CONTACT_CREATE_FAILED");
  return { contact, sourceId: await ensureContactInbox(contact, inboxId) };
}


function workflowTopic(workflow, value) {
  const v = lower(value, 160).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return arr(workflow?.topics).find(topic => topic.key === v || lower(topic.title, 160).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === v) || null;
}


function fieldValue(input, field) { return clean(input?.[field], 5000); }


function validateCaseInput(raw = {}, workflows, { allowGenericCategory = true } = {}) {
  const input = { ...obj(raw) };
  input.firstName = clean(raw.firstName, 100);
  input.lastName = clean(raw.lastName, 100);
  input.fullName = clean(raw.fullName || raw.name || [input.firstName, input.lastName].filter(Boolean).join(" "), 200);
  input.email = lower(raw.email, 254);
  input.phone = clean(raw.phone, 80);
  input.category = lower(raw.category || "general", 80).replace(/\s+/g, "-");
  input.subCategory = clean(raw.subCategory || raw.topic || "", 160);
  input.subject = clean(raw.subject, 240);
  input.message = clean(raw.message || raw.description, 12000);
  input.bookingRef = upper(raw.bookingRef || raw.pnr, 80);
  input.pnr = upper(raw.pnr || raw.bookingRef, 80);
  input.source = clean(raw.source || raw.sourcePage || "support", 120);
  input.sourcePage = clean(raw.sourcePage || "/about/support", 300);
  input.hasBooking = lower(raw.hasBooking, 20);
  input.hasPir = lower(raw.hasPir, 20);
  input.attachedFileNames = arr(raw.attachedFileNames).slice(0, 3).map(x => clean(x, 240));
  input.attachedFileUrls = arr(raw.attachedFileUrls).slice(0, 3).map(x => clean(x, 2000));


  if (!input.fullName) throw new Error("SUPPORT_NAME_REQUIRED");
  if (!validEmail(input.email)) throw new Error("SUPPORT_EMAIL_INVALID");
  if (input.subject.length < 3) throw new Error("SUPPORT_SUBJECT_REQUIRED");
  if (input.message.length < 5) throw new Error("SUPPORT_MESSAGE_REQUIRED");
  if (input.hasBooking === "yes" && !input.bookingRef) throw new Error("SUPPORT_BOOKING_REFERENCE_REQUIRED");


  const workflow = workflows[input.category] || (allowGenericCategory ? workflows.general : null);
  if (!workflow) throw new Error("SUPPORT_CATEGORY_INVALID");
  if (workflow !== workflows.general && arr(workflow.topics).length && input.subCategory && !workflowTopic(workflow, input.subCategory)) {
    throw new Error("SUPPORT_TOPIC_INVALID");
  }
  for (const field of arr(workflow.requiredFields)) {
    if (!fieldValue(input, field)) throw new Error(`SUPPORT_FIELD_REQUIRED_${String(field).toUpperCase()}`);
  }
  for (const rule of arr(workflow.conditionalRequirements)) {
    if (lower(input[rule?.when?.field], 100) === lower(rule?.when?.equals, 100)) {
      for (const field of arr(rule.required)) if (!fieldValue(input, field)) throw new Error(`SUPPORT_FIELD_REQUIRED_${String(field).toUpperCase()}`);
    }
  }
  return { input, workflow };
}


function line(label, value) {
  if (Array.isArray(value)) value = value.filter(Boolean).join(", ");
  const text = clean(value, 4000);
  return text ? `**${label}:** ${text}` : "";
}
function section(title, rows) {
  const lines = rows.filter(Boolean);
  return lines.length ? [`\n### ${title}`, ...lines] : [];
}


function buildInitialMessage(input, workflow) {
  const topic = workflowTopic(workflow, input.subCategory);
  const lines = [
    `# ${input.subject}`,
    input.message,
    ...section("Customer", [
      line("Name", input.fullName), line("Email", input.email), line("Phone", input.phone),
      line("Nationality", input.nationality), line("Country of residence", input.countryOfResidence)
    ]),
    ...section("Request", [
      line("Category", workflow.title || input.category), line("Topic", topic?.title || input.subCategory), line("Source", input.source)
    ]),
    ...section("Booking / Trip", [
      line("Booking reference", input.bookingRef), line("Supplier", input.supplier), line("Travel date", input.travelDate), line("Destination", input.destination)
    ]),
    ...section("Flight", [
      line("Operating airline", input.flightAirline), line("Flight number", input.flightNumber), line("Departure airport", input.depAirport), line("Arrival airport", input.arrAirport)
    ]),
    ...section("Baggage", [
      line("Formal PIR already filed", input.hasPir), line("PIR number", input.pirNumber), line("Bag tag", input.bagTag),
      line("Missing bags", input.missingBagCount), line("Bag type", input.bagType), line("Color", input.bagColor),
      line("Brand / distinguishing features", input.bagBrand), line("Delivery address", input.bagAddress),
      input.category === "baggage" && input.hasPir === "no" ? line("PIR guidance", workflow?.guidance?.noPir) : ""
    ]),
    ...section("Supporting files", [
      line("Selected filenames", input.attachedFileNames), line("Uploaded file links", input.attachedFileUrls)
    ])
  ];


  const genericSkip = new Set([
    "firstName","lastName","fullName","name","email","phone","nationality","countryOfResidence","category","subCategory","topic","subject","message","description","bookingRef","pnr","supplier","travelDate","destination","flightAirline","flightNumber","depAirport","arrAirport","hasPir","pirNumber","bagTag","missingBagCount","bagType","bagColor","bagBrand","bagAddress","attachedFileNames","attachedFileUrls","source","sourcePage","hasBooking","priority"
  ]);
  const extras = Object.entries(input).filter(([key, value]) => !genericSkip.has(key) && value !== undefined && value !== null && value !== "" && (typeof value === "string" || typeof value === "number" || typeof value === "boolean"));
  if (extras.length) lines.push(...section("Additional information", extras.map(([key, value]) => line(key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()), value))));
  return lines.filter(Boolean).join("\n").slice(0, 30000);
}


async function setLabelsBestEffort(conversationId, labels) {
  const c = await config();
  const cleanLabels = [...new Set(arr(labels).map(x => clean(x, 80)).filter(Boolean))];
  if (!cleanLabels.length) return;
  try {
    await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${conversationId}/labels`, { method: "POST", body: { labels: cleanLabels } });
  } catch (_) {}
}


async function findLocalCase(caseId) {
  try {
    const rows = await wixData.query(CMS.links).eq("chatwootConversationId", String(caseId)).limit(1).find(OPTS);
    return rows.items?.[0] || null;
  } catch (_) { return null; }
}


async function saveLocalCase(row) {
  try {
    return row?._id ? await wixData.update(CMS.links, row, OPTS) : await wixData.insert(CMS.links, row, OPTS);
  } catch (_) { return row; }
}


async function createCaseWithProfile(profile, rawInput, { allowGenericCategory = true, sourceOverride = "" } = {}) {
  const workflows = await supportWorkflows();
  const { input, workflow } = validateCaseInput({ ...rawInput, ...(sourceOverride ? { source: sourceOverride } : {}) }, workflows, { allowGenericCategory });
  if (profile?.email && lower(profile.email, 254) !== input.email && profile.loggedIn) throw new Error("SUPPORT_EMAIL_MEMBER_MISMATCH");


  const routing = await routeForCategory(input.category);
  const c = await config();
  const inboxId = Number(routing.inboxId || c.defaultInboxId || 0);
  if (!inboxId) throw new Error("CHATWOOT_INBOX_NOT_CONFIGURED");
  const caseRef = makeCaseRef();
  const { contact, sourceId } = await findOrCreateContact({
    profile: profile || {},
    name: input.fullName,
    email: input.email,
    phone: input.phone,
    inboxId,
    bookingRef: input.bookingRef,
    pnr: input.pnr
  });
  const created = conversationFromResponse(await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations`, {
    method: "POST",
    body: {
      inbox_id: inboxId,
      contact_id: contact.id,
      source_id: sourceId,
      status: "open",
      custom_attributes: {
        caseRef,
        subject: input.subject,
        category: input.category,
        subCategory: input.subCategory,
        bookingRef: input.bookingRef,
        pnr: input.pnr,
        sourcePage: input.sourcePage,
        source: input.source,
        priority: routing.defaultPriority,
        skandiMemberId: profile?.memberId || "",
        requesterType: upper(rawInput.requesterType || "CUSTOMER", 30),
        requesterSkId: clean(rawInput.requesterSkId, 80),
        requesterDepartment: clean(rawInput.requesterDepartment, 120),
        requesterBase: clean(rawInput.requesterBase, 80),
        sourceChannel: upper(rawInput.sourceChannel || input.source || "SUPPORT", 120)
      }
    }
  }));
  const conversationId = String(created?.id || created?.conversation_id || "");
  if (!conversationId) throw new Error("CHATWOOT_CASE_CREATE_FAILED");


  const messageResponse = await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${conversationId}/messages`, {
    method: "POST",
    body: {
      content: buildInitialMessage(input, workflow),
      message_type: "incoming",
      private: false,
      content_type: "text",
      content_attributes: { source: input.source, submission_id: randomUUID() }
    }
  });
  await setLabelsBestEffort(conversationId, [...routing.labels, input.category, input.subCategory].filter(Boolean));


  const local = await saveLocalCase({
    caseRef,
    memberId: profile?.memberId || "",
    email: input.email,
    customerName: input.fullName,
    chatwootContactId: String(contact.id || ""),
    chatwootConversationId: conversationId,
    subject: input.subject,
    category: input.category,
    priority: routing.defaultPriority,
    bookingRef: input.bookingRef,
    pnr: input.pnr,
    status: "open",
    inboxKey: routing.inboxKey || input.category,
    createdAt: now(),
    updatedAt: now()
  });


  await audit("CUSTOMER_CASE_CREATED", { caseRef, conversationId, category: input.category, bookingRef: input.bookingRef, source: input.source }, profile || {});
  return {
    ok: true,
    caseRef,
    caseId: conversationId,
    localId: local?._id || "",
    status: "open",
    priority: routing.defaultPriority,
    workflow: { key: workflow.key, title: workflow.title },
    sentMessage: normalizeMessage(messageResponse?.payload || messageResponse?.message || messageResponse)
  };
}


export async function getCustomerSupportBootstrapCore() {
  const member = await memberSafe();
  const profile = memberProfile(member);
  const c = await config();
  const { workflows } = await getSupportWorkflowCore();
  return {
    profile,
    loggedIn: profile.loggedIn,
    workflows,
    categories: workflows.map(item => ({ key: item.key, title: item.title, summary: item.summary })),
    articles: await helpArticles(),
    humanSupport: profile.loggedIn ? await getHumanSupportAvailabilityCore().catch(() => ({ status: "unknown", available: false, onlineAgents: 0 })) : { status: "sign-in-required", available: false, onlineAgents: 0 },
    widget: { enabled: Boolean(c.websiteToken), baseUrl: c.baseUrl, websiteToken: c.websiteToken }
  };
}


export async function getPublicSupportBootstrapCore({ page = "/about/support" } = {}) {
  const result = await getCustomerSupportBootstrapCore();
  return {
    ...result,
    supportContext: { page: clean(page || "/about/support", 300) }
  };
}


export async function createCustomerSupportCaseCore({ input = {} } = {}) {
  const profile = memberProfile(await memberSafe());
  const normalized = { ...obj(input) };
  if (profile.loggedIn) {
    normalized.firstName = normalized.firstName || profile.firstName;
    normalized.lastName = normalized.lastName || profile.lastName;
    normalized.fullName = normalized.fullName || profile.displayName;
    normalized.email = normalized.email || profile.email;
    normalized.phone = normalized.phone || profile.phone;
  }
  return createCaseWithProfile(profile, normalized, { allowGenericCategory: true });
}


export async function createPublicSupportCaseCore({ input = {} } = {}) {
  const profile = memberProfile(await memberSafe());
  return createCaseWithProfile(profile, { ...obj(input), sourcePage: clean(input.sourcePage || SITE_MAP.theStore, 300), source: clean(input.source || "store-customer-service", 120) }, { allowGenericCategory: true });
}


function assertCustomerOwnsLocalCase(local, profile) {
  if (!local || !profile?.loggedIn) throw new Error("SUPPORT_CASE_ACCESS_DENIED");
  const memberMatch = local.memberId && String(local.memberId) === String(profile.memberId);
  const emailMatch = local.email && lower(local.email, 254) === lower(profile.email, 254);
  if (!memberMatch && !emailMatch) throw new Error("SUPPORT_CASE_ACCESS_DENIED");
}


async function customerLocalCase(caseId, { adopt = false } = {}) {
  const profile = memberProfile(await memberSafe());
  if (!profile.loggedIn) throw new Error("SUPPORT_SIGN_IN_REQUIRED");
  const local = await findLocalCase(caseId);
  assertCustomerOwnsLocalCase(local, profile);
  if (adopt && !local.memberId && profile.memberId) await saveLocalCase({ ...local, memberId: profile.memberId, updatedAt: now() });
  return { profile, local };
}


export async function listCustomerSupportCasesCore() {
  const profile = memberProfile(await memberSafe());
  if (!profile.loggedIn) throw new Error("SUPPORT_SIGN_IN_REQUIRED");
  let query = wixData.query(CMS.links);
  query = profile.memberId ? query.eq("memberId", profile.memberId) : query.eq("email", profile.email);
  const rows = await query.descending("updatedAt").limit(100).find(OPTS).catch(() => ({ items: [] }));
  return {
    cases: (rows.items || []).map(row => ({
      caseId: row.chatwootConversationId,
      caseRef: row.caseRef,
      subject: row.subject,
      category: row.category,
      bookingRef: row.bookingRef,
      pnr: row.pnr,
      priority: row.priority,
      status: row.status,
      updatedAt: row.updatedAt
    }))
  };
}


function extractMessageRows(result) {
  return arr(result?.payload || result?.messages || result?.data?.payload || result?.data || result);
}


function normalizeMessage(message = {}) {
  const sender = obj(message.sender);
  const messageType = message.message_type;
  const outgoing = messageType === 1 || lower(messageType, 40) === "outgoing";
  const activity = messageType === 2 || lower(messageType, 40) === "activity";
  const privateNote = message.private === true;
  return {
    id: String(message.id || message.message_id || ""),
    messageId: String(message.id || message.message_id || ""),
    content: clean(message.content || message.text || message.message, 30000),
    body: clean(message.content || message.text || message.message, 30000),
    senderType: outgoing ? "agent" : "customer",
    senderName: clean(sender.name || sender.available_name || (outgoing ? "SKANDI Customer Service" : "Traveler"), 200),
    sender: clean(sender.name || sender.available_name || (outgoing ? "SKANDI Customer Service" : "Traveler"), 200),
    createdAt: message.created_at || message.createdAt || nowIso(),
    at: message.created_at || message.createdAt || nowIso(),
    private: privateNote,
    kind: privateNote || activity ? "internal" : "public",
    channel: privateNote ? "internal" : "chat",
    message_type: messageType
  };
}


async function conversationById(caseId) {
  const c = await config();
  return chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${encodeURIComponent(String(caseId))}`);
}


async function messagesByCaseId(caseId) {
  const c = await config();
  const result = await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${encodeURIComponent(String(caseId))}/messages`);
  return extractMessageRows(result).map(normalizeMessage);
}


function normalizeConversation(conv = {}, local = {}) {
  const meta = obj(conv.meta);
  const sender = obj(meta.sender || conv.contact);
  const assignee = obj(meta.assignee || conv.assignee);
  const attrs = obj(conv.custom_attributes || local.customAttributes);
  const inbox = obj(conv.inbox);
  const priority = normalizePriority(local.priority || attrs.priority || conv.priority);
  const status = normalizeStatus(conv.status || local.status);
  const channel = attrs.liveHandoff === true || truthy(attrs.liveHandoff) ? "chat" : lower(inbox.channel_type || conv.channel || conv.source, 80).includes("email") ? "email" : "chat";
  const requesterType = upper(attrs.requesterType || "CUSTOMER", 30);
  const sourceChannel = upper(attrs.sourceChannel || attrs.source || "", 120);
  const channelLabel = requesterType === "STAFF"
    ? "Internal HelpDesk"
    : sourceChannel.includes("ALEXANDRA")
      ? "Alexandra handoff"
      : channel === "chat" ? "Live chat / Support" : "Email";
  return {
    id: String(conv.id || local.chatwootConversationId || local._id || ""),
    externalId: String(conv.id || local.chatwootConversationId || local._id || ""),
    caseId: String(conv.id || local.chatwootConversationId || local._id || ""),
    localId: local._id || "",
    caseRef: local.caseRef || attrs.caseRef || `CW-${conv.id || ""}`,
    subject: local.subject || attrs.subject || conv.additional_attributes?.mail_subject || conv.subject || "Support case",
    status,
    priority,
    category: local.category || attrs.category || "general",
    bookingRef: local.bookingRef || attrs.bookingRef || "",
    pnr: local.pnr || attrs.pnr || "",
    customerName: local.customerName || sender.name || "",
    email: local.email || sender.email || "",
    phone: sender.phone_number || "",
    requester: { id: sender.id, name: local.customerName || sender.name || "Traveler", email: local.email || sender.email || "", phone: sender.phone_number || "" },
    customer: { id: sender.id, name: local.customerName || sender.name || "Traveler", email: local.email || sender.email || "", phone: sender.phone_number || "" },
    assignee: assignee?.id ? { id: assignee.id, name: assignee.name || assignee.available_name || "Support Agent", email: assignee.email || "" } : null,
    assigneeId: assignee?.id || null,
    inboxName: inbox.name || local.inboxKey || "",
    group: inbox.name || local.inboxKey || "",
    queue: priority === "urgent" ? "urgent" : "open",
    source: sourceChannel ? lower(sourceChannel, 120) : channel,
    sourceChannel,
    requesterType,
    channel,
    channelLabel,
    type: "question",
    tags: arr(conv.labels || attrs.labels),
    tier: attrs.clubTier || "",
    createdAt: conv.created_at || local.createdAt || "",
    updatedAt: conv.last_activity_at || conv.updated_at || local.updatedAt || "",
    lastActivityAt: conv.last_activity_at || local.updatedAt || "",
    unread: Number(conv.unread_count || 0) > 0,
    custom_attributes: attrs,
    raw: { id: conv.id }
  };
}


export async function getCustomerSupportCaseCore({ caseId } = {}) {
  const id = clean(caseId, 160);
  const { local } = await customerLocalCase(id, { adopt: true });
  const messages = await messagesByCaseId(id);
  return {
    case: { caseId: id, caseRef: local.caseRef, subject: local.subject, category: local.category, bookingRef: local.bookingRef, pnr: local.pnr, status: local.status, priority: local.priority },
    messages
  };
}


async function createChatwootMessage(caseId, { content, outgoing = false, privateNote = false, source = "support" } = {}) {
  const c = await config();
  const text = clean(content, 30000);
  if (!text) throw new Error("SUPPORT_MESSAGE_REQUIRED");
  const response = await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${encodeURIComponent(String(caseId))}/messages`, {
    method: "POST",
    body: {
      content: text,
      message_type: outgoing ? "outgoing" : "incoming",
      private: Boolean(privateNote),
      content_type: "text",
      content_attributes: { source, submission_id: randomUUID() }
    }
  });
  const raw = response?.payload || response?.message || response?.data || response;
  return normalizeMessage(raw);
}


export async function addCustomerSupportMessageCore({ caseId, content, source = "customer-portal" } = {}) {
  const id = clean(caseId, 160);
  const { profile, local } = await customerLocalCase(id, { adopt: true });
  const sentMessage = await createChatwootMessage(id, { content, outgoing: false, privateNote: false, source });
  await saveLocalCase({ ...local, status: "open", updatedAt: now() });
  await audit("CUSTOMER_CASE_REPLIED", { caseId: id, caseRef: local.caseRef, source }, profile);
  return { ok: true, caseId: id, sentMessage };
}


function permissionValues(session = {}) {
  const profile = obj(session.profile);
  const values = [
    ...arr(session.permissionKeys), ...arr(session.permissions), ...arr(session.allowedApps), ...arr(session.permissionGroups),
    ...arr(profile.permissionKeys), ...arr(profile.permissions), ...arr(profile.allowedApps), ...arr(profile.permissionGroups),
    session.accessRole, profile.accessRole
  ];
  return new Set(values.flatMap(value => typeof value === "string" ? [value] : value && typeof value === "object" ? [value.id, value.key, value.name, value.permission] : []).map(value => lower(value, 160)).filter(Boolean));
}


export async function requireSupportAgentCore() {
  const session = await getStaffPortalSessionCore();
  if (!session?.loggedIn || !session?.authorized) throw new Error("SUPPORT_AGENT_AUTH_REQUIRED");
  const profile = obj(session.profile);
  const permissions = permissionValues(session);
  const all = lower(session.permissionPreset || profile.permissionPreset, 80) === "all" || permissions.has("system-admin") || permissions.has("all");
  const support = all || [...permissions].some(token => SUPPORT_PERMISSION_TOKENS.has(token) || token.includes("customer-support") || token.includes("customer_service") || token.includes("customer-service"));
  if (!support) throw new Error("SUPPORT_AGENT_ACCESS_DENIED");
  return {
    memberId: clean(profile.memberId || profile.wixMemberId || profile.wix_member_id || profile.id, 200),
    id: clean(profile.id || profile.agentUserId || profile.agent_user_id, 200),
    skId: clean(profile.skId || profile.sk_id, 80),
    email: lower(profile.email || session.email, 254),
    name: clean(profile.displayName || profile.preferredName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "Support Agent", 200),
    displayName: clean(profile.displayName || profile.preferredName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "Support Agent", 200),
    permissionPreset: clean(session.permissionPreset || profile.permissionPreset, 80),
    permissionKeys: [...permissions]
  };
}


async function chatwootAgents() {
  const c = await config();
  try {
    const result = await chatwootRequest(`/api/v1/accounts/${c.accountId}/agents`);
    const rows = arr(result?.payload || result?.data || result);
    return rows.map(agent => ({
      id: Number(agent.id),
      name: clean(agent.name || agent.available_name || agent.email || "Support Agent", 200),
      email: lower(agent.email, 254),
      role: "agent",
      availability: lower(agent.availability_status || agent.status || "unknown", 40),
      group: clean(agent.role || "Customer Service", 120),
      initials: initials(agent.name || agent.available_name || agent.email)
    })).filter(agent => Number.isFinite(agent.id));
  } catch (_) { return []; }
}


export async function getHumanSupportAvailabilityCore() {
  const agents = await chatwootAgents();
  if (!agents.length) return { status: "unknown", available: false, onlineAgents: 0 };
  const online = agents.filter(agent => ["online", "available"].includes(agent.availability));
  return { status: online.length ? "online" : "offline", available: online.length > 0, onlineAgents: online.length };
}


export async function getAgentSupportBootstrapCore() {
  const agent = await requireSupportAgentCore();
  const agents = await chatwootAgents();
  const me = agents.find(item => agent.email && item.email === agent.email);
  await audit("AGENT_SUPPORT_OPENED", {}, agent);
  return {
    session: {
      agentId: me?.id || null,
      agentName: agent.name,
      agentEmail: agent.email,
      agentInitials: initials(agent.name),
      skId: agent.skId
    },
    agent: { id: me?.id || null, name: agent.name, email: agent.email, initials: initials(agent.name), role: "agent" },
    agents,
    users: agents,
    groups: [],
    articles: await helpArticles(),
    macros: [],
    triggers: [],
    automations: [],
    humanSupport: await getHumanSupportAvailabilityCore()
  };
}


async function localCaseMap() {
  try {
    const rows = await wixData.query(CMS.links).descending("updatedAt").limit(1000).find(OPTS);
    return new Map((rows.items || []).map(row => [String(row.chatwootConversationId), row]));
  } catch (_) { return new Map(); }
}


function conversationRows(result) {
  const candidates = [result?.data?.payload, result?.data, result?.payload, result?.conversations, result];
  return candidates.find(Array.isArray) || [];
}


export async function listAgentSupportCasesCore({ queue = "open", query = "", view = "" } = {}) {
  const agent = await requireSupportAgentCore();
  const c = await config();
  const qName = lower(queue || view || "open", 80);
  const status = ["solved", "closed", "pending"].includes(qName) ? qName : qName === "all" ? "all" : "open";
  const result = await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations`, { query: { status } });
  const locals = await localCaseMap();
  const q = lower(query, 300);
  let cases = conversationRows(result).map(conv => normalizeConversation(conv, locals.get(String(conv.id)) || {}));
  if (qName === "urgent") cases = cases.filter(item => item.priority === "urgent");
  if (qName === "mine") cases = cases.filter(item => lower(item.assignee?.email, 254) === agent.email || lower(item.assignee?.name, 200) === lower(agent.name, 200));
  if (q && qName !== "mine" && qName !== "urgent") cases = cases.filter(item => lower([item.caseRef,item.subject,item.email,item.customerName,item.bookingRef,item.pnr,item.category].join(" "), 3000).includes(q));
  await audit("AGENT_CASE_LISTED", { queue: qName, count: cases.length }, agent);
  return { cases };
}


export async function getAgentSupportCaseCore({ caseId } = {}) {
  const agent = await requireSupportAgentCore();
  const id = clean(caseId, 160);
  if (!id) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  const [conv, local, history] = await Promise.all([conversationById(id), findLocalCase(id), messagesByCaseId(id)]);
  const supportCase = normalizeConversation(conv, local || {});
  supportCase.history = history;
  supportCase.conversationHistory = history;
  const livekitSession = await issueSupportLiveKitSessionCore({
    caseId: id,
    role: "agent",
    subjectId: agent.skId || agent.id || agent.email,
    participantName: agent.name
  }).catch(() => null);
  await audit("AGENT_CASE_OPENED", { caseId: id }, agent);
  return { case: supportCase, messages: history, livekitSession };
}


export async function replyAgentSupportCaseCore({ caseId, content, privateNote = false } = {}) {
  const agent = await requireSupportAgentCore();
  const id = clean(caseId, 160);
  const sentMessage = await createChatwootMessage(id, { content, outgoing: true, privateNote: Boolean(privateNote), source: privateNote ? "agent-internal-note" : "agent-reply" });
  const local = await findLocalCase(id);
  if (local) await saveLocalCase({ ...local, updatedAt: now() });
  const livekitSession = privateNote ? null : await issueSupportLiveKitSessionCore({ caseId: id, role: "agent", subjectId: agent.skId || agent.id || agent.email, participantName: agent.name }).catch(() => null);
  await audit(privateNote ? "AGENT_INTERNAL_NOTE_ADDED" : "AGENT_CASE_REPLIED", { caseId: id }, agent);
  return { ok: true, caseId: id, sentMessage, privateNote: Boolean(privateNote), livekitSession };
}


export async function updateAgentSupportCaseCore({ caseId, status, priority, label, updates = {} } = {}) {
  const agent = await requireSupportAgentCore();
  const id = clean(caseId, 160);
  const requested = { ...obj(updates) };
  if (status !== undefined) requested.status = status;
  if (priority !== undefined) requested.priority = priority;
  if (label !== undefined) requested.label = label;
  const c = await config();


  if (requested.action === "INTERNAL_NOTE" && requested.internalNote?.content) {
    await createChatwootMessage(id, { content: requested.internalNote.content, outgoing: true, privateNote: true, source: "agent-internal-note" });
  }
  if (requested.action === "TALK_CALL" && requested.call) {
    const call = obj(requested.call);
    await createChatwootMessage(id, {
      content: `Call disposition\nOutcome: ${clean(call.outcome, 200)}\nDuration: ${Number(call.duration || 0)} seconds\n${clean(call.message?.body || call.notes, 5000)}`,
      outgoing: true,
      privateNote: true,
      source: "agent-call-disposition"
    });
  }
  if (requested.status) {
    const normalized = normalizeStatus(requested.status);
    const chatwootStatus = normalized === "on-hold" ? "pending" : normalized === "closed" ? "resolved" : normalized === "solved" ? "resolved" : normalized;
    await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${id}`, { method: "PATCH", body: { status: chatwootStatus } });
  }
  if (requested.priority) {
    try { await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${id}`, { method: "PATCH", body: { priority: normalizePriority(requested.priority) } }); } catch (_) {}
  }
  if (requested.label) await setLabelsBestEffort(id, [requested.label]);


  const local = await findLocalCase(id);
  if (local) {
    await saveLocalCase({
      ...local,
      status: requested.status ? normalizeStatus(requested.status) : local.status,
      priority: requested.priority ? normalizePriority(requested.priority) : local.priority,
      updatedAt: now()
    });
  }
  await audit("AGENT_CASE_UPDATED", { caseId: id, status: requested.status, priority: requested.priority, label: requested.label, action: requested.action }, agent);
  return { ok: true, caseId: id, status: requested.status, priority: requested.priority };
}


export async function createAgentSupportCaseCore({ case: rawCase = {}, input = {} } = {}) {
  const agent = await requireSupportAgentCore();
  const raw = { ...obj(rawCase), ...obj(input) };
  const requester = obj(raw.requester || raw.customer);
  const created = await createCaseWithProfile({ loggedIn: false, memberId: "", email: lower(requester.email || raw.email, 254), displayName: clean(requester.name || raw.customerName || "Traveler", 200), phone: clean(requester.phone || raw.phone, 80) }, {
    fullName: requester.name || raw.customerName || "Traveler",
    email: requester.email || raw.email,
    phone: requester.phone || raw.phone,
    category: raw.category || "general",
    subCategory: raw.subCategory || "agent-created",
    subject: raw.subject || "Customer Service Case",
    message: raw.summary || raw.message || raw.history?.[0]?.body || "Case created by SKANDI Customer Service.",
    bookingRef: raw.bookingRef || raw.pnr,
    pnr: raw.pnr || raw.bookingRef,
    source: "agent-created",
    sourcePage: "/riaintra/customer-service"
  }, { allowGenericCategory: true });
  await audit("AGENT_CASE_CREATED", { caseId: created.caseId, caseRef: created.caseRef }, agent);
  return getAgentSupportCaseCore({ caseId: created.caseId });
}


async function addHumanHandoffNote(caseId, details = {}) {
  const text = [
    "Alexandra / customer requested a human handoff.",
    details.reason ? `Reason: ${clean(details.reason, 2000)}` : "",
    details.summary ? `Conversation summary: ${clean(details.summary, 6000)}` : "",
    details.collectedFields && Object.keys(obj(details.collectedFields)).length ? `Collected fields:\n${JSON.stringify(details.collectedFields, null, 2).slice(0, 10000)}` : "",
    details.transcript ? `Conversation transcript / excerpt:\n${typeof details.transcript === "string" ? clean(details.transcript, 12000) : JSON.stringify(details.transcript, null, 2).slice(0, 12000)}` : ""
  ].filter(Boolean).join("\n\n");
  await createChatwootMessage(caseId, { content: text, outgoing: true, privateNote: true, source: "human-handoff" });
  await setLabelsBestEffort(caseId, ["human-handoff", "alexandra-handoff"]);
  const c = await config();
  try {
    const conv = await conversationById(caseId);
    await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${caseId}`, {
      method: "PATCH",
      body: {
        status: "open",
        custom_attributes: {
          ...obj(conv?.custom_attributes),
          liveHandoff: true,
          handoffRequestedAt: nowIso(),
          handoffSource: clean(details.source || "support", 80)
        }
      }
    });
  } catch (_) {}
}


export async function requestCustomerHumanHandoffCore({ caseId = "", input = {}, reason = "Customer requested a human agent.", summary = "", collectedFields = {}, transcript = "" } = {}) {
  const profile = memberProfile(await memberSafe());
  if (!profile.loggedIn) throw new Error("SUPPORT_SIGN_IN_REQUIRED");
  let id = clean(caseId, 160);
  let created = null;
  if (!id) {
    created = await createCaseWithProfile(profile, {
      fullName: profile.displayName,
      email: profile.email,
      phone: profile.phone,
      category: "general",
      subCategory: "general-question",
      subject: clean(input.subject || "Live Customer Service Request", 240),
      message: clean(input.message || "I would like to chat with a Human SKANDI Customer Service Agent.", 12000),
      bookingRef: clean(input.bookingRef || input.pnr, 80),
      pnr: clean(input.pnr || input.bookingRef, 80),
      requestedSupportCategory: clean(input.category, 80),
      requestedSupportTopic: clean(input.subCategory, 160),
      source: "human-live-chat",
      sourcePage: "/about/support"
    }, { allowGenericCategory: true });
    id = created.caseId;
  } else {
    await customerLocalCase(id, { adopt: true });
  }
  await addHumanHandoffNote(id, { reason, summary, collectedFields, transcript, source: "customer-help" });
  const availability = await getHumanSupportAvailabilityCore().catch(() => ({ status: "unknown", available: false, onlineAgents: 0 }));
  const livekitSession = availability.available ? await issueSupportLiveKitSessionCore({ caseId: id, role: "customer", subjectId: profile.memberId || profile.email, participantName: profile.displayName || "Traveler" }) : null;
  await audit("CUSTOMER_HUMAN_HANDOFF_REQUESTED", { caseId: id, availability: availability.status }, profile);
  return {
    ok: true,
    caseId: id,
    caseRef: created?.caseRef || (await findLocalCase(id))?.caseRef || "",
    status: availability.available ? "live" : "queued",
    availability,
    livekitSession,
    message: availability.available ? "Connecting you to a Human SKANDI Customer Service Agent." : "Your request is in the Customer Service queue. A SKANDI agent will follow up as soon as possible."
  };
}


export async function addCustomerLiveSupportMessageCore({ caseId, content } = {}) {
  const result = await addCustomerSupportMessageCore({ caseId, content, source: "human-live-chat" });
  const { profile } = await customerLocalCase(caseId, { adopt: true });
  const livekitSession = await issueSupportLiveKitSessionCore({ caseId, role: "customer", subjectId: profile.memberId || profile.email, participantName: profile.displayName || "Traveler" });
  return { ...result, livekitSession };
}


export async function startCustomerSupportChatCore({ page = "my-profile", tab = "overview", bookingRef = "" } = {}) {
  return requestCustomerHumanHandoffCore({
    input: {
      category: "general",
      subCategory: "general-question",
      subject: "Customer Support Chat",
      message: `Customer opened Support Chat from ${clean(page, 120) || "my-profile"}${tab ? ` / ${clean(tab, 80)}` : ""}.`,
      bookingRef: clean(bookingRef, 80),
      source: "my-profile-live-chat",
      sourcePage: "/my-profile"
    },
    reason: "Customer opened Human SKANDI Customer Service chat from My Profile."
  });
}


export async function sendCustomerSupportChatMessageCore({ caseId = "", content = "" } = {}) {
  return addCustomerLiveSupportMessageCore({ caseId, content });
}


export async function deleteAgentSupportCaseCore({ caseId = "" } = {}) {
  const agent = await requireSupportAgentCore();
  const id = clean(caseId, 160);
  if (!id) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  const c = await config();
  await chatwootRequest(`/api/v1/accounts/${c.accountId}/conversations/${id}`, { method: "PATCH", body: { status: "resolved" } });
  const local = await findLocalCase(id);
  if (local) await saveLocalCase({ ...local, status: "closed", updatedAt: now() });
  await audit("AGENT_CASE_ARCHIVED", { caseId: id }, agent);
  return { ok: true, caseId: id, status: "closed", archived: true, deleted: false };
}


function gatewayHash(value) { return createHash("sha256").update(String(value ?? "")).digest("hex"); }


async function requireHelpDeskStaffCore() {
  const session = await getStaffPortalSessionCore();
  if (!session?.loggedIn || !session?.authorized) throw new Error("HELPDESK_STAFF_AUTH_REQUIRED");
  const profile = obj(session.profile);
  const skId = clean(profile.skId || profile.sk_id, 80);
  const rawId = clean(profile.id || profile.agentUserId || profile.agent_user_id || profile.memberId || profile.wixMemberId || profile.wix_member_id, 200);
  const email = lower(profile.email || profile.corporateEmailAddress || profile.corporate_email_address || session.email, 254);
  if (!email || !validEmail(email)) throw new Error("HELPDESK_STAFF_EMAIL_REQUIRED");
  const displayName = clean(
    profile.displayName || profile.preferredName || profile.preferred_name ||
    [profile.firstName || profile.first_name, profile.lastName || profile.last_name].filter(Boolean).join(" ") ||
    email.split("@")[0],
    200
  );
  const memberId = `staff:${skId || rawId || createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
  return {
    loggedIn: true,
    memberId,
    rawMemberId: rawId,
    skId,
    email,
    displayName,
    firstName: clean(profile.firstName || profile.first_name, 100),
    lastName: clean(profile.lastName || profile.last_name, 100),
    phone: clean(profile.phone || profile.workPhone || profile.work_phone, 80),
    department: clean(profile.department || profile.departmentName || profile.department_name, 120),
    base: clean(profile.base || profile.station || profile.baseCode || profile.stationCode, 80),
    profile,
    session
  };
}


function assertStaffOwnsLocalCase(local, staff) {
  if (!local) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const memberMatch = local.memberId && String(local.memberId) === String(staff.memberId);
  const emailMatch = local.email && lower(local.email, 254) === lower(staff.email, 254);
  if (!memberMatch && !emailMatch) throw new Error("HELPDESK_CASE_ACCESS_DENIED");
}


async function staffHelpDeskLocalCase(caseId) {
  const staff = await requireHelpDeskStaffCore();
  const local = await findLocalCase(clean(caseId, 160));
  assertStaffOwnsLocalCase(local, staff);
  return { staff, local };
}


export async function getHelpDeskRoutingDecisionCore({ operational = false, affectedAt = "" } = {}) {
  const isOperational = truthy(operational);
  if (!isOperational) {
    return { target: "SUPPORT", operational: false, affectedAt: "", within72Hours: false, reason: "NON_OPERATIONAL" };
  }
  const raw = clean(affectedAt, 100);
  if (!raw) throw new Error("HELPDESK_AFFECTED_AT_REQUIRED");
  const affected = new Date(raw);
  if (Number.isNaN(affected.getTime())) throw new Error("HELPDESK_AFFECTED_AT_INVALID");
  const hoursUntilAffected = (affected.getTime() - Date.now()) / 3600000;
  const within72Hours = hoursUntilAffected >= 0 && hoursUntilAffected <= 72;
  return {
    target: within72Hours ? "GROUPTALK" : "SUPPORT",
    operational: true,
    affectedAt: affected.toISOString(),
    within72Hours,
    hoursUntilAffected: Math.round(hoursUntilAffected * 10) / 10,
    reason: within72Hours ? "OPERATIONAL_WITHIN_72_HOURS" : "OPERATIONAL_BEYOND_72_HOURS"
  };
}


export async function getStaffHelpDeskBootstrapCore() {
  const staff = await requireHelpDeskStaffCore();
  const [{ workflows }, supportCases] = await Promise.all([
    getSupportWorkflowCore(),
    listStaffHelpDeskSupportCasesCore({ staff })
  ]);
  return {
    ok: true,
    profile: {
      skId: staff.skId,
      displayName: staff.displayName,
      email: staff.email,
      department: staff.department,
      base: staff.base
    },
    workflows,
    routingPolicy: { operationalReceiver: "GROUPTALK", operationalWindowHours: 72, nonOperationalReceiver: "SUPPORT" },
    supportCases: supportCases.cases
  };
}


export async function createStaffHelpDeskSupportCaseCore({ input = {} } = {}) {
  const staff = await requireHelpDeskStaffCore();
  const raw = obj(input);
  const sourceChannel = upper(raw.sourceChannel || (raw.entryMode === "chat" ? "INTERNAL_HELPDESK_CHAT" : "INTERNAL_HELPDESK_FORM"), 120);
  const fullName = staff.displayName || "SKANDI Staff";
  const result = await createCaseWithProfile(staff, {
    ...raw,
    firstName: raw.firstName || staff.firstName || fullName.split(/\s+/)[0] || "SKANDI",
    lastName: raw.lastName || staff.lastName || fullName.split(/\s+/).slice(1).join(" ") || "Staff",
    fullName,
    email: staff.email,
    phone: raw.phone || staff.phone,
    category: raw.category || "general",
    subject: raw.subject || "Internal HelpDesk request",
    message: raw.message || raw.description || "Internal HelpDesk request.",
    source: lower(sourceChannel, 120),
    sourcePage: "/riaintra/success-factors/helpdesk",
    requesterType: "STAFF",
    requesterSkId: staff.skId,
    requesterDepartment: staff.department,
    requesterBase: staff.base,
    sourceChannel
  }, { allowGenericCategory: true, sourceOverride: lower(sourceChannel, 120) });
  await audit("HELPDESK_SUPPORT_CASE_CREATED", {
    caseId: result.caseId, caseRef: result.caseRef, sourceChannel,
    operational: truthy(raw.operational), affectedAt: clean(raw.affectedAt, 100)
  }, staff);
  return { ...result, receiver: "SUPPORT", requesterType: "STAFF" };
}


export async function listStaffHelpDeskSupportCasesCore({ staff: suppliedStaff = null } = {}) {
  const staff = suppliedStaff || await requireHelpDeskStaffCore();
  const rows = await wixData.query(CMS.links).eq("memberId", staff.memberId).descending("updatedAt").limit(100).find(OPTS).catch(() => ({ items: [] }));
  return {
    ok: true,
    cases: (rows.items || []).map(row => ({
      receiver: "SUPPORT",
      caseId: row.chatwootConversationId,
      caseRef: row.caseRef,
      subject: row.subject,
      category: row.category,
      priority: row.priority,
      status: row.status,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt
    }))
  };
}


export async function getStaffHelpDeskSupportCaseCore({ caseId } = {}) {
  const id = clean(caseId, 160);
  const { local } = await staffHelpDeskLocalCase(id);
  return {
    receiver: "SUPPORT",
    case: {
      caseId: id, caseRef: local.caseRef, subject: local.subject, category: local.category,
      status: local.status, priority: local.priority, updatedAt: local.updatedAt
    },
    messages: await messagesByCaseId(id)
  };
}


export async function addStaffHelpDeskSupportMessageCore({ caseId, content } = {}) {
  const id = clean(caseId, 160);
  const { staff, local } = await staffHelpDeskLocalCase(id);
  const sentMessage = await createChatwootMessage(id, {
    content, outgoing: false, privateNote: false, source: "internal-helpdesk-chat"
  });
  await saveLocalCase({ ...local, status: "open", updatedAt: now() });
  await audit("HELPDESK_SUPPORT_REPLIED", { caseId: id, caseRef: local.caseRef }, staff);
  return { ok: true, receiver: "SUPPORT", caseId: id, sentMessage };
}


export async function startAlexandraSupportSessionCore({ locale = "en-US", currency = "USD", pagePath = "/about/support" } = {}) {
  const profile = memberProfile(await memberSafe());
  const session = await issueAlexandraLiveKitSessionCore({
    locale: clean(locale, 40) || "en-US",
    currency: upper(currency, 12) || "USD",
    pagePath: clean(pagePath, 300) || "/about/support",
    authenticated: profile.loggedIn === true,
    channel: "web"
  });
  await audit("ALEXANDRA_SESSION_STARTED", {
    sessionId: session.sessionId,
    authenticated: profile.loggedIn === true,
    pagePath: clean(pagePath, 300) || "/about/support"
  }, profile);
  return { ok: true, loggedIn: profile.loggedIn === true, session };
}


export async function verifyAlexandraGatewayTokenCore(token) {
  const expected = await readSecret("SKANDI_ALEXANDRA_GATEWAY_TOKEN", "", true);
  const supplied = clean(token, 12000);
  if (!supplied || gatewayHash(supplied) !== gatewayHash(expected)) throw new Error("ALEXANDRA_GATEWAY_UNAUTHORIZED");
  return true;
}


export async function getSupportWorkflowTrustedCore({ category = "" } = {}) {
  return getSupportWorkflowCore({ category });
}


export async function createSupportCaseTrustedCore({ customer = {}, input = {} } = {}) {
  const profile = profileFromTrustedCustomer(customer);
  if (!validEmail(profile.email || input.email)) throw new Error("SUPPORT_EMAIL_INVALID");
  const normalized = {
    ...obj(input),
    firstName: input.firstName || profile.firstName,
    lastName: input.lastName || profile.lastName,
    fullName: input.fullName || profile.displayName,
    email: input.email || profile.email,
    phone: input.phone || profile.phone,
    source: "alexandra",
    sourcePage: input.sourcePage || "alexandra-prod",
    requesterType: "CUSTOMER",
    sourceChannel: "ALEXANDRA"
  };
  const result = await createCaseWithProfile(profile, normalized, { allowGenericCategory: true, sourceOverride: "alexandra" });
  await audit("ALEXANDRA_CASE_CREATED", { caseId: result.caseId, caseRef: result.caseRef, category: normalized.category }, profile);
  return result;
}


export async function updateSupportCaseTrustedCore({ caseId, summary = "", collectedFields = {}, internalNote = "" } = {}) {
  const id = clean(caseId, 160);
  if (!id) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  const body = [
    summary ? `Alexandra summary:\n${clean(summary, 8000)}` : "",
    internalNote ? `Alexandra note:\n${clean(internalNote, 8000)}` : "",
    Object.keys(obj(collectedFields)).length ? `Structured fields:\n${JSON.stringify(collectedFields, null, 2).slice(0, 12000)}` : ""
  ].filter(Boolean).join("\n\n");
  if (!body) throw new Error("SUPPORT_UPDATE_EMPTY");
  await createChatwootMessage(id, { content: body, outgoing: true, privateNote: true, source: "alexandra" });
  const local = await findLocalCase(id);
  if (local) await saveLocalCase({ ...local, updatedAt: now() });
  await audit("ALEXANDRA_CASE_UPDATED", { caseId: id, fields: Object.keys(obj(collectedFields)) }, {});
  return { ok: true, caseId: id };
}


export async function requestHumanHandoffTrustedCore({ caseId = "", customer = {}, input = {}, reason = "", summary = "", collectedFields = {}, transcript = "" } = {}) {
  let id = clean(caseId, 160);
  let created = null;
  if (!id) {
    created = await createSupportCaseTrustedCore({ customer, input: {
      ...obj(input),
      category: "general",
      subCategory: "general-question",
      subject: input.subject || "Alexandra Human Handoff",
      message: input.message || summary || reason || "The traveler requested personal help from SKANDI Customer Service.",
      requestedSupportCategory: clean(input.category, 80),
      requestedSupportTopic: clean(input.subCategory, 160)
    }});
    id = created.caseId;
  }
  await addHumanHandoffNote(id, { reason, summary, collectedFields, transcript, source: "alexandra" });
  const availability = await getHumanSupportAvailabilityCore().catch(() => ({ status: "unknown", available: false, onlineAgents: 0 }));
  const trustedProfile = profileFromTrustedCustomer(customer);
  const livekitSession = availability.available
    ? await issueSupportLiveKitSessionCore({
        caseId: id,
        role: "customer",
        subjectId: trustedProfile.memberId || trustedProfile.email || `alexandra-${id}`,
        participantName: trustedProfile.displayName || "Traveler"
      }).catch(() => null)
    : null;
  await audit("ALEXANDRA_HUMAN_HANDOFF_REQUESTED", { caseId: id, availability: availability.status }, trustedProfile);
  return {
    ok: true,
    caseId: id,
    caseRef: created?.caseRef || (await findLocalCase(id))?.caseRef || "",
    availability,
    livekitSession,
    status: livekitSession ? "ready-for-client-handoff" : "queued",
    clientAction: {
      name: "start_human_chat",
      arguments: {
        caseId: id,
        status: livekitSession ? "live" : "queued",
        livekitSession,
        message: livekitSession
          ? "Connecting you to a Human SKANDI Customer Service Agent."
          : "Your request is in the Customer Service queue. A SKANDI agent will follow up as soon as possible."
      }
    }
  };
}

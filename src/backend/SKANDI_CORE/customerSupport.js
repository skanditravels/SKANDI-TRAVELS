// /src/backend/SKANDI_CORE/customerSupport.js
// SKANDI B-011 LiveKit Support cutover — canonical Customer Support + Alexandra + HelpDesk business core.
// Supabase customer_support_* tables are the persistent Support case/message source of truth.
// LiveKit Agents runs Alexandra and LiveKit rooms provide realtime human handoff. External helpdesk-provider runtime dependencies are removed.

import { SITE_MAP } from "public/siteMap";
import wixData from "wix-data";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { createHash, randomUUID } from "crypto";
import { getStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { issueSupportLiveKitSessionCore, issueAlexandraLiveKitSessionCore } from "backend/SKANDI_CORE/livekitServer";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const OPTS = { suppressAuth: true, suppressHooks: false };

const CMS = Object.freeze({
  categories: "SupportCategories",
  routing: "SupportInboxRouting",
  articles: "SupportHelpArticles",
  events: "SupportCaseEvents"
});

const DB = Object.freeze({
  cases: "customer_support_cases",
  messages: "customer_support_messages",
  alexandraSessions: "alexandra_chat_sessions",
  agents: "agent_users"
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
function makeCaseId() { return `case_${randomUUID().replaceAll("-", "")}`; }
function makeMessageId() { return `msg_${randomUUID().replaceAll("-", "")}`; }
function normalizePriority(value) { const v = lower(value, 20); return ["low", "normal", "high", "urgent"].includes(v) ? v : "normal"; }
function normalizeStatus(value) { const v = lower(value, 30).replace(/_/g, "-"); return ["new", "open", "pending", "on-hold", "solved", "resolved", "closed"].includes(v) ? (v === "resolved" ? "solved" : v) : "open"; }
function initials(name) { return clean(name, 120).split(/\s+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase(); }
function normalizeSupportTags(value) {
  return [...new Set(arr(value).map(item => clean(item, 80)).filter(Boolean))].slice(0, 100);
}

function normalizeSupportPeople(value) {
  return arr(value).slice(0, 100).map(item => {
    if (typeof item === "string") {
      const raw = clean(item, 254);
      if (!raw) return null;
      return { id: null, name: validEmail(raw) ? raw.split("@")[0] : raw, email: validEmail(raw) ? lower(raw, 254) : "" };
    }
    const row = obj(item);
    const id = clean(row.id || row.memberId || row.member_id || row.agentId || row.agent_id || row.skId || row.sk_id, 200);
    const emailValue = lower(row.email || row.corporateEmailAddress || row.corporate_email_address, 254);
    const name = clean(row.name || row.displayName || row.display_name || row.preferredName || row.preferred_name || emailValue || id, 200);
    if (!id && !emailValue && !name) return null;
    return { id: id || null, name: name || emailValue || id, email: emailValue };
  }).filter(Boolean);
}
function firstRow(value) { return Array.isArray(value) ? (value[0] || null) : value && typeof value === "object" ? value : null; }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 80)); }

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

async function sbRows(table, query = {}) {
  const value = await restRequest({ table, method: "GET", query });
  return arr(value);
}

async function sbInsert(table, row) {
  return firstRow(await restRequest({ table, method: "POST", body: row, prefer: "return=representation" }));
}

async function sbPatch(table, query, patch) {
  return firstRow(await restRequest({ table, method: "PATCH", query, body: patch, prefer: "return=representation" }));
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
  const normalized = clean(categoryKey, 80);
  const candidates = ROUTING_FALLBACKS[normalized] || [normalized];
  for (const candidate of candidates) {
    try {
      const rows = await wixData.query(CMS.routing).eq("categoryKey", candidate).eq("active", true).limit(1).find(OPTS);
      const row = rows.items?.[0];
      if (row) {
        return {
          queueKey: clean(row.queueKey || row.inboxKey || candidate || "support", 120),
          defaultPriority: normalizePriority(row.defaultPriority),
          labels: arr(row.labels).length ? arr(row.labels).map(x => clean(x, 80)).filter(Boolean) : clean(row.labels, 1000).split(",").map(x => clean(x, 80)).filter(Boolean),
          matchedCategoryKey: candidate
        };
      }
    } catch (_) {}
  }
  return { queueKey: normalized || "support", defaultPriority: "normal", labels: [normalized].filter(Boolean), matchedCategoryKey: "default" };
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
  if (workflow !== workflows.general && arr(workflow.topics).length && input.subCategory && !workflowTopic(workflow, input.subCategory)) throw new Error("SUPPORT_TOPIC_INVALID");
  for (const field of arr(workflow.requiredFields)) if (!fieldValue(input, field)) throw new Error(`SUPPORT_FIELD_REQUIRED_${String(field).toUpperCase()}`);
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
function section(title, rows) { const lines = rows.filter(Boolean); return lines.length ? [`\n### ${title}`, ...lines] : []; }

function buildInitialMessage(input, workflow) {
  const topic = workflowTopic(workflow, input.subCategory);
  const lines = [
    `# ${input.subject}`,
    input.message,
    ...section("Customer", [line("Name", input.fullName), line("Email", input.email), line("Phone", input.phone), line("Nationality", input.nationality), line("Country of residence", input.countryOfResidence)]),
    ...section("Request", [line("Category", workflow.title || input.category), line("Topic", topic?.title || input.subCategory), line("Source", input.source)]),
    ...section("Booking / Trip", [line("Booking reference", input.bookingRef), line("Supplier", input.supplier), line("Travel date", input.travelDate), line("Destination", input.destination)]),
    ...section("Flight", [line("Operating airline", input.flightAirline), line("Flight number", input.flightNumber), line("Departure airport", input.depAirport), line("Arrival airport", input.arrAirport)]),
    ...section("Baggage", [line("Formal PIR already filed", input.hasPir), line("PIR number", input.pirNumber), line("Bag tag", input.bagTag), line("Missing bags", input.missingBagCount), line("Bag type", input.bagType), line("Color", input.bagColor), line("Brand / distinguishing features", input.bagBrand), line("Delivery address", input.bagAddress), input.category === "baggage" && input.hasPir === "no" ? line("PIR guidance", workflow?.guidance?.noPir) : ""]),
    ...section("Supporting files", [line("Selected filenames", input.attachedFileNames), line("Uploaded file links", input.attachedFileUrls)])
  ];
  const genericSkip = new Set(["firstName","lastName","fullName","name","email","phone","nationality","countryOfResidence","category","subCategory","topic","subject","message","description","bookingRef","pnr","supplier","travelDate","destination","flightAirline","flightNumber","depAirport","arrAirport","hasPir","pirNumber","bagTag","missingBagCount","bagType","bagColor","bagBrand","bagAddress","attachedFileNames","attachedFileUrls","source","sourcePage","hasBooking","priority"]);
  const extras = Object.entries(input).filter(([key, value]) => !genericSkip.has(key) && value !== undefined && value !== null && value !== "" && (typeof value === "string" || typeof value === "number" || typeof value === "boolean"));
  if (extras.length) lines.push(...section("Additional information", extras.map(([key, value]) => line(key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()), value))));
  return lines.filter(Boolean).join("\n").slice(0, 30000);
}

function caseIdOf(row = {}) { return clean(row.case_id || row.caseId || row.id, 160); }
function casePayload(row = {}) { return obj(row.payload); }
function caseRefOf(row = {}) { const p = casePayload(row); return clean(p.caseRef || p.case_ref || row.case_id || row.id, 160); }

async function findCaseRecord(caseId) {
  const id = clean(caseId, 160);
  if (!id) return null;
  let rows = await sbRows(DB.cases, { select: "*", case_id: `eq.${id}`, limit: 1 });
  if (!rows.length && isUuid(id)) rows = await sbRows(DB.cases, { select: "*", id: `eq.${id}`, limit: 1 });
  return rows[0] || null;
}

async function updateCaseRecord(row, fields = {}, payloadPatch = {}) {
  if (!row?.id) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const payload = { ...casePayload(row), ...obj(payloadPatch) };
  const patch = { ...fields, payload, updated_at: nowIso() };
  const updated = await sbPatch(DB.cases, { id: `eq.${row.id}` }, patch);
  return updated || { ...row, ...patch };
}

function normalizeMessage(row = {}) {
  const p = obj(row.payload);
  const senderTypeRaw = lower(row.sender_type || p.senderType, 40);
  const agentLike = ["agent", "human-agent", "alexandra", "system"].includes(senderTypeRaw);
  const privateNote = p.private === true || p.kind === "internal" || lower(row.channel, 40) === "internal";
  const senderName = clean(row.sender_name || p.senderName || (senderTypeRaw === "alexandra" ? "Alexandra" : agentLike ? "SKANDI Customer Service" : "Traveler"), 200);
  const id = clean(row.message_id || row.id, 160);
  const text = clean(row.message || p.message, 30000);
  return {
    id,
    messageId: id,
    content: text,
    body: text,
    senderType: senderTypeRaw === "alexandra" ? "agent" : agentLike ? "agent" : senderTypeRaw === "staff" ? "customer" : "customer",
    senderName,
    sender: senderName,
    createdAt: row.created_at || nowIso(),
    at: row.created_at || nowIso(),
    private: privateNote,
    kind: privateNote ? "internal" : "public",
    channel: clean(row.channel || p.channel || (privateNote ? "internal" : "chat"), 80),
    message_type: agentLike ? "outgoing" : "incoming"
  };
}

async function messagesByCaseId(caseId) {
  const id = clean(caseId, 160);
  if (!id) return [];
  const rows = await sbRows(DB.messages, { select: "*", case_id: `eq.${id}`, order: "created_at.asc", limit: 1000 });
  return rows.map(normalizeMessage);
}

async function insertSupportMessage(caseRow, { content, senderType = "customer", senderName = "Traveler", memberId = "", wixMemberId = "", channel = "chat", privateNote = false, source = "support", payload = {} } = {}) {
  const text = clean(content, 30000);
  if (!text) throw new Error("SUPPORT_MESSAGE_REQUIRED");
  const caseId = caseIdOf(caseRow);
  if (!caseId) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  const messageId = makeMessageId();
  const row = await sbInsert(DB.messages, {
    message_id: messageId,
    case_id: caseId,
    member_id: clean(memberId, 240) || null,
    wix_member_id: clean(wixMemberId || memberId, 240) || null,
    sender_type: clean(senderType, 40),
    sender_name: clean(senderName, 200),
    message: text,
    channel: clean(channel, 80),
    payload: {
      ...obj(payload),
      private: privateNote === true,
      kind: privateNote ? "internal" : "public",
      source: clean(source, 120),
      submissionId: randomUUID()
    }
  });
  if (!privateNote) {
    await updateCaseRecord(caseRow, { status: normalizeStatus(caseRow.status || "open") === "closed" ? "closed" : "open" });
  }
  return normalizeMessage(row || { message_id: messageId, case_id: caseId, sender_type: senderType, sender_name: senderName, message: text, channel, payload: { private: privateNote }, created_at: nowIso() });
}

function normalizeCase(row = {}) {
  const p = casePayload(row);
  const caseId = caseIdOf(row);
  const status = normalizeStatus(row.status);
  const priority = normalizePriority(row.priority);
  const sourceChannel = upper(p.sourceChannel || row.source, 120);
  const requesterType = upper(p.requesterType || (sourceChannel.includes("INTERNAL_HELPDESK") ? "STAFF" : "CUSTOMER"), 30);
  const liveHandoff = p.liveHandoff === true || truthy(p.liveHandoff);
  const channel = liveHandoff ? "chat" : lower(row.source, 80).includes("email") ? "email" : "chat";
  const queueKey = clean(p.queueKey || p.inboxKey || p.group || "support", 120);
  const customerName = clean(p.fullName || p.customerName || p.requesterName || (requesterType === "STAFF" ? p.staffDisplayName : "Traveler"), 200);
  const assigneeId = clean(row.assigned_agent_id, 200);
  const assigneeName = clean(row.assigned_agent_name, 200);
  const assignee = assigneeId || assigneeName ? { id: assigneeId || null, name: assigneeName || "Support Agent", email: "" } : null;
  const channelLabel = requesterType === "STAFF" ? "Internal HelpDesk" : sourceChannel.includes("ALEXANDRA") ? "Alexandra handoff" : liveHandoff ? "Live chat / Support" : "Support";
  const labels = normalizeSupportTags(p.labels);
  const tags = normalizeSupportTags([...labels, ...arr(p.tags)]);
  const followers = normalizeSupportPeople(p.followers);
  const ccs = normalizeSupportPeople(p.ccs);
  return {
    id: caseId,
    externalId: caseId,
    caseId,
    localId: clean(row.id, 160),
    caseRef: caseRefOf(row),
    subject: clean(row.subject || p.subject || "Support case", 240),
    status,
    priority,
    category: clean(row.category || p.category || "general", 80),
    subCategory: clean(p.subCategory, 160),
    bookingRef: clean(p.bookingRef || p.pnr, 80),
    pnr: clean(p.pnr || p.bookingRef, 80),
    customerName,
    email: lower(row.email || p.email, 254),
    phone: clean(p.phone, 80),
    requester: { id: clean(row.member_id || row.wix_member_id, 200), name: customerName || "Traveler", email: lower(row.email || p.email, 254), phone: clean(p.phone, 80) },
    customer: { id: clean(row.member_id || row.wix_member_id, 200), name: customerName || "Traveler", email: lower(row.email || p.email, 254), phone: clean(p.phone, 80) },
    assignee,
    assigneeId: assignee?.id || null,
    inboxName: queueKey,
    group: queueKey,
    queue: priority === "urgent" ? "urgent" : queueKey,
    source: clean(row.source || p.source || channel, 120),
    sourceChannel,
    requesterType,
    channel,
    channelLabel,
    type: clean(p.type || "question", 80),
    labels,
    tags,
    followers,
    ccs,
    tier: clean(p.clubTier, 80),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || row.created_at || "",
    lastActivityAt: row.updated_at || row.created_at || "",
    unread: false,
    custom_attributes: p,
    raw: { id: clean(row.id, 160) }
  };
}


async function casesForProfile(profile) {
  const merged = new Map();
  if (profile?.memberId) {
    const rows = await sbRows(DB.cases, { select: "*", member_id: `eq.${profile.memberId}`, order: "updated_at.desc", limit: 100 });
    for (const row of rows) merged.set(String(row.id), row);
  }
  if (profile?.email) {
    const rows = await sbRows(DB.cases, { select: "*", email: `eq.${lower(profile.email, 254)}`, order: "updated_at.desc", limit: 100 });
    for (const row of rows) merged.set(String(row.id), row);
  }
  return [...merged.values()].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)).slice(0, 100);
}

async function createCaseWithProfile(profile, rawInput, { allowGenericCategory = true, sourceOverride = "" } = {}) {
  const workflows = await supportWorkflows();
  const { input, workflow } = validateCaseInput({ ...rawInput, ...(sourceOverride ? { source: sourceOverride } : {}) }, workflows, { allowGenericCategory });
  if (profile?.email && lower(profile.email, 254) !== input.email && profile.loggedIn) throw new Error("SUPPORT_EMAIL_MEMBER_MISMATCH");
  const routing = await routeForCategory(input.category);
  const caseRef = makeCaseRef();
  const caseId = makeCaseId();
  const requesterType = upper(rawInput.requesterType || "CUSTOMER", 30);
  const sourceChannel = upper(rawInput.sourceChannel || input.source || "SUPPORT", 120);
  const payload = {
    caseRef,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    subCategory: input.subCategory,
    bookingRef: input.bookingRef,
    pnr: input.pnr,
    sourcePage: input.sourcePage,
    source: input.source,
    requesterType,
    requesterSkId: clean(rawInput.requesterSkId, 80),
    requesterDepartment: clean(rawInput.requesterDepartment, 120),
    requesterBase: clean(rawInput.requesterBase, 80),
    sourceChannel,
    queueKey: routing.queueKey,
    labels: [...new Set([...routing.labels, input.category, input.subCategory].filter(Boolean))],
    workflowKey: workflow.key,
    workflowTitle: workflow.title,
    hasBooking: input.hasBooking,
    hasPir: input.hasPir,
    liveHandoff: false
  };
  const created = await sbInsert(DB.cases, {
    case_id: caseId,
    member_id: clean(profile?.memberId, 240) || null,
    wix_member_id: clean(profile?.memberId, 240) || null,
    email: input.email,
    subject: input.subject,
    category: input.category,
    priority: routing.defaultPriority,
    status: "open",
    source: input.source,
    page: input.sourcePage,
    tab: clean(rawInput.tab, 120) || null,
    payload,
    assigned_agent_id: null,
    assigned_agent_name: null
  });
  if (!created?.id) throw new Error("SUPPORT_CASE_CREATE_FAILED");
  const sentMessage = await insertSupportMessage(created, {
    content: buildInitialMessage(input, workflow),
    senderType: requesterType === "STAFF" ? "staff" : "customer",
    senderName: input.fullName,
    memberId: clean(profile?.memberId, 240),
    wixMemberId: clean(profile?.memberId, 240),
    channel: sourceChannel.includes("ALEXANDRA") ? "alexandra" : sourceChannel.includes("HELPDESK") ? "helpdesk" : "support",
    source: input.source,
    payload: { category: input.category, subCategory: input.subCategory, caseRef }
  });
  await audit("CUSTOMER_CASE_CREATED", { caseRef, caseId, category: input.category, bookingRef: input.bookingRef, source: input.source }, profile || {});
  return { ok: true, caseRef, caseId, localId: clean(created.id, 160), status: "open", priority: routing.defaultPriority, workflow: { key: workflow.key, title: workflow.title }, sentMessage };
}

export async function getCustomerSupportBootstrapCore() {
  const member = await memberSafe();
  const profile = memberProfile(member);
  const { workflows } = await getSupportWorkflowCore();
  return {
    profile,
    loggedIn: profile.loggedIn,
    workflows,
    categories: workflows.map(item => ({ key: item.key, title: item.title, summary: item.summary })),
    articles: await helpArticles(),
    humanSupport: profile.loggedIn ? await getHumanSupportAvailabilityCore().catch(() => ({ status: "unknown", available: false, onlineAgents: 0, queueOpen: true })) : { status: "sign-in-required", available: false, onlineAgents: 0, queueOpen: true },
    livekit: { configured: true, provider: "LiveKit", agentRuntime: "LiveKit Agents", agentName: "Alexandra", caseStore: "Supabase" },
    widget: { enabled: false, provider: "LiveKit" }
  };
}

export async function getPublicSupportBootstrapCore({ page = "/about/support" } = {}) {
  const result = await getCustomerSupportBootstrapCore();
  return { ...result, supportContext: { page: clean(page || "/about/support", 300) } };
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
  return createCaseWithProfile(profile, { ...obj(input), sourcePage: clean(input.sourcePage || SITE_MAP.support, 300), source: clean(input.source || "public-support", 120) }, { allowGenericCategory: true });
}

function assertCustomerOwnsCase(row, profile) {
  if (!row || !profile?.loggedIn) throw new Error("SUPPORT_CASE_ACCESS_DENIED");
  const memberMatch = clean(row.member_id || row.wix_member_id, 240) && [row.member_id, row.wix_member_id].map(String).includes(String(profile.memberId));
  const emailMatch = row.email && lower(row.email, 254) === lower(profile.email, 254);
  if (!memberMatch && !emailMatch) throw new Error("SUPPORT_CASE_ACCESS_DENIED");
}

async function customerCase(caseId, { adopt = false } = {}) {
  const profile = memberProfile(await memberSafe());
  if (!profile.loggedIn) throw new Error("SUPPORT_SIGN_IN_REQUIRED");
  let row = await findCaseRecord(caseId);
  assertCustomerOwnsCase(row, profile);
  if (adopt && !row.member_id && profile.memberId) row = await updateCaseRecord(row, { member_id: profile.memberId, wix_member_id: profile.memberId });
  return { profile, row };
}

export async function listCustomerSupportCasesCore() {
  const profile = memberProfile(await memberSafe());
  if (!profile.loggedIn) throw new Error("SUPPORT_SIGN_IN_REQUIRED");
  const rows = await casesForProfile(profile);
  return { cases: rows.map(row => { const item = normalizeCase(row); return { caseId: item.caseId, caseRef: item.caseRef, subject: item.subject, category: item.category, bookingRef: item.bookingRef, pnr: item.pnr, priority: item.priority, status: item.status, updatedAt: item.updatedAt }; }) };
}

export async function getCustomerSupportCaseCore({ caseId } = {}) {
  const id = clean(caseId, 160);
  const { row } = await customerCase(id, { adopt: true });
  const item = normalizeCase(row);
  return { case: { caseId: item.caseId, caseRef: item.caseRef, subject: item.subject, category: item.category, bookingRef: item.bookingRef, pnr: item.pnr, status: item.status, priority: item.priority }, messages: await messagesByCaseId(item.caseId) };
}

export async function addCustomerSupportMessageCore({ caseId, content, source = "customer-portal" } = {}) {
  const id = clean(caseId, 160);
  const { profile, row } = await customerCase(id, { adopt: true });
  const sentMessage = await insertSupportMessage(row, { content, senderType: "customer", senderName: profile.displayName || "Traveler", memberId: profile.memberId, wixMemberId: profile.memberId, channel: source.includes("live") ? "livekit" : "support", privateNote: false, source });
  await audit("CUSTOMER_CASE_REPLIED", { caseId: caseIdOf(row), caseRef: caseRefOf(row), source }, profile);
  return { ok: true, caseId: caseIdOf(row), sentMessage };
}

function permissionValues(session = {}) {
  const profile = obj(session.profile);
  const values = [...arr(session.permissionKeys), ...arr(session.permissions), ...arr(session.allowedApps), ...arr(session.permissionGroups), ...arr(profile.permissionKeys), ...arr(profile.permissions), ...arr(profile.allowedApps), ...arr(profile.permissionGroups), session.accessRole, profile.accessRole, session.permissionPreset, profile.permissionPreset];
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

function permissionValuesFromAgentRow(row = {}) {
  return new Set([
    ...arr(row.permission_keys), ...arr(row.allowed_apps), ...arr(row.permission_groups), row.access_role, row.permission_preset
  ].flatMap(value => typeof value === "string" ? [value] : []).map(value => lower(value, 160)).filter(Boolean));
}

function agentRowAuthorizedForSupport(row = {}) {
  if (row.active === false || row.authorized === false || row.portal_access === false) return false;
  const permissions = permissionValuesFromAgentRow(row);
  const all = lower(row.permission_preset, 80) === "all" || permissions.has("system-admin") || permissions.has("all");
  return all || [...permissions].some(token => SUPPORT_PERMISSION_TOKENS.has(token) || token.includes("customer-support") || token.includes("customer_service") || token.includes("customer-service"));
}

function agentIsOnline(row = {}) {
  const status = lower(row.status, 40);
  if (["online", "available"].includes(status)) return true;
  const last = row.last_login_at ? new Date(row.last_login_at).getTime() : 0;
  return last > 0 && Date.now() - last <= 30 * 60 * 1000;
}

async function supportAgents() {
  const rows = await sbRows(DB.agents, { select: "id,agent_id,sk_id,email,corporate_email_address,display_name,preferred_name,first_name,last_name,active,authorized,portal_access,status,last_login_at,permission_keys,allowed_apps,permission_groups,access_role,permission_preset", active: "eq.true", limit: 500 });
  return rows.filter(agentRowAuthorizedForSupport).map(row => ({
    id: clean(row.id || row.agent_id || row.sk_id, 200),
    skId: clean(row.sk_id || row.agent_id, 80),
    name: clean(row.display_name || row.preferred_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || row.corporate_email_address || "Support Agent", 200),
    email: lower(row.corporate_email_address || row.email, 254),
    role: "agent",
    availability: agentIsOnline(row) ? "online" : "offline",
    group: "Customer Service",
    initials: initials(row.display_name || row.preferred_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email),
    lastLoginAt: row.last_login_at || null
  }));
}

export async function getHumanSupportAvailabilityCore() {
  const agents = await supportAgents();
  const online = agents.filter(agent => agent.availability === "online");
  return { provider: "LiveKit", status: online.length ? "online" : agents.length ? "queue-only" : "unconfigured", available: online.length > 0, onlineAgents: online.length, configuredAgents: agents.length, queueOpen: agents.length > 0 };
}

export async function getAgentSupportBootstrapCore() {
  const agent = await requireSupportAgentCore();
  const agents = await supportAgents();
  const me = agents.find(item => agent.email && item.email === agent.email) || agents.find(item => agent.skId && item.skId === agent.skId);
  await audit("AGENT_SUPPORT_OPENED", { provider: "LiveKit", store: "Supabase" }, agent);
  return {
    session: { agentId: me?.id || agent.id || agent.skId || null, agentName: agent.name, agentEmail: agent.email, agentInitials: initials(agent.name), skId: agent.skId },
    agent: { id: me?.id || agent.id || null, name: agent.name, email: agent.email, initials: initials(agent.name), role: "agent" },
    agents,
    users: agents,
    groups: [],
    articles: await helpArticles(),
    macros: [],
    triggers: [],
    automations: [],
    provider: { realtime: "LiveKit", caseStore: "Supabase" },
    humanSupport: await getHumanSupportAvailabilityCore()
  };
}

async function allSupportCases(limit = 500) {
  return sbRows(DB.cases, { select: "*", order: "updated_at.desc", limit });
}

export async function listAgentSupportCasesCore({ queue = "open", query = "", view = "", silentSync = false } = {}) {
  const agent = await requireSupportAgentCore();
  const qName = lower(queue || view || "open", 80);
  const q = lower(query, 300);
  let cases = (await allSupportCases()).map(normalizeCase);
  if (["solved", "closed", "pending"].includes(qName)) cases = cases.filter(item => item.status === qName);
  else if (qName === "urgent") cases = cases.filter(item => item.priority === "urgent" && !["solved", "closed"].includes(item.status));
  else if (qName === "mine") cases = cases.filter(item => (clean(item.assigneeId, 200) && [agent.id, agent.skId, agent.email].filter(Boolean).map(String).includes(String(item.assigneeId))) || lower(item.assignee?.name, 200) === lower(agent.name, 200));
  else if (qName !== "all") cases = cases.filter(item => !["solved", "closed"].includes(item.status));
  if (q) cases = cases.filter(item => lower([item.caseRef, item.subject, item.email, item.customerName, item.bookingRef, item.pnr, item.category, item.sourceChannel].join(" "), 5000).includes(q));
  if (silentSync !== true) await audit("AGENT_CASE_LISTED", { queue: qName, count: cases.length }, agent);
  return { cases };
}

export async function getAgentSupportCaseCore({ caseId, includeLiveKit = true, silentSync = false } = {}) {
  const agent = await requireSupportAgentCore();
  const id = clean(caseId, 160);
  if (!id) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  const row = await findCaseRecord(id);
  if (!row) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const supportCase = normalizeCase(row);
  const history = await messagesByCaseId(supportCase.caseId);
  supportCase.history = history;
  supportCase.conversationHistory = history;
  const livekitSession = includeLiveKit === false
    ? null
    : await issueSupportLiveKitSessionCore({ caseId: supportCase.caseId, role: "agent", subjectId: agent.skId || agent.id || agent.email, participantName: agent.name }).catch(() => null);
  if (silentSync !== true) await audit("AGENT_CASE_OPENED", { caseId: supportCase.caseId, provider: "LiveKit", includeLiveKit: includeLiveKit !== false }, agent);
  return { case: supportCase, messages: history, livekitSession };
}

export async function replyAgentSupportCaseCore({ caseId, content, privateNote = false } = {}) {
  const agent = await requireSupportAgentCore();
  const row = await findCaseRecord(clean(caseId, 160));
  if (!row) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const sentMessage = await insertSupportMessage(row, { content, senderType: "agent", senderName: agent.name, memberId: agent.memberId || agent.id, wixMemberId: agent.memberId, channel: privateNote ? "internal" : "livekit", privateNote: Boolean(privateNote), source: privateNote ? "agent-internal-note" : "agent-reply", payload: { agentSkId: agent.skId } });
  await updateCaseRecord(row, { assigned_agent_id: clean(agent.id || agent.skId || agent.email, 200) || null, assigned_agent_name: agent.name, status: "open" }, { liveHandoff: privateNote ? casePayload(row).liveHandoff : true });
  const livekitSession = privateNote ? null : await issueSupportLiveKitSessionCore({ caseId: caseIdOf(row), role: "agent", subjectId: agent.skId || agent.id || agent.email, participantName: agent.name }).catch(() => null);
  await audit(privateNote ? "AGENT_INTERNAL_NOTE_ADDED" : "AGENT_CASE_REPLIED", { caseId: caseIdOf(row) }, agent);
  return { ok: true, caseId: caseIdOf(row), sentMessage, privateNote: Boolean(privateNote), livekitSession };
}

export async function updateAgentSupportCaseCore({ caseId, status, priority, label, updates = {} } = {}) {
  const agent = await requireSupportAgentCore();
  const row = await findCaseRecord(clean(caseId, 160));
  if (!row) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const requested = { ...obj(updates) };
  if (status !== undefined) requested.status = status;
  if (priority !== undefined) requested.priority = priority;
  if (label !== undefined) requested.label = label;
  if (requested.action === "INTERNAL_NOTE" && requested.internalNote?.content) {
    await insertSupportMessage(row, { content: requested.internalNote.content, senderType: "agent", senderName: agent.name, memberId: agent.memberId || agent.id, wixMemberId: agent.memberId, channel: "internal", privateNote: true, source: "agent-internal-note" });
  }
  if (requested.action === "TALK_CALL" && requested.call) {
    const call = obj(requested.call);
    await insertSupportMessage(row, { content: `Call disposition\nOutcome: ${clean(call.outcome, 200)}\nDuration: ${Number(call.duration || 0)} seconds\n${clean(call.message?.body || call.notes, 5000)}`, senderType: "agent", senderName: agent.name, memberId: agent.memberId || agent.id, wixMemberId: agent.memberId, channel: "internal", privateNote: true, source: "agent-call-disposition" });
  }
  const payload = casePayload(row);
  const fields = {};
  const payloadPatch = {};
  if (requested.status) fields.status = normalizeStatus(requested.status);
  if (requested.priority) fields.priority = normalizePriority(requested.priority);
  if (requested.assigneeId !== undefined || requested.assigneeName !== undefined) {
    fields.assigned_agent_id = clean(requested.assigneeId, 200) || null;
    fields.assigned_agent_name = clean(requested.assigneeName, 200) || null;
  }
  if (requested.label !== undefined) payloadPatch.labels = normalizeSupportTags([...arr(payload.labels), requested.label]);
  if (requested.type !== undefined) payloadPatch.type = clean(requested.type || "question", 80);
  if (requested.tags !== undefined) payloadPatch.tags = normalizeSupportTags(requested.tags);
  if (requested.followers !== undefined) payloadPatch.followers = normalizeSupportPeople(requested.followers);
  if (requested.ccs !== undefined) payloadPatch.ccs = normalizeSupportPeople(requested.ccs);
  if (requested.queue !== undefined || requested.group !== undefined) payloadPatch.queueKey = clean(requested.queue || requested.group, 120) || clean(payload.queueKey, 120) || "support";
  await updateCaseRecord(row, fields, payloadPatch);
  await audit("AGENT_CASE_UPDATED", {
    caseId: caseIdOf(row),
    status: requested.status,
    priority: requested.priority,
    label: requested.label,
    type: requested.type,
    queue: requested.queue || requested.group,
    action: requested.action
  }, agent);
  return { ok: true, caseId: caseIdOf(row), status: fields.status || normalizeStatus(row.status), priority: fields.priority || normalizePriority(row.priority) };
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
  const createdRow = await findCaseRecord(created.caseId);
  if (createdRow) {
    const fields = {
      assigned_agent_id: clean(raw.assigneeId || agent.id || agent.skId || agent.email, 200) || null,
      assigned_agent_name: clean(raw.assigneeName || agent.name, 200) || null
    };
    if (raw.status) fields.status = normalizeStatus(raw.status);
    if (raw.priority) fields.priority = normalizePriority(raw.priority);
    const payloadPatch = {};
    if (raw.type !== undefined) payloadPatch.type = clean(raw.type || "question", 80);
    if (raw.tags !== undefined) payloadPatch.tags = normalizeSupportTags(raw.tags);
    if (raw.followers !== undefined) payloadPatch.followers = normalizeSupportPeople(raw.followers);
    if (raw.ccs !== undefined) payloadPatch.ccs = normalizeSupportPeople(raw.ccs);
    if (raw.queue !== undefined || raw.group !== undefined) payloadPatch.queueKey = clean(raw.queue || raw.group, 120) || "support";
    await updateCaseRecord(createdRow, fields, payloadPatch);
  }
  await audit("AGENT_CASE_CREATED", { caseId: created.caseId, caseRef: created.caseRef }, agent);
  return getAgentSupportCaseCore({ caseId: created.caseId });
}


async function addHumanHandoffNote(caseId, details = {}) {
  const row = await findCaseRecord(caseId);
  if (!row) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const text = [
    "Alexandra / customer requested a human handoff.",
    details.reason ? `Reason: ${clean(details.reason, 2000)}` : "",
    details.summary ? `Conversation summary: ${clean(details.summary, 6000)}` : "",
    details.collectedFields && Object.keys(obj(details.collectedFields)).length ? `Collected fields:\n${JSON.stringify(details.collectedFields, null, 2).slice(0, 10000)}` : "",
    details.transcript ? `Conversation transcript / excerpt:\n${typeof details.transcript === "string" ? clean(details.transcript, 12000) : JSON.stringify(details.transcript, null, 2).slice(0, 12000)}` : ""
  ].filter(Boolean).join("\n\n");
  await insertSupportMessage(row, { content: text, senderType: "system", senderName: "SKANDI Support", channel: "internal", privateNote: true, source: "human-handoff" });
  const p = casePayload(row);
  await updateCaseRecord(row, { status: "open" }, { liveHandoff: true, handoffRequestedAt: nowIso(), handoffSource: clean(details.source || "support", 80), labels: [...new Set([...arr(p.labels), "human-handoff", "alexandra-handoff"])] });
}

export async function requestCustomerHumanHandoffCore({ caseId = "", input = {}, reason = "Customer requested a human agent.", summary = "", collectedFields = {}, transcript = "" } = {}) {
  const profile = memberProfile(await memberSafe());
  if (!profile.loggedIn) throw new Error("SUPPORT_SIGN_IN_REQUIRED");
  let id = clean(caseId, 160);
  let created = null;
  if (!id) {
    created = await createCaseWithProfile(profile, {
      fullName: profile.displayName, email: profile.email, phone: profile.phone,
      category: "general", subCategory: "general-question",
      subject: clean(input.subject || "Live Customer Service Request", 240),
      message: clean(input.message || "I would like to chat with a Human SKANDI Customer Service Agent.", 12000),
      bookingRef: clean(input.bookingRef || input.pnr, 80), pnr: clean(input.pnr || input.bookingRef, 80),
      requestedSupportCategory: clean(input.category, 80), requestedSupportTopic: clean(input.subCategory, 160),
      source: "human-live-chat", sourcePage: "/about/support"
    }, { allowGenericCategory: true });
    id = created.caseId;
  } else await customerCase(id, { adopt: true });
  await addHumanHandoffNote(id, { reason, summary, collectedFields, transcript, source: "customer-help" });
  const availability = await getHumanSupportAvailabilityCore().catch(() => ({ status: "unknown", available: false, onlineAgents: 0, queueOpen: true }));
  const livekitSession = availability.available ? await issueSupportLiveKitSessionCore({ caseId: id, role: "customer", subjectId: profile.memberId || profile.email, participantName: profile.displayName || "Traveler" }) : null;
  await audit("CUSTOMER_HUMAN_HANDOFF_REQUESTED", { caseId: id, availability: availability.status }, profile);
  return { ok: true, caseId: id, caseRef: created?.caseRef || caseRefOf(await findCaseRecord(id) || {}), status: livekitSession ? "live" : "queued", availability, livekitSession, message: livekitSession ? "Connecting you to a Human SKANDI Customer Service Agent." : "Your request is in the Customer Service queue. A SKANDI agent will follow up as soon as possible." };
}

export async function addCustomerLiveSupportMessageCore({ caseId, content } = {}) {
  const result = await addCustomerSupportMessageCore({ caseId, content, source: "human-live-chat" });
  const { profile } = await customerCase(caseId, { adopt: true });
  const livekitSession = await issueSupportLiveKitSessionCore({ caseId, role: "customer", subjectId: profile.memberId || profile.email, participantName: profile.displayName || "Traveler" });
  return { ...result, livekitSession };
}

export async function startCustomerSupportChatCore({ page = "my-profile", tab = "overview", bookingRef = "" } = {}) {
  return requestCustomerHumanHandoffCore({ input: { category: "general", subCategory: "general-question", subject: "Customer Support Chat", message: `Customer opened Support Chat from ${clean(page, 120) || "my-profile"}${tab ? ` / ${clean(tab, 80)}` : ""}.`, bookingRef: clean(bookingRef, 80), source: "my-profile-live-chat", sourcePage: "/my-profile" }, reason: "Customer opened Human SKANDI Customer Service chat from My Profile." });
}

export async function sendCustomerSupportChatMessageCore({ caseId = "", content = "" } = {}) { return addCustomerLiveSupportMessageCore({ caseId, content }); }

export async function deleteAgentSupportCaseCore({ caseId = "" } = {}) {
  const agent = await requireSupportAgentCore();
  const row = await findCaseRecord(clean(caseId, 160));
  if (!row) throw new Error("SUPPORT_CASE_NOT_FOUND");
  await updateCaseRecord(row, { status: "closed" }, { archived: true, archivedAt: nowIso(), archivedBy: agent.skId || agent.id || agent.email });
  await audit("AGENT_CASE_ARCHIVED", { caseId: caseIdOf(row) }, agent);
  return { ok: true, caseId: caseIdOf(row), status: "closed", archived: true, deleted: false };
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
  const displayName = clean(profile.displayName || profile.preferredName || profile.preferred_name || [profile.firstName || profile.first_name, profile.lastName || profile.last_name].filter(Boolean).join(" ") || email.split("@")[0], 200);
  const memberId = `staff:${skId || rawId || createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
  return { loggedIn: true, memberId, rawMemberId: rawId, skId, email, displayName, firstName: clean(profile.firstName || profile.first_name, 100), lastName: clean(profile.lastName || profile.last_name, 100), phone: clean(profile.phone || profile.workPhone || profile.work_phone, 80), department: clean(profile.department || profile.departmentName || profile.department_name, 120), base: clean(profile.base || profile.station || profile.baseCode || profile.stationCode, 80), profile, session };
}

function assertStaffOwnsCase(row, staff) {
  if (!row) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const memberMatch = clean(row.member_id, 240) && String(row.member_id) === String(staff.memberId);
  const emailMatch = row.email && lower(row.email, 254) === lower(staff.email, 254);
  if (!memberMatch && !emailMatch) throw new Error("HELPDESK_CASE_ACCESS_DENIED");
}

async function staffHelpDeskCase(caseId) {
  const staff = await requireHelpDeskStaffCore();
  const row = await findCaseRecord(clean(caseId, 160));
  assertStaffOwnsCase(row, staff);
  return { staff, row };
}

export async function getHelpDeskRoutingDecisionCore({ operational = false, affectedAt = "" } = {}) {
  const isOperational = truthy(operational);
  if (!isOperational) return { target: "SUPPORT", operational: false, affectedAt: "", within72Hours: false, reason: "NON_OPERATIONAL" };
  const raw = clean(affectedAt, 100);
  if (!raw) throw new Error("HELPDESK_AFFECTED_AT_REQUIRED");
  const affected = new Date(raw);
  if (Number.isNaN(affected.getTime())) throw new Error("HELPDESK_AFFECTED_AT_INVALID");
  const hoursUntilAffected = (affected.getTime() - Date.now()) / 3600000;
  const within72Hours = hoursUntilAffected >= 0 && hoursUntilAffected <= 72;
  return { target: within72Hours ? "GROUPTALK" : "SUPPORT", operational: true, affectedAt: affected.toISOString(), within72Hours, hoursUntilAffected: Math.round(hoursUntilAffected * 10) / 10, reason: within72Hours ? "OPERATIONAL_WITHIN_72_HOURS" : "OPERATIONAL_BEYOND_72_HOURS" };
}

export async function getStaffHelpDeskBootstrapCore() {
  const staff = await requireHelpDeskStaffCore();
  const [{ workflows }, supportCases] = await Promise.all([getSupportWorkflowCore(), listStaffHelpDeskSupportCasesCore({ staff })]);
  return { ok: true, profile: { skId: staff.skId, displayName: staff.displayName, email: staff.email, department: staff.department, base: staff.base }, workflows, routingPolicy: { operationalReceiver: "GROUPTALK", operationalWindowHours: 72, nonOperationalReceiver: "SUPPORT" }, supportCases: supportCases.cases };
}

export async function createStaffHelpDeskSupportCaseCore({ input = {} } = {}) {
  const staff = await requireHelpDeskStaffCore();
  const raw = obj(input);
  const sourceChannel = upper(raw.sourceChannel || (raw.entryMode === "chat" ? "INTERNAL_HELPDESK_CHAT" : "INTERNAL_HELPDESK_FORM"), 120);
  const fullName = staff.displayName || "SKANDI Staff";
  const result = await createCaseWithProfile(staff, { ...raw, firstName: raw.firstName || staff.firstName || fullName.split(/\s+/)[0] || "SKANDI", lastName: raw.lastName || staff.lastName || fullName.split(/\s+/).slice(1).join(" ") || "Staff", fullName, email: staff.email, phone: raw.phone || staff.phone, category: raw.category || "general", subject: raw.subject || "Internal HelpDesk request", message: raw.message || raw.description || "Internal HelpDesk request.", source: lower(sourceChannel, 120), sourcePage: "/riaintra/success-factors/helpdesk", requesterType: "STAFF", requesterSkId: staff.skId, requesterDepartment: staff.department, requesterBase: staff.base, sourceChannel }, { allowGenericCategory: true, sourceOverride: lower(sourceChannel, 120) });
  await audit("HELPDESK_SUPPORT_CASE_CREATED", { caseId: result.caseId, caseRef: result.caseRef, sourceChannel, operational: truthy(raw.operational), affectedAt: clean(raw.affectedAt, 100) }, staff);
  return { ...result, receiver: "SUPPORT", requesterType: "STAFF" };
}

export async function listStaffHelpDeskSupportCasesCore({ staff: suppliedStaff = null } = {}) {
  const staff = suppliedStaff || await requireHelpDeskStaffCore();
  const rows = await sbRows(DB.cases, { select: "*", member_id: `eq.${staff.memberId}`, order: "updated_at.desc", limit: 100 });
  return { ok: true, cases: rows.map(row => { const c = normalizeCase(row); return { receiver: "SUPPORT", caseId: c.caseId, caseRef: c.caseRef, subject: c.subject, category: c.category, priority: c.priority, status: c.status, updatedAt: c.updatedAt, createdAt: c.createdAt }; }) };
}

export async function getStaffHelpDeskSupportCaseCore({ caseId } = {}) {
  const id = clean(caseId, 160);
  const { row } = await staffHelpDeskCase(id);
  const c = normalizeCase(row);
  return { receiver: "SUPPORT", case: { caseId: c.caseId, caseRef: c.caseRef, subject: c.subject, category: c.category, status: c.status, priority: c.priority, updatedAt: c.updatedAt }, messages: await messagesByCaseId(c.caseId) };
}

export async function addStaffHelpDeskSupportMessageCore({ caseId, content } = {}) {
  const id = clean(caseId, 160);
  const { staff, row } = await staffHelpDeskCase(id);
  const sentMessage = await insertSupportMessage(row, { content, senderType: "staff", senderName: staff.displayName, memberId: staff.memberId, channel: "helpdesk", source: "internal-helpdesk-chat" });
  await audit("HELPDESK_SUPPORT_REPLIED", { caseId: caseIdOf(row), caseRef: caseRefOf(row) }, staff);
  return { ok: true, receiver: "SUPPORT", caseId: caseIdOf(row), sentMessage };
}

export async function startAlexandraSupportSessionCore({ locale = "en-US", currency = "USD", pagePath = "/about/support" } = {}) {
  const profile = memberProfile(await memberSafe());
  const session = await issueAlexandraLiveKitSessionCore({ locale: clean(locale, 40) || "en-US", currency: upper(currency, 12) || "USD", pagePath: clean(pagePath, 300) || "/about/support", authenticated: profile.loggedIn === true, channel: "web" });
  try {
    await sbInsert(DB.alexandraSessions, { session_id: session.sessionId, member_id: profile.memberId || null, status: "active", payload: { provider: "LiveKit", agentRuntime: "LiveKit Agents", agentName: session.agentName, roomName: session.roomName, contextId: session.contextId, dispatchId: session.dispatchId, pagePath: clean(pagePath, 300) || "/about/support", locale: clean(locale, 40) || "en-US", currency: upper(currency, 12) || "USD", authenticated: profile.loggedIn === true } });
  } catch (_) {}
  await audit("ALEXANDRA_SESSION_STARTED", { sessionId: session.sessionId, provider: "LiveKit", authenticated: profile.loggedIn === true, pagePath: clean(pagePath, 300) || "/about/support" }, profile);
  return { ok: true, loggedIn: profile.loggedIn === true, session };
}

export async function verifyAlexandraGatewayTokenCore(token) {
  const expected = await readSecret("SKANDI_ALEXANDRA_GATEWAY_TOKEN", "", true);
  const supplied = clean(token, 12000);
  if (!supplied || gatewayHash(supplied) !== gatewayHash(expected)) throw new Error("ALEXANDRA_GATEWAY_UNAUTHORIZED");
  return true;
}

export async function getSupportWorkflowTrustedCore({ category = "" } = {}) { return getSupportWorkflowCore({ category }); }

export async function createSupportCaseTrustedCore({ customer = {}, input = {} } = {}) {
  const profile = profileFromTrustedCustomer(customer);
  if (!validEmail(profile.email || input.email)) throw new Error("SUPPORT_EMAIL_INVALID");
  const normalized = { ...obj(input), firstName: input.firstName || profile.firstName, lastName: input.lastName || profile.lastName, fullName: input.fullName || profile.displayName, email: input.email || profile.email, phone: input.phone || profile.phone, source: "alexandra", sourcePage: input.sourcePage || "alexandra-prod", requesterType: "CUSTOMER", sourceChannel: "ALEXANDRA" };
  const result = await createCaseWithProfile(profile, normalized, { allowGenericCategory: true, sourceOverride: "alexandra" });
  await audit("ALEXANDRA_CASE_CREATED", { caseId: result.caseId, caseRef: result.caseRef, category: normalized.category }, profile);
  return result;
}

export async function updateSupportCaseTrustedCore({ caseId, summary = "", collectedFields = {}, internalNote = "" } = {}) {
  const id = clean(caseId, 160);
  if (!id) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  const row = await findCaseRecord(id);
  if (!row) throw new Error("SUPPORT_CASE_NOT_FOUND");
  const body = [summary ? `Alexandra summary:\n${clean(summary, 8000)}` : "", internalNote ? `Alexandra note:\n${clean(internalNote, 8000)}` : "", Object.keys(obj(collectedFields)).length ? `Structured fields:\n${JSON.stringify(collectedFields, null, 2).slice(0, 12000)}` : ""].filter(Boolean).join("\n\n");
  if (!body) throw new Error("SUPPORT_UPDATE_EMPTY");
  await insertSupportMessage(row, { content: body, senderType: "alexandra", senderName: "Alexandra", channel: "internal", privateNote: true, source: "alexandra", payload: { collectedFields: obj(collectedFields) } });
  await updateCaseRecord(row, {}, { alexandraSummary: clean(summary, 8000), collectedFields: { ...obj(casePayload(row).collectedFields), ...obj(collectedFields) } });
  await audit("ALEXANDRA_CASE_UPDATED", { caseId: caseIdOf(row), fields: Object.keys(obj(collectedFields)) }, {});
  return { ok: true, caseId: caseIdOf(row) };
}

export async function requestHumanHandoffTrustedCore({ caseId = "", customer = {}, input = {}, reason = "", summary = "", collectedFields = {}, transcript = "" } = {}) {
  let id = clean(caseId, 160);
  let created = null;
  if (!id) {
    created = await createSupportCaseTrustedCore({ customer, input: { ...obj(input), category: "general", subCategory: "general-question", subject: input.subject || "Alexandra Human Handoff", message: input.message || summary || reason || "The traveler requested personal help from SKANDI Customer Service.", requestedSupportCategory: clean(input.category, 80), requestedSupportTopic: clean(input.subCategory, 160) } });
    id = created.caseId;
  }
  await addHumanHandoffNote(id, { reason, summary, collectedFields, transcript, source: "alexandra" });
  const availability = await getHumanSupportAvailabilityCore().catch(() => ({ status: "unknown", available: false, onlineAgents: 0, queueOpen: true }));
  const trustedProfile = profileFromTrustedCustomer(customer);
  const livekitSession = availability.available ? await issueSupportLiveKitSessionCore({ caseId: id, role: "customer", subjectId: trustedProfile.memberId || trustedProfile.email || `alexandra-${id}`, participantName: trustedProfile.displayName || "Traveler" }).catch(() => null) : null;
  await audit("ALEXANDRA_HUMAN_HANDOFF_REQUESTED", { caseId: id, availability: availability.status, provider: "LiveKit" }, trustedProfile);
  return { ok: true, caseId: id, caseRef: created?.caseRef || caseRefOf(await findCaseRecord(id) || {}), availability, livekitSession, status: livekitSession ? "ready-for-client-handoff" : "queued", clientAction: { name: "start_human_chat", arguments: { caseId: id, status: livekitSession ? "live" : "queued", livekitSession, message: livekitSession ? "Connecting you to a Human SKANDI Customer Service Agent." : "Your request is in the Customer Service queue. A SKANDI agent will follow up as soon as possible." } } };
}

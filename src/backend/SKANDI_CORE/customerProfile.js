// /src/backend/SKANDI_CORE/customerProfile.js
// SKANDI Backend Base 1.0 — B-011.31 customer My Profile + SKANDI Club core.
// Owns customer-scoped profile/loyalty aggregation and booking servicing orchestration.
// Wix authentication stays in customerProfile.web.js. Supabase/Duffel transport stays in canonical shared cores.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { listCustomerBookingCartsCore } from "backend/SKANDI_CORE/customerBooking.js";
import { getDuffelOrderCore, createDuffelOrderCancellationCore, confirmDuffelOrderCancellationCore } from "backend/SKANDI_CORE/duffelAir.js";
import {
  searchDuffelOrderChangesCore,
  createDuffelPendingOrderChangeCore,
  prepareDuffelOrderChangePaymentCore,
  confirmDuffelOrderChangeCore,
  listDuffelPostBookingServicesCore,
  prepareDuffelPostBookingServicesPaymentCore,
  confirmDuffelPostBookingServicesCore,
  listDuffelAirlineInitiatedChangesCore,
  acceptDuffelAirlineInitiatedChangeCore
} from "backend/SKANDI_CORE/duffelServicing.js";
import { getDuffelStayBookingCore, cancelDuffelStayBookingCore, getDuffelCarBookingCore, cancelDuffelCarBookingCore } from "backend/SKANDI_CORE/duffelGround.js";
import { ensureDuffelCustomerUserCore } from "backend/SKANDI_CORE/duffelIdentity.js";

const VERSION = "B-011.31";
const ACTIVE_POINT_EXCLUSIONS = new Set(["VOID", "CANCELLED", "REVERSED"]);

function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function lower(v, max = 500) { return clean(v, max).toLowerCase(); }
function upper(v, max = 500) { return clean(v, max).toUpperCase(); }
function arr(v) { return Array.isArray(v) ? v : []; }
function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function now() { return new Date().toISOString(); }
function isUuid(v) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v, 80)); }
function qeq(v) { return `eq.${clean(v, 1200)}`; }
function fail(code, message, status = 400) { const e = new Error(message); e.name = "CustomerProfileError"; e.code = code; e.status = status; e.publicMessage = message; return e; }
function requireContext(context) {
  if (!context?.memberId) throw fail("LOGIN_REQUIRED", "Sign in to manage your SKANDI profile.", 401);
  return { memberId: clean(context.memberId, 180), email: lower(context.email, 254), firstName: clean(context.firstName, 160), lastName: clean(context.lastName, 160), displayName: clean(context.displayName, 300) };
}
async function select(table, query = {}) { const rows = await restRequest({ table, query }); return arr(rows); }
async function insert(table, body) { const rows = await restRequest({ table, method: "POST", body }); return arr(rows)[0] || null; }
async function patch(table, query, body) { const rows = await restRequest({ table, method: "PATCH", query, body }); return arr(rows); }
async function remove(table, query) { return restRequest({ table, method: "DELETE", query }); }
function safeError(error) { return { code: upper(error?.code || "REQUEST_FAILED", 80), message: clean(error?.publicMessage || error?.message || "The request could not be completed.", 500) }; }
function safeUrl(value, { allowInternal = false } = {}) {
  const url = clean(value, 2400);
  if (!url) return "";
  if (/^https:\/\//i.test(url)) return url;
  if (allowInternal && /^\/(?!\/)[A-Za-z0-9_~!$&'()*+,;=:@%/?#.-]*$/.test(url)) return url;
  return "";
}
function safePublicPayload(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.slice(0, 100).map(item => safePublicPayload(item, depth + 1));
  if (typeof value !== "object") return typeof value === "string" ? clean(value, 4000) : value;
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (/password|secret|token|encrypted|hash|card_number|security_code|cvv|cvc|client_secret|access_token|authorization/i.test(key)) continue;
    out[key] = safePublicPayload(raw, depth + 1);
  }
  return out;
}

async function resolveProfile(context, { create = true } = {}) {
  const auth = requireContext(context);
  let row = (await select("customer_profiles", { select: "*", member_id: qeq(auth.memberId), limit: "1" }))[0] || null;
  if (!row) row = (await select("customer_profiles", { select: "*", wix_member_id: qeq(auth.memberId), limit: "1" }))[0] || null;
  if (!row && auth.email) row = (await select("customer_profiles", { select: "*", auth_email: qeq(auth.email), limit: "1" }))[0] || (await select("customer_profiles", { select: "*", email: qeq(auth.email), limit: "1" }))[0] || null;
  if (!row && create) {
    row = await insert("customer_profiles", {
      member_id: auth.memberId,
      wix_member_id: auth.memberId,
      auth_provider: "wix",
      auth_email: auth.email || null,
      email: auth.email || null,
      first_name: auth.firstName || null,
      last_name: auth.lastName || null,
      display_name: auth.displayName || [auth.firstName, auth.lastName].filter(Boolean).join(" ") || null,
      status: "Active",
      payload: { createdFrom: "MY_PROFILE" },
      created_at: now(), updated_at: now()
    });
  }
  if (!row) return null;
  if (row.wix_member_id && row.wix_member_id !== auth.memberId && lower(row.auth_email || row.email) !== auth.email) throw fail("PROFILE_OWNERSHIP_MISMATCH", "This customer profile is linked to a different account.", 403);
  if (!row.wix_member_id) {
    const updated = await patch("customer_profiles", { id: qeq(row.id) }, { wix_member_id: auth.memberId, auth_email: row.auth_email || auth.email || null, updated_at: now() });
    row = updated[0] || { ...row, wix_member_id: auth.memberId };
  }
  return row;
}

async function clubData(profile) {
  if (!profile) return { clubProfile: null, tiers: [], tier: null, nextTier: null, pointsBalance: 0, points: [], progress: null };
  const [clubRows, tiers, points] = await Promise.all([
    select("club_profiles", { select: "*", member_id: qeq(profile.member_id), limit: "1" }),
    select("club_tiers", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "100" }),
    select("skandi_points_ledger", { select: "id,transaction_id,member_id,booking_id,booking_reference,transaction_date,type,amount,description,status,is_manual_adjustment,created_at", member_id: qeq(profile.member_id), order: "transaction_date.desc", limit: "5000" })
  ]);
  const valid = points.filter(row => !ACTIVE_POINT_EXCLUSIONS.has(upper(row.status, 40)));
  const balance = valid.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const tier = tiers.find(row => row.id === profile.club_tier_id) || tiers.find(row => lower(row.tier_key) === "member") || tiers[0] || null;
  const nextTier = tier ? tiers.find(row => Number(row.sort_order) > Number(tier.sort_order)) || null : null;
  const progress = tier ? {
    currentMin: Number(tier.min_points || 0),
    currentMax: tier.max_points === null ? null : Number(tier.max_points),
    nextMin: nextTier ? Number(nextTier.min_points || 0) : null,
    pointsToNext: nextTier ? Math.max(0, Number(nextTier.min_points || 0) - balance) : 0,
    percent: nextTier ? Math.max(0, Math.min(100, ((balance - Number(tier.min_points || 0)) / Math.max(1, Number(nextTier.min_points || 0) - Number(tier.min_points || 0))) * 100)) : 100
  } : null;
  return { clubProfile: clubRows[0] || null, tiers, tier, nextTier, pointsBalance: balance, points: points.slice(0, 250), progress };
}

function publicProfile(profile, club) {
  const cp = club.clubProfile || {};
  const payload = obj(profile?.payload);
  return {
    id: profile?.id || null,
    memberId: profile?.member_id || "",
    clubNumber: profile?.club_number ? String(profile.club_number) : "",
    isLoyaltyMember: profile?.is_loyalty_member === true,
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    displayName: profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
    email: profile?.email || "",
    phone: profile?.phone || "",
    countryOfResidenceId: profile?.country_of_residence_id || null,
    preferredLanguageId: profile?.preferred_language_id || null,
    preferredCurrency: profile?.preferred_currency || "",
    preferredDepartureAirportId: profile?.preferred_departure_airport_id || null,
    customerType: profile?.customer_type || "CUSTOMER",
    accessibilityNeeds: profile?.accessibility_needs_general || "",
    marketingConsent: profile?.marketing_consent === true,
    privacyAccepted: profile?.privacy_accepted === true,
    status: profile?.status || "Active",
    accountCreatedAt: profile?.created_at || null,
    lastLoginAt: profile?.last_login_at || null,
    dateOfBirth: cp.date_of_birth || null,
    gender: cp.gender || "",
    nationalityId: cp.nationality_id || null,
    homeAddress: obj(cp.home_address),
    passportLast4: cp.passport_last4 || "",
    passportExpiry: cp.passport_expiry || null,
    passportCountryId: cp.passport_country_id || null,
    dietaryPrefs: cp.dietary_prefs || clean(payload.dietaryPrefs || payload.dietary_prefs, 1000),
    homeAirportId: cp.home_airport_id || profile?.preferred_departure_airport_id || null,
    providerCustomerUserId: clean(payload.duffelCustomerUserId, 220) || null,
    payload: {
      seatPreference: clean(payload.seatPreference || payload.seat_preference, 100),
      mealPreferences: arr(payload.mealPreferences || payload.meal_preferences).slice(0, 20),
      frequentFlyerPrograms: arr(payload.frequentFlyerPrograms || payload.frequent_flyer_programs).slice(0, 20),
      hotelLoyaltyPrograms: arr(payload.hotelLoyaltyPrograms || payload.hotel_loyalty_programs).slice(0, 20),
      carRentalLoyaltyPrograms: arr(payload.carRentalLoyaltyPrograms || payload.car_rental_loyalty_programs).slice(0, 20),
      emergencyContacts: arr(payload.emergencyContacts || payload.emergency_contacts).slice(0, 10)
    }
  };
}
function publicTier(row) { return row ? { id: row.id, key: row.tier_key, name: row.tier_name, minPoints: Number(row.min_points || 0), maxPoints: row.max_points === null ? null : Number(row.max_points), multiplier: Number(row.multiplier || 1), sortOrder: Number(row.sort_order || 999), benefits: arr(obj(row.payload).benefits) } : null; }
function publicPoint(row) { return { id: row.id, transactionId: row.transaction_id, bookingId: row.booking_id || null, bookingReference: row.booking_reference || "", date: row.transaction_date || row.created_at || null, type: row.type || "", amount: Number(row.amount || 0), description: row.description || "", status: row.status || "" }; }

async function references() {
  const [countries, languages, airports] = await Promise.all([
    select("countries_list", { select: "id,country_code,country_name,active", active: "eq.true", order: "country_name.asc", limit: "400" }).catch(() => []),
    select("languages", { select: "id,language_code,language_name,active", active: "eq.true", order: "language_name.asc", limit: "400" }).catch(() => []),
    select("travel_info_airports", { select: "ID,iata,title,locationCity,country,active,published,customer_visible", order: "iata.asc", limit: "600" }).catch(() => [])
  ]);
  return {
    countries: countries.map(row => ({ id: row.id, code: row.country_code || "", name: row.country_name || "" })).filter(row => row.id && row.name),
    languages: languages.map(row => ({ id: row.id, code: row.language_code || "", name: row.language_name || "" })).filter(row => row.id && row.name),
    airports: airports.map(row => ({ id: row.ID, iata: upper(row.iata, 3), name: row.title || "", city: row.locationCity || "", country: row.country || "" })).filter(row => row.id && row.iata)
  };
}

async function customerRows(profile) {
  const memberId = profile.member_id;
  const [travelers, profileDocs, favorites, notifications, payments, wallet, links] = await Promise.all([
    select("customer_travelers", { select: "*", member_id: qeq(memberId), active: "eq.true", order: "is_primary.desc,created_at.asc", limit: "100" }),
    select("customer_travel_documents", { select: "id,member_id,traveler_id,document_type,document_title,document_number_last4,issuing_country_id,issue_date,expiry_date,file_url,status,payload,created_at,updated_at", member_id: qeq(memberId), order: "created_at.desc", limit: "200" }),
    select("customer_favorites", { select: "id,item_type,item_id,item_slug,item_title,item_image_url,item_url,source_page,active,created_at", member_id: qeq(memberId), active: "eq.true", order: "created_at.desc", limit: "200" }),
    select("customer_notifications", { select: "id,notification_id,type,title,message,action_path,entity_type,entity_id,read,payload,created_at,updated_at", member_id: qeq(memberId), order: "created_at.desc", limit: "200" }).catch(() => []),
    select("customer_payment_methods", { select: "id,payment_provider,brand,last4,expiry_month,expiry_year,active,created_at,updated_at", member_id: qeq(memberId), active: "eq.true", order: "updated_at.desc", limit: "50" }).catch(() => []),
    select("customer_wallet_items", { select: "id,item_type,title,code,file_url,expires_at,active,created_at,updated_at", member_id: qeq(memberId), active: "eq.true", order: "created_at.desc", limit: "100" }).catch(() => []),
    select("customer_profiles_booking_links", { select: "id,member_id,booking_reference,status,linked_at,booking_id,link_source,verified_at,payload", member_id: qeq(memberId), order: "linked_at.desc", limit: "500" })
  ]);
  return { travelers, profileDocs, favorites, notifications, payments, wallet, links };
}

function travelerView(row) { return { id: row.id, travelerType: row.traveler_type || "Companion", firstName: row.first_name || "", middleName: row.middle_name || "", lastName: row.last_name || "", displayName: row.display_name || [row.first_name,row.middle_name,row.last_name].filter(Boolean).join(" "), dateOfBirth: row.date_of_birth || null, gender: row.gender || "", nationalityId: row.nationality_id || null, email: row.email || "", phone: row.phone || "", passportLast4: row.passport_last4 || "", passportExpiry: row.passport_expiry || null, passportCountryId: row.passport_country_id || null, dietaryPrefs: row.dietary_prefs || "", accessibilityNeeds: row.accessibility_needs || "", isPrimary: row.is_primary === true, active: row.active !== false, payload: safePublicPayload(obj(row.payload)) || {} }; }
function favoriteView(row) { return { id: row.id, type: row.item_type || "", itemId: row.item_id || "", slug: row.item_slug || "", title: row.item_title || "Saved item", image: safeUrl(row.item_image_url), url: safeUrl(row.item_url, { allowInternal: true }), sourcePage: safeUrl(row.source_page, { allowInternal: true }) || clean(row.source_page, 240), createdAt: row.created_at || null }; }
function notificationView(row) { return { id: row.id, notificationId: row.notification_id || row.id, type: row.type || "", title: row.title || "Update", message: row.message || "", actionPath: safeUrl(row.action_path, { allowInternal: true }), entityType: row.entity_type || "", entityId: row.entity_id || "", read: row.read === true, createdAt: row.created_at || null }; }
function paymentView(row) { return { id: row.id, provider: row.payment_provider || "", brand: row.brand || "Card", last4: row.last4 || "", expiryMonth: Number(row.expiry_month || 0) || null, expiryYear: Number(row.expiry_year || 0) || null, active: row.active !== false }; }
function walletView(row) { return { id: row.id, type: row.item_type || "", title: row.title || "Wallet item", code: clean(row.code, 240), fileUrl: safeUrl(row.file_url), expiresAt: row.expires_at || null, active: row.active !== false }; }
function profileDocumentView(row) { return { id: row.id, travelerId: row.traveler_id || null, document_code: upper(row.document_type || "DOC", 40), definition_name: row.document_title || row.document_type || "Travel document", document_number: row.document_number_last4 ? `•••• ${row.document_number_last4}` : "Preparing", status: upper(row.status || "DRAFT", 60), last4: row.document_number_last4 || "", issuingCountryId: row.issuing_country_id || null, issueDate: row.issue_date || null, expiryDate: row.expiry_date || null, fileUrl: safeUrl(row.file_url), source: "CUSTOMER_PROFILE", payload: safePublicPayload(obj(row.payload)) || {} }; }

function bookingView(row, components = []) {
  const payload = obj(row.payload);
  return {
    id: row.id,
    bookingReference: row.booking_reference || row.pnr_locator || row.supplier_booking_reference || "",
    pnrLocator: row.pnr_locator || "",
    bookingType: row.booking_type || "",
    productType: row.product_type || "",
    status: row.status || "",
    paymentStatus: row.payment_status || "",
    fulfillmentStatus: row.fulfillment_status || "",
    origin: row.origin || "",
    destination: row.destination || "",
    departureDate: row.departure_date || null,
    returnDate: row.return_date || null,
    currency: row.currency || "",
    totalAmount: row.total_amount ?? null,
    taxAmount: row.tax_amount ?? null,
    supplier: row.supplier || "SKANDI",
    supplierOrderId: row.supplier_order_id || row.amadeus_order_id || "",
    supplierBookingReference: row.supplier_booking_reference || "",
    sourcePage: row.source_page || "",
    sourceChannel: row.source_channel || "",
    components: components.map(c => ({ id: c.id, type: c.component_type || "", supplier: c.supplier || "", supplierReference: c.supplier_reference || "", title: c.title || c.component_type || "Component", status: c.status || "", quantity: Number(c.quantity || 1), currency: c.currency || "", totalAmount: c.total_amount ?? null })),
    summary: clean(payload.summary || payload.selectedOffer?.summary || "", 600)
  };
}
async function bookingsFor(profile, rows) {
  const direct = await select("altea_bookings", { select: "*", customer_member_id: qeq(profile.member_id), order: "departure_date.asc,created_at.desc", limit: "500" });
  const ids = new Set(direct.map(row => row.id));
  const linkedIds = rows.links.map(link => link.booking_id).filter(isUuid);
  for (const id of linkedIds) {
    if (ids.has(id)) continue;
    const found = (await select("altea_bookings", { select: "*", id: qeq(id), limit: "1" }))[0];
    if (found) { direct.push(found); ids.add(id); }
  }
  const components = direct.length ? await select("altea_booking_components", { select: "*", booking_id: `in.(${direct.map(row => row.id).join(",")})`, order: "created_at.asc", limit: "2000" }).catch(async () => {
    const out=[]; for (const row of direct.slice(0,100)) out.push(...await select("altea_booking_components",{select:"*",booking_id:qeq(row.id),order:"created_at.asc",limit:"100"})); return out;
  }) : [];
  const byBooking = new Map();
  for (const c of components) { if (!byBooking.has(c.booking_id)) byBooking.set(c.booking_id, []); byBooking.get(c.booking_id).push(c); }
  return direct.map(row => bookingView(row, byBooking.get(row.id) || []));
}

async function bookingDocuments(bookings, profileDocs) {
  const out = profileDocs.map(profileDocumentView);
  for (const booking of bookings.slice(0,100)) {
    const docs = await select("altea_booking_documents", { select: "id,booking_id,passenger_id,provider,provider_document_id,document_type,document_number,status,payload,created_at,updated_at", booking_id: qeq(booking.id), order: "created_at.desc", limit: "200" }).catch(() => []);
    for (const row of docs) { const payload = safePublicPayload(obj(row.payload)) || {}; out.push({ id: row.id, bookingId: row.booking_id, travelerId: row.passenger_id || null, document_code: upper(row.document_type || "DOC", 40), definition_name: clean(payload.title || row.document_type || "Booking document", 300), document_number: row.document_number || "Preparing", status: upper(row.status || "DRAFT", 60), provider: row.provider || "", providerDocumentId: row.provider_document_id || "", fileUrl: safeUrl(payload.fileUrl || payload.file_url), source: "BOOKING", payload }); }
  }
  return out;
}

export async function getCustomerClubSummaryCore(context) {
  const profile = await resolveProfile(context, { create: false });
  if (!profile) return { enrolled: false, points: 0, tier: "", clubNumber: "" };
  const club = await clubData(profile);
  return { enrolled: profile.is_loyalty_member === true, points: club.pointsBalance, tier: publicTier(club.tier)?.name || "", clubNumber: profile.club_number ? String(profile.club_number) : "", memberSince: club.clubProfile?.enrolled_at || (profile.is_loyalty_member === true ? profile.created_at || null : null) };
}

export async function getCustomerProfileBootstrapCore(context, input = {}) {
  const profile = await resolveProfile(context, { create: true });
  const [club, rows, refs, carts] = await Promise.all([clubData(profile), customerRows(profile), references(), listCustomerBookingCartsCore(requireContext(context), { limit: 100 }).catch(() => ({ carts: [] }))]);
  const bookings = await bookingsFor(profile, rows);
  const documents = await bookingDocuments(bookings, rows.profileDocs);
  const upcoming = bookings.filter(b => b.departureDate && b.departureDate >= new Date().toISOString().slice(0,10) && upper(b.status) !== "CANCELLED").sort((a,b)=>String(a.departureDate).localeCompare(String(b.departureDate)));
  const history = bookings.filter(b => !upcoming.some(x => x.id === b.id)).sort((a,b)=>String(b.departureDate||"").localeCompare(String(a.departureDate||"")));
  return {
    ok: true,
    version: VERSION,
    profile: publicProfile(profile, club),
    club: { enrolled: profile.is_loyalty_member === true, memberSince: club.clubProfile?.enrolled_at || (profile.is_loyalty_member === true ? profile.created_at || null : null), pointsBalance: club.pointsBalance, tier: publicTier(club.tier), nextTier: publicTier(club.nextTier), tiers: club.tiers.map(publicTier), progress: club.progress, ledger: club.points.map(publicPoint) },
    trips: { upcoming, history, carts: arr(carts.carts) },
    travelers: rows.travelers.map(travelerView),
    documents,
    favorites: rows.favorites.map(favoriteView),
    notifications: rows.notifications.map(notificationView),
    wallet: rows.wallet.map(walletView),
    paymentMethods: rows.payments.map(paymentView),
    references: refs,
    routes: { overview: "/my-profile?section=club&view=overview", clubActivity: "/my-profile?section=club&view=activity", clubProgram: "/my-profile?section=club&view=program", trips: "/my-profile?section=trips&view=upcoming", tripHistory: "/my-profile?section=trips&view=past", orders: "/my-profile?section=trips&view=drafts", documents: "/my-profile?section=trips&view=upcoming", travelers: "/my-profile?section=profile&view=travelers", wallet: "/my-profile?section=profile&view=wallet", saved: "/my-profile?section=profile&view=saved", notifications: "/my-profile?section=account&view=notifications", settings: "/my-profile?section=account&view=settings", support: "/my-profile/support", clubPublic: "/skandi-club" },
    requestedTab: clean(input.tab, 40) || "overview",
    generatedAt: now()
  };
}

export async function updateCustomerProfileCore(context, input = {}) {
  const profile = await resolveProfile(context, { create: true });
  const currentPayload = obj(profile.payload), changes = obj(input.profile || input);
  const body = { updated_at: now() };
  for (const [key, column, max] of [["firstName","first_name",160],["lastName","last_name",160],["displayName","display_name",300],["email","email",254],["phone","phone",40],["preferredCurrency","preferred_currency",3],["accessibilityNeeds","accessibility_needs_general",2000]]) if (Object.prototype.hasOwnProperty.call(changes,key)) body[column] = clean(changes[key],max) || null;
  if (Object.prototype.hasOwnProperty.call(changes,"marketingConsent")) body.marketing_consent = changes.marketingConsent === true;
  for (const [key,column] of [["countryOfResidenceId","country_of_residence_id"],["preferredLanguageId","preferred_language_id"],["preferredDepartureAirportId","preferred_departure_airport_id"]]) if (Object.prototype.hasOwnProperty.call(changes,key)) body[column] = isUuid(changes[key]) ? changes[key] : null;
  const preferencePayload = { ...currentPayload };
  for (const [key,max] of [["seatPreference",100],["dietaryPrefs",1000]]) if (Object.prototype.hasOwnProperty.call(changes,key)) preferencePayload[key] = clean(changes[key],max);
  for (const key of ["mealPreferences","frequentFlyerPrograms","hotelLoyaltyPrograms","carRentalLoyaltyPrograms","emergencyContacts"]) if (Object.prototype.hasOwnProperty.call(changes,key)) preferencePayload[key] = arr(changes[key]).slice(0,20);
  body.payload = preferencePayload;
  let updated = (await patch("customer_profiles", { id: qeq(profile.id) }, body))[0] || { ...profile, ...body };
  let providerSync = { ok: false, skipped: true, reason: "Profile needs first name, last name and email before supplier identity can be synchronized." };
  if (updated.first_name && updated.last_name && updated.email) {
    try {
      const refs = await references();
      const language = refs.languages.find(x => x.id === updated.preferred_language_id)?.code || "";
      const synced = await ensureDuffelCustomerUserCore({ customerUserId: clean(obj(updated.payload).duffelCustomerUserId,220), email: updated.email, givenName: updated.first_name, familyName: updated.last_name, phoneNumber: updated.phone || "", preferredLanguage: language ? lower(language,2) : "" });
      const nextPayload = { ...obj(updated.payload), duffelCustomerUserId: synced.user.id, duffelCustomerUserSyncedAt: now() };
      updated = (await patch("customer_profiles", { id: qeq(updated.id) }, { payload: nextPayload, updated_at: now() }))[0] || { ...updated, payload: nextPayload };
      providerSync = { ok: true, customerUserId: synced.user.id, provider: "Duffel" };
    } catch (error) { providerSync = { ok: false, skipped: false, error: safeError(error) }; }
  }
  const club = await clubData(updated);
  return { ok: true, profile: publicProfile(updated, club), providerSync };
}

export async function saveCustomerTravelerCore(context, input = {}) {
  const profile = await resolveProfile(context, { create: true });
  const t = obj(input.traveler || input), id = clean(t.id, 80);
  const body = {
    member_id: profile.member_id,
    wix_member_id: profile.wix_member_id || context.memberId,
    traveler_type: clean(t.travelerType || "Companion", 40),
    first_name: clean(t.firstName,160)||null, middle_name: clean(t.middleName,160)||null, last_name: clean(t.lastName,160)||null,
    display_name: clean(t.displayName,300)||[clean(t.firstName,160),clean(t.middleName,160),clean(t.lastName,160)].filter(Boolean).join(" ")||null,
    date_of_birth: /^\d{4}-\d{2}-\d{2}$/.test(clean(t.dateOfBirth,10)) ? clean(t.dateOfBirth,10) : null,
    gender: clean(t.gender,40)||null,
    nationality_id: isUuid(t.nationalityId) ? t.nationalityId : null,
    email: lower(t.email,254)||null, phone: clean(t.phone,40)||null,
    passport_expiry: /^\d{4}-\d{2}-\d{2}$/.test(clean(t.passportExpiry,10)) ? clean(t.passportExpiry,10) : null,
    passport_country_id: isUuid(t.passportCountryId) ? t.passportCountryId : null,
    dietary_prefs: clean(t.dietaryPrefs,1000)||null,
    accessibility_needs: clean(t.accessibilityNeeds,2000)||null,
    is_primary: t.isPrimary === true,
    active: true,
    payload: obj(t.payload),
    updated_at: now()
  };
  let row;
  if (isUuid(id)) {
    const owned=(await select("customer_travelers",{select:"id",id:qeq(id),member_id:qeq(profile.member_id),limit:"1"}))[0];
    if(!owned) throw fail("TRAVELER_NOT_FOUND","The saved traveler could not be found.",404);
    row=(await patch("customer_travelers",{id:qeq(id),member_id:qeq(profile.member_id)},body))[0];
  } else row=await insert("customer_travelers",{...body,created_at:now()});
  if(body.is_primary===true && row?.id) {
    const others=await select("customer_travelers",{select:"id",member_id:qeq(profile.member_id),active:"eq.true",limit:"100"});
    for(const other of others) if(other.id!==row.id) await patch("customer_travelers",{id:qeq(other.id)},{is_primary:false,updated_at:now()});
  }
  return { ok:true, traveler: travelerView(row||body) };
}
export async function removeCustomerTravelerCore(context,input={}) {
  const profile=await resolveProfile(context,{create:false}); if(!profile) throw fail("PROFILE_NOT_FOUND","Customer profile not found.",404);
  const id=clean(input.travelerId||input.id,80); if(!isUuid(id)) throw fail("TRAVELER_NOT_FOUND","The saved traveler reference is invalid.");
  const row=(await select("customer_travelers",{select:"id,is_primary",id:qeq(id),member_id:qeq(profile.member_id),limit:"1"}))[0]; if(!row) throw fail("TRAVELER_NOT_FOUND","The saved traveler could not be found.",404);
  if(row.is_primary===true) throw fail("PRIMARY_TRAVELER_REQUIRED","Choose another primary traveler before removing this traveler.",409);
  await patch("customer_travelers",{id:qeq(id),member_id:qeq(profile.member_id)},{active:false,updated_at:now()});
  return {ok:true,travelerId:id};
}
export async function markCustomerNotificationReadCore(context,input={}) {
  const profile=await resolveProfile(context,{create:false}); if(!profile) throw fail("PROFILE_NOT_FOUND","Customer profile not found.",404);
  const id=clean(input.notificationId||input.id,80); if(!isUuid(id)) throw fail("NOTIFICATION_NOT_FOUND","The notification reference is invalid.");
  const rows=await patch("customer_notifications",{id:qeq(id),member_id:qeq(profile.member_id)},{read:true,updated_at:now()});
  if(!rows.length) throw fail("NOTIFICATION_NOT_FOUND","The notification could not be found.",404);
  return {ok:true,notification:notificationView(rows[0])};
}
export async function removeCustomerFavoriteCore(context,input={}) {
  const profile=await resolveProfile(context,{create:false}); if(!profile) throw fail("PROFILE_NOT_FOUND","Customer profile not found.",404);
  const id=clean(input.favoriteId||input.id,80); if(!isUuid(id)) throw fail("FAVORITE_NOT_FOUND","The saved item reference is invalid.");
  const rows=await patch("customer_favorites",{id:qeq(id),member_id:qeq(profile.member_id)},{active:false,updated_at:now()});
  if(!rows.length) throw fail("FAVORITE_NOT_FOUND","The saved item could not be found.",404);
  return {ok:true,favoriteId:id};
}

async function ownedBooking(context, input={}) {
  const profile=await resolveProfile(context,{create:false}); if(!profile) throw fail("PROFILE_NOT_FOUND","Customer profile not found.",404);
  const id=clean(input.bookingId,80), ref=clean(input.bookingReference,120);
  let row=null;
  if(isUuid(id)) row=(await select("altea_bookings",{select:"*",id:qeq(id),limit:"1"}))[0]||null;
  else if(ref) row=(await select("altea_bookings",{select:"*",booking_reference:qeq(ref),limit:"1"}))[0]||null;
  if(!row) throw fail("BOOKING_NOT_FOUND","The booking could not be found.",404);
  let owned=row.customer_member_id===profile.member_id;
  if(!owned) owned=Boolean((await select("customer_profiles_booking_links",{select:"id",member_id:qeq(profile.member_id),booking_id:qeq(row.id),limit:"1"}))[0]);
  if(!owned) throw fail("BOOKING_NOT_FOUND","The booking could not be found.",404);
  return {profile,row};
}
function findProviderId(value,prefix,depth=0) {
  if(depth>4||value===null||value===undefined) return "";
  if(typeof value==="string") return value.startsWith(prefix)?value:"";
  if(Array.isArray(value)){for(const v of value){const x=findProviderId(v,prefix,depth+1);if(x)return x;}return "";}
  if(typeof value==="object"){for(const [k,v] of Object.entries(value)){if(/token|secret|card|encrypted|hash/i.test(k))continue;const x=findProviderId(v,prefix,depth+1);if(x)return x;}}
  return "";
}
async function providerIds(row,components=[]) {
  const values=[row.supplier_order_id,row.amadeus_order_id,row.supplier_booking_reference,row.payload,...components.map(c=>[c.supplier_reference,c.payload])];
  return {orderId:findProviderId(values,"ord_"),stayBookingId:findProviderId(values,"bok_"),carBookingId:findProviderId(values,"boo_")};
}
async function bookingBundle(context,input={}) {
  const owned=await ownedBooking(context,input);
  const components=await select("altea_booking_components",{select:"*",booking_id:qeq(owned.row.id),order:"created_at.asc",limit:"200"});
  const ids=await providerIds(owned.row,components);
  return {...owned,components,ids};
}


export async function linkCustomerBookingCore(context, input = {}) {
  const profile = await resolveProfile(context, { create: true });
  const reference = upper(input.bookingReference || input.reference, 120);
  const surname = lower(input.lastName || input.surname, 160);
  if (!reference || !/^[A-Z0-9-]{4,120}$/.test(reference)) throw fail("BOOKING_REFERENCE_INVALID", "Enter a valid booking reference.");
  if (!surname || surname.length < 2) throw fail("BOOKING_SURNAME_REQUIRED", "Enter the traveler surname from the booking.");
  let booking = (await select("altea_bookings", { select: "*", booking_reference: qeq(reference), limit: "1" }))[0] || null;
  if (!booking) booking = (await select("altea_bookings", { select: "*", pnr_locator: qeq(reference), limit: "1" }))[0] || null;
  if (!booking) booking = (await select("altea_bookings", { select: "*", supplier_booking_reference: qeq(reference), limit: "1" }))[0] || null;
  if (!booking) throw fail("BOOKING_NOT_FOUND", "We could not find a booking with that reference.", 404);
  const passengers = await select("altea_passengers", { select: "id,last_name,supplier_passenger_id", booking_id: qeq(booking.id), limit: "100" });
  const passenger = passengers.find(row => lower(row.last_name, 160) === surname) || null;
  if (!passenger) throw fail("BOOKING_VERIFICATION_FAILED", "The booking reference and traveler surname do not match.", 403);
  const existing = (await select("customer_profiles_booking_links", { select: "*", member_id: qeq(profile.member_id), booking_id: qeq(booking.id), limit: "1" }))[0] || null;
  if (!existing) {
    await insert("customer_profiles_booking_links", {
      member_id: profile.member_id,
      booking_reference: booking.booking_reference || reference,
      last_name: clean(input.lastName || input.surname, 160),
      status: "Verified",
      linked_at: now(),
      booking_id: booking.id,
      link_source: "MY_PROFILE",
      verified_at: now(),
      payload: { customerProfileId: profile.id, passengerId: passenger.id, source: "MY_PROFILE", isLoyaltyMember: profile.is_loyalty_member === true, clubNumber: profile.club_number ? String(profile.club_number) : "" }
    });
  }
  return { ok: true, linked: true, booking: bookingView(booking, []), alreadyLinked: Boolean(existing) };
}

export async function getCustomerBookingDetailCore(context,input={}) {
  const bundle=await bookingBundle(context,input), result={air:null,stay:null,car:null,errors:[]};
  if(bundle.ids.orderId) {
    try { result.air=(await getDuffelOrderCore({orderId:bundle.ids.orderId})).order; }
    catch(error){ result.errors.push({provider:"AIR",...safeError(error)}); }
  }
  if(bundle.ids.stayBookingId) {
    try { result.stay=(await getDuffelStayBookingCore({bookingId:bundle.ids.stayBookingId})).booking; }
    catch(error){ result.errors.push({provider:"STAY",...safeError(error)}); }
  }
  if(bundle.ids.carBookingId) {
    try { result.car=(await getDuffelCarBookingCore({bookingId:bundle.ids.carBookingId})).booking; }
    catch(error){ result.errors.push({provider:"CAR",...safeError(error)}); }
  }
  let baggage=[]; if(bundle.ids.orderId && result.air?.status!=="cancelled") try{baggage=(await listDuffelPostBookingServicesCore({orderId:bundle.ids.orderId})).services;}catch(_){baggage=[];}
  let airlineChanges=[]; if(bundle.ids.orderId) try{airlineChanges=(await listDuffelAirlineInitiatedChangesCore({orderId:bundle.ids.orderId})).changes;}catch(_){airlineChanges=[];}
  return {ok:true,booking:bookingView(bundle.row,bundle.components),provider:result,providerIds:bundle.ids,capabilities:{flightCancel:arr(result.air?.availableActions).includes("cancel"),flightChange:arr(result.air?.availableActions).includes("change"),flightUpdate:arr(result.air?.availableActions).includes("update"),postBookingBaggage:baggage.length>0,postBookingSeatSelection:false,stayCancel:Boolean(result.stay?.id&&lower(result.stay.status)!=="cancelled"),carCancel:Boolean(result.car?.id&&lower(result.car.status)!=="cancelled"),airlineChangeAccept:airlineChanges.some(c=>arr(c.availableActions).includes("accept"))},baggage,airlineChanges};
}

async function requireAirOrder(context,input={}) { const b=await bookingBundle(context,input); if(!b.ids.orderId) throw fail("AIR_ORDER_NOT_FOUND","No live airline order is linked to this booking.",409); return b; }
export async function quoteCustomerFlightCancellationCore(context,input={}) { const b=await requireAirOrder(context,input); return {ok:true,...await createDuffelOrderCancellationCore({orderId:b.ids.orderId})}; }
export async function confirmCustomerFlightCancellationCore(context,input={}) { await requireAirOrder(context,input); const id=clean(input.cancellationId,220); if(!/^[a-z]{2,20}_[A-Za-z0-9_]+$/i.test(id)) throw fail("CANCELLATION_REFERENCE_INVALID","The cancellation quote reference is invalid."); return {ok:true,...await confirmDuffelOrderCancellationCore({cancellationId:id})}; }
export async function searchCustomerFlightChangesCore(context,input={}) { const b=await requireAirOrder(context,input); return {ok:true,...await searchDuffelOrderChangesCore({...input,orderId:b.ids.orderId})}; }
export async function createCustomerPendingFlightChangeCore(context,input={}) { await requireAirOrder(context,input); return {ok:true,...await createDuffelPendingOrderChangeCore(input)}; }
export async function prepareCustomerFlightChangePaymentCore(context,input={}) { await requireAirOrder(context,input); return {ok:true,...await prepareDuffelOrderChangePaymentCore(input)}; }
export async function confirmCustomerFlightChangeCore(context,input={}) { await requireAirOrder(context,input); return {ok:true,...await confirmDuffelOrderChangeCore(input)}; }
export async function listCustomerPostBookingBaggageCore(context,input={}) { const b=await requireAirOrder(context,input); return {ok:true,...await listDuffelPostBookingServicesCore({orderId:b.ids.orderId})}; }
export async function prepareCustomerPostBookingBaggageCore(context,input={}) { const b=await requireAirOrder(context,input); return {ok:true,...await prepareDuffelPostBookingServicesPaymentCore({...input,orderId:b.ids.orderId})}; }
export async function confirmCustomerPostBookingBaggageCore(context,input={}) { const b=await requireAirOrder(context,input); return {ok:true,...await confirmDuffelPostBookingServicesCore({...input,orderId:b.ids.orderId})}; }
export async function listCustomerAirlineInitiatedChangesCore(context,input={}) { const b=await requireAirOrder(context,input); return {ok:true,...await listDuffelAirlineInitiatedChangesCore({orderId:b.ids.orderId})}; }
export async function acceptCustomerAirlineInitiatedChangeCore(context,input={}) { await requireAirOrder(context,input); return {ok:true,...await acceptDuffelAirlineInitiatedChangeCore(input)}; }
export async function cancelCustomerStayCore(context,input={}) { const b=await bookingBundle(context,input); if(!b.ids.stayBookingId) throw fail("STAY_BOOKING_NOT_FOUND","No live hotel booking is linked to this trip.",409); return {ok:true,...await cancelDuffelStayBookingCore({bookingId:b.ids.stayBookingId})}; }
export async function cancelCustomerCarCore(context,input={}) { const b=await bookingBundle(context,input); if(!b.ids.carBookingId) throw fail("CAR_BOOKING_NOT_FOUND","No live car booking is linked to this trip.",409); return {ok:true,...await cancelDuffelCarBookingCore({bookingId:b.ids.carBookingId})}; }

export async function getCustomerDocumentCore(context,input={}) {
  const profile=await resolveProfile(context,{create:false}); if(!profile) throw fail("PROFILE_NOT_FOUND","Customer profile not found.",404);
  const id=clean(input.documentId||input.id,80); if(!isUuid(id)) throw fail("DOCUMENT_NOT_FOUND","The document reference is invalid.");
  let row=(await select("customer_travel_documents",{select:"id,member_id,traveler_id,document_type,document_title,document_number_last4,issuing_country_id,issue_date,expiry_date,file_url,status,payload",id:qeq(id),member_id:qeq(profile.member_id),limit:"1"}))[0]||null;
  if(row) return {ok:true,document:profileDocumentView(row)};
  const bookingDoc=(await select("altea_booking_documents",{select:"*",id:qeq(id),limit:"1"}))[0]||null;
  if(bookingDoc){await ownedBooking(context,{bookingId:bookingDoc.booking_id});const payload=safePublicPayload(obj(bookingDoc.payload))||{};return {ok:true,document:{id:bookingDoc.id,bookingId:bookingDoc.booking_id,document_code:upper(bookingDoc.document_type||"DOC",40),definition_name:clean(payload.title||bookingDoc.document_type||"Booking document",300),document_number:bookingDoc.document_number||"Preparing",status:upper(bookingDoc.status||"DRAFT",60),provider:bookingDoc.provider||"",providerDocumentId:bookingDoc.provider_document_id||"",fileUrl:safeUrl(payload.fileUrl||payload.file_url),source:"BOOKING",payload}};}
  throw fail("DOCUMENT_NOT_FOUND","The document could not be found.",404);
}

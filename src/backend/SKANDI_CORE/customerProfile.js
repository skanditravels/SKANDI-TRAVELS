// /src/backend/SKANDI_CORE/customerProfile.js
// SKANDI Customer Profile — canonical customer identity/profile core.
// R-003.7
//
// Wix Members authenticates the browser session.
// Supabase public.customer_profiles is the canonical runtime customer profile.
// Related customer records use the same member/wix/supabase identity keys.

import { currentMember } from "wix-members-backend";
import { restRequest } from "./supabaseServer.js";

const T = Object.freeze({
  profiles: "customer_profiles",
  clubProfiles: "club_profiles",
  tiers: "club_tiers",
  points: "skandi_points_ledger",
  travelers: "customer_travelers",
  documents: "customer_travel_documents",
  favorites: "customer_favorites",
  paymentMethods: "customer_payment_methods",
  notifications: "customer_notifications",
  walletItems: "customer_wallet_items",
  airports: "travel_info_airports",
  countries: "countries_list"
});

const MAX_ROWS = 500;

function clean(value, max = 20000) {
  return String(value ?? "").trim().slice(0, max);
}

function lower(value, max = 20000) {
  return clean(value, max).toLowerCase();
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function publicError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  error.publicMessage = message || "Customer profile action failed.";
  return error;
}

function normalizeEmail(value) {
  const email = lower(value, 320);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function memberEmail(member) {
  return normalizeEmail(
    member?.loginEmail ||
    member?.contactDetails?.emails?.[0] ||
    member?.contactDetails?.email ||
    member?.email
  );
}

function memberPhone(member) {
  return clean(
    member?.contactDetails?.phones?.[0] ||
    member?.contactDetails?.phone ||
    member?.phone,
    80
  );
}

function memberFirstName(member) {
  return clean(member?.contact?.firstName || member?.contactDetails?.firstName, 100);
}

function memberLastName(member) {
  return clean(member?.contact?.lastName || member?.contactDetails?.lastName, 100);
}

function memberDisplayName(member) {
  return clean(
    [memberFirstName(member), memberLastName(member)].filter(Boolean).join(" ") ||
    member?.profile?.nickname ||
    member?.nickname ||
    memberEmail(member) ||
    "SKANDI Traveler",
    200
  );
}

async function selectRows(table, query) {
  return array(await restRequest({ table, method: "GET", query }));
}

async function insertRow(table, body) {
  return array(await restRequest({ table, method: "POST", body }))[0] || null;
}

async function patchRows(table, query, body) {
  return array(await restRequest({ table, method: "PATCH", query, body }));
}

async function deleteRows(table, query) {
  return array(await restRequest({ table, method: "DELETE", query }));
}

function uniqueRows(rows = []) {
  const seen = new Set();
  return rows.filter(row => {
    const key = clean(row?.id, 120) || clean(row?.member_id, 160) || JSON.stringify(row);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getCurrentWixMemberOptional() {
  try {
    const member = await currentMember.getMember();
    return member?._id ? member : null;
  } catch (_) {
    return null;
  }
}

export async function getCurrentWixMemberRequired() {
  const member = await getCurrentWixMemberOptional();
  if (!member) throw publicError("NOT_LOGGED_IN", "Sign in to access My Profile.");
  return member;
}

export async function findCustomerProfileByMember(member, { linkVerifiedEmail = true, createIfMissing = true } = {}) {
  if (!member?._id) return null;
  const wixMemberId = clean(member._id, 160);
  const email = memberEmail(member);

  let rows = await selectRows(T.profiles, { select: "*", wix_member_id: `eq.${wixMemberId}`, limit: 2 });
  if (rows.length === 1) return rows[0];
  if (rows.length > 1) throw publicError("CUSTOMER_PROFILE_AMBIGUOUS", "Your customer profile needs support review before secure access can continue.");

  rows = await selectRows(T.profiles, { select: "*", member_id: `eq.${wixMemberId}`, limit: 2 });
  if (rows.length === 1) {
    const row = rows[0];
    if (!row.wix_member_id && linkVerifiedEmail) {
      const patched = await patchRows(T.profiles, { id: `eq.${row.id}` }, {
        wix_member_id: wixMemberId,
        auth_email: email || row.auth_email || null,
        auth_provider: row.auth_provider || "wix",
        last_login_at: nowIso(),
        updated_at: nowIso()
      });
      return patched[0] || { ...row, wix_member_id: wixMemberId };
    }
    return row;
  }

  if (email) {
    rows = await selectRows(T.profiles, { select: "*", email: `eq.${email}`, limit: 3 });
    if (rows.length > 1) throw publicError("CUSTOMER_PROFILE_AMBIGUOUS", "Multiple customer profiles use this email. SKANDI Support must review the account link.");
    if (rows.length === 1) {
      const row = rows[0];
      const alreadyLinked = clean(row.wix_member_id, 160);
      if (alreadyLinked && alreadyLinked !== wixMemberId) {
        throw publicError("CUSTOMER_PROFILE_LINK_CONFLICT", "This customer profile is already linked to another account.");
      }
      if (!linkVerifiedEmail) return row;
      const patch = {
        wix_member_id: wixMemberId,
        member_id: row.member_id || wixMemberId,
        auth_email: email,
        auth_provider: row.auth_provider || "wix",
        last_login_at: nowIso(),
        updated_at: nowIso()
      };
      const patched = await patchRows(T.profiles, { id: `eq.${row.id}` }, patch);
      return patched[0] || { ...row, ...patch };
    }
  }

  if (!createIfMissing) return null;

  const firstName = memberFirstName(member);
  const lastName = memberLastName(member);
  return insertRow(T.profiles, {
    member_id: wixMemberId,
    wix_member_id: wixMemberId,
    first_name: firstName || null,
    last_name: lastName || null,
    display_name: memberDisplayName(member),
    email: email || null,
    phone: memberPhone(member) || null,
    preferred_currency: "USD",
    customer_type: "Individual",
    marketing_consent: false,
    privacy_accepted: false,
    is_loyalty_member: false,
    status: "Active",
    auth_provider: "wix",
    auth_email: email || null,
    last_login_at: nowIso(),
    payload: {},
    created_at: nowIso(),
    updated_at: nowIso()
  });
}

async function relatedRows(table, context, extra = {}) {
  const keys = customerOwnershipKeys(context);
  const rows = [];
  if (keys.memberId) rows.push(...await selectRows(table, { select: "*", member_id: `eq.${keys.memberId}`, limit: MAX_ROWS, ...extra }));
  if (keys.wixMemberId) rows.push(...await selectRows(table, { select: "*", wix_member_id: `eq.${keys.wixMemberId}`, limit: MAX_ROWS, ...extra }));
  if (keys.supabaseUserId) rows.push(...await selectRows(table, { select: "*", supabase_user_id: `eq.${keys.supabaseUserId}`, limit: MAX_ROWS, ...extra }));
  return uniqueRows(rows);
}

async function countryById(id) {
  const value = clean(id, 80);
  if (!value) return null;
  return (await selectRows(T.countries, { select: "id,country_code,country_name", id: `eq.${value}`, limit: 1 }))[0] || null;
}

async function resolveCountryId(value) {
  const input = clean(value, 120);
  if (!input) return null;
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(input)) return input;

  let rows = await selectRows(T.countries, { select: "id,country_code,country_name", country_code: `eq.${input.toUpperCase()}`, limit: 2 });
  if (rows.length === 1) return rows[0].id;
  rows = await selectRows(T.countries, { select: "id,country_code,country_name", country_name: `eq.${input}`, limit: 2 });
  return rows.length === 1 ? rows[0].id : null;
}

async function clubProfileRow(context) {
  const rows = await relatedRows(T.clubProfiles, context, { order: "updated_at.desc" });
  return rows[0] || null;
}

async function tierRow(profileRow) {
  const id = clean(profileRow?.club_tier_id, 80);
  if (!id) return null;
  return (await selectRows(T.tiers, { select: "*", id: `eq.${id}`, limit: 1 }))[0] || null;
}

async function pointsSnapshot(context) {
  const rows = await relatedRows(T.points, context, { order: "transaction_date.desc" });
  let confirmed = 0;
  let pending = 0;
  for (const row of rows) {
    const amount = Number(row.amount || 0) || 0;
    const status = lower(row.status, 30);
    if (status === "confirmed") confirmed += amount;
    else if (status === "pending") pending += amount;
  }
  return {
    confirmed,
    pending,
    recent: rows.slice(0, 20).map(row => ({
      transactionId: clean(row.transaction_id || row.id, 120),
      title: clean(row.description || row.type, 200) || "SKANDI Club transaction",
      type: clean(row.type, 80),
      points: Number(row.amount || 0) || 0,
      status: clean(row.status, 40),
      date: row.transaction_date || row.created_at || "",
      bookingReference: clean(row.booking_reference, 100)
    }))
  };
}

export function customerOwnershipKeys(context) {
  const profile = context?.profile || {};
  return {
    memberId: clean(profile.memberId || context?.profileRow?.member_id || context?.member?._id, 160),
    wixMemberId: clean(profile.wixMemberId || context?.profileRow?.wix_member_id || context?.member?._id, 160),
    supabaseUserId: clean(profile.supabaseUserId || context?.profileRow?.supabase_user_id, 80)
  };
}

export async function customerProfileDto(profileRow, member = null, clubRow = null) {
  if (!profileRow && !member) return null;
  const payload = object(profileRow?.payload);
  const firstName = clean(profileRow?.first_name ?? memberFirstName(member), 100);
  const lastName = clean(profileRow?.last_name ?? memberLastName(member), 100);
  const displayName = clean(profileRow?.display_name || [firstName, lastName].filter(Boolean).join(" ") || memberDisplayName(member), 200);
  const country = await countryById(profileRow?.country_of_residence_id).catch(() => null);
  const passportLast4 = clean(clubRow?.passport_last4 || payload.passportLast4, 8);

  return {
    id: clean(profileRow?.id, 80) || null,
    _id: clean(profileRow?.id, 80) || null,
    memberId: clean(profileRow?.member_id ?? member?._id, 160) || null,
    wixMemberId: clean(profileRow?.wix_member_id ?? member?._id, 160) || null,
    supabaseUserId: clean(profileRow?.supabase_user_id, 80) || null,
    firstName,
    first_name: firstName,
    lastName,
    last_name: lastName,
    fullName: displayName,
    displayName,
    display_name: displayName,
    email: normalizeEmail(profileRow?.email || profileRow?.auth_email || memberEmail(member)),
    phone: clean(profileRow?.phone || memberPhone(member), 80),
    countryOfResidence: clean(country?.country_name || payload.countryOfResidence, 120),
    preferredLanguage: clean(payload.preferredLanguage, 30),
    preferredCurrency: clean(profileRow?.preferred_currency || payload.preferredCurrency, 12) || "USD",
    preferredDepartureAirport: clean(payload.preferredDepartureAirport || payload.defaultAirport, 120),
    defaultAirport: clean(payload.defaultAirport || payload.preferredDepartureAirport, 120),
    favoritesLocations: array(payload.favoritesLocations),
    customerType: clean(profileRow?.customer_type, 80),
    accessibilityNeedsGeneral: clean(profileRow?.accessibility_needs_general, 2000),
    marketingConsent: profileRow?.marketing_consent === true,
    communication: object(payload.communication),
    clubNumber: profileRow?.club_number ?? null,
    isLoyaltyMember: profileRow?.is_loyalty_member === true,
    status: clean(profileRow?.status, 60) || "Active",
    dob: clubRow?.date_of_birth || payload.dateOfBirth || "",
    dateOfBirth: clubRow?.date_of_birth || payload.dateOfBirth || "",
    gender: clean(clubRow?.gender || payload.gender, 30),
    nationality: clean(payload.nationality, 120),
    issueCountry: clean(payload.countryOfIssue, 120),
    diet: clean(clubRow?.dietary_prefs || payload.dietaryPrefs || payload.diet, 120),
    address: clean(clubRow?.home_address?.formatted || payload.address, 500),
    passportLast4,
    passportNum: passportLast4 ? `••••${passportLast4}` : "",
    expiry: clubRow?.passport_expiry || payload.passportExpiry || "",
    passportExpiry: clubRow?.passport_expiry || payload.passportExpiry || "",
    visas: array(payload.visas)
  };
}

function clubDto(profileRow, clubRow, tier, points) {
  if (!profileRow?.is_loyalty_member && !clubRow) return null;
  return {
    id: clean(clubRow?.id, 80) || null,
    clubId: clean(clubRow?.club_id || profileRow?.club_number, 120) || null,
    clubNumber: profileRow?.club_number ?? null,
    tierName: clean(tier?.tier_name, 120) || "SKANDI Club",
    tierKey: clean(tier?.tier_key, 80),
    points,
    status: clean(clubRow?.status, 60) || (profileRow?.is_loyalty_member ? "Active" : "Inactive")
  };
}

export async function getCustomerContext({ required = true, createIfMissing = true } = {}) {
  const member = required ? await getCurrentWixMemberRequired() : await getCurrentWixMemberOptional();
  if (!member) return { loggedIn: false, member: null, profileRow: null, profile: null, clubRow: null, clubProfile: null };

  const profileRow = await findCustomerProfileByMember(member, { createIfMissing });
  if (!profileRow && required) throw publicError("CUSTOMER_PROFILE_MISSING", "Your SKANDI customer profile could not be loaded.");

  const baseContext = { loggedIn: true, member, profileRow, profile: null, clubRow: null, clubProfile: null };
  const clubRow = profileRow ? await clubProfileRow({ ...baseContext, profile: { memberId: profileRow.member_id, wixMemberId: profileRow.wix_member_id, supabaseUserId: profileRow.supabase_user_id } }) : null;
  const profile = await customerProfileDto(profileRow, member, clubRow);
  const tier = await tierRow(profileRow).catch(() => null);
  const points = await pointsSnapshot({ ...baseContext, profile }).catch(() => ({ confirmed: 0, pending: 0, recent: [] }));

  return {
    loggedIn: true,
    member,
    profileRow,
    profile,
    clubRow,
    clubProfile: clubDto(profileRow, clubRow, tier, points),
    points
  };
}

async function requireOwnedRow(table, id, context) {
  const rowId = clean(id, 120);
  if (!rowId) throw publicError("CUSTOMER_RECORD_REQUIRED", "Choose a record first.");
  const row = (await selectRows(table, { select: "*", id: `eq.${rowId}`, limit: 1 }))[0];
  if (!row) throw publicError("CUSTOMER_RECORD_NOT_FOUND", "That customer record was not found.");
  const keys = customerOwnershipKeys(context);
  const owns = Boolean(
    (keys.memberId && clean(row.member_id, 160) === keys.memberId) ||
    (keys.wixMemberId && clean(row.wix_member_id, 160) === keys.wixMemberId) ||
    (keys.supabaseUserId && clean(row.supabase_user_id, 80) === keys.supabaseUserId)
  );
  if (!owns) throw publicError("CUSTOMER_RECORD_FORBIDDEN", "That record does not belong to this profile.");
  return row;
}

function travelerDto(row) {
  const payload = object(row.payload);
  return {
    id: row.id,
    _id: row.id,
    firstName: clean(row.first_name, 100),
    middleName: clean(row.middle_name, 100),
    lastName: clean(row.last_name, 100),
    displayName: clean(row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" "), 200),
    dateOfBirth: row.date_of_birth || "",
    gender: clean(row.gender, 30),
    travelerType: clean(row.traveler_type, 60) || "Companion",
    email: normalizeEmail(row.email),
    phone: clean(row.phone, 80),
    dietaryPrefs: clean(row.dietary_prefs, 200),
    accessibilityNeeds: clean(row.accessibility_needs, 1000),
    passportLast4: clean(row.passport_last4, 8),
    passportExpiry: row.passport_expiry || "",
    nationality: clean(payload.nationality, 120),
    active: row.active !== false
  };
}

function documentDto(row) {
  const payload = object(row.payload);
  const last4 = clean(row.document_number_last4, 8);
  return {
    id: row.id,
    _id: row.id,
    travelerId: row.traveler_id || null,
    documentType: clean(row.document_type, 80) || "Passport",
    documentTitle: clean(row.document_title, 160),
    documentNumberMasked: last4 ? `••••${last4}` : "",
    documentNumberLast4: last4,
    issuingCountry: clean(payload.issuingCountry, 120),
    issueDate: row.issue_date || "",
    expiryDate: row.expiry_date || "",
    fileUrl: clean(row.file_url, 1000),
    documentFileUrl: clean(row.file_url, 1000),
    status: clean(row.status, 60) || "Active"
  };
}

function favoriteDto(row) {
  return {
    id: row.id,
    _id: row.id,
    itemType: clean(row.item_type, 80),
    itemId: clean(row.item_id, 160),
    slug: clean(row.item_slug, 200),
    title: clean(row.item_title, 200),
    image: clean(row.item_image_url, 1000),
    url: clean(row.item_url, 1000),
    active: row.active !== false
  };
}

function paymentMethodDto(row) {
  return {
    id: row.id,
    _id: row.id,
    provider: clean(row.payment_provider, 80),
    brand: clean(row.brand, 80),
    last4: clean(row.last4, 8),
    expiryMonth: row.expiry_month ?? null,
    expiryYear: row.expiry_year ?? null,
    active: row.active !== false
  };
}

export async function getCustomerPortalStateCore() {
  const context = await getCustomerContext({ required: true, createIfMissing: true });
  const [travelers, documents, favorites, walletMethods, notifications, walletItems] = await Promise.all([
    relatedRows(T.travelers, context, { order: "created_at.asc" }),
    relatedRows(T.documents, context, { order: "created_at.asc" }),
    relatedRows(T.favorites, context, { order: "created_at.desc" }),
    relatedRows(T.paymentMethods, context, { order: "created_at.desc" }),
    relatedRows(T.notifications, context, { order: "created_at.desc" }),
    relatedRows(T.walletItems, context, { order: "created_at.desc" })
  ]);

  const points = context.points || { confirmed: 0, pending: 0, recent: [] };
  const tierName = context.clubProfile?.tierName || "Guest";
  return {
    ok: true,
    profile: context.profile,
    clubProfile: context.clubProfile,
    travelers: travelers.filter(row => row.active !== false).map(travelerDto),
    companions: travelers.filter(row => row.active !== false).map(travelerDto),
    documents: documents.map(documentDto),
    favorites: favorites.filter(row => row.active !== false).map(favoriteDto),
    walletMethods: walletMethods.filter(row => row.active !== false).map(paymentMethodDto),
    walletItems: walletItems.filter(row => row.active !== false).map(row => ({
      id: row.id,
      itemType: clean(row.item_type, 80),
      title: clean(row.title, 200),
      code: clean(row.code, 160),
      fileUrl: clean(row.file_url, 1000),
      expiresAt: row.expires_at || "",
      active: row.active !== false
    })),
    notifications: notifications.map(row => ({
      id: row.notification_id || row.id,
      type: clean(row.type, 80),
      title: clean(row.title, 200),
      message: clean(row.message, 1000),
      actionPath: clean(row.action_path, 500),
      read: row.read === true,
      createdAt: row.created_at || ""
    })),
    loyalty: {
      provider: "SKANDI Club",
      status: context.clubProfile ? "Connected" : "Not enrolled",
      points,
      pointsBalance: Number(points.confirmed || 0),
      tierName,
      transactions: points.recent
    },
    rewards: {
      points: Number(points.confirmed || 0),
      tier: tierName,
      nextTierLabel: "",
      progressPercent: 0
    },
    rewardTransactions: points.recent,
    trips: []
  };
}

export async function saveCustomerProfileCore(payload = {}) {
  const context = await getCustomerContext({ required: true, createIfMissing: true });
  const profilePayload = { ...object(context.profileRow?.payload) };
  const patch = { updated_at: nowIso() };

  if (payload.firstName !== undefined) patch.first_name = clean(payload.firstName, 100) || null;
  if (payload.lastName !== undefined) patch.last_name = clean(payload.lastName, 100) || null;
  if (payload.phone !== undefined || payload.phoneRaw !== undefined) {
    const prefix = clean(payload.phoneCode, 12);
    const raw = clean(payload.phoneRaw || payload.phone, 80);
    patch.phone = clean(prefix && raw && !raw.startsWith("+") ? `${prefix} ${raw}` : raw, 80) || null;
  }
  if (payload.preferredCurrency !== undefined) patch.preferred_currency = clean(payload.preferredCurrency, 12) || null;
  if (payload.customerType !== undefined) patch.customer_type = clean(payload.customerType, 80) || null;
  if (payload.accessibilityNeedsGeneral !== undefined) patch.accessibility_needs_general = clean(payload.accessibilityNeedsGeneral, 2000) || null;
  if (payload.marketingConsent !== undefined) patch.marketing_consent = payload.marketingConsent === true;

  const first = patch.first_name ?? context.profileRow?.first_name ?? "";
  const last = patch.last_name ?? context.profileRow?.last_name ?? "";
  if (payload.firstName !== undefined || payload.lastName !== undefined) patch.display_name = clean([first, last].filter(Boolean).join(" "), 200) || context.profileRow?.display_name || null;

  if (payload.countryOfResidence !== undefined) {
    const countryId = await resolveCountryId(payload.countryOfResidence).catch(() => null);
    if (countryId) patch.country_of_residence_id = countryId;
    profilePayload.countryOfResidence = clean(payload.countryOfResidence, 120);
  }
  for (const [incoming, stored] of [
    ["preferredLanguage", "preferredLanguage"],
    ["preferredDepartureAirport", "preferredDepartureAirport"],
    ["defaultAirport", "defaultAirport"],
    ["address", "address"],
    ["nationality", "nationality"],
    ["countryOfIssue", "countryOfIssue"],
    ["dateOfBirth", "dateOfBirth"],
    ["dob", "dateOfBirth"],
    ["diet", "diet"],
    ["dietaryPrefs", "dietaryPrefs"],
    ["gender", "gender"],
    ["passportExpiry", "passportExpiry"]
  ]) {
    if (payload[incoming] !== undefined) profilePayload[stored] = payload[incoming];
  }
  if (payload.passportLast4 !== undefined) profilePayload.passportLast4 = clean(payload.passportLast4, 8);
  patch.payload = profilePayload;

  const rows = await patchRows(T.profiles, { id: `eq.${context.profileRow.id}` }, patch);
  const profileRow = rows[0] || { ...context.profileRow, ...patch };

  const clubPatch = {};
  if (payload.dateOfBirth !== undefined || payload.dob !== undefined) clubPatch.date_of_birth = clean(payload.dateOfBirth || payload.dob, 20) || null;
  if (payload.gender !== undefined) clubPatch.gender = clean(payload.gender, 20).slice(0, 1).toUpperCase() || null;
  if (payload.diet !== undefined || payload.dietaryPrefs !== undefined) clubPatch.dietary_prefs = clean(payload.dietaryPrefs || payload.diet, 120) || null;
  if (payload.address !== undefined) clubPatch.home_address = payload.address ? { formatted: clean(payload.address, 500) } : null;
  if (payload.passportLast4 !== undefined) clubPatch.passport_last4 = clean(payload.passportLast4, 8) || null;
  if (payload.passportExpiry !== undefined) clubPatch.passport_expiry = clean(payload.passportExpiry, 20) || null;
  if (payload.nationality !== undefined) {
    const nationalityId = await resolveCountryId(payload.nationality).catch(() => null);
    if (nationalityId) clubPatch.nationality_id = nationalityId;
  }
  if (payload.countryOfIssue !== undefined) {
    const issueId = await resolveCountryId(payload.countryOfIssue).catch(() => null);
    if (issueId) clubPatch.passport_country_id = issueId;
  }

  let clubRow = context.clubRow;
  if (Object.keys(clubPatch).length) {
    clubPatch.updated_at = nowIso();
    if (clubRow?.id) {
      clubRow = (await patchRows(T.clubProfiles, { id: `eq.${clubRow.id}` }, clubPatch))[0] || { ...clubRow, ...clubPatch };
    } else {
      const keys = customerOwnershipKeys(context);
      clubRow = await insertRow(T.clubProfiles, {
        member_id: keys.memberId,
        wix_member_id: keys.wixMemberId || null,
        supabase_user_id: keys.supabaseUserId || null,
        status: "Active",
        payload: {},
        ...clubPatch,
        created_at: nowIso()
      });
    }
  }

  return { ok: true, item: await customerProfileDto(profileRow, context.member, clubRow) };
}

export async function saveTravelCompanionCore(payload = {}) {
  const context = await getCustomerContext({ required: true });
  const keys = customerOwnershipKeys(context);
  const id = clean(payload._id || payload.id, 120);
  const body = {
    traveler_type: clean(payload.travelerType, 60) || "Companion",
    first_name: clean(payload.firstName, 100) || null,
    middle_name: clean(payload.middleName, 100) || null,
    last_name: clean(payload.lastName, 100) || null,
    display_name: clean(payload.displayName || [payload.firstName, payload.lastName].filter(Boolean).join(" "), 200) || null,
    date_of_birth: clean(payload.dateOfBirth, 20) || null,
    gender: clean(payload.gender, 20) || null,
    email: normalizeEmail(payload.email) || null,
    phone: clean(payload.phone, 80) || null,
    dietary_prefs: clean(payload.dietaryPrefs, 200) || null,
    accessibility_needs: clean(payload.accessibilityNeeds, 1000) || null,
    active: payload.active !== false,
    updated_at: nowIso(),
    payload: { nationality: clean(payload.nationality, 120) }
  };

  let row;
  if (id) {
    await requireOwnedRow(T.travelers, id, context);
    row = (await patchRows(T.travelers, { id: `eq.${id}` }, body))[0];
  } else {
    row = await insertRow(T.travelers, {
      member_id: keys.memberId,
      wix_member_id: keys.wixMemberId || null,
      supabase_user_id: keys.supabaseUserId || null,
      is_primary: false,
      created_at: nowIso(),
      ...body
    });
  }
  return { ok: true, item: travelerDto(row || { id, ...body }) };
}

export async function deleteTravelCompanionCore(id) {
  const context = await getCustomerContext({ required: true });
  const row = await requireOwnedRow(T.travelers, id, context);
  await patchRows(T.travelers, { id: `eq.${row.id}` }, { active: false, updated_at: nowIso() });
  return { ok: true };
}

export async function saveTravelDocumentCore(payload = {}) {
  const context = await getCustomerContext({ required: true });
  const keys = customerOwnershipKeys(context);
  const id = clean(payload._id || payload.id, 120);
  const suppliedNumber = clean(payload.documentNumber, 200);
  const body = {
    traveler_id: clean(payload.travelerId || payload.companionId, 120) || null,
    document_type: clean(payload.documentType, 80) || "Passport",
    document_title: clean(payload.documentTitle || payload.holderName, 160) || null,
    document_number_last4: suppliedNumber ? suppliedNumber.slice(-4) : clean(payload.documentNumberLast4, 8) || null,
    issue_date: clean(payload.issueDate, 20) || null,
    expiry_date: clean(payload.expiryDate, 20) || null,
    file_url: clean(payload.fileUrl || payload.documentFileUrl, 1000) || null,
    status: clean(payload.status, 60) || "Active",
    updated_at: nowIso(),
    payload: { issuingCountry: clean(payload.issuingCountry, 120) }
  };
  if (payload.issuingCountry) {
    const countryId = await resolveCountryId(payload.issuingCountry).catch(() => null);
    if (countryId) body.issuing_country_id = countryId;
  }

  let row;
  if (id) {
    await requireOwnedRow(T.documents, id, context);
    row = (await patchRows(T.documents, { id: `eq.${id}` }, body))[0];
  } else {
    row = await insertRow(T.documents, {
      member_id: keys.memberId,
      wix_member_id: keys.wixMemberId || null,
      supabase_user_id: keys.supabaseUserId || null,
      created_at: nowIso(),
      ...body
    });
  }
  return { ok: true, item: documentDto(row || { id, ...body }) };
}

export async function deleteTravelDocumentCore(id) {
  const context = await getCustomerContext({ required: true });
  const row = await requireOwnedRow(T.documents, id, context);
  await deleteRows(T.documents, { id: `eq.${row.id}` });
  return { ok: true };
}

export async function saveCustomerPreferenceCore(payload = {}) {
  const context = await getCustomerContext({ required: true });
  const current = object(context.profileRow.payload);
  const next = { ...current };
  if (payload.defaultAirport !== undefined) next.defaultAirport = clean(payload.defaultAirport, 120);
  if (payload.favoritesLocations !== undefined) next.favoritesLocations = array(payload.favoritesLocations).map(value => clean(value, 160)).filter(Boolean).slice(0, 100);
  if (payload.communication !== undefined) next.communication = object(payload.communication);
  if (payload.visas !== undefined) {
    next.visas = array(payload.visas).map(visa => ({
      country: clean(visa?.country, 120),
      type: clean(visa?.type, 80),
      numberLast4: clean(visa?.numberLast4 || visa?.number, 200).slice(-4),
      expiry: clean(visa?.expiry, 20)
    })).slice(0, 50);
  }
  const row = (await patchRows(T.profiles, { id: `eq.${context.profileRow.id}` }, { payload: next, updated_at: nowIso() }))[0] || { ...context.profileRow, payload: next };
  return { ok: true, item: await customerProfileDto(row, context.member, context.clubRow) };
}

export async function enrollCustomerClubCore(payload = {}) {
  const context = await getCustomerContext({ required: true });
  await saveCustomerProfileCore(payload);
  const keys = customerOwnershipKeys(context);
  let club = context.clubRow || (await relatedRows(T.clubProfiles, context))[0] || null;
  const clubPatch = {
    member_id: keys.memberId,
    wix_member_id: keys.wixMemberId || null,
    supabase_user_id: keys.supabaseUserId || null,
    date_of_birth: clean(payload.dateOfBirth, 20) || club?.date_of_birth || null,
    gender: clean(payload.gender, 20).slice(0, 1).toUpperCase() || club?.gender || null,
    dietary_prefs: clean(payload.dietaryPrefs, 120) || club?.dietary_prefs || null,
    passport_last4: clean(payload.passportLast4, 8) || club?.passport_last4 || null,
    passport_expiry: clean(payload.passportExpiry, 20) || club?.passport_expiry || null,
    status: "Active",
    updated_at: nowIso()
  };
  if (payload.nationality) clubPatch.nationality_id = await resolveCountryId(payload.nationality).catch(() => null) || club?.nationality_id || null;
  if (payload.countryOfIssue) clubPatch.passport_country_id = await resolveCountryId(payload.countryOfIssue).catch(() => null) || club?.passport_country_id || null;

  if (club?.id) club = (await patchRows(T.clubProfiles, { id: `eq.${club.id}` }, clubPatch))[0] || { ...club, ...clubPatch };
  else club = await insertRow(T.clubProfiles, { club_id: `SKC-${Date.now()}`, payload: {}, created_at: nowIso(), ...clubPatch });

  const profileRows = await patchRows(T.profiles, { id: `eq.${context.profileRow.id}` }, { is_loyalty_member: true, updated_at: nowIso() });
  return { ok: true, profile: await customerProfileDto(profileRows[0] || context.profileRow, context.member, club) };
}


export async function saveCustomerCommunicationCore(payload = {}) {
  const communication = {
    emailActive: payload.emailActive === true,
    smsActive: payload.smsActive === true,
    consentGiven: payload.consentGiven === true,
    updatedAt: nowIso()
  };
  const profileResult = await saveCustomerProfileCore({ marketingConsent: communication.consentGiven });
  const preferenceResult = await saveCustomerPreferenceCore({ communication });
  return { ok: true, item: preferenceResult.item || profileResult.item, communication };
}

export async function getCustomerAirportDirectoryCore() {
  await getCustomerContext({ required: true, createIfMissing: true });
  const rows = await selectRows(T.airports, {
    select: "ID,title,iata,icao,country,locationCity,active,status,customer_visible,published,sort_order",
    order: "sort_order.asc",
    limit: 500
  });
  return {
    ok: true,
    airports: rows
      .filter(row => row.active !== false && row.customer_visible !== false && row.published !== false)
      .map(row => ({
        id: row.ID,
        iata: clean(row.iata, 8).toUpperCase(),
        icao: clean(row.icao, 8).toUpperCase(),
        name: clean(row.title, 200),
        city: clean(row.locationCity, 120),
        country: clean(row.country, 120)
      }))
      .filter(row => row.iata && row.name)
  };
}

export async function redeemCustomerRewardCore() {
  throw publicError(
    "LOYALTY_REDEMPTION_NOT_CONFIGURED",
    "SKANDI Club reward redemption is not enabled in the canonical rewards ledger yet."
  );
}

// /src/backend/SKANDI_CORE/customerSession.js
// SKANDI Backend Base 1.0 — B-011.27 customer session runtime convergence.
// Wix owns customer identity, native account fields, subscriptions and rewards.

import { currentMember } from "wix-members-backend";
import { members } from "@wix/members";
import { emailSubscriptions } from "@wix/email-subscriptions";
import { auth } from "@wix/essentials";
import { accounts, programs, rewards, tiers } from "wix-loyalty.v2";
import { elevate } from "wix-auth";
import { email, text } from "backend/SKANDI_CORE/platformValidation";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const queryEmailSubscriptions = auth.elevate(emailSubscriptions.queryEmailSubscriptions);
const upsertEmailSubscription = auth.elevate(emailSubscriptions.upsertEmailSubscription);
const getMember = auth.elevate(members.getMember);
const updateMember = auth.elevate(members.updateMember);

// Existing private field keys in SKANDI TRAVELS → Site Members → Profile Fields.
const MEMBER_FIELDS = Object.freeze({
  displayName: "custom.display-name-dasjabzrwyrxiyzzhoomgz",
  email: "custom.email-rmsoqabjtblhxdvbiycddqxyzbdre",
  countryOfResidence: "custom.country-of-residence-kezceuhlmwruxk",
  preferredLanguage: "custom.preferred-language-spesyasikspzvwri",
  preferredCurrency: "custom.preferred-currency-lxphvjopsalkpmlg",
  preferredDepartureAirport: "custom.preferred-departure-airport-cakncye",
  marketingConsent: "custom.marketing-consent-xvqgbufxyjlpjyvoo"
});

function memberId(member) { return text(member?._id || member?.id, 160); }
function memberContact(member) { return member?.contact || member?.contactDetails || {}; }

function nativeFields(member) {
  const contact = memberContact(member);
  const values = {};
  for (const [name, key] of Object.entries(MEMBER_FIELDS)) {
    const field = contact.customFields?.[key];
    const value = field?.value ?? field?.stringValue ?? field;
    const normalized = typeof value === "object" ? value?.stringValue : value;
    if (typeof normalized === "string") values[name] = normalized.trim();
  }
  for (const name of ["firstName", "lastName"]) {
    if (typeof contact[name] === "string") values[name] = contact[name].trim();
  }
  if (Array.isArray(contact.phones)) values.phone = text(contact.phones[0], 40);
  return values;
}

async function loadMemberAccount(id) {
  const result = await getMember(id, { fieldsets: ["FULL"] });
  const member = result?.member || result;
  if (memberId(member) !== id) {
    throw new SkandiError("WIX_MEMBER_ACCOUNT_UNAVAILABLE", "Your Wix account could not be verified.");
  }
  return member;
}

export async function getCurrentCustomerMemberCore({ account = false } = {}) {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] });
  const id = memberId(member);
  if (!id) throw new SkandiError("LOGIN_REQUIRED", "Sign in to view your SKANDI account.");
  return account ? loadMemberAccount(id) : member;
}

export function getCustomerMemberFieldsCore(member) {
  return { ...nativeFields(member), loginEmail: email(member?.loginEmail) };
}

export async function updateCustomerMemberFieldsCore(member, changes) {
  const id = memberId(member);
  if (!id) throw new SkandiError("LOGIN_REQUIRED", "Sign in to manage your account.");
  const current = nativeFields(member);
  const expected = Object.fromEntries(Object.entries(changes).filter(([key, value]) =>
    (Object.hasOwn(MEMBER_FIELDS, key) || ["firstName", "lastName", "phone"].includes(key)) && current[key] !== value
  ));
  const contact = {};
  for (const name of ["firstName", "lastName"]) {
    if (Object.hasOwn(expected, name)) contact[name] = expected[name];
  }
  const customFields = {};
  for (const [name, key] of Object.entries(MEMBER_FIELDS)) {
    if (Object.hasOwn(expected, name)) customFields[key] = { value: expected[name] };
  }
  if (Object.keys(customFields).length) contact.customFields = customFields;

  let clearPhones = false;
  if (Object.hasOwn(expected, "phone")) {
    const phones = memberContact(member).phones || [];
    contact.phones = [...new Set([expected.phone, ...phones.slice(1)].filter(Boolean))];
    clearPhones = contact.phones.length === 0;
    if (clearPhones) delete contact.phones;
    expected.phone = contact.phones?.[0] || "";
  }
  if (!Object.keys(expected).length) return member;

  try {
    if (Object.keys(contact).length) await updateMember(id, { contact });
    if (clearPhones) await auth.elevate(members.deleteMemberPhones)(id);
    const saved = await loadMemberAccount(id);
    const savedFields = nativeFields(saved);
    if (Object.entries(expected).some(([key, value]) => (savedFields[key] ?? "") !== value)) {
      throw new Error("Wix did not return the requested values.");
    }
    return saved;
  } catch (_) {
    throw new SkandiError("WIX_MEMBER_SAVE_NOT_CONFIRMED", "Your Wix account update could not be confirmed. Refresh to check what was saved.");
  }
}

const ACCOUNT_MENU = Object.freeze([
  Object.freeze({ label: "My Trips", path: "/my-profile?tab=trips" }),
  Object.freeze({ label: "My Orders", path: "/my-profile?tab=orders" }),
  Object.freeze({ label: "Travel Documents", path: "/my-profile?tab=documents" }),
  Object.freeze({ label: "Saved Travelers", path: "/my-profile?tab=travelers" }),
  Object.freeze({ label: "Points & Rewards", path: "/my-profile?tab=club" }),
  Object.freeze({ label: "Account Settings", path: "/my-profile?tab=settings" }),
  Object.freeze({ label: "Logout", action: "logout" })
]);

function displayName(member = {}) {
  return text(
    nativeFields(member).displayName ||
    member?.profile?.nickname ||
    memberContact(member).firstName ||
    String(member?.loginEmail || "").split("@")[0] ||
    "Member",
    180
  );
}

let clubSettings;

async function readLoyalty(get) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(get),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Wix Loyalty timed out.")), 5500); })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function loadClubSettings() {
  if (clubSettings && clubSettings.expires > Date.now()) return clubSettings.request;
  const request = Promise.allSettled([
    readLoyalty(() => elevate(programs.getLoyaltyProgram)()),
    readLoyalty(() => elevate(tiers.getTiersProgram)())
  ]).then(([program, tierProgram]) => ({
    program: program.status === "fulfilled" ? program.value?.loyaltyProgram : null,
    tiers: tierProgram.status === "fulfilled" ? tierProgram.value : null
  }));
  clubSettings = { request, expires: Date.now() + 30000 };
  return request;
}

function missingAccount(error) {
  const code = String(error?.details?.applicationError?.code || error?.code || "").toUpperCase();
  return /(^|[_-])NOT_FOUND$/.test(code) || Number(error?.status || error?.statusCode) === 404;
}

export async function getCustomerWixLoyaltyCore() {
  const [settings, accountResult] = await Promise.all([
    loadClubSettings(),
    readLoyalty(() => accounts.getCurrentMemberAccount()).then(
      value => ({ account: value?.account, available: true }),
      error => ({ account: null, available: missingAccount(error) })
    )
  ]);
  const { program, tiers: tierProgram } = settings;
  const account = accountResult.account;
  const enrolled = !!(account?._id || account?.id);
  const rawBalance = account?.points?.balance;
  const pointsBalance = typeof rawBalance === "number" && Number.isFinite(rawBalance) ? rawBalance : null;
  const tiersEnabled = tierProgram?.programSettings?.status === "ENABLED";
  const configuredTiers = (tiersEnabled ? tierProgram.tiers || [] : []).map(item => ({
    id: item._id || item.id,
    name: text(item.tierDefinition?.name, 100),
    minPoints: Number(item.requiredPoints)
  })).filter(item => item.id && item.name && Number.isFinite(item.minPoints)).sort((a, b) => a.minPoints - b.minPoints);
  const baseTier = {
    name: text(tierProgram?.programSettings?.baseTierDefinition?.name, 100) || "Member",
    minPoints: 0
  };
  const tier = enrolled ? configuredTiers.find(item => item.id === account.tier?.id) || baseTier : null;
  const tierPoints = account?.tier?.points;
  const nextTier = tier && typeof tierPoints === "number"
    ? configuredTiers.find(item => item.minPoints > tier.minPoints) || null : null;
  return {
    source: "WIX",
    programName: text(program?.name, 120) || "SKANDI Club",
    programStatus: text(program?.status, 30) || "UNAVAILABLE",
    pointsName: text(program?.pointDefinition?.customName, 50) || "Points",
    status: enrolled ? (pointsBalance === null ? "UNAVAILABLE" : "ENROLLED")
      : accountResult.available && program ? "NOT_ENROLLED" : "UNAVAILABLE",
    enrolled,
    memberSince: account?._createdDate || account?.createdDate || null,
    pointsBalance,
    tier,
    nextTier,
    tiersEnabled,
    tiers: tiersEnabled ? [baseTier, ...configuredTiers] : [],
    progress: nextTier ? {
      pointsToNext: Math.max(0, nextTier.minPoints - tierPoints),
      percent: Math.min(100, Math.max(0, (tierPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints) * 100))
    } : null
  };
}

export async function getCustomerWixClubRewardsCore() {
  const club = await getCustomerWixLoyaltyCore();
  if (club.status === "UNAVAILABLE" || club.programStatus === "UNAVAILABLE") {
    throw new SkandiError("CLUB_REWARDS_UNAVAILABLE", "Club rewards are temporarily unavailable.");
  }
  if (!club.enrolled || club.programStatus !== "ACTIVE") return { ok: true, rewards: [] };

  const response = await readLoyalty(() => elevate(rewards.listRewards)({ cursorPaging: { limit: 100 } }));
  if (!Array.isArray(response?.rewards)) {
    throw new SkandiError("CLUB_REWARDS_UNAVAILABLE", "Club rewards are temporarily unavailable.");
  }
  const entries = [];
  for (const reward of response.rewards) {
    if (reward?.active !== true || !reward.name) continue;
    const coupon = reward.couponReward || {};
    const configs = Object.values(coupon).flatMap(value => value?.configsByTier || []);
    const eligible = configs.find(config => (config.tierId || "") === (club.tier?.id || ""));
    const rawCost = configs.length ? eligible?.costInPoints : reward.requiredPoints;
    if (rawCost == null || !Number.isFinite(Number(rawCost)) || Number(rawCost) < 0) continue;
    const points = Number(rawCost);
    entries.push({
      id: reward._id || reward.id,
      name: text(reward.name, 160),
      points,
      pointsToGo: Math.max(0, points - club.pointsBalance),
      canRedeem: points <= club.pointsBalance
    });
  }
  return { ok: true, rewards: entries.sort((a, b) => a.points - b.points || a.name.localeCompare(b.name)) };
}

export async function getCustomerHeaderSessionCore() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] }).catch(() => null);
  if (!member) return { loggedIn: false, menu: [] };

  const loyalty = await getCustomerWixLoyaltyCore();
  return {
    loggedIn: true,
    displayName: displayName(member),
    email: email(member?.loginEmail) || text(member?.loginEmail, 320),
    memberId: text(member?._id || member?.id, 160),
    points: loyalty.pointsBalance,
    pointsName: loyalty.pointsName,
    tierName: loyalty.tier?.name || "",
    loyaltyAvailable: loyalty.status === "ENROLLED",
    menu: ACCOUNT_MENU.map((item) => ({ ...item }))
  };
}

async function getCurrentMemberEmail() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] }).catch(() => null);
  const memberEmail = email(member?.loginEmail);
  if (!member || !memberEmail) {
    throw new SkandiError("EMAIL_PREFERENCES_LOGIN_REQUIRED", "Sign in with your SKANDI account to manage email preferences.", {
      publicMessage: "Sign in with your SKANDI account to manage email preferences."
    });
  }
  return memberEmail;
}

export async function getCustomerEmailPreferencesCore() {
  const memberEmail = await getCurrentMemberEmail();
  const response = await queryEmailSubscriptions(
    { email: { $in: [memberEmail] } },
    { paging: { limit: 1, offset: 0 } }
  );
  const subscription = (response?.subscriptions || []).find(
    item => email(item?.email) === memberEmail
  ) || null;
  const status = text(subscription?.subscriptionStatus || "NOT_SET", 32).toUpperCase();
  return {
    ok: true,
    email: memberEmail,
    subscriptionStatus: status,
    subscribed: status === "SUBSCRIBED",
    updatedAt: subscription?._updatedDate || null
  };
}

async function mirrorMarketingChoice(id, subscribed) {
  const memberQuery = { wix_member_id: `eq.${id}` };
  const rows = await restRequest({
    table: "customer_profiles", query: { ...memberQuery, select: "id,marketing_consent", limit: "2" }
  });
  if (!Array.isArray(rows) || rows.length !== 1 || !rows[0].id) {
    throw new Error("The SKANDI profile mirror could not be identified.");
  }
  if (rows[0].marketing_consent === subscribed) return;
  const saved = await restRequest({
    table: "customer_profiles", method: "PATCH",
    query: { ...memberQuery, id: `eq.${rows[0].id}` },
    body: { marketing_consent: subscribed, updated_at: new Date().toISOString() }
  });
  if (!Array.isArray(saved) || saved.length !== 1 || saved[0].marketing_consent !== subscribed) {
    throw new Error("The SKANDI profile mirror was not confirmed.");
  }
}

export async function updateCustomerEmailPreferencesCore(input = {}) {
  if (typeof input.subscribed !== "boolean") {
    throw new SkandiError("EMAIL_PREFERENCES_INVALID_CHOICE", "Choose whether to receive SKANDI marketing emails.", {
      publicMessage: "Choose whether to receive SKANDI marketing emails."
    });
  }
  if (input.subscribed === true && input.consentConfirmed !== true) {
    throw new SkandiError("EMAIL_PREFERENCES_CONSENT_REQUIRED", "Confirm your choice to receive SKANDI marketing emails.", {
      publicMessage: "Confirm your choice to receive SKANDI marketing emails."
    });
  }

  const member = await getCurrentCustomerMemberCore({ account: true });
  const memberEmail = email(member.loginEmail);
  if (!memberEmail) throw new SkandiError("EMAIL_PREFERENCES_LOGIN_REQUIRED", "Your Wix sign-in email could not be verified.");
  const requestedStatus = input.subscribed ? "SUBSCRIBED" : "UNSUBSCRIBED";
  const response = await upsertEmailSubscription({
    subscription: {
      email: memberEmail,
      subscriptionStatus: requestedStatus
    }
  });
  const subscription = response?.subscription;
  let status = email(subscription?.email) === memberEmail ? text(subscription.subscriptionStatus, 32).toUpperCase() : "";
  if (!status) status = (await getCustomerEmailPreferencesCore()).subscriptionStatus;
  if (status !== requestedStatus && !(input.subscribed && status === "PENDING")) {
    throw new SkandiError("EMAIL_PREFERENCES_SAVE_NOT_CONFIRMED", "Wix could not confirm your email choice. Refresh before trying again.");
  }
  const subscribed = status === "SUBSCRIBED";
  const id = memberId(member);
  const mirrors = await Promise.allSettled([
    updateCustomerMemberFieldsCore(member, { marketingConsent: subscribed ? "Yes" : "No" }),
    mirrorMarketingChoice(id, subscribed)
  ]);
  return {
    ok: true,
    email: memberEmail,
    subscriptionStatus: status,
    subscribed,
    accountSynced: mirrors.every(result => result.status === "fulfilled"),
    updatedAt: subscription?._updatedDate || null
  };
}

export async function subscribeCustomerNewsletterCore({ emailAddress = "", email: rawEmail = "", source = "Customer Footer" } = {}) {
  const cleanEmail = email(emailAddress || rawEmail);
  if (!cleanEmail) {
    throw new SkandiError("NEWSLETTER_EMAIL_INVALID", "Valid email is required.", {
      publicMessage: "Please enter a valid email address."
    });
  }

  const cleanSource = text(source, 120) || "Customer Footer";
  const response = await upsertEmailSubscription({
    subscription: {
      email: cleanEmail,
      subscriptionStatus: "SUBSCRIBED"
    }
  });
  const status = text(response?.subscription?.subscriptionStatus || "SUBSCRIBED", 32).toUpperCase();
  return {
    ok: true,
    status: status === "SUBSCRIBED" ? "subscribed" : status.toLowerCase(),
    email: cleanEmail,
    source: cleanSource
  };
}

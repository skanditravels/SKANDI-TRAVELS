// /src/backend/SKANDI_CORE/customerSession.js
// SKANDI Backend Base 1.0 — customer header/footer session core.
// Wix Members remains customer authentication owner. Wix Loyalty remains the
// current header points/tier provider. NewsletterSubscribers remains the single
// existing newsletter store until its own domain is intentionally migrated.

import { currentMember } from "wix-members-backend";
import wixData from "wix-data";
import { accounts } from "wix-loyalty.v2";
import { email, safeNumber, text } from "backend/SKANDI_CORE/platformValidation.js";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors.js";

const NEWSLETTER_COLLECTION = "NewsletterSubscribers";
const WIX_DATA_OPTIONS = Object.freeze({ suppressAuth: true, suppressHooks: false });

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
    member?.profile?.nickname ||
    member?.profile?.firstName ||
    member?.contactDetails?.firstName ||
    String(member?.loginEmail || "").split("@")[0] ||
    "Member",
    180
  );
}

async function loyaltyState() {
  try {
    const account = await accounts.getCurrentMemberAccount();
    return {
      points: safeNumber(account?.points?.balance ?? account?.pointsBalance ?? account?.balance, 0),
      tierName: text(account?.tier?.name || account?.tierName || account?.tier?.title, 120),
      loyaltyAccountId: text(account?._id || account?.id, 160)
    };
  } catch (_) {
    return { points: 0, tierName: "", loyaltyAccountId: "" };
  }
}

export async function getCustomerHeaderSessionCore() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] }).catch(() => null);
  if (!member) return { loggedIn: false, menu: [] };

  const loyalty = await loyaltyState();
  return {
    loggedIn: true,
    displayName: displayName(member),
    email: email(member?.loginEmail) || text(member?.loginEmail, 320),
    memberId: text(member?._id || member?.id, 160),
    points: loyalty.points,
    tierName: loyalty.tierName,
    loyaltyAccountId: loyalty.loyaltyAccountId,
    menu: ACCOUNT_MENU.map((item) => ({ ...item }))
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
  const existing = await wixData.query(NEWSLETTER_COLLECTION)
    .eq("email", cleanEmail)
    .limit(1)
    .find(WIX_DATA_OPTIONS)
    .catch(() => ({ items: [] }));

  const now = new Date();
  const current = existing?.items?.[0] || null;
  if (current) {
    await wixData.update(NEWSLETTER_COLLECTION, {
      ...current,
      email: cleanEmail,
      status: "Active",
      source: cleanSource,
      updatedAt: now
    }, WIX_DATA_OPTIONS);
    return { ok: true, status: "updated", email: cleanEmail };
  }

  await wixData.insert(NEWSLETTER_COLLECTION, {
    email: cleanEmail,
    status: "Active",
    source: cleanSource,
    createdAt: now,
    updatedAt: now
  }, WIX_DATA_OPTIONS);

  return { ok: true, status: "subscribed", email: cleanEmail };
}

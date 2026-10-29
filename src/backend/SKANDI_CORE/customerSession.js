// /src/backend/SKANDI_CORE/customerSession.js
// SKANDI Backend Base 1.0 — B-011.27 customer session runtime convergence.
// Wix Members remains customer authentication owner. SKANDI Club loyalty data is
// optional to the global customer session and must never make the auth/session
// web module unloadable. Wix Email Subscriptions is the source of truth for
// marketing email consent and is shared by Wix campaigns and SKANDI preferences.

import { currentMember } from "wix-members-backend";
import { emailSubscriptions } from "@wix/email-subscriptions";
import { auth } from "@wix/essentials";
import { email, text } from "backend/SKANDI_CORE/platformValidation";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";

const queryEmailSubscriptions = auth.elevate(emailSubscriptions.queryEmailSubscriptions);
const upsertEmailSubscription = auth.elevate(emailSubscriptions.upsertEmailSubscription);

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

function loyaltyState() {
  // Runtime-safe default. The live site currently has no Wix Loyalty Program app
  // installed, and a missing/incorrect @wix/loyalty dependency must not prevent
  // customerSession.web.js from loading. A dedicated loyalty provider can be
  // reintroduced once the app/dependency is intentionally installed and tested.
  return {
    points: 0,
    tierName: "",
    loyaltyAccountId: "",
    loyaltyAvailable: false
  };
}

export async function getCustomerHeaderSessionCore() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] }).catch(() => null);
  if (!member) return { loggedIn: false, menu: [] };

  const loyalty = loyaltyState();
  return {
    loggedIn: true,
    displayName: displayName(member),
    email: email(member?.loginEmail) || text(member?.loginEmail, 320),
    memberId: text(member?._id || member?.id, 160),
    points: loyalty.points,
    tierName: loyalty.tierName,
    loyaltyAccountId: loyalty.loyaltyAccountId,
    loyaltyAvailable: loyalty.loyaltyAvailable === true,
    menu: ACCOUNT_MENU.map((item) => ({ ...item }))
  };
}

async function getCurrentMemberEmail() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] }).catch(() => null);
  const memberEmail = email(member?.loginEmail || member?.contactDetails?.emails?.[0]?.email);
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

  const memberEmail = await getCurrentMemberEmail();
  const response = await upsertEmailSubscription({
    subscription: {
      email: memberEmail,
      subscriptionStatus: input.subscribed ? "SUBSCRIBED" : "UNSUBSCRIBED"
    }
  });
  const subscription = response?.subscription || {};
  const status = text(subscription.subscriptionStatus || (input.subscribed ? "SUBSCRIBED" : "UNSUBSCRIBED"), 32).toUpperCase();
  return {
    ok: true,
    email: memberEmail,
    subscriptionStatus: status,
    subscribed: status === "SUBSCRIBED",
    updatedAt: subscription._updatedDate || null
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

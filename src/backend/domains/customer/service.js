import { requireCustomerContext } from "backend/core/authContext";
import { clean, nowIso } from "backend/core/response";
import { auditLog } from "backend/core/auditLogger";
import { publishEvent } from "backend/core/eventBus";
import { mapCustomerProfile } from "backend/domains/customer/mapper";
import { updateCustomerProfile } from "backend/domains/customer/repository";

export async function getCurrentCustomer() {
  const ctx = await requireCustomerContext();
  return { ctx, profile: mapCustomerProfile(ctx.profile) };
}
export async function createPublicCase(input = {}) {
  return createCase(
    {
      memberId: null,
      wixMemberId: null,
      supabaseUserId: null,
      email: input.email || "",
      profile: { display_name: input.fullName || input.email || "Guest" }
    },
    {
      ...input,
      source: "public-contact",
      priority: "Low",
      category: input.category || "General Contact"
    }
  );
}
export async function saveCurrentCustomerProfile(payload = {}) {
  const ctx = await requireCustomerContext();
  const firstName = clean(payload.firstName);
  const lastName = clean(payload.lastName);

  const body = {
    first_name: firstName,
    last_name: lastName,
    display_name: clean(payload.displayName) || [firstName, lastName].filter(Boolean).join(" ") || ctx.profile.display_name,
    phone: clean(payload.phone),
    preferred_currency: clean(payload.preferredCurrency) || null,
    customer_type: clean(payload.customerType) || null,
    accessibility_needs_general: clean(payload.accessibilityNeedsGeneral),
    marketing_consent: payload.marketingConsent === true,
    privacy_accepted_at: payload.privacyAcceptedAt || ctx.profile.privacy_accepted_at || null,
    terms_accepted_at: payload.termsAcceptedAt || ctx.profile.terms_accepted_at || null,
    updated_at: nowIso(),
    payload: { ...(ctx.profile.payload || {}), lastProfileSave: payload }
  };

  const saved = await updateCustomerProfile(ctx.profile.id, body);

  await auditLog({
    targetMember: ctx.memberId,
    action: "SAVE_CUSTOMER_PROFILE",
    oldValue: ctx.profile,
    newValue: saved || {}
  });

  await publishEvent("CUSTOMER_UPDATED", { profileId: ctx.profile.id }, ctx);
  return mapCustomerProfile(saved || ctx.profile);
}

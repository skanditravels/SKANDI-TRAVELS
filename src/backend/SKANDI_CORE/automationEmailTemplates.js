// /src/backend/SKANDI_CORE/automationEmailTemplates.js
// SKANDI V12 — deterministic MJML compiler for Wix Automation Send Email actions.

import { EMAIL_AUDIENCES, EMAIL_PLATFORM, EMAIL_TYPES, EMAIL_WORKFLOWS } from "./automationEmailConfig.js";

const PLACEHOLDER_PATTERN = /^[$A-Za-z_][.$A-Za-z0-9_]*$/;

export function normalizeWorkflowKey(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

export function normalizeAudience(value) {
  const audience = String(value || "").trim().toUpperCase();
  return audience === EMAIL_AUDIENCES.EMPLOYEE ? EMAIL_AUDIENCES.EMPLOYEE : EMAIL_AUDIENCES.CUSTOMER;
}

export function wixPlaceholder(path) {
  const clean = String(path || "").trim();
  if (!PLACEHOLDER_PATTERN.test(clean)) throw new Error(`Invalid Wix placeholder path: ${clean || "(empty)"}`);
  return `\${${clean}}`;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(value) {
  const raw = String(value || "").trim();
  return /^https:\/\//i.test(raw) ? raw : "";
}

function mergeCopy(definition, audience, overrides = {}) {
  const employee = audience === EMAIL_AUDIENCES.EMPLOYEE;
  const securityCreate = definition.referenceCode === "AUTH-SET-PASSWORD";
  const source = {
    subject: definition.subject,
    preheader: definition.preheader,
    headline: definition.headline,
    intro: definition.intro,
    ctaLabel: definition.ctaLabel,
    ctaPlaceholder: definition.ctaPlaceholder,
    eyebrow: employee ? "RIAINTRA · Employee communication" : "SKANDI TRAVELS",
    heroTitle: employee ? "Welcome to SKANDI." : "Your journey with SKANDI.",
    heroText: employee
      ? "Secure, role-based access to the SKANDI tools and information assigned to you."
      : "Travel information, bookings and services designed around your journey."
  };

  if (securityCreate && employee) {
    source.subject = "Welcome to SKANDI — Create Your Employee Password";
    source.preheader = "Your SKANDI employee account is ready. Set your password to continue your onboarding and access RIAINTRA.";
    source.headline = "Create your employee password";
    source.intro = "Following your employment confirmation, your SKANDI employee account is ready for password setup. Create your password using the secure button below. You will use this account for RIAINTRA and the internal systems assigned to your role once your access is enabled.";
    source.ctaLabel = "Create my employee password";
    source.eyebrow = "RIAINTRA · Employee Onboarding";
    source.heroTitle = "Welcome to SKANDI.";
    source.heroText = "We’re pleased to welcome you to the team. Complete your secure account setup to continue your employee onboarding.";
  } else if (securityCreate && !employee) {
    source.subject = "Welcome to SKANDI — Your Account Is Ready";
    source.preheader = "Create your password to access your SKANDI account and manage your travel.";
    source.headline = "Create your password";
    source.intro = "Your SKANDI account is ready for password setup. Use the secure button below to create your password and complete your account access.";
    source.eyebrow = "Member Services · Account Setup";
    source.heroTitle = "Welcome to SKANDI.";
    source.heroText = "Create your password to access your account, manage upcoming travel and move more easily between SKANDI travel services.";
  }

  return { ...source, ...overrides };
}

function socialMjml() {
  const entries = Object.values(EMAIL_PLATFORM.social)
    .filter(item => safeUrl(item?.url) && safeUrl(item?.iconUrl));
  if (!entries.length) return "";
  return `<mj-social font-size="12px" icon-size="22px" mode="horizontal" align="left" padding="16px 0 0 0">${entries.map(item => `<mj-social-element href="${esc(item.url)}" src="${esc(item.iconUrl)}"></mj-social-element>`).join("")}</mj-social>`;
}

function footerMjml(workflowKey, audience) {
  const reason = audience === EMAIL_AUDIENCES.EMPLOYEE
    ? "You are receiving this email because it relates to your SKANDI employment, employee account, assigned work, or internal service."
    : "You are receiving this email because it relates to your SKANDI account, booking, purchase, support request, membership, or travel service.";
  const year = new Date().getUTCFullYear();
  return `
    <mj-section background-color="#f8fafc" padding="22px 38px 26px 38px" border-top="1px solid ${EMAIL_PLATFORM.brand.line}">
      <mj-column>
        <mj-text font-family="Arial,Helvetica,sans-serif" font-size="11px" line-height="18px" color="${EMAIL_PLATFORM.brand.muted}" padding="0">
          <strong style="color:#344054">${esc(EMAIL_PLATFORM.companyLegalName)}</strong><br/>
          ${esc(EMAIL_PLATFORM.companyMailingAddress)}<br/><br/>
          ${esc(reason)}<br/><br/>
          This is an automated message. Please do not reply to this email. For assistance, use Contact Support.<br/>
          To help ensure future SKANDI messages reach you, add <a href="mailto:${esc(EMAIL_PLATFORM.senderEmail)}" style="color:${EMAIL_PLATFORM.brand.navy};text-decoration:underline">${esc(EMAIL_PLATFORM.senderEmail)}</a> to your address book or safe-sender list.
        </mj-text>
        <mj-text font-family="Arial,Helvetica,sans-serif" font-size="11px" line-height="18px" padding="16px 0 0 0">
          <a href="${esc(EMAIL_PLATFORM.privacyPolicyUrl)}" style="color:${EMAIL_PLATFORM.brand.navy}">Privacy Policy</a>&#160;&#160;·&#160;&#160;
          <a href="${esc(EMAIL_PLATFORM.termsOfUseUrl)}" style="color:${EMAIL_PLATFORM.brand.navy}">Terms of Use</a>&#160;&#160;·&#160;&#160;
          <a href="${esc(EMAIL_PLATFORM.supportUrl)}" style="color:${EMAIL_PLATFORM.brand.navy}">Contact Support</a>
        </mj-text>
        ${socialMjml()}
        <mj-divider border-color="${EMAIL_PLATFORM.brand.line}" border-width="1px" padding="16px 0 12px 0" />
        <mj-text font-family="Arial,Helvetica,sans-serif" font-size="10px" line-height="16px" color="#98a2b3" padding="0">
          © ${year} ${esc(EMAIL_PLATFORM.copyrightOwner)}. All rights reserved.<br/>
          ${esc(EMAIL_PLATFORM.trademarkLine)}<br/>
          Template Ref: SK-EMAIL-${esc(workflowKey)}
        </mj-text>
      </mj-column>
    </mj-section>`;
}

function heroMjml(audience, copy) {
  const employee = audience === EMAIL_AUDIENCES.EMPLOYEE;
  const image = safeUrl(employee ? EMAIL_PLATFORM.assets.employeeWelcomeHeroImage : EMAIL_PLATFORM.assets.customerWelcomeHeroImage);
  const attrs = image
    ? `background-url="${esc(image)}" background-size="cover" background-repeat="no-repeat"`
    : `background-color="${EMAIL_PLATFORM.brand.navy}"`;
  return `<mj-section ${attrs} padding="0">
    <mj-column background-color="rgba(2,46,100,0.72)" padding="34px 38px">
      <mj-text font-family="Arial,Helvetica,sans-serif" font-size="11px" line-height="16px" font-weight="800" letter-spacing="1.6px" color="#8be0e7" text-transform="uppercase" padding="0 0 8px 0">${esc(copy.eyebrow)}</mj-text>
      <mj-text font-family="Arial,Helvetica,sans-serif" font-size="34px" line-height="41px" font-weight="800" color="#ffffff" padding="0 0 8px 0">${esc(copy.heroTitle)}</mj-text>
      <mj-text font-family="Arial,Helvetica,sans-serif" font-size="15px" line-height="23px" font-weight="600" color="#ffffff" padding="0">${esc(copy.heroText)}</mj-text>
    </mj-column>
  </mj-section>`;
}

function clubPromoMjml() {
  return `<mj-section background-color="${EMAIL_PLATFORM.brand.navy}" padding="26px 28px">
    <mj-column>
      <mj-text font-family="Arial,Helvetica,sans-serif" font-size="10px" line-height="15px" font-weight="800" letter-spacing="1.6px" color="#82dce4" padding="0 0 8px 0">SKANDI CLUB</mj-text>
      <mj-text font-family="Arial,Helvetica,sans-serif" font-size="24px" line-height="31px" font-weight="800" color="#ffffff" padding="0 0 8px 0">More SKANDI. More for every journey.</mj-text>
      <mj-text font-family="Arial,Helvetica,sans-serif" font-size="14px" line-height="22px" color="#f4f8fc" padding="0 0 14px 0">Join SKANDI CLUB for member offers, travel inspiration, selected promotions and benefits designed around the way you travel.</mj-text>
      <mj-button background-color="${EMAIL_PLATFORM.brand.cyan}" color="${EMAIL_PLATFORM.brand.navy}" font-family="Arial,Helvetica,sans-serif" font-size="13px" font-weight="800" border-radius="7px" href="${esc(EMAIL_PLATFORM.clubSignupUrl)}" align="left" padding="0">Join SKANDI CLUB</mj-button>
    </mj-column>
  </mj-section>`;
}

function primaryAction(definition, copy, audience) {
  if (definition.template === "CODE") {
    return `<mj-section padding="0 38px 28px 38px"><mj-column background-color="${EMAIL_PLATFORM.brand.panel}" border="1px solid #d6eef1" border-radius="10px" padding="18px"><mj-text align="center" font-family="Arial,Helvetica,sans-serif" font-size="28px" line-height="34px" font-weight="800" color="${EMAIL_PLATFORM.brand.navy}" padding="0">${wixPlaceholder(copy.ctaPlaceholder)}</mj-text></mj-column></mj-section>`;
  }

  let href = "";
  if (copy.ctaPlaceholder) href = wixPlaceholder(copy.ctaPlaceholder);
  else if (audience === EMAIL_AUDIENCES.EMPLOYEE) href = EMAIL_PLATFORM.employeePortalUrl;
  else if (definition.category === "SUPPORT") href = EMAIL_PLATFORM.supportUrl;
  else if (definition.category === "CLUB") href = EMAIL_PLATFORM.clubSignupUrl;
  else if (["BOOKING", "PAYMENT", "DOCUMENTS", "TRAVEL"].includes(definition.category)) href = EMAIL_PLATFORM.bookingUrl;
  else href = EMAIL_PLATFORM.siteUrl;

  if (!copy.ctaLabel || !href) return "";
  return `<mj-section padding="0 38px 28px 38px"><mj-column><mj-button background-color="${EMAIL_PLATFORM.brand.cyan}" color="${EMAIL_PLATFORM.brand.navy}" font-family="Arial,Helvetica,sans-serif" font-size="15px" line-height="18px" font-weight="800" border-radius="8px" href="${esc(href)}" align="left" padding="0">${esc(copy.ctaLabel)}</mj-button></mj-column></mj-section>`;
}

// Details are supplied by the owner-verified confirmation-cart bridge, not by
// the Wix Automation editor's test data or visitor-controlled form fields.
function confirmedBookingDetailsMjml(workflowKey) {
  if (workflowKey !== "BOOKING_CONFIRMED") return "";
  const fields = [
    ["Booking reference", "bookingReference"],
    ["Supplier confirmation", "supplierReference"],
    ["Date confirmed", "confirmationDate"],
    ["Travelers", "travelerDetails"],
    ["Flights", "flightDetails"],
    ["Accommodation", "hotelDetails"],
    ["Car rental", "carDetails"],
    ["Transfers", "transferDetails"],
    ["Seat assignments", "seatDetails"],
    ["Booked extras", "extrasDetails"],
    ["Booking total", "totalAmount"],
    ["Payment status", "paymentStatus"]
  ];
  return `<mj-section background-color="#ffffff" padding="4px 38px 26px 38px"><mj-column background-color="${EMAIL_PLATFORM.brand.panel}" padding="18px 20px" border="1px solid ${EMAIL_PLATFORM.brand.line}" border-radius="9px">
    <mj-text font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="13px" line-height="20px" color="${EMAIL_PLATFORM.brand.navy}" padding="0 0 10px">YOUR BOOKING DETAILS</mj-text>
    ${fields.map(([label, key]) => `<mj-text font-family="Arial,Helvetica,sans-serif" font-size="13px" line-height="21px" color="${EMAIL_PLATFORM.brand.body}" padding="7px 0"><strong>${esc(label)}</strong><br/>${wixPlaceholder(key)}</mj-text>`).join("")}
    <mj-text font-family="Arial,Helvetica,sans-serif" font-size="11px" line-height="18px" color="${EMAIL_PLATFORM.brand.muted}" padding="14px 0 0">Supplier ticket numbers, vouchers, exact check-in rules and document availability remain subject to their current confirmed status in My Profile. This email is not a boarding pass.</mj-text>
  </mj-column></mj-section>`;
}

function securityNotice(definition) {
  if (!definition.secure) return "";
  return `<mj-section padding="0 38px 28px 38px"><mj-column><mj-text font-family="Arial,Helvetica,sans-serif" font-size="12px" line-height="19px" color="${EMAIL_PLATFORM.brand.muted}" padding="0">●&#160;&#160;Security notice: security links and verification codes are intended only for the recipient. Do not forward this email or share the secure value.</mj-text></mj-column></mj-section>`;
}

function fallbackSecureLink(definition) {
  if (!definition.secure || definition.template === "CODE" || !definition.ctaPlaceholder) return "";
  const value = wixPlaceholder(definition.ctaPlaceholder);
  return `<mj-section padding="0 38px 32px 38px"><mj-column><mj-divider border-color="${EMAIL_PLATFORM.brand.line}" border-width="1px" padding="0 0 16px 0"/><mj-text font-family="Arial,Helvetica,sans-serif" font-size="12px" line-height="19px" color="${EMAIL_PLATFORM.brand.muted}" padding="0">If the button does not open, copy and paste this secure link into your browser:<br/><a href="${esc(value)}" style="color:${EMAIL_PLATFORM.brand.navy};word-break:break-all">${esc(value)}</a></mj-text></mj-column></mj-section>`;
}

export function compileAutomationEmailContent({ workflowKey, audience, copyOverrides = {} } = {}) {
  const key = normalizeWorkflowKey(workflowKey);
  const definition = EMAIL_WORKFLOWS[key];
  if (!definition) throw new Error(`Unknown SKANDI email workflow: ${key || "(empty)"}`);

  const normalizedAudience = normalizeAudience(audience);
  if (!definition.audiences.includes(normalizedAudience)) {
    throw new Error(`Audience ${normalizedAudience} is not allowed for workflow ${key}`);
  }

  const copy = mergeCopy(definition, normalizedAudience, copyOverrides);
  const employee = normalizedAudience === EMAIL_AUDIENCES.EMPLOYEE;
  const logo = employee ? EMAIL_PLATFORM.assets.employeeLogoUrl : EMAIL_PLATFORM.assets.customerLogoUrl;
  const label = employee ? "RIAINTRA · Employee" : "SKANDI TRAVELS";
  const marketing = normalizedAudience === EMAIL_AUDIENCES.CUSTOMER && definition.allowMarketing && definition.emailType !== EMAIL_TYPES.BUSINESS_CRITICAL;

  const mjml = `<mjml><mj-head><mj-preview>${esc(copy.preheader)}</mj-preview><mj-attributes><mj-all font-family="Arial,Helvetica,sans-serif"/><mj-body background-color="${EMAIL_PLATFORM.brand.page}"/></mj-attributes></mj-head><mj-body background-color="${EMAIL_PLATFORM.brand.page}">
    <mj-section background-color="${EMAIL_PLATFORM.brand.navy}" padding="28px 38px 26px 38px"><mj-column><mj-image src="${esc(logo)}" alt="${esc(label)}" width="180px" align="left" padding="0 0 8px 0"/><mj-text font-size="10px" line-height="14px" font-weight="700" letter-spacing="1.6px" color="${EMAIL_PLATFORM.brand.cyan}" padding="0">${esc(label)}</mj-text></mj-column></mj-section>
    ${heroMjml(normalizedAudience, copy)}
    <mj-section background-color="#ffffff" padding="32px 38px 8px 38px"><mj-column><mj-text font-size="11px" line-height="16px" font-weight="800" letter-spacing="1.4px" color="#2a9eaa" padding="0 0 8px 0">${esc(definition.category.replace(/_/g, " "))}</mj-text><mj-text font-size="28px" line-height="36px" font-weight="800" color="${EMAIL_PLATFORM.brand.ink}" padding="0">${esc(copy.headline)}</mj-text></mj-column></mj-section>
    <mj-section background-color="#ffffff" padding="0 38px 22px 38px"><mj-column><mj-text font-size="16px" line-height="26px" color="${EMAIL_PLATFORM.brand.body}" padding="0">${esc(copy.intro)}</mj-text></mj-column></mj-section>
    ${confirmedBookingDetailsMjml(key)}
    ${primaryAction(definition, copy, normalizedAudience)}
    ${securityNotice(definition)}
    ${marketing ? clubPromoMjml() : ""}
    ${fallbackSecureLink(definition)}
    ${footerMjml(key, normalizedAudience)}
  </mj-body></mjml>`;

  return Object.freeze({
    workflowKey: key,
    audience: normalizedAudience,
    emailType: definition.emailType,
    triggerKey: definition.triggerKey,
    requiredPlaceholders: [...definition.requiredPlaceholders],
    content: {
      emailSubject: copy.subject,
      emailPreheader: copy.preheader,
      composer: {
        composerDataJson: JSON.stringify({ mjml })
      },
      editorType: "MJML"
    }
  });
}

export function emailCatalogSnapshot() {
  return Object.entries(EMAIL_WORKFLOWS).map(([key, value]) => ({
    workflowKey: key,
    category: value.category,
    audiences: [...value.audiences],
    emailType: value.emailType,
    triggerKey: value.triggerKey,
    secure: value.secure,
    allowMarketing: value.allowMarketing,
    referenceCode: value.referenceCode,
    requiredPlaceholders: [...value.requiredPlaceholders]
  }));
}

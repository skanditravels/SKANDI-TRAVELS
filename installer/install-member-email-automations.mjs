import assert from "node:assert/strict";
import {
  EMAIL_PLATFORM,
  EMAIL_TYPES,
  EMAIL_WORKFLOWS
} from "../src/backend/SKANDI_CORE/automationEmailConfig.js";
import {
  compileAutomationEmailContent,
  emailCatalogSnapshot,
  wixPlaceholder
} from "../src/backend/SKANDI_CORE/automationEmailTemplates.js";

function decodedMjml(compiled) {
  return JSON.parse(compiled.content.composer.composerDataJson).mjml;
}

assert.equal(EMAIL_PLATFORM.siteId, "97bf5405-2507-4744-b53a-0f1a5a61796d");
assert.equal(EMAIL_PLATFORM.senderEmail, "contact@skanditravels.com");
assert.equal(EMAIL_PLATFORM.companyMailingAddress, "450 Lexington Avenue, New York, NY 10163, United States");
assert.equal(wixPlaceholder("createSignupLink"), "${createSignupLink}");

const employeeCreate = compileAutomationEmailContent({
  workflowKey: "MEMBER_CREATE_PASSWORD",
  audience: "EMPLOYEE"
});
assert.equal(employeeCreate.emailType, EMAIL_TYPES.BUSINESS_CRITICAL);
assert.equal(employeeCreate.content.editorType, "MJML");
assert.equal(employeeCreate.content.emailSubject, "Welcome to SKANDI — Create Your Employee Password");
assert.match(decodedMjml(employeeCreate), /\$\{createSignupLink\}/);
assert.match(decodedMjml(employeeCreate), /RIAINTRA/);
assert.doesNotMatch(decodedMjml(employeeCreate), /Join SKANDI CLUB/);

const customerCreate = compileAutomationEmailContent({
  workflowKey: "MEMBER_CREATE_PASSWORD",
  audience: "CUSTOMER"
});
assert.equal(customerCreate.emailType, EMAIL_TYPES.BUSINESS_CRITICAL);
assert.equal(customerCreate.content.emailSubject, "Welcome to SKANDI — Your Account Is Ready");
assert.match(decodedMjml(customerCreate), /\$\{createSignupLink\}/);
assert.doesNotMatch(decodedMjml(customerCreate), /Join SKANDI CLUB/);

const reset = compileAutomationEmailContent({ workflowKey: "MEMBER_RESET_PASSWORD", audience: "CUSTOMER" });
assert.match(decodedMjml(reset), /\$\{resetPasswordLink\}/);
assert.equal(reset.emailType, EMAIL_TYPES.BUSINESS_CRITICAL);

const confirm = compileAutomationEmailContent({ workflowKey: "MEMBER_EMAIL_CONFIRMATION", audience: "CUSTOMER" });
assert.match(decodedMjml(confirm), /\$\{confirmEmailCode\}/);
assert.equal(confirm.emailType, EMAIL_TYPES.BUSINESS_CRITICAL);

const clubOffer = compileAutomationEmailContent({ workflowKey: "CLUB_OFFER", audience: "CUSTOMER" });
assert.equal(clubOffer.emailType, EMAIL_TYPES.PROMOTIONAL);
assert.match(decodedMjml(clubOffer), /Join SKANDI CLUB/);

assert.throws(
  () => compileAutomationEmailContent({ workflowKey: "EMPLOYEE_WELCOME", audience: "CUSTOMER" }),
  /not allowed/
);

assert.ok(emailCatalogSnapshot().length >= 55, "Expected a broad future workflow catalog");
assert.equal(emailCatalogSnapshot().length, Object.keys(EMAIL_WORKFLOWS).length);

for (const [key, definition] of Object.entries(EMAIL_WORKFLOWS)) {
  for (const audience of definition.audiences) {
    const compiled = compileAutomationEmailContent({ workflowKey: key, audience });
    assert.ok(compiled.content.emailSubject.length > 0, `${key}/${audience} subject`);
    assert.ok(compiled.content.emailPreheader.length > 0, `${key}/${audience} preheader`);
    const mjml = decodedMjml(compiled);
    assert.match(mjml, /^<mjml>/, `${key}/${audience} MJML root`);
    assert.match(mjml, /450 Lexington Avenue/, `${key}/${audience} legal address`);
    assert.doesNotMatch(mjml, /undefined|null/, `${key}/${audience} no nullish strings`);
    if (definition.emailType !== EMAIL_TYPES.PROMOTIONAL) {
      assert.doesNotMatch(mjml, /Join SKANDI CLUB/, `${key}/${audience} no promo in non-promotional mail`);
    }
  }
}

console.log(`PASS: ${Object.keys(EMAIL_WORKFLOWS).length} workflow definitions compiled for every allowed audience.`);
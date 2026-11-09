// SuccessFactors hire event. This module is backend-only; orgStructure enforces
// Recruiting and HR management authorization before calling it.
import { customTrigger } from "@wix/automations";
import { auth } from "@wix/essentials";
import { secrets } from "wix-secrets-backend.v2";

const TRIGGER_SECRET = "SKANDI_HR_HIRE_AUTOMATION_TRIGGER_ID";
const getSecret = auth.elevate(secrets.getSecretValue);
const runTrigger = auth.elevate(customTrigger.runTrigger);
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

// The payload contains only the approved fields; browser-supplied identifiers,
// access roles and secrets are never used as authorization.
export function makeHireAutomationPayload({ candidate = {}, employee = {}, position = {}, event = {}, offer = null } = {}) {
  const s = value => typeof value === "string" ? value.trim() : "";
  const details = offer && typeof offer === "object" && !Array.isArray(offer) ? offer : {};
  const payload = {
    eventType: "CANDIDATE_HIRED", eventId: s(event.eventId), occurredAt: s(event.occurredAt),
    candidateId: s(candidate.id), applicantId: s(candidate.applicant_id),
    firstName: s(candidate.first_name), lastName: s(candidate.last_name), candidateEmail: s(candidate.email),
    staffId: s(employee.sk_id), corporateEmail: s(employee.corporate_email_address),
    positionId: s(candidate.position_id), jobTitle: s(details.job_title || position.title),
    department: s(details.department || position.department), workLocation: s(details.work_location || position.location),
    employmentType: s(details.employment_type || position.employment_type),
    offerPrepared: Boolean(offer), offerDate: s(details.offer_date), legalEmployer: s(details.legal_employer),
    operatingBrand: s(details.operating_brand), reportsTo: s(details.reports_to), startDate: s(details.start_date),
    schedule: s(details.schedule), travel: s(details.travel), responsibilities: s(details.responsibilities),
    basePay: s(details.base_pay), payDay: s(details.payday), classification: s(details.classification),
    additionalPay: s(details.additional_pay), benefits: s(details.benefits), acceptanceDeadline: s(details.acceptance_deadline),
    hrContactName: s(details.contact_name), hrContactEmail: s(details.contact_email), hrContactPhone: s(details.contact_phone),
    signerName: s(details.signer_name), signerTitle: s(details.signer_title)
  };
  // A member ID is not a contact ID. Omit the field unless the linked contact
  // was actually returned by Wix and stored on the verified employee record.
  if (UUID.test(s(employee.contact_id))) payload.contactId = s(employee.contact_id);
  return payload;
}

export async function dispatchHireAutomation(payload) {
  let secret;
  try { secret = await getSecret(TRIGGER_SECRET); }
  catch (_) { return { state:"not_configured", contactLinked:Boolean(payload?.contactId) }; }
  const triggerId = String(typeof secret === "string" ? secret : secret?.value || "").trim();
  if (!UUID.test(triggerId)) return { state:"not_configured", contactLinked:Boolean(payload?.contactId) };
  try {
    await runTrigger({ triggerId, payload });
    // Wix accepts the event asynchronously; this does not prove an email was sent.
    return { state:"accepted", contactLinked:Boolean(payload?.contactId) };
  } catch (_) {
    // A timeout can occur after Wix accepted the event. Never silently retry.
    return { state:"unconfirmed", contactLinked:Boolean(payload?.contactId) };
  }
}

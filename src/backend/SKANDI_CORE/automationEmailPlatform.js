// /src/backend/SKANDI_CORE/automationEmailPlatform.js
// SKANDI V12 — Wix Automation Email Action adapter for centrally compiled email content.
// This module edits content only. It does not activate automations, alter routing, or grant access.

import { automationsV2 } from "@wix/automations";
import { automationEmailAction } from "@wix/automations-email-actions";
import { auth } from "@wix/essentials";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";
import { compileAutomationEmailContent, emailCatalogSnapshot } from "backend/SKANDI_CORE/automationEmailTemplates";
import { EMAIL_PLATFORM } from "backend/SKANDI_CORE/automationEmailConfig";

const getAutomationElevated = auth.elevate(automationsV2.getAutomation);
const getEmailContentElevated = auth.elevate(automationEmailAction.getEmailContent);
const setEmailContentElevated = auth.elevate(automationEmailAction.setEmailContent);
const previewEmailContentElevated = auth.elevate(automationEmailAction.previewEmailContent);
const generateActionInputMappingElevated = auth.elevate(automationEmailAction.generateActionInputMapping);

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEND_EMAIL_ACTION_KEY = "triggered-emails";

function clean(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function assertGuid(value, label) {
  const id = clean(value, 120);
  if (!GUID.test(id)) {
    throw new SkandiError("AUTOMATION_EMAIL_INVALID_ID", `${label} must be a valid GUID.`, {
      publicMessage: `A valid ${label} is required.`
    });
  }
  return id;
}

function actionsOf(automation) {
  const actions = automation?.configuration?.actions;
  return actions && typeof actions === "object" && !Array.isArray(actions) ? actions : {};
}

async function verifiedSendEmailTarget(automationId, actionId) {
  const automation = await getAutomationElevated(automationId);
  const actions = actionsOf(automation);
  const action = actions[actionId] || Object.values(actions).find(item => item?.id === actionId);
  if (!action) {
    throw new SkandiError("AUTOMATION_EMAIL_ACTION_NOT_FOUND", `Action ${actionId} was not found in automation ${automationId}.`, {
      publicMessage: "The selected Wix Automation email action could not be found."
    });
  }
  if (action.type !== "APP_DEFINED" || action?.appDefinedInfo?.actionKey !== SEND_EMAIL_ACTION_KEY) {
    throw new SkandiError("AUTOMATION_EMAIL_ACTION_WRONG_TYPE", `Action ${actionId} is not a Wix Send an email action.`, {
      publicMessage: "Select the Wix 'Send an email' action, not a condition or another action type."
    });
  }
  return {
    automation,
    action,
    automationName: clean(automation?.name, 500),
    triggerKey: clean(automation?.configuration?.trigger?.triggerKey, 200),
    status: clean(automation?.configuration?.status, 40)
  };
}

export function getAutomationEmailPlatformSnapshot() {
  return {
    ok: true,
    version: EMAIL_PLATFORM.version,
    siteId: EMAIL_PLATFORM.siteId,
    senderEmail: EMAIL_PLATFORM.senderEmail,
    companyLegalName: EMAIL_PLATFORM.companyLegalName,
    companyMailingAddress: EMAIL_PLATFORM.companyMailingAddress,
    employeeRouting: {
      emailDomain: EMAIL_PLATFORM.employeeEmailDomain,
      companyMarker: EMAIL_PLATFORM.employeeCompanyMarker,
      operator: "OR",
      authorizationSource: "SKANDI_CORE staff session / active linked employee / portal_access / permissions"
    },
    workflows: emailCatalogSnapshot()
  };
}


export async function generateAutomationEmailActionMapping({
  workflowKey,
  audience,
  triggerSchemaContactIdPath = "contactId",
  notificationTopicId = "",
  senderDetailsId = "",
  copyOverrides = {}
} = {}) {
  const compiled = compileAutomationEmailContent({ workflowKey, audience, copyOverrides });
  const action = {
    emailType: compiled.emailType,
    triggerSchemaContactIdPath: clean(triggerSchemaContactIdPath, 240) || "contactId"
  };

  const topicId = clean(notificationTopicId, 120);
  const senderId = clean(senderDetailsId, 120);

  if (compiled.emailType === "BUSINESS_TRANSACTIONAL") {
    if (!topicId) {
      throw new SkandiError("AUTOMATION_EMAIL_NOTIFICATION_TOPIC_REQUIRED", "Business Transactional email actions require a notification topic ID.", {
        publicMessage: "Select a Wix notification topic before creating this Business Transactional email action."
      });
    }
    action.notificationTopicId = topicId;
  }

  if (compiled.emailType === "BUSINESS_CRITICAL" && topicId) {
    throw new SkandiError("AUTOMATION_EMAIL_NOTIFICATION_TOPIC_FORBIDDEN", "Business Critical email actions cannot specify a notification topic.", {
      publicMessage: "Remove the notification topic from this Business Critical email action."
    });
  }

  if (senderId) action.senderDetailsId = senderId;

  const mapping = await generateActionInputMappingElevated({
    action,
    content: compiled.content
  });

  return {
    ok: true,
    workflowKey: compiled.workflowKey,
    audience: compiled.audience,
    emailType: compiled.emailType,
    triggerKey: compiled.triggerKey,
    appId: clean(mapping?.appId, 120),
    actionKey: clean(mapping?.actionKey, 240),
    inputMapping: mapping?.inputMapping || null,
    requiredPlaceholders: compiled.requiredPlaceholders
  };
}

export async function inspectAutomationEmailAction({ automationId, actionId } = {}) {
  const aid = assertGuid(automationId, "automationId");
  const xid = assertGuid(actionId, "actionId");
  const target = await verifiedSendEmailTarget(aid, xid);
  const current = await getEmailContentElevated({ automationId: aid, actionId: xid });
  return {
    ok: true,
    automationId: aid,
    actionId: xid,
    automationName: target.automationName,
    triggerKey: target.triggerKey,
    status: target.status,
    editorType: clean(current?.content?.editorType, 40),
    emailSubject: clean(current?.content?.emailSubject, 1000),
    emailPreheader: clean(current?.content?.emailPreheader, 1000)
  };
}

export async function syncAutomationEmailAction({
  automationId,
  actionId,
  workflowKey,
  audience,
  copyOverrides = {},
  expectedTriggerKey = "",
  dryRun = false
} = {}) {
  const aid = assertGuid(automationId, "automationId");
  const xid = assertGuid(actionId, "actionId");
  const target = await verifiedSendEmailTarget(aid, xid);
  const compiled = compileAutomationEmailContent({ workflowKey, audience, copyOverrides });

  const expected = clean(expectedTriggerKey || compiled.triggerKey, 200);
  if (expected && target.triggerKey && expected !== target.triggerKey) {
    throw new SkandiError("AUTOMATION_EMAIL_TRIGGER_MISMATCH", `Expected trigger ${expected}, found ${target.triggerKey}.`, {
      publicMessage: "The selected automation does not use the expected trigger for this email workflow."
    });
  }

  const current = await getEmailContentElevated({ automationId: aid, actionId: xid });
  const before = {
    editorType: clean(current?.content?.editorType, 40),
    emailSubject: clean(current?.content?.emailSubject, 1000),
    emailPreheader: clean(current?.content?.emailPreheader, 1000)
  };

  if (dryRun === true) {
    return {
      ok: true,
      dryRun: true,
      automationId: aid,
      actionId: xid,
      automationName: target.automationName,
      status: target.status,
      triggerKey: target.triggerKey,
      workflowKey: compiled.workflowKey,
      audience: compiled.audience,
      emailTypeRequired: compiled.emailType,
      before,
      proposed: {
        editorType: compiled.content.editorType,
        emailSubject: compiled.content.emailSubject,
        emailPreheader: compiled.content.emailPreheader,
        requiredPlaceholders: compiled.requiredPlaceholders
      }
    };
  }

  const updated = await setEmailContentElevated(
    { automationId: aid, actionId: xid },
    { content: compiled.content }
  );

  return {
    ok: true,
    dryRun: false,
    automationId: aid,
    actionId: xid,
    automationName: target.automationName,
    status: target.status,
    triggerKey: target.triggerKey,
    workflowKey: compiled.workflowKey,
    audience: compiled.audience,
    emailTypeRequired: compiled.emailType,
    before,
    after: {
      editorType: clean(updated?.content?.editorType || compiled.content.editorType, 40),
      emailSubject: clean(updated?.content?.emailSubject || compiled.content.emailSubject, 1000),
      emailPreheader: clean(updated?.content?.emailPreheader || compiled.content.emailPreheader, 1000)
    }
  };
}

export async function previewAutomationEmailAction({ automationId, actionId, customPayload = {} } = {}) {
  const aid = assertGuid(automationId, "automationId");
  const xid = assertGuid(actionId, "actionId");
  await verifiedSendEmailTarget(aid, xid);
  const response = await previewEmailContentElevated(
    { automationId: aid, actionId: xid },
    { customPayload, removeUnresolvedPlaceholders: false }
  );
  return {
    ok: true,
    automationId: aid,
    actionId: xid,
    emailSubject: clean(response?.emailSubject, 1000),
    html: String(response?.html || "")
  };
}

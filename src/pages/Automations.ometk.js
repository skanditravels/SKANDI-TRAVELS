// SKANDI V12 — NEW dedicated Recruiting Automations administration page controller.
// Page-code template only: paste as the COMPLETE page code for a newly created Wix page.
// Do not replace the current Success Factors.sh6tw.js controller with this file.
// Wix HTML Component element ID: #sfAutomationEmbed
// Data and administrator authorization stay in canonical SKANDI_CORE automation services.

import {
  getAutomationAdminSnapshot,
  getAutomationEmailPlatformSnapshot,
  inspectAutomationEmailAction,
  previewAutomationEmailAction,
  syncAutomationEmailAction,
  generateAutomationEmailActionMapping
} from 'backend/SKANDI_CORE/automationControl.web';

const EMBED_ID = '#sfAutomationEmbed';
const CHILD = 'SKANDI_SF_AUTOMATIONS_EMBED';
const PARENT = 'SKANDI_WIX_PARENT';
const EVENTS = new Set([
  'AUTOMATION_CONSOLE_READY',
  'AUTOMATION_CONSOLE_REFRESH',
  'AUTOMATION_CONSOLE_INSPECT',
  'AUTOMATION_CONSOLE_DRY_RUN',
  'AUTOMATION_CONSOLE_PREVIEW',
  'AUTOMATION_CONSOLE_SYNC',
  'AUTOMATION_CONSOLE_MAPPING'
]);

const str = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const dict = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
let component;
let sequence = 0;

function send(type, payload = {}, requestId = '') {
  if (!component) return;
  component.postMessage({source: PARENT, type, payload, requestId, timestamp: new Date().toISOString()});
}

function presentError(error) {
  return {
    code: str(error?.code || error?.details?.applicationError?.code || 'AUTOMATION_ERROR', 120),
    message: str(error?.publicMessage || error?.details?.applicationError?.description || error?.message || 'The requested automation operation failed.', 600)
  };
}

async function bootstrap(requestId) {
  const [platformResult, adminResult] = await Promise.allSettled([
    getAutomationEmailPlatformSnapshot(),
    getAutomationAdminSnapshot()
  ]);
  if (platformResult.status !== 'fulfilled' || adminResult.status !== 'fulfilled') {
    const rejected = platformResult.status === 'rejected' ? platformResult.reason : adminResult.reason;
    throw rejected || new Error('Automation administration could not be loaded.');
  }
  const platform = platformResult.value;
  const live = adminResult.value;
  if (!platform?.ok || !live?.ok) throw new Error('The automation platform did not confirm a successful response.');
  send('AUTOMATION_CONSOLE_BOOTSTRAP', {platform, live}, requestId);
}

async function dispatch(type, payload, requestId) {
  const data = dict(payload);
  const target = {
    automationId: str(data.automationId, 120),
    actionId: str(data.actionId, 120)
  };
  switch (type) {
    case 'AUTOMATION_CONSOLE_READY':
    case 'AUTOMATION_CONSOLE_REFRESH':
      await bootstrap(requestId);
      return;
    case 'AUTOMATION_CONSOLE_INSPECT':
      send('AUTOMATION_CONSOLE_RESULT', {operation: 'INSPECT', data: await inspectAutomationEmailAction(target)}, requestId);
      return;
    case 'AUTOMATION_CONSOLE_PREVIEW':
      send('AUTOMATION_CONSOLE_RESULT', {operation: 'PREVIEW', data: await previewAutomationEmailAction({...target, customPayload: {}})}, requestId);
      return;
    case 'AUTOMATION_CONSOLE_DRY_RUN':
    case 'AUTOMATION_CONSOLE_SYNC': {
      const result = await syncAutomationEmailAction({
        ...target,
        workflowKey: str(data.workflowKey, 120),
        audience: str(data.audience, 40),
        expectedTriggerKey: str(data.expectedTriggerKey, 240),
        dryRun: type === 'AUTOMATION_CONSOLE_DRY_RUN'
      });
      send('AUTOMATION_CONSOLE_RESULT', {operation: type === 'AUTOMATION_CONSOLE_DRY_RUN' ? 'DRY_RUN' : 'SYNC', data: result}, requestId);
      return;
    }
    case 'AUTOMATION_CONSOLE_MAPPING': {
      const result = await generateAutomationEmailActionMapping({
        workflowKey: str(data.workflowKey, 120),
        audience: str(data.audience, 40),
        triggerSchemaContactIdPath: str(data.contactPath || 'contactId', 240),
        notificationTopicId: str(data.notificationTopicId, 120),
        senderDetailsId: str(data.senderDetailsId, 120)
      });
      send('AUTOMATION_CONSOLE_RESULT', {operation: 'MAPPING', data: result}, requestId);
      return;
    }
  }
}

$w.onReady(() => {
  try { component = $w(EMBED_ID); }
  catch (error) {
    console.error('[SKANDI][Recruiting Automations] Missing HTML element #sfAutomationEmbed', presentError(error));
    return;
  }
  if (!component || typeof component.onMessage !== 'function' || typeof component.postMessage !== 'function') {
    console.error('[SKANDI][Recruiting Automations] The configured element is not an HTML Component.');
    return;
  }
  component.onMessage(async event => {
    const message = dict(event?.data);
    if (message.source !== CHILD || !EVENTS.has(message.type)) return;
    const id = str(message.requestId, 100) || `request-${++sequence}`;
    try { await dispatch(message.type, message.payload, id); }
    catch (error) {
      console.error('[SKANDI][Recruiting Automations] Action failed:', message.type, presentError(error));
      send('AUTOMATION_CONSOLE_ERROR', {operation: message.type, ...presentError(error)}, id);
    }
  });
  send('AUTOMATION_CONSOLE_CONTROLLER_ATTACHED', {ok: true});
});

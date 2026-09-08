import { superAdminControl } from 'backend/RIA/superAdminControl.web';

const HTML_ID = '#superAdminControlEmbed';
const HTML_SOURCE = 'SKANDI_SUPER_ADMIN_CONTROL';
const PARENT_SOURCE = 'SKANDI_WIX_PARENT';

$w.onReady(function () {
  const frame = $w(HTML_ID);

  frame.onMessage(async (event) => {
    const message = event?.data;
    if (!message || message.source !== HTML_SOURCE || !message.requestId || !message.type) return;

    try {
      const data = await superAdminControl(message.type, message.payload || {});
      frame.postMessage({
        source: PARENT_SOURCE,
        type: 'RESULT',
        requestId: message.requestId,
        payload: { ok: true, data }
      });
    } catch (error) {
      frame.postMessage({
        source: PARENT_SOURCE,
        type: 'RESULT',
        requestId: message.requestId,
        payload: {
          ok: false,
          error: {
            code: error?.code || 'SUPER_ADMIN_ERROR',
            message: error?.message || 'Super Admin request failed.'
          }
        }
      });
    }
  });

  // The HTML also self-bootstraps after 800ms. This lets it boot immediately
  // as soon as the Wix page controller is ready.
  frame.postMessage({
    source: PARENT_SOURCE,
    type: 'PARENT_READY'
  });
});

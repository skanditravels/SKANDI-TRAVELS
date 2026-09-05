// page-code/CareersControlPage.js
// Attach this to the Wix page that hosts the HTML Component.
// Expected HTML element ID: #htmlCareersControl

import {
  getCareersBootstrap,
  saveCandidate,
  saveJobPosting,
  publishJobPosting,
  moveCandidateStage,
  detectHistoryGaps,
  startSraVetting,
  verifyDocument,
  createDocumentPacketForCandidate,
  resendDocumentPacket,
  exportAuditPackage,
  saveSettings
} from 'backend/careersControl.web';

import wixLocation from 'wix-location-frontend';

import { dispatchQueuedCareerEmails } from 'backend/outboundEmailDispatcher.web';
import { syncCareerMailboxReplies } from 'backend/inboundCareerMailboxSync.web';

const HTML_ID = '#htmlCareersControl';

$w.onReady(async function () {
  $w(HTML_ID).onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== 'SKANDI_CAREERS_CONTROL') return;

    try {
      switch (msg.type) {
        case 'CAREERS_READY':
        case 'CAREERS_REFRESH': {
          const payload = await getCareersBootstrap(msg.payload || {});
          sendToHtml('CAREERS_REFRESH_RESULT', payload);
          break;
        }
        case 'CAREERS_SAVE_CANDIDATE': {
          await saveCandidate(msg.payload.item);
          sendToHtml('CAREERS_SAVED', { message: 'Candidate saved.' });
          break;
        }
        case 'CAREERS_SAVE_JOB_POSTING': {
          await saveJobPosting(msg.payload.item);
          sendToHtml('CAREERS_SAVED', { message: 'Job posting saved.' });
          break;
        }
        case 'CAREERS_PUBLISH_JOB_POSTING': {
          await publishJobPosting(msg.payload.item);
          sendToHtml('CAREERS_ACTION_OK', { message: 'Posting published.' });
          break;
        }
        case 'CAREERS_MOVE_CANDIDATE_STAGE': {
          await moveCandidateStage(msg.payload);
          sendToHtml('CAREERS_ACTION_OK', { message: 'Candidate stage updated.' });
          break;
        }
        case 'CAREERS_DETECT_HISTORY_GAPS': {
          await detectHistoryGaps(msg.payload.candidateId);
          sendToHtml('CAREERS_ACTION_OK', { message: 'Gap detection completed.' });
          break;
        }
        case 'CAREERS_START_SRA_VETTING': {
          await startSraVetting(msg.payload);
          sendToHtml('CAREERS_ACTION_OK', { message: 'SRA vetting started.' });
          break;
        }
        case 'CAREERS_VERIFY_DOCUMENT': {
          await verifyDocument(msg.payload.documentId);
          sendToHtml('CAREERS_ACTION_OK', { message: 'Document verified.' });
          break;
        }
        case 'CAREERS_CREATE_DOCUMENT_PACKET': {
          const result = await createDocumentPacketForCandidate(msg.payload || {});
          sendToHtml('CAREERS_ACTION_OK', result);
          break;
        }
        case 'CAREERS_RESEND_DOCUMENT_PACKET': {
          const result = await resendDocumentPacket(msg.payload || {});
          sendToHtml('CAREERS_ACTION_OK', result);
          break;
        }
        case 'CAREERS_DISPATCH_QUEUED_EMAILS': {
          const result = await dispatchQueuedCareerEmails(msg.payload || {});
          sendToHtml('CAREERS_ACTION_OK', result);
          break;
        }
        case 'CAREERS_SYNC_MAILBOX_REPLIES': {
          const result = await syncCareerMailboxReplies(msg.payload || {});
          sendToHtml('CAREERS_ACTION_OK', result);
          break;
        }
        case 'CAREERS_OPEN_DOCUMENT_EXECUTION': {
          const email = encodeURIComponent(msg.payload?.email || '');
          const token = encodeURIComponent(msg.payload?.token || '');
          const path = msg.payload?.path || '/careers/documents';
          wixLocation.to(`${path}?email=${email}&token=${token}`);
          break;
        }
        case 'CAREERS_SAVE_SETTINGS': {
          await saveSettings(msg.payload.item);
          sendToHtml('CAREERS_SAVED', { message: 'Settings saved.' });
          break;
        }
        case 'CAREERS_EXPORT_AUDIT': {
          const result = await exportAuditPackage(msg.payload || {});
          sendToHtml('CAREERS_ACTION_OK', { message: 'Audit export prepared.', result });
          break;
        }
        default:
          sendToHtml('CAREERS_ACTION_OK', { message: `Received ${msg.type}` });
      }
    } catch (err) {
      sendToHtml('CAREERS_ERROR', { message: err.message || 'Careers action failed.' });
    }
  });

  const payload = await getCareersBootstrap({});
  sendToHtml('CAREERS_BOOTSTRAP', payload);
});

function sendToHtml(type, payload = {}) {
  $w(HTML_ID).postMessage({
    source: 'SKANDI_WIX_PARENT',
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

import {
  listAgentSupportCases,
  getAgentSupportCase,
  replyAgentSupportCase,
  updateAgentSupportCase
} from "src/backend/chatwootSupport.web";

const HTML_ID = "#customerServiceCenterEmbed";
const CHILD_SOURCE = "SKANDI_SUPPORT_AGENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
import { insertMessageToPostgres, triggerPusherEvent } from 'src/backend/omnichannel.jsw';

$w.onReady(function () {
    $w("#html1").onMessage(async (event) => {
        if (event.data.type === 'SEND_MESSAGE') {
            const payload = event.data.payload;
            
            // 1. Save to Database securely on the backend
            const dbResult = await insertMessageToPostgres(payload);
            
            // 2. Trigger the Pusher event from the secure backend so all other agents (and the customer) see it instantly
            if (dbResult.success) {
               await triggerPusherEvent(`private-case-${payload.caseId}`, 'new-message', {
                   sender: 'Agent Name',
                   text: payload.text,
                   type: 'agent'
               });
            }
        }
    });
});
$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE) return;

    try {
      if (msg.type === "AGENT_READY" || msg.type === "AGENT_LIST_CASES") {
        const payload = await listAgentSupportCases(msg.filters || {});
        html.postMessage({ source: PARENT_SOURCE, type: "AGENT_CASE_LIST", payload });
        return;
      }

      if (msg.type === "AGENT_OPEN_CASE") {
        const payload = await getAgentSupportCase({ caseId: msg.caseId });
        html.postMessage({ source: PARENT_SOURCE, type: "AGENT_CASE_DETAIL", payload });
        return;
      }

      if (msg.type === "AGENT_REPLY") {
        const payload = await replyAgentSupportCase({
          caseId: msg.caseId,
          content: msg.content
        });
        html.postMessage({ source: PARENT_SOURCE, type: "AGENT_REPLY_SENT", payload });
        return;
      }

      if (msg.type === "AGENT_UPDATE_CASE") {
        const payload = await updateAgentSupportCase({
          caseId: msg.caseId,
          updates: msg.updates || {}
        });
        html.postMessage({ source: PARENT_SOURCE, type: "AGENT_CASE_UPDATED", payload });
      }
    } catch (error) {
      html.postMessage({
        source: PARENT_SOURCE,
        type: "AGENT_ERROR",
        message: error.message || "Customer service action failed."
      });
    }
  });
});

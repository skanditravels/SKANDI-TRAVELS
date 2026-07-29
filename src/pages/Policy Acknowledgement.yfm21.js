import {
  getPolicyAcknowledgementPacket,
  submitPublicPolicyAcknowledgement
} from "src/backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#policyAcknowledgementEmbed";
const HTML_SOURCE = "SKANDI_POLICY_ACKNOWLEDGEMENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const msg = event.data || {};
    const payload = msg.payload || {};
    if (msg.source && msg.source !== HTML_SOURCE) return;
    try {
      if (msg.type === "POLICY_ACK_PACKET_LOAD_REQUEST") {
        send("POLICY_ACK_PACKET_DATA", await getPolicyAcknowledgementPacket(payload));
        return;
      }
      if (msg.type === "POLICY_ACK_SUBMIT") {
        send("POLICY_ACK_RESULT", await submitPublicPolicyAcknowledgement(payload));
        return;
      }
    } catch (error) {
      send("POLICY_ACK_ERROR", { message: error.message || "Policy acknowledgement failed." });
    }
  });
});

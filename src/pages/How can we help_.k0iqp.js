import wixLocation from "wix-location";
import { createPublicSupportCase } from "backend/chatwootSupport.web";

const HTML_ID = "#skandiHelpCenterEmbed";
const CHILD_SOURCE = "SKANDI_SUPPORT_PUBLIC";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE) return;

    try {
      if (msg.type === "PUBLIC_SUPPORT_CREATE_CASE") {
        const payload = await createPublicSupportCase({
          input: msg.payload || {}
        });

        html.postMessage({
          source: PARENT_SOURCE,
          type: "PUBLIC_SUPPORT_CASE_CREATED",
          payload
        });
        return;
      }

      if (msg.type === "PUBLIC_SUPPORT_NAVIGATE" && msg.payload?.path) {
        wixLocation.to(msg.payload.path);
      }
    } catch (error) {
      html.postMessage({
        source: PARENT_SOURCE,
        type: "PUBLIC_SUPPORT_ERROR",
        payload: {
          message: error.message || "Support request failed."
        }
      });
    }
  });
});

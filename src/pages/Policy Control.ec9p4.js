import wixLocation from "wix-location-frontend";
import {
  getPolicyAdminBootstrap,
  adminListLegalPolicies,
  adminGetLegalPolicy,
  adminSaveLegalPolicy,
  adminPublishLegalPolicy,
  adminArchiveLegalPolicy,
  adminDeleteLegalPolicy,
  adminRegenerateLegalPolicyPdf,
  adminParseLegalPolicyPdfText
} from "backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#policyControlEmbed";
const HTML_SOURCE = "SKANDI_POLICY_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function errorPayload(error) {
  return { message: error?.message || "Policy Control request failed." };
}

async function bootstrap() {
  try {
    send("POLICY_BOOTSTRAP", await getPolicyAdminBootstrap());
  } catch (error) {
    send("POLICY_ERROR", errorPayload(error));
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source && message.source !== HTML_SOURCE) return;
    const payload = message.payload || {};

    try {
      switch (message.type) {
        case "POLICY_READY":
        case "POLICY_BOOTSTRAP_REQUEST":
          await bootstrap();
          break;

        case "POLICY_LIST_REQUEST":
          send("POLICY_LIST", await adminListLegalPolicies(payload));
          break;

        case "POLICY_GET_REQUEST":
          send("POLICY_DETAIL", await adminGetLegalPolicy(payload));
          break;

        case "POLICY_SAVE_REQUEST":
          send("POLICY_SAVED", await adminSaveLegalPolicy(payload));
          break;

        case "POLICY_PUBLISH_REQUEST":
          send("POLICY_SAVED", await adminPublishLegalPolicy(payload));
          break;

        case "POLICY_ARCHIVE_REQUEST":
          send("POLICY_SAVED", await adminArchiveLegalPolicy(payload));
          break;

        case "POLICY_DELETE_REQUEST":
          send("POLICY_DELETED", await adminDeleteLegalPolicy(payload));
          break;

        case "POLICY_PDF_REGENERATE_REQUEST":
          send("POLICY_SAVED", await adminRegenerateLegalPolicyPdf(payload));
          break;

        case "POLICY_PDF_PARSE_REQUEST":
          send("POLICY_PDF_PARSED", await adminParseLegalPolicyPdfText(payload));
          break;

        case "POLICY_NAVIGATE":
          if (payload.path && String(payload.path).startsWith("/")) {
            wixLocation.to(payload.path);
          }
          break;

        default:
          break;
      }
    } catch (error) {
      send("POLICY_ERROR", errorPayload(error));
    }
  });

  bootstrap();
});

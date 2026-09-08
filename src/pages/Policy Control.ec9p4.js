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

function cleanError(error) {
  const message = String(error?.message || error || "").trim();
  if (!message) return "Policy Control action failed.";
  return message.length > 300 ? "Policy Control action failed." : message;
}

function allowedInternalPath(path) {
  const value = String(path || "").trim();
  return (
    value === "/riaintra" ||
    value.startsWith("/riaintra/") ||
    value === "/altea" ||
    value.startsWith("/altea/")
  );
}

async function bootstrap() {
  try {
    const result = await getPolicyAdminBootstrap();
    send("POLICY_BOOTSTRAP", result);
  } catch (error) {
    send("POLICY_BOOTSTRAP", {
      ok: false,
      authorized: false,
      error: cleanError(error),
      policies: [],
      reviewSummary: { dueSoon: 0, overdue: 0 }
    });
  }
}

async function listPolicies(payload = {}) {
  const result = await adminListLegalPolicies({
    search: payload.search || "",
    scope: payload.scope || "all",
    status: payload.status || "all"
  });
  send("POLICY_LIST", result);
  return result;
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    const payload = message.payload || {};

    if (message.source !== HTML_SOURCE) return;

    try {
      switch (message.type) {
        case "POLICY_READY":
          await bootstrap();
          break;

        case "POLICY_LIST_REQUEST":
          await listPolicies(payload);
          break;

        case "POLICY_GET_REQUEST": {
          const result = await adminGetLegalPolicy(payload);
          send("POLICY_DETAIL", result);
          break;
        }

        case "POLICY_SAVE_REQUEST": {
          const result = await adminSaveLegalPolicy({
            policy: payload.policy || {},
            changeSummary: payload.changeSummary || "Saved from Policy Control."
          });
          send("POLICY_SAVED", result);
          break;
        }

        case "POLICY_PUBLISH_REQUEST": {
          const result = await adminPublishLegalPolicy(payload);
          send("POLICY_SAVED", result);
          break;
        }

        case "POLICY_ARCHIVE_REQUEST": {
          const result = await adminArchiveLegalPolicy(payload);
          send("POLICY_SAVED", result);
          break;
        }

        case "POLICY_DELETE_REQUEST": {
          const result = await adminDeleteLegalPolicy(payload);
          send("POLICY_DELETED", result);
          break;
        }

        case "POLICY_PDF_REGENERATE_REQUEST": {
          const result = await adminRegenerateLegalPolicyPdf(payload);
          send("POLICY_SAVED", result);
          break;
        }

        case "POLICY_PDF_PARSE_REQUEST": {
          const result = await adminParseLegalPolicyPdfText({
            fileName: payload.fileName || "",
            text: payload.text || ""
          });
          send("POLICY_PDF_PARSED", result);
          break;
        }

        case "POLICY_NAVIGATE":
          if (allowedInternalPath(payload.path)) {
            wixLocation.to(payload.path);
          }
          break;

        default:
          break;
      }
    } catch (error) {
      send("POLICY_ERROR", {
        message: cleanError(error),
        action: message.type || "UNKNOWN"
      });
    }
  });

  // Load once from the Wix page as well. This covers the race where the
  // iframe posts POLICY_READY before Velo has attached its message listener.
  bootstrap();
});

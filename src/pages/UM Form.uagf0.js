import wixLocationFrontend from "wix-location-frontend";
import { currentMember } from "wix-members-frontend";
import { submitUnaccompaniedMinorForm } from "backend/FINAL/unaccompaniedMinorService.web";

/*
 * Wix popup / lightbox HTML Component ID:
 * #unaccompaniedMinorHtml
 */
const HTML_ID = "#unaccompaniedMinorHtml";
const APP_SOURCE = "SKANDI_UNACCOMPANIED_MINOR";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function parseMessage(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn("[UM Popup] Invalid JSON message.", error);
      return null;
    }
  }
  return asObject(data);
}

function send(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId,
    payload: { ...asObject(payload), requestId },
    timestamp: new Date().toISOString()
  });
}

async function memberSafe() {
  try {
    return await currentMember.getMember();
  } catch (error) {
    return null;
  }
}

async function sendMemberData(html) {
  const member = await memberSafe();
  if (!member) return;
  const contact = asObject(member.contactDetails);
  send(html, "UM_MEMBER_DATA", {
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    email: member.loginEmail || contact.emails?.[0] || ""
  });
}

$w.onReady(function () {
  let html;
  try {
    html = $w(HTML_ID);
  } catch (error) {
    console.error(`[UM Popup] Missing HTML Component ${HTML_ID}.`, error);
    return;
  }

  html.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message?.type || message.source !== APP_SOURCE) return;

    const payload = asObject(message.payload);
    const requestId = String(message.requestId || payload.requestId || "");

    try {
      if (message.type === "UM_READY") {
        await sendMemberData(html);
        return;
      }

      if (message.type === "UM_SUBMIT") {
        const member = await memberSafe();
        const result = await submitUnaccompaniedMinorForm({
          form: asObject(payload.form),
          context: {
            memberId: member?._id || member?.id || "",
            memberEmail: member?.loginEmail || "",
            sourcePage: wixLocationFrontend.url || "Wix popup"
          }
        });

        if (!result?.success || !result?.caseNumber) {
          throw new Error(result?.message || "The form could not be stored.");
        }

        send(html, "UM_SUBMIT_SUCCESS", result, requestId);
      }
    } catch (error) {
      console.error(`[UM Popup] ${message.type} failed.`, error);
      send(html, "UM_SUBMIT_ERROR", {
        message: error?.message || "The form could not be submitted."
      }, requestId);
    }
  });

  sendMemberData(html).catch((error) => {
    console.warn("[UM Popup] Member prefill unavailable.", error);
  });
});

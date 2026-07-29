import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";

import {
  getCustomerPortalState,
  saveCustomerProfile,
  saveTravelCompanion,
  deleteTravelCompanion,
  saveTravelDocument,
  deleteTravelDocument,
  enrollSkandiClub,
  removeCustomerFavorite,
  loadCustomerPortalData,
  redeemWixLoyaltyReward
} from "src/backend/customerPortal.web";

import {
  createCustomerSupportCase
} from "src/backend/chatwootSupport.web";

const EMBED_ID = "#customerProfileEmbed";

const CHILD_SOURCE = "SKANDI_CUSTOMER_PORTAL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE) return;

    try {
      switch (msg.type) {
        case "CUSTOMER_PORTAL_READY":
        case "CUSTOMER_REFRESH_REQUEST":
          await sendState("Loading profile...");
          return;

        case "CUSTOMER_SAVE_PROFILE":
          await progress("Saving profile...");
          await saveCustomerProfile(msg.payload || {});
          await sendState("Profile saved");
          return;

        case "CUSTOMER_ENROLL_CLUB":
          await progress("Activating SKANDI Club...");
          await enrollSkandiClub(msg.payload || {});
          await sendState("SKANDI Club activated");
          return;

        case "CUSTOMER_SAVE_COMPANION":
          await progress("Saving traveler...");
          await saveTravelCompanion(msg.payload || {});
          await sendState("Traveler saved");
          return;

        case "CUSTOMER_DELETE_COMPANION":
          await progress("Deleting traveler...");
          await deleteTravelCompanion(msg.payload?.id || msg.payload?._id);
          await sendState("Traveler deleted");
          return;

        case "CUSTOMER_SAVE_DOCUMENT":
          await progress("Saving document...");
          await saveTravelDocument(msg.payload || {});
          await sendState("Document saved");
          return;

        case "CUSTOMER_DELETE_DOCUMENT":
          await progress("Deleting document...");
          await deleteTravelDocument(msg.payload?.id || msg.payload?._id);
          await sendState("Document deleted");
          return;

        case "CUSTOMER_REMOVE_FAVORITE":
          await progress("Removing favourite...");
          await removeCustomerFavorite(msg.payload?.id || msg.payload?._id);
          await sendState("Favourite removed");
          return;

        case "CUSTOMER_REDEEM_REWARD":
          await progress("Redeeming reward...");
          await redeemWixLoyaltyReward(msg.payload || {});
          await sendState("Reward updated");
          return;

        case "CUSTOMER_ALEXANDRA_MESSAGE":
          await handleAlexandraMessage(msg.payload || {});
          return;

        case "CUSTOMER_OPEN_LOGIN":
          await authentication.promptLogin({ mode: "login" });
          await sendState("Loading profile...");
          return;

        case "CUSTOMER_LOGOUT":
          await authentication.logout();
          wixLocation.to("/");
          return;

        case "CUSTOMER_OPEN_PATH":
          if (msg.payload?.path) wixLocation.to(msg.payload.path);
          return;

        default:
          return;
      }
    } catch (error) {
      await handleError(error);
    }
  });

  async function sendState(message = "Loading...") {
    await progress(message);

    const state = await getCustomerPortalState();

    embed.postMessage({
      source: PARENT_SOURCE,
      type: "CUSTOMER_PORTAL_STATE",
      payload: state
    });
    try {
  const extra = await loadCustomerPortalData();

  embed.postMessage({
    source: PARENT_SOURCE,
    type: "CUSTOMER_PORTAL_DATA",
    payload: extra
  });
} catch (extraError) {
  // Do not block first page load.
}
  }

  async function progress(message) {
    embed.postMessage({
      source: PARENT_SOURCE,
      type: "CUSTOMER_PORTAL_PROGRESS",
      payload: { message }
    });
  }

  async function errorMessage(message) {
    embed.postMessage({
      source: PARENT_SOURCE,
      type: "CUSTOMER_PORTAL_ERROR",
      payload: { message }
    });
  }

  async function handleAlexandraMessage(payload = {}) {
    await progress("Alexandra is connecting...");

    const message = String(payload.message || "").trim();
    if (!message) {
      await errorMessage("Please enter a message.");
      return;
    }

    const result = await createCustomerSupportCase({
      input: {
        subject: "Alexandra request from My Profile",
        category: "Alexandra",
        priority: "Normal",
        message,
        source: "my-profile",
        page: payload.page || "my-profile",
        tab: payload.tab || "",
        payload
      }
    });

    embed.postMessage({
      source: PARENT_SOURCE,
      type: "CUSTOMER_ALEXANDRA_REPLY",
      payload: {
        ok: true,
        caseId: result?.caseId || result?.id || result?.conversationId || "",
        message: "Thanks — Alexandra has received your message. A SKANDI agent will follow up shortly."
      }
    });
  }

  async function handleError(error) {
    const code = error?.code || error?.name || "";
    const message = String(error?.message || "");

    if (code === "NOT_LOGGED_IN" || message.includes("NOT_LOGGED_IN")) {
      try {
        await authentication.promptLogin({ mode: "login" });
        await sendState("Loading profile...");
        return;
      } catch (loginError) {}
    }

    await errorMessage(message || "Something went wrong.");
  }
});

import {
  getTravelInfoAdminData,
  saveTravelInfoRecord,
  archiveTravelInfoRecord
} from "src/backend/FINAL/travelInfoAdminService.web";

const HTML_ID = "#helpCenterAdminHtml";
const SOURCE = "SKANDI_HELP_DATA_CONTROLLER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
  const html = $w(HTML_ID);

  function send(type, payload = {}) {
    html.postMessage({ source: PARENT_SOURCE, type, payload });
  }

  async function sendData() {
    send("TRAVEL_INFO_ADMIN_DATA", await getTravelInfoAdminData());
  }

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";

    if (source && source !== SOURCE) return;

    try {
      if (type === "TRAVEL_INFO_ADMIN_READY" || type === "TRAVEL_INFO_ADMIN_REFRESH") {
        await sendData();
        return;
      }

      if (type === "TRAVEL_INFO_SAVE_RECORD") {
        const result = await saveTravelInfoRecord(msg.payload || {});
        if (!result.ok) throw new Error(result.error || "Save failed.");
        send("TRAVEL_INFO_ADMIN_SAVED", result);
        await sendData();
        return;
      }

      if (type === "TRAVEL_INFO_ARCHIVE_RECORD") {
        const result = await archiveTravelInfoRecord(msg.payload || {});
        if (!result.ok) throw new Error(result.error || "Archive failed.");
        send("TRAVEL_INFO_ADMIN_SAVED", result);
        await sendData();
        return;
      }
    } catch (error) {
      send("TRAVEL_INFO_ADMIN_ERROR", { message: error.message || "Action failed." });
    }
  });

  sendData();
});

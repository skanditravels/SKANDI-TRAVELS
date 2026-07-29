import {
  getTravelInfoPayload,
  createTravelInfoSupportRequest,
  askTravelInfoAgent,
  getTravelWeather
} from "src/backend/travelInfoService.web";
import wixLocation from 'wix-location';
const HELP_CENTER_HTML_ID = "#travelInfoHtml";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const HTML_SOURCE = "SKANDI_PUBLIC_TRAVEL_INFO";

function safeSetText(selector, value) {
  try {
    $w(selector).text = value || "";
  } catch (error) {
    // Element does not exist on this page. Ignore safely.
  }
}

function safeSetImage(selector, src) {
  try {
    if (src) {
      $w(selector).src = src;
    }
  } catch (error) {
    // Element does not exist on this page. Ignore safely.
  }
}

$w.onReady(function () {
  const travelInfoHtml = $w(HELP_CENTER_HTML_ID);

  function post(type, payload = {}) {
    travelInfoHtml.postMessage({
      source: PARENT_SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    });
  }

  function updateOptionalWixWeatherElements(weatherPayload = {}) {
    const locations = weatherPayload.locations || [];
    const stockholm =
      locations.find((item) => item.locationId === "STOCKHOLM") ||
      locations.find((item) => String(item.title || "").toLowerCase().includes("stockholm")) ||
      locations[0];

    if (!stockholm || stockholm.ok === false) {
      safeSetText("#weatherText", "Weather unavailable");
      safeSetText("#weatherDesc", "");
      safeSetImage("#weatherIcon", "");
      return;
    }

    safeSetText("#weatherText", `${stockholm.title}: ${stockholm.displayTemp || ""}`);
    safeSetText("#weatherDesc", stockholm.description || stockholm.condition || "");
    safeSetImage("#weatherIcon", stockholm.iconUrl || "");
  }

  async function buildTravelInfoPayload() {
    const payload = await getTravelInfoPayload();

    // Add OpenWeather data from the same Travel Info backend.
    // This keeps the OpenWeather API key backend-only.
    try {
      const weather = await getTravelWeather({});
      payload.weather = weather;
      updateOptionalWixWeatherElements(weather);
    } catch (error) {
      payload.weather = {
        ok: false,
        source: "OPENWEATHER",
        locations: [],
        error: error.message || "Weather unavailable"
      };

      updateOptionalWixWeatherElements(payload.weather);
    }

    return payload;
  }

  async function sendTravelInfoData() {
    try {
      post("TRAVEL_INFO_PROGRESS", {
        message: "Loading SKANDI travel information..."
      });

      const payload = await buildTravelInfoPayload();

      post("TRAVEL_INFO_DATA", payload);
    } catch (error) {
      post("TRAVEL_INFO_ERROR", {
        message: "Travel information is temporarily unavailable."
      });
    }
  }

  travelInfoHtml.onMessage(async (event) => {
    const message = event.data || {};
    const type = typeof message === "string" ? message : message.type;
    const source = message.source || "";

    if (source && source !== HTML_SOURCE) {
      return;
    }

    try {
      if (type === "TRAVEL_INFO_HTML_READY" || type === "TRAVEL_INFO_REFRESH") {
        await sendTravelInfoData();
        return;
      }

      if (type === "OPEN_SUPPORT" || type === "open_support_popup") {
        // Optional:
        // wixWindow.openLightbox("Support Popup");
        return;
      }

      if (type === "TRAVEL_INFO_AI_ASK") {
        try {
          const result = await askTravelInfoAgent(message.payload || {});
          post("TRAVEL_INFO_AI_RESULT", result);
        } catch (error) {
          post("TRAVEL_INFO_AI_RESULT", {
            ok: false,
            answer: "Alexandra is temporarily unavailable. Please try again or contact SKANDI support."
          });
        }

        return;
      }

      if (type === "TRAVEL_SUPPORT_REQUEST") {
        try {
          const result = await createTravelInfoSupportRequest(message.payload || {});
          post("TRAVEL_SUPPORT_RESULT", result);
        } catch (error) {
          post("TRAVEL_SUPPORT_RESULT", {
            ok: false,
            message: "Could not submit the request. Please try again."
          });
        }

        return;
      }
    } catch (error) {
      post("TRAVEL_INFO_ERROR", {
        message: error.message || "Travel Info action failed."
      });
    }
  });

  sendTravelInfoData();
});
window.addEventListener('message', (event) => {
    if (event.data?.type === 'navigate') {
        wixLocation.to(event.data.slug);
    }
});
export function contactSupport() {
    wixLocation.to('/help');
}

import wixLocationFrontend from "wix-location-frontend";
import { bindDestinationFlow } from "public/destinationFlowBridge";

const MERGED_DESTINATIONS_ROUTE = "/about/our-network";

$w.onReady(() => {
  const query = wixLocationFrontend.query || {};
  const hasDetailState = [
    "country",
    "destination",
    "area",
    "hotel",
    "hotelId",
    "view"
  ].some((key) => String(query[key] || "").trim());

  if (!hasDetailState) {
    wixLocationFrontend.to(MERGED_DESTINATIONS_ROUTE);
    return;
  }

  bindDestinationFlow($w, "index");
});

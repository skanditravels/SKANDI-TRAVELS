// Hotel List and hotel details at /destinations/explore/hotel-list.
import { bindDestinationFlow } from "public/destinationFlowBridge";

$w.onReady(() => {
  bindDestinationFlow($w, "hotels", {
    embedId:"#areaHotelsHtml",
    sources:["SKANDI_AREA_HOTEL_SEARCH", "SKANDI_HOTEL_DETAIL"]
  });
});

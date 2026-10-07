// /src/pages/Our Destinations.ctnh1.js
// V12 destination entry; shared presentation and bridge retain the canonical catalog owner.
import { bindDestinationFlow } from "public/destinationFlowBridge";
$w.onReady(() => bindDestinationFlow($w, "index"));

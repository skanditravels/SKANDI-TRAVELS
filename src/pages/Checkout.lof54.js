// V12: native Wix /checkout entry forwards the same visitor cart to the custom Store checkout.
// The #storeCheckoutEmbed controller is installed on Checkout.qofcb.js.
import wixLocationFrontend from "wix-location-frontend";
import { SITE_MAP } from "public/siteMap";
$w.onReady(() => { wixLocationFrontend.to(SITE_MAP.storeCheckout); });

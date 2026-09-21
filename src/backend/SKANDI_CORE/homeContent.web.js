// /src/backend/SKANDI_CORE/homeContent.web.js
// B-010 public Home content facade. Business/data logic remains in homeContent.js.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getHomeContentCore,
  getHomeSearchLocationsCore,
  getOldStyleHomeContentCore
} from "backend/SKANDI_CORE/homeContent";

function publicCall(handler) {
  return webMethod(Permissions.Anyone, async (input = {}) => handler(input || {}));
}

export const getHomeContent = publicCall(getHomeContentCore);
export const getHomeSearchLocations = publicCall(getHomeSearchLocationsCore);
export const getOldStyleHomeContent = publicCall(getOldStyleHomeContentCore);

// /src/backend/SKANDI_CORE/homeContent.web.js
// V12 public Home content facade. Wix must see each top-level webMethod export.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getHomeContentCore,
  getHomeSearchLocationsCore,
  getHomeLivePricesCore,
  getOldStyleHomeContentCore
} from "backend/SKANDI_CORE/homeContent";

async function publicCall(handler, input = {}) {
  try { return await handler(input || {}); }
  catch (_) { throw new Error("Home content is temporarily unavailable. Please try again."); }
}

export const getHomeContent = webMethod(Permissions.Anyone, (input = {}) => publicCall(getHomeContentCore, input));
export const getHomeSearchLocations = webMethod(Permissions.Anyone, (input = {}) => publicCall(getHomeSearchLocationsCore, input));
export const getHomeLivePrices = webMethod(Permissions.Anyone, (input = {}) => publicCall(getHomeLivePricesCore, input));
export const getOldStyleHomeContent = webMethod(Permissions.Anyone, (input = {}) => publicCall(getOldStyleHomeContentCore, input));

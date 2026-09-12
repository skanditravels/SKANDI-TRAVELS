// /src/backend/FINAL/destinationFlowOnePage.web.js
// SKANDI Backend Base 1.0 — B-009 TEMPORARY compatibility facade.
//
// Existing Destination Flow V9.2 page code still imports this historical path.
// There is intentionally no database, Secrets, fetch, provider, or business logic here.
// Retire this file when B-010 migrates the remaining guest page controllers to
// backend/SKANDI_CORE boundaries.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getDestinationFlowCatalogCore
} from "backend/SKANDI_CORE/destinationFlow.js";

export const getDestinationFlowCatalog = webMethod(
  Permissions.Anyone,
  async (input = {}) => getDestinationFlowCatalogCore(input || {})
);

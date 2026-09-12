// /src/backend/SKANDI_CORE/destinationFlow.web.js
// SKANDI Backend Base 1.0 — B-009 canonical Destination Flow web boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getDestinationFlowCatalogCore
} from "backend/SKANDI_CORE/destinationFlow.js";

export const getDestinationFlowCatalog = webMethod(
  Permissions.Anyone,
  async (input = {}) => getDestinationFlowCatalogCore(input || {})
);

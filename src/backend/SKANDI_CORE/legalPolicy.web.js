// /src/backend/SKANDI_CORE/legalPolicy.web.js
// SKANDI Legal — B-011.1 public frontend boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import { getPublicLegalHubCore } from "backend/SKANDI_CORE/legalPolicy";

export const getPublicLegalHub = webMethod(
  Permissions.Anyone,
  () => getPublicLegalHubCore()
);

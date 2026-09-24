// /src/backend/SKANDI_CORE/legalPolicy.web.js
// SKANDI Legal — B-011.2 public frontend boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getPublicLegalHubCore,
  getPublicLegalDocumentCore
} from "backend/SKANDI_CORE/legalPolicy";

export const getPublicLegalHub = webMethod(
  Permissions.Anyone,
  () => getPublicLegalHubCore()
);

export const getPublicLegalDocument = webMethod(
  Permissions.Anyone,
  (input = {}) => getPublicLegalDocumentCore(input)
);

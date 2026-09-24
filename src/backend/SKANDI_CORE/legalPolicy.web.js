// /src/backend/SKANDI_CORE/legalPolicy.web.js
// SKANDI Legal — B-011.3 public frontend boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getPublicLegalHubCore,
  getPublicLegalDocumentCore,
  submitPublicLegalAcknowledgementCore
} from "backend/SKANDI_CORE/legalPolicy";

export const getPublicLegalHub = webMethod(
  Permissions.Anyone,
  () => getPublicLegalHubCore()
);

export const getPublicLegalDocument = webMethod(
  Permissions.Anyone,
  (input = {}) => getPublicLegalDocumentCore(input)
);

export const submitPublicLegalAcknowledgement = webMethod(
  Permissions.Anyone,
  (input = {}) => submitPublicLegalAcknowledgementCore(input)
);

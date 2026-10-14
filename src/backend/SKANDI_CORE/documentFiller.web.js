// /src/backend/SKANDI_CORE/documentFiller.web.js
// Direct webMethod declarations are required for stable Wix frontend proxy generation.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getDocumentFillerPayloadCore,
  saveDocumentFillerDraftCore,
  submitDocumentFillerCore,
  acknowledgeDocumentFillerCore
} from "backend/SKANDI_CORE/documentFiller";

export const getDocumentFillerPayload = webMethod(Permissions.SiteMember, async (input = {}) =>
  getDocumentFillerPayloadCore(input || {})
);
export const saveDocumentFillerDraft = webMethod(Permissions.SiteMember, async (input = {}) =>
  saveDocumentFillerDraftCore(input || {})
);
export const submitDocumentFiller = webMethod(Permissions.SiteMember, async (input = {}) =>
  submitDocumentFillerCore(input || {})
);
export const acknowledgeDocumentFiller = webMethod(Permissions.SiteMember, async (input = {}) =>
  acknowledgeDocumentFillerCore(input || {})
);

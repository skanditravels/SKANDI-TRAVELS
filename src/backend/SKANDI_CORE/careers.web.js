// /src/backend/SKANDI_CORE/careers.web.js
// SKANDI Careers Hub — B-011.1 public Wix web-method boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getPublicCareerDataCore,
  prepareCareerApplicationUploadsCore,
  submitCareerApplicationCore,
  requestApplicantPortalCodeCore,
  verifyApplicantPortalCodeCore,
  getApplicantPortalDataCore,
  logoutApplicantPortalSessionCore,
  getCareerDocumentPacketCore,
  submitCareerDocumentExecutionCore,
  getCareerPublicFormsCore
} from "backend/SKANDI_CORE/careers";

const anyone = fn => webMethod(Permissions.Anyone, fn);

export const getPublicCareerData = anyone(getPublicCareerDataCore);
export const prepareCareerApplicationUploads = anyone(prepareCareerApplicationUploadsCore);
export const submitCareerApplication = anyone(submitCareerApplicationCore);
export const requestApplicantPortalCode = anyone(requestApplicantPortalCodeCore);
export const verifyApplicantPortalCode = anyone(verifyApplicantPortalCodeCore);
export const getApplicantPortalData = anyone(getApplicantPortalDataCore);
export const logoutApplicantPortalSession = anyone(logoutApplicantPortalSessionCore);
export const getCareerDocumentPacket = anyone(getCareerDocumentPacketCore);
export const submitCareerDocumentExecution = anyone(submitCareerDocumentExecutionCore);
export const getCareerPublicForms = anyone(getCareerPublicFormsCore);

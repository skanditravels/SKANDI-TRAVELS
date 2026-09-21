// /src/backend/SKANDI_CORE/publicContent.web.js
// Public frontend boundary for SKANDI public-content reads.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getPublicAboutPayloadCore,
  getPublicSkandiCollectionCore,
  getPublicTravelInfoPayloadCore,
  getPublicTravelInfoAircraftCore,
  getPublicBaggagePayloadCore,
  getPublicPassportVisaPayloadCore,
  searchPublicTravelRequirementsCore,
  getPublicInsurancePayloadCore,
  getVoyAdminBootstrapCore,
  saveVoyIssueCore,
  saveVoyIssuePackageCore,
  saveVoyPageCore,
  saveVoyPagesCore,
  reorderVoyPagesCore,
  deleteVoyPageCore,
  deleteVoyIssueCore,
  publishVoyIssueCore,
  archiveVoyIssueCore,
  saveVoyEntityCore,
  deleteVoyEntityCore,
  listNewsroomAdminDataCore,
  getNewsroomAdminBootstrapCore,
  saveNewsroomCategoryCore,
  saveNewsroomPostCore,
  publishNewsroomPostCore,
  archiveNewsroomPostCore,
  saveNewsroomMediaAssetCore,
  saveNewsroomPressContactCore
} from "backend/SKANDI_CORE/publicContent";

const normalizeInput = input => input && typeof input === "object" ? input : {};
const anyone = handler => webMethod(Permissions.Anyone, input => handler(normalizeInput(input)));
const member = handler => webMethod(Permissions.SiteMember, input => handler(normalizeInput(input)));

export const getPublicAboutPayload = anyone(getPublicAboutPayloadCore);
export const getPublicSkandiCollection = anyone(getPublicSkandiCollectionCore);
export const getPublicTravelInfoPayload = anyone(getPublicTravelInfoPayloadCore);
export const getPublicTravelInfoAircraft = anyone(getPublicTravelInfoAircraftCore);
export const getPublicBaggagePayload = anyone(getPublicBaggagePayloadCore);
export const getPublicPassportVisaPayload = anyone(getPublicPassportVisaPayloadCore);
export const searchPublicTravelRequirements = anyone(searchPublicTravelRequirementsCore);
export const getPublicInsurancePayload = anyone(getPublicInsurancePayloadCore);


// Magazine Manager / Media Control protected editorial surface.
export const getVoyAdminBootstrap = member(getVoyAdminBootstrapCore);
export const saveVoyIssue = member(saveVoyIssueCore);
export const saveVoyIssuePackage = member(saveVoyIssuePackageCore);
export const saveVoyPage = member(saveVoyPageCore);
export const saveVoyPages = member(saveVoyPagesCore);
export const reorderVoyPages = member(reorderVoyPagesCore);
export const deleteVoyPage = member(deleteVoyPageCore);
export const deleteVoyIssue = member(deleteVoyIssueCore);
export const publishVoyIssue = member(publishVoyIssueCore);
export const archiveVoyIssue = member(archiveVoyIssueCore);
export const saveVoyEntity = member(saveVoyEntityCore);
export const deleteVoyEntity = member(deleteVoyEntityCore);
export const listNewsroomAdminData = member(listNewsroomAdminDataCore);
export const getNewsroomAdminBootstrap = member(getNewsroomAdminBootstrapCore);
export const saveNewsroomCategory = member(saveNewsroomCategoryCore);
export const saveNewsroomPost = member(saveNewsroomPostCore);
export const publishNewsroomPost = member(publishNewsroomPostCore);
export const archiveNewsroomPost = member(archiveNewsroomPostCore);
export const saveNewsroomMediaAsset = member(saveNewsroomMediaAssetCore);
export const saveNewsroomPressContact = member(saveNewsroomPressContactCore);

// /src/backend/RIA/alteaEnterpriseV912.web.js
// TEMPORARY R-005 compatibility facade.
// Canonical logic: /src/backend/SKANDI_CORE/reservations.js

import { webMethod, Permissions } from "wix-web-module";
import {
  updateAlteaBookingCore,
  searchSkandiClubMembersCore,
  linkSkandiClubMemberCore,
  adjustSkandiClubPointsCore,
  checkAlteaTravelRequirementsCore,
  generateAlteaBookingDocumentCore,
  requestAlteaDocumentDeliveryCore,
  updateAlteaDcsPassengerCore,
  getTransferDcsBootstrapCore,
  updateTransferDcsPassengerCore,
  updateTransferDcsDepartureCore,
  recordTransferDcsDocumentCore,
  sendAlteaManifestCore
} from "../SKANDI_CORE/reservations.js";

export const updateAlteaBookingEnterprise=webMethod(Permissions.SiteMember,updateAlteaBookingCore);
export const searchSkandiClubMembers=webMethod(Permissions.SiteMember,searchSkandiClubMembersCore);
export const linkSkandiClubMember=webMethod(Permissions.SiteMember,linkSkandiClubMemberCore);
export const adjustSkandiClubPoints=webMethod(Permissions.SiteMember,adjustSkandiClubPointsCore);
export const checkAlteaTravelRequirements=webMethod(Permissions.SiteMember,checkAlteaTravelRequirementsCore);
export const generateAlteaBookingDocument=webMethod(Permissions.SiteMember,generateAlteaBookingDocumentCore);
export const requestAlteaDocumentDelivery=webMethod(Permissions.SiteMember,requestAlteaDocumentDeliveryCore);
export const updateAlteaDcsPassenger=webMethod(Permissions.SiteMember,updateAlteaDcsPassengerCore);
export const getTransferDcsBootstrap=webMethod(Permissions.SiteMember,getTransferDcsBootstrapCore);
export const updateTransferDcsPassenger=webMethod(Permissions.SiteMember,updateTransferDcsPassengerCore);
export const updateTransferDcsDeparture=webMethod(Permissions.SiteMember,updateTransferDcsDepartureCore);
export const recordTransferDcsDocument=webMethod(Permissions.SiteMember,recordTransferDcsDocumentCore);
export const sendAlteaManifest=webMethod(Permissions.SiteMember,sendAlteaManifestCore);

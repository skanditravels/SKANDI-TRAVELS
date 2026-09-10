// /src/backend/RIA/alteaUnified.web.js
// TEMPORARY R-005 compatibility facade.
// Canonical implementation: /src/backend/SKANDI_CORE/reservations.js

import { webMethod, Permissions } from "wix-web-module";
import {
  getAlteaUnifiedBootstrapCore,
  searchAlteaBookingsCore,
  getAlteaBookingWorkspaceCore,
  syncDuffelOrderToAlteaCore,
  updateAlteaPassengerCore,
  addAlteaHistoryNoteCore,
  updateAlteaDocumentStatusCore,
  createAlteaLocalBookingCore,
  addReservationInventoryComponentCore,
  updateAlteaBookingComponentCore,
  createAlteaPassengerCore
} from "../SKANDI_CORE/reservations.js";

export const getAlteaUnifiedBootstrap=webMethod(Permissions.SiteMember,getAlteaUnifiedBootstrapCore);
export const searchAlteaBookings=webMethod(Permissions.SiteMember,searchAlteaBookingsCore);
export const getAlteaBookingWorkspace=webMethod(Permissions.SiteMember,getAlteaBookingWorkspaceCore);
export const syncDuffelOrderToAltea=webMethod(Permissions.SiteMember,syncDuffelOrderToAlteaCore);
export const updateAlteaPassenger=webMethod(Permissions.SiteMember,updateAlteaPassengerCore);
export const addAlteaHistoryNote=webMethod(Permissions.SiteMember,addAlteaHistoryNoteCore);
export const updateAlteaDocumentStatus=webMethod(Permissions.SiteMember,updateAlteaDocumentStatusCore);
export const createAlteaLocalBooking=webMethod(Permissions.SiteMember,createAlteaLocalBookingCore);
export const addAlteaInventoryComponent=webMethod(Permissions.SiteMember,addReservationInventoryComponentCore);
export const updateAlteaBookingComponent=webMethod(Permissions.SiteMember,updateAlteaBookingComponentCore);
export const createAlteaPassenger=webMethod(Permissions.SiteMember,createAlteaPassengerCore);

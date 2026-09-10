// /src/backend/RIA/inventoryReservationsV9.web.js
// TEMPORARY R-005 compatibility facade.
// Canonical logic: /src/backend/SKANDI_CORE/reservations.js

import { webMethod, Permissions } from "wix-web-module";
import {
  searchReservationInventoryCore,
  addReservationInventoryComponentCore,
  releaseReservationInventoryComponentCore,
  getReservationInventoryStatusCore
} from "../SKANDI_CORE/reservations.js";

export const searchReservationInventory=webMethod(Permissions.SiteMember,searchReservationInventoryCore);
export const addReservationInventoryComponent=webMethod(Permissions.SiteMember,addReservationInventoryComponentCore);
export const releaseReservationInventoryComponent=webMethod(Permissions.SiteMember,releaseReservationInventoryComponentCore);
export const getReservationInventoryStatus=webMethod(Permissions.SiteMember,getReservationInventoryStatusCore);

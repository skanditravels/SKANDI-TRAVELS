import { Permissions, webMethod } from "@wix/web-methods";
import {
  getEosBootstrapCore,
  searchEosFlightsCore,
  searchEosStationsCore,
  createEosClockEventCore,
  submitEosOpsActionCore
} from "backend/SKANDI_CORE/eos";

export const getEosBootstrap = webMethod(Permissions.Anyone, getEosBootstrapCore);
export const searchEosFlights = webMethod(Permissions.Anyone, searchEosFlightsCore);
export const searchEosStations = webMethod(Permissions.Anyone, searchEosStationsCore);
export const createEosClockEvent = webMethod(Permissions.Anyone, createEosClockEventCore);
export const submitEosOpsAction = webMethod(Permissions.Anyone, submitEosOpsActionCore);

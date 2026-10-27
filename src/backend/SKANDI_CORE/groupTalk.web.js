// /src/backend/SKANDI_CORE/groupTalk.web.js
// SKANDI V12 — GroupTalk canonical Wix web-method facade.
// Every core function enforces the current staff session and group membership.

import { webMethod, Permissions } from "@wix/web-methods";
import * as core from "backend/SKANDI_CORE/groupTalk";

const staffOnly = (handler) => webMethod(Permissions.Anyone, async (input = {}) => handler(input));

export const getGroupTalkBootstrap = staffOnly(core.getGroupTalkBootstrapCore);
export const getGroupTalkRealtimeConfig = staffOnly(core.getGroupTalkRealtimeConfigCore);
export const refreshGroupTalkRealtimeAuth = staffOnly(core.refreshGroupTalkRealtimeAuthCore);
export const updateGroupTalkPresence = staffOnly(core.updateGroupTalkPresenceCore);
export const getGroupTalkPresence = staffOnly(core.getGroupTalkPresenceCore);
export const createLiveKitToken = staffOnly(core.createLiveKitTokenCore);
export const triggerGroupTalkEvent = staffOnly(core.triggerGroupTalkEventCore);
export const getPhoneBook = staffOnly(core.getPhoneBookCore);
export const sendLocationPing = staffOnly(core.sendLocationPingCore);
export const getLiveLocations = staffOnly(core.getLiveLocationsCore);
export const createGroupTalkTicket = staffOnly(core.createGroupTalkTicketCore);
export const getGroupTalkTickets = staffOnly(core.getGroupTalkTicketsCore);
export const replyToGroupTalkTicket = staffOnly(core.replyToGroupTalkTicketCore);
export const searchGroupTalkHistory = staffOnly(core.searchGroupTalkHistoryCore);
export const adminSaveGroup = staffOnly(core.adminSaveGroupCore);
export const adminSetMembership = staffOnly(core.adminSetMembershipCore);
export const getTicketCategories = staffOnly(core.getTicketCategoriesCore);
export const saveTicketCategory = staffOnly(core.saveTicketCategoryCore);
export const deleteTicketCategory = staffOnly(core.deleteTicketCategoryCore);

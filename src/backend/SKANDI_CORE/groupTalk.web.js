// /src/backend/SKANDI_CORE/groupTalk.web.js
// SKANDI V12 — GroupTalk canonical Wix web-method facade.
// Every core function enforces the current staff session and group membership.

import { webMethod, Permissions } from "@wix/web-methods";
import * as core from "backend/SKANDI_CORE/groupTalk";

export const getGroupTalkBootstrap = webMethod(Permissions.Anyone, async (input = {}) => core.getGroupTalkBootstrapCore(input));
export const getGroupTalkRealtimeConfig = webMethod(Permissions.Anyone, async (input = {}) => core.getGroupTalkRealtimeConfigCore(input));
export const refreshGroupTalkRealtimeAuth = webMethod(Permissions.Anyone, async (input = {}) => core.refreshGroupTalkRealtimeAuthCore(input));
export const updateGroupTalkPresence = webMethod(Permissions.Anyone, async (input = {}) => core.updateGroupTalkPresenceCore(input));
export const getGroupTalkPresence = webMethod(Permissions.Anyone, async (input = {}) => core.getGroupTalkPresenceCore(input));
export const createLiveKitToken = webMethod(Permissions.Anyone, async (input = {}) => core.createLiveKitTokenCore(input));
export const triggerGroupTalkEvent = webMethod(Permissions.Anyone, async (input = {}) => core.triggerGroupTalkEventCore(input));
export const getPhoneBook = webMethod(Permissions.Anyone, async (input = {}) => core.getPhoneBookCore(input));
export const sendLocationPing = webMethod(Permissions.Anyone, async (input = {}) => core.sendLocationPingCore(input));
export const getLiveLocations = webMethod(Permissions.Anyone, async (input = {}) => core.getLiveLocationsCore(input));
export const createGroupTalkTicket = webMethod(Permissions.Anyone, async (input = {}) => core.createGroupTalkTicketCore(input));
export const getGroupTalkTickets = webMethod(Permissions.Anyone, async (input = {}) => core.getGroupTalkTicketsCore(input));
export const replyToGroupTalkTicket = webMethod(Permissions.Anyone, async (input = {}) => core.replyToGroupTalkTicketCore(input));
export const searchGroupTalkHistory = webMethod(Permissions.Anyone, async (input = {}) => core.searchGroupTalkHistoryCore(input));
export const adminSaveGroup = webMethod(Permissions.Anyone, async (input = {}) => core.adminSaveGroupCore(input));
export const adminSetMembership = webMethod(Permissions.Anyone, async (input = {}) => core.adminSetMembershipCore(input));
export const getTicketCategories = webMethod(Permissions.Anyone, async (input = {}) => core.getTicketCategoriesCore(input));
export const saveTicketCategory = webMethod(Permissions.Anyone, async (input = {}) => core.saveTicketCategoryCore(input));
export const deleteTicketCategory = webMethod(Permissions.Anyone, async (input = {}) => core.deleteTicketCategoryCore(input));

import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";

import {
  findAgentByMemberOrEmail,
  isAgentAuthorized
} from "./staffPortalAuth.repository.js";

import {
  getMasterInventorySnapshot,
  getFlightInventory,
  saveFlightClassCapacity,
  getScheduleInventory,
  getNestingControls,
  getInventoryAudit,
  getHotelAllocations,
  saveHotelAllotment,
  getTourCapacity,
  saveTourCapacity,
  getPartnerTickets,
  logPartnerTicketSync,
  getPackageBundles,
  savePackageBundle,
  insertAuditEvent
} from "./masterInventory.repository.js";

function cleanError(error) {
  return error?.message || "Master inventory request failed.";
}

async function requireStaffAgent() {
  const member = await currentMember.getMember().catch(() => null);

  if (!member) {
    throw new Error("Staff login required.");
  }

  const memberId = member._id || member.id || "";
  const email =
    member.loginEmail ||
    member.email ||
    member.contactDetails?.emails?.[0] ||
    "";

  const agent = await findAgentByMemberOrEmail({
    memberId,
    email
  });

  if (!agent || !isAgentAuthorized(agent)) {
    throw new Error("You are not authorized to access Master Inventory Control.");
  }

  return {
    member,
    agent
  };
}

function filtersOf(input = {}) {
  return {
    ...(input.filters || {}),
    ...input
  };
}

export const getMasterInventoryState = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();

      const result = await getMasterInventorySnapshot(
        input.module || "fdi",
        filtersOf(input)
      );

      await insertAuditEvent({
        eventType: "master_inventory_bootstrap",
        domain: "master",
        source: "postgres",
        message: "Master Inventory Control loaded.",
        payload: {
          module: input.module || "fdi"
        }
      }, agent);

      return {
        ...result,
        authorized: true
      };
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchFlightInventory = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getFlightInventory(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const updateFlightClassCapacity = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();
      return saveFlightClassCapacity(input, agent);
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchScheduleInventory = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getScheduleInventory(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchNestingControls = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getNestingControls(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchInventoryAudit = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getInventoryAudit(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchHotelAllocations = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getHotelAllocations(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const updateHotelAllotment = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();
      return saveHotelAllotment(input, agent);
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchTourCapacity = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getTourCapacity(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const updateTourCapacity = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();
      return saveTourCapacity(input, agent);
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchPartnerTickets = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getPartnerTickets(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const syncPartnerTickets = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();
      return logPartnerTicketSync(filtersOf(input), agent);
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const fetchPackageBundles = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      await requireStaffAgent();
      return getPackageBundles(filtersOf(input));
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const commitPackageBundle = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();
      return savePackageBundle(input, agent);
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);
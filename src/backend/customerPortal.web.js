import { webMethod, Permissions } from "wix-web-module";

import { requireCustomerContext } from "src/backend/core/authContext";
import { ok, fail } from "src/backend/core/response";

import {
  getPortalState,
  loadPortalData,
  saveProfile,
  enrollClub
} from "src/backend/domains/customer/service";

import {
  saveTraveler,
  deleteTraveler
} from "src/backend/domains/traveler/service";

import {
  saveDocument,
  deleteDocument
} from "src/backend/domains/document/service";

import {
  removeFavorite
} from "src/backend/domains/favorite/service";

export const getCustomerPortalState = webMethod(
  Permissions.SiteMember,
  async function (payload = {}) {
    const ctx = await requireCustomerContext();
    return getPortalState(ctx, payload);
  }
);

export const loadCustomerPortalData = webMethod(
  Permissions.SiteMember,
  async function (payload = {}) {
    const ctx = await requireCustomerContext();
    return loadPortalData(ctx, payload);
  }
);

export const saveCustomerProfile = webMethod(
  Permissions.SiteMember,
  async function (payload = {}) {
    const ctx = await requireCustomerContext();
    return saveProfile(ctx, payload);
  }
);

export const enrollSkandiClub = webMethod(
  Permissions.SiteMember,
  async function (payload = {}) {
    const ctx = await requireCustomerContext();
    return enrollClub(ctx, payload);
  }
);

export const saveTravelCompanion = webMethod(
  Permissions.SiteMember,
  async function (payload = {}) {
    const ctx = await requireCustomerContext();
    return saveTraveler(ctx, payload);
  }
);

export const deleteTravelCompanion = webMethod(
  Permissions.SiteMember,
  async function (id) {
    const ctx = await requireCustomerContext();
    return deleteTraveler(ctx, id);
  }
);

export const saveTravelDocument = webMethod(
  Permissions.SiteMember,
  async function (payload = {}) {
    const ctx = await requireCustomerContext();
    return saveDocument(ctx, payload);
  }
);

export const deleteTravelDocument = webMethod(
  Permissions.SiteMember,
  async function (id) {
    const ctx = await requireCustomerContext();
    return deleteDocument(ctx, id);
  }
);

export const removeCustomerFavorite = webMethod(
  Permissions.SiteMember,
  async function (id) {
    const ctx = await requireCustomerContext();
    return removeFavorite(ctx, id);
  }
);

export const redeemWixLoyaltyReward = webMethod(
  Permissions.SiteMember,
  async function () {
    return fail("Reward redemption will be connected after SKANDI Club reward rules are migrated.");
  }
);

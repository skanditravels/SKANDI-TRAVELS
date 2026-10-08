// /src/backend/SKANDI_CORE/publicContent.web.js
// SKANDI Public Content v12 — canonical frontend-callable facade for public content and protected editorial actions.
// Travel Info, About, Collection, baggage, passport/visa, insurance and newsroom reads remain delegated to publicContent.js.
// V12 one-true-source repair: Travel Info is overlaid from canonical Inventory/Supabase detail fields before leaving the backend.
// This facade owns web-method permissions only; provider secrets and mutations remain in canonical backend cores.

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
  getPublicNewsroomDataCore,
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
import { applyInventoryAuthorityToTravelInfoCore } from "backend/SKANDI_CORE/publicContentInventoryProjection";

const normalizeInput = input => input && typeof input === "object" ? input : {};

// Public V12 web methods are declared directly so Wix generates stable frontend proxies.
export const getPublicAboutPayload = webMethod(
  Permissions.Anyone,
  input => getPublicAboutPayloadCore(normalizeInput(input))
);

export const getPublicSkandiCollection = webMethod(
  Permissions.Anyone,
  input => getPublicSkandiCollectionCore(normalizeInput(input))
);

export const getPublicTravelInfoPayload = webMethod(
  Permissions.Anyone,
  async input => applyInventoryAuthorityToTravelInfoCore(
    await getPublicTravelInfoPayloadCore(normalizeInput(input))
  )
);

export const getPublicTravelInfoAircraft = webMethod(
  Permissions.Anyone,
  input => getPublicTravelInfoAircraftCore(normalizeInput(input))
);

export const getPublicBaggagePayload = webMethod(
  Permissions.Anyone,
  input => getPublicBaggagePayloadCore(normalizeInput(input))
);

export const getPublicPassportVisaPayload = webMethod(
  Permissions.Anyone,
  input => getPublicPassportVisaPayloadCore(normalizeInput(input))
);

export const searchPublicTravelRequirements = webMethod(
  Permissions.Anyone,
  input => searchPublicTravelRequirementsCore(normalizeInput(input))
);

export const getPublicInsurancePayload = webMethod(
  Permissions.Anyone,
  input => getPublicInsurancePayloadCore(normalizeInput(input))
);

export const getPublicNewsroomData = webMethod(
  Permissions.Anyone,
  input => getPublicNewsroomDataCore(normalizeInput(input))
);

// Magazine Manager / Media Control protected editorial surface.
export const getVoyAdminBootstrap = webMethod(
  Permissions.SiteMember,
  input => getVoyAdminBootstrapCore(normalizeInput(input))
);

export const saveVoyIssue = webMethod(
  Permissions.SiteMember,
  input => saveVoyIssueCore(normalizeInput(input))
);

export const saveVoyIssuePackage = webMethod(
  Permissions.SiteMember,
  input => saveVoyIssuePackageCore(normalizeInput(input))
);

export const saveVoyPage = webMethod(
  Permissions.SiteMember,
  input => saveVoyPageCore(normalizeInput(input))
);

export const saveVoyPages = webMethod(
  Permissions.SiteMember,
  input => saveVoyPagesCore(normalizeInput(input))
);

export const reorderVoyPages = webMethod(
  Permissions.SiteMember,
  input => reorderVoyPagesCore(normalizeInput(input))
);

export const deleteVoyPage = webMethod(
  Permissions.SiteMember,
  input => deleteVoyPageCore(normalizeInput(input))
);

export const deleteVoyIssue = webMethod(
  Permissions.SiteMember,
  input => deleteVoyIssueCore(normalizeInput(input))
);

export const publishVoyIssue = webMethod(
  Permissions.SiteMember,
  input => publishVoyIssueCore(normalizeInput(input))
);

export const archiveVoyIssue = webMethod(
  Permissions.SiteMember,
  input => archiveVoyIssueCore(normalizeInput(input))
);

export const saveVoyEntity = webMethod(
  Permissions.SiteMember,
  input => saveVoyEntityCore(normalizeInput(input))
);

export const deleteVoyEntity = webMethod(
  Permissions.SiteMember,
  input => deleteVoyEntityCore(normalizeInput(input))
);

export const listNewsroomAdminData = webMethod(
  Permissions.SiteMember,
  input => listNewsroomAdminDataCore(normalizeInput(input))
);

export const getNewsroomAdminBootstrap = webMethod(
  Permissions.SiteMember,
  input => getNewsroomAdminBootstrapCore(normalizeInput(input))
);

export const saveNewsroomCategory = webMethod(
  Permissions.SiteMember,
  input => saveNewsroomCategoryCore(normalizeInput(input))
);

export const saveNewsroomPost = webMethod(
  Permissions.SiteMember,
  input => saveNewsroomPostCore(normalizeInput(input))
);

export const publishNewsroomPost = webMethod(
  Permissions.SiteMember,
  input => publishNewsroomPostCore(normalizeInput(input))
);

export const archiveNewsroomPost = webMethod(
  Permissions.SiteMember,
  input => archiveNewsroomPostCore(normalizeInput(input))
);

export const saveNewsroomMediaAsset = webMethod(
  Permissions.SiteMember,
  input => saveNewsroomMediaAssetCore(normalizeInput(input))
);

export const saveNewsroomPressContact = webMethod(
  Permissions.SiteMember,
  input => saveNewsroomPressContactCore(normalizeInput(input))
);

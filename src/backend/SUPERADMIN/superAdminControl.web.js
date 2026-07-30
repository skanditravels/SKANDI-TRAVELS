import { Permissions, webMethod } from "wix-web-module";
import { requireSuperAdmin } from "backend/SUPERADMIN/superAdminAuth";
import { publicError } from "backend/SUPERADMIN/superAdminConfig";
import {
  getSuperAdminBootstrap as buildSuperAdminBootstrap,
  listAuthUsers,
  listStorageBuckets,
  listStorageObjects,
  loadAuditLog,
  loadTableRows,
  mutateAuthUser,
  mutateStorage,
  mutateTableRecord
} from "backend/SUPERADMIN/superAdminRepository";

async function runAuthorized(operationName, handler) {
  try {
    const actor = await requireSuperAdmin();
    return await handler(actor);
  } catch (error) {
    const safe = publicError(error);
    console.error(`[SuperAdmin:${operationName}]`, {
      code: error?.code,
      status: error?.status,
      remoteCode: error?.remoteCode,
      message: error?.message
    });
    const publicFacingError = new Error(safe.message);
    publicFacingError.code = safe.code;
    throw publicFacingError;
  }
}

export const getSuperAdminBootstrap = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("bootstrap", (actor) =>
      buildSuperAdminBootstrap(actor, { force: Boolean(input?.force) })
    )
);

export const getSuperAdminTableRows = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("tableRows", () => loadTableRows(input))
);

export const runSuperAdminRecordMutation = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("recordMutation", (actor) =>
      mutateTableRecord(input, actor)
    )
);

export const getSuperAdminAuditLog = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("auditLog", () => loadAuditLog(input))
);

export const getSuperAdminAuthUsers = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("authUsers", () => listAuthUsers(input))
);

export const runSuperAdminAuthMutation = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("authMutation", (actor) => mutateAuthUser(input, actor))
);

export const getSuperAdminStorageBuckets = webMethod(
  Permissions.SiteMember,
  async () =>
    runAuthorized("storageBuckets", () => listStorageBuckets())
);

export const getSuperAdminStorageObjects = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("storageObjects", () => listStorageObjects(input))
);

export const runSuperAdminStorageMutation = webMethod(
  Permissions.SiteMember,
  async (input = {}) =>
    runAuthorized("storageMutation", (actor) => mutateStorage(input, actor))
);

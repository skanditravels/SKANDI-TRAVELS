// /src/backend/RIA/supabaseServer.js
// TEMPORARY compatibility facade.
// Canonical implementation: /src/backend/SKANDI_CORE/supabaseServer.js
// Do not add secrets, REST, RPC, Storage, or audit logic here.

export {
  restRequest,
  rpcRequest,
  getSupabaseRealtimeBrowserConfig,
  getSupabaseServerDiagnostics,
  writeAdminAudit,
  storageCreateSignedUploadUrl,
  storageCreateSignedReadUrl,
  storageGetObjectInfo,
  storageListObjects,
  storageGetPublicUrl
} from "../SKANDI_CORE/supabaseServer.js";

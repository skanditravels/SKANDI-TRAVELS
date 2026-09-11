// /src/backend/RIA/supabaseServer.js
// SKANDI Supabase compatibility facade — R-003.6
//
// Canonical Supabase transport, secret handling, allowlists and storage logic
// live exclusively in SKANDI_CORE/supabaseServer.js. This file exists only so
// older RIA modules can resolve the historical path while they are migrated.

export {
  restRequest,
  rpcRequest,
  storageCreateSignedUploadUrl,
  storageCreateSignedReadUrl,
  storageGetObjectInfo,
  storageListObjects,
  storageGetPublicUrl,
  getSupabaseRealtimeBrowserConfig,
  getSupabaseServerDiagnostics,
  writeAdminAudit
} from "../SKANDI_CORE/supabaseServer.js";

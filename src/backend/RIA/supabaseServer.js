// /src/backend/RIA/supabaseServer.js
// TEMPORARY R-002 compatibility facade.
//
// Canonical implementation:
// /src/backend/SKANDI_CORE/supabaseServer.js
//
// Do not add Supabase configuration, secret loading, table allowlists,
// REST logic, RPC logic, or audit logic to this file.

export {
  restRequest,
  rpcRequest,
  getSupabaseRealtimeBrowserConfig,
  getSupabaseServerDiagnostics,
  writeAdminAudit
} from "../SKANDI_CORE/supabaseServer.js";

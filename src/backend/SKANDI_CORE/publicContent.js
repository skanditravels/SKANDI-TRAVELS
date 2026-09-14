import { rpcRequest } from "backend/SKANDI_CORE/supabaseServer.js";


const READ_RPCS = new Set(["get_public_about_payload", "get_public_network_map_payload"]);
export async function callPublicContentRpc(functionName) {
  if (!READ_RPCS.has(functionName)) throw new Error("PUBLIC_CONTENT_RPC_NOT_ALLOWED");
  return rpcRequest({ functionName, body: {} });
}

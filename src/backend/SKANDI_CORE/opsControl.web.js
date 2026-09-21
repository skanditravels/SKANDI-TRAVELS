// /src/backend/SKANDI_CORE/opsControl.web.js
// B-011.29 — thin Wix web-method facade for OPS Control.
import { webMethod, Permissions } from "@wix/web-methods";
import { getOpsControlBootstrapCore, handleOpsControlActionCore } from "backend/SKANDI_CORE/opsControl";
const member=(fn)=>webMethod(Permissions.Anyone,async(input={})=>fn(input));
export const getOpsControlBootstrap=member(getOpsControlBootstrapCore);
export const handleOpsControlAction=member(handleOpsControlActionCore);

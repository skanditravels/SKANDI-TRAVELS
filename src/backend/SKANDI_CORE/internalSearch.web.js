import { Permissions, webMethod } from "@wix/web-methods";
import { runInternalGlobalSearchCore } from "backend/SKANDI_CORE/internalSearch.js";


export const runInternalGlobalSearch = webMethod(Permissions.SiteMember, runInternalGlobalSearchCore);

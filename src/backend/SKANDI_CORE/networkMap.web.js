import { Permissions, webMethod } from "@wix/web-methods";
import { getPublicNetworkMapDataCore } from "backend/SKANDI_CORE/networkMap.js";


export const getPublicNetworkMapData = webMethod(Permissions.Anyone, getPublicNetworkMapDataCore);

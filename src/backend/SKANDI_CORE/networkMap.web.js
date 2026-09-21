import { Permissions, webMethod } from "@wix/web-methods";
import { getPublicNetworkMapDataCore } from "backend/SKANDI_CORE/networkMap";


export const getPublicNetworkMapData = webMethod(Permissions.Anyone, getPublicNetworkMapDataCore);

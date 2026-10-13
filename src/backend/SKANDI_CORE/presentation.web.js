// /src/backend/SKANDI_CORE/presentation.web.js
import { Permissions,webMethod } from "@wix/web-methods";
import { getPublicPagePresentationCore } from "backend/SKANDI_CORE/presentation";
export const getPublicPagePresentation=webMethod(Permissions.Anyone,input=>getPublicPagePresentationCore(input&&typeof input==="object"?input:{}));

// /src/backend/SKANDI_CORE/voyMagazine.web.js
import { Permissions,webMethod } from "@wix/web-methods";
import { currentMember } from "wix-members-backend";
import { getVoyPublicBootstrapCore,trackVoyInteractionCore,saveVoyIssueForMemberCore } from "backend/SKANDI_CORE/voyMagazine";
function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
async function context(){const m=await currentMember.getMember().catch(()=>null);return{memberId:String(m?._id||m?.id||""),email:String(m?.loginEmail||m?.contactDetails?.emails?.[0]||""),firstName:String(m?.contactDetails?.firstName||""),lastName:String(m?.contactDetails?.lastName||""),displayName:String(m?.profile?.nickname||m?.contactDetails?.firstName||"")}}
export const getVoyPublicBootstrap=webMethod(Permissions.Anyone,input=>getVoyPublicBootstrapCore(obj(input)));
export const trackVoyInteraction=webMethod(Permissions.Anyone,input=>trackVoyInteractionCore(obj(input)));
export const saveVoyIssueForMember=webMethod(Permissions.SiteMember,async input=>saveVoyIssueForMemberCore(await context(),obj(input)));

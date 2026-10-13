import { Permissions, webMethod } from "@wix/web-methods";
import {
  getPolicyControlBootstrapCore,listPolicyDocumentsCore,getPolicyDocumentCore,savePolicyDocumentCore,
  publishPolicyDocumentCore,archivePolicyDocumentCore,deletePolicyDocumentCore,regeneratePolicyPdfCore,
  parsePolicyPdfTextCore,getInternalLegalHubCore,getInternalLegalDocumentCore
} from "backend/SKANDI_CORE/policyControl";
export const getPolicyControlBootstrap=webMethod(Permissions.SiteMember,getPolicyControlBootstrapCore);
export const listPolicyDocuments=webMethod(Permissions.SiteMember,listPolicyDocumentsCore);
export const getPolicyDocument=webMethod(Permissions.SiteMember,getPolicyDocumentCore);
export const savePolicyDocument=webMethod(Permissions.SiteMember,savePolicyDocumentCore);
export const publishPolicyDocument=webMethod(Permissions.SiteMember,publishPolicyDocumentCore);
export const archivePolicyDocument=webMethod(Permissions.SiteMember,archivePolicyDocumentCore);
export const deletePolicyDocument=webMethod(Permissions.SiteMember,deletePolicyDocumentCore);
export const regeneratePolicyPdf=webMethod(Permissions.SiteMember,regeneratePolicyPdfCore);
export const parsePolicyPdfText=webMethod(Permissions.SiteMember,parsePolicyPdfTextCore);
export const getInternalLegalHub=webMethod(Permissions.SiteMember,getInternalLegalHubCore);
export const getInternalLegalDocument=webMethod(Permissions.SiteMember,getInternalLegalDocumentCore);

// /src/backend/RIA/mail.web.js
// Canonical RIA Mail web facade. R-003.9.
// Business logic lives only in SKANDI_CORE/internalMail.js.

import { webMethod, Permissions } from "wix-web-module";
import {
  getMailBootstrapCore,
  listMailMessagesCore,
  getMailMessageCore,
  sendMailMessageCore,
  saveMailDraftCore,
  updateMailUserStateCore,
  getMailDirectoryCore,
  getMailDiagnosticsCore
} from "../SKANDI_CORE/internalMail.js";

export const getMailBootstrap = webMethod(Permissions.SiteMember, async () => getMailBootstrapCore());
export const listMailMessages = webMethod(Permissions.SiteMember, async (payload = {}) => listMailMessagesCore(payload));
export const getMailMessage = webMethod(Permissions.SiteMember, async (payload = {}) => getMailMessageCore(payload));
export const sendMailMessage = webMethod(Permissions.SiteMember, async (payload = {}) => sendMailMessageCore(payload));
export const saveMailDraft = webMethod(Permissions.SiteMember, async (payload = {}) => saveMailDraftCore(payload));
export const updateMailUserState = webMethod(Permissions.SiteMember, async (payload = {}) => updateMailUserStateCore(payload));
export const getMailDirectory = webMethod(Permissions.SiteMember, async () => getMailDirectoryCore());
export const getMailDiagnostics = webMethod(Permissions.SiteMember, async () => getMailDiagnosticsCore());

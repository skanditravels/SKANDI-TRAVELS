// /src/backend/mail.web.js
// DEPRECATED compatibility facade for callers that still import backend/mail.web.
// R-003.9: no business logic is permitted here.

export {
  getMailBootstrap,
  listMailMessages,
  getMailMessage,
  sendMailMessage,
  saveMailDraft,
  updateMailUserState,
  getMailDirectory,
  getMailDiagnostics
} from "backend/RIA/mail.web";

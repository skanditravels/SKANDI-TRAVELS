// /src/pages/Customer Service Desk.benbs.js
// Route: /riaintra/customer-service
// R-007.3 preserves the existing Customer Service Center bridge and uses one canonical Support facade.


import {
  getAgentSupportBootstrap,
  listAgentSupportCases,
  getAgentSupportCase,
  replyAgentSupportCase,
  updateAgentSupportCase,
  createAgentSupportCase,
  deleteAgentSupportCase
} from "backend/SKANDI_CORE/customerSupport.web";


const PRIMARY_HTML_ID = "#customerServiceCenterEmbed";
const LEGACY_HTML_ID = "#customerServiceAgentEmbed";
const CHILD_SOURCE = "SKANDI_SUPPORT_AGENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const MAX_REPLY_LENGTH = 20000;
const ALLOWED_CASE_FIELDS = new Set(["status", "priority", "type", "group", "assigneeId", "assigneeName", "followers", "ccs", "tags", "queue"]);


function objectOf(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function payloadOf(message) { return { ...objectOf(message), ...objectOf(message?.payload) }; }
function findHtml() {
  for (const id of [PRIMARY_HTML_ID, LEGACY_HTML_ID]) {
    try { const html = $w(id); if (html) return html; } catch (_) {}
  }
  return null;
}
function post(html, type, payload = {}, requestId = "") { html.postMessage({ source: PARENT_SOURCE, type, requestId, payload: { ...objectOf(payload), requestId } }); }
function caseIdOf(payload) { return String(payload.caseId ?? payload.case_id ?? payload.ticketId ?? payload.ticket_id ?? payload.id ?? payload.case?.caseId ?? payload.case?.case_id ?? payload.case?.externalId ?? "").trim(); }
function replyOf(payload) {
  const content = String(payload.content ?? payload.message?.body ?? payload.body ?? "").trim();
  if (!content) throw new Error("Reply content is required.");
  if (content.length > MAX_REPLY_LENGTH) throw new Error(`Reply content cannot exceed ${MAX_REPLY_LENGTH} characters.`);
  return content;
}
function updatesOf(payload) {
  const updates = {};
  const supplied = objectOf(payload.updates);
  for (const [key, value] of Object.entries(supplied)) if (ALLOWED_CASE_FIELDS.has(key)) updates[key] = value;
  if (payload.action === "FIELD_CHANGE" && ALLOWED_CASE_FIELDS.has(payload.field)) updates[payload.field] = payload.value;
  if (payload.action === "FOLLOWER_CHANGE") updates.followers = Array.isArray(payload.case?.followers) ? payload.case.followers : [];
  if (payload.action === "INTERNAL_NOTE") {
    updates.action = "INTERNAL_NOTE";
    updates.internalNote = { content: replyOf(payload), createdAt: payload.message?.at || new Date().toISOString() };
    if (payload.submitAs) updates.status = String(payload.submitAs);
  }
  if (payload.action === "TALK_CALL") {
    updates.action = "TALK_CALL";
    updates.call = { message: objectOf(payload.message), outcome: String(payload.outcome || ""), duration: Number(payload.duration) || 0 };
  }
  return updates;
}
function filtersOf(payload) {
  const filters = { ...objectOf(payload.filters) };
  if (payload.queue) filters.queue = String(payload.queue);
  if (payload.view) filters.view = String(payload.view);
  if (payload.search) filters.query = String(payload.search);
  if (payload.query) filters.query = String(payload.query);
  return filters;
}
function errorText(error) { return String(error?.publicMessage || error?.message || "Customer service action failed.").slice(0, 300); }


$w.onReady(function () {
  const html = findHtml();
  if (!html) { console.error(`[Customer Service Center] Missing ${PRIMARY_HTML_ID} (legacy ${LEGACY_HTML_ID} also not found).`); return; }


  html.onMessage(async event => {
    const message = objectOf(event.data);
    if (message.source !== CHILD_SOURCE) return;
    const payload = payloadOf(message);
    const requestId = String(message.requestId || payload.requestId || "");


    try {
      switch (message.type) {
        case "AGENT_READY":
        case "AGENT_REQUEST_BOOTSTRAP": {
          const [base, list] = await Promise.all([getAgentSupportBootstrap({}), listAgentSupportCases(filtersOf(payload))]);
          post(html, "AGENT_BOOTSTRAP", { ...objectOf(base), ...objectOf(list) }, requestId);
          return;
        }
        case "AGENT_LIST_CASES":
        case "AGENT_REFRESH_CASES":
          post(html, "AGENT_CASE_LIST", await listAgentSupportCases(filtersOf(payload)), requestId);
          return;


        case "AGENT_OPEN_CASE":
        case "AGENT_CALL_START": {
          const result = await getAgentSupportCase({ caseId: caseIdOf(payload) });
          post(html, message.type === "AGENT_CALL_START" ? "AGENT_LIVEKIT_SESSION" : "AGENT_CASE_DETAIL", result, requestId);
          return;
        }


        case "AGENT_REPLY": {
          const caseId = caseIdOf(payload);
          const result = await replyAgentSupportCase({
            caseId,
            content: replyOf(payload),
            privateNote: payload.privateNote === true || payload.mode === "internal"
          });
          const updates = updatesOf(payload);
          if (Object.keys(updates).length) await updateAgentSupportCase({ caseId, updates });
          const detail = await getAgentSupportCase({ caseId });
          post(html, "AGENT_REPLY_SENT", { ...objectOf(detail), sentMessage: result.sentMessage, privateNote: result.privateNote, livekitSession: result.livekitSession }, requestId);
          return;
        }


        case "AGENT_UPDATE_CASE": {
          const caseId = caseIdOf(payload);
          const result = await updateAgentSupportCase({ caseId, updates: updatesOf(payload) });
          const detail = await getAgentSupportCase({ caseId });
          post(html, "AGENT_CASE_UPDATED", { ...objectOf(detail), result }, requestId);
          return;
        }


        case "AGENT_BULK_UPDATE": {
          const rows = Array.isArray(payload.cases) ? payload.cases : [];
          const results = [];
          for (const row of rows) {
            const casePayload = { ...objectOf(row), ...objectOf(row?.case), action: payload.action || row?.action };
            const updates = updatesOf(casePayload);
            if (!Object.keys(updates).length) continue;
            results.push(await updateAgentSupportCase({ caseId: caseIdOf(casePayload), updates }));
          }
          post(html, "AGENT_CASE_UPDATED", { results }, requestId);
          return;
        }


        case "AGENT_CREATE_CASE":
          post(html, "AGENT_CASE_CREATED", await createAgentSupportCase({ case: payload.case || payload }), requestId);
          return;


        case "AGENT_DELETE_CASE":
          post(html, "AGENT_CASE_UPDATED", await deleteAgentSupportCase({ caseId: caseIdOf(payload) }), requestId);
          return;


        case "AGENT_CALL_END":
        case "AGENT_SET_PRESENCE":
        case "AGENT_CLOSE_TAB":
        case "AGENT_NAVIGATE":
        case "AGENT_EXPORT_VIEW":
        case "AGENT_OPEN_ARTICLE":
        case "AGENT_INSERT_ARTICLE":
        case "AGENT_APPLY_MACRO":
        case "AGENT_ATTACHMENT_PICK":
          post(html, "AGENT_ACTION_ACK", { action: message.type }, requestId);
          return;


        case "AGENT_MERGE_CASES":
        case "AGENT_SAVE_SETTINGS":
          post(html, "AGENT_ERROR", { action: message.type, message: "This action has no canonical Support Center persistence contract yet." }, requestId);
          return;


        default:
          return;
      }
    } catch (error) {
      console.error(`[Customer Service Center] ${message.type || "Unknown action"} failed.`, error);
      post(html, "AGENT_ERROR", { action: String(message.type || ""), message: errorText(error) }, requestId);
    }
  });
});

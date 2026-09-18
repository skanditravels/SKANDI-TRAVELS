// /src/pages/HelpDesk.js
// Route: /riaintra/success-factors/helpdesk
// HTML Component: #helpDeskEmbed
// R-007.3 unified internal HelpDesk entry. Server decides Support vs GroupTalk routing.


import {
  getStaffHelpDeskBootstrap,
  getHelpDeskRoutingDecision,
  createStaffHelpDeskSupportCase,
  listStaffHelpDeskSupportCases,
  getStaffHelpDeskSupportCase,
  addStaffHelpDeskSupportMessage
} from "backend/SKANDI_CORE/customerSupport.web.js";
import {
  getGroupTalkBootstrap,
  getGroupTalkTickets,
  createGroupTalkTicket,
  replyToGroupTalkTicket
} from "backend/SKANDI_CORE/groupTalk.web.js";


const EMBED_ID = "#helpDeskEmbed";
const CHILD_SOURCE = "SKANDI_HELPDESK";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";


function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function arr(v) { return Array.isArray(v) ? v : []; }
function clean(v, n = 5000) { return String(v ?? "").trim().slice(0, n); }
function err(e) { return clean(e?.message || e || "HelpDesk action failed.", 500); }
function post(html, type, payload = {}, requestId = "") { html.postMessage({ source: PARENT_SOURCE, type, requestId, payload: { ...obj(payload), requestId } }); }


function normalizeSupport(item = {}) {
  return {
    receiver: "SUPPORT",
    id: clean(item.caseId || item.id, 160),
    ref: clean(item.caseRef || item.externalId || item.caseId, 160),
    subject: clean(item.subject || "Support request", 240),
    status: clean(item.status || "open", 40),
    priority: clean(item.priority || "normal", 40),
    updatedAt: item.updatedAt || item.createdAt || ""
  };
}


function normalizeGroupTalk(item = {}) {
  return {
    receiver: "GROUPTALK",
    id: clean(item.ticketNumber || item.ticketId || item.ticket_number || item.ticket_id || item.id, 160),
    ref: clean(item.ticketNumber || item.ticketId || item.ticket_number || item.ticket_id || item.ticketRef || item.reference || item.id, 160),
    subject: clean(item.subject || item.title || "Operational request", 240),
    status: clean(item.status || "open", 40),
    priority: clean(item.priority || "normal", 40),
    updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || "",
    raw: item
  };
}


$w.onReady(function () {
  let html;
  try { html = $w(EMBED_ID); } catch (error) { console.error(`[HelpDesk] Missing ${EMBED_ID}.`, error); return; }
  let supportBoot = null;
  let groupBoot = null;


  async function bootstrap() {
    const [support, group] = await Promise.all([getStaffHelpDeskBootstrap(), getGroupTalkBootstrap()]);
    supportBoot = support;
    groupBoot = group;
    return { support, group };
  }


  async function listThreads() {
    const groupId = clean(groupBoot?.activeGroupId || groupBoot?.active_group_id || arr(groupBoot?.groups)[0]?.id, 160);
    const [support, group] = await Promise.all([
      listStaffHelpDeskSupportCases(),
      getGroupTalkTickets({ ...(groupId ? { groupId } : {}), mineOnly: true })
    ]);
    const allGroupRows = arr(group?.tickets || group?.items || group?.data || group);
    const mySkId = clean(groupBoot?.profile?.skId || groupBoot?.profile?.sk_id, 80).toUpperCase();
    const groupRows = mySkId
      ? allGroupRows.filter(item => clean(item?.requesterSkId || item?.requester_sk_id, 80).toUpperCase() === mySkId)
      : allGroupRows;
    return [...arr(support?.cases).map(normalizeSupport), ...groupRows.map(normalizeGroupTalk)]
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }


  async function refresh(requestId = "") {
    if (!supportBoot || !groupBoot) await bootstrap();
    post(html, "HELPDESK_BOOTSTRAP", { support: supportBoot, groupTalk: groupBoot, threads: await listThreads() }, requestId);
  }


  html.onMessage(async event => {
    const message = obj(event?.data);
    if (message.source !== CHILD_SOURCE) return;
    const payload = { ...obj(message), ...obj(message.payload) };
    const requestId = clean(message.requestId || payload.requestId, 160);
    try {
      switch (message.type) {
        case "HELPDESK_READY":
        case "HELPDESK_REFRESH":
          await refresh(requestId);
          return;


        case "HELPDESK_CREATE_REQUEST": {
          const route = await getHelpDeskRoutingDecision({ operational: payload.operational, affectedAt: payload.affectedAt });
          if (route.target === "GROUPTALK") {
            if (!groupBoot) await bootstrap();
            const groupId = clean(payload.groupId || groupBoot?.activeGroupId || arr(groupBoot?.groups)[0]?.id, 160);
            if (!groupId) throw new Error("HELPDESK_GROUPTALK_GROUP_REQUIRED");
            const result = await createGroupTalkTicket({
              groupId,
              category: clean(payload.groupTalkCategory || payload.category || "operations", 120),
              subject: clean(payload.subject, 240),
              message: clean(payload.message, 12000),
              priority: clean(payload.priority || "normal", 40),
              routeRef: clean(payload.routeRef || payload.reference, 160),
              locationLabel: clean(payload.locationLabel, 200),
              caseMode: true,
              createdFrom: "RIAINTRA_HELPDESK"
            });
            post(html, "HELPDESK_REQUEST_CREATED", { receiver: "GROUPTALK", route, result }, requestId);
          } else {
            const result = await createStaffHelpDeskSupportCase({ input: { ...payload, sourceChannel: "INTERNAL_HELPDESK_FORM", entryMode: "form" } });
            post(html, "HELPDESK_REQUEST_CREATED", { receiver: "SUPPORT", route, result }, requestId);
          }
          await refresh(requestId);
          return;
        }


        case "HELPDESK_OPEN_THREAD": {
          if (payload.receiver === "GROUPTALK") {
            if (!groupBoot) await bootstrap();
            const groupId = clean(payload.groupId || groupBoot?.activeGroupId || arr(groupBoot?.groups)[0]?.id, 160);
            const result = await getGroupTalkTickets({ ticketId: clean(payload.id, 160), ...(groupId ? { groupId } : {}) });
            post(html, "HELPDESK_THREAD", { receiver: "GROUPTALK", thread: result?.ticket || null, messages: arr(result?.messages), groupId }, requestId);
          } else {
            const result = await getStaffHelpDeskSupportCase({ caseId: clean(payload.id, 160) });
            post(html, "HELPDESK_THREAD", result, requestId);
          }
          return;
        }


        case "HELPDESK_REPLY": {
          if (payload.receiver === "GROUPTALK") {
            const result = await replyToGroupTalkTicket({ ticketId: clean(payload.id, 160), body: clean(payload.content, 6000) });
            post(html, "HELPDESK_REPLY_SAVED", { receiver: "GROUPTALK", result }, requestId);
          } else {
            const result = await addStaffHelpDeskSupportMessage({ caseId: clean(payload.id, 160), content: clean(payload.content, 30000) });
            post(html, "HELPDESK_REPLY_SAVED", result, requestId);
          }
          await refresh(requestId);
          return;
        }
        default:
          return;
      }
    } catch (error) {
      console.error(`[HelpDesk] ${message.type || "action"} failed.`, error);
      post(html, "HELPDESK_ERROR", { action: clean(message.type, 120), message: err(error) }, requestId);
    }
  });
});

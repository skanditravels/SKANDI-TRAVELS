import {
  listAgentSupportCases,
  getAgentSupportCase,
  replyAgentSupportCase,
  updateAgentSupportCase
} from "src/backend/chatwootSupport.web";

import {
  insertMessageToPostgres,
  triggerPusherEvent
} from "src/backend/omnichannel.jsw";

const HTML_ID = "#customerServiceCenterEmbed";
const CHILD_SOURCE = "SKANDI_SUPPORT_AGENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const MAX_REPLY_LENGTH = 20000;
const ALLOWED_CASE_FIELDS = new Set([
  "status",
  "priority",
  "type",
  "group",
  "assigneeId",
  "followers",
  "ccs",
  "tags"
]);

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function childPayload(message) {
  return {
    ...asObject(message),
    ...asObject(message?.payload)
  };
}

function cleanCaseId(value) {
  const caseId = String(value ?? "").trim();

  if (!caseId || caseId.length > 160) {
    throw new Error("A valid case ID is required.");
  }

  return caseId;
}

function cleanReply(value) {
  const content = String(value ?? "").trim();

  if (!content) {
    throw new Error("Reply content is required.");
  }

  if (content.length > MAX_REPLY_LENGTH) {
    throw new Error(
      `Reply content cannot exceed ${MAX_REPLY_LENGTH} characters.`
    );
  }

  return content;
}

function errorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Customer service action failed.";
}

function postToEmbed(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId,
    payload: {
      ...asObject(payload),
      requestId
    }
  });
}

function caseIdFrom(payload) {
  return cleanCaseId(
    payload.caseId ??
    payload.case_id ??
    payload.ticketId ??
    payload.ticket_id ??
    payload.id
  );
}

function filtersFrom(payload) {
  const filters = {
    ...asObject(payload.filters)
  };

  if (payload.queue) {
    filters.queue = String(payload.queue);
  }

  if (payload.view) {
    filters.view = String(payload.view);
  }

  if (payload.search) {
    filters.search = String(payload.search);
  }

  return filters;
}

function minimalCaseUpdates(payload) {
  const supplied = asObject(payload.updates);
  const updates = {};

  for (const [key, value] of Object.entries(supplied)) {
    if (ALLOWED_CASE_FIELDS.has(key)) {
      updates[key] = value;
    }
  }

  if (
    payload.action === "FIELD_CHANGE" &&
    ALLOWED_CASE_FIELDS.has(payload.field)
  ) {
    updates[payload.field] = payload.value;
  }

  if (payload.action === "FOLLOWER_CHANGE") {
    updates.followers = Array.isArray(payload.case?.followers)
      ? payload.case.followers
      : [];
  }

  if (payload.action === "INTERNAL_NOTE") {
    updates.action = "INTERNAL_NOTE";
    updates.internalNote = {
      content: cleanReply(payload.message?.body),
      createdAt: payload.message?.at || new Date().toISOString()
    };

    if (payload.submitAs) {
      updates.status = String(payload.submitAs);
    }
  }

  if (payload.action === "TALK_CALL") {
    updates.action = "TALK_CALL";
    updates.call = {
      message: asObject(payload.message),
      outcome: String(payload.outcome || ""),
      duration: Number(payload.duration) || 0
    };
  }

  return updates;
}

async function mirrorAndBroadcastReply(
  payload,
  content,
  replyResult,
  requestId
) {
  try {
    const databaseResult = await insertMessageToPostgres({
      caseId: caseIdFrom(payload),
      text: content,
      type: "agent",
      channel: String(payload.channel || ""),
      requestId,
      externalMessageId:
        replyResult?.messageId ??
        replyResult?.id ??
        null
    });

    if (!databaseResult?.success) {
      return;
    }

    await triggerPusherEvent(
      `private-case-${caseIdFrom(payload)}`,
      "new-message",
      {
        sender: databaseResult.senderName || "SKANDI Support",
        text: content,
        type: "agent",
        messageId:
          databaseResult.messageId ??
          replyResult?.messageId ??
          replyResult?.id ??
          null
      }
    );
  } catch (error) {
    console.error(
      "[Customer Service Center] Realtime mirror failed.",
      error
    );
  }
}

async function listCases(html, payload, requestId) {
  const result = await listAgentSupportCases(
    filtersFrom(payload)
  );

  postToEmbed(
    html,
    "AGENT_CASE_LIST",
    { result },
    requestId
  );
}

async function openCase(html, payload, requestId) {
  const result = await getAgentSupportCase({
    caseId: caseIdFrom(payload)
  });

  postToEmbed(
    html,
    "AGENT_CASE_DETAIL",
    { case: result },
    requestId
  );
}

async function replyToCase(html, payload, requestId) {
  const caseId = caseIdFrom(payload);
  const content = cleanReply(payload.content);

  const replyResult = await replyAgentSupportCase({
    caseId,
    content
  });

  let updateResult = null;
  const updates = minimalCaseUpdates(payload);

  if (Object.keys(updates).length) {
    updateResult = await updateAgentSupportCase({
      caseId,
      updates
    });
  }

  await mirrorAndBroadcastReply(
    payload,
    content,
    replyResult,
    requestId
  );

  postToEmbed(
    html,
    "AGENT_REPLY_SENT",
    {
      caseId,
      result: replyResult,
      updateResult
    },
    requestId
  );
}

async function updateCase(html, payload, requestId) {
  const caseId = caseIdFrom(payload);
  const updates = minimalCaseUpdates(payload);

  if (!Object.keys(updates).length) {
    throw new Error(
      "No supported case updates were provided."
    );
  }

  const result = await updateAgentSupportCase({
    caseId,
    updates
  });

  postToEmbed(
    html,
    "AGENT_CASE_UPDATED",
    {
      caseId,
      result
    },
    requestId
  );
}

async function bulkUpdateCases(html, payload, requestId) {
  const cases = Array.isArray(payload.cases)
    ? payload.cases
    : [];

  const results = [];

  for (const item of cases) {
    const casePayload = {
      ...asObject(item),
      ...asObject(item.case),
      action: payload.action || item.action
    };

    const caseId = caseIdFrom(casePayload);
    const updates = {};

    for (const field of ALLOWED_CASE_FIELDS) {
      if (casePayload[field] !== undefined) {
        updates[field] = casePayload[field];
      }
    }

    if (!Object.keys(updates).length) {
      continue;
    }

    results.push(
      await updateAgentSupportCase({
        caseId,
        updates
      })
    );
  }

  postToEmbed(
    html,
    "AGENT_CASE_UPDATED",
    { results },
    requestId
  );
}

$w.onReady(function () {
  let html;

  try {
    html = $w(HTML_ID);
  } catch (error) {
    console.error(
      `[Customer Service Center] Missing HTML component ${HTML_ID}.`,
      error
    );

    return;
  }

  html.onMessage(async event => {
    const message = asObject(event.data);

    if (message.source !== CHILD_SOURCE) {
      return;
    }

    const payload = childPayload(message);
    const requestId = String(
      message.requestId ||
      payload.requestId ||
      ""
    );

    try {
      switch (message.type) {
        case "AGENT_READY":
        case "AGENT_REQUEST_BOOTSTRAP":
        case "AGENT_LIST_CASES":
        case "AGENT_REFRESH_CASES":
          await listCases(
            html,
            payload,
            requestId
          );
          break;

        case "AGENT_OPEN_CASE":
          await openCase(
            html,
            payload,
            requestId
          );
          break;

        case "AGENT_REPLY":
          await replyToCase(
            html,
            payload,
            requestId
          );
          break;

        case "AGENT_UPDATE_CASE":
          await updateCase(
            html,
            payload,
            requestId
          );
          break;

        case "AGENT_BULK_UPDATE":
          await bulkUpdateCases(
            html,
            payload,
            requestId
          );
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(
        `[Customer Service Center] ${message.type || "Unknown action"} failed.`,
        error
      );

      postToEmbed(
        html,
        "AGENT_ERROR",
        {
          action: String(message.type || ""),
          message: errorMessage(error)
        },
        requestId
      );
    }
  });
});

export function mapSupportCase(row = {}) {
  return {
    id: row.id,
    caseId: row.case_id,
    memberId: row.member_id,
    email: row.email || "",
    subject: row.subject || "",
    category: row.category || "General",
    priority: row.priority || "Normal",
    status: row.status || "Open",
    source: row.source || "",
    assignedAgentId: row.assigned_agent_id || "",
    assignedAgentName: row.assigned_agent_name || "",
    chatwootContactId: row.chatwoot_contact_id || "",
    chatwootConversationId: row.chatwoot_conversation_id || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    payload: row.payload || {}
  };
}

export function mapSupportMessage(row = {}) {
  return {
    id: row.id,
    messageId: row.message_id,
    caseId: row.case_id,
    memberId: row.member_id,
    senderType: row.sender_type || "",
    senderName: row.sender_name || "",
    message: row.message || "",
    channel: row.channel || "",
    createdAt: row.created_at || "",
    payload: row.payload || {}
  };
}

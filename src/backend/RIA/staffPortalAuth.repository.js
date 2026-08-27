import { restRequest } from 'backend/RIA/supabaseServer.js';

const AGENT_FIELDS = [
  "id",
  "member_id",
  "wix_member_id",
  "email",
  "corporate_email_address",
  "sk_id",
  "first_name",
  "last_name",
  "preferred_name",
  "display_name",
  "job_title",
  "department",
  "station",
  "base",
  "active",
  "status",
  "employment_status",
  "portal_access",
  "authorized",
  "can_access_payroll",
  "can_access_grouptalk",
  "can_manage",
  "payload"
].join(",");

const BLOCKED_STATUSES = new Set(['blocked', 'inactive', 'suspended', 'terminated']);

function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function findAgentBySkId(skId) {
  const normalized = normalize(skId).toUpperCase();
  if (!normalizedEmail) {
  return null;
}

let byEmail =
  first(
    await restRequest({
      table: "agent_users",
      query: {
        select: AGENT_FIELDS,
        email: `ilike.${normalizedEmail}`,
        limit: 1
      }
    })
  );

if (byEmail) {
  return byEmail;
}

return first(
  await restRequest({
    table: "agent_users",
    query: {
      select: AGENT_FIELDS,
      corporate_email_address:
        `ilike.${normalizedEmail}`,
      limit: 1
    }
  })
);
}

export async function findAgentByMemberOrEmail({ memberId, email }) {
  const normalizedMemberId = normalize(memberId);
  const normalizedEmail = normalize(email).toLowerCase();

  if (normalizedMemberId) {
    const byMember = first(await restRequest({
      table: 'agent_users',
      query: {
        select: AGENT_FIELDS,
        or: `(member_id.eq.${normalizedMemberId},wix_member_id.eq.${normalizedMemberId})`,
        limit: 1,
      },
    }));
    if (byMember) return byMember;
  }

  if (!normalizedEmail) return null;
  return first(await restRequest({
    table: 'agent_users',
    query: { select: AGENT_FIELDS, email: `ilike.${normalizedEmail}`, limit: 1 },
  }));
}

export async function updateAgentLogin(agentId) {
  await restRequest({
    table: 'agent_users',
    method: 'PATCH',
    query: { id: `eq.${agentId}` },
    body: { last_login_at: new Date().toISOString() },
    prefer: 'return=minimal',
  });
}

export async function insertLoginAudit({ agent = null, email = null, eventType, success, errorCode = null }) {
  await restRequest({
    table: 'staff_login_audit',
    method: 'POST',
    body: {
      agent_user_id: agent?.id || null,
      sk_id: agent?.sk_id || null,
      email: email || agent?.email || null,
      event_type: eventType,
      success: Boolean(success),
      error_message: errorCode,
    },
    prefer: 'return=minimal',
  });
}

export function isAgentAuthorized(agent) {
  if (!agent) return false;

  const status = normalize(agent.status).toLowerCase();
  const employmentStatus = normalize(agent.employment_status).toLowerCase();

  return agent.active === true
    && agent.portal_access === true
    && agent.authorized === true
    && employmentStatus === 'active'
    && !BLOCKED_STATUSES.has(status);
}

export function publicAgent(agent) {
  return {
    id: agent.id,
    skId: agent.sk_id,
    displayName: agent.preferred_name || agent.display_name || [agent.first_name, agent.last_name].filter(Boolean).join(' '),
    role: agent.job_title || null,
    department: agent.department || null,
    station: agent.station || agent.base || null,
    permissions: {
      payroll: agent.can_access_payroll === true,
      groupTalk: agent.can_access_grouptalk === true,
      manage: agent.can_manage === true,
    },
  };
}

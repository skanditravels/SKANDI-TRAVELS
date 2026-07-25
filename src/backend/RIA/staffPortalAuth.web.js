import { Permissions, webMethod } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import {
  findAgentByMemberOrEmail,
  findAgentBySkId,
  insertLoginAudit,
  isAgentAuthorized,
  publicAgent,
  updateAgentLogin,
} from './staffPortalAuth.repository.js';

function normalizeSkId(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

async function getCurrentIdentity() {
  try {
    const member = await currentMember.getMember({ fieldsets: ['FULL'] });
    return {
      memberId: member._id,
      email: (member.loginEmail || member.contactDetails?.emails?.[0] || '').trim().toLowerCase(),
    };
  } catch (_) {
    return null;
  }
}

async function createSession({ requestedSkId = '', eventType }) {
  const identity = await getCurrentIdentity();
  if (!identity?.memberId) {
    return { authorized: false, code: 'WIX_MEMBER_SESSION_REQUIRED' };
  }

  const byIdentity = await findAgentByMemberOrEmail(identity);
  const bySkId = requestedSkId ? await findAgentBySkId(requestedSkId) : null;
  const agent = byIdentity || bySkId;

  if (!agent) {
    await insertLoginAudit({
      email: identity.email || null,
      eventType,
      success: false,
      errorCode: 'AGENT_NOT_FOUND',
    });
    return { authorized: false, code: 'AGENT_NOT_FOUND' };
  }

  // A typed SK-ID must agree with the Wix member that is signed in.
  if (requestedSkId && normalizeSkId(agent.sk_id) !== requestedSkId) {
    await insertLoginAudit({ agent, email: identity.email || null, eventType, success: false, errorCode: 'SK_ID_MISMATCH' });
    return { authorized: false, code: 'SK_ID_MISMATCH' };
  }

  if (!isAgentAuthorized(agent)) {
    await insertLoginAudit({ agent, email: identity.email || null, eventType, success: false, errorCode: 'AGENT_NOT_AUTHORIZED' });
    return { authorized: false, code: 'AGENT_NOT_AUTHORIZED' };
  }

  await updateAgentLogin(agent.id);
  await insertLoginAudit({ agent, email: identity.email || null, eventType, success: true });

  return {
    authorized: true,
    agent: publicAgent(agent),
    checkedAt: new Date().toISOString(),
  };
}

export const getStaffPortalSession = webMethod(
  Permissions.SiteMember,
  async () => createSession({ eventType: 'SESSION_CHECK' }),
);

export const loginStaffWithSkId = webMethod(
  Permissions.SiteMember,
  async ({ skId } = {}) => {
    const requestedSkId = normalizeSkId(skId);
    if (!requestedSkId || requestedSkId.length > 32) {
      return { authorized: false, code: 'SK_ID_INVALID' };
    }
    return createSession({ requestedSkId, eventType: 'STAFF_LOGIN' });
  },
);
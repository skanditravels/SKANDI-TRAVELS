// backend/RIA/staffIntranet.web.js
import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { restRequest } from "backend/RIA/supabaseServer.js";

const AGENT_SELECT = [
  "id","agent_id","wix_member_id","member_id","email","corporate_email_address",
  "sk_id","first_name","last_name","preferred_name","display_name","role",
  "position","job_title","department","station","base","active","authorized",
  "portal_access","employment_status","status","payload","created_at","updated_at"
].join(",");

function clean(v, max = 500) {
  return String(v ?? "").trim().slice(0, max);
}
function lower(v) { return clean(v, 320).toLowerCase(); }
function first(rows) { return Array.isArray(rows) && rows.length ? rows[0] : null; }

function memberEmail(member = {}) {
  const emails = member?.contactDetails?.emails;
  return lower(
    member.loginEmail ||
    (Array.isArray(emails) ? emails[0] : emails) ||
    member?.profile?.email ||
    ""
  );
}

async function identity() {
  let member = null;
  try {
    member = await currentMember.getMember({ fieldsets: ["FULL"] });
  } catch (_) {}

  return {
    member,
    memberId: clean(member?._id || member?.id, 160),
    email: memberEmail(member || {})
  };
}

async function findAgent(id) {
  if (id.memberId) {
    let row = first(await restRequest({
      table: "agent_users",
      query: { select: AGENT_SELECT, wix_member_id: `eq.${id.memberId}`, limit: 1 }
    }));
    if (row) return row;

    row = first(await restRequest({
      table: "agent_users",
      query: { select: AGENT_SELECT, member_id: `eq.${id.memberId}`, limit: 1 }
    }));
    if (row) return row;
  }

  if (id.email) {
    let row = first(await restRequest({
      table: "agent_users",
      query: { select: AGENT_SELECT, corporate_email_address: `ilike.${id.email}`, limit: 1 }
    }));
    if (row) return row;

    row = first(await restRequest({
      table: "agent_users",
      query: { select: AGENT_SELECT, email: `ilike.${id.email}`, limit: 1 }
    }));
    if (row) return row;
  }

  return null;
}

function assertStaff(agent) {
  if (!agent) throw new Error("STAFF_NOT_FOUND");
  if (agent.active !== true) throw new Error("STAFF_INACTIVE");
  if (agent.authorized !== true || agent.portal_access !== true) {
    throw new Error("STAFF_ACCESS_DENIED");
  }
}

function displayName(agent = {}) {
  return clean(
    agent.preferred_name ||
    agent.display_name ||
    [agent.first_name, agent.last_name].filter(Boolean).join(" ") ||
    agent.email ||
    agent.sk_id ||
    "Staff",
    180
  );
}

function publicProfile(agent = {}) {
  const payload =
    agent.payload && typeof agent.payload === "object" && !Array.isArray(agent.payload)
      ? agent.payload
      : {};

  return {
    id: agent.id,
    agentId: agent.agent_id || agent.id,
    skId: agent.sk_id || "",
    firstName: agent.first_name || "",
    lastName: agent.last_name || "",
    preferredName: agent.preferred_name || "",
    displayName: displayName(agent),
    name: displayName(agent),
    email: agent.corporate_email_address || agent.email || "",
    role: agent.role || agent.position || agent.job_title || "",
    position: agent.position || agent.job_title || agent.role || "",
    jobTitle: agent.job_title || agent.position || "",
    department: agent.department || "",
    station: agent.station || agent.base || "",
    base: agent.base || agent.station || "",
    employmentStatus: agent.employment_status || "",
    phone: payload.phone || payload.personalPhoneMobile || "",
    homeAddressStreet: payload.homeAddressStreet || "",
    homeAddressCity: payload.homeAddressCity || "",
    homeAddressState: payload.homeAddressState || "",
    homeAddressPostalCode: payload.homeAddressPostalCode || "",
    homeAddressCountry: payload.homeAddressCountry || "",
    emergencyContactName: payload.emergencyContactName || "",
    emergencyContactRelationship: payload.emergencyContactRelationship || "",
    emergencyContactPhone: payload.emergencyContactPhone || ""
  };
}

async function requireStaff() {
  const id = await identity();
  if (!id.memberId && !id.email) throw new Error("WIX_MEMBER_SESSION_REQUIRED");

  const agent = await findAgent(id);
  assertStaff(agent);
  return { identity: id, agent };
}

export const getIntranetHomeData = webMethod(
  Permissions.SiteMember,
  async () => {
    const { agent } = await requireStaff();

    const rows = await restRequest({
      table: "agent_users",
      query: {
        select: "id",
        active: "eq.true",
        authorized: "eq.true",
        limit: 1000
      }
    }).catch(() => []);

    return {
      ok: true,
      profile: publicProfile(agent),
      news: [],
      stats: {
        activeStaff: Array.isArray(rows) ? rows.length : 0,
        newsCount: 0
      },
      syncedAt: new Date().toISOString()
    };
  }
);

export const updateMyEmployeeProfile = webMethod(
  Permissions.SiteMember,
  async (profile = {}) => {
    const { agent } = await requireStaff();

    const oldPayload =
      agent.payload && typeof agent.payload === "object" && !Array.isArray(agent.payload)
        ? agent.payload
        : {};

    const safe = {
      preferredName: clean(profile.preferredName, 80),
      phone: clean(profile.phone, 60),
      personalPhoneMobile: clean(profile.phone, 60),
      homeAddressStreet: clean(profile.homeAddressStreet, 160),
      homeAddressCity: clean(profile.homeAddressCity, 80),
      homeAddressState: clean(profile.homeAddressState, 80),
      homeAddressPostalCode: clean(profile.homeAddressPostalCode, 40),
      homeAddressCountry: clean(profile.homeAddressCountry, 80),
      emergencyContactName: clean(profile.emergencyContactName, 120),
      emergencyContactRelationship: clean(profile.emergencyContactRelationship, 80),
      emergencyContactPhone: clean(profile.emergencyContactPhone, 60)
    };

    const rows = await restRequest({
      table: "agent_users",
      method: "PATCH",
      query: { id: `eq.${agent.id}` },
      body: {
        preferred_name: safe.preferredName || agent.preferred_name || null,
        payload: { ...oldPayload, ...safe },
        updated_at: new Date().toISOString()
      }
    });

    const saved = first(rows) || { ...agent, preferred_name: safe.preferredName, payload: { ...oldPayload, ...safe } };
    return { ok: true, profile: publicProfile(saved) };
  }
);

export const searchColleagues = webMethod(
  Permissions.SiteMember,
  async (query = "") => {
    await requireStaff();

    const rows = await restRequest({
      table: "agent_users",
      query: {
        select: AGENT_SELECT,
        active: "eq.true",
        authorized: "eq.true",
        order: "last_name.asc",
        limit: 1000
      }
    });

    const q = lower(query);
    const colleagues = (Array.isArray(rows) ? rows : [])
      .filter((row) => {
        if (!q) return true;
        return [
          row.sk_id,row.first_name,row.last_name,row.preferred_name,row.display_name,
          row.role,row.position,row.job_title,row.department,row.station,row.base,
          row.email,row.corporate_email_address
        ].join(" ").toLowerCase().includes(q);
      })
      .slice(0, 100)
      .map(publicProfile);

    return { ok: true, colleagues, items: colleagues };
  }
);

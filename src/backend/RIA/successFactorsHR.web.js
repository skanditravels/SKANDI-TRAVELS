import { webMethod, Permissions } from "wix-web-module";

import {
  requireInternalAgent,
  text
} from "./internalAccess.js";

import {
  listStaff,
  saveStaff,
  saveStaffAccess,
  setStaffActive,
  generateSkId,
  lookupAndLinkWixMember,
  createLinkedWixMember,
  syncLinkedWixMember,
  sendLinkedWixSetPasswordEmail,
  approveLinkedWixMember,
  blockLinkedWixMember,
  printStaffBadge,
  getStaffHrReports
} from "./staffHR.web.js";

const SUCCESSFACTORS_HR_ADMIN_ROLES = Object.freeze([
  "hr",
  "human resources",
  "people operations",
  "people & culture",
  "hr administrator",
  "hr admin",
  "hr manager",
  "hr director",
  "head of hr",
  "chief people",
  "people director",
  "founder",
  "ceo",
  "owner",
  "super admin",
  "administrator",
  "admin"
]);

const PERMISSION_CATALOG = Object.freeze([
  { key: "altea", label: "ALTEA" },
  { key: "mail", label: "Mail" },
  { key: "grouptalk", label: "GroupTalk" },
  { key: "uniform", label: "Uniform" },
  { key: "myroster", label: "MyRoster" },
  { key: "payroll", label: "Payroll" },
  { key: "inventory-control", label: "Inventory" },
  { key: "hr", label: "HR" },
  { key: "policies", label: "Policies" },
  { key: "badge-generator", label: "Badge" },
  { key: "help-data", label: "Help Data" },
  { key: "recruiting", label: "Recruiting" }
]);

function now() {
  return new Date().toISOString();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item ?? "").trim()).filter(Boolean);
  }
  if (!value) return [];
  return String(value)
    .split(/[;,|]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function organizationRows(staff = []) {
  return (Array.isArray(staff) ? staff : []).map(person => ({
    id: person.id || person._id || "",
    employeeId: person.id || person._id || "",
    skId: person.skId || person.skID || "",
    employee: person.displayName || person.fullName || person.name || "",
    jobTitle: person.jobTitle || person.position || person.role || "",
    department: person.department || person.assignedDepartment || "",
    station: person.station || person.base || person.assignedBase || "",
    manager: person.managerName || "",
    employmentStatus: person.employmentStatus || person.status || "",
    active: person.active === true
  }));
}

async function requireSuccessFactorsHrAdmin() {
  return requireInternalAgent({
    roles: SUCCESSFACTORS_HR_ADMIN_ROLES
  });
}

function denied(error) {
  const code = text(error?.message || error, 160) || "STAFF_ROLE_REQUIRED";
  if ([
    "STAFF_LOGIN_REQUIRED",
    "STAFF_ACCESS_DENIED",
    "STAFF_ROLE_REQUIRED",
    "STAFF_CAPABILITY_REQUIRED"
  ].includes(code)) {
    return {
      ok: false,
      authorized: false,
      code,
      staff: [],
      items: [],
      archive: [],
      organization: [],
      reports: {},
      access: {
        permissionCatalog: PERMISSION_CATALOG,
        portalResults: []
      },
      total: 0,
      syncedAt: now()
    };
  }
  throw error;
}

export const getSuccessFactorsHrBootstrap = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    try {
      const { profile } = await requireSuccessFactorsHrAdmin();
      const [staffResult, reportResult] = await Promise.all([
        listStaff(input || {}),
        getStaffHrReports({})
      ]);

      const staff = Array.isArray(staffResult?.staff)
        ? staffResult.staff
        : Array.isArray(staffResult?.items)
          ? staffResult.items
          : [];

      return {
        ok: true,
        authorized: true,
        profile,
        staff,
        items: staff,
        activeStaff: Array.isArray(staffResult?.activeStaff) ? staffResult.activeStaff : staff.filter(item => item.active === true),
        archive: Array.isArray(staffResult?.archive) ? staffResult.archive : staff.filter(item => item.active !== true),

        // The shared staff backend returns an organization summary object.
        // SuccessFactors expects actual rows for its Organization table, so
        // derive those rows from the exact same canonical staff records.
        organization: organizationRows(staff),
        organizationSummary: staffResult?.organization || reportResult?.organization || {},

        reports: reportResult?.reports || staffResult?.reports || {},
        summary: reportResult?.summary || staffResult?.reports || {},
        badgeControl: Array.isArray(reportResult?.badgeControl) ? reportResult.badgeControl : [],
        crewcontrol: Array.isArray(reportResult?.crewcontrol) ? reportResult.crewcontrol : [],

        access: {
          permissionCatalog: PERMISSION_CATALOG,
          portalResults: staff.map(person => ({
            employeeId: person.id || person._id || "",
            skId: person.skId || "",
            employee: person.displayName || person.fullName || person.name || "",
            portalAccess: person.portalAccess === true,
            authorized: person.authorized === true,
            wixLinked: Boolean(person.wixMemberId || person.memberId),
            canManage: person.canManage === true,
            canAccessPayroll: person.canAccessPayroll === true,
            canAccessGroupTalk: person.canAccessGroupTalk === true
          }))
        },

        selectedId: text(input?.selectedId || input?.filters?.selectedId, 160),
        total: staff.length,
        syncedAt: staffResult?.syncedAt || reportResult?.generatedAt || now(),
        source: "SUPABASE_AGENT_USERS"
      };
    } catch (error) {
      return denied(error);
    }
  }
);

export const saveSuccessFactorsHrStaff = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return saveStaff(input || {});
  }
);

export const archiveSuccessFactorsHrStaff = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return setStaffActive({
      ...(input || {}),
      active: false
    });
  }
);

export const reactivateSuccessFactorsHrStaff = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return setStaffActive({
      ...(input || {}),
      active: true
    });
  }
);

export const generateSuccessFactorsSkId = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return generateSkId(input || {});
  }
);

export const saveSuccessFactorsHrAccess = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();

    const selected = new Set(
      normalizeList(input?.permissions)
        .map(value => value.toLowerCase())
    );

    const permissions = Object.fromEntries(
      PERMISSION_CATALOG.map(({ key }) => [key, selected.has(key.toLowerCase())])
    );

    return saveStaffAccess({
      staffId: input?.employeeId || input?.staffId || input?.id || "",
      permissions,
      canAccessPayroll: permissions.payroll === true,
      canAccessGroupTalk: permissions.grouptalk === true
    });
  }
);

export const lookupSuccessFactorsWixMember = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return lookupAndLinkWixMember(input || {});
  }
);

export const createSuccessFactorsWixMember = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return createLinkedWixMember(input || {});
  }
);

export const syncSuccessFactorsWixMember = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return syncLinkedWixMember(input || {});
  }
);

export const sendSuccessFactorsWixPasswordEmail = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return sendLinkedWixSetPasswordEmail(input || {});
  }
);

export const approveSuccessFactorsWixMember = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return approveLinkedWixMember(input || {});
  }
);

export const blockSuccessFactorsWixMember = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return blockLinkedWixMember(input || {});
  }
);

export const printSuccessFactorsStaffBadge = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    const employeeId = input?.employeeId || input?.staffId || input?.id || "";
    return printStaffBadge(employeeId, {
      badgePhoto: input?.badge?.badgePhoto || input?.badge?.badgePhotoUrl || input?.badgePhoto || "",
      badgeStatus: input?.badge?.badgeStatus || input?.badgeStatus || ""
    });
  }
);

export const getSuccessFactorsHrReports = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireSuccessFactorsHrAdmin();
    return getStaffHrReports(input || {});
  }
);

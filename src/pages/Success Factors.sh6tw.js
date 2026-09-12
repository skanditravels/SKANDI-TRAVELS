// SKANDI SuccessFactors V9 FINAL — matched Wix page controller
// HTML Component: #staffHrEmbed
// Version: 2026.09.10.9
//
// V9 rules:
// - Listener first + SUCCESSFACTORS_HOST_READY recovery handshake.
// - masterPage.js owns global navigation/chrome. This page never calls wixLocation.
// - Organization data is live-only through backend/RIA/orgStructure.web.js.
// - Core organization assignment is atomic in Postgres through the V9 RPC.
// - HR, Recruiting, Payroll, Crewcontrol and Badge event contracts remain supported.

import { authentication } from "wix-members-frontend";

import { getStaffPortalSession } from "backend/SKANDI_CORE/staffPortalAuth.web";
import { getIntranetHomeData } from "backend/RIA/staffIntranet.web";
import {
  getMyStaffProfile,
  updateMyStaffProfile,
  searchStaffDirectory
} from "backend/RIA/staffProfile.web";

import {
  getOrgStructureBootstrap,
  provisionStaffOrganization
} from "backend/RIA/orgStructure.web";

import {
  getSuccessFactorsHrBootstrap,
  saveSuccessFactorsHrStaff,
  archiveSuccessFactorsHrStaff,
  reactivateSuccessFactorsHrStaff,
  generateSuccessFactorsSkId,
  saveSuccessFactorsHrAccess,
  lookupSuccessFactorsWixMember,
  createSuccessFactorsWixMember,
  syncSuccessFactorsWixMember,
  sendSuccessFactorsWixPasswordEmail,
  approveSuccessFactorsWixMember,
  blockSuccessFactorsWixMember,
  printSuccessFactorsStaffBadge,
  getSuccessFactorsHrReports
} from "backend/RIA/successFactorsHR.web";

import {
  savePayrollProfile,
  createPayrollPeriod,
  calculatePayrollRun,
  finalizePayrollRun
} from "backend/RIA/staffPayroll.web";

import {
  getCareersBootstrap,
  saveCandidate,
  saveJobPosting,
  publishJobPosting,
  moveCandidateStage,
  detectHistoryGaps,
  createHistorySegment,
  resolveHistoryGap,
  startSraVetting,
  verifyDocument,
  verifyHistorySegment,
  createDocumentUploadRequest,
  createDocumentPacketForCandidate,
  resendDocumentPacket,
  saveCareerInterview,
  saveCareerTrainingRecord,
  saveCareerOnboardingTask,
  scheduleCareerMaintenance,
  saveSettings,
  testCareerIntegrations,
  exportAuditPackage
} from "backend/careersControl.web";

import { dispatchQueuedCareerEmails } from "backend/outboundEmailDispatcher.web";
import { syncCareerMailboxReplies } from "backend/inboundCareerMailboxSync.web";

const EMBED_ID = "#staffHrEmbed";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const PROTOCOL_VERSION = "2026.09.10.successfactors-v9.9";
const CHILD_SOURCES = new Set([
  "SKANDI_STAFF_DASHBOARD_INTRANET",
  "SKANDI_HR_STAFF",
  "SKANDI_CAREERS_CONTROL"
]);

let html = null;
let bootstrapPromise = null;
let currentSuccessFactorsProfile = null;
let lastHrBootstrap = null;

function clean(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}
function arr(value) {
  return Array.isArray(value) ? value : [];
}
function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function first(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "") ?? "";
}
function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function isSafePath(value) {
  const path = clean(value, 1800);
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !/^(javascript|data|vbscript):/i.test(path));
}

function post(type, payload = {}) {
  if (!html || typeof html.postMessage !== "function") return;
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function requestMasterNavigation(path) {
  const value = clean(path, 1800);
  if (!isSafePath(value)) throw new Error("INVALID_INTERNAL_DESTINATION");
  post("MASTER_NAVIGATE", { path: value });
}

function cleanError(error) {
  const raw = clean(error?.message || error, 300);
  const map = {
    STAFF_PROFILE_AUTH_REQUIRED: "Your staff session has expired. Sign in again.",
    STAFF_AUTH_REQUIRED: "Your staff session has expired. Sign in again.",
    STAFF_PROFILE_NOT_FOUND: "Your SuccessFactors employee profile could not be found.",
    STAFF_PROFILE_INACTIVE: "Your employee profile is inactive.",
    STAFF_PROFILE_NOT_AUTHORIZED: "Your employee profile is not authorized for RIAINTRA.",
    STAFF_PROFILE_PORTAL_DISABLED: "Your employee profile does not have portal access.",
    STAFF_ACCESS_DENIED: "Your current staff account is not authorized for this action.",
    WIX_MEMBER_LINK_MISMATCH: "Your Wix member is linked to a different employee profile.",
    INTERNAL_ACCESS_DENIED: "Your current employee role does not include this SuccessFactors module.",
    INTERNAL_ACCESS_AUTH_REQUIRED: "Your staff session has expired. Sign in again.",
    HR_ORG_ADMIN_REQUIRED: "HR organization administration permission is required.",
    EMPLOYEE_ID_REQUIRED: "Select an employee before saving the organization assignment.",
    EMPLOYEE_NOT_FOUND: "The selected employee record could not be found.",
    EMPLOYMENT_COUNTRY_REQUIRED: "Country of Employment is required.",
    EMPLOYMENT_COUNTRY_NOT_ENABLED: "Employment is not enabled for the selected country.",
    BASE_COUNTRY_MISMATCH: "The selected work location does not belong to the selected employment country.",
    JOB_ROLE_REQUIRED: "Select a Position / Job Title.",
    JOB_ROLE_INACTIVE_OR_UNKNOWN: "The selected Position / Job Title is not active.",
    JOB_ROLE_DEPARTMENT_INVALID: "The selected position has no valid active department.",
    BASE_INACTIVE_OR_UNKNOWN: "The selected Base / Work Location is not active.",
    ROLE_BASE_NOT_ALLOWED: "The selected Base / Work Location is not valid for this position.",
    ACCESS_ROLE_MAPPING_INVALID: "The selected position has no valid access-role mapping.",
    PERMISSION_PRESET_MAPPING_INVALID: "The selected position has no valid permission preset.",
    RESTRICTED_ACCESS_REQUIRES_MANUAL_ADMINISTRATION: "Restricted owner or break-glass access cannot be provisioned from a job title.",
    MANAGER_ID_INVALID: "The selected manager identifier is invalid.",
    MANAGER_NOT_ELIGIBLE_FOR_ROLE: "The selected manager does not hold the required reporting role.",
    INVALID_INTERNAL_DESTINATION: "The requested internal destination is invalid."
  };
  return map[raw] || (raw && raw.length <= 240 ? raw : "") || "SuccessFactors could not complete the action.";
}

function permissionTokens(profile = {}) {
  const values = [];
  const push = value => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled === true || enabled === "true" || enabled === 1) values.push(key);
      });
      return;
    }
    String(value).split(/[;,|]/).forEach(item => values.push(item));
  };
  [
    profile.permissions,
    profile.permissionGroups,
    profile.allowedApps,
    profile.entitlements,
    profile.accessGroups,
    profile.roles,
    profile.access,
    profile.portalAccess,
    profile.role,
    profile.position,
    profile.jobTitle,
    profile.systemRole
  ].forEach(push);
  return new Set(values.map(value => clean(value, 120).toLowerCase()).filter(Boolean));
}

function successFactorsAccess(profile = {}) {
  const roleText = clean(first(profile.role, profile.position, profile.jobTitle, profile.systemRole), 300).toLowerCase();
  const tokens = permissionTokens(profile);
  const has = (...keys) => keys.some(key => {
    const value = String(key).toLowerCase();
    return tokens.has(value) || tokens.has(value.replace(/ /g, "_")) || tokens.has(value.replace(/ /g, "-"));
  });

  // This is presentation/request gating only. Every privileged backend method
  // independently validates the authenticated employee again.
  const recruitingRole = /(recruit|talent acquisition|talent partner|candidate experience|staffing)/i.test(roleText);
  const payrollRole = /(payroll|compensation)/i.test(roleText);
  const badgeRole = /(badge|credential|identity admin)/i.test(roleText);
  const fullHrRole = /(human resources|people operations|people & culture|hr administrator|hr admin|hr director|head of hr|chief people|people director)/i.test(roleText);
  const executiveAdmin = /(super admin|administrator|founder||chief executive|\bceo\b|\bowner\b)/i.test(roleText);

  const fullHr = fullHrRole || executiveAdmin || has("hr", "hr_admin", "owner", "company_owner", "board chair", "human resources", "people operations", "all");
  const recruiting = fullHr || recruitingRole || has("recruiting", "recruiter", "recruiting_admin", "talent acquisition", "careers_control", "careers-control", "all");
  const payroll = fullHr || payrollRole || profile.permissions?.payroll === true || has("payroll", "payroll_admin", "all");
  const badge = fullHr || badgeRole || has("badge", "badge_generator", "badge-generator", "badge_control", "badge-control", "all");

  return {
    fullHr,
    workforce: fullHr,
    employee: fullHr,
    organization: fullHr,
    recruiting,
    performance: fullHr,
    badge,
    payroll,
    access: fullHr,
    hr: fullHr || recruiting || payroll || badge
  };
}

function successFactorsRole(profile = {}) {
  const roleText = clean(first(profile.role, profile.position, profile.jobTitle), 300).toLowerCase();
  const access = successFactorsAccess(profile);
  if (access.hr) return "HR Admin";
  if (roleText.includes("driver") || roleText.includes("blue-collar") || roleText.includes("blue collar")) return "Driver";
  if (roleText.includes("manager") || roleText.includes("supervisor") || profile.canManage === true) return "Manager";
  return "Driver";
}

function successFactorsProfile(profile = {}) {
  const sfRole = successFactorsRole(profile);
  const access = successFactorsAccess(profile);
  const fullHr = access.fullHr === true;
  return {
    ...profile,
    systemRole: sfRole,
    hrisSystemUserRole: sfRole,
    isAdmin: fullHr,
    isHr: fullHr,
    isHR: fullHr,
    isHrAdmin: fullHr,
    isHRAdmin: fullHr,
    isPayrollAdmin: access.payroll === true,
    canUseHr: access.hr === true,
    canUseHR: access.hr === true,
    canManageEmployees: access.employee === true,
    hrAccess: access.hr === true,
    successFactorsAccess: access,
    access: {
      ...obj(profile.access),
      hr: access.hr === true,
      humanResources: fullHr,
      recruiting: access.recruiting === true,
      payroll: access.payroll === true,
      badge: access.badge === true
    }
  };
}

function canUseFullHrAdministration() {
  return currentSuccessFactorsProfile?.successFactorsAccess?.fullHr === true;
}
function canUseRecruiting() {
  return currentSuccessFactorsProfile?.successFactorsAccess?.recruiting === true;
}
function canUsePayroll() {
  return currentSuccessFactorsProfile?.successFactorsAccess?.payroll === true;
}

async function bootstrap(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;
  bootstrapPromise = (async () => {
    const session = await getStaffPortalSession();
    if (!session || session.loggedIn === false || session.authenticated === false || session.authorized !== true) {
      currentSuccessFactorsProfile = null;
      post("INTRANET_SESSION_EXPIRED", {
        message: "Your RIAINTRA session is not authorized."
      });
      return null;
    }

    const [profileResult, intranetResult] = await Promise.allSettled([
      getMyStaffProfile(),
      getIntranetHomeData()
    ]);

    if (profileResult.status !== "fulfilled" || !profileResult.value?.ok || !profileResult.value?.profile) {
      throw profileResult.status === "rejected" ? profileResult.reason : new Error("STAFF_PROFILE_NOT_FOUND");
    }

    const profile = successFactorsProfile(profileResult.value.profile);
    currentSuccessFactorsProfile = profile;
    const sfRole = successFactorsRole(profile);
    const intranet = intranetResult.status === "fulfilled" ? obj(intranetResult.value) : {};

    const payload = {
      profile,
      currentUserRole: sfRole,
      role: sfRole,
      apps: arr(intranet.apps).length ? intranet.apps : arr(session.apps),
      news: arr(intranet.news),
      stats: obj(intranet.stats),
      payrollProfile: {
        bankStatus: profile.paymentSetupStatus || ""
      },
      // Sensitive bank values are intentionally not sent back into the generic HR UI.
      paymentPreference: {
        bankName: profile.bankName || "",
        bankBicSwift: profile.bankBicSwift || "",
        usAccountType: profile.usAccountType || "",
        bankIban: "",
        bankClearingNumber: "",
        bankAccountNumber: "",
        usRoutingNumber: "",
        usAccountNumber: ""
      },
      sync: {
        source: "SYSTEM_AGENT_USERS",
        agentUserId: profile.id || "",
        wixMemberId: profile.wixMemberId || profile.memberId || "",
        updatedAt: profile.updatedAt || "",
        intranetAvailable: intranetResult.status === "fulfilled"
      }
    };

    post("INTRANET_BOOTSTRAP", payload);
    return payload;
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

async function saveProfile(payload = {}) {
  const result = await updateMyStaffProfile({ profile: obj(payload.profile) });
  if (!result?.ok) throw new Error(result?.message || "PROFILE_SAVE_FAILED");
  post("INTRANET_PROFILE_SAVED", result);
  await bootstrap(true);
}

async function searchColleagues(payload = {}) {
  const result = await searchStaffDirectory({ query: clean(payload.query, 300) });
  post("INTRANET_COLLEAGUES", result);
}

async function signOut() {
  try { await authentication.logout(); } catch (_) {}
  currentSuccessFactorsProfile = null;
  post("INTRANET_SIGNED_OUT", { message: "You have signed out." });
}

async function refreshOrgCatalog() {
  if (!canUseFullHrAdministration()) return null;
  const result = await getOrgStructureBootstrap();
  post("HR_ORG_CATALOG", result);
  return result;
}

async function refreshHrAdministration(payload = {}) {
  if (!canUseFullHrAdministration()) return null;
  const result = await getSuccessFactorsHrBootstrap(payload || {});
  lastHrBootstrap = result || null;
  if (!result?.authorized) {
    post("HR_SESSION", {
      authorized: false,
      code: result?.code || "STAFF_ROLE_REQUIRED",
      message: result?.message || "HR Administration is not available for this staff account."
    });
    return result;
  }
  post("HR_SESSION", {
    authorized: true,
    profile: result.profile || currentSuccessFactorsProfile || {},
    permissions: currentSuccessFactorsProfile?.permissions || {}
  });
  post("HR_STAFF_LIST", result);
  return result;
}

function normalizeStaffActionPayload(payload = {}) {
  return isObject(payload.item) ? payload.item : obj(payload);
}

function savedEmployeeId(result = {}, input = {}) {
  const item = obj(result.item);
  return clean(first(item.id, item._id, result.id, result._id, input.id, input._id), 100);
}
function savedSkId(result = {}, input = {}) {
  const item = obj(result.item);
  return clean(first(item.skId, item.sk_id, result.skId, result.sk_id, input.skId, input.skID, input.sk_id), 50);
}
function organizationRequested(input = {}) {
  return Boolean(clean(first(input.roleId, input.role_id, input.jobCode, input.job_code), 100));
}
function normalizeOrganizationInput(input = {}, saveResult = {}) {
  return {
    ...input,
    employeeId: savedEmployeeId(saveResult, input),
    skId: savedSkId(saveResult, input),
    companyCode: first(input.companyCode, input.company_code, "SK01"),
    roleId: first(input.roleId, input.role_id, input.jobCode, input.job_code),
    jobCode: first(input.jobCode, input.job_code, input.roleId, input.role_id),
    employmentCountry: first(input.employmentCountry, input.countryOfEmployment, input.countryCode, input.country_code, input.taxCountry),
    countryCode: first(input.countryCode, input.country_code, input.employmentCountry, input.countryOfEmployment, input.taxCountry),
    baseCode: first(input.baseCode, input.base_code, input.assignedBase, input.base),
    assignedBase: first(input.assignedBase, input.baseCode, input.base_code, input.base),
    managerAgentUserId: first(input.managerAgentUserId, input.manager_agent_user_id),
    effectiveFrom: first(input.effectiveFrom, input.effective_from),
    reason: first(input.reason, "SuccessFactors V9 employee save")
  };
}

async function saveHrEmployee(payload = {}) {
  const input = normalizeStaffActionPayload(payload);
  const result = await saveSuccessFactorsHrStaff({ item: input });
  if (result?.ok === false) throw new Error(result.message || "HR_STAFF_SAVE_FAILED");

  let orgResult = null;
  if (organizationRequested(input)) {
    const orgInput = normalizeOrganizationInput(input, result);
    if (!orgInput.employeeId && !orgInput.skId) {
      throw new Error("EMPLOYEE_ID_REQUIRED");
    }
    try {
      orgResult = await provisionStaffOrganization(orgInput);
    } catch (error) {
      post("HR_STAFF_SAVED", {
        ...result,
        partialSave: true,
        organizationSaved: false,
        message: "Employee details were saved, but the organization assignment was rejected."
      });
      const wrapped = new Error(error?.message || error);
      wrapped.partialSave = true;
      throw wrapped;
    }
  }

  const output = orgResult
    ? {
        ...result,
        item: orgResult.item || result.item,
        organizationSaved: true,
        organization: orgResult.assignment,
        managerResolution: orgResult.managerResolution,
        smartRequirements: orgResult.smartRequirements,
        sync: orgResult.sync,
        message: orgResult.message || result.message || "Employee saved."
      }
    : result;

  post("HR_STAFF_SAVED", output);
  await Promise.allSettled([
    refreshHrAdministration({ selectedId: savedEmployeeId(output, input) }),
    refreshOrgCatalog()
  ]);
  return output;
}

async function refreshPayrollControl() {
  if (!canUsePayroll()) return null;
  const result = canUseFullHrAdministration()
    ? (lastHrBootstrap || await getSuccessFactorsHrBootstrap({}))
    : null;
  const payload = result?.payrollControl || result?.payroll || result?.payrollAdmin || {};
  post("PAYROLL_CONTROL_DATA", payload);
  return payload;
}

async function handleHrMessage(message) {
  const payload = obj(message.payload);
  switch (message.type) {
    case "HR_READY":
      await bootstrap();
      if (canUseFullHrAdministration()) {
        const settled = await Promise.allSettled([
          refreshHrAdministration({ selectedId: payload.selectedId || "" }),
          refreshOrgCatalog()
        ]);
        settled.forEach((result, index) => {
          if (result.status === "rejected") {
            post("HR_ERROR", {
              stage: index === 0 ? "HR_BOOTSTRAP" : "HR_ORG_CATALOG",
              message: cleanError(result.reason)
            });
          }
        });
      }
      return true;

    case "HR_REFRESH":
      if (canUseFullHrAdministration()) await refreshHrAdministration(payload);
      return true;

    case "HR_ORG_REFRESH":
      if (canUseFullHrAdministration()) await refreshOrgCatalog();
      return true;

    case "HR_STAFF_SAVE":
    case "HR_SAVE_STAFF":
      await saveHrEmployee(payload);
      return true;

    case "HR_STAFF_ARCHIVE":
    case "HR_DEACTIVATE": {
      const result = await archiveSuccessFactorsHrStaff({
        id: first(payload.id, payload.employeeId, payload.staffId, payload._id)
      });
      post("HR_STAFF_SAVED", result);
      await refreshHrAdministration({});
      return true;
    }

    case "HR_REACTIVATE":
    case "HR_STAFF_REACTIVATE": {
      const result = await reactivateSuccessFactorsHrStaff({
        id: first(payload.id, payload.employeeId, payload.staffId, payload._id)
      });
      post("HR_STAFF_SAVED", result);
      await refreshHrAdministration({});
      return true;
    }

    case "HR_GENERATE_SKID": {
      const result = await generateSuccessFactorsSkId(payload);
      post("HR_SKID_GENERATED", result);
      return true;
    }

    case "HR_ACCESS_SAVE": {
      const result = await saveSuccessFactorsHrAccess(payload);
      post("HR_STAFF_SAVED", {
        ...result,
        message: result?.message || "Employee access updated."
      });
      return true;
    }

    case "HR_WIX_LOOKUP":
    case "HR_PORTAL_LOOKUP":
      post("HR_WIX_RESULT", await lookupSuccessFactorsWixMember(payload));
      return true;

    case "HR_WIX_CREATE":
    case "HR_PORTAL_CREATE":
      post("HR_WIX_RESULT", await createSuccessFactorsWixMember(payload));
      return true;

    case "HR_WIX_SYNC":
    case "HR_PORTAL_SYNC":
      post("HR_WIX_RESULT", await syncSuccessFactorsWixMember(payload));
      return true;

    case "HR_WIX_SEND_PASSWORD":
    case "HR_PORTAL_SEND_PASSWORD":
      post("HR_WIX_RESULT", await sendSuccessFactorsWixPasswordEmail(payload));
      return true;

    case "HR_WIX_APPROVE":
    case "HR_PORTAL_APPROVE":
      post("HR_WIX_RESULT", await approveSuccessFactorsWixMember(payload));
      return true;

    case "HR_WIX_BLOCK":
    case "HR_PORTAL_BLOCK":
      post("HR_WIX_RESULT", await blockSuccessFactorsWixMember(payload));
      return true;

    case "HR_PRINT_BADGE": {
      const result = await printSuccessFactorsStaffBadge(payload);
      post("HR_BADGE_PRINTED", result);
      return true;
    }

    case "HR_REPORTS_REQUEST": {
      const result = await getSuccessFactorsHrReports(payload);
      post("HR_REPORTS", result?.reports || result || {});
      return true;
    }

    // Legacy Crewcontrol contract retained.
    case "HR_CREWCONTROL_REFRESH": {
      const result = await getSuccessFactorsHrReports({
        section: "crewcontrol",
        skId: payload.skId || ""
      });
      post("HR_CREWCONTROL_DATA", result);
      return true;
    }

    case "HR_CREWCONTROL_ROUTE_SAVE": {
      const result = await saveSuccessFactorsHrStaff({
        item: {
          ...normalizeStaffActionPayload(payload),
          sourceModule: "crewcontrol"
        }
      });
      if (result?.ok === false) throw new Error(result.message || "Crewcontrol save failed.");
      post("HR_CREWCONTROL_DATA", result);
      if (canUseFullHrAdministration()) await refreshHrAdministration({});
      return true;
    }

    // Legacy Badge Control contract retained.
    case "HR_BADGE_CONTROL_REFRESH": {
      const result = await getSuccessFactorsHrReports({
        section: "badgeControl",
        skId: payload.skId || ""
      });
      post("HR_BADGE_CONTROL_DATA", result);
      return true;
    }

    case "HR_BADGE_CONTROL_SAVE": {
      const result = await saveSuccessFactorsHrStaff({
        item: {
          ...normalizeStaffActionPayload(payload),
          sourceModule: "badgeControl"
        }
      });
      if (result?.ok === false) throw new Error(result.message || "Badge Control save failed.");
      post("HR_BADGE_CONTROL_SAVED", result);
      if (canUseFullHrAdministration()) await refreshHrAdministration({});
      return true;
    }

    case "HR_NAVIGATE":
      requestMasterNavigation(payload.path);
      return true;

    case "HR_PRINT_PAGE":
      post("HR_ACTION_OK", { message: "Print command received." });
      return true;

    case "HR_CLOSE_RECORD":
      post("HR_RECORD_CLOSED", { ok: true });
      return true;

    default:
      return false;
  }
}

async function handlePayrollMessage(message) {
  const payload = obj(message.payload);
  switch (message.type) {
    case "PAYROLL_SAVE_PROFILE":
      post("PAYROLL_PROFILE_SAVED", await savePayrollProfile(payload));
      return true;
    case "PAYROLL_CREATE_PERIOD":
      post("PAYROLL_PERIOD_CREATED", await createPayrollPeriod(payload));
      return true;
    case "PAYROLL_CALCULATE_RUN":
      post("PAYROLL_RUN_CALCULATED", await calculatePayrollRun(payload));
      return true;
    case "PAYROLL_FINALIZE_RUN":
      post("PAYROLL_RUN_FINALIZED", await finalizePayrollRun(payload));
      return true;
    case "PAYROLL_CONTROL_REFRESH":
      await refreshPayrollControl();
      return true;
    case "PAYROLL_ACTION":
      if (payload.action === "open-run") {
        post("PAYROLL_ACTION_OK", {
          ok: true,
          action: "open-run",
          runId: clean(payload.runId, 100),
          message: "Payroll run selected."
        });
      } else {
        post("PAYROLL_ACTION_OK", {
          ok: true,
          action: clean(payload.action, 100),
          message: "Payroll action received."
        });
      }
      return true;
    default:
      return false;
  }
}

function itemPayload(payload = {}) {
  return isObject(payload.item) ? payload.item : payload;
}

async function duplicateJobPosting(payload = {}) {
  const requestedId = clean(first(payload.jobPostingId, payload.positionId, payload.id), 120);
  if (!requestedId) throw new Error("CAREERS_JOB_NOT_FOUND");
  const data = await getCareersBootstrap({ limit: 1000 });
  const job = arr(data?.jobPostings || data?.jobs).find(row =>
    [row.id, row._id, row.positionId, row.jobPostingId, row.requisitionId]
      .map(value => String(value || ""))
      .includes(requestedId)
  );
  if (!job) throw new Error("CAREERS_JOB_NOT_FOUND");

  const copy = { ...job };
  ["id", "_id", "positionId", "jobPostingId", "requisitionId"].forEach(key => delete copy[key]);
  copy.title = `Copy of ${job.title || job.jobTitle || "Job posting"}`;
  copy.status = "DRAFT";
  copy.active = false;
  copy.published = false;
  return saveJobPosting({ item: copy });
}

async function refreshCareers(payload = {}, type = "CAREERS_REFRESH_RESULT") {
  if (!canUseRecruiting()) return null;
  const result = await getCareersBootstrap(payload || {});
  post(type, result);
  return result;
}

async function refreshCareersAfterMutation(type, payload = {}) {
  post(type, payload);
  try {
    await refreshCareers({}, "CAREERS_REFRESH_RESULT");
  } catch (error) {
    post("CAREERS_ERROR", {
      stage: "CAREERS_POST_SAVE_REFRESH",
      message: cleanError(error)
    });
  }
}

async function handleCareersMessage(message) {
  if (!canUseRecruiting() && message.type !== "CAREERS_READY") return true;
  const payload = obj(message.payload);
  switch (message.type) {
    case "CAREERS_READY":
      if (canUseRecruiting()) await refreshCareers(payload, "CAREERS_BOOTSTRAP");
      return true;
    case "CAREERS_REFRESH":
      await refreshCareers(payload, "CAREERS_REFRESH_RESULT");
      return true;
    case "CAREERS_SAVE_CANDIDATE":
      await saveCandidate(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_SAVED", { message: "Candidate saved." });
      return true;
    case "CAREERS_SAVE_JOB_POSTING":
      await saveJobPosting(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_SAVED", { message: "Job posting saved." });
      return true;
    case "CAREERS_PUBLISH_JOB_POSTING":
      await publishJobPosting(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "Job posting published." });
      return true;
    case "CAREERS_DUPLICATE_JOB_POSTING":
      await duplicateJobPosting(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "Job posting duplicated as draft." });
      return true;
    case "CAREERS_MOVE_CANDIDATE_STAGE":
      await moveCandidateStage(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "Candidate stage updated." });
      return true;
    case "CAREERS_STAGE_MOVE_BLOCKED":
      post("CAREERS_ACTION_OK", { message: "Candidate move blocked by compliance rules.", blocked: true, ...payload });
      return true;
    case "CAREERS_DETECT_HISTORY_GAPS":
      await detectHistoryGaps(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "5-year history gap detection completed." });
      return true;
    case "CAREERS_SAVE_HISTORY_SEGMENT":
    case "CAREERS_NEW_HISTORY_SEGMENT_REQUEST":
      await createHistorySegment(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "History segment saved." });
      return true;
    case "CAREERS_VERIFY_HISTORY_SEGMENT":
      await verifyHistorySegment(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "History segment verified." });
      return true;
    case "CAREERS_RESOLVE_GAP_REQUEST":
      await resolveHistoryGap(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "History gap resolved." });
      return true;
    case "CAREERS_START_SRA_VETTING":
      await startSraVetting(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "SRA vetting started." });
      return true;
    case "CAREERS_DOCUMENT_UPLOAD_REQUEST": {
      const result = await createDocumentUploadRequest(payload);
      post("CAREERS_ACTION_OK", { ...(result || {}), message: result?.message || "Document upload request created." });
      return true;
    }
    case "CAREERS_VERIFY_DOCUMENT":
      await verifyDocument(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "Document verified." });
      return true;
    case "CAREERS_CREATE_DOCUMENT_PACKET": {
      const result = await createDocumentPacketForCandidate(payload);
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { ...(result || {}), message: result?.message || "Document packet created." });
      return true;
    }
    case "CAREERS_RESEND_DOCUMENT_PACKET": {
      const result = await resendDocumentPacket(payload);
      post("CAREERS_ACTION_OK", { ...(result || {}), message: result?.message || "Document packet resent." });
      return true;
    }
    case "CAREERS_SAVE_INTERVIEW":
      await saveCareerInterview(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "Interview/test record saved." });
      return true;
    case "CAREERS_SAVE_TRAINING_RECORD":
      await saveCareerTrainingRecord(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "Training record saved." });
      return true;
    case "CAREERS_SAVE_ONBOARDING_TASK":
      await saveCareerOnboardingTask(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_ACTION_OK", { message: "Onboarding task saved." });
      return true;
    case "CAREERS_SCHEDULE_MAINTENANCE": {
      const result = await scheduleCareerMaintenance(itemPayload(payload));
      post("CAREERS_ACTION_OK", { ...(result || {}), message: result?.message || "Maintenance request recorded." });
      return true;
    }
    case "CAREERS_SAVE_SETTINGS":
      await saveSettings(itemPayload(payload));
      await refreshCareersAfterMutation("CAREERS_SAVED", { message: "Recruiting settings saved." });
      return true;
    case "CAREERS_TEST_INTEGRATIONS":
    case "CAREERS_REFRESH_INTEGRATION_SNAPSHOTS": {
      const result = await testCareerIntegrations();
      post("CAREERS_ACTION_OK", { ...(result || {}), message: "Recruiting integrations checked." });
      await refreshCareers({}, "CAREERS_REFRESH_RESULT");
      return true;
    }
    case "CAREERS_DISPATCH_QUEUED_EMAILS": {
      const result = await dispatchQueuedCareerEmails(payload);
      post("CAREERS_ACTION_OK", { ...(result || {}), message: result?.message || "Queued recruiting email dispatch completed." });
      return true;
    }
    case "CAREERS_SYNC_MAILBOX_REPLIES": {
      const result = await syncCareerMailboxReplies(payload);
      post("CAREERS_ACTION_OK", { ...(result || {}), message: result?.message || "Recruiting mailbox sync completed." });
      return true;
    }
    case "CAREERS_EXPORT_AUDIT": {
      const result = await exportAuditPackage(payload);
      post("CAREERS_ACTION_OK", { result, message: "Recruiting audit export prepared." });
      return true;
    }
    case "CAREERS_OPEN_DOCUMENT_EXECUTION":
      if (payload.token && payload.email) {
        const basePath = isSafePath(payload.path) ? payload.path : "/careers/documents";
        const email = encodeURIComponent(payload.email);
        const token = encodeURIComponent(payload.token);
        requestMasterNavigation(`${basePath}?email=${email}&token=${token}`);
      } else {
        post("CAREERS_ACTION_OK", {
          message: "Secure document execution links are generated from the packet workflow and are not exposed without a valid token."
        });
      }
      return true;
    case "CAREERS_SAVE_VIEW_STATE":
      post("CAREERS_ACTION_OK", { message: "View state saved for this session.", ...payload });
      return true;
    default:
      return false;
  }
}

async function handleIntranetMessage(message) {
  const payload = obj(message.payload);
  switch (message.type) {
    case "INTRANET_READY":
    case "INTRANET_REFRESH":
      await bootstrap(message.type === "INTRANET_REFRESH");
      return true;
    case "INTRANET_PROFILE_SAVE":
    case "INTRANET_SAVE_PROFILE":
      await saveProfile(payload);
      return true;
    case "INTRANET_COLLEAGUES_REQUEST":
    case "INTRANET_SEARCH_COLLEAGUES":
      await searchColleagues(payload);
      return true;
    case "INTRANET_SIGN_OUT":
    case "INTRANET_SIGNOUT":
    case "STAFF_SIGNOUT_REQUEST":
      await signOut();
      return true;
    case "INTRANET_TASK_COMPLETE":
    case "INTRANET_TASK_DISMISS":
    case "INTRANET_FAVORITES_UPDATE":
    case "INTRANET_NOTIFICATIONS_READ":
      // These states are presently session/UI state. Do not claim durable persistence.
      return true;
    default:
      return false;
  }
}

async function handleMessage(message) {
  const type = clean(message.type || message.event || message.action, 120);
  if (!type) return false;
  const normalized = { ...message, type, payload: obj(message.payload) };
  if (type.startsWith("CAREERS_")) return handleCareersMessage(normalized);
  if (type.startsWith("PAYROLL_")) return handlePayrollMessage(normalized);
  if (type.startsWith("HR_")) return handleHrMessage(normalized);
  if (type.startsWith("INTRANET_") || type === "STAFF_SIGNOUT_REQUEST") return handleIntranetMessage(normalized);
  return false;
}

function errorChannel(type) {
  if (type.startsWith("CAREERS_")) return "CAREERS_ERROR";
  if (type.startsWith("PAYROLL_")) return "PAYROLL_ERROR";
  if (type.startsWith("HR_")) return "HR_ERROR";
  return "INTRANET_ERROR";
}

$w.onReady(function () {
  try {
    html = $w(EMBED_ID);
  } catch (error) {
    console.error(`[SuccessFactors V9] Missing HTML Component ${EMBED_ID}.`, error);
    return;
  }
  if (!html || typeof html.onMessage !== "function" || typeof html.postMessage !== "function") {
    console.error(`[SuccessFactors V9] ${EMBED_ID} is not a usable HTML Component.`);
    return;
  }

  // LISTENER FIRST. If the iframe emitted READY before the page listener existed,
  // SUCCESSFACTORS_HOST_READY makes it resend its bootstrap requests.
  html.onMessage(async event => {
    const message = event?.data || {};
    if (!CHILD_SOURCES.has(String(message.source || ""))) return;
    const type = clean(message.type || message.event || message.action, 120);
    try {
      const handled = await handleMessage({ ...message, type });
      if (!handled && type) console.info(`[SuccessFactors V9] No page action required for ${type}.`);
    } catch (error) {
      console.error(`[SuccessFactors V9] ${type || "UNKNOWN"} failed.`, error);
      post(errorChannel(type), {
        message: cleanError(error),
        stage: type || "UNKNOWN",
        partialSave: error?.partialSave === true
      });
    }
  });

  post("SUCCESSFACTORS_HOST_READY", {
    protocolVersion: PROTOCOL_VERSION,
    readyAt: new Date().toISOString(),
    embedId: clean(html.id, 80)
  });

  // The host also bootstraps proactively; duplicate child READY requests are safe
  // because bootstrapPromise coalesces concurrent requests.
  void bootstrap().catch(error => {
    console.error("[SuccessFactors V9] Initial bootstrap failed.", error);
    post("INTRANET_ERROR", {
      message: cleanError(error),
      stage: "INITIAL_BOOTSTRAP"
    });
  });
});

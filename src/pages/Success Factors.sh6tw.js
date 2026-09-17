// /src/pages/Success Factors.sh6tw.js
// B-011.30 — SuccessFactors V9 canonical single-bootstrap convergence.
// UI source: supplied SAP/Fiori SuccessFactors V9 generation.
// SuccessFactors owns Employee/HR, Organization, Recruiting, Performance/Learning, Badge and Access diagnostics.
// Payroll and MyRoster/scheduling remain separate applications and are never mutated from this page.

import wixLocation from "wix-location";
import { APP_ROUTES, SITE_MAP, isSafeInternalRoute } from "public/siteMap.js";
import {
  createEmployee,
  createRecruitingDocumentPacket,
  detectRecruitingHistoryGaps,
  duplicateRecruitingPosition,
  exportRecruitingAudit,
  generateEmployeeSkId,
  getBadgeControl,
  getEmployeeWorkspace,
  getManagerCandidates,
  getOrgStructureBootstrap,
  getRecruitingBootstrap,
  getSuccessFactorsDirectory,
  provisionEmployeeWixMember,
  provisionStaffOrganization,
  publishRecruitingPosition,
  requestRecruitingDocument,
  resendRecruitingDocumentPacket,
  resolveRecruitingGap,
  saveBadgeControl,
  saveRecruitingCandidate,
  saveRecruitingHistory,
  saveRecruitingInterview,
  saveRecruitingOnboardingTask,
  saveRecruitingPosition,
  saveRecruitingSettings,
  saveRecruitingTraining,
  saveRecruitingVetting,
  saveSuccessFactorsSelfProfile,
  scheduleRecruitingMaintenance,
  setEmployeeActive,
  testRecruitingIntegrations,
  updateEmployee,
  updateRecruitingCandidateStage,
  verifyRecruitingDocument,
  verifyRecruitingHistory
} from "backend/SKANDI_CORE/orgStructure.web";

const EMBED_ID = "#staffHrEmbed";
const CHILD_SOURCES = new Set(["SKANDI_HR_STAFF", "SKANDI_SUCCESSFACTORS"]);
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
let portalBootstrapCache = null;
let portalBootstrapInFlight = null;
let hrBootstrapInFlight = null;
let orgBootstrapCache = null;
let orgBootstrapInFlight = null;

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function cleanError(error) {
  const message = String(error?.message || error?.details?.applicationError?.description || "").trim();
  return {
    code: String(error?.code || error?.details?.applicationError?.code || "HR_ACTION_FAILED"),
    message: message && message.length <= 420 ? message : "The SuccessFactors action could not be completed."
  };
}

function employeeInput(item = {}) {
  return {
    ...item,
    agentUserId: item.agentUserId || item.recordId || item.id || "",
    corporateEmail: item.corporateEmail || item.corporateEmailAddress || item.workEmail || item.companyEmail || item.email || "",
    badgePhotoUrl: item.badgePhotoUrl || item.photoUrl || ""
  };
}

function organizationInput(item = {}, agentUserId = "") {
  return {
    agentUserId: agentUserId || item.agentUserId || item.recordId || item.id || "",
    skId: item.skId || item.skID || "",
    countryCode: item.countryCode || item.employmentCountry || item.taxCountry || "",
    baseCode: item.baseCode || item.assignedBaseId || "",
    roleId: item.roleId || item.jobCode || "",
    managerAgentUserId: item.managerAgentUserId || "",
    accessRole: item.accessRole || "",
    permissionPresetId: item.permissionPresetId || item.permissionPreset || "",
    effectiveFrom: item.effectiveFrom || "",
    reason: item.reason || "SuccessFactors V9 Employee Central"
  };
}

function orgCatalogPayload(bootstrap = {}) {
  const catalog = bootstrap.catalog || {};
  return {
    ok: true,
    companyCode: "SK01",
    departments: catalog.departments || [],
    bases: catalog.bases || [],
    roles: catalog.roles || [],
    accessRoles: catalog.accessRoles || [],
    permissionPresets: catalog.permissionPresets || [],
    roleBaseRules: catalog.roleBaseRules || [],
    countries: catalog.countryRules || [],
    countryRules: catalog.countryRules || [],
    baseJurisdictions: catalog.baseJurisdictions || [],
    roleRequirements: catalog.roleRequirements || [],
    audit: bootstrap.assignments || [],
    smartLogicVersion: "B-011.30-V9"
  };
}

function normalizePortalBootstrapFromHr(data = {}) {
  const session = data?.session || {};
  const hasHr = session?.canReadHr === true || session?.isHr === true || session?.isSystemAdmin === true || session?.canManageHr === true;
  const hasRecruiting = session?.canReadRecruiting === true || hasHr;
  const rawProfile = session?.profile || null;
  const profile = rawProfile ? {
    ...rawProfile,
    successFactorsAccess: {
      fullHr: hasHr,
      workforce: hasHr,
      employee: hasHr,
      organization: hasHr,
      recruiting: hasRecruiting,
      performance: hasHr,
      badge: session?.canManageHr === true || session?.isSystemAdmin === true,
      access: hasHr
    }
  } : null;
  return {
    ok: data?.ok !== false,
    version: String(data?.version || "BACKEND-BASE-1.0-B011.30-SUCCESSFACTORS"),
    profile,
    apps: [],
    news: [],
    tasks: [],
    quickActions: [],
    notifications: [],
    favoriteApps: [],
    stats: {},
    hrAccess: { read: hasHr, manage: session?.canManageHr === true || session?.isSystemAdmin === true, recruiting: hasRecruiting },
    compatibilityMode: true
  };
}

async function ensureOrgBootstrap({ refresh = false } = {}) {
  if (!refresh && orgBootstrapCache) return orgBootstrapCache;
  if (orgBootstrapInFlight) return orgBootstrapInFlight;

  orgBootstrapInFlight = getOrgStructureBootstrap({})
    .then((data) => {
      orgBootstrapCache = data;
      return data;
    })
    .finally(() => {
      orgBootstrapInFlight = null;
    });

  return orgBootstrapInFlight;
}

async function ensurePortalBootstrap({ refresh = false } = {}) {
  if (!refresh && portalBootstrapCache) return portalBootstrapCache;
  if (portalBootstrapInFlight) return portalBootstrapInFlight;

  portalBootstrapInFlight = ensureOrgBootstrap({ refresh })
    .then((data) => {
      const portal = normalizePortalBootstrapFromHr(data);
      portalBootstrapCache = portal;
      return portal;
    })
    .finally(() => {
      portalBootstrapInFlight = null;
    });

  return portalBootstrapInFlight;
}

async function sendPortalBootstrap({ refresh = false } = {}) {
  const data = await ensurePortalBootstrap({ refresh });
  send("INTRANET_BOOTSTRAP", data);
  return data;
}

async function sendHrBootstrap({ refreshPortal = false } = {}) {
  if (hrBootstrapInFlight) return hrBootstrapInFlight;

  hrBootstrapInFlight = (async () => {
    const data = await ensureOrgBootstrap({ refresh: refreshPortal });
    const portal = normalizePortalBootstrapFromHr(data);
    portalBootstrapCache = portal;
    if (portal?.hrAccess?.read !== true) {
      send("HR_SESSION", { authorized: false, canManage: false });
      return false;
    }
    const staff = Array.isArray(data.staff) ? data.staff : [];
    const active = staff.filter((item) => item?.active !== false && !/inactive|terminated|archived|former|offboard/i.test(String(item?.employmentStatus || item?.status || "")));
    const archive = staff.filter((item) => !active.includes(item));

    send("HR_SESSION", { authorized: true, canManage: data?.session?.canManageHr === true });
    send("HR_BOOTSTRAP", {
      authorized: true,
      staff: active,
      archive,
      organization: data.assignments || [],
      selectedId: "",
      reports: { goals: [], qualifications: [], expiries: [], training: [], compliance: [] },
      access: { roles: data.catalog?.accessRoles || [], permissionCatalog: data.catalog?.permissionPresets || [], portalResults: [] },
      lastUpdatedAt: new Date().toISOString()
    });
    send("HR_ORG_CATALOG", orgCatalogPayload(data));
    return true;
  })().finally(() => {
    hrBootstrapInFlight = null;
  });

  return hrBootstrapInFlight;
}

async function sendRecruitingBootstrap(type = "CAREERS_DATA") {
  const data = await getRecruitingBootstrap({});
  send(type, data);
  return data;
}

function careerOk(message, result = {}) {
  send("CAREERS_ACTION_OK", { ok: true, message, ...result });
}

function careerUnsupported(message) {
  send("CAREERS_ERROR", { code: "RECRUITING_PROVIDER_NOT_CONFIGURED", message });
}

async function saveEmployeeFromV9(payload = {}) {
  const item = payload.item && typeof payload.item === "object" ? payload.item : {};
  const isNew = payload.isNew === true || !String(item.id || item.recordId || "").trim();
  let result;
  if (isNew) {
    result = await createEmployee(employeeInput(item));
  } else {
    result = await updateEmployee(employeeInput(item));
  }

  let employee = result?.employee || null;
  if (employee && item.roleId && item.baseCode) {
    const assigned = await provisionStaffOrganization(organizationInput(item, employee.id));
    employee = assigned?.employee || assigned?.target || employee;
  }

  send("HR_STAFF_SAVED", {
    ok: true,
    item: employee || result?.employee || item,
    message: isNew ? "Employee created." : "Employee updated."
  });

  if (isNew && result?.wixMember) {
    if (result.wixMember.ok === true) {
      send("HR_WIX_RESULT", {
        ok: true,
        item: employee || result.employee,
        member: result.wixMember.member || null,
        created: result.wixMember.created === true,
        linked: result.wixMember.linked === true,
        passwordEmailSent: result.wixMember.passwordEmailSent === true,
        message: result.wixMember.created ? "Wix Member created from the corporate email." : "Existing Wix Member linked to the employee."
      });
    } else {
      send("HR_ERROR", {
        action: "HR_WIX_MEMBER_PROVISION",
        code: result.wixMember.code || "WIX_MEMBER_PROVISION_PENDING",
        message: result.wixMember.message || "Employee saved, but Wix Member provisioning needs retry."
      });
    }
  }

  portalBootstrapCache = null;
  orgBootstrapCache = null;
  await sendPortalBootstrap({ refresh: true });
  await sendHrBootstrap();
}

async function handleMessage(type, payload) {
  switch (type) {
    case "SKANDI_MASTER_CONFIG_REQUEST":
      send("SKANDI_MASTER_CONFIG", { routes: SITE_MAP, internal: APP_ROUTES, brand: { product: "SuccessFactors", version: "V9" } });
      return;
    case "MASTER_NAVIGATION_REQUEST":
      send("SKANDI_MASTER_NAVIGATION", { routes: SITE_MAP, internal: APP_ROUTES });
      return;
    case "MASTER_NAVIGATE":
      if (isSafeInternalRoute(payload.path)) wixLocation.to(payload.path);
      return;

    case "INTRANET_READY":
      await sendPortalBootstrap();
      return;
    case "INTRANET_REFRESH":
      await sendPortalBootstrap({ refresh: true });
      await sendHrBootstrap();
      return;
    case "INTRANET_COLLEAGUES_REQUEST": {
      const result = await getSuccessFactorsDirectory(payload);
      send("INTRANET_COLLEAGUES", { items: result.items || [] });
      return;
    }
    case "INTRANET_PROFILE_SAVE": {
      const result = await saveSuccessFactorsSelfProfile(payload.profile || payload);
      send("INTRANET_PROFILE_SAVED", result);
      await sendPortalBootstrap({ refresh: true });
      return;
    }
    case "INTRANET_SIGN_OUT":
      wixLocation.to(SITE_MAP.staffLogin || SITE_MAP.riaintra);
      return;
    case "INTRANET_TASK_COMPLETE":
    case "INTRANET_TASK_DISMISS":
    case "INTRANET_FAVORITES_UPDATE":
    case "INTRANET_NOTIFICATIONS_READ":
      return;

    case "HR_READY":
      await sendHrBootstrap();
      return;
    case "HR_REFRESH":
    case "HR_ORG_REFRESH":
      await sendPortalBootstrap({ refresh: true });
      await sendHrBootstrap();
      return;
    case "HR_GET_EMPLOYEE":
      send("HR_EMPLOYEE", await getEmployeeWorkspace(payload));
      return;
    case "HR_GET_MANAGER_CANDIDATES":
      send("HR_MANAGER_CANDIDATES", await getManagerCandidates(payload));
      return;
    case "HR_PROVISION_ORGANIZATION": {
      const result = await provisionStaffOrganization(payload);
      portalBootstrapCache = null;
      orgBootstrapCache = null;
      send("HR_ORGANIZATION_SAVED", result);
      await sendPortalBootstrap({ refresh: true });
      await sendHrBootstrap();
      return;
    }
    case "HR_GENERATE_SKID":
      send("HR_SKID_GENERATED", await generateEmployeeSkId(payload));
      return;
    case "HR_STAFF_SAVE":
      await saveEmployeeFromV9(payload);
      return;
    case "HR_STAFF_ARCHIVE": {
      const result = await setEmployeeActive({ agentUserId: payload.id, active: false });
      portalBootstrapCache = null;
      orgBootstrapCache = null;
      send("HR_STAFF_SAVED", { ok: true, item: result.employee, message: "Employee archived." });
      await sendPortalBootstrap({ refresh: true });
      await sendHrBootstrap();
      return;
    }
    case "HR_PRINT_BADGE": {
      const badge = payload.badge && typeof payload.badge === "object" ? payload.badge : {};
      const result = await saveBadgeControl({
        agentUserId: payload.employeeId || badge.id || badge.agentUserId,
        staffId: badge.skId || badge.staffId,
        template: badge.template || "SKANDI_STANDARD",
        status: "PRINTED",
        expiryDate: badge.badgeExpiryDate || badge.expiryDate || "",
        photoUrl: badge.photoUrl || badge.badgePhotoUrl || "",
        markPrinted: true
      });
      portalBootstrapCache = null;
      orgBootstrapCache = null;
      send("HR_BADGE_PRINTED", { ok: true, item: result.employee, badge: result.badge, message: "Badge print recorded." });
      await sendPortalBootstrap({ refresh: true });
      await sendHrBootstrap();
      return;
    }
    case "HR_PROVISION_WIX_MEMBER": {
      const result = await provisionEmployeeWixMember(payload);
      portalBootstrapCache = null;
      orgBootstrapCache = null;
      send("HR_WIX_RESULT", result);
      await sendPortalBootstrap({ refresh: true });
      await sendHrBootstrap();
      return;
    }
    case "HR_BADGE_CONTROL_REFRESH":
      send("HR_BADGE_CONTROL_DATA", await getBadgeControl(payload));
      return;
    case "HR_BADGE_CONTROL_SAVE":
      portalBootstrapCache = null;
      orgBootstrapCache = null;
      send("HR_BADGE_CONTROL_SAVED", await saveBadgeControl(payload));
      await sendPortalBootstrap({ refresh: true });
      await sendHrBootstrap();
      return;

    case "CAREERS_READY":
      await sendRecruitingBootstrap("CAREERS_BOOTSTRAP");
      return;
    case "CAREERS_REFRESH":
      await sendRecruitingBootstrap("CAREERS_REFRESH_RESULT");
      return;
    case "CAREERS_SAVE_CANDIDATE":
      careerOk("Candidate saved.", await saveRecruitingCandidate(payload.item || payload));
      return;
    case "CAREERS_MOVE_CANDIDATE_STAGE":
      careerOk("Candidate stage updated.", await updateRecruitingCandidateStage({ id: payload.candidateId, status: payload.targetStage }));
      return;
    case "CAREERS_SAVE_JOB_POSTING":
      careerOk("Job posting saved.", await saveRecruitingPosition(payload.item || payload));
      return;
    case "CAREERS_PUBLISH_JOB_POSTING":
      careerOk("Job posting published.", await publishRecruitingPosition(payload));
      return;
    case "CAREERS_DUPLICATE_JOB_POSTING":
      careerOk("Job posting duplicated as draft.", await duplicateRecruitingPosition(payload));
      return;
    case "CAREERS_SAVE_INTERVIEW":
      careerOk("Interview saved.", await saveRecruitingInterview(payload.item || payload));
      return;
    case "CAREERS_START_SRA_VETTING":
      careerOk("SRA vetting started.", await saveRecruitingVetting({ candidateId: payload.candidateId, status: "STARTED" }));
      return;
    case "CAREERS_SAVE_TRAINING_RECORD":
      careerOk("Training record saved.", await saveRecruitingTraining(payload.item || payload));
      return;
    case "CAREERS_SAVE_ONBOARDING_TASK":
      careerOk("Onboarding task saved.", await saveRecruitingOnboardingTask(payload.item || payload));
      return;
    case "CAREERS_SAVE_HISTORY_SEGMENT":
      careerOk("History segment saved.", await saveRecruitingHistory(payload.item || payload));
      return;
    case "CAREERS_VERIFY_HISTORY_SEGMENT":
      careerOk("History segment verified.", await verifyRecruitingHistory(payload));
      return;
    case "CAREERS_DETECT_HISTORY_GAPS":
      careerOk("History gap detection completed.", await detectRecruitingHistoryGaps(payload));
      return;
    case "CAREERS_RESOLVE_GAP_REQUEST":
      careerOk("History gap resolved.", await resolveRecruitingGap(payload));
      return;
    case "CAREERS_DOCUMENT_UPLOAD_REQUEST":
      careerOk("Document request created.", await requestRecruitingDocument(payload));
      return;
    case "CAREERS_VERIFY_DOCUMENT":
      careerOk("Document verified.", await verifyRecruitingDocument(payload));
      return;
    case "CAREERS_CREATE_DOCUMENT_PACKET":
      careerOk("Document packet created.", await createRecruitingDocumentPacket(payload));
      return;
    case "CAREERS_RESEND_DOCUMENT_PACKET":
      careerOk("Document packet queued for the configured dispatcher.", await resendRecruitingDocumentPacket(payload));
      return;
    case "CAREERS_OPEN_DOCUMENT_EXECUTION":
      careerUnsupported("Secure packet execution belongs to the candidate-facing Careers flow and is not opened from the internal SuccessFactors embed.");
      return;
    case "CAREERS_SAVE_SETTINGS":
      careerOk("Recruiting settings saved.", await saveRecruitingSettings(payload.item || payload));
      return;
    case "CAREERS_TEST_INTEGRATIONS":
      careerOk("Recruiting integration status checked.", await testRecruitingIntegrations(payload));
      return;
    case "CAREERS_SCHEDULE_MAINTENANCE":
      careerOk("Recruiting maintenance scheduled.", await scheduleRecruitingMaintenance(payload));
      return;
    case "CAREERS_EXPORT_AUDIT":
      careerOk("Recruiting audit package prepared.", { export: await exportRecruitingAudit(payload) });
      return;
    case "CAREERS_DISPATCH_QUEUED_EMAILS":
    case "CAREERS_SYNC_MAILBOX_REPLIES":
      careerUnsupported("No external Recruiting mailbox provider is configured in the canonical B011.6 runtime.");
      return;

    default:
      return;
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source && !CHILD_SOURCES.has(message.source)) return;
    const type = String(message.type || "");
    const payload = message.payload && typeof message.payload === "object" ? message.payload : {};
    try {
      await handleMessage(type, payload);
    } catch (error) {
      const safe = cleanError(error);
      const responseType = type.startsWith("CAREERS_") ? "CAREERS_ERROR" : type.startsWith("INTRANET_") ? "INTRANET_ERROR" : "HR_ERROR";
      send(responseType, { action: type, ...safe });
    }
  });

  // SuccessFactors is event-driven. A full organization catalog can be large, so do not
  // refetch and retransmit it on a timer. The embed requests HR_REFRESH / HR_ORG_REFRESH
  // explicitly and every successful HR mutation refreshes the relevant state.

  send("SUCCESSFACTORS_HOST_READY", {
    version: "B-011.30-SUCCESSFACTORS-V9",
    embedId: EMBED_ID,
    payrollOwner: SITE_MAP.payroll,
    rosterOwner: APP_ROUTES.myRoster
  });
});

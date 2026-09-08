// SKANDI SuccessFactors merged controller
// Single SuccessFactors host. Recruiting is embedded as a role-controlled HR module.
// HTML Component: #staffHrEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";

import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { getIntranetHomeData } from "backend/RIA/staffIntranet.web";
import {
  getMyStaffProfile,
  updateMyStaffProfile,
  searchStaffDirectory
} from "backend/RIA/staffProfile.web";

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

const EMBED_ID = "#HrEmbed";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHILD_SOURCES = new Set([
  "SKANDI_STAFF_DASHBOARD_INTRANET",
  "SKANDI_HR_STAFF",
  "SKANDI_CAREERS_CONTROL"
]);

const STAFF_LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";
const ALLOWED_PATH_PREFIXES = ["/riaintra", "/altea", "/success-factors", "/careers"];

let html = null;
let bootstrapPromise = null;

function post(type, payload = {}) {
  if (!html) return;
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function cleanError(error) {
  const raw = String(error?.message || error || "").trim();
  const map = {
    STAFF_PROFILE_AUTH_REQUIRED: "Your staff session has expired. Sign in again.",
    STAFF_PROFILE_NOT_FOUND: "Your SuccessFactors employee profile could not be found in Supabase.",
    STAFF_PROFILE_INACTIVE: "Your employee profile is inactive.",
    STAFF_PROFILE_NOT_AUTHORIZED: "Your employee profile is not authorized for RIAINTRA.",
    STAFF_PROFILE_PORTAL_DISABLED: "Your employee profile does not have portal access.",
    WIX_MEMBER_LINK_MISMATCH: "Your Wix member is linked to a different employee profile.",
    INTERNAL_ACCESS_DENIED: "Your current employee role does not include this SuccessFactors module.",
    INTERNAL_ACCESS_AUTH_REQUIRED: "Your staff session has expired. Sign in again."
  };
  return map[raw] || (raw.length <= 240 ? raw : "") || "SuccessFactors could not complete the action.";
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

  return new Set(values.map(value => String(value).trim().toLowerCase()).filter(Boolean));
}

function successFactorsAccess(profile = {}) {
  const roleText = String(
    profile.role || profile.position || profile.jobTitle || profile.systemRole || ""
  ).trim().toLowerCase();
  const tokens = permissionTokens(profile);
  const has = (...keys) => keys.some(key => {
    const value = String(key).toLowerCase();
    return tokens.has(value) || tokens.has(value.replace(/ /g, "_")) || tokens.has(value.replace(/ /g, "-"));
  });

  const recruitingRole = /(recruit|talent acquisition|talent partner|candidate experience|staffing)/i.test(roleText);
  const payrollRole = /(payroll|compensation)/i.test(roleText);
  const badgeRole = /(badge|credential|identity admin)/i.test(roleText);
  const fullHrRole = /(human resources|people operations|people & culture|hr administrator|hr admin|hr director|head of hr|chief people|people director)/i.test(roleText);
  const executiveAdmin = /(super admin|administrator|founder|chief executive|\bceo\b|\bowner\b)/i.test(roleText);

  const fullHr = fullHrRole || executiveAdmin || has("hr_admin", "human resources", "people operations", "all");
  const recruiting = fullHr || recruitingRole || has(
    "recruiting", "recruiter", "recruiting_admin", "talent acquisition", "careers_control", "all"
  );
  const payroll = fullHr || payrollRole || profile.permissions?.payroll === true || has("payroll", "payroll_admin", "all");
  const badge = fullHr || badgeRole || has("badge", "badge_generator", "badge_control", "all");

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
  const roleText = String(
    profile.role || profile.position || profile.jobTitle || ""
  ).trim().toLowerCase();
  const access = successFactorsAccess(profile);

  // Access-specific roles must be recognized before generic "manager".
  if (access.hr) return "HR Admin";

  if (
    roleText.includes("driver") ||
    roleText.includes("blue-collar") ||
    roleText.includes("blue collar")
  ) return "Driver";

  if (
    roleText.includes("manager") ||
    roleText.includes("supervisor") ||
    profile.canManage === true
  ) return "Manager";

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

    // These legacy booleans mean FULL HR admin only. Recruiting-only users
    // receive their entitlement through successFactorsAccess.recruiting.
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
      ...(profile.access || {}),
      hr: access.hr === true,
      humanResources: fullHr,
      recruiting: access.recruiting === true,
      payroll: access.payroll === true,
      badge: access.badge === true
    }
  };
}

async function bootstrap(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const session = await getStaffPortalSession();
    if (
      !session ||
      session.loggedIn === false ||
      session.authenticated === false ||
      session.authorized !== true
    ) {
      post("INTRANET_SESSION_EXPIRED", {
        message: "Your RIAINTRA session is not authorized."
      });
      wixLocation.to(STAFF_LOGIN_PATH);
      return null;
    }

    const [profileResult, intranet] = await Promise.all([
      getMyStaffProfile(),
      getIntranetHomeData().catch(() => ({
        apps: session.apps || [],
        news: [],
        stats: {}
      }))
    ]);

    if (!profileResult?.ok || !profileResult?.profile) {
      throw new Error("STAFF_PROFILE_NOT_FOUND");
    }

    const profile = successFactorsProfile(profileResult.profile);
    const sfRole = successFactorsRole(profile);

    const payload = {
      profile,
      currentUserRole: sfRole,
      role: sfRole,
      apps: intranet.apps || session.apps || [],
      news: intranet.news || [],
      stats: intranet.stats || {},
      payrollProfile: {
        bankStatus: profile.paymentSetupStatus || ""
      },
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
        source: "SUPABASE_AGENT_USERS",
        agentUserId: profile.id || "",
        wixMemberId: profile.wixMemberId || profile.memberId || "",
        updatedAt: profile.updatedAt || ""
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
  const result = await updateMyStaffProfile({
    profile: payload.profile || {}
  });
  if (!result?.ok) throw new Error(result?.message || "PROFILE_SAVE_FAILED");
  post("INTRANET_PROFILE_SAVED", result);
  await bootstrap(true);
}

async function searchColleagues(payload = {}) {
  const result = await searchStaffDirectory({
    query: payload.query || ""
  });
  post("INTRANET_COLLEAGUES", result);
}

function openStaffPath(path) {
  const value = String(path || "").trim();
  if (!value) throw new Error("Missing staff destination.");

  const allowed = ALLOWED_PATH_PREFIXES.some(prefix =>
    value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}#`)
  );
  if (!allowed) throw new Error("Invalid staff destination.");
  wixLocation.to(value);
}

async function signOut() {
  await authentication.logout();
  post("INTRANET_SIGNED_OUT", { message: "You have signed out." });
  wixLocation.to(HOME_PATH);
}

function itemPayload(payload = {}) {
  return payload.item && typeof payload.item === "object" ? payload.item : payload;
}

async function duplicateJobPosting(payload = {}) {
  const requestedId = String(
    payload.jobPostingId || payload.positionId || payload.id || ""
  ).trim();
  if (!requestedId) throw new Error("CAREERS_JOB_NOT_FOUND");

  const data = await getCareersBootstrap({ limit: 1000 });
  const job = (data.jobPostings || data.jobs || []).find(row =>
    [row.id, row._id, row.positionId, row.jobPostingId, row.requisitionId]
      .map(value => String(value || ""))
      .includes(requestedId)
  );
  if (!job) throw new Error("CAREERS_JOB_NOT_FOUND");

  const copy = { ...job };
  delete copy.id;
  delete copy._id;
  delete copy.positionId;
  delete copy.jobPostingId;
  delete copy.requisitionId;
  copy.title = `Copy of ${job.title || job.jobTitle || "Job posting"}`;
  copy.status = "DRAFT";
  copy.active = false;
  copy.published = false;

  return saveJobPosting({ item: copy });
}

async function refreshCareers(payload = {}, type = "CAREERS_REFRESH_RESULT") {
  const result = await getCareersBootstrap(payload || {});
  post(type, result);
  return result;
}

async function handleCareersMessage(message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "CAREERS_READY":
      await refreshCareers(payload, "CAREERS_BOOTSTRAP");
      return true;

    case "CAREERS_REFRESH":
      await refreshCareers(payload, "CAREERS_REFRESH_RESULT");
      return true;

    case "CAREERS_SAVE_CANDIDATE":
      await saveCandidate(itemPayload(payload));
      post("CAREERS_SAVED", { message: "Candidate saved." });
      return true;

    case "CAREERS_SAVE_JOB_POSTING":
      await saveJobPosting(itemPayload(payload));
      post("CAREERS_SAVED", { message: "Job posting saved." });
      return true;

    case "CAREERS_PUBLISH_JOB_POSTING":
      await publishJobPosting(itemPayload(payload));
      post("CAREERS_ACTION_OK", { message: "Job posting published." });
      return true;

    case "CAREERS_DUPLICATE_JOB_POSTING":
      await duplicateJobPosting(payload);
      post("CAREERS_ACTION_OK", { message: "Job posting duplicated as draft." });
      return true;

    case "CAREERS_MOVE_CANDIDATE_STAGE":
      await moveCandidateStage(payload);
      post("CAREERS_ACTION_OK", { message: "Candidate stage updated." });
      return true;

    case "CAREERS_DETECT_HISTORY_GAPS":
      await detectHistoryGaps(payload);
      post("CAREERS_ACTION_OK", { message: "5-year history gap detection completed." });
      return true;

    case "CAREERS_SAVE_HISTORY_SEGMENT":
      await createHistorySegment(itemPayload(payload));
      post("CAREERS_ACTION_OK", { message: "History segment saved." });
      return true;

    case "CAREERS_VERIFY_HISTORY_SEGMENT":
      await verifyHistorySegment(payload);
      post("CAREERS_ACTION_OK", { message: "History segment verified." });
      return true;

    case "CAREERS_RESOLVE_GAP_REQUEST":
      await resolveHistoryGap(payload);
      post("CAREERS_ACTION_OK", { message: "History gap resolved." });
      return true;

    case "CAREERS_START_SRA_VETTING":
      await startSraVetting(payload);
      post("CAREERS_ACTION_OK", { message: "SRA vetting started." });
      return true;

    case "CAREERS_DOCUMENT_UPLOAD_REQUEST":
      await createDocumentUploadRequest(payload);
      post("CAREERS_ACTION_OK", { message: "Document upload request created." });
      return true;

    case "CAREERS_VERIFY_DOCUMENT":
      await verifyDocument(payload);
      post("CAREERS_ACTION_OK", { message: "Document verified." });
      return true;

    case "CAREERS_CREATE_DOCUMENT_PACKET": {
      const result = await createDocumentPacketForCandidate(payload);
      post("CAREERS_ACTION_OK", {
        ...result,
        message: result?.message || "Document packet created."
      });
      return true;
    }

    case "CAREERS_RESEND_DOCUMENT_PACKET": {
      const result = await resendDocumentPacket(payload);
      post("CAREERS_ACTION_OK", {
        ...result,
        message: result?.message || "Document packet resent."
      });
      return true;
    }

    case "CAREERS_SAVE_INTERVIEW":
      await saveCareerInterview(itemPayload(payload));
      post("CAREERS_ACTION_OK", { message: "Interview/test record saved." });
      return true;

    case "CAREERS_SAVE_TRAINING_RECORD":
      await saveCareerTrainingRecord(itemPayload(payload));
      post("CAREERS_ACTION_OK", { message: "Training record saved." });
      return true;

    case "CAREERS_SAVE_ONBOARDING_TASK":
      await saveCareerOnboardingTask(itemPayload(payload));
      post("CAREERS_ACTION_OK", { message: "Onboarding task saved." });
      return true;

    case "CAREERS_SCHEDULE_MAINTENANCE": {
      const result = await scheduleCareerMaintenance(itemPayload(payload));
      post("CAREERS_ACTION_OK", {
        ...result,
        message: result?.message || "Maintenance request recorded."
      });
      return true;
    }

    case "CAREERS_SAVE_SETTINGS":
      await saveSettings(itemPayload(payload));
      post("CAREERS_SAVED", { message: "Recruiting settings saved." });
      return true;

    case "CAREERS_TEST_INTEGRATIONS": {
      const result = await testCareerIntegrations();
      post("CAREERS_ACTION_OK", {
        ...result,
        message: "Recruiting integrations checked."
      });
      return true;
    }

    case "CAREERS_DISPATCH_QUEUED_EMAILS": {
      const result = await dispatchQueuedCareerEmails(payload);
      post("CAREERS_ACTION_OK", {
        ...result,
        message: result?.message || "Queued recruiting email dispatch completed."
      });
      return true;
    }

    case "CAREERS_SYNC_MAILBOX_REPLIES": {
      const result = await syncCareerMailboxReplies(payload);
      post("CAREERS_ACTION_OK", {
        ...result,
        message: result?.message || "Recruiting mailbox sync completed."
      });
      return true;
    }

    case "CAREERS_EXPORT_AUDIT": {
      const result = await exportAuditPackage(payload);
      post("CAREERS_ACTION_OK", {
        result,
        message: "Recruiting audit export prepared."
      });
      return true;
    }

    case "CAREERS_OPEN_DOCUMENT_EXECUTION":
      // The execution token is intentionally not reconstructed client-side.
      // If the caller already received a valid token, preserve the existing route.
      if (payload.token && payload.email) {
        const email = encodeURIComponent(payload.email);
        const token = encodeURIComponent(payload.token);
        const path = payload.path || "/careers/documents";
        wixLocation.to(`${path}?email=${email}&token=${token}`);
      } else {
        post("CAREERS_ACTION_OK", {
          message: "Secure document execution links are generated from the packet workflow and are not exposed without a valid token."
        });
      }
      return true;

    default:
      return false;
  }
}

async function handleMessage(message) {
  const payload = message.payload || {};

  if (String(message.type || "").startsWith("CAREERS_")) {
    return handleCareersMessage(message);
  }

  switch (message.type) {
    case "HR_READY":
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

    case "INTRANET_NAVIGATE":
      openStaffPath(payload.path);
      return true;

    case "INTRANET_SIGN_OUT":
    case "INTRANET_SIGNOUT":
    case "STAFF_SIGNOUT_REQUEST":
      await signOut();
      return true;

    default:
      // Existing HR/Payroll/Badge/Crew messages remain owned by their current
      // backend integrations. This controller now directly owns Recruiting.
      return false;
  }
}

$w.onReady(function () {
  try {
    html = $w(EMBED_ID);
  } catch (error) {
    console.error(`[SuccessFactors] Missing HTML Component ${EMBED_ID}.`, error);
    return;
  }

  html.onMessage(async event => {
    const message = event?.data || {};
    if (!CHILD_SOURCES.has(message.source)) return;

    try {
      const handled = await handleMessage(message);
      if (!handled) {
        console.info(`[SuccessFactors] Passed through ${message.type || "UNKNOWN"} for existing HR/Payroll handlers.`);
      }
    } catch (error) {
      console.error(`[SuccessFactors] ${message.type || "UNKNOWN"} failed.`, error);
      const type = String(message.type || "").startsWith("CAREERS_")
        ? "CAREERS_ERROR"
        : "INTRANET_ERROR";
      post(type, {
        message: cleanError(error),
        stage: message.type || "UNKNOWN"
      });
    }
  });

  void bootstrap().catch(error => {
    console.error("[SuccessFactors] Initial bootstrap failed.", error);
    post("INTRANET_ERROR", {
      message: cleanError(error),
      stage: "INITIAL_BOOTSTRAP"
    });
  });
});

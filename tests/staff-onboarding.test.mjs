import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import * as validation from "../src/backend/SKANDI_CORE/platformValidation.js";

const source = await readFile(new URL("../src/backend/SKANDI_CORE/orgStructure.js", import.meta.url), "utf8");
const code = source.replace(/^import\s+[\s\S]*?;\s*$/gm, "").replace(/^export /gm, "");
const errorSource = await readFile(new URL("../src/backend/SKANDI_CORE/platformErrors.js", import.meta.url), "utf8");
const candidateId = "11111111-1111-1111-1111-111111111111";
const memberId = "22222222-2222-2222-2222-222222222222";
const staffRole = "33333333-3333-3333-3333-333333333333";
const salesRole = "44444444-4444-4444-4444-444444444444";

function fixture({ manage = true, taskStatus = "COMPLETE", candidateMember = null, accessRole = "SALES_AGENT", roleFailure = false } = {}) {
  let version = 0;
  const candidate = { id: candidateId, applicant_id: "CAND-SAMPLE", status: "HIRED", wix_member_id: candidateMember, first_name: "Test", last_name: "Hire", payload: {}, updated_at: "v0" };
  const employee = { id: "employee", sk_id: "SK1234", first_name: "Test", last_name: "Hire", corporate_email_address: "work@example.com", wix_member_id: memberId, active: true, authorized: true, portal_access: true, employment_status: "ONBOARDING", payload: {}, updated_at: "v0" };
  const assignment = { id: "assignment", role_id: "SALES-JOB", access_role: accessRole, permission_preset_id: "sales" };
  const granted = new Set();
  const audit = [];
  const context = vm.createContext({
    ...validation,
    requireStaffPortalSessionCore: async () => ({ isHr: manage, profile: { id: "reviewer" } }),
    auth: { elevate: handler => handler },
    members: { getMember: async id => ({ member: { _id: id, loginEmail: "work@example.com", status: "APPROVED" } }) },
    memberAuthentication: {},
    secrets: { getSecretValue: async () => ({ value: JSON.stringify({ SKANDI_STAFF: staffRole, SALES_AGENT: salesRole }) }) },
    authorization: {
      assignRole: async (roleId, id) => {
        assert.equal(id, memberId);
        if (roleFailure && roleId === salesRole) throw new Error("WIX_ROLE_FAILURE");
        granted.add(roleId);
      },
      removeRole: async roleId => { granted.delete(roleId); }
    },
    restRequest: async ({ table, method, query, body }) => {
      const data = {
        career_applicant_accounts: query?.id?.startsWith("neq.") ? null : candidate,
        agent_users: employee,
        org_employee_assignments: assignment,
        career_onboarding_tasks: { id: "task", status: taskStatus },
        org_access_roles: { restricted: false, preset_id: "sales" },
        org_job_roles: { role_id: "SALES-JOB" }
      }[table];
      if (method === "POST" && table === "career_audit_log") {
        audit.push(body.action);
        return [];
      }
      if (method === "PATCH") {
        if (query.updated_at && query.updated_at !== "eq." + data.updated_at) return [];
        Object.assign(data, structuredClone(body), { updated_at: `v${++version}` });
      }
      return data ? [structuredClone(data)] : [];
    }
  });
  vm.runInContext(errorSource.replace(/^import .+;$/gm, "").replace(/^export /gm, ""), context);
  vm.runInContext(code, context);
  return {
    run: () => context.completeRecruitingOnboardingCore({ candidateId, skId: employee.sk_id }),
    deactivate: () => context.setEmployeeActiveCore({ skId: employee.sk_id, active: false }),
    employee, candidate, granted, audit,
    clearFailure: () => { roleFailure = false; }
  };
}

test("HR completion links the existing member, grants the approved access role and can be retried", async () => {
  const state = fixture();
  assert.equal((await state.run()).accessRole, "SALES_AGENT");
  assert.equal(state.candidate.wix_member_id, memberId);
  assert.equal(state.employee.employment_status, "ACTIVE");
  assert.deepEqual([...state.granted], [staffRole, salesRole]);
  assert.equal((await state.run()).alreadyComplete, true);
  await state.deactivate();
  assert.equal(state.employee.employment_status, "INACTIVE");
  assert.equal(state.granted.size, 0);
});

test("non-HR, incomplete tasks, conflicting identities and restricted assignments grant no Wix role", async () => {
  for (const options of [
    { manage: false }, { taskStatus: "OPEN" }, { candidateMember: salesRole }, { accessRole: "OWNER" }
  ]) {
    const state = fixture(options);
    await assert.rejects(state.run());
    assert.equal(state.employee.employment_status, "ONBOARDING");
    assert.equal(state.granted.size, 0);
  }
});

test("a partial Wix response leaves the employee in onboarding and a retry reconciles the grant", async () => {
  const state = fixture({ roleFailure: true });
  await assert.rejects(state.run(), { code: "HR_ONBOARDING_WIX_ROLE_FAILED" });
  assert.equal(state.employee.employment_status, "ONBOARDING");
  assert.deepEqual([...state.granted], [staffRole]);
  state.clearFailure();
  await state.run();
  assert.equal(state.employee.employment_status, "ACTIVE");
  assert.deepEqual([...state.granted], [staffRole, salesRole]);
});

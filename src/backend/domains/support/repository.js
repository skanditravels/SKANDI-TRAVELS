import { sbInsert, sbSelect, sbUpdate, eq, order } from "backend/supabaseClient";

const CASES = "customer_support_cases";
const MESSAGES = "customer_support_messages";

export async function createSupportCase(data) {
  const rows = await sbInsert(CASES, data);
  return rows[0] || null;
}

export async function createSupportMessage(data) {
  const rows = await sbInsert(MESSAGES, data);
  return rows[0] || null;
}

export async function listCases(limit = 100) {
  return sbSelect(CASES, `select=*&${order("updated_at", "desc")}&limit=${limit}`);
}

export async function listCasesByMember(memberId, limit = 50) {
  return sbSelect(CASES, `select=*&${eq("member_id", memberId)}&${order("created_at", "desc")}&limit=${limit}`);
}

export async function getCaseByCaseId(caseId) {
  const rows = await sbSelect(CASES, `select=*&${eq("case_id", caseId)}&limit=1`);
  return rows[0] || null;
}

export async function listMessagesByCaseId(caseId) {
  return sbSelect(MESSAGES, `select=*&${eq("case_id", caseId)}&${order("created_at", "asc")}&limit=200`);
}

export async function updateCase(caseId, body) {
  const rows = await sbUpdate(CASES, eq("case_id", caseId), body);
  return rows[0] || null;
}

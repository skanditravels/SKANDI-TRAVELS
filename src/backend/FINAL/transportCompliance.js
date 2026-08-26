import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

async function config() {
  const [url, key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);
  return { url: String(url || "").replace(/\/$/, ""), key: String(key || "") };
}

async function sb(path, options = {}) {
  const { url, key } = await config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "get",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  if (!response.ok) throw new Error(`Compliance service error ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function listComplianceForSubject(subjectType, subjectId) {
  const rows = await sb(
    `compliance_records?subject_type=eq.${encodeURIComponent(subjectType)}` +
    `&subject_id=eq.${encodeURIComponent(subjectId)}`
  );
  return Array.isArray(rows) ? rows : [];
}

export async function upsertComplianceRecord(input = {}) {
  const record = {
    requirement_code: String(input.requirementCode || ""),
    subject_type: String(input.subjectType || ""),
    subject_id: String(input.subjectId || ""),
    status: String(input.status || "NOT_VERIFIED"),
    reference_number: input.referenceNumber || null,
    issued_at: input.issuedAt || null,
    expires_at: input.expiresAt || null,
    verified_at: input.verifiedAt || null,
    verified_by: input.verifiedBy || null,
    metadata: input.metadata || {}
  };

  if (!record.requirement_code || !record.subject_type || !record.subject_id) {
    throw new Error("Compliance requirement, subject type and subject ID are required.");
  }

  const result = await sb("compliance_records?on_conflict=requirement_code,subject_type,subject_id", {
    method: "post",
    body: record
  });

  return Array.isArray(result) ? result[0] : result;
}

export async function assertServiceCompliance({
  serviceDate,
  driverId,
  vehicleId,
  companyId,
  requirementCodes = []
} = {}) {
  const targetDate = String(serviceDate || "");
  const checks = [];

  for (const item of [
    ["DRIVER", driverId],
    ["VEHICLE", vehicleId],
    ["COMPANY", companyId]
  ]) {
    const [subjectType, subjectId] = item;
    if (!subjectId) continue;
    const rows = await listComplianceForSubject(subjectType, subjectId);

    for (const code of requirementCodes) {
      const record = rows.find((row) => row.requirement_code === code);
      const valid =
        Boolean(record) &&
        ["VERIFIED", "VALID"].includes(String(record.status || "")) &&
        (!record.expires_at || !targetDate || record.expires_at >= targetDate);

      checks.push({
        requirementCode: code,
        subjectType,
        subjectId,
        valid,
        status: record?.status || "MISSING",
        expiresAt: record?.expires_at || null
      });
    }
  }

  return {
    compliant: checks.every((check) => check.valid),
    checks
  };
}

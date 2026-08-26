import { webMethod, Permissions } from "wix-web-module";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";
import { issueDocument } from "backend/FINAL/documentEngine";

async function config() {
  const [url, key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);
  return { url: String(url || "").replace(/\/$/, ""), key: String(key || "") };
}

async function sb(path, options = {}) {
  const { url, key } = await config();
  if (!url || !key) throw new Error("Supabase is not configured.");

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

  if (!response.ok) {
    throw new Error(`Document Control ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const getDocumentControlBootstrap = webMethod(
  Permissions.SiteMember,
  async () => {
    const [instances, definitions, rules, events, compliance] = await Promise.all([
      sb("document_instances?order=updated_at.desc&limit=250"),
      sb("document_definitions?active=eq.true&order=category.asc,code.asc"),
      sb("document_rules?active=eq.true&order=priority.asc"),
      sb("document_events?order=occurred_at.desc&limit=250"),
      sb("compliance_records?order=expires_at.asc.nullslast&limit=500")
    ]);

    return {
      success: true,
      instances: Array.isArray(instances) ? instances : [],
      definitions: Array.isArray(definitions) ? definitions : [],
      rules: Array.isArray(rules) ? rules : [],
      events: Array.isArray(events) ? events : [],
      compliance: Array.isArray(compliance) ? compliance : []
    };
  }
);

export const listDocumentControlData = webMethod(
  Permissions.SiteMember,
  async ({ tab } = {}) => {
    const key = String(tab || "instances");
    const query = {
      instances: "document_instances?order=updated_at.desc&limit=500",
      definitions: "document_definitions?active=eq.true&order=category.asc,code.asc&limit=500",
      rules: "document_rules?active=eq.true&order=priority.asc&limit=500",
      events: "document_events?order=occurred_at.desc&limit=500",
      compliance: "compliance_records?order=expires_at.asc.nullslast&limit=1000"
    }[key];

    if (!query) throw new Error("Unsupported Document Control tab.");
    const rows = await sb(query);
    return { success: true, tab: key, rows: Array.isArray(rows) ? rows : [] };
  }
);

export const issueControlledDocument = webMethod(
  Permissions.SiteMember,
  async ({ documentId, issuedBy } = {}) => {
    return {
      success: true,
      document: await issueDocument(String(documentId || ""), String(issuedBy || ""))
    };
  }
);

export const getDocumentViewerPayload = webMethod(
  Permissions.SiteMember,
  async ({ documentId } = {}) => {
    const instances = await sb(`document_instances?id=eq.${encodeURIComponent(String(documentId || ""))}&limit=1`);
    const instance = Array.isArray(instances) ? instances[0] : null;
    if (!instance) throw new Error("Document not found.");

    const definitions = await sb(
      `document_definitions?code=eq.${encodeURIComponent(instance.document_code)}&limit=1`
    );
    const definition = Array.isArray(definitions) ? definitions[0] : null;

    return { success: true, instance, definition };
  }
);

export const getTransportComplianceBootstrap = webMethod(
  Permissions.SiteMember,
  async () => {
    const [records, requirements] = await Promise.all([
      sb("compliance_records?order=subject_type.asc,subject_id.asc"),
      sb("compliance_requirements?active=eq.true&order=jurisdiction.asc,requirement_code.asc")
    ]);

    const subjects = [];
    const seen = new Set();

    for (const record of Array.isArray(records) ? records : []) {
      const key = `${record.subject_type}:${record.subject_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      subjects.push({
        type: record.subject_type,
        id: record.subject_id,
        name: record.metadata?.display_name || record.subject_id,
        station: record.metadata?.station_code || "",
        dispatchBlocked: false
      });
    }

    return {
      success: true,
      subjects,
      records: Array.isArray(records) ? records : [],
      requirements: (Array.isArray(requirements) ? requirements : []).map(r => ({
        code: r.requirement_code,
        name: r.name,
        authority: r.authority,
        jurisdiction: r.jurisdiction,
        applicability: r.applicability
      }))
    };
  }
);

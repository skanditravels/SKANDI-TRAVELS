import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function supabaseConfig() {
  const [url, key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);

  return {
    url: String(url || "").replace(/\/$/, ""),
    key: String(key || "")
  };
}

async function sb(path, { method = "get", body, prefer = "return=representation" } = {}) {
  const { url, key } = await supabaseConfig();

  if (!url || !key) {
    throw new Error("Document Engine: Supabase is not configured.");
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: prefer
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Document Engine Supabase error ${response.status}: ${detail.slice(0, 500)}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function getPath(source, path) {
  if (!path) return undefined;
  return String(path)
    .split(".")
    .reduce((value, key) => {
      if (value === undefined || value === null) return undefined;
      return value[key];
    }, source);
}

function conditionsMatch(conditions, context) {
  for (const condition of Array.isArray(conditions) ? conditions : []) {
    const actual = getPath(context, condition.path);
    const op = condition.op || "EQ";
    const expected = condition.value;

    if (op === "EQ" && actual !== expected) return false;
    if (op === "NE" && actual === expected) return false;
    if (op === "IN" && (!Array.isArray(expected) || !expected.includes(actual))) return false;
    if (op === "EXISTS" && (actual === undefined || actual === null || actual === "")) return false;
  }
  return true;
}

function mergeDeep(target, source) {
  const out = { ...asObject(target) };

  for (const [key, value] of Object.entries(asObject(source))) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = mergeDeep(out[key], value);
    } else {
      out[key] = value;
    }
  }

  return out;
}

function documentNumber(code, stationCode = "GLOBAL") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${code}-${String(stationCode || "GLOBAL").toUpperCase()}-${date}-${random}`;
}

async function rulesForEvent(eventType) {
  return await sb(
    `document_rules?event_type=eq.${encodeURIComponent(eventType)}&active=eq.true&order=priority.asc`
  );
}

async function mappingsForDocument(documentCode) {
  return await sb(
    `document_field_mappings?document_code=eq.${encodeURIComponent(documentCode)}&active=eq.true`
  );
}

function mappedPayload(mappings, context) {
  const payload = {};

  for (const mapping of Array.isArray(mappings) ? mappings : []) {
    const value = getPath(context, mapping.source_path);

    if (value !== undefined) {
      payload[mapping.field_name] = value;
    }
  }

  return payload;
}

async function existingDocument(rule, event) {
  const filters = [
    `document_code=eq.${encodeURIComponent(rule.document_code)}`,
    "status=not.in.(CANCELLED,ARCHIVED,SUPERSEDED)"
  ];

  if (rule.scope === "BOOKING" && event.bookingId) {
    filters.push(`booking_id=eq.${encodeURIComponent(event.bookingId)}`);
  } else if (rule.scope === "TRAVELER" && event.travelerId) {
    filters.push(`traveler_id=eq.${encodeURIComponent(event.travelerId)}`);
  } else if (rule.scope === "SERVICE" && event.serviceId) {
    filters.push(`service_id=eq.${encodeURIComponent(event.serviceId)}`);
  } else {
    return null;
  }

  const rows = await sb(`document_instances?${filters.join("&")}&order=version.desc&limit=1`);
  return Array.isArray(rows) ? rows[0] : null;
}

async function createDocument(rule, event, payload) {
  const row = {
    document_number: documentNumber(rule.document_code, event.stationCode),
    document_code: rule.document_code,
    booking_id: event.bookingId || null,
    traveler_id: event.travelerId || null,
    service_id: event.serviceId || null,
    supplier_id: event.supplierId || null,
    driver_id: event.driverId || null,
    vehicle_id: event.vehicleId || null,
    contract_id: event.contractId || null,
    incident_id: event.incidentId || null,
    station_code: event.stationCode || null,
    status: rule.auto_issue ? "ISSUED" : "DRAFT",
    live_payload: payload,
    issued_payload: rule.auto_issue ? payload : null,
    source_event_ids: event.eventId ? [event.eventId] : [],
    generated_at: new Date().toISOString(),
    issued_at: rule.auto_issue ? new Date().toISOString() : null
  };

  const inserted = await sb("document_instances", { method: "post", body: row });
  return Array.isArray(inserted) ? inserted[0] : inserted;
}

async function updateDocument(existing, rule, event, payload) {
  const merged = mergeDeep(existing.live_payload, payload);
  const sourceIds = Array.from(
    new Set([...(existing.source_event_ids || []), ...(event.eventId ? [event.eventId] : [])])
  );

  const patch = {
    live_payload: merged,
    source_event_ids: sourceIds,
    driver_id: event.driverId || existing.driver_id,
    vehicle_id: event.vehicleId || existing.vehicle_id,
    supplier_id: event.supplierId || existing.supplier_id,
    updated_at: new Date().toISOString()
  };

  if (existing.status === "ISSUED") {
    patch.version = Number(existing.version || 1) + 1;
    patch.status = "DRAFT";
    patch.issued_payload = existing.issued_payload;
  }

  const updated = await sb(
    `document_instances?id=eq.${encodeURIComponent(existing.id)}`,
    { method: "patch", body: patch }
  );

  return Array.isArray(updated) ? updated[0] : updated;
}

async function saveEvent(event) {
  const eventKey = String(event.eventKey || `EVT-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const inserted = await sb("document_events", {
    method: "post",
    body: {
      event_key: eventKey,
      event_type: event.type,
      booking_id: event.bookingId || null,
      traveler_id: event.travelerId || null,
      service_id: event.serviceId || null,
      supplier_id: event.supplierId || null,
      driver_id: event.driverId || null,
      vehicle_id: event.vehicleId || null,
      contract_id: event.contractId || null,
      incident_id: event.incidentId || null,
      station_code: event.stationCode || null,
      event_payload: asObject(event.context),
      occurred_at: event.occurredAt || new Date().toISOString(),
      processing_status: "PROCESSING"
    }
  });

  return Array.isArray(inserted) ? inserted[0] : inserted;
}

export async function emitDocumentEvent(input = {}) {
  const event = {
    eventKey: input.eventKey,
    type: String(input.type || ""),
    bookingId: input.bookingId || "",
    travelerId: input.travelerId || "",
    serviceId: input.serviceId || "",
    supplierId: input.supplierId || "",
    driverId: input.driverId || "",
    vehicleId: input.vehicleId || "",
    contractId: input.contractId || "",
    incidentId: input.incidentId || "",
    stationCode: input.stationCode || "",
    occurredAt: input.occurredAt,
    context: asObject(input.context)
  };

  if (!event.type) throw new Error("Document event type is required.");

  const saved = await saveEvent(event);
  event.eventId = saved.id;

  try {
    const rules = await rulesForEvent(event.type);
    const results = [];

    for (const rule of Array.isArray(rules) ? rules : []) {
      if (!conditionsMatch(rule.conditions, event.context)) continue;

      const mappings = await mappingsForDocument(rule.document_code);
      const payload = mergeDeep(
        {
          meta: {
            eventType: event.type,
            bookingId: event.bookingId || null,
            travelerId: event.travelerId || null,
            serviceId: event.serviceId || null,
            stationCode: event.stationCode || null,
            updatedAt: new Date().toISOString()
          }
        },
        mappedPayload(mappings, event.context)
      );

      let document;

      if (["CREATE_OR_UPDATE", "UPDATE_LINKED"].includes(rule.mode)) {
        const existing = await existingDocument(rule, event);
        document = existing
          ? await updateDocument(existing, rule, event, payload)
          : await createDocument(rule, event, payload);
      } else {
        document = await createDocument(rule, event, payload);
      }

      results.push({
        rule: rule.rule_key,
        documentId: document?.id,
        documentNumber: document?.document_number,
        status: document?.status
      });
    }

    await sb(
      `document_events?id=eq.${encodeURIComponent(saved.id)}`,
      {
        method: "patch",
        body: {
          processing_status: "PROCESSED",
          processed_at: new Date().toISOString()
        }
      }
    );

    return { success: true, eventId: saved.id, documents: results };
  } catch (error) {
    await sb(
      `document_events?id=eq.${encodeURIComponent(saved.id)}`,
      {
        method: "patch",
        body: {
          processing_status: "ERROR",
          processing_error: String(error?.message || error).slice(0, 1000),
          processed_at: new Date().toISOString()
        }
      }
    );
    throw error;
  }
}

export async function issueDocument(documentId, issuedBy = "") {
  const rows = await sb(`document_instances?id=eq.${encodeURIComponent(documentId)}&limit=1`);
  const document = Array.isArray(rows) ? rows[0] : null;
  if (!document) throw new Error("Document not found.");

  const payload = asObject(document.live_payload);
  const version = Number(document.version || 1);

  await sb("document_versions", {
    method: "post",
    body: {
      document_id: document.id,
      version,
      payload,
      reason: "ISSUED",
      created_by: issuedBy || null
    }
  });

  const updated = await sb(
    `document_instances?id=eq.${encodeURIComponent(document.id)}`,
    {
      method: "patch",
      body: {
        status: "ISSUED",
        issued_payload: payload,
        issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  );

  return Array.isArray(updated) ? updated[0] : updated;
}

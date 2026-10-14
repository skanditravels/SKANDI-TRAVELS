// /src/backend/SKANDI_CORE/documentFiller.js
// V12 customer-owned Document Filler domain service.
// Reuses canonical documentControl ownership checks before any document-instance mutation.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import {
  listMyBookingDocumentsCore,
  acknowledgeCustomerDocumentCore
} from "backend/SKANDI_CORE/documentControl";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
function first(value) {
  return Array.isArray(value) ? value[0] || null : value || null;
}
function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
async function ownedDocument(bookingId, documentId) {
  const id = clean(documentId, 100);
  if (!id) throw new SkandiError("DOCUMENT_ID_REQUIRED");
  const result = await listMyBookingDocumentsCore({ bookingId });
  const document = (result.documents || []).find(row => String(row.id) === id);
  if (!document) throw new SkandiError("DOCUMENT_NOT_FOUND_OR_NOT_ACCESSIBLE");
  return document;
}
async function definitionFor(document) {
  const code = clean(document?.document_code, 80).toUpperCase();
  if (!code) throw new SkandiError("DOCUMENT_DEFINITION_CODE_MISSING");
  return first(await restRequest({
    table: "document_definitions",
    query: { select: "*", code: `eq.${code}`, active: "eq.true", limit: 1 }
  }));
}
function requiredFieldNames(definition = {}) {
  const schema = definition.field_schema;
  if (Array.isArray(schema)) return schema.filter(x => x?.required === true).map(x => clean(x.name || x.id, 120)).filter(Boolean);
  if (schema && typeof schema === "object") {
    if (Array.isArray(schema.required)) return schema.required.map(x => clean(x, 120)).filter(Boolean);
    const properties = object(schema.properties);
    return Object.entries(properties).filter(([, value]) => value?.required === true).map(([key]) => key);
  }
  return [];
}
function assertEditable(document) {
  const status = clean(document?.status, 80).toUpperCase();
  if (["ISSUED", "ACKNOWLEDGED", "SUPERSEDED", "ARCHIVED", "CANCELLED"].includes(status)) {
    throw new SkandiError("DOCUMENT_INSTANCE_NOT_EDITABLE");
  }
}

export async function getDocumentFillerPayloadCore({ bookingId, documentId } = {}) {
  const document = await ownedDocument(bookingId, documentId);
  const definition = await definitionFor(document);
  const mappings = await restRequest({
    table: "document_field_mappings",
    query: { select: "*", document_code: `eq.${clean(document.document_code, 80)}`, active: "eq.true", limit: 1000 }
  });
  return {
    ok: true,
    instance: document,
    definition,
    fieldMappings: mappings,
    editable: !["ISSUED", "ACKNOWLEDGED", "SUPERSEDED", "ARCHIVED", "CANCELLED"].includes(clean(document.status, 80).toUpperCase())
  };
}

export async function saveDocumentFillerDraftCore({ bookingId, documentId, fields = {} } = {}) {
  const document = await ownedDocument(bookingId, documentId);
  assertEditable(document);
  const now = new Date().toISOString();
  const livePayload = {
    ...object(document.live_payload),
    fields: {
      ...object(object(document.live_payload).fields),
      ...object(fields)
    }
  };
  const updated = await restRequest({
    table: "document_instances",
    method: "PATCH",
    query: { id: `eq.${clean(document.id, 100)}` },
    body: { live_payload: livePayload, status: "DRAFT", updated_at: now }
  });
  return { ok: true, instance: first(updated), message: "Document draft saved." };
}

export async function submitDocumentFillerCore({ bookingId, documentId, fields = {} } = {}) {
  const document = await ownedDocument(bookingId, documentId);
  assertEditable(document);
  const definition = await definitionFor(document);
  const mergedFields = {
    ...object(object(document.live_payload).fields),
    ...object(fields)
  };
  const missing = requiredFieldNames(definition).filter(name => {
    const value = mergedFields[name];
    return value === undefined || value === null || String(value).trim() === "";
  });
  if (missing.length) {
    throw new SkandiError("DOCUMENT_REQUIRED_FIELDS_MISSING", `Required fields missing: ${missing.join(", ")}`);
  }
  const now = new Date().toISOString();
  const updated = await restRequest({
    table: "document_instances",
    method: "PATCH",
    query: { id: `eq.${clean(document.id, 100)}` },
    body: {
      live_payload: { ...object(document.live_payload), fields: mergedFields },
      status: "READY",
      updated_at: now
    }
  });
  return { ok: true, instance: first(updated), message: "Document submitted for the next controlled-document step." };
}

export async function acknowledgeDocumentFillerCore({ bookingId, documentId } = {}) {
  return acknowledgeCustomerDocumentCore({ bookingId, documentId });
}

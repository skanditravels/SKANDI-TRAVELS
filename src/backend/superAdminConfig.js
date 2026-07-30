export const HTML_SOURCE = "SKANDI_SUPER_ADMIN_CONTROL";
export const PARENT_SOURCE = "SKANDI_WIX_PARENT";

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
export const MAX_AUDIT_ROWS = 200;
export const MIN_REASON_LENGTH = 10;

export const ALLOWED_FILTER_OPERATORS = new Set([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "is"
]);

// Audit history is append-only. It remains readable in the console.
export const PROTECTED_MUTATION_TABLES = new Set([
  "admin_audit_logs"
]);

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SENSITIVE_COLUMN_RE =
  /(^|_)(password|passwd|secret|token|api_?key|private_?key|access_?key|refresh_?token|card_?number|cvv|cvc|ssn|social_?security|tax_?id|bank_?account|routing_?number|passport_?number)($|_)/i;

const SENSITIVE_PAYLOAD_TABLE_RE =
  /(secret|payment|wallet|tax|document|passport|credential|integration)/i;

export function assertIdentifier(value, label = "identifier") {
  const normalized = String(value || "").trim();
  if (!IDENTIFIER_RE.test(normalized)) {
    const error = new Error(`Invalid ${label}.`);
    error.code = "INVALID_IDENTIFIER";
    throw error;
  }
  return normalized;
}

export function assertStorageIdentifier(value, label = "Storage identifier") {
  const normalized = String(value || "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(normalized)) {
    const error = new Error(`Invalid ${label}.`);
    error.code = "INVALID_IDENTIFIER";
    throw error;
  }
  return normalized;
}

export function assertUuid(value, label = "UUID") {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      normalized
    )
  ) {
    const error = new Error(`Invalid ${label}.`);
    error.code = "INVALID_IDENTIFIER";
    throw error;
  }
  return normalized;
}

export function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function normalizeOperation(value) {
  const operation = String(value || "").trim().toLowerCase();
  if (!["insert", "update", "delete"].includes(operation)) {
    const error = new Error("Unsupported database operation.");
    error.code = "INVALID_OPERATION";
    throw error;
  }
  return operation;
}

export function expectedMutationConfirmation(operation, table) {
  if (operation === "insert") return `INSERT ${table}`;
  if (operation === "update") return `OVERRIDE ${table}`;
  return `DELETE ${table}`;
}

export function requireReason(value) {
  const reason = String(value || "").trim();
  if (reason.length < MIN_REASON_LENGTH) {
    const error = new Error(
      `An audit reason of at least ${MIN_REASON_LENGTH} characters is required.`
    );
    error.code = "AUDIT_REASON_REQUIRED";
    throw error;
  }
  return reason.slice(0, 1000);
}

export function isSensitiveColumn(table, column) {
  const tableName = String(table || "");
  const columnName = String(column || "");

  if (SENSITIVE_COLUMN_RE.test(columnName)) return true;
  if (
    SENSITIVE_PAYLOAD_TABLE_RE.test(tableName) &&
    /^(payload|raw_payload|metadata|provider_payload|request_body|response_body)$/i.test(
      columnName
    )
  ) {
    return true;
  }
  return false;
}

export function redactValue(value) {
  if (value === null || value === undefined) return value;
  return "[REDACTED]";
}

export function publicError(error) {
  const code = String(error?.code || "SUPER_ADMIN_ERROR");
  const allowedMessages = new Set([
    "SUPER_ADMIN_FORBIDDEN",
    "SUPER_ADMIN_NOT_SIGNED_IN",
    "INVALID_IDENTIFIER",
    "INVALID_OPERATION",
    "AUDIT_REASON_REQUIRED",
    "TABLE_NOT_FOUND",
    "TABLE_NOT_ALLOWED",
    "TABLE_PROTECTED",
    "PRIMARY_KEY_REQUIRED",
    "CONFIRMATION_MISMATCH",
    "INVALID_FILTER",
    "INVALID_RECORD",
    "SECRET_CONFIGURATION_MISSING",
    "SUPABASE_REQUEST_FAILED"
  ]);

  return {
    code: allowedMessages.has(code) ? code : "SUPER_ADMIN_ERROR",
    message:
      allowedMessages.has(code) && error?.message
        ? String(error.message)
        : "The super-admin request could not be completed."
  };
}

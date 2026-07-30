import {
  ALLOWED_FILTER_OPERATORS,
  DEFAULT_PAGE_SIZE,
  MAX_AUDIT_ROWS,
  MAX_PAGE_SIZE,
  PROTECTED_MUTATION_TABLES,
  assertIdentifier,
  assertStorageIdentifier,
  assertUuid,
  clampInteger,
  expectedMutationConfirmation,
  isSensitiveColumn,
  normalizeOperation,
  redactValue,
  requireReason
} from "backend/SUPERADMIN/superAdminConfig";
import {
  callAdminRpc,
  getRuntimeConfig,
  supabaseAdminRequest
} from "backend/SUPERADMIN/supabaseAdminServer";

const CATALOG_TTL_MS = 60 * 1000;
let catalogCache = null;
let catalogExpiresAt = 0;

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  if (value && Array.isArray(value.tables)) return value.tables;
  return [];
}

function normalizeCatalogEntry(entry) {
  const table = String(entry?.table || entry?.name || "").replace(/^public\./, "");
  const columns = asArray(entry?.columns).map((column) => ({
    name: String(column?.name || ""),
    dataType: String(column?.dataType || column?.data_type || "text"),
    nullable: Boolean(column?.nullable),
    default: column?.default ?? null,
    identity: Boolean(column?.identity),
    generated: Boolean(column?.generated),
    sensitive:
      Boolean(column?.sensitive) ||
      isSensitiveColumn(table, String(column?.name || ""))
  }));

  return {
    schema: "public",
    table,
    estimatedRows: Number(entry?.estimatedRows || entry?.estimated_rows || 0),
    rlsEnabled: Boolean(entry?.rlsEnabled ?? entry?.rls_enabled),
    policyCount: Number(entry?.policyCount || entry?.policy_count || 0),
    primaryKey: asArray(entry?.primaryKey || entry?.primary_key).map(String),
    columns
  };
}

function summaryCatalogEntry(entry) {
  return {
    schema: entry.schema,
    table: entry.table,
    estimatedRows: entry.estimatedRows,
    rlsEnabled: entry.rlsEnabled,
    policyCount: entry.policyCount,
    primaryKey: entry.primaryKey,
    columnCount: entry.columns.length,
    hasSensitiveColumns: entry.columns.some((column) => column.sensitive)
  };
}

export async function getCatalog({ force = false } = {}) {
  if (!force && catalogCache && Date.now() < catalogExpiresAt) {
    return catalogCache;
  }

  const raw = await callAdminRpc("super_admin_catalog");
  const catalog = asArray(raw)
    .map(normalizeCatalogEntry)
    .filter((entry) => entry.table)
    .sort((a, b) => a.table.localeCompare(b.table));

  catalogCache = catalog;
  catalogExpiresAt = Date.now() + CATALOG_TTL_MS;
  return catalog;
}

async function assertTableAccess(tableName, { mutation = false } = {}) {
  const table = assertIdentifier(tableName, "table name");
  const [catalog, config] = await Promise.all([getCatalog(), getRuntimeConfig()]);
  const entry = catalog.find((item) => item.table === table);

  if (!entry) {
    const error = new Error(`Table public.${table} was not found.`);
    error.code = "TABLE_NOT_FOUND";
    throw error;
  }

  if (
    config.blockedTables.has(table) ||
    (config.allowedTables.size > 0 && !config.allowedTables.has(table))
  ) {
    const error = new Error(`Table public.${table} is not enabled for this console.`);
    error.code = "TABLE_NOT_ALLOWED";
    throw error;
  }

  if (mutation && PROTECTED_MUTATION_TABLES.has(table)) {
    const error = new Error(`Table public.${table} is append-only.`);
    error.code = "TABLE_PROTECTED";
    throw error;
  }

  return entry;
}

function redactRow(table, row, columns) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const columnMap = new Map(columns.map((column) => [column.name, column]));

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      const column = columnMap.get(key);
      return [
        key,
        column?.sensitive || isSensitiveColumn(table, key)
          ? redactValue(value)
          : value
      ];
    })
  );
}

function parseContentRange(contentRange) {
  const match = String(contentRange || "").match(/\/(\d+|\*)$/);
  return match && match[1] !== "*" ? Number(match[1]) : null;
}

function normalizeFilter(filter, entry) {
  if (!filter || !filter.column || filter.value === undefined) return null;

  const column = assertIdentifier(filter.column, "filter column");
  if (!entry.columns.some((item) => item.name === column)) {
    const error = new Error("The selected filter column does not exist.");
    error.code = "INVALID_FILTER";
    throw error;
  }

  const operator = String(filter.operator || "eq").toLowerCase();
  if (!ALLOWED_FILTER_OPERATORS.has(operator)) {
    const error = new Error("The selected filter operator is not allowed.");
    error.code = "INVALID_FILTER";
    throw error;
  }

  let value = String(filter.value);
  if (["like", "ilike"].includes(operator) && !/[*%]/.test(value)) {
    value = `*${value}*`;
  }

  return { column, operator, value };
}

function normalizeOrder(order, entry) {
  const fallback =
    entry.primaryKey[0] ||
    entry.columns.find((column) => column.name === "created_at")?.name ||
    entry.columns[0]?.name;

  const column = assertIdentifier(order?.column || fallback, "sort column");
  if (!entry.columns.some((item) => item.name === column)) {
    const error = new Error("The selected sort column does not exist.");
    error.code = "INVALID_FILTER";
    throw error;
  }

  const direction =
    String(order?.direction || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  return { column, direction };
}

export async function loadTableRows(input = {}) {
  const entry = await assertTableAccess(input.table);
  const page = clampInteger(input.page, 1, 1000000, 1);
  const pageSize = clampInteger(
    input.pageSize,
    1,
    MAX_PAGE_SIZE,
    DEFAULT_PAGE_SIZE
  );
  const offset = (page - 1) * pageSize;
  const filter = normalizeFilter(input.filter, entry);
  const order = normalizeOrder(input.order, entry);

  const query = {
    select: "*",
    limit: pageSize,
    offset,
    order: `${order.column}.${order.direction}.nullslast`
  };

  if (filter) query[filter.column] = `${filter.operator}.${filter.value}`;

  const response = await supabaseAdminRequest(
    `/rest/v1/${encodeURIComponent(entry.table)}`,
    {
      query,
      prefer: "count=exact",
      includeResponseHeaders: true
    }
  );

  const rawRows = Array.isArray(response.data) ? response.data : [];
  return {
    table: entry.table,
    page,
    pageSize,
    total: parseContentRange(response.headers.contentRange),
    primaryKey: entry.primaryKey,
    columns: entry.columns,
    rows: rawRows.map((row) => redactRow(entry.table, row, entry.columns))
  };
}

function cleanMutationRecord(entry, record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    const error = new Error("The record must be a JSON object.");
    error.code = "INVALID_RECORD";
    throw error;
  }

  const knownColumns = new Map(
    entry.columns.map((column) => [column.name, column])
  );
  const clean = {};

  for (const [rawKey, value] of Object.entries(record)) {
    const key = assertIdentifier(rawKey, "record column");
    const column = knownColumns.get(key);

    if (!column) {
      const error = new Error(`Column ${key} does not exist on ${entry.table}.`);
      error.code = "INVALID_RECORD";
      throw error;
    }
    if (column.generated || column.sensitive) continue;
    if (value === "[REDACTED]") continue;
    clean[key] = value;
  }

  return clean;
}

function cleanPrimaryKey(entry, primaryKey) {
  if (
    !primaryKey ||
    typeof primaryKey !== "object" ||
    Array.isArray(primaryKey)
  ) {
    const error = new Error("A primary-key object is required.");
    error.code = "PRIMARY_KEY_REQUIRED";
    throw error;
  }

  const clean = {};
  for (const column of entry.primaryKey) {
    if (!Object.prototype.hasOwnProperty.call(primaryKey, column)) {
      const error = new Error(`Primary-key value ${column} is required.`);
      error.code = "PRIMARY_KEY_REQUIRED";
      throw error;
    }
    clean[column] = primaryKey[column];
  }
  return clean;
}

export async function mutateTableRecord(input = {}, actor) {
  const operation = normalizeOperation(input.operation);
  const entry = await assertTableAccess(input.table, { mutation: true });
  const reason = requireReason(input.reason);
  const expected = expectedMutationConfirmation(operation, entry.table);

  if (String(input.confirmation || "").trim() !== expected) {
    const error = new Error(`Type "${expected}" to confirm this operation.`);
    error.code = "CONFIRMATION_MISMATCH";
    throw error;
  }

  if (["update", "delete"].includes(operation) && entry.primaryKey.length === 0) {
    const error = new Error(
      "This table has no primary key, so update and delete are disabled."
    );
    error.code = "PRIMARY_KEY_REQUIRED";
    throw error;
  }

  const primaryKey =
    operation === "insert" ? {} : cleanPrimaryKey(entry, input.primaryKey);
  const record =
    operation === "delete" ? {} : cleanMutationRecord(entry, input.record);

  if (operation !== "delete" && Object.keys(record).length === 0) {
    const error = new Error("No writable record fields were supplied.");
    error.code = "INVALID_RECORD";
    throw error;
  }

  const result = await callAdminRpc("super_admin_mutate", {
    p_table: entry.table,
    p_operation: operation,
    p_primary_key: primaryKey,
    p_record: record,
    p_actor: actor.id,
    p_reason: reason,
    p_confirmation: expected
  });

  catalogExpiresAt = 0;
  return result;
}

function sanitizeAuditRow(row) {
  const target = String(row?.target_resource || row?.target_member || "");
  const table = target.split(":")[0].replace(/^public\./, "");
  const scrubRecord = (container) => {
    if (!container || typeof container !== "object") return container;
    const copy = { ...container };
    if (copy.record && typeof copy.record === "object") {
      copy.record = Object.fromEntries(
        Object.entries(copy.record).map(([key, value]) => [
          key,
          isSensitiveColumn(table, key) ? redactValue(value) : value
        ])
      );
    }
    return copy;
  };

  return {
    ...row,
    old_value: scrubRecord(row?.old_value),
    new_value: scrubRecord(row?.new_value)
  };
}

export async function loadAuditLog(input = {}) {
  const limit = clampInteger(input.limit, 1, MAX_AUDIT_ROWS, 100);
  const query = {
    select:
      "id,log_id,timestamp,admin_id,target_member,target_resource,action_performed,old_value,new_value,created_at",
    order: "created_at.desc",
    limit
  };

  if (input.action) {
    query.action_performed = `eq.${String(input.action).toUpperCase()}`;
  }

  const rows = await supabaseAdminRequest("/rest/v1/admin_audit_logs", {
    query
  });
  return (Array.isArray(rows) ? rows : []).map(sanitizeAuditRow);
}

async function logExternalAdminEvent({
  actor,
  action,
  target,
  reason,
  oldValue = null,
  newValue = null
}) {
  return callAdminRpc("super_admin_log_event", {
    p_actor: actor.id,
    p_action: action,
    p_target: target,
    p_reason: requireReason(reason),
    p_old_value: oldValue,
    p_new_value: newValue
  });
}

function sanitizeAuthUser(user) {
  if (!user || typeof user !== "object") return user;
  const copy = { ...user };
  delete copy.encrypted_password;
  delete copy.confirmation_token;
  delete copy.recovery_token;
  delete copy.email_change_token_new;
  delete copy.email_change_token_current;
  delete copy.reauthentication_token;
  return copy;
}

export async function listAuthUsers(input = {}) {
  const page = clampInteger(input.page, 1, 100000, 1);
  const perPage = clampInteger(input.perPage, 1, 100, 50);
  const response = await supabaseAdminRequest("/auth/v1/admin/users", {
    query: { page, per_page: perPage },
    includeResponseHeaders: true
  });

  const payload = response.data || {};
  return {
    page,
    perPage,
    users: asArray(payload.users || payload).map(sanitizeAuthUser),
    total:
      Number(response.headers.totalCount) ||
      Number(payload.total) ||
      Number(payload.total_count) ||
      null
  };
}

export async function mutateAuthUser(input = {}, actor) {
  const action = String(input.action || "").trim().toLowerCase();
  const userId =
    action === "invite"
      ? ""
      : assertUuid(input.userId, "Auth user ID");
  const reason = requireReason(input.reason);
  let expected;
  let result;
  let target;

  if (action === "invite") {
    const email = String(input.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const error = new Error("A valid invitation email is required.");
      error.code = "INVALID_RECORD";
      throw error;
    }
    expected = `INVITE ${email}`;
    target = `auth:${email}`;
    if (String(input.confirmation || "").trim() !== expected) {
      const error = new Error(`Type "${expected}" to confirm this operation.`);
      error.code = "CONFIRMATION_MISMATCH";
      throw error;
    }
    result = await supabaseAdminRequest("/auth/v1/invite", {
      method: "POST",
      body: {
        email,
        data:
          input.userMetadata &&
          typeof input.userMetadata === "object" &&
          !Array.isArray(input.userMetadata)
            ? input.userMetadata
            : {}
      }
    });
  } else {
    target = `auth:${userId}`;
    if (action === "ban") expected = `BAN USER ${userId}`;
    else if (action === "unban") expected = `UNBAN USER ${userId}`;
    else if (action === "set_app_metadata") expected = `UPDATE USER ${userId}`;
    else if (action === "delete") expected = `DELETE USER ${userId}`;
    else {
      const error = new Error("Unsupported Auth admin operation.");
      error.code = "INVALID_OPERATION";
      throw error;
    }

    if (String(input.confirmation || "").trim() !== expected) {
      const error = new Error(`Type "${expected}" to confirm this operation.`);
      error.code = "CONFIRMATION_MISMATCH";
      throw error;
    }

    if (action === "delete") {
      result = await supabaseAdminRequest(
        `/auth/v1/admin/users/${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
    } else {
      const body =
        action === "ban"
          ? { ban_duration: "876000h" }
          : action === "unban"
            ? { ban_duration: "none" }
            : {
                app_metadata:
                  input.appMetadata &&
                  typeof input.appMetadata === "object" &&
                  !Array.isArray(input.appMetadata)
                    ? input.appMetadata
                    : {}
              };
      result = await supabaseAdminRequest(
        `/auth/v1/admin/users/${encodeURIComponent(userId)}`,
        { method: "PUT", body }
      );
    }
  }

  await logExternalAdminEvent({
    actor,
    action: `AUTH_${action.toUpperCase()}`,
    target,
    reason,
    newValue: sanitizeAuthUser(result)
  });

  return sanitizeAuthUser(result);
}

export async function listStorageBuckets() {
  const buckets = await supabaseAdminRequest("/storage/v1/bucket");
  return asArray(buckets);
}

export async function listStorageObjects(input = {}) {
  const bucketId = assertStorageIdentifier(input.bucketId, "bucket ID");
  const limit = clampInteger(input.limit, 1, 100, 50);
  const offset = clampInteger(input.offset, 0, 1000000, 0);
  const prefix = String(input.prefix || "").replace(/^\/+/, "").slice(0, 500);

  const objects = await supabaseAdminRequest(
    `/storage/v1/object/list/${encodeURIComponent(bucketId)}`,
    {
      method: "POST",
      body: {
        prefix,
        limit,
        offset,
        sortBy: { column: "name", order: "asc" }
      }
    }
  );

  return { bucketId, prefix, limit, offset, objects: asArray(objects) };
}

export async function mutateStorage(input = {}, actor) {
  const action = String(input.action || "").trim().toLowerCase();
  const reason = requireReason(input.reason);
  let expected;
  let result;
  let target;

  if (action === "create_bucket") {
    const bucketId = assertStorageIdentifier(input.bucketId, "bucket ID");
    expected = `CREATE BUCKET ${bucketId}`;
    target = `storage:${bucketId}`;
    if (String(input.confirmation || "").trim() !== expected) {
      const error = new Error(`Type "${expected}" to confirm this operation.`);
      error.code = "CONFIRMATION_MISMATCH";
      throw error;
    }
    result = await supabaseAdminRequest("/storage/v1/bucket", {
      method: "POST",
      body: {
        id: bucketId,
        name: bucketId,
        public: Boolean(input.public),
        file_size_limit: input.fileSizeLimit || null,
        allowed_mime_types: Array.isArray(input.allowedMimeTypes)
          ? input.allowedMimeTypes
          : null
      }
    });
  } else if (action === "delete_bucket") {
    const bucketId = assertStorageIdentifier(input.bucketId, "bucket ID");
    expected = `DELETE BUCKET ${bucketId}`;
    target = `storage:${bucketId}`;
    if (String(input.confirmation || "").trim() !== expected) {
      const error = new Error(`Type "${expected}" to confirm this operation.`);
      error.code = "CONFIRMATION_MISMATCH";
      throw error;
    }
    result = await supabaseAdminRequest(
      `/storage/v1/bucket/${encodeURIComponent(bucketId)}`,
      { method: "DELETE" }
    );
  } else if (action === "delete_object") {
    const bucketId = assertStorageIdentifier(input.bucketId, "bucket ID");
    const objectPath = String(input.objectPath || "")
      .replace(/^\/+/, "")
      .slice(0, 1000);
    if (!objectPath || objectPath.includes("..")) {
      const error = new Error("A safe Storage object path is required.");
      error.code = "INVALID_RECORD";
      throw error;
    }
    expected = `DELETE OBJECT ${bucketId}/${objectPath}`;
    target = `storage:${bucketId}/${objectPath}`;
    if (String(input.confirmation || "").trim() !== expected) {
      const error = new Error(`Type "${expected}" to confirm this operation.`);
      error.code = "CONFIRMATION_MISMATCH";
      throw error;
    }
    result = await supabaseAdminRequest(
      `/storage/v1/object/${encodeURIComponent(bucketId)}/${objectPath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      { method: "DELETE" }
    );
  } else {
    const error = new Error("Unsupported Storage admin operation.");
    error.code = "INVALID_OPERATION";
    throw error;
  }

  await logExternalAdminEvent({
    actor,
    action: `STORAGE_${action.toUpperCase()}`,
    target,
    reason,
    newValue: result
  });

  return result;
}

async function safely(loader, fallback) {
  try {
    return await loader();
  } catch (error) {
    return fallback;
  }
}

export async function getSuperAdminBootstrap(actor, { force = false } = {}) {
  const catalog = await getCatalog({ force });
  const [audit, auth, buckets] = await Promise.all([
    safely(() => loadAuditLog({ limit: 25 }), []),
    safely(() => listAuthUsers({ page: 1, perPage: 1 }), {
      users: [],
      total: null
    }),
    safely(() => listStorageBuckets(), [])
  ]);

  const tableSummaries = catalog.map(summaryCatalogEntry);
  return {
    actor,
    generatedAt: new Date().toISOString(),
    project: {
      name: "SKANDI TRAVELS Database",
      projectRef: "muvpffdnugzxjbnbpgac",
      databaseEngine: "PostgreSQL 17"
    },
    stats: {
      publicTables: catalog.length,
      estimatedRows: catalog.reduce(
        (sum, item) => sum + Math.max(0, item.estimatedRows),
        0
      ),
      rlsEnabled: catalog.filter((item) => item.rlsEnabled).length,
      tablesWithoutPolicies: catalog.filter(
        (item) => item.rlsEnabled && item.policyCount === 0
      ).length,
      authUsers: auth.total ?? auth.users.length,
      storageBuckets: buckets.length
    },
    catalog: tableSummaries,
    recentAudit: audit,
    storageBuckets: buckets
  };
}

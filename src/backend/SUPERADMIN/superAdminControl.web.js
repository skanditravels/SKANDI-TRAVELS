import { Permissions, webMethod } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';
import { createClient } from '@supabase/supabase-js';

const elevatedGetSecretValue = elevate(secrets.getSecretValue);

const PROJECT_NAME = 'SKANDI TRAVELS Database';
const MIN_LINK_SCORE = 80;
const NEVER_AUTO_SYNC_TABLES = new Set([
  'admin_audit_logs',
  'inventory_localized_content'
]);

// Fields that mean the same thing across different SKANDI tables.
// Matching is normalized, so Title/title and camelCase/snake_case are handled.
const SHARED_FIELD_GROUPS = [
  { key: 'display_title', aliases: ['Title', 'title', 'name', 'public_label', 'displayTitle', 'display_title'] },
  { key: 'slug', aliases: ['slug'] },
  { key: 'status', aliases: ['status'] },
  { key: 'active', aliases: ['active'] },
  { key: 'customer_visible', aliases: ['customer_visible', 'customerVisible'] },
  { key: 'staff_visible', aliases: ['staff_visible', 'staffVisible'] },
  { key: 'altea_visible', aliases: ['altea_visible', 'alteaVisible'] },
  { key: 'featured', aliases: ['featured'] },
  { key: 'homepage_featured', aliases: ['homepage_featured', 'homepageFeatured'] },
  { key: 'searchable', aliases: ['searchable'] },
  { key: 'source', aliases: ['source'] },
  { key: 'source_reference', aliases: ['source_reference', 'sourceReference'] },
  { key: 'partner_tier', aliases: ['partner_tier', 'partnerTier'] },
  { key: 'collection_type', aliases: ['collection_type', 'collectionType'] },
  { key: 'search_priority', aliases: ['search_priority', 'searchPriority'] },
  { key: 'search_keywords', aliases: ['search_keywords', 'searchKeywords'] }
];

const GENERIC_ENTITY_TABLES = new Set([
  'inventory_master_entities',
  'inventory_catalog_entries'
]);

let supabasePromise;
let catalogCache = { at: 0, data: null };

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeColumn(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function unique(values) {
  return [...new Set((values || []).filter(v => v !== undefined && v !== null && clean(v) !== '').map(v => String(v)))];
}

function stable(value) {
  if (value === undefined) return '__undefined__';
  return JSON.stringify(value);
}

function sameValue(a, b) {
  return stable(a) === stable(b);
}

function parseBooleanish(value) {
  if (value === null || value === 'null') return null;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

function requireText(value, label, min = 1) {
  const text = clean(value);
  if (text.length < min) throw new Error(`${label} is required${min > 1 ? ` and must be at least ${min} characters` : ''}.`);
  return text;
}

async function secretText(name, optional = false) {
  try {
    const value = await elevatedGetSecretValue(name);
    const text = typeof value === 'string' ? value : value?.value;
    if (!clean(text) && !optional) throw new Error(`Wix secret ${name} is empty.`);
    return clean(text);
  } catch (error) {
    if (optional) return '';
    throw error;
  }
}

async function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = (async () => {
      const [url, key] = await Promise.all([
        secretText('SUPABASE_URL'),
        secretText('SUPABASE_SECRET_KEY')
      ]);
      return createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    })();
  }
  return supabasePromise;
}

function memberDisplayName(member) {
  const first = clean(member?.contactDetails?.firstName);
  const last = clean(member?.contactDetails?.lastName);
  return clean(`${first} ${last}`) || clean(member?.profile?.nickname) || clean(member?.loginEmail) || clean(member?._id);
}

async function assertSuperAdmin() {
  const [member, roles, allowlistRaw] = await Promise.all([
    currentMember.getMember({ fieldsets: ['FULL'] }),
    currentMember.getRoles(),
    secretText('SUPER_ADMIN_WIX_MEMBER_IDS', true)
  ]);

  if (!member?._id) throw new Error('A signed-in Wix member is required.');

  const allowlist = new Set(
    allowlistRaw
      .replace(/[\[\]"']/g, '')
      .split(/[\s,;]+/)
      .map(clean)
      .filter(Boolean)
  );

  const roleNames = (roles || []).map(role => clean(role?.title || role?.name).toLowerCase());
  const isWixAdmin = roleNames.includes('admin');
  const isNamedSuperAdmin = roleNames.some(name => name === 'super admin' || name === 'super_admin' || name === 'superadmin');
  const isAllowlisted = allowlist.has(String(member._id));

  if (!isWixAdmin && !isNamedSuperAdmin && !isAllowlisted) {
    const error = new Error('Super Admin access denied.');
    error.code = 'SUPER_ADMIN_ACCESS_DENIED';
    throw error;
  }

  return {
    id: member._id,
    email: clean(member.loginEmail || member?.contactDetails?.emails?.[0]),
    displayName: memberDisplayName(member),
    roles: roleNames
  };
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split('.')[0] || 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

async function loadCatalog(force = false) {
  if (!force && catalogCache.data && Date.now() - catalogCache.at < 30000) return catalogCache.data;
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('super_admin_catalog');
  if (error) throw error;
  const catalog = Array.isArray(data) ? data : [];
  catalogCache = { at: Date.now(), data: catalog };
  return catalog;
}

function tableDefinition(catalog, table) {
  return (catalog || []).find(item => item?.table === table) || null;
}

function columnNames(definition) {
  return (definition?.columns || []).map(column => column.name);
}

function columnLookup(definition) {
  const map = new Map();
  for (const name of columnNames(definition)) {
    const normalized = normalizeColumn(name);
    if (!map.has(normalized)) map.set(normalized, []);
    map.get(normalized).push(name);
  }
  return map;
}

function exactColumnsForAliases(definition, aliases) {
  const lookup = columnLookup(definition);
  const result = [];
  for (const alias of aliases) {
    for (const actual of lookup.get(normalizeColumn(alias)) || []) {
      if (!result.includes(actual)) result.push(actual);
    }
  }
  return result;
}

function valuesFromAliases(row, aliases) {
  if (!row) return [];
  const normalizedAliases = new Set(aliases.map(normalizeColumn));
  return unique(Object.entries(row)
    .filter(([key, value]) => normalizedAliases.has(normalizeColumn(key)) && value !== null && clean(value) !== '')
    .map(([, value]) => value));
}

function rowValueForAliases(row, aliases) {
  if (!row) return undefined;
  for (const alias of aliases) {
    const normalized = normalizeColumn(alias);
    for (const [key, value] of Object.entries(row)) {
      if (normalizeColumn(key) === normalized && value !== undefined) return value;
    }
  }
  return undefined;
}

function conceptFromTable(table) {
  const name = clean(table).toLowerCase();
  if (/aircraft_(cabins|views|hotspots|walk_scenes|scene_hotspots)/.test(name)) return 'AIRCRAFT_CHILD';
  if (/(^|_)airlines?($|_)/.test(name)) return 'AIRLINE';
  if (/(^|_)airports?($|_)/.test(name)) return 'AIRPORT';
  if (/(^|_)aircraft($|_)/.test(name)) return 'AIRCRAFT';
  if (/(^|_)hotels?($|_)/.test(name)) return 'HOTEL';
  if (/(^|_)destinations?($|_)/.test(name)) return 'DESTINATION';
  if (/(^|_)countries?($|_)/.test(name)) return 'COUNTRY';
  if (/(^|_)(tours?|activities?)($|_)/.test(name)) return 'ACTIVITY';
  if (/(^|_)transfers?($|_)/.test(name)) return 'TRANSFER';
  if (/(^|_)flights?($|_)/.test(name)) return 'FLIGHT';
  if (/(^|_)vehicles?($|_)/.test(name)) return 'VEHICLE';
  if (/(^|_)drivers?($|_)/.test(name)) return 'DRIVER';
  if (/(^|_)suppliers?($|_)/.test(name)) return 'SUPPLIER';
  return '';
}

function conceptFromRow(table, row) {
  const explicit = rowValueForAliases(row, [
    'entity_type', 'entityType',
    'target_record_type', 'targetRecordType',
    'source_record_type', 'sourceRecordType',
    'record_type', 'recordType'
  ]);
  return clean(explicit).toUpperCase() || conceptFromTable(table);
}

function isLegacyOrHistoryTable(table) {
  const value = clean(table).toLowerCase();
  return value.includes('_legacy_') || /(^|_)(audit|history|logs?|events?)($|_)/.test(value);
}

function hasSharedField(definition) {
  return SHARED_FIELD_GROUPS.some(group => exactColumnsForAliases(definition, group.aliases).length > 0);
}

function candidateSupportsConcept(definition, concept) {
  if (!definition || !concept) return false;
  if (GENERIC_ENTITY_TABLES.has(definition.table)) return true;
  if (exactColumnsForAliases(definition, ['entity_type', 'entityType', 'target_record_type', 'targetRecordType']).length) return true;
  return conceptFromTable(definition.table) === concept;
}

function typeFilterFor(definition, concept) {
  const entityType = exactColumnsForAliases(definition, ['entity_type', 'entityType'])[0];
  if (entityType) return { column: entityType, value: concept };
  const targetType = exactColumnsForAliases(definition, ['target_record_type', 'targetRecordType'])[0];
  if (targetType) return { column: targetType, value: concept };
  return null;
}

function primaryKeyObject(definition, row) {
  const pk = {};
  for (const key of definition?.primaryKey || []) pk[key] = row?.[key];
  return pk;
}

function sourceIdentity(row, concept) {
  const ids = valuesFromAliases(row, ['ID', 'id', 'public_id', 'publicId', 'Record ID', 'record_id', 'recordId']);
  const slugs = valuesFromAliases(row, ['slug']);
  const refs = valuesFromAliases(row, ['source_reference', 'sourceReference']);
  const iata = valuesFromAliases(row, ['iataCode', 'iata_code', 'iata']);
  const icao = valuesFromAliases(row, ['icaoCode', 'icao_code', 'icao']);
  const codes = valuesFromAliases(row, ['code', 'target_code', 'targetCode']);
  const titles = valuesFromAliases(row, ['Title', 'title', 'name', 'public_label', 'displayTitle', 'display_title']);

  // For airline/airport matching, IATA is the strongest generic code.
  const strongCodes = unique([
    ...(concept === 'AIRLINE' || concept === 'AIRPORT' ? iata : []),
    ...codes
  ]);

  return { ids, slugs, refs, iata, icao, codes, strongCodes, titles };
}

async function queryCandidate(definition, strategy, concept) {
  const supabase = await getSupabase();
  const typeFilter = typeFilterFor(definition, concept);
  let query = supabase.from(definition.table).select('*').limit(8);
  if (typeFilter) query = query.eq(typeFilter.column, typeFilter.value);
  query = query.eq(strategy.column, strategy.value);
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

function strategyList(definition, identity, concept) {
  const strategies = [];
  const add = (columns, values, score, reason) => {
    for (const column of columns) {
      for (const value of values) strategies.push({ column, value, score, reason });
    }
  };

  add(exactColumnsForAliases(definition, ['target_record_id', 'targetRecordId', 'source_record_id', 'sourceRecordId']), identity.ids, 100, 'explicit record reference');
  add(exactColumnsForAliases(definition, ['ID', 'id', 'public_id', 'publicId', 'Record ID', 'record_id', 'recordId']), identity.ids, 98, 'same record ID');
  add(exactColumnsForAliases(definition, ['slug']), identity.slugs, 92, 'same slug');

  if (concept === 'AIRLINE' || concept === 'AIRPORT') {
    add(exactColumnsForAliases(definition, ['iataCode', 'iata_code', 'iata']), identity.iata, 90, 'same IATA code');
    add(exactColumnsForAliases(definition, ['code', 'target_code', 'targetCode']), identity.strongCodes, 88, 'same canonical code');
    add(exactColumnsForAliases(definition, ['icaoCode', 'icao_code', 'icao']), identity.icao, 86, 'same ICAO code');
  } else {
    add(exactColumnsForAliases(definition, ['code', 'target_code', 'targetCode']), identity.codes, 88, 'same canonical code');
  }

  add(exactColumnsForAliases(definition, ['source_reference', 'sourceReference']), identity.refs, 84, 'same source reference');
  // Title-only is surfaced as a weak candidate but can never cross MIN_LINK_SCORE automatically.
  add(exactColumnsForAliases(definition, ['Title', 'title', 'name', 'public_label']), identity.titles, 55, 'same display title only');

  const seen = new Set();
  return strategies.filter(strategy => {
    const key = `${strategy.column}\u0000${strategy.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function discoverLinkedRecords(sourceTable, sourceRow, catalog) {
  const sourceDefinition = tableDefinition(catalog, sourceTable);
  if (!sourceDefinition) throw new Error(`Table public.${sourceTable} is not in the live catalog.`);
  const concept = conceptFromRow(sourceTable, sourceRow);
  if (!concept) return { concept: '', linked: [], ambiguous: [], weak: [] };

  const identity = sourceIdentity(sourceRow, concept);
  const linked = [];
  const ambiguous = [];
  const weak = [];

  const candidates = catalog.filter(definition =>
    definition.table !== sourceTable &&
    !NEVER_AUTO_SYNC_TABLES.has(definition.table) &&
    !isLegacyOrHistoryTable(definition.table) &&
    hasSharedField(definition) &&
    candidateSupportsConcept(definition, concept)
  );

  for (const definition of candidates) {
    const matches = new Map();
    for (const strategy of strategyList(definition, identity, concept)) {
      let rows;
      try {
        rows = await queryCandidate(definition, strategy, concept);
      } catch (_) {
        // A dynamically discovered table may contain a column/type combination that cannot
        // accept a given value. Skip that strategy rather than losing all discovery.
        continue;
      }
      for (const row of rows) {
        const pk = primaryKeyObject(definition, row);
        const key = Object.keys(pk).length ? stable(pk) : stable(row);
        const previous = matches.get(key);
        if (!previous || strategy.score > previous.score) {
          matches.set(key, {
            table: definition.table,
            score: strategy.score,
            matchReason: strategy.reason,
            primaryKey: pk,
            row,
            autoSyncEligible: strategy.score >= MIN_LINK_SCORE && (definition.primaryKey || []).length > 0
          });
        }
      }
      // Once an exact/explicit strategy finds a row, lower strategies are unnecessary for this table.
      if ([...matches.values()].some(match => match.score >= 98)) break;
    }

    const ranked = [...matches.values()].sort((a, b) => b.score - a.score);
    if (!ranked.length) continue;
    const topScore = ranked[0].score;
    const top = ranked.filter(match => match.score === topScore);

    if (topScore < MIN_LINK_SCORE) {
      weak.push(...top);
    } else if (top.length > 1) {
      ambiguous.push({ table: definition.table, score: topScore, matches: top });
    } else {
      linked.push(top[0]);
    }
  }

  return { concept, linked, ambiguous, weak };
}

function sharedChanges(sourceDefinition, oldRow, newRow) {
  const changes = [];
  for (const group of SHARED_FIELD_GROUPS) {
    const sourceColumns = exactColumnsForAliases(sourceDefinition, group.aliases);
    const changedColumns = sourceColumns.filter(column => !sameValue(oldRow?.[column], newRow?.[column]));
    if (!changedColumns.length) continue;

    const values = unique(changedColumns.map(column => stable(newRow?.[column])));
    if (values.length > 1) {
      const error = new Error(`Conflicting values were supplied for linked field ${group.key}.`);
      error.code = 'SYNC_FIELD_CONFLICT';
      throw error;
    }

    const sourceColumn = changedColumns[0];
    changes.push({
      key: group.key,
      aliases: group.aliases,
      sourceColumn,
      value: newRow?.[sourceColumn],
      oldValue: oldRow?.[sourceColumn]
    });
  }
  return changes;
}

function buildSyncPlan(sourceTable, sourceDefinition, oldRow, proposedRecord, discovery, catalog) {
  const newRow = { ...oldRow, ...(proposedRecord || {}) };
  const changes = sharedChanges(sourceDefinition, oldRow, newRow);
  const operations = [];
  const targets = [];

  for (const link of discovery.linked || []) {
    if (!link.autoSyncEligible) continue;
    const definition = tableDefinition(catalog, link.table);
    if (!definition || NEVER_AUTO_SYNC_TABLES.has(link.table)) continue;

    const targetPatch = {};
    const fieldDetails = [];
    for (const change of changes) {
      const targetColumns = exactColumnsForAliases(definition, change.aliases);
      const changedTargetColumns = [];
      for (const column of targetColumns) {
        if (!sameValue(link.row?.[column], change.value)) {
          targetPatch[column] = change.value;
          changedTargetColumns.push(column);
        }
      }
      if (changedTargetColumns.length) {
        fieldDetails.push({
          semanticField: change.key,
          sourceColumn: change.sourceColumn,
          targetColumns: changedTargetColumns,
          from: changedTargetColumns.reduce((acc, col) => ({ ...acc, [col]: link.row?.[col] }), {}),
          to: change.value
        });
      }
    }

    if (Object.keys(targetPatch).length) {
      operations.push({
        table: link.table,
        operation: 'update',
        primaryKey: link.primaryKey,
        record: targetPatch,
        autoSync: true
      });
      targets.push({
        table: link.table,
        score: link.score,
        matchReason: link.matchReason,
        primaryKey: link.primaryKey,
        fields: fieldDetails,
        patch: targetPatch
      });
    }
  }

  return {
    concept: discovery.concept,
    changes,
    linkedTables: (discovery.linked || []).map(link => ({
      table: link.table,
      score: link.score,
      matchReason: link.matchReason,
      primaryKey: link.primaryKey,
      autoSyncEligible: link.autoSyncEligible
    })),
    ambiguous: discovery.ambiguous || [],
    weak: discovery.weak || [],
    targets,
    operations
  };
}

async function fetchRowByPrimaryKey(table, primaryKey, catalog) {
  const definition = tableDefinition(catalog, table);
  if (!definition) throw new Error(`Table public.${table} is not in the live catalog.`);
  const required = definition.primaryKey || [];
  if (!required.length) throw new Error(`public.${table} has no primary key.`);
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(primaryKey || {}, key)) throw new Error(`Primary key field ${key} is required.`);
  }

  const supabase = await getSupabase();
  let query = supabase.from(table).select('*').limit(2);
  for (const key of required) query = query.eq(key, primaryKey[key]);
  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) throw new Error('The selected row no longer exists.');
  if (data.length > 1) throw new Error('Primary-key lookup returned more than one row.');
  return data[0];
}

function expectedConfirmation(operation, table) {
  const op = clean(operation).toLowerCase();
  if (op === 'insert') return `INSERT ${table}`;
  if (op === 'update') return `OVERRIDE ${table}`;
  if (op === 'delete') return `DELETE ${table}`;
  throw new Error('Unsupported operation.');
}

async function auditExternalAction(actor, action, target, reason, oldValue = null, newValue = null) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('super_admin_log_event', {
    p_actor: actor.id,
    p_action: action,
    p_target: target,
    p_reason: reason,
    p_old_value: oldValue,
    p_new_value: newValue
  });
  if (error) throw error;
  return data;
}

async function handleBootstrap(actor, payload) {
  const force = Boolean(payload?.force);
  const [supabase, catalog] = await Promise.all([getSupabase(), loadCatalog(force)]);
  const [authResult, bucketResult, auditResult, url] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
    supabase.storage.listBuckets(),
    supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
    secretText('SUPABASE_URL')
  ]);
  if (authResult.error) throw authResult.error;
  if (bucketResult.error) throw bucketResult.error;
  if (auditResult.error) throw auditResult.error;

  return {
    actor,
    project: {
      name: PROJECT_NAME,
      projectRef: projectRefFromUrl(url),
      databaseEngine: 'PostgreSQL'
    },
    stats: {
      publicTables: catalog.length,
      estimatedRows: catalog.reduce((sum, item) => sum + Number(item.estimatedRows || 0), 0),
      authUsers: Number(authResult.data?.total ?? authResult.data?.users?.length ?? 0),
      storageBuckets: bucketResult.data?.length || 0
    },
    catalog,
    recentAudit: auditResult.data || [],
    storageBuckets: bucketResult.data || [],
    generatedAt: new Date().toISOString()
  };
}

async function handleLoadRows(payload) {
  const table = requireText(payload?.table, 'Table');
  const catalog = await loadCatalog(false);
  const definition = tableDefinition(catalog, table);
  if (!definition) throw new Error(`Table public.${table} is not in the live catalog.`);

  const pageSize = Math.max(1, Math.min(100, Number(payload?.pageSize || 50)));
  const page = Math.max(1, Number(payload?.page || 1));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  const supabase = await getSupabase();
  let query = supabase.from(table).select('*', { count: 'exact' });

  const filter = payload?.filter;
  if (filter?.column) {
    if (!columnNames(definition).includes(filter.column)) throw new Error(`Unknown filter column ${filter.column}.`);
    const operator = clean(filter.operator || 'eq').toLowerCase();
    const value = filter.value;
    if (operator === 'eq') query = query.eq(filter.column, value);
    else if (operator === 'neq') query = query.neq(filter.column, value);
    else if (operator === 'gt') query = query.gt(filter.column, value);
    else if (operator === 'gte') query = query.gte(filter.column, value);
    else if (operator === 'lt') query = query.lt(filter.column, value);
    else if (operator === 'lte') query = query.lte(filter.column, value);
    else if (operator === 'is') query = query.is(filter.column, parseBooleanish(value));
    else if (operator === 'ilike') query = query.ilike(filter.column, String(value).includes('%') ? value : `%${value}%`);
    else throw new Error(`Unsupported filter operator ${operator}.`);
  }

  const pk = definition.primaryKey || [];
  if (pk.length === 1) query = query.order(pk[0], { ascending: true });
  const { data, error, count } = await query.range(start, end);
  if (error) throw error;

  return {
    table,
    columns: definition.columns || [],
    primaryKey: pk,
    rows: data || [],
    page,
    pageSize,
    total: count
  };
}

async function handleDiscoverLinked(payload) {
  const table = requireText(payload?.table, 'Table');
  const catalog = await loadCatalog(false);
  const row = await fetchRowByPrimaryKey(table, payload?.primaryKey || {}, catalog);
  const discovery = await discoverLinkedRecords(table, row, catalog);
  return {
    sourceTable: table,
    concept: discovery.concept,
    linked: discovery.linked,
    ambiguous: discovery.ambiguous,
    weak: discovery.weak
  };
}

async function handlePreviewSync(payload) {
  const table = requireText(payload?.table, 'Table');
  const catalog = await loadCatalog(false);
  const definition = tableDefinition(catalog, table);
  const oldRow = await fetchRowByPrimaryKey(table, payload?.primaryKey || {}, catalog);
  const discovery = await discoverLinkedRecords(table, oldRow, catalog);
  return buildSyncPlan(table, definition, oldRow, payload?.record || {}, discovery, catalog);
}

async function handleMutateRecord(actor, payload) {
  const table = requireText(payload?.table, 'Table');
  const operation = requireText(payload?.operation, 'Operation').toLowerCase();
  const reason = requireText(payload?.reason, 'Audit reason', 10);
  const confirmation = requireText(payload?.confirmation, 'Confirmation');
  const expected = expectedConfirmation(operation, table);
  if (confirmation !== expected) throw new Error(`Confirmation must equal ${expected}.`);

  const catalog = await loadCatalog(false);
  const definition = tableDefinition(catalog, table);
  if (!definition) throw new Error(`Table public.${table} is not in the live catalog.`);
  const supabase = await getSupabase();

  if (operation !== 'update') {
    const { data, error } = await supabase.rpc('super_admin_mutate', {
      p_table: table,
      p_operation: operation,
      p_primary_key: payload?.primaryKey || {},
      p_record: payload?.record || {},
      p_actor: actor.id,
      p_reason: reason,
      p_confirmation: expected
    });
    if (error) throw error;
    return { ...data, linkedSync: { targets: [], linkedTables: [], ambiguous: [], weak: [] } };
  }

  const oldRow = await fetchRowByPrimaryKey(table, payload?.primaryKey || {}, catalog);
  const discovery = await discoverLinkedRecords(table, oldRow, catalog);
  const plan = buildSyncPlan(table, definition, oldRow, payload?.record || {}, discovery, catalog);

  const operations = [
    {
      table,
      operation: 'update',
      primaryKey: payload?.primaryKey || {},
      record: payload?.record || {},
      autoSync: false
    },
    ...plan.operations
  ];

  const { data, error } = await supabase.rpc('super_admin_mutate_bundle', {
    p_operations: operations,
    p_actor: actor.id,
    p_reason: reason
  });
  if (error) throw error;

  return {
    ...data,
    linkedSync: {
      concept: plan.concept,
      changedSharedFields: plan.changes,
      linkedTables: plan.linkedTables,
      targets: plan.targets,
      ambiguous: plan.ambiguous,
      weak: plan.weak
    }
  };
}

async function handleLoadUsers(payload) {
  const supabase = await getSupabase();
  const page = Math.max(1, Number(payload?.page || 1));
  const perPage = Math.max(1, Math.min(1000, Number(payload?.perPage || 100)));
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) throw error;
  return {
    users: data?.users || [],
    total: data?.total ?? data?.users?.length ?? 0,
    page,
    perPage
  };
}

async function handleMutateAuth(actor, payload) {
  const action = requireText(payload?.action, 'Auth action');
  const reason = requireText(payload?.reason, 'Audit reason', 10);
  const userId = clean(payload?.userId);
  const email = clean(payload?.email).toLowerCase();
  const metadata = payload?.appMetadata && typeof payload.appMetadata === 'object' ? payload.appMetadata : {};
  const expected = action === 'invite' ? `INVITE ${email}`
    : action === 'ban' ? `BAN USER ${userId}`
    : action === 'unban' ? `UNBAN USER ${userId}`
    : action === 'set_app_metadata' ? `UPDATE USER ${userId}`
    : `DELETE USER ${userId}`;
  if (clean(payload?.confirmation) !== expected) throw new Error(`Confirmation must equal ${expected}.`);

  const supabase = await getSupabase();
  let result;
  if (action === 'invite') {
    requireText(email, 'Email');
    const invited = await supabase.auth.admin.inviteUserByEmail(email);
    if (invited.error) throw invited.error;
    result = invited.data;
    if (Object.keys(metadata).length && invited.data?.user?.id) {
      const updated = await supabase.auth.admin.updateUserById(invited.data.user.id, { app_metadata: metadata });
      if (updated.error) throw updated.error;
      result = updated.data;
    }
  } else {
    requireText(userId, 'User ID');
    if (action === 'ban') result = await supabase.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    else if (action === 'unban') result = await supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' });
    else if (action === 'set_app_metadata') result = await supabase.auth.admin.updateUserById(userId, { app_metadata: metadata });
    else if (action === 'delete') result = await supabase.auth.admin.deleteUser(userId);
    else throw new Error(`Unsupported Auth action ${action}.`);
    if (result.error) throw result.error;
    result = result.data;
  }

  await auditExternalAction(actor, `AUTH_${action.toUpperCase()}`, `auth.users:${userId || email}`, reason, null, { userId: userId || result?.user?.id, email, appMetadata: metadata });
  return result;
}

async function handleLoadBuckets() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.storage.listBuckets({ limit: 100, offset: 0, sortColumn: 'created_at', sortOrder: 'asc' });
  if (error) throw error;
  return data || [];
}

async function handleLoadObjects(payload) {
  const bucketId = requireText(payload?.bucketId, 'Bucket ID');
  const supabase = await getSupabase();
  const limit = Math.max(1, Math.min(100, Number(payload?.limit || 100)));
  const offset = Math.max(0, Number(payload?.offset || 0));
  const prefix = clean(payload?.prefix);
  const { data, error } = await supabase.storage.from(bucketId).list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw error;
  return { bucketId, prefix, objects: data || [] };
}

async function handleMutateStorage(actor, payload) {
  const action = requireText(payload?.action, 'Storage action');
  const bucketId = requireText(payload?.bucketId, 'Bucket ID');
  const path = clean(payload?.objectPath);
  const reason = requireText(payload?.reason, 'Audit reason', 10);
  const expected = action === 'create_bucket' ? `CREATE BUCKET ${bucketId}`
    : action === 'delete_bucket' ? `DELETE BUCKET ${bucketId}`
    : `DELETE OBJECT ${bucketId}/${path}`;
  if (clean(payload?.confirmation) !== expected) throw new Error(`Confirmation must equal ${expected}.`);

  const supabase = await getSupabase();
  let result;
  if (action === 'create_bucket') result = await supabase.storage.createBucket(bucketId, { public: Boolean(payload?.public) });
  else if (action === 'delete_bucket') result = await supabase.storage.deleteBucket(bucketId);
  else if (action === 'delete_object') {
    requireText(path, 'Object path');
    result = await supabase.storage.from(bucketId).remove([path]);
  } else throw new Error(`Unsupported Storage action ${action}.`);
  if (result.error) throw result.error;

  await auditExternalAction(actor, `STORAGE_${action.toUpperCase()}`, `storage:${bucketId}${path ? `/${path}` : ''}`, reason, null, { bucketId, path });
  return result.data;
}

async function handleLoadAudit(payload) {
  const limit = Math.max(1, Math.min(500, Number(payload?.limit || 200)));
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

async function dispatch(actor, type, payload) {
  switch (type) {
    case 'PING': return { ok: true, at: new Date().toISOString(), actor: actor.id };
    case 'BOOTSTRAP': return handleBootstrap(actor, payload);
    case 'LOAD_TABLE_ROWS': return handleLoadRows(payload);
    case 'DISCOVER_LINKED_RECORDS': return handleDiscoverLinked(payload);
    case 'PREVIEW_SYNC': return handlePreviewSync(payload);
    case 'MUTATE_RECORD': return handleMutateRecord(actor, payload);
    case 'LOAD_AUTH_USERS': return handleLoadUsers(payload);
    case 'MUTATE_AUTH_USER': return handleMutateAuth(actor, payload);
    case 'LOAD_STORAGE_BUCKETS': return handleLoadBuckets();
    case 'LOAD_STORAGE_OBJECTS': return handleLoadObjects(payload);
    case 'MUTATE_STORAGE': return handleMutateStorage(actor, payload);
    case 'LOAD_AUDIT': return handleLoadAudit(payload);
    default: throw new Error(`Unsupported Super Admin request ${type}.`);
  }
}

export const superAdminControl = webMethod(Permissions.SiteMember, async (type, payload = {}) => {
  const actor = await assertSuperAdmin();
  try {
    return await dispatch(actor, clean(type).toUpperCase(), payload || {});
  } catch (error) {
    console.error('superAdminControl failed', {
      type,
      code: error?.code,
      message: error?.message
    });
    throw error;
  }
});

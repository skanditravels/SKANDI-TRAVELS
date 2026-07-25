import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';
import { fetch } from 'wix-fetch';

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configurationPromise;

// This explicit allowlist prevents a browser payload from choosing a table.
const INTERNAL_TABLES = new Set([
  'agent_users',
  'staff_login_audit',
  'admin_audit_logs',
  'staff_payroll_profiles',
  'staff_payroll_periods',
  'staff_payroll_runs',
  'staff_payroll_run_lines',
  'uniform_categories',
  'uniform_catalog_items',
  'uniform_allowance_rules',
  'uniform_wallets',
  'uniform_wallet_ledger',
  'uniform_orders',
  'uniform_order_items',
  'uniform_policies',
  'uniform_policy_acknowledgements',
  'uniform_audit',
  'grouptalk_groups',
  'grouptalk_group_members',
  'grouptalk_phonebook',
  'grouptalk_ticket_categories',
  'grouptalk_tickets',
  'grouptalk_ticket_replies',
  'grouptalk_locations',
  'grouptalk_history',
  'grouptalk_realtime_sessions',
  'grouptalk_audit',
  'inventory_flight_legs',
  'inventory_flight_classes',
  'inventory_schedule_lines',
  'inventory_nesting_controls',
  'hotel_allocations',
  'tour_activity_inventory',
  'partner_ticket_inventory',
  'travel_products',
  'travel_product_components',
  'travel_product_price_cache',
  'master_inventory_audit',
  'altea_offer_cache',
  'amadeus_offer_cache',
  'career_applicant_accounts',
  'career_applicant_access_codes',
  'career_applicant_sessions',
  'career_application_files',
  'career_positions',
  'document_acknowledgements',
  'document_packet_items',
  'document_packets',
  'document_templates',
]);

async function getConfiguration() {
  if (!configurationPromise) {
    configurationPromise = (async () => {
      const baseUrl = await elevatedGetSecretValue('SUPABASE_URL');
      let apiKey;

      try {
        apiKey = await elevatedGetSecretValue('SUPABASE_SECRET_KEY');
      } catch (_) {
        // Retain this fallback only while moving off the legacy key.
        apiKey = await elevatedGetSecretValue('SUPABASE_SERVICE_ROLE_KEY');
      }

      if (!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(baseUrl || '')) {
        throw new Error('SUPABASE_URL_INVALID');
      }
      if (!apiKey) {
        throw new Error('SUPABASE_SERVER_KEY_MISSING');
      }

      return {
        baseUrl: baseUrl.replace(/\/+$/, ''),
        apiKey,
      };
    })();
  }

  return configurationPromise;
}

function makeQuery(query = {}) {
  const output = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return output ? `?${output}` : '';
}

/**
 * Backend-only Supabase REST client.
 * Do not export this function through a .web.js module directly.
 */
export async function restRequest({
  table,
  method = 'GET',
  query,
  body,
  prefer = 'return=representation',
}) {
  if (!INTERNAL_TABLES.has(table)) {
    throw new Error('SUPABASE_TABLE_NOT_ALLOWED');
  }

  const { baseUrl, apiKey } = await getConfiguration();
  const response = await fetch(`${baseUrl}/rest/v1/${table}${makeQuery(query)}`, {
    method,
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      throw new Error('SUPABASE_INVALID_RESPONSE');
    }
  }

  if (!response.ok) {
    // Never log response bodies: they can include sensitive operational data.
    throw new Error(`SUPABASE_HTTP_${response.status}`);
  }

  return payload;
}

export async function writeAdminAudit({
  actorId,
  action,
  targetMember = null,
  before = null,
  after = null,
}) {
  if (!actorId || !action) {
    throw new Error('AUDIT_INPUT_INVALID');
  }

  return restRequest({
    table: 'admin_audit_logs',
    method: 'POST',
    body: {
      log_id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      admin_id: actorId,
      target_member: targetMember,
      action_performed: action,
      old_value: before,
      new_value: after,
    },
  });
}
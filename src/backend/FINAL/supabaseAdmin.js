// Private Wix backend helper. Do not import this file from page code.

import { createClient } from "@supabase/supabase-js";
import { getSecret } from "wix-secrets-backend";

const DATABASE_SCHEMA = "magazine_manager";
const SUPABASE_URL_SECRET = "SUPABASE_URL";
const SUPABASE_KEY_SECRET = "SUPABASE_SECRET_KEY";

let clientPromise = null;

/**
 * Returns one server-only Supabase client configured for the isolated
 * magazine_manager schema. The caller's web method remains responsible for
 * Wix-member authorization and organization scoping. The Wix Secrets Manager value must be a Supabase
 * secret key (sb_secret_...) or a legacy service_role key, never a
 * publishable/anon key.
 */
export function getMagazineManagerSupabase() {
  if (!clientPromise) {
    clientPromise = createAdminClient().catch((error) => {
      // Allow a corrected Secrets Manager configuration to work on a later call.
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
}

async function createAdminClient() {
  const [urlValue, keyValue] = await Promise.all([
    getSecret(SUPABASE_URL_SECRET),
    getSecret(SUPABASE_KEY_SECRET)
  ]);

  const supabaseUrl = normalizeUrl(urlValue);
  const secretKey = normalizeSecretKey(keyValue);

  return createClient(supabaseUrl, secretKey, {
    db: {
      schema: DATABASE_SCHEMA
    },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    global: {
      headers: {
        "X-Client-Info": "skandi-magazine-manager-wix/1.0.0"
      }
    }
  });
}

function normalizeUrl(value) {
  const url = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";

  if (!url || !url.startsWith("https://")) {
    throw new Error(
      `Missing or invalid Wix secret ${SUPABASE_URL_SECRET}. Expected an HTTPS Supabase project URL.`
    );
  }

  return url;
}

function normalizeSecretKey(value) {
  const key = typeof value === "string" ? value.trim() : "";

  if (!key) {
    throw new Error(`Missing Wix secret ${SUPABASE_KEY_SECRET}.`);
  }

  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      `${SUPABASE_KEY_SECRET} contains a publishable key. Configure a server-only Supabase secret key instead.`
    );
  }

  return key;
}

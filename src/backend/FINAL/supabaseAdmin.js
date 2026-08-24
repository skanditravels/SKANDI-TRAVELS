import { getSecret } from "wix-secrets-backend";
import { createClient } from "@supabase/supabase-js";

let clientPromise = null;

export async function getMagazineManagerSupabase() {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const [url, serviceRoleKey] = await Promise.all([
      getSecret("SUPABASE_URL"),
      getSecret("SUPABASE_SERVICE_ROLE_KEY")
    ]);

    const cleanUrl = String(url || "").replace(/\/$/, "");
    const cleanKey = String(serviceRoleKey || "");

    if (!cleanUrl || !cleanKey) {
      throw new Error("VOY_SUPABASE_NOT_CONFIGURED");
    }

    return createClient(cleanUrl, cleanKey, {
      db: { schema: "magazine_manager" },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "X-Client-Info": "skandi-voy-wix-backend" } }
    });
  })();

  try {
    return await clientPromise;
  } catch (error) {
    clientPromise = null;
    throw error;
  }
}

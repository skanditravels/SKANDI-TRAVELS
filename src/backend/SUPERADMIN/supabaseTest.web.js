import { webMethod, Permissions } from "wix-web-module";
import { sbSelect } from "src/backend/supabaseClient";

export const testSupabaseConnection = webMethod(
  Permissions.Admin,
  async function () {
    const tiers = await sbSelect(
      "club_tiers",
      "select=tier_key,tier_name,min_points,sort_order"
    );

    return {
      ok: true,
      message: "Supabase connection works.",
      tiers
    };
  }
);

export const testCustomerProfilesTable = webMethod(
  Permissions.Admin,
  async function () {
    const rows = await sbSelect(
      "customer_profiles",
      "select=id,member_id,wix_member_id,supabase_user_id,email,display_name,is_loyalty_member&limit=5"
    );

    return {
      ok: true,
      table: "customer_profiles",
      count: rows.length,
      rows
    };
  }
);

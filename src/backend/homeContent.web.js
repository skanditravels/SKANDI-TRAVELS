import { webMethod, Permissions } from "wix-web-module";
import { getHomeContentInternal } from "backend/FINAL/publicInventory";

/* Existing homepage code keeps the same import/function name.
   The data source is now Supabase Inventory Control. */
export const getOldStyleHomeContent=webMethod(
  Permissions.Anyone,
  async(input={})=>getHomeContentInternal(input)
);

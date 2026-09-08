import { webMethod, Permissions } from "wix-web-module";
import { callPublicContentRpc } from "./publicContentSupabase";

export const getAboutPagePayload = webMethod(Permissions.Anyone, async () => {
  const payload = await callPublicContentRpc("get_public_about_payload");

  if (!payload || typeof payload !== "object") {
    throw new Error("ABOUT_PAYLOAD_INVALID");
  }

  return {
    ok: payload.ok !== false,
    settings: payload.settings || {},
    facts: Array.isArray(payload.facts) ? payload.facts : [],
    timeline: Array.isArray(payload.timeline) ? payload.timeline : [],
    // Deliberately do not surface Inventory Control rows as About-page partners.
    partners: []
  };
});

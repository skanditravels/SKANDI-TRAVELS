import { sbInsert } from "backend/supabaseClient";
import { uid, nowIso } from "backend/core/response";

const EVENTS_TABLE = "platform_events";

export async function publishEvent(type, payload = {}, actor = {}) {
  try {
    await sbInsert(EVENTS_TABLE, {
      event_id: uid("EVT"),
      event_type: type,
      actor_member_id: actor.memberId || null,
      actor_wix_member_id: actor.wixMemberId || null,
      actor_email: actor.email || null,
      payload,
      created_at: nowIso()
    });
  } catch (error) {}
}

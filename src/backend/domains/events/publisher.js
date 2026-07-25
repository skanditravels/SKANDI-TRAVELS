import { sbInsert } from "backend/supabaseClient";
import { uid, nowIso } from "backend/core/response";
import { createNotificationForEvent } from "backend/domains/notification/service";

const EVENTS_TABLE = "platform_events";

export async function publishEvent(type, payload = {}, ctx = {}) {
  const event = {
    event_id: uid("EVT"),
    type,
    member_id: ctx.memberId || payload.memberId || null,
    wix_member_id: ctx.wixMemberId || payload.wixMemberId || null,
    supabase_user_id: ctx.supabaseUserId || payload.supabaseUserId || null,
    actor_id: ctx.memberId || payload.actorId || null,
    actor_type: payload.actorType || "System",
    entity_type: payload.entityType || "",
    entity_id: payload.entityId || "",
    payload,
    created_at: nowIso()
  };

  const saved = await sbInsert(EVENTS_TABLE, event);

  await createNotificationForEvent(type, payload, ctx);

  return saved?.[0] || event;
}
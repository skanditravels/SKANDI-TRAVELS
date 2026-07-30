import { requireCustomerContext } from "backend/core/authContext";
import { nowIso } from "backend/core/response";
import { publishEvent } from "backend/core/eventBus";
import { listByMember, createRecord, updateRecord } from "backend/domains/notification/repository";
import { mapNotification } from "backend/domains/notification/mapper";
import {
  createNotification,
  listNotifications,
  markNotificationRead
} from "backend/domains/notification/repository";

export async function listCurrentCustomerNotifications() {
  const ctx = await requireCustomerContext();
  const rows = await listByMember(ctx.memberId);
  return rows.map(mapNotification);
}

export async function createCurrentCustomerNotification(payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await createRecord({
    ...payload,
    member_id: ctx.memberId,
    wix_member_id: ctx.wixMemberId,
    supabase_user_id: ctx.supabaseUserId,
    created_at: payload.created_at || nowIso(),
    updated_at: payload.updated_at || nowIso()
  });
  await publishEvent("NOTIFICATION_CREATED", { id: row?.id }, ctx);
  return mapNotification(row);
}

export async function updateCurrentCustomerNotification(id, payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await updateRecord(id, ctx.memberId, { ...payload, updated_at: nowIso() });
  await publishEvent("NOTIFICATION_UPDATED", { id }, ctx);
  return mapNotification(row);
}

export async function getCustomerNotifications(ctx) {
  const rows = await listNotifications(ctx.memberId);
  return {
    notifications: rows,
    notificationCount: rows.filter((n) => !n.read).length
  };
}

export async function readNotification(ctx, notificationId) {
  return markNotificationRead(ctx.memberId, notificationId);
}

export async function createNotificationForEvent(type, payload = {}, ctx = {}) {
  const base = {
    memberId: ctx.memberId || payload.memberId,
    wixMemberId: ctx.wixMemberId || payload.wixMemberId,
    supabaseUserId: ctx.supabaseUserId || payload.supabaseUserId,
    type,
    entityType: payload.entityType || "",
    entityId: payload.entityId || "",
    payload
  };

  const map = {
    SUPPORT_CASE_CREATED: {
      title: "Support request received",
      message: "Alexandra has created a support case for you.",
      actionPath: "/my-profile?tab=support"
    },
    SUPPORT_AGENT_REPLIED: {
      title: "New support reply",
      message: "A SKANDI agent has replied to your support case.",
      actionPath: "/my-profile?tab=support"
    },
    PROFILE_UPDATED: {
      title: "Profile updated",
      message: "Your SKANDI profile has been updated.",
      actionPath: "/my-profile?tab=settings"
    },
    CLUB_ENROLLED: {
      title: "SKANDI Club activated",
      message: "Your SKANDI Club membership is now active.",
      actionPath: "/my-profile?tab=club"
    },
    DOCUMENT_SAVED: {
      title: "Travel document saved",
      message: "Your travel document has been saved.",
      actionPath: "/my-profile?tab=documents"
    },
    TRAVELER_SAVED: {
      title: "Traveler saved",
      message: "Your traveler profile has been saved.",
      actionPath: "/my-profile?tab=travelers"
    }
  };

  const config = map[type];
  if (!config || !base.memberId) return null;

  return createNotification({
    ...base,
    ...config
  });
}

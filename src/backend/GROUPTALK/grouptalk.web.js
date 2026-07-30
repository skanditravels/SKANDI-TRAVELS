import { webMethod, Permissions } from 'wix-web-module';
import { getSecret } from 'wix-secrets-backend';
import Pusher from 'pusher';
import { AccessToken } from 'livekit-server-sdk';

import { restRequest } from '../RIA/supabaseServer.js';
import {
  bool,
  hasManagementAccess,
  requireInternalAgent,
  text,
  upper,
} from '../RIA/internalAccess.js';

const EVENT_TYPES = new Set([
  'PTT_DOWN', 'PTT_UP', 'PTT_DOWN_DESKTOP', 'PTT_UP_DESKTOP',
  'AUDIO_START', 'AUDIO_STOP', 'EMERGENCY', 'SILENT_CHANGED',
  'SILENT_CHANGED_DESKTOP', 'GROUP_CHANGED', 'PHONE_BOOK_CALL',
  'LIVEKIT_JOIN', 'LIVEKIT_LEAVE',
]);

let pusherPromise;

function key(value, max = 80) {
  return text(value, max).toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function now() { return new Date().toISOString(); }

function displayName(agent = {}) {
  return agent.preferred_name || agent.display_name || [agent.first_name, agent.last_name].filter(Boolean).join(' ') || agent.email || agent.sk_id || 'Staff';
}

function isGroupTalkAdmin(agent) {
  const role = upper(agent?.role);
  return hasManagementAccess(agent) || ['OCC_CONTROLLER', 'DESTINATION_CONTROLLER', 'GROUPTALK_ADMIN', 'OPERATIONS_ADMIN'].includes(role);
}

function groupMap(row = {}, membership = null) {
  const data = row.payload && typeof row.payload === 'object' ? row.payload : {};
  return {
    id: row.id || '',
    groupId: row.group_key || '',
    groupKey: row.group_key || '',
    title: row.name || '',
    name: row.name || '',
    description: row.description || '',
    channelName: row.channel_name || row.pusher_channel || '',
    pusherChannelName: row.pusher_channel || row.channel_name || '',
    livekitRoomName: row.livekit_room || '',
    groupType: row.group_type || '',
    visibility: row.visibility || 'members',
    status: row.status || 'active',
    active: String(row.status || 'active').toLowerCase() === 'active',
    canVoice: row.can_voice !== false,
    canChat: row.can_chat !== false,
    canLocation: row.can_location !== false,
    canTicket: row.can_ticket !== false,
    sortOrder: row.sort_order || 100,
    capabilities: {
      canListen: membership ? membership.can_listen !== false : true,
      canTalk: membership ? membership.can_talk === true : row.can_voice !== false,
      canAdmin: membership ? membership.can_admin === true : false,
      canViewLocations: membership ? membership.can_view_locations === true : false,
      canManageTickets: membership ? membership.can_manage_tickets === true : false,
    },
    payload: data,
  };
}

function ticketMap(row = {}) {
  return {
    id: row.id || '',
    ticketId: row.ticket_number || '',
    ticketNumber: row.ticket_number || '',
    groupId: row.group_key || '',
    category: row.category_key || '',
    priority: row.priority || 'NORMAL',
    status: row.status || 'OPEN',
    title: row.title || '',
    subject: row.title || '',
    description: row.description || '',
    message: row.description || '',
    requesterSkId: row.requester_sk_id || '',
    requesterName: row.requester_name || '',
    requesterEmail: row.requester_email || '',
    assignedSkId: row.assigned_sk_id || '',
    assignedName: row.assigned_name || '',
    locationLabel: row.location_label || '',
    latitude: row.latitude || null,
    longitude: row.longitude || null,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    payload: row.payload || {},
  };
}

function categoryMap(row = {}) {
  return {
    id: row.id || '',
    categoryKey: row.category_key || '',
    label: row.label || '',
    description: row.description || '',
    color: row.color || '',
    icon: row.icon || '',
    priorityDefault: row.priority_default || 'NORMAL',
    slaMinutes: row.sla_minutes || 0,
    active: row.is_active !== false,
    sortOrder: row.sort_order || 100,
    payload: row.payload || {},
  };
}

async function pusherClient() {
  if (!pusherPromise) {
    pusherPromise = Promise.all([
      getSecret('PUSHER_APP_ID'), getSecret('PUSHER_KEY'),
      getSecret('PUSHER_SECRET'), getSecret('PUSHER_CLUSTER'),
    ]).then(([appId, keyValue, secret, cluster]) => {
      if (!appId || !keyValue || !secret || !cluster) throw new Error('GROUPTALK_PUSHER_SECRETS_MISSING');
      return new Pusher({ appId, key: keyValue, secret, cluster, useTLS: true });
    }).catch((error) => {
      pusherPromise = null;
      throw error;
    });
  }
  return pusherPromise;
}

async function writeAudit(agent, eventType, payload = {}, groupKey = '', ticketNumber = '') {
  await Promise.all([
    restRequest({
      table: 'grouptalk_history',
      method: 'POST',
      body: {
        event_type: text(eventType, 120),
        group_key: text(groupKey, 120) || null,
        actor_agent_user_id: agent.id,
        actor_sk_id: agent.sk_id || null,
        actor_name: displayName(agent),
        ticket_number: text(ticketNumber, 120) || null,
        message: text(payload.message || eventType, 500),
        payload,
      },
      prefer: 'return=minimal',
    }),
    restRequest({
      table: 'grouptalk_audit',
      method: 'POST',
      body: {
        event_type: text(eventType, 120),
        entity_table: text(payload.entityTable, 120) || null,
        entity_id: text(payload.entityId, 120) || null,
        group_key: text(groupKey, 120) || null,
        ticket_number: text(ticketNumber, 120) || null,
        source: 'wix-backend',
        message: text(payload.message || eventType, 500),
        payload,
        created_by_agent_user_id: agent.id,
        created_by_name: displayName(agent),
      },
      prefer: 'return=minimal',
    }),
  ]).catch(() => null);
}

async function listMemberships(agentId) {
  return restRequest({
    table: 'grouptalk_group_members',
    query: { select: '*', agent_user_id: `eq.${agentId}`, membership_status: 'eq.active', limit: 200 },
  }).catch(() => []);
}

async function listAllowedGroups(agent) {
  const [groups, memberships] = await Promise.all([
    restRequest({ table: 'grouptalk_groups', query: { select: '*', status: 'eq.active', order: 'sort_order.asc', limit: 200 } }),
    listMemberships(agent.id),
  ]);
  const byKey = new Map((memberships || []).map((membership) => [membership.group_key, membership]));
  const admin = isGroupTalkAdmin(agent);
  return (groups || [])
    .filter((group) => admin || String(group.visibility || 'members').toLowerCase() === 'all' || byKey.has(group.group_key))
    .map((group) => {
      const membership = byKey.get(group.group_key) || null;
      const mapped = groupMap(group, membership);
      if (admin) {
        mapped.capabilities = {
          canListen: true,
          canTalk: group.can_voice !== false,
          canAdmin: true,
          canViewLocations: group.can_location !== false,
          canManageTickets: true,
        };
      }
      return mapped;
    });
}

async function requireGroup(agent, supplied) {
  const groups = await listAllowedGroups(agent);
  const wanted = key(supplied);
  const group = groups.find((item) => key(item.groupKey) === wanted || key(item.groupId) === wanted || key(item.title) === wanted)
    || groups[0];
  if (!group) throw new Error('GROUPTALK_GROUP_NOT_AVAILABLE');
  return group;
}

async function publicConfig() {
  const [pusherKey, pusherCluster, livekitUrl] = await Promise.all([
    getSecret('PUSHER_KEY').catch(() => ''),
    getSecret('PUSHER_CLUSTER').catch(() => ''),
    getSecret('LIVEKIT_URL').catch(() => ''),
  ]);
  return { pusherKey: pusherKey || '', pusherCluster: pusherCluster || '', livekitUrl: livekitUrl || '' };
}

export const getGroupTalkBootstrap = webMethod(Permissions.SiteMember, async () => {
  const { agent, profile } = await requireInternalAgent({ capability: 'grouptalk' });
  const groups = await listAllowedGroups(agent);
  const activeGroup = groups.find((group) => group.payload?.defaultGroup === true) || groups[0] || null;
  const [phonebook, tickets, categories, config] = await Promise.all([
    restRequest({ table: 'grouptalk_phonebook', query: { select: '*', is_visible: 'eq.true', order: 'display_name.asc', limit: 500 } }).catch(() => []),
    restRequest({ table: 'grouptalk_tickets', query: { select: '*', order: 'updated_at.desc', limit: 100 } }).catch(() => []),
    restRequest({ table: 'grouptalk_ticket_categories', query: { select: '*', is_active: 'eq.true', order: 'sort_order.asc', limit: 100 } }).catch(() => []),
    publicConfig(),
  ]);
  const groupKeys = new Set(groups.map((group) => group.groupKey));
  const visibleTickets = isGroupTalkAdmin(agent)
    ? tickets
    : tickets.filter((ticket) => ticket.requester_agent_user_id === agent.id || groupKeys.has(ticket.group_key));
  return {
    ok: true,
    profile: { ...profile, canManage: isGroupTalkAdmin(agent) },
    groups,
    activeGroupId: activeGroup?.groupKey || '',
    phonebook: (phonebook || []).map((row) => ({
      id: row.id, skId: row.sk_id || '', name: row.display_name || '', email: row.email || '', phone: row.phone || '',
      extension: row.extension || '', department: row.department || '', base: row.base || row.station || '',
      station: row.station || row.base || '', position: row.position || '', presenceStatus: row.presence_status || 'offline',
      availabilityStatus: row.availability_status || '', avatarUrl: row.avatar_url || '',
    })),
    tickets: visibleTickets.map(ticketMap),
    ticketCategories: (categories || []).map(categoryMap),
    config,
    canManage: isGroupTalkAdmin(agent),
  };
});

export const authorizePusherChannel = webMethod(Permissions.SiteMember, async ({ socketId, channelName } = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const socket = text(socketId, 120);
  const channel = text(channelName, 240);
  if (!socket || !channel || !/^(private|presence)-[A-Za-z0-9_-]+$/.test(channel)) throw new Error('GROUPTALK_PUSHER_CHANNEL_INVALID');
  const groups = await listAllowedGroups(agent);
  const group = groups.find((item) => item.pusherChannelName === channel || item.channelName === channel);
  if (!group) throw new Error('GROUPTALK_PUSHER_CHANNEL_DENIED');
  const pusher = await pusherClient();
  const auth = pusher.authorizeChannel(socket, channel, {
    user_id: agent.sk_id || agent.id,
    user_info: { name: displayName(agent), role: agent.role || '', groupKey: group.groupKey },
  });
  await writeAudit(agent, 'PUSHER_AUTHORIZED', { entityTable: 'grouptalk_realtime_sessions', message: 'Pusher channel authorized.' }, group.groupKey);
  return auth;
});

export const createLiveKitToken = webMethod(Permissions.SiteMember, async ({ groupId } = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const group = await requireGroup(agent, groupId);
  if (!group.capabilities.canListen) throw new Error('GROUPTALK_LISTEN_DENIED');
  const [apiKey, apiSecret, livekitUrl] = await Promise.all([
    getSecret('LIVEKIT_API_KEY'), getSecret('LIVEKIT_API_SECRET'), getSecret('LIVEKIT_URL'),
  ]);
  if (!apiKey || !apiSecret || !livekitUrl) throw new Error('GROUPTALK_LIVEKIT_SECRETS_MISSING');
  const room = group.livekitRoomName || `grouptalk-${group.groupKey}`;
  const token = new AccessToken(apiKey, apiSecret, { identity: agent.sk_id || agent.id, name: displayName(agent), ttl: '15m' });
  token.addGrant({ roomJoin: true, room, canSubscribe: true, canPublish: group.capabilities.canTalk === true, canPublishData: true });
  const jwt = await token.toJwt();
  const sessionKey = `LK-${agent.id}-${Date.now()}`;
  await restRequest({
    table: 'grouptalk_realtime_sessions', method: 'POST',
    body: {
      session_key: sessionKey, agent_user_id: agent.id, sk_id: agent.sk_id || null, display_name: displayName(agent),
      pusher_channel: group.pusherChannelName || null, livekit_room: room, livekit_identity: agent.sk_id || agent.id,
      status: 'TOKEN_ISSUED', joined_at: now(), payload: { groupKey: group.groupKey, canPublish: group.capabilities.canTalk === true },
    }, prefer: 'return=minimal',
  });
  await writeAudit(agent, 'LIVEKIT_TOKEN_ISSUED', { entityTable: 'grouptalk_realtime_sessions', entityId: sessionKey }, group.groupKey);
  return { ok: true, livekitUrl, token: jwt, roomName: room, groupId: group.groupKey, canPublishAudio: group.capabilities.canTalk === true, canSubscribe: true };
});

export const triggerGroupTalkEvent = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const eventType = upper(input.type, 80);
  if (!EVENT_TYPES.has(eventType)) throw new Error('GROUPTALK_EVENT_NOT_ALLOWED');
  const group = await requireGroup(agent, input.groupId || input.groupKey || input.group);
  if ((eventType === 'PTT_DOWN' || eventType === 'PTT_DOWN_DESKTOP' || eventType === 'AUDIO_START') && !group.capabilities.canTalk) {
    throw new Error('GROUPTALK_TALK_DENIED');
  }
  const event = {
    type: eventType, groupKey: group.groupKey, skId: agent.sk_id || '', name: displayName(agent), role: agent.role || '',
    timestamp: now(), priority: text(input.priority, 40) || 'NORMAL', targetSkId: text(input.targetSkId, 80) || null,
  };
  const pusher = await pusherClient();
  await pusher.trigger(group.pusherChannelName, 'grouptalk-event', event);
  await writeAudit(agent, eventType, { entityTable: 'grouptalk_history', message: `GroupTalk ${eventType}` }, group.groupKey);
  return { ok: true, channel: group.pusherChannelName, payload: event };
});

export const getPhoneBook = webMethod(Permissions.SiteMember, async ({ groupId } = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  await requireGroup(agent, groupId);
  const rows = await restRequest({ table: 'grouptalk_phonebook', query: { select: '*', is_visible: 'eq.true', order: 'display_name.asc', limit: 500 } });
  return { ok: true, contacts: (rows || []).map((row) => ({
    id: row.id, skId: row.sk_id || '', name: row.display_name || '', email: row.email || '', phone: row.phone || '', extension: row.extension || '',
    base: row.base || '', station: row.station || '', department: row.department || '', position: row.position || '',
    presenceStatus: row.presence_status || 'offline', availabilityStatus: row.availability_status || '', avatarUrl: row.avatar_url || '',
  })) };
});

export const sendLocationPing = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const group = await requireGroup(agent, input.groupId || input.groupKey);
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('GROUPTALK_LOCATION_INVALID');
  }
  const rows = await restRequest({
    table: 'grouptalk_locations', method: 'POST', query: { on_conflict: 'agent_user_id' },
    body: {
      agent_user_id: agent.id, sk_id: agent.sk_id || null, display_name: displayName(agent), latitude, longitude,
      accuracy_meters: Number(input.accuracy) || null, heading: Number(input.heading) || null, speed: Number(input.speed) || null,
      source: 'wix-grouptalk', group_key: group.groupKey, last_seen_at: now(), payload: { batteryLevel: input.batteryLevel ?? null }, updated_at: now(),
    }, prefer: 'resolution=merge-duplicates,return=representation',
  });
  const location = rows?.[0] || null;
  const pusher = await pusherClient();
  await pusher.trigger(group.pusherChannelName, 'location-updated', { skId: agent.sk_id || '', name: displayName(agent), groupId: group.groupKey, latitude, longitude, timestamp: now() });
  await writeAudit(agent, 'LOCATION_PING', { entityTable: 'grouptalk_locations', entityId: location?.id || '' }, group.groupKey);
  return { ok: true, location };
});

export const getLiveLocations = webMethod(Permissions.SiteMember, async ({ groupId } = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const group = await requireGroup(agent, groupId);
  if (!isGroupTalkAdmin(agent) && !group.capabilities.canViewLocations) throw new Error('GROUPTALK_LOCATION_VIEW_DENIED');
  const rows = await restRequest({ table: 'grouptalk_locations', query: { select: '*', group_key: `eq.${group.groupKey}`, order: 'last_seen_at.desc', limit: 500 } });
  return { ok: true, locations: (rows || []).map((row) => ({
    id: row.id, skId: row.sk_id || '', displayName: row.display_name || '', latitude: row.latitude, longitude: row.longitude,
    accuracy: row.accuracy_meters || 0, heading: row.heading || 0, speed: row.speed || 0, groupId: row.group_key || '', lastSeenAt: row.last_seen_at || '',
  })) };
});

export const createGroupTalkTicket = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const group = await requireGroup(agent, input.groupId || input.groupKey);
  if (!group.capabilities.canManageTickets && group.canTicket === false) throw new Error('GROUPTALK_TICKET_CREATE_DENIED');
  const description = text(input.message ?? input.description, 5000);
  const title = text(input.subject ?? input.title, 240) || description.slice(0, 100);
  if (!title || !description) throw new Error('GROUPTALK_TICKET_REQUIRED');
  const ticketNumber = `GT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const rows = await restRequest({
    table: 'grouptalk_tickets', method: 'POST',
    body: {
      ticket_number: ticketNumber, category_key: key(input.category || 'general') || 'general', group_id: group.id || null, group_key: group.groupKey,
      title, description, status: 'OPEN', priority: upper(input.priority || 'NORMAL', 40),
      requester_agent_user_id: agent.id, requester_sk_id: agent.sk_id || null, requester_name: displayName(agent), requester_email: agent.email || null,
      location_label: text(input.locationLabel, 240) || null, latitude: Number(input.latitude) || null, longitude: Number(input.longitude) || null,
      payload: input, created_by_agent_user_id: agent.id,
    },
  });
  const ticket = rows?.[0];
  const pusher = await pusherClient();
  await pusher.trigger(group.pusherChannelName, 'ticket-created', { ticket: ticketMap(ticket), timestamp: now() });
  await writeAudit(agent, 'TICKET_CREATED', { entityTable: 'grouptalk_tickets', entityId: ticket?.id || '' }, group.groupKey, ticketNumber);
  return { ok: true, ticket: ticketMap(ticket) };
});

export const getGroupTalkTickets = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const groups = await listAllowedGroups(agent);
  const allowedKeys = new Set(groups.map((group) => group.groupKey));
  const ticketId = text(input.ticketId || input.ticketNumber, 120);
  const query = { select: '*', order: 'updated_at.desc', limit: 200 };
  if (ticketId) query.ticket_number = `eq.${ticketId}`;
  if (input.groupId) query.group_key = `eq.${text(input.groupId, 120)}`;
  const rows = await restRequest({ table: 'grouptalk_tickets', query });
  const tickets = (rows || []).filter((ticket) => isGroupTalkAdmin(agent) || ticket.requester_agent_user_id === agent.id || allowedKeys.has(ticket.group_key));
  if (ticketId) {
    const ticket = tickets[0];
    if (!ticket) throw new Error('GROUPTALK_TICKET_NOT_FOUND');
    const replies = await restRequest({ table: 'grouptalk_ticket_replies', query: { select: '*', ticket_number: `eq.${ticket.ticket_number}`, order: 'created_at.asc', limit: 500 } });
    return { ok: true, ticket: ticketMap(ticket), messages: replies || [] };
  }
  return { ok: true, tickets: tickets.map(ticketMap) };
});

export const replyToGroupTalkTicket = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  const ticketNumber = text(input.ticketId || input.ticketNumber, 120);
  const body = text(input.body || input.message, 5000);
  if (!ticketNumber || !body) throw new Error('GROUPTALK_TICKET_REPLY_REQUIRED');
  const rows = await restRequest({ table: 'grouptalk_tickets', query: { select: '*', ticket_number: `eq.${ticketNumber}`, limit: 1 } });
  const ticket = rows?.[0];
  if (!ticket) throw new Error('GROUPTALK_TICKET_NOT_FOUND');
  if (!isGroupTalkAdmin(agent) && ticket.requester_agent_user_id !== agent.id) throw new Error('GROUPTALK_TICKET_REPLY_DENIED');
  const replyRows = await restRequest({
    table: 'grouptalk_ticket_replies', method: 'POST',
    body: { ticket_id: ticket.id, ticket_number: ticket.ticket_number, body, author_agent_user_id: agent.id, author_sk_id: agent.sk_id || null, author_name: displayName(agent), reply_type: text(input.replyType, 80) || 'MESSAGE', is_internal: true, payload: input },
  });
  const status = upper(input.status || (isGroupTalkAdmin(agent) ? 'WAITING_STAFF' : 'WAITING_OPERATIONS'), 80);
  const updatedRows = await restRequest({ table: 'grouptalk_tickets', method: 'PATCH', query: { id: `eq.${ticket.id}` }, body: { status, closed_at: ['CLOSED', 'RESOLVED'].includes(status) ? now() : null, updated_at: now() } });
  const updated = updatedRows?.[0] || ticket;
  const group = await requireGroup(agent, updated.group_key);
  const pusher = await pusherClient();
  await pusher.trigger(group.pusherChannelName, 'ticket-updated', { ticket: ticketMap(updated), reply: replyRows?.[0] || null, timestamp: now() });
  await writeAudit(agent, 'TICKET_REPLIED', { entityTable: 'grouptalk_tickets', entityId: ticket.id }, group.groupKey, ticket.ticket_number);
  return { ok: true, ticket: ticketMap(updated), reply: replyRows?.[0] || null };
});

export const searchGroupTalkHistory = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireInternalAgent({ capability: 'grouptalk' });
  const q = text(input.query || input.search, 80);
  const query = { select: '*', order: 'created_at.desc', limit: Math.min(Math.max(Number(input.limit) || 100, 1), 500) };
  if (input.groupId) query.group_key = `eq.${text(input.groupId, 120)}`;
  if (q) query.or = `(actor_name.ilike.*${q}*,actor_sk_id.ilike.*${q}*,ticket_number.ilike.*${q}*,message.ilike.*${q}*)`;
  const events = await restRequest({ table: 'grouptalk_history', query });
  return { ok: true, events: events || [], history: events || [] };
});

export const getTicketCategories = webMethod(Permissions.SiteMember, async () => {
  await requireInternalAgent({ capability: 'grouptalk' });
  const rows = await restRequest({ table: 'grouptalk_ticket_categories', query: { select: '*', order: 'sort_order.asc', limit: 200 } });
  return { ok: true, categories: (rows || []).map(categoryMap) };
});

export const saveTicketCategory = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  if (!isGroupTalkAdmin(agent)) throw new Error('GROUPTALK_CATEGORY_ADMIN_DENIED');
  const category = input.category || input;
  const categoryKey = key(category.categoryKey || category.key || category.label, 80);
  const label = text(category.label || category.title, 160);
  if (!categoryKey || !label) throw new Error('GROUPTALK_CATEGORY_REQUIRED');
  const existing = await restRequest({ table: 'grouptalk_ticket_categories', query: { select: '*', category_key: `eq.${categoryKey}`, limit: 1 } }).then((rows) => rows?.[0] || null);
  const body = { category_key: categoryKey, label, description: text(category.description, 1000) || null, color: text(category.color, 40) || null, icon: text(category.icon, 80) || null, priority_default: upper(category.priorityDefault || category.priority || 'NORMAL', 40), sla_minutes: Number(category.slaMinutes) || null, is_active: bool(category.active, true), sort_order: Number(category.sortOrder) || 100, payload: category, created_by_agent_user_id: agent.id, updated_at: now() };
  const rows = existing
    ? await restRequest({ table: 'grouptalk_ticket_categories', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'grouptalk_ticket_categories', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await writeAudit(agent, 'TICKET_CATEGORY_SAVED', { entityTable: 'grouptalk_ticket_categories', entityId: saved?.id || '' });
  return { ok: true, category: categoryMap(saved) };
});

export const deleteTicketCategory = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  if (!isGroupTalkAdmin(agent)) throw new Error('GROUPTALK_CATEGORY_ADMIN_DENIED');
  const id = text(input.id || input.categoryId || input.categoryKey, 120);
  if (!id) throw new Error('GROUPTALK_CATEGORY_REQUIRED');
  const by = /^[0-9a-f-]{36}$/i.test(id) ? { id: `eq.${id}` } : { category_key: `eq.${key(id)}` };
  await restRequest({ table: 'grouptalk_ticket_categories', method: 'DELETE', query: by, prefer: 'return=minimal' });
  await writeAudit(agent, 'TICKET_CATEGORY_DELETED', { entityTable: 'grouptalk_ticket_categories', entityId: id });
  return { ok: true };
});

export const adminSaveGroup = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  if (!isGroupTalkAdmin(agent)) throw new Error('GROUPTALK_GROUP_ADMIN_DENIED');
  const group = input.group || input;
  const groupKey = key(group.groupKey || group.groupId || group.slug || group.title, 100);
  const name = text(group.name || group.title, 180);
  if (!groupKey || !name) throw new Error('GROUPTALK_GROUP_REQUIRED');
  const existing = await restRequest({ table: 'grouptalk_groups', query: { select: '*', group_key: `eq.${groupKey}`, limit: 1 } }).then((rows) => rows?.[0] || null);
  const channel = text(group.pusherChannelName || group.pusherChannel || group.channelName, 240) || `presence-grouptalk-${groupKey}`;
  const room = text(group.livekitRoomName || group.livekitRoom, 240) || `grouptalk-${groupKey}`;
  const body = { group_key: groupKey, name, description: text(group.description, 1000) || null, channel_name: channel, pusher_channel: channel, livekit_room: room, group_type: text(group.groupType || group.category || 'operations', 80) || null, visibility: text(group.visibility || 'members', 80) || 'members', status: bool(group.active, true) ? 'active' : 'inactive', can_voice: bool(group.canVoice ?? group.canStaffTalk, true), can_chat: bool(group.canChat, true), can_location: bool(group.canLocation, true), can_ticket: bool(group.canTicket ?? group.canStaffCreateTickets, true), sort_order: Number(group.sortOrder) || 100, payload: group, created_by_agent_user_id: agent.id, updated_at: now() };
  const rows = existing
    ? await restRequest({ table: 'grouptalk_groups', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'grouptalk_groups', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await writeAudit(agent, 'GROUP_SAVED', { entityTable: 'grouptalk_groups', entityId: saved?.id || '' }, groupKey);
  return { ok: true, group: groupMap(saved) };
});

export const adminSetMembership = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ capability: 'grouptalk' });
  if (!isGroupTalkAdmin(agent)) throw new Error('GROUPTALK_MEMBERSHIP_ADMIN_DENIED');
  const membership = input.membership || input;
  const groupKey = key(membership.groupKey || membership.groupId, 100);
  const agentUserId = text(membership.agentUserId || membership.agent_user_id, 80);
  if (!groupKey || !agentUserId) throw new Error('GROUPTALK_MEMBERSHIP_REQUIRED');
  const existing = await restRequest({ table: 'grouptalk_group_members', query: { select: '*', group_key: `eq.${groupKey}`, agent_user_id: `eq.${agentUserId}`, limit: 1 } }).then((rows) => rows?.[0] || null);
  const body = { group_key: groupKey, agent_user_id: agentUserId, sk_id: text(membership.skId, 80) || null, display_name: text(membership.displayName, 240) || null, email: text(membership.email, 240) || null, role: text(membership.role, 80) || 'member', membership_status: bool(membership.active, true) ? 'active' : 'inactive', can_talk: bool(membership.canTalk, false), can_listen: bool(membership.canListen, true), can_admin: bool(membership.canAdmin ?? membership.canAdminGroup, false), can_view_locations: bool(membership.canViewLocations ?? membership.canViewMap, false), can_manage_tickets: bool(membership.canManageTickets ?? membership.canResolveTickets, false), payload: membership, created_by_agent_user_id: agent.id, updated_at: now() };
  const rows = existing
    ? await restRequest({ table: 'grouptalk_group_members', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'grouptalk_group_members', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await writeAudit(agent, 'GROUP_MEMBERSHIP_SAVED', { entityTable: 'grouptalk_group_members', entityId: saved?.id || '' }, groupKey);
  return { ok: true, membership: saved };
});

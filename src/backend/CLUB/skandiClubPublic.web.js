import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from '../RIA/supabaseServer.js';

export const getSkandiClubPublicPayload = webMethod(Permissions.Anyone, async () => {
  const tiers = await restRequest({ table: 'club_tiers', query: { select: '*', active: 'eq.true', order: 'sort_order.asc', limit: 100 } }).catch(() => []);
  return { ok: true, tiers: (tiers || []).map((tier) => ({ id: tier.id || '', key: tier.tier_key || '', name: tier.tier_name || '', minPoints: Number(tier.min_points || 0), maxPoints: Number(tier.max_points || 0), multiplier: Number(tier.multiplier || 1), payload: tier.payload || {} })) };
});

// /src/backend/SKANDI_CORE/clubPublic.js
// SKANDI Club — B-011.1 public program/tier read projection.
//
// Authenticated My Profile loyalty ownership remains in customerProfile.js.
// This module exposes only customer-safe public Club program information and
// active tier configuration for /skandi-club.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

export const CLUB_PUBLIC_VERSION = "B-011.1";

const TIER_ORDER = Object.freeze(["member", "silver", "gold", "diamond"]);

function clean(value, max = 3000) {
  return String(value ?? "").trim().slice(0, max);
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function publicTier(row = {}) {
  const payload = obj(row.payload);
  return {
    id: clean(row.id, 180),
    key: clean(row.tier_key, 80).toLowerCase(),
    name: clean(row.tier_name, 160),
    minPoints: Number(row.min_points || 0),
    maxPoints: row.max_points === null ? null : Number(row.max_points),
    multiplier: Number(row.multiplier || 1),
    sortOrder: Number(row.sort_order || 999),
    benefits: arr(payload.benefits)
      .map(item => clean(typeof item === "string" ? item : item?.title || item?.label, 500))
      .filter(Boolean)
      .slice(0, 12)
  };
}

export async function getSkandiClubPublicPayloadCore() {
  const rows = await restRequest({
    table: "club_tiers",
    method: "GET",
    query: {
      select: "id,tier_key,tier_name,min_points,max_points,multiplier,sort_order,active,payload",
      active: "eq.true",
      order: "sort_order.asc",
      limit: "20"
    },
    prefer: ""
  });

  const byKey = new Map(
    arr(rows)
      .map(publicTier)
      .filter(tier => TIER_ORDER.includes(tier.key))
      .map(tier => [tier.key, tier])
  );

  const tiers = TIER_ORDER
    .map(key => byKey.get(key))
    .filter(Boolean);

  return {
    ok: true,
    source: "SUPABASE_CLUB_TIERS",
    version: CLUB_PUBLIC_VERSION,
    program: {
      name: "SKANDI Club",
      pointsName: "SKANDI Points"
    },
    tiers,
    rewards: [],
    faqs: [],
    settings: {
      programSubtitle: "Travel further, together.",
      pointsToCreditRate: 0.01,
      creditExample: "$10"
    },
    generatedAt: new Date().toISOString()
  };
}

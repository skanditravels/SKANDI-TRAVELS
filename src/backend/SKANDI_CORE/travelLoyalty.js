// /src/backend/SKANDI_CORE/travelLoyalty.js
// SKANDI V12 — deferred travel loyalty release.
// Booking truth remains in ALTEA/Supabase. Wix Loyalty is the external points account authority.

import { accounts } from "wix-loyalty.v2";
import { elevate } from "wix-auth";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const elevatedGetAccountBySecondaryId = elevate(accounts.getAccountBySecondaryId);
const elevatedEarnPoints = elevate(accounts.earnPoints);

const VERSION = "V12-TRAVEL-LOYALTY-2026-10-14";
const PAGE_SIZE = 1000;
const POSTED = "POSTED";
const PENDING = "PENDING";
const CANCELED_BOOKING_STATUSES = new Set(["cancelled", "canceled", "refunded", "rejected", "void"]);

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
function upper(value, max = 500) {
  return clean(value, max).toUpperCase();
}
function lower(value, max = 500) {
  return clean(value, max).toLowerCase();
}
function arr(value) {
  return Array.isArray(value) ? value : [];
}
function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function qeq(value) {
  return `eq.${clean(value, 1200)}`;
}
function isoNow() {
  return new Date().toISOString();
}
function dateOnly(value) {
  const raw = clean(value, 80);
  if (!raw) return "";
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}
function maxDate(values = []) {
  return arr(values).map(dateOnly).filter(Boolean).sort().at(-1) || "";
}
function nextUtcDate(date) {
  const d = dateOnly(date);
  if (!d) return "";
  const parsed = new Date(`${d}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) return "";
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}
function pointsTransactionId(bookingId) {
  return `SKANDI-TRAVEL-${clean(bookingId, 80)}`;
}

async function select(table, query = {}) {
  const rows = await restRequest({ table, method: "GET", query, prefer: "" });
  return arr(rows);
}
async function patch(table, query, body) {
  const rows = await restRequest({ table, method: "PATCH", query, body, prefer: "return=representation" });
  return arr(rows);
}
async function insert(table, body) {
  const rows = await restRequest({ table, method: "POST", body, prefer: "return=representation" });
  return arr(rows);
}

async function latestActivityDate(booking) {
  const bookingId = clean(booking?.id, 80);
  if (!bookingId) return maxDate([booking?.return_date, booking?.departure_date]);

  const [segments, components] = await Promise.all([
    select("altea_segments", {
      select: "start_date,end_date,payload",
      booking_id: qeq(bookingId),
      limit: "1000"
    }).catch(() => []),
    select("altea_booking_components", {
      select: "component_type,payload",
      booking_id: qeq(bookingId),
      limit: "1000"
    }).catch(() => [])
  ]);

  const candidates = [booking.return_date, booking.departure_date];
  for (const segment of segments) {
    candidates.push(segment.end_date, segment.start_date);
    const p = obj(segment.payload);
    candidates.push(
      p.arrivingAt, p.arriving_at, p.endDate, p.end_date,
      p.checkOutDate, p.check_out_date, p.dropoffDate, p.dropoff_date,
      p.returnDate, p.return_date
    );
  }
  for (const component of components) {
    const p = obj(component.payload);
    candidates.push(
      p.arrivingAt, p.arriving_at, p.endDate, p.end_date,
      p.checkOutDate, p.check_out_date, p.dropoffDate, p.dropoff_date,
      p.returnDate, p.return_date, p.activityDate, p.activity_date
    );
  }

  return maxDate(candidates);
}

async function customerProfile(memberId) {
  const id = clean(memberId, 180);
  if (!id) return null;
  const rows = await select("customer_profiles", {
    select: "id,member_id,wix_member_id,is_loyalty_member,club_number,club_tier_id,status",
    member_id: qeq(id),
    limit: "1"
  });
  if (rows[0]) return rows[0];
  const byWix = await select("customer_profiles", {
    select: "id,member_id,wix_member_id,is_loyalty_member,club_number,club_tier_id,status",
    wix_member_id: qeq(id),
    limit: "1"
  });
  return byWix[0] || null;
}

async function ledgerTransaction(transactionId) {
  const rows = await select("skandi_points_ledger", {
    select: "id,transaction_id,member_id,booking_id,booking_reference,amount,status,payload,created_at",
    transaction_id: qeq(transactionId),
    limit: "1"
  });
  return rows[0] || null;
}

async function markAccrual(booking, nextAccrual) {
  const payload = obj(booking.payload);
  const updatedPayload = { ...payload, loyaltyAccrual: nextAccrual };
  const rows = await patch("altea_bookings", { id: qeq(booking.id) }, { payload: updatedPayload, updated_at: isoNow() });
  return rows[0] || { ...booking, payload: updatedPayload };
}

async function resolveWixLoyaltyAccount(profile) {
  const wixMemberId = clean(profile?.wix_member_id || profile?.member_id, 180);
  if (!wixMemberId) throw new Error("WIX_MEMBER_ID_REQUIRED");
  const response = await elevatedGetAccountBySecondaryId({ memberId: wixMemberId });
  const account = response?.account || response;
  const accountId = clean(account?._id || account?.id, 80);
  if (!accountId) throw new Error("WIX_LOYALTY_ACCOUNT_NOT_FOUND");
  return account;
}

async function releaseBookingAccrual(booking) {
  const payload = obj(booking.payload);
  const accrual = obj(payload.loyaltyAccrual);
  if (upper(accrual.status, 40) !== PENDING) return { skipped: true, reason: "NOT_PENDING" };

  if (CANCELED_BOOKING_STATUSES.has(lower(booking.status, 40))) {
    await markAccrual(booking, { ...accrual, status: "CANCELLED", cancelledAt: isoNow(), cancellationReason: "BOOKING_STATUS" });
    return { skipped: true, reason: "BOOKING_CANCELLED" };
  }

  const profile = await customerProfile(booking.customer_member_id || accrual.memberId);
  if (!profile?.is_loyalty_member) {
    await markAccrual(booking, { ...accrual, status: "INELIGIBLE", checkedAt: isoNow(), errorCode: "SKANDI_CLUB_MEMBER_REQUIRED" });
    return { skipped: true, reason: "NOT_CLUB_MEMBER" };
  }

  const lastActivityDate = await latestActivityDate(booking);
  const releaseDate = nextUtcDate(lastActivityDate);
  if (!lastActivityDate || !releaseDate) {
    await markAccrual(booking, { ...accrual, lastCheckedAt: isoNow(), errorCode: "LAST_ACTIVITY_DATE_REQUIRED" });
    return { skipped: true, reason: "NO_LAST_ACTIVITY_DATE" };
  }

  if (releaseDate > todayUtc()) {
    if (dateOnly(accrual.lastActivityDate) !== lastActivityDate || dateOnly(accrual.releaseDate) !== releaseDate) {
      await markAccrual(booking, { ...accrual, lastActivityDate, releaseDate, lastCheckedAt: isoNow(), errorCode: null });
    }
    return { skipped: true, reason: "NOT_DUE", releaseDate };
  }

  const pointsAmount = Math.trunc(Number(accrual.pointsAmount || 0));
  if (!Number.isFinite(pointsAmount) || pointsAmount <= 0) {
    await markAccrual(booking, { ...accrual, status: "INELIGIBLE", lastActivityDate, releaseDate, lastCheckedAt: isoNow(), errorCode: "POINTS_AMOUNT_INVALID" });
    return { skipped: true, reason: "INVALID_POINTS" };
  }

  const transactionId = clean(accrual.transactionId || pointsTransactionId(booking.id), 180);
  const existing = await ledgerTransaction(transactionId);
  if (existing && upper(existing.status, 40) === POSTED) {
    await markAccrual(booking, {
      ...accrual,
      status: POSTED,
      transactionId,
      lastActivityDate,
      releaseDate,
      postedAt: existing.created_at || isoNow(),
      ledgerId: existing.id,
      lastCheckedAt: isoNow(),
      errorCode: null
    });
    return { posted: true, alreadyPosted: true, transactionId };
  }

  const loyaltyAccount = await resolveWixLoyaltyAccount(profile);
  const loyaltyAccountId = clean(loyaltyAccount?._id || loyaltyAccount?.id, 80);
  const wixResult = await elevatedEarnPoints(loyaltyAccountId, {
    amount: pointsAmount,
    description: `SKANDI travel ${clean(booking.booking_reference || booking.pnr_locator || booking.id, 120)}`,
    appId: "SKANDI_TRAVEL",
    idempotencyKey: transactionId
  });

  const ledgerRows = await insert("skandi_points_ledger", {
    transaction_id: transactionId,
    member_id: profile.member_id,
    wix_member_id: profile.wix_member_id || profile.member_id || null,
    booking_id: clean(booking.id, 80),
    booking_reference: clean(booking.booking_reference || booking.pnr_locator, 160) || null,
    transaction_date: isoNow(),
    type: "TRAVEL_EARN",
    amount: pointsAmount,
    description: `Travel points released after completed itinerary ${clean(booking.booking_reference || booking.pnr_locator, 120)}`,
    status: POSTED,
    is_manual_adjustment: false,
    payload: {
      source: "TRAVEL_LOYALTY",
      version: VERSION,
      eligibleAmount: Number(accrual.eligibleAmount || booking.total_amount || 0),
      currency: clean(accrual.currency || booking.currency || "USD", 3),
      baseRatePointsPerUsd: Number(accrual.baseRatePointsPerUsd || 1),
      multiplier: Number(accrual.multiplier || 1),
      lastActivityDate,
      releaseDate,
      wixLoyaltyAccountId: loyaltyAccountId,
      wixTransactionId: clean(wixResult?.transaction_id || wixResult?.transactionId, 180) || null
    }
  });

  const ledger = ledgerRows[0] || null;
  await markAccrual(booking, {
    ...accrual,
    status: POSTED,
    transactionId,
    lastActivityDate,
    releaseDate,
    postedAt: isoNow(),
    ledgerId: ledger?.id || null,
    wixLoyaltyAccountId: loyaltyAccountId,
    wixTransactionId: clean(wixResult?.transaction_id || wixResult?.transactionId, 180) || null,
    lastCheckedAt: isoNow(),
    errorCode: null
  });

  return { posted: true, transactionId, pointsAmount };
}

export async function releaseEligibleTravelPoints() {
  const bookings = await select("altea_bookings", {
    select: "id,booking_reference,pnr_locator,customer_member_id,status,payment_status,fulfillment_status,departure_date,return_date,currency,total_amount,payload,updated_at",
    status: "eq.confirmed",
    order: "updated_at.asc",
    limit: String(PAGE_SIZE)
  });

  const results = [];
  for (const booking of bookings) {
    const accrual = obj(obj(booking.payload).loyaltyAccrual);
    if (upper(accrual.status, 40) !== PENDING) continue;
    try {
      results.push({ bookingId: booking.id, ...(await releaseBookingAccrual(booking)) });
    } catch (error) {
      const latestAccrual = obj(obj(booking.payload).loyaltyAccrual);
      await markAccrual(booking, {
        ...latestAccrual,
        lastCheckedAt: isoNow(),
        errorCode: clean(error?.code || error?.name || "TRAVEL_POINTS_RELEASE_FAILED", 120),
        errorMessage: clean(error?.message || "Travel points release failed.", 500)
      }).catch(() => {});
      results.push({ bookingId: booking.id, error: clean(error?.message || error, 500) });
    }
  }

  return {
    ok: true,
    version: VERSION,
    checked: bookings.length,
    processed: results.length,
    posted: results.filter(item => item.posted).length,
    results
  };
}

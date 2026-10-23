// /src/backend/SKANDI_CORE/toursActivities.js
// V12 Tours & Activities: public projection of canonical Inventory master and dated inventory.
// Checkout is deliberately blocked until an approved tour fulfillment/payment owner exists.
import { currentMember } from 'wix-members-backend';
import { restRequest } from 'backend/SKANDI_CORE/supabaseServer';
import { getCustomerProfileBootstrapCore } from 'backend/SKANDI_CORE/customerProfile';

const PUBLIC_VIEW = 'inventory_public_entities_v';
const DATED_TABLE = 'inventory_dated_inventory';
const TYPES = new Set(['GUIDED_TOUR', 'ACTIVITY', 'PARTNER_TICKET']);
const LANGUAGES = new Set(['EN', 'SV', 'NO', 'DA']);
const clean = (value, max = 2000) => String(value ?? '').trim().slice(0, max);
const arr = value => Array.isArray(value) ? value : [];
const obj = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const today = () => new Date().toISOString().slice(0, 10);
const row = value => arr(value)[0] || null;
const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 80));

function fail(code, message) { const e = new Error(message); e.code = code; e.publicMessage = message; throw e; }
function languageOf(input) { const lang = clean(input?.language, 4).toUpperCase(); return LANGUAGES.has(lang) ? lang : 'EN'; }
async function select(table, query) { const result = await restRequest({ table, method: 'GET', query, prefer: '' }); return arr(result); }
function url(v) { const s = clean(v, 2000); return /^https:\/\//i.test(s) ? s : ''; }
function localized(row, lang) {
  const list = arr(row.localized);
  return obj(list.find(x => clean(x.language, 4).toUpperCase() === lang && x.title) || list.find(x => x.language === 'EN') || list.find(x => x.title));
}
function lists(v) { return arr(v).map(x => clean(x, 3000).replace(/^\\?"|\\?"$/g, '').trim()).filter(Boolean); }
function nameOf(record) { return clean(record?.name, 240); }
function countryName(code, entities) { return nameOf(entities.find(x => x.entity_type === 'COUNTRY' && clean(x.code).toUpperCase() === code)) || code; }
function mediaOf(entry) {
  const images = arr(entry.media).filter(x => url(x?.url)).sort((a, b) => {
    const rank = x => x?.isCard === true ? 0 : x?.isPrimary === true ? 1 : x?.isHero === true ? 2 : x?.role === 'CARD' ? 3 : 4;
    return rank(a) - rank(b) || Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0);
  });
  return images.map(x => url(x.url)).slice(0, 12);
}
function categoryOf(raw, type) {
  const x = clean(raw, 120).toUpperCase();
  if (type === 'PARTNER_TICKET' || /MUSEUM|HISTOR|CULTUR|GUIDED|CITY|ATTRACTION/.test(x)) return 'attractions';
  if (/WATER|BOAT|CRUISE|SAILING|SNORKEL|DIVING/.test(x)) return 'water';
  if (/FOOD|WINE|CULINAR/.test(x)) return 'food';
  if (/TRANSFER|TRANSPORT/.test(x)) return 'transfers';
  if (/EXCURSION|DAY.?TRIP/.test(x) || type === 'GUIDED_TOUR') return 'daytrips';
  return 'activities';
}
function publicSchedule(record) {
  const adult = Number(record.adult_price ?? record.public_price);
  const child = record.child_price === null || record.child_price === undefined ? null : Number(record.child_price);
  return {
    id: clean(record.id, 80), date: clean(record.service_date, 10), time: clean(record.start_time, 8).slice(0, 5),
    available: Number(record.available ?? 0), capacity: Number(record.capacity_total ?? 0),
    variant: clean(record.variant_name, 180), currency: clean(record.currency, 3).toUpperCase(),
    adultPrice: Number.isFinite(adult) && adult >= 0 ? adult : null,
    childPrice: Number.isFinite(child) && child >= 0 ? child : null,
    priceBasis: clean(record.price_basis, 50)
  };
}
function publicExperience(entry, entities, schedule, lang) {
  const details = obj(entry.details), commercial = obj(entry.commercial), loc = localized(entry, lang);
  const destinationId = clean(details.destinationId || entry.parent_entity_id, 80);
  const dest = entities.find(x => x.id === destinationId) || entities.find(x => x.entity_type === 'DESTINATION' && arr(entry.relations).some(y => y.targetEntityId === x.id && y.relationType === 'DESTINATION'));
  const iso = clean(details.countryCode, 4).toUpperCase();
  const imageUrls = mediaOf(entry);
  const minutes = Number(details.durationMinutes);
  const price = Number(commercial.publicPrice);
  const dateRows = arr(schedule).filter(x => x.entity_id === entry.id).map(publicSchedule).sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const category = categoryOf(details.category, entry.entity_type);
  return {
    id: clean(entry.id, 80), publicId: clean(entry.public_id, 200), slug: clean(entry.slug, 240),
    code: clean(entry.code, 100), entityType: clean(entry.entity_type, 50),
    destination: clean(dest?.slug || dest?.id || '', 200), destinationId: clean(dest?.id || '', 80),
    destinationName: nameOf(dest), country: iso || 'unassigned', countryName: countryName(iso, entities),
    category, collection: clean(details.skandiTier || '', 50).toUpperCase() === 'SIGNATURE' ? 'signature' : '',
    title: clean(loc.title || entry.name, 500),
    description: clean(loc.shortDescription || loc.short_description || loc.seoDescription || loc.seo_description || '', 2500),
    fullDescription: clean(loc.fullDescription || loc.full_description || '', 10000),
    highlights: lists(loc.highlights), included: lists(loc.included), notIncluded: lists(loc.notIncluded || loc.not_included),
    importantInformation: clean(loc.importantInformation || loc.important_information || '', 5000),
    meetingPoint: clean(details.meetingPoint || details.meetingPointAddress || '', 2000),
    accessibility: clean(details.accessibility || '', 4000), cancellation: clean(details.cancellationPolicy || '', 3000),
    childPolicy: clean(details.childPolicy || '', 2000), minimumAge: Number.isFinite(Number(details.minimumAge)) ? Number(details.minimumAge) : null,
    image: imageUrls[0] || '', images: imageUrls,
    duration: Number.isFinite(minutes) && minutes > 0 ? `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} h` : ''}${minutes % 60 ? ` ${minutes % 60} min` : ''}`.trim() : '',
    durationCode: Number.isFinite(minutes) ? minutes <= 180 ? 'short' : minutes <= 300 ? 'half' : minutes <= 720 ? 'full' : 'multi' : '',
    durationMinutes: Number.isFinite(minutes) ? minutes : null,
    languages: arr(details.languages).map(x => { const value = clean(x, 60).toUpperCase(); return ({ ENGLISH:'EN', SWEDISH:'SV', NORWEGIAN:'NO', DANISH:'DA' })[value] || value; }),
    rating: null, reviews: null, freeCancellation: details.freeCancellation === true, pickup: details.hotelPickup === true,
    instant: details.instantConfirmation === true, accessible: details.wheelchairAccessible === true,
    price: Number.isFinite(price) && price >= 0 ? price : null,
    currency: /^[A-Z]{3}$/.test(clean(commercial.currency, 3).toUpperCase()) ? clean(commercial.currency, 3).toUpperCase() : '',
    priceBasis: clean(commercial.priceBasis, 50), availability: dateRows, bookableOnline: false,
    source: 'SKANDI_INVENTORY_V12', live: true
  };
}

async function catalog(lang = 'EN') {
  // inventory_public_entities_v already restricts to published public-safe records.
  const all = await select(PUBLIC_VIEW, {
    select: 'id,public_id,entity_type,code,name,slug,featured,homepage_featured,sort_priority,parent_entity_id,details,commercial,localized,media,relations',
    entity_type: 'in.(GUIDED_TOUR,ACTIVITY,PARTNER_TICKET,DESTINATION,AREA,COUNTRY)', limit: '1500', order: 'sort_priority.asc,name.asc'
  });
  const inventory = all.filter(x => TYPES.has(x.entity_type));
  const ids = inventory.map(x => x.id).filter(isUuid);
  const future = ids.length ? await select(DATED_TABLE, {
    select: 'id,entity_id,service_date,start_time,available,capacity_total,stop_sale,blackout,status,public_price,adult_price,child_price,currency,price_basis,variant_name',
    entity_id: `in.(${ids.join(',')})`, service_date: `gte.${today()}`,
    order: 'service_date.asc,start_time.asc', limit: '1200'
  }) : [];
  const validDates = future.filter(x => !x.stop_sale && !x.blackout && !['CLOSED','CANCELLED','SUSPENDED','ARCHIVED','STOP_SALE'].includes(clean(x.status).toUpperCase()) && Number(x.available) > 0);
  const experiences = inventory.map(x => publicExperience(x, all, validDates, lang));
  const counts = new Map(); for (const x of experiences) { const key=x.destinationId; if(key) counts.set(key,(counts.get(key)||0)+1); }
  const destinations = all.filter(x => x.entity_type === 'DESTINATION' || x.entity_type === 'AREA').map(x => ({
    id: clean(x.slug || x.id, 200), entityId: clean(x.id, 80), country: clean(obj(x.details).countryCode, 4).toLowerCase(),
    name: clean(x.name, 240), count: counts.get(x.id) || 0, image: mediaOf(x)[0] || ''
  })).filter(x => x.count > 0).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name));
  return { destinations, experiences };
}
function filtered(items, input) {
  const destination = clean(input.destinationId || input.destination || input.initialDestination, 200).toLowerCase();
  const category = clean(input.category || input.initialCategory, 70).toLowerCase();
  const term = clean(input.query || '', 160).toLowerCase();
  const from = clean(input.fromDate, 10), to = clean(input.toDate, 10);
  return items.filter(x => (!destination || destination === x.destination.toLowerCase() || destination === x.destinationId.toLowerCase() || destination === x.country.toLowerCase())
    && (!category || category === 'all' || category === x.category)
    && (!term || [x.title,x.description,x.destinationName,x.countryName].some(v => clean(v).toLowerCase().includes(term)))
    && (!from && !to || x.availability.some(s => (!from || s.date >= from) && (!to || s.date <= to))));
}
export async function getToursActivitiesBootstrapCore(input = {}) {
  const lang = languageOf(input);
  const result = await catalog(lang);
  return { ok: true, source: 'SKANDI_INVENTORY_V12', version: 'V12-TOURS-2026-10-23',
    destinations: result.destinations, experiences: result.experiences, collections: [],
    availabilityNotice: 'Only published Inventory records and configured future departures are shown. Online tour checkout is not configured.',
    generatedAt: new Date().toISOString() };
}
export async function searchToursActivitiesCore(input = {}) {
  const result = await catalog(languageOf(input));
  return { ok: true, items: filtered(result.experiences, input), source: 'SKANDI_INVENTORY_V12' };
}
export async function getTourActivityDetailCore(input = {}) {
  const id = clean(input.activityId || input.id, 240).toLowerCase();
  if (!id) fail('TOURS_ID_REQUIRED', 'Choose an experience first.');
  const result = await catalog(languageOf(input));
  const activity = result.experiences.find(x => [x.id,x.slug,x.publicId,x.code].some(key => clean(key).toLowerCase() === id));
  if (!activity) fail('TOURS_ACTIVITY_NOT_FOUND', 'This experience is not published or is no longer available.');
  return { ok: true, activity, source: 'SKANDI_INVENTORY_V12' };
}
export async function searchNearbyToursActivitiesCore() {
  fail('TOURS_GEO_NOT_CONFIGURED', 'Nearby search is not yet configured for verified Inventory coordinates. Search by destination.');
}
export async function checkTourActivityBookingCore(input = {}) {
  const detail = await getTourActivityDetailCore({ activityId: input.activityId, language: input.language });
  const sel = obj(input.selection), people = Number(sel.adults || 0) + Number(sel.children || 0);
  const date = clean(sel.date, 10), time = clean(sel.time, 8).slice(0,5);
  const departure = detail.activity.availability.find(x => x.date === date && x.time === time && x.available >= people);
  if (!departure) fail('TOURS_DEPARTURE_UNAVAILABLE', 'The selected date, time or number of guests is not available in Inventory.');
  return { ok: false, code: 'TOURS_CHECKOUT_NOT_CONFIGURED', message: 'This departure exists in Inventory, but online tour checkout and supplier confirmation are not connected. Contact SKANDI to arrange a booking.' };
}
export async function saveTourFavoriteCore(input = {}) {
  const member = await currentMember.getMember({ fieldsets: ['FULL'] }).catch(() => null);
  const memberId = clean(member?._id || member?.id, 160);
  if (!memberId) fail('TOURS_MEMBER_REQUIRED', 'Sign in to SKANDI Club to save experiences.');
  // Reuse the existing My Profile owner to provision the canonical customer identity.
  let profile = row(await select('customer_profiles', { select: 'member_id,wix_member_id', wix_member_id: `eq.${memberId}`, limit: '1' }));
  if (!profile) {
    const addresses = member?.contactDetails?.emails;
    const loginEmail = clean(member?.loginEmail || (Array.isArray(addresses) ? addresses[0] : addresses)?.email || '', 254);
    await getCustomerProfileBootstrapCore({
      memberId, email: loginEmail, firstName: clean(member?.contactDetails?.firstName, 120),
      lastName: clean(member?.contactDetails?.lastName, 120)
    });
    profile = row(await select('customer_profiles', { select: 'member_id,wix_member_id', wix_member_id: `eq.${memberId}`, limit: '1' }));
  }
  const customerMemberId = clean(profile?.member_id, 160);
  if (!customerMemberId || profile?.wix_member_id !== memberId) fail('TOURS_PROFILE_REQUIRED', 'Open My Profile to complete your SKANDI account before saving experiences.');
  const activity = (await getTourActivityDetailCore(input)).activity;
  const existing = row(await select('customer_favorites', {
    select: 'id,active', member_id: `eq.${customerMemberId}`, item_type: 'eq.Tour', item_id: `eq.${activity.id}`, limit: '1'
  }));
  const body = { member_id: customerMemberId, wix_member_id: memberId, item_type: 'Tour', item_id: activity.id,
    item_slug: activity.slug, item_title: activity.title, item_image_url: activity.image || null,
    item_url: `/tours?activity=${encodeURIComponent(activity.slug)}`, source_page: '/tours', active: true,
    updated_at: new Date().toISOString() };
  const saved = await restRequest({ table: 'customer_favorites', method: existing ? 'PATCH' : 'POST',
    ...(existing ? { query: { id: `eq.${existing.id}`, member_id: `eq.${customerMemberId}` } } : {}), body });
  if (!row(saved)) fail('TOURS_FAVORITE_NOT_SAVED', 'The experience could not be saved. Please try again.');
  return { ok: true, activityId: activity.id, saved: true };
}

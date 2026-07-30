import { webMethod, Permissions } from 'wix-web-module';
import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';
import { fetch } from 'wix-fetch';
import { restRequest } from './RIA/supabaseServer.js';

const getSecretValue = elevate(secrets.getSecretValue);
const CONTENT_TABLES = ['travel_info_airports', 'travel_info_airlines', 'travel_info_transfers', 'travel_info_tours', 'travel_info_tickets', 'travel_info_hotels', 'travel_info_faq', 'travel_info_articles'];
function text(value, max = 1000) { return String(value || '').trim().slice(0, max); }
function safeUrl(value) { return /^https:\/\//i.test(text(value)) ? text(value) : ''; }
function mapRow(row = {}) { return { id: row.id || '', title: row.title || '', slug: row.slug || '', category: row.category || '', body: row.body || '', imageUrl: safeUrl(row.image_url), sortOrder: Number(row.sort_order || 0), ...(row.payload && typeof row.payload === 'object' ? row.payload : {}) }; }
function keyFor(table) { return table.replace(/^travel_info_/, '').replace(/s$/, '') + 's'; }

export const getTravelInfoPayload = webMethod(Permissions.Anyone, async () => {
  const entries = await Promise.all(CONTENT_TABLES.map(async (table) => [table, await restRequest({ table, query: { select: '*', active: 'eq.true', order: 'sort_order.asc,title.asc', limit: 500 } }).catch(() => [])]));
  const payload = { ok: true };
  for (const [table, rows] of entries) payload[keyFor(table)] = (rows || []).map(mapRow);
  payload.faq = payload.faqs || [];
  payload.articles = payload.articles || [];
  return payload;
});

export const createTravelInfoSupportRequest = webMethod(Permissions.Anyone, async (input = {}) => {
  const email = text(input.email || input.contactEmail, 240).toLowerCase();
  const body = text(input.message || input.question || input.body, 6000);
  if (!body) throw new Error('TRAVEL_SUPPORT_MESSAGE_REQUIRED');
  const rows = await restRequest({ table: 'travel_info_support_requests', method: 'POST', body: { title: text(input.subject || 'Travel information support request', 240), slug: `support-${Date.now()}`, category: text(input.category || 'GENERAL', 120), body, active: true, payload: { email, name: text(input.name, 240), ...input }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
  return { ok: true, requestId: rows?.[0]?.id || '' };
});

export const askTravelInfoAgent = webMethod(Permissions.Anyone, async (input = {}) => {
  const question = text(input.question || input.message, 1000);
  const rows = await restRequest({ table: 'travel_info_faq', query: { select: '*', active: 'eq.true', limit: 500 } }).catch(() => []);
  const words = question.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  const match = (rows || []).map(mapRow).find((item) => words.some((word) => `${item.title} ${item.body}`.toLowerCase().includes(word)));
  return { ok: true, answer: match?.body || 'Please contact SKANDI support for guidance tailored to your itinerary.', source: match ? 'TRAVEL_INFO_FAQ' : 'TRAVEL_INFO_FALLBACK' };
});

export const getTravelWeather = webMethod(Permissions.Anyone, async (input = {}) => {
  let apiKey = '';
  try { apiKey = String(await getSecretValue('OPENWEATHER_API_KEY') || '').trim(); } catch (_) {}
  if (!apiKey) return { ok: false, source: 'OPENWEATHER', locations: [], error: 'WEATHER_PROVIDER_NOT_CONFIGURED' };
  const locations = Array.isArray(input.locations) && input.locations.length ? input.locations.slice(0, 8) : [{ locationId: 'STOCKHOLM', title: 'Stockholm', lat: 59.3293, lon: 18.0686 }];
  const results = await Promise.all(locations.map(async (location) => {
    const lat = Number(location.lat); const lon = Number(location.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { ...location, ok: false };
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(apiKey)}&units=metric`);
    const data = await response.json().catch(() => null);
    if (!response.ok) return { ...location, ok: false };
    return { ...location, ok: true, displayTemp: `${Math.round(Number(data?.main?.temp || 0))}°C`, condition: data?.weather?.[0]?.description || '', description: data?.weather?.[0]?.description || '', iconUrl: data?.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` : '' };
  }));
  return { ok: true, source: 'OPENWEATHER', locations: results };
});

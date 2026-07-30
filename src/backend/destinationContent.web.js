import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from './RIA/supabaseServer.js';

function text(value, fallback = '') { return String(value ?? fallback).trim(); }
function slug(value) { return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function safeUrl(value) { return /^https:\/\//i.test(text(value)) ? text(value) : ''; }
function asObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function hotelMap(row = {}) {
  const payload = asObject(row.payload);
  const country = text(payload.country || payload.countryName || row.destination || 'Destinations');
  const area = text(payload.area || payload.destination || payload.city || row.destination || country);
  const image = safeUrl(payload.image || payload.mainImage || payload.heroImage || row.image_url);
  return {
    id: text(row.hotel_id || payload.hotelId || payload.id || row.id),
    countryId: text(payload.countryId || slug(country) || 'destinations'),
    areaId: text(payload.areaId || payload.destinationId || slug(area) || 'general'),
    name: text(payload.name || payload.hotelName || row.title || 'Hotel'),
    location: text(payload.location || payload.address || area),
    area,
    country,
    rating: Number(payload.rating || row.rating || 0) || 0,
    image,
    destinationIata: text(payload.destinationIata || payload.airportIata || '').toUpperCase().slice(0, 3),
    airportIata: text(payload.airportIata || payload.destinationIata || '').toUpperCase().slice(0, 3),
    nearestAirportIata: text(payload.nearestAirportIata || payload.airportIata || '').toUpperCase().slice(0, 3),
    description: text(payload.description || payload.summary || ''),
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 20) : [],
    ...payload,
    image,
  };
}

export const getDestinationHotelFinderData = webMethod(Permissions.Anyone, async () => {
  const [destinationRows, travelInfoRows] = await Promise.all([
    restRequest({ table: 'destination_hotels', query: { select: '*', active: 'eq.true', order: 'title.asc', limit: 1000 } }).catch(() => []),
    restRequest({ table: 'travel_info_hotels', query: { select: '*', active: 'eq.true', order: 'sort_order.asc,title.asc', limit: 1000 } }).catch(() => []),
  ]);
  const hotels = [...(destinationRows || []), ...(travelInfoRows || [])].map(hotelMap);
  const countries = [];
  const areas = [];
  const countryIds = new Set();
  const areaIds = new Set();
  for (const hotel of hotels) {
    if (!countryIds.has(hotel.countryId)) {
      countryIds.add(hotel.countryId);
      countries.push({ id: hotel.countryId, name: hotel.country || 'Destinations', title: hotel.country || 'Destinations', image: hotel.image, destinationIata: hotel.destinationIata || hotel.airportIata || '' });
    }
    if (!areaIds.has(hotel.areaId)) {
      areaIds.add(hotel.areaId);
      areas.push({ id: hotel.areaId, countryId: hotel.countryId, name: hotel.area || hotel.country || 'General area', title: `${hotel.area || hotel.country || 'General area'} hotels`, image: hotel.image, destinationIata: hotel.destinationIata || hotel.airportIata || '' });
    }
  }
  return { countries, areas, hotels };
});

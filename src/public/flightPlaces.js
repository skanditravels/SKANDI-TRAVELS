// Presentation of Duffel's place suggestions. Codes and airport membership
// remain provider-owned; this module never invents a city or airport code.
const list = value => Array.isArray(value) ? value : [];
const clean = value => String(value ?? '').trim();
const code = value => clean(value).toUpperCase();
const uniq = values => [...new Set(values.map(clean).filter(Boolean))];

function countryName(countryCode) {
  const value = code(countryCode);
  if (!/^[A-Z]{2}$/.test(value)) return clean(countryCode);
  try { return new Intl.DisplayNames(['en'], {type:'region'}).of(value) || value; }
  catch (_) { return value; }
}

export function formatFlightPlaces(places = []) {
  return list(places).flatMap(place => {
    const type = clean(place.placeType).toLowerCase();
    const iata = code(place.iataCode), cityCode = code(place.iataCityCode || place.city?.iataCode);
    if (!/^[A-Z]{3}$/.test(iata) || !['airport','city'].includes(type)) return [];
    const airports = list(place.airports).filter(a => /^[A-Z]{3}$/.test(code(a.iataCode)));
    if (type === 'city' && new Set(airports.map(a => code(a.iataCode))).size < 2) return [];
    const city = clean(place.cityName || place.city?.name || (type === 'city' ? place.name : ''));
    const name = clean(place.name || city), countryCode = code(place.iataCountryCode || place.city?.iataCountryCode);
    let displayName = name;
    if (type === 'airport') {
      if (city && !name.toLowerCase().includes(city.toLowerCase())) displayName = `${city} – ${name}`;
      if (!/\bairport\b/i.test(displayName)) displayName += ' Airport';
    }
    const country = countryName(countryCode);
    const region = ['SE','NO','DK'].includes(countryCode) ? 'Scandinavia' : '';
    const airportCodes = airports.map(a => code(a.iataCode));
    const secondary = uniq([country, region, ...(type === 'city' ? airports.map(a => clean(a.name)) : [city, name]), code(place.icaoCode), iata, cityCode, ...airportCodes]);
    return [{
      type:type.toUpperCase(), value:iata, canonicalValue:iata, iata,
      icao:code(place.icaoCode), cityCode, title:name, city, airportName:type === 'airport' ? name : '', country,
      label:`${displayName} (${iata})`, subtitle:secondary.join(' · '),
      terms:uniq([name,city,country,region,iata,cityCode,code(place.icaoCode),...airports.flatMap(a=>[a.name,a.iataCode,a.icaoCode])])
    }];
  });
}

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { TtlCache } from '../src/backend/SKANDI_CORE/platformCache.js';
import { lower, record, text, upper } from '../src/backend/SKANDI_CORE/platformValidation.js';

const [coreSource, pageSource] = await Promise.all([
  fs.readFile(new URL('../src/backend/SKANDI_CORE/swedaviaAirports.js', import.meta.url), 'utf8'),
  fs.readFile(new URL('../src/pages/Travel Info.m43d6.js', import.meta.url), 'utf8')
]);
const withoutImports = source => source.replace(/^import [^;]+;\n/gm, '');
const comparable = result => JSON.parse(JSON.stringify(result));
const START = Date.parse('2026-11-28T12:00:00Z');

function harness(serve, secret = name => ({ value: name + '-test-only' })) {
  const requests = [], secretsRead = [];
  let now = START;
  class Clock extends Date { static now() { return now; } }
  const execute = vm.runInNewContext(
    withoutImports(coreSource).replace(/^export (?=async function)/m, '') + '\ngetSwedaviaAirportInfoCore;',
    {
      Date: Clock, URL, TtlCache, lower, record, text, upper, setTimeout, clearTimeout, console: { warn() {} },
      elevate: method => method,
      secrets: { getSecretValue: async name => { secretsRead.push(name); return secret(name); } },
      fetch: async (url, options) => {
        const target = new URL(url);
        requests.push({ target, options });
        assert.equal(target.origin, 'https://api.swedavia.se');
        assert.equal(options.headers.Accept, 'application/json');
        const result = serve(target);
        if (result instanceof Response) return result;
        return { ok: true, json: async () => result };
      }
    }
  );
  return { execute, requests, secretsRead, advance: ms => { now += ms; } };
}

test('WaitTime v2 keeps a measured zero and hides overflow, aged, malformed and missing estimates', async () => {
  const source = harness(() => [
    { QueueName: 'Standard T5', CurrentTime: '2026-11-28T11:56:00Z', CurrentProjectedWaitTime: 0, Overflow: false, Terminal: 'T5', IsFastTrack: false },
    { queueName: 'Overflow', currentTime: '2026-11-28T11:58:00Z', currentProjectedWaitTime: 99, overflow: true, isFastTrack: true },
    { queueName: 'Expired', currentTime: '2026-11-28T11:50:00Z', currentProjectedWaitTime: 88, overflow: false },
    { queueName: 'Unknown', currentTime: '2026-11-28T11:59:00Z', currentProjectedWaitTime: null, overflow: false },
    { queueName: 'Wrong clock', currentTime: '2026-11-28T12:30:00Z', currentProjectedWaitTime: 77, overflow: false },
    { queueName: 'Missing overflow flag', currentTime: '2026-11-28T11:59:00Z', currentProjectedWaitTime: 12 }
  ]);
  const input = { iata: 'arn', scope: 'security', language: 'sv' };
  const [first, duplicate] = await Promise.all([source.execute(input), source.execute(input)]);
  assert.equal(source.requests.length, 1);
  assert.equal(source.requests[0].target.pathname, '/waittimepublic/v2/airports/ARN');
  assert.equal(source.requests[0].options.headers['Ocp-Apim-Subscription-Key'], 'SWEDAVIA_WAIT_TIME_SUBSCRIPTION_KEY-test-only');
  assert.equal(first.status, 'ready');
  assert.equal(first.language, 'sv');
  assert.deepEqual(comparable(first.items.map(row => row.minutes)), [0, null, null, null, null, null]);
  assert.deepEqual(comparable(duplicate), comparable(first));
  assert.equal(first.items[0].fastTrack, false);
  assert.equal(first.items[1].overflow, true);
  assert.equal(first.items[4].measuredAt, '');
  assert.doesNotMatch(JSON.stringify(first), /test-only/);
  source.advance(60_001);
  assert.equal((await source.execute(input)).items[0].minutes, null);
  assert.equal(source.requests.length, 1);
});

test('AirportInfo v2 selects an advertised language and retains independently working categories', async () => {
  const source = harness(url => {
    if (url.pathname.endsWith('/languages')) return [{ LangCode: 'en' }, { LangCode: 'sv' }, { LangCode: 'nb' }];
    if (url.pathname.endsWith('/shops')) return new Response('', { status: 502 });
    if (url.pathname.endsWith('/services')) return [];
    return [{
      Name: 'Terminal café', AirportIata: 'ARN', Description: '<p>Breakfast &amp; lunch</p>', OpeningHours: '06:00–21:00',
      PhotoImgURL: 'https://provider.test/image',
      Location: { TerminalName: 'Terminal 5', Place: 'Gate F', BeforeSecurity: false }
    }, { Name: 'Another airport café', AirportIata: 'GOT' }];
  });
  const input = { iata: 'ARN', scope: 'services' };
  const sv = await source.execute({ ...input, language: 'sv' });
  const fi = await source.execute({ ...input, language: 'fi' });
  const no = await source.execute({ ...input, language: 'no' });
  assert.deepEqual([sv.providerLanguage, fi.providerLanguage, no.providerLanguage], ['sv', 'en', 'nb']);
  assert.equal(sv.status, 'ready');
  assert.equal(sv.groups.shops.status, 'unavailable');
  assert.equal(sv.groups.services.status, 'ready');
  assert.deepEqual(comparable(sv.groups.restaurants.items), [{
    name: 'Terminal café', description: 'Breakfast & lunch', openingHours: '06:00–21:00',
    terminal: 'Terminal 5', place: 'Gate F', beforeSecurity: false
  }]);
  assert.equal(source.requests.filter(({ target }) => target.pathname.endsWith('/languages')).length, 1);
  assert.deepEqual(source.secretsRead, ['SWEDAVIA_AIRPORT_INFO_SUBSCRIPTION_KEY']);
  assert.ok(source.requests.slice(1).every(({ target }) => /\/airportinfo\/v2\/ARN\/(restaurants|shops|services)$/.test(target.pathname)));
});

test('parking and destination lookups use their documented routes and return passenger fields', async () => {
  const source = harness(url => {
    if (url.pathname.endsWith('/parkinglots/')) return {
      CarParks: [{ IATA: 'GOT', CarParkName: 'P1', CategoryName: 'Indoor', ProductLabel: 'Next to terminal', IsSoldOut: false }],
      BookingInformationLink: url.pathname.includes('/GOT/') ? 'https://www.swedavia.se/parkering/' : 'javascript:alert(1)'
    };
    return { CityDestinations: [{ IATA: 'CPH', Operators: [{ Name: 'SAS' }, { Name: 'SAS' }] }] };
  });
  const parking = await source.execute({ iata: 'GOT', scope: 'parking' });
  assert.equal(parking.items[0].name, 'P1');
  assert.equal(parking.items[0].category, 'Indoor');
  assert.equal(parking.bookingUrl, 'https://www.swedavia.se/parkering/');
  assert.equal('isSoldOut' in parking.items[0], false);
  assert.equal((await source.execute({ iata: 'KRN', scope: 'parking' })).bookingUrl, '');
  const routes = await source.execute({ iata: 'GOT', scope: 'routes' });
  assert.deepEqual(comparable(routes.items), [{ iata: 'CPH', airlines: ['SAS'] }]);
  assert.equal(source.requests.at(-1).target.search, '?startMonth=0&endMonth=2&minimumDepartures=1');
});

test('unsupported parameters make no provider calls and missing credentials affect only their product', async () => {
  const source = harness(() => [], name => name.includes('WAIT_TIME') ? null : { value: 'airport-info-test-only' });
  for (const input of [
    { iata: 'JFK', scope: 'security' },
    { iata: 'LLA', scope: 'security' },
    { iata: 'ARN/../BMA', scope: 'routes' },
    { iata: 'ARN', scope: 'arbitraryPath' }
  ]) assert.equal((await source.execute(input)).status, 'unsupported');
  assert.equal(source.requests.length, 0);
  assert.equal(source.secretsRead.length, 0);
  assert.equal((await source.execute({ iata: 'ARN', scope: 'security' })).status, 'unavailable');
  assert.equal(source.requests.length, 0);
  assert.equal((await source.execute({ iata: 'LLA', scope: 'routes' })).status, 'ready');
  assert.equal(source.requests.length, 1);
});

test('WaitTime respects provider throttling across airports while AirportInfo remains usable', async () => {
  const source = harness(url => url.pathname.includes('waittimepublic')
    ? new Response('', { status: 429, headers: { 'Retry-After': '120' } })
    : []);
  assert.equal((await source.execute({ iata: 'ARN', scope: 'security' })).status, 'unavailable');
  assert.equal((await source.execute({ iata: 'GOT', scope: 'security' })).status, 'unavailable');
  assert.equal(source.requests.length, 1);
  assert.equal((await source.execute({ iata: 'GOT', scope: 'routes' })).status, 'ready');
  assert.equal(source.requests.length, 2);
});

test('Travel Info Wix bridge correlates Swedavia replies and keeps provider errors private', async () => {
  const posts = [], calls = [];
  let onMessage;
  const component = { postMessage: value => posts.push(value), onMessage: handler => { onMessage = handler; } };
  const $w = Object.assign(() => component, { onReady: run => run() });
  vm.runInNewContext(withoutImports(pageSource), {
    $w, setTimeout, clearTimeout, URLSearchParams,
    SITE_MAP: { travelInfo: '/travel-info' },
    getSwedaviaAirportInfo: async input => {
      calls.push(input);
      if (input.scope === 'parking') throw new Error('provider-internal-detail');
      return { status: 'ready', items: [{ name: 'Checkpoint' }] };
    }
  });
  const send = payload => onMessage({ data: { source: 'SKANDI_PUBLIC_TRAVEL_INFO', type: 'TRAVEL_INFO_SWEDAVIA_REQUEST', payload } });
  await send({ requestId: 'first', iata: 'arn', scope: 'security', language: 'SV' });
  assert.deepEqual(comparable(calls[0]), { iata: 'ARN', scope: 'security', language: 'sv' });
  assert.equal(posts.at(-1).type, 'TRAVEL_INFO_SWEDAVIA_RESULT');
  assert.equal(posts.at(-1).payload.requestId, 'first');
  await send({ requestId: 'second', iata: 'ARN', scope: 'parking' });
  assert.deepEqual(comparable(posts.at(-1).payload), {
    requestId: 'second', status: 'unavailable', iata: 'ARN', scope: 'parking', language: 'en'
  });
});

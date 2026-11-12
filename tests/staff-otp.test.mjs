import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { Buffer } from 'node:buffer';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

const source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/staffOtp.js', import.meta.url), 'utf8');
const runnable = source.replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, '').replace(/^export\s+/gm, '');
const memberId = '1a111111-1111-4111-8111-111111111111';
const contactId = '2b222222-2222-4222-8222-222222222222';
const userId = '3c333333-3333-4333-8333-333333333333';
const skId = 'AB1234';

function createBackend() {
  const db = { staff_login_otps: [], staff_trusted_devices: [] }, deliveries = [], audit = [];
  let sequence = 0, failDelivery = false, identityActive = true;
  const identity = { skId, agentId: skId, agentUserId: userId, memberId, contactId, loginEmail: 'login@example.test', deliveryEmail: 'staff@example.test', phone: '' };
  function matches(row, query = {}) {
    for (const [key, condition] of Object.entries(query)) {
      if (['select', 'order', 'limit', 'on_conflict'].includes(key)) continue;
      const match = String(condition).match(/^(eq|gt)\.(.*)$/);
      if (!match) throw new Error(`Unexpected query ${key}`);
      const value = row[key];
      if (match[1] === 'eq' && String(value) !== match[2]) return false;
      if (match[1] === 'gt' && String(value) <= match[2]) return false;
    }
    return true;
  }
  const clone = row => JSON.parse(JSON.stringify(row));
  async function restRequest({ table, method = 'GET', query = {}, body, prefer }) {
    assert(db[table], `unexpected table ${table}`);
    const rows = db[table];
    if (method === 'GET') {
      const selected = rows.filter(row => matches(row, query));
      if (query.order === 'created_at.desc') selected.sort((a,b) => b.created_at.localeCompare(a.created_at));
      return selected.slice(0, Number(query.limit) || selected.length).map(clone);
    }
    if (method === 'PATCH') {
      const changed = rows.filter(row => matches(row, query));
      for (const row of changed) Object.assign(row, body);
      return changed.map(clone);
    }
    if (method === 'POST') {
      if (query.on_conflict) {
        assert.equal(prefer, 'resolution=merge-duplicates,return=representation');
        const old = rows.find(r => r.sk_id === body.sk_id && r.device_token_hash === body.device_token_hash);
        if (old) { Object.assign(old, body); return [clone(old)]; }
      }
      const row = { id: `record-${++sequence}`, created_at: new Date(Date.now() + sequence).toISOString(), ...body };
      rows.push(row); return [clone(row)];
    }
    throw new Error('unexpected method');
  }
  const context = {
    Buffer, createHash, randomBytes, randomInt, timingSafeEqual, Date, console: { error() {} },
    email: value => String(value || '').trim().toLowerCase(), firstRow: value => Array.isArray(value) ? value[0] : null,
    isValidSkId: value => /^[A-Z]{2}\d{4}$/.test(value), normalizeSkId: value => String(value || '').trim().toUpperCase(),
    text: (value, max) => String(value || '').trim().slice(0, max), restRequest,
    loginStaffWithSkIdCore: async ({ password }) => { if (password !== 'correct-password') throw new Error('invalid'); return {sessionToken:'password-session'}; },
    resolveStaffVerificationIdentityCore: async () => { if (!identityActive) throw new Error('INACTIVE'); return {...identity}; },
    authentication: { generateSessionToken: async email => { assert.equal(email, identity.loginEmail); return 'verified-session'; } },
    wixData: { query: () => ({ eq: () => ({ limit: () => ({ find: async () => ({items:[{_id:memberId}]}) }) }) }) },
    members: { getMember: async () => ({_id:memberId,contactId,loginEmail:identity.loginEmail,status:'APPROVED'}) },
    customTrigger: { runTrigger: async p => { if (failDelivery) throw new Error('failed'); deliveries.push(p); } },
    auth: { elevate: fn => fn }, tryWriteStaffLoginAudit: async p => audit.push(p)
  };
  vm.createContext(context);
  vm.runInContext(runnable + '\nthis.api={issueStaffDeviceTokenCore,authenticateStaffWithDeviceTrustCore,verifyStaffOtpAndTrustDeviceCore};', context);
  return { api: context.api, db, deliveries, audit, setFailDelivery: value => {failDelivery=value}, setIdentityActive: value => {identityActive=value} };
}

test('new device needs a code, stores a digest, then remains trusted', async () => {
  const b=createBackend(), deviceToken=(await b.api.issueStaffDeviceTokenCore()).deviceToken;
  assert.match(deviceToken, /^v2_[a-f0-9]{64}$/);
  const initial=await b.api.authenticateStaffWithDeviceTrustCore({skId,password:'correct-password',deviceToken,userAgent:'Firefox on Windows'});
  assert.equal(initial.mfaRequired,true); assert.equal(initial.sessionToken,undefined); assert.equal(b.deliveries.length,1);
  assert.equal(b.deliveries[0].payload.email,'staff@example.test'); assert.equal(b.deliveries[0].payload.contactId,contactId);
  const code=b.deliveries[0].payload.code; assert.match(code,/^\d{6}$/);
  assert(!b.db.staff_login_otps[0].code.includes(code)); assert.equal(b.db.staff_login_otps[0].email,'login@example.test');
  const wrong=await b.api.verifyStaffOtpAndTrustDeviceCore({skId,code:code==='000000'?'000001':'000000',deviceToken});
  assert.equal(wrong.code,'WRONG_CODE'); assert.equal(b.db.staff_login_otps[0].attempts,1);
  const verified=await b.api.verifyStaffOtpAndTrustDeviceCore({skId,code,deviceToken});
  assert.equal(verified.sessionToken,'verified-session'); assert.equal(b.db.staff_trusted_devices.length,1);
  const again=await b.api.authenticateStaffWithDeviceTrustCore({skId,password:'correct-password',deviceToken});
  assert.equal(again.mfaRequired,false); assert.equal(again.sessionToken,'password-session'); assert.equal(b.deliveries.length,1);
  assert.equal((await b.api.verifyStaffOtpAndTrustDeviceCore({skId,code,deviceToken})).ok,false);
  b.setIdentityActive(false);
  assert.equal((await b.api.authenticateStaffWithDeviceTrustCore({skId,password:'correct-password',deviceToken})).ok,false);
});

test('a challenge is bound to its device and limited to five atomic attempts', async () => {
  const b=createBackend(), deviceToken=(await b.api.issueStaffDeviceTokenCore()).deviceToken, other=(await b.api.issueStaffDeviceTokenCore()).deviceToken;
  await b.api.authenticateStaffWithDeviceTrustCore({skId,password:'correct-password',deviceToken});
  const code=b.deliveries[0].payload.code;
  const failures=await Promise.all(Array.from({length:7},()=>b.api.verifyStaffOtpAndTrustDeviceCore({skId,code,deviceToken:other})));
  assert(failures.every(result=>result.ok===false)); assert.equal(b.db.staff_login_otps[0].attempts,5); assert.equal(b.db.staff_login_otps[0].used,true);
  assert.equal((await b.api.verifyStaffOtpAndTrustDeviceCore({skId,code,deviceToken})).ok,false);
});

test('a correct code can be consumed only once under concurrent verification', async () => {
  const b=createBackend(), deviceToken=(await b.api.issueStaffDeviceTokenCore()).deviceToken;
  await b.api.authenticateStaffWithDeviceTrustCore({skId,password:'correct-password',deviceToken});
  const code=b.deliveries[0].payload.code;
  const results=await Promise.all([b.api.verifyStaffOtpAndTrustDeviceCore({skId,code,deviceToken}),b.api.verifyStaffOtpAndTrustDeviceCore({skId,code,deviceToken})]);
  assert.equal(results.filter(x=>x.ok===true).length,1); assert.equal(b.db.staff_trusted_devices.length,1);
});

test('failed delivery or a deactivated staff identity cannot create a session', async () => {
  const b=createBackend(), deviceToken=(await b.api.issueStaffDeviceTokenCore()).deviceToken;
  b.setFailDelivery(true);
  assert.equal((await b.api.authenticateStaffWithDeviceTrustCore({skId,password:'correct-password',deviceToken})).ok,false);
  assert.equal(b.db.staff_login_otps[0].used,true);
  b.setFailDelivery(false);
  await b.api.authenticateStaffWithDeviceTrustCore({skId,password:'correct-password',deviceToken});
  const code=b.deliveries[0].payload.code; b.setIdentityActive(false);
  assert.equal((await b.api.verifyStaffOtpAndTrustDeviceCore({skId,code,deviceToken})).ok,false);
  assert.equal(b.db.staff_trusted_devices.length,0);
});

test('public legacy staff login cannot return a password-only session', async () => {
  const facade=await fs.readFile(new URL('../src/backend/SKANDI_CORE/staffAuth.web.js',import.meta.url),'utf8');
  assert.match(facade,/loginStaffWithSkId\s*=\s*webMethod\([\s\S]*?DEVICE_VERIFICATION_REQUIRED/);
  assert.doesNotMatch(facade,/loginStaffWithSkIdCore/);
});

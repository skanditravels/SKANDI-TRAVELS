import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/twilioWhatsApp.js', import.meta.url), 'utf8');
const body = source.replace(/^import .*;\n/gm, '').replace(/^export async function /gm, 'async function ');
const account = `AC${'a'.repeat(32)}`;
const sid = `SM${'b'.repeat(32)}`;
const token = 'local-test-only';
const sender = 'whatsapp:+12025550100';
const traveler = 'whatsapp:+12025550101';
const origin = 'https://www.skanditravels.com/_functions/';
const replyId = '6e6ecf45-9555-497a-bfb8-2329cc5c2c13';
const contentType = 'application/x-www-form-urlencoded; charset=UTF-8';

function sign(url, fields) {
  const parameters = Object.keys(fields).sort().map(key => key + fields[key]).join('');
  return createHmac('sha1', token).update(url + parameters).digest('base64');
}

function fixture({ restRequest = async () => [], fetch = async () => { throw new Error('Unexpected Twilio request'); }, rpc } = {}) {
  const secrets = { getSecretValue: async name => ({ value: {
    SKANDI_TWILIO_ACCOUNT_SID: account, SKANDI_TWILIO_AUTH_TOKEN: token, SKANDI_TWILIO_WHATSAPP_SENDER: sender
  }[name] }) };
  const calls = [];
  const rpcRequest = async ({ functionName, body }) => {
    calls.push({ functionName, body });
    return rpc ? rpc(body) : null;
  };
  const core = vm.runInNewContext(`${body}\n({ receiveTwilioWhatsAppCore, receiveTwilioWhatsAppStatusCore, sendTwilioWhatsAppReply })`, {
    createHash, Buffer, URLSearchParams, elevate: fn => fn, secrets, fetch, restRequest, rpcRequest,
    twilio: { validateRequest: (_token, signature, url, fields) => signature === sign(url, fields) }, console
  });
  return { core, calls };
}

test('accepts signed inbound WhatsApp only for the configured sender, with the actual Twilio message timestamp', async () => {
  const receivedAt = new Date(Date.now() - 7200000).toUTCString();
  const fields = { AccountSid: account, To: sender, From: traveler, MessageSid: sid, Body: 'Hej & welcome + ✈️', ProfileName: 'Traveler', NumMedia: '1' };
  const url = `${origin}skandiTwilioWhatsAppInbound`;
  let requests = 0;
  const { core, calls } = fixture({ fetch: async url => {
    requests++;
    assert.equal(url, `https://api.twilio.com/2010-04-01/Accounts/${account}/Messages/${sid}.json`);
    return { ok: true, json: async () => ({ account_sid: account, sid, from: traveler, to: sender, direction: 'inbound', date_created: receivedAt }) };
  } });
  const raw = new URLSearchParams(fields).toString();
  await assert.rejects(core.receiveTwilioWhatsAppCore({ raw: raw + 'X', signature: sign(url, fields), contentType }), /UNAUTHORIZED/);
  const wrongSender = { ...fields, To: 'whatsapp:+12025550102' };
  await assert.rejects(core.receiveTwilioWhatsAppCore({ raw: new URLSearchParams(wrongSender).toString(), signature: sign(url, wrongSender), contentType }), /UNAUTHORIZED/);
  await core.receiveTwilioWhatsAppCore({ raw, signature: sign(url, fields), contentType });
  assert.equal(requests, 1);
  assert.equal(calls[0].functionName, 'skandi_record_twilio_whatsapp_inbound');
  assert.equal(calls[0].body.p_message_id, `twilio-in:${sid}`);
  assert.equal(calls[0].body.p_received_at, new Date(receivedAt).toISOString());
  assert.match(calls[0].body.p_body, /Hej & welcome \+ .*\n\n\[WhatsApp attachment/);
  assert.equal(calls[0].body.p_case_payload.identityVerifiedForBookings, false);
  assert.equal(calls[0].body.p_case_payload.whatsappContactAddress, traveler);
});

test('checks the exact reply URL and records Twilio read receipts', async () => {
  const query = `?replyId=${replyId}`;
  const url = `${origin}skandiTwilioWhatsAppStatus${query}`;
  const fields = { AccountSid: account, From: sender, To: traveler, MessageSid: sid, MessageStatus: 'delivered', EventType: 'READ' };
  const raw = new URLSearchParams(fields).toString();
  const { core, calls } = fixture();
  await assert.rejects(core.receiveTwilioWhatsAppStatusCore({ raw, signature: sign(url.split('?')[0], fields), query, contentType }), /UNAUTHORIZED/);
  await core.receiveTwilioWhatsAppStatusCore({ raw, signature: sign(url, fields), query, contentType });
  assert.equal(calls[0].body.p_message_id, `twilio-out:${replyId}`);
  assert.equal(calls[0].body.p_message_sid, sid);
  assert.equal(calls[0].body.p_status, 'read');
});

test('routes a staff reply to the stored traveler once and leaves an expired window unsent', async () => {
  let stored, providerCalls = 0;
  let lastInboundAt = new Date().toISOString();
  const { core } = fixture({
    restRequest: async ({ query, method, body }) => {
      if (method === 'POST') {
        assert.equal(body.payload.twilioStatus, 'submitting');
        stored = { ...body, created_at: new Date().toISOString() };
        return [stored];
      }
      if (query.select === 'created_at') return [{ created_at: lastInboundAt }];
      return stored && query.message_id === `eq.${stored.message_id}` ? [stored] : [];
    },
    fetch: async (_url, { body }) => {
      providerCalls++;
      const fields = new URLSearchParams(body);
      assert.equal(fields.get('From'), sender);
      assert.equal(fields.get('To'), traveler);
      assert.equal(fields.get('Body'), 'How can I help?');
      assert.equal(fields.get('StatusCallback'), `${origin}skandiTwilioWhatsAppStatus?replyId=${replyId}`);
      return { ok: true, status: 201, json: async () => ({ sid, account_sid: account, status: 'queued' }) };
    },
    rpc: ({ p_message_sid: messageSid, p_status: status }) => {
      stored.payload = { ...stored.payload, twilioMessageSid: messageSid, twilioStatus: status };
      return stored.payload;
    }
  });
  const record = { case_id: 'wa_twilio_case', payload: { whatsappBusinessAddress: sender, twilioAccountSid: account, whatsappContactAddress: traveler } };
  const input = { record, agent: { name: 'Agent', skId: 'AA1234' }, content: 'How can I help?', replyId };
  const result = await core.sendTwilioWhatsAppReply(input);
  assert.equal(result.providerAccepted, true);
  assert.equal(result.deliveryConfirmed, false);
  assert.equal(result.sentMessage.deliveryStatus, 'queued');
  assert.equal((await core.sendTwilioWhatsAppReply(input)).sentMessage.id, result.sentMessage.id);
  lastInboundAt = new Date(Date.now() - 86400001).toISOString();
  assert.equal((await core.sendTwilioWhatsAppReply({ ...input, replyId: '6e6ecf45-9555-497a-bfb8-2329cc5c2c14' })).error, 'WHATSAPP_WINDOW_CLOSED');
  assert.equal(providerCalls, 1);
});

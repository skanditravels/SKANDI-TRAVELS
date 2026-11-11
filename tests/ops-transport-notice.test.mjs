import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareNoHostNotice} from '../src/backend/SKANDI_CORE/opsTransportNotice.js';
const now=Date.parse('2030-01-01T10:00:00Z');
const service={operatorType:'OWN',status:'SCHEDULED',startAt:'2030-01-01T12:00:00Z',timeZone:'Europe/Stockholm',label:'Airport transfer',revision:'1',staff:[],noHostApproval:{approvedBy:'SK01',approvedAt:'2030-01-01T09:00:00Z',serviceRevision:'1'}};
const supportUrl='https://www.skanditravels.com/about/support';
test('prepares clear approved no-host wording with the service local time',()=>{
 const n=prepareNoHostNotice({service,customerName:'Alex',supportUrl,now});
 assert.match(n.text,/There will not be a SKANDI Host on board/);assert.match(n.text,/Customer Support Chat/);assert.match(n.text,/Europe\/Stockholm/);
 assert.match(n.html,/https:\/\/www\.skanditravels\.com\/about\/support/);
});
test('refuses unapproved, stale, third-party, hosted or cancelled service notices',()=>{
 for(const changes of [{noHostApproval:null},{revision:'2'},{operatorType:'THIRD_PARTY'},{status:'CANCELLED'},{staff:[{staffId:'SK02',role:'HOST',status:'SCHEDULED'}]}]){
  assert.throws(()=>prepareNoHostNotice({service:{...service,...changes},supportUrl,now}),/TRANSPORT_NOTICE_NOT_APPROVED/);
 }
});
test('escapes names and service names and rejects foreign or malformed links',()=>{
 const n=prepareNoHostNotice({service:{...service,label:'Airport <script>'},customerName:'Alex <img>',supportUrl,now});
 assert(!n.html.includes('<script>'));assert(!n.html.includes('<img>'));assert.match(n.html,/&lt;script&gt;/);
 for(const bad of ['https://evil.example/about/support','https://www.skanditravels.com.evil.example/about/support','https://www.skanditravels.com:8443/about/support','javascript:alert(1)','https://www.skanditravels.com/about/support?token=x'])assert.throws(()=>prepareNoHostNotice({service,supportUrl:bad,now}),/TRANSPORT_NOTICE_SUPPORT_URL_INVALID/);
});
test('requires an explicit valid time zone',()=>{
 for(const timeZone of ['','Not/AZone'])assert.throws(()=>prepareNoHostNotice({service:{...service,timeZone},supportUrl,now}),/TRANSPORT_NOTICE_(SERVICE_DETAILS_REQUIRED|TIMEZONE_INVALID)/);
});

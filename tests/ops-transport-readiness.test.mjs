import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateTransportReadiness} from '../src/backend/SKANDI_CORE/opsTransportReadiness.js';
const departure=Date.parse('2030-01-01T12:00:00Z');
const own={operatorType:'OWN',status:'SCHEDULED',startAt:new Date(departure).toISOString(),revision:'7',staff:[]};
const tp={...own,operatorType:'THIRD_PARTY'};
const staff=(role,i)=>({role,staffId:`SK${i}`,status:'SCHEDULED'});
const keys=value=>value.issues.map(x=>x.key);

test('SKANDI buses escalate a missing driver at the two-hour boundary',()=>{
 assert(!keys(evaluateTransportReadiness(own,departure-2*3600000-1)).includes('OWN_DRIVER_MISSING_2H'));
 assert(keys(evaluateTransportReadiness(own,departure-2*3600000)).includes('OWN_DRIVER_MISSING_2H'));
 assert(!keys(evaluateTransportReadiness({...own,staff:[staff('DRIVER',1)]},departure-3600000)).includes('OWN_DRIVER_MISSING_2H'));
});
test('any number of drivers and hosts can be represented',()=>{
 const list=[...Array.from({length:4},(_,i)=>staff('DRIVER',i)),...Array.from({length:16},(_,i)=>staff('HOST',i+4))];
 const r=evaluateTransportReadiness({...own,staff:list},departure-3600000);
 assert.equal(r.driverCount,4);assert.equal(r.hostCount,16);assert.deepEqual(r.issues,[]);
});
test('only an explicit approval for the current revision makes an own-bus no-host notice eligible',()=>{
 const approval={approvedBy:'SK01',approvedAt:'2030-01-01T08:00:00Z',serviceRevision:'7'};
 assert.equal(evaluateTransportReadiness(own,departure-3600000).noticeEligible,false);
 assert.equal(evaluateTransportReadiness({...own,noHostApproval:approval},departure-3600000).noticeEligible,true);
 assert.equal(evaluateTransportReadiness({...own,revision:'8',noHostApproval:approval},departure-3600000).noticeEligible,false);
 assert.equal(evaluateTransportReadiness({...own,staff:[staff('HOST',1)],noHostApproval:approval},departure-3600000).noticeEligible,false);
 assert.equal(evaluateTransportReadiness({...tp,noHostApproval:approval},departure-3600000).noticeEligible,false);
});
test('third-party missing supplier details alert at four hours and missing host at two',()=>{
 assert(!keys(evaluateTransportReadiness(tp,departure-4*3600000-1)).includes('SUPPLIER_DETAILS_MISSING_4H'));
 assert(keys(evaluateTransportReadiness(tp,departure-4*3600000)).includes('SUPPLIER_DETAILS_MISSING_4H'));
 assert(!keys(evaluateTransportReadiness(tp,departure-2*3600000-1)).includes('THIRD_PARTY_HOST_MISSING_2H'));
 assert(keys(evaluateTransportReadiness(tp,departure-2*3600000)).includes('THIRD_PARTY_HOST_MISSING_2H'));
 const ready={...tp,staff:[staff('HOST',1)],provider:{supplierId:'supplier-1',driverName:'Driver',vehicleRegistration:'ABC',vehicleDescription:'Coach'}};
 assert.deepEqual(evaluateTransportReadiness(ready,departure-3600000).issues,[]);
});
test('draft or cancelled services do not generate departure warnings',()=>{
 for(const status of ['DRAFT','CANCELLED','COMPLETED'])assert.deepEqual(evaluateTransportReadiness({...own,status},departure-1000).issues,[]);
});
test('unresolved urgent staffing warnings remain after the scheduled start',()=>{
 assert(keys(evaluateTransportReadiness(own,departure+60000)).includes('OWN_DRIVER_MISSING_2H'));
 assert(keys(evaluateTransportReadiness(tp,departure+60000)).includes('THIRD_PARTY_HOST_MISSING_2H'));
});
test('cancelled or incomplete staff assignments never satisfy the requirement',()=>{
 const cancelled={role:'DRIVER',staffId:'SK01',status:'CANCELLED'};
 const missingIdentity={role:'HOST',status:'CONFIRMED'};
 const r=evaluateTransportReadiness({...own,staff:[cancelled,missingIdentity]},departure-3600000);
 assert.equal(r.driverCount,0);assert.equal(r.hostCount,0);
 assert(keys(r).includes('OWN_DRIVER_MISSING_2H'));
 assert(keys(r).includes('OWN_HOST_APPROVAL_REQUIRED'));
});

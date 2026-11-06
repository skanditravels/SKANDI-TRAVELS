import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { rosterAssignmentTimes } from '../src/backend/SKANDI_CORE/rosterAssignments.js';

const code=(await fs.readFile(new URL('../src/backend/SKANDI_CORE/wixRosterAvailability.js',import.meta.url),'utf8'))
  .replace(/^import .+;$/gm,'').replace(/^export /gm,'');
function fixture({shifts=[],existing=[],ownHours=false}={}){
  const employeeId='00000000-0000-4000-a000-000000000001';
  const staffMemberId='00000000-0000-4000-a000-000000000002';
  const scheduleId='00000000-0000-4000-a000-000000000003';
  const calls=[];
  const siteId='00000000-0000-4000-a000-000000000004';
  const config={enabled:true,siteId,providers:[{employeeId,staffMemberId,assignmentTypes:['duty']}]};
  const context=vm.createContext({
    console:{info(){},warn(){}},createHash,rosterAssignmentTimes,
    restRequest:async({table})=>table==='agent_users'?[{id:employeeId,active:true}]:shifts,
    elevate:fn=>fn,secrets:{getSecretValue:async name=>({value:name==='SKANDI_WIX_ROSTER_SYNC'?JSON.stringify(config):'fixture-api-key'})},
    fetch:async(url, options)=>{
      const pathname=new URL(url).pathname;
      const payload=options.body&&JSON.parse(options.body);
      calls.push({pathname,payload});
      let data;
      if(pathname.endsWith('staff-members/query'))data={staffMembers:[{id:staffMemberId,serviceProvider:true,resourceId:staffMemberId,
        resource:{eventsSchedule:{id:scheduleId},usesDefaultWorkingHours:!ownHours,workingHoursSchedules:ownHours?[{id:scheduleId}]:[]}}]};
      else if(pathname.includes('/schedules/'))data={schedule:{id:scheduleId,timeZone:'America/New_York'}};
      else if(pathname.endsWith('events/query'))data={events:existing};
      else data={event:{id:'test-event-id'}};
      return {ok:true,json:async()=>data};
    }
  });
  vm.runInContext(code,context);
  return {sync:context.syncWixRosterAvailability,calls,scheduleId};
}
test('an empty initial roster leaves the existing availability schedule in place', async()=>{
  const h=fixture();
  const result=await h.sync();
  assert.equal(result.deferred,1);
  assert.ok(h.calls.every(call=>!call.pathname.includes('/assign-working-hours-schedule')));
});

test('roster hours merge overlaps, skip cancelled shifts and use the Wix schedule time zone', async()=>{
  const day=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  const shifts=[['13:00','15:00','SCHEDULED'],['14:00','17:00','PUBLISHED'],['17:00','18:00','CANCELLED']]
    .map(([from,to,status])=>({assignment_type:'duty',status,start_at:day+'T'+from+':00Z',end_at:day+'T'+to+':00Z'}));
  const h=fixture({shifts});
  const result=await h.sync();
  assert.equal(result.created,1);
  const post=h.calls.find(call=>call.pathname==='/calendar/v3/events');
  assert.equal(post.payload.event.type,'WORKING_HOURS');
  assert.match(post.payload.event.start.localDate,/T0[89]:00:00$/);
  assert.match(post.payload.event.end.localDate,/T1[23]:00:00$/);
  assert.equal(h.calls.at(-1).payload.scheduleId,h.scheduleId);
});

test('roster synchronization refuses to cancel existing non-roster working hours', async()=>{
  const h=fixture({ownHours:true,existing:[{id:'manual',title:'Existing working hours'}]});
  await assert.rejects(h.sync(),/WIX_ROSTER_RECONCILIATION_INCOMPLETE/);
  assert.ok(h.calls.every(call=>!call.pathname.endsWith('/cancel')));
});

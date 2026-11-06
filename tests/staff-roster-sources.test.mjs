import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import * as definitions from '../src/backend/SKANDI_CORE/rosterAssignments.js';

const source = new URL('../src/backend/SKANDI_CORE/', import.meta.url);
const from = '2026-11-06';
const to = '2026-11-08';
const startAt = '2026-11-07T09:00:00Z';
const endAt = '2026-11-07T17:00:00Z';
const session = {
  permissionGroups: ['destination'],
  profile: { agentUserUuid: 'staff-uuid', agentId: 'SK-OWNER', jobTitle: 'Destination Guide', baseCode: 'BASE' }
};

const fixture = {
  crew_assignments: {
    id: 'crew-1', employee_ref: 'staff-uuid', assignment: 'Old label',
    start_at: startAt, end_at: endAt, payload: { label: 'Crew briefing' }
  },
  vehicle_assignments: {
    id: 'vehicle-1', employee_id: 'SK-OWNER',
    start_time: startAt, end_time: endAt, payload: { label: 'Vehicle handover' }
  }
};

async function runBootstrap(file, method) {
  const code = await fs.readFile(new URL(file, source), 'utf8');
  const requestedTables = new Set();
  const context = vm.createContext({
    ...definitions,
    requireStaffPortalSessionCore: async () => session,
    restRequest: async ({ table, query }) => {
      if (!Object.hasOwn(definitions.ROSTER_ASSIGNMENT_SOURCES, table)) return [];
      requestedTables.add(table);
      assert.equal(query.select, definitions.ROSTER_ASSIGNMENT_SOURCES[table].select);
      assert.ok([query.employee_id, query.employee_ref].some(value => ['eq.staff-uuid', 'eq.SK-OWNER'].includes(value)));
      const row = fixture[table];
      if (!row || !['employee_id', 'employee_ref'].some(key => query[key] && query[key] === 'eq.' + row[key])) return [];
      return [row, { ...row, id: 'other-staff', employee_id: 'SK-OTHER', employee_ref: null }];
    }
  });
  vm.runInContext(code.replace(/^import .+;$/gm, '').replace(/^export /gm, ''), context);
  const result = await context[method]({ from, to });
  assert.deepEqual([...requestedTables].sort(), Object.keys(definitions.ROSTER_ASSIGNMENT_SOURCES).sort());
  return Array.from(result.assignments, row => [row.id, row.label, row.startAt, row.endAt]);
}

test('desktop and mobile return the same owned crew and vehicle assignments with the OPS label', async () => {
  const results = await Promise.all([
    runBootstrap('myRoster.js', 'getMyRosterBootstrapCore'),
    runBootstrap('eos.js', 'getEosBootstrapCore')
  ]);
  for (const assignments of results) {
    assert.deepEqual(assignments, [
      ['crew-1', 'Crew briefing', startAt, endAt],
      ['vehicle-1', 'Vehicle handover', startAt, endAt]
    ]);
  }
});

test('OPS Control resolves legacy UUID and SK-ID roster owners to the same employee', async () => {
  const code = await fs.readFile(new URL('opsControl.js', source), 'utf8');
  const context = vm.createContext({
    ...definitions,
    requireStaffPortalSessionCore: async () => ({ permissionGroups: ['occ'], profile: {} }),
    restRequest: async ({ table }) => {
      if (table === 'agent_users') return [{ id: 'staff-uuid', sk_id: 'SK-OWNER' }];
      return fixture[table] ? [fixture[table]] : [];
    }
  });
  vm.runInContext(code.replace(/^import .+;$/gm, '').replace(/^export /gm, ''), context);
  const result = await context.getOpsControlBootstrapCore({ windowStart: from });
  assert.equal(result.crewData.length, 1);
  assert.equal(result.crewData[0].agentId, 'SK-OWNER');
  assert.deepEqual(Array.from(result.crewData[0].acts, row => row.id), ['crew-1', 'vehicle-1']);
});

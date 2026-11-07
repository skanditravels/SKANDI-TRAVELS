import test from 'node:test';
import assert from 'node:assert/strict';
import { createStaffActivitySession, STAFF_IDLE_LIMIT_MS } from '../src/public/riaintraSession.js';

function sharedStorage() {
  const values = new Map();
  return {getItem:key => values.get(key) ?? null, setItem:(key,value) => values.set(key,value), removeItem:key => values.delete(key)};
}
test('staff session survives reload and activity in another tab extends the same deadline', () => {
  let clock = 1000000;
  const storage = sharedStorage();
  const first = createStaffActivitySession(storage, () => clock);
  first.start();
  const reloaded = createStaffActivitySession(storage, () => clock);
  clock += STAFF_IDLE_LIMIT_MS - 1000;
  assert.equal(reloaded.active(), true);
  assert.equal(reloaded.touch(), true);
  clock += 1000;
  assert.equal(first.active(), true);
  clock += STAFF_IDLE_LIMIT_MS - 1000;
  assert.equal(first.active(), false);
  assert.equal(first.touch(), false);
  assert.equal(reloaded.active(), false);
});
test('logout, invalid storage and a backwards clock do not restore staff access', () => {
  let clock = 1000000;
  const storage = sharedStorage();
  const staff = createStaffActivitySession(storage, () => clock);
  assert.equal(staff.active(), false);
  staff.start();
  clock--;
  assert.equal(staff.active(), false);
  clock++;
  staff.clear();
  assert.equal(staff.active(), false);
  assert.throws(() => createStaffActivitySession({setItem() {}, getItem() {return null;}}, () => clock).start());
});

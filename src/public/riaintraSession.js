// An inactivity marker only; Wix authentication and staff authorization remain authoritative.
export const STAFF_IDLE_LIMIT_MS = 30 * 60 * 1000;
export const STAFF_SESSION_KEY = 'skandi_riaintra_activity_v1';

export function createStaffActivitySession(storage, now = () => Date.now()) {
  function lastActivity() {
    try {
      const raw = storage.getItem(STAFF_SESSION_KEY);
      const value = Number(raw);
      return raw && Number.isFinite(value) && value > 0 ? value : null;
    } catch (_) { return null; }
  }
  function active() {
    const last = lastActivity();
    const current = now();
    return last !== null && Number.isFinite(current) && current >= last && current - last < STAFF_IDLE_LIMIT_MS;
  }
  function start() {
    const current = now();
    if (!Number.isFinite(current) || current <= 0) throw new Error('Staff session clock unavailable');
    storage.setItem(STAFF_SESSION_KEY, String(current));
    if (!active()) throw new Error('Staff session storage unavailable');
  }
  function touch() {
    if (!active()) return false;
    try {
      storage.setItem(STAFF_SESSION_KEY, String(now()));
      return active();
    } catch (_) { return false; }
  }
  function clear() { try { storage.removeItem(STAFF_SESSION_KEY); } catch (_) {} }
  return Object.freeze({ active, start, touch, clear });
}

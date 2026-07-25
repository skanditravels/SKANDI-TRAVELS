const memory = new Map();

export function cacheGet(key) {
  const item = memory.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return item.value;
}

export function cacheSet(key, value, ttlMs = 60000) {
  memory.set(key, {
    value,
    expiresAt: ttlMs ? Date.now() + ttlMs : null
  });
  return value;
}

export function cacheDelete(key) {
  memory.delete(key);
}

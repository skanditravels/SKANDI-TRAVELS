// /src/backend/SKANDI_CORE/platformCache.js
// SKANDI Backend Base 1.0 — bounded in-memory TTL cache for read-only metadata.

export class TtlCache {
  constructor({ ttlMs = 300000, maxEntries = 100 } = {}) {
    this.ttlMs = Math.max(1000, Number(ttlMs) || 300000);
    this.maxEntries = Math.max(1, Number(maxEntries) || 100);
    this.map = new Map();
  }

  get(key) {
    const item = this.map.get(key);
    if (!item) return undefined;
    if (item.expiresAt <= Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (this.map.size >= this.maxEntries && !this.map.has(key)) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, {
      value,
      expiresAt: Date.now() + Math.max(1000, Number(ttlMs) || this.ttlMs)
    });
    return value;
  }

  delete(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  async getOrLoad(key, loader, ttlMs = this.ttlMs) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const loaded = await loader();
    return this.set(key, loaded, ttlMs);
  }
}

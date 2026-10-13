/**
 * BioSync AI - High-Performance Multi-Tier In-Memory Cache Service
 * Module: cacheService.js
 * 
 * Provides sub-millisecond caching for hot read paths (Test Catalog,
 * User Vitals Snapshots, System Health) with automated TTL eviction
 * and granular tag-based cache invalidation.
 */

class MemoryCacheService {
  constructor() {
    this.cache = new Map();
    this.tagMap = new Map(); // tag -> Set of keys
    this.hits = 0;
    this.misses = 0;
    this.maxItems = 2000;
  }

  /**
   * Get cached item or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Store item with TTL in seconds and optional invalidation tags
   */
  set(key, value, ttlSeconds = 300, tags = []) {
    // Evict oldest if capacity exceeded
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt, tags });

    // Index tags
    for (const tag of tags) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag).add(key);
    }

    return value;
  }

  /**
   * Delete single key
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry && entry.tags) {
      for (const tag of entry.tags) {
        const set = this.tagMap.get(tag);
        if (set) {
          set.delete(key);
          if (set.size === 0) this.tagMap.delete(tag);
        }
      }
    }
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a tag (e.g. 'testCatalog' or 'vitals:USER_ID')
   */
  invalidateTag(tag) {
    const keys = this.tagMap.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of Array.from(keys)) {
      this.delete(key);
      count++;
    }
    this.tagMap.delete(tag);
    return count;
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.tagMap.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Health & performance metrics
   */
  getMetrics() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxCapacity: this.maxItems,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? parseFloat(((this.hits / total) * 100).toFixed(1)) : 0.0,
      activeTags: this.tagMap.size,
    };
  }
}

export const memoryCache = new MemoryCacheService();
export default memoryCache;

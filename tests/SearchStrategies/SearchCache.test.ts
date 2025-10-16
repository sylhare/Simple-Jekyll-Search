import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { SearchCache } from '../../src/SearchStrategies/SearchCache';

describe('SearchCache', () => {
  let cache: SearchCache<string>;

  beforeEach(() => {
    cache = new SearchCache<string>({ maxSize: 3, ttl: 1000 });
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update hits counter on cache hit', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
    });

    it('should update misses counter on cache miss', () => {
      cache.get('nonexistent');
      cache.get('another-miss');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire entries after TTL', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      vi.advanceTimersByTime(1001);
      
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not expire entries before TTL', () => {
      cache.set('key1', 'value1');
      
      vi.advanceTimersByTime(500);
      
      expect(cache.get('key1')).toBe('value1');
    });

    it('should count expired entry as miss', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      
      vi.advanceTimersByTime(1001);
      cache.get('key1');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should remove expired entry on has() check', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      vi.advanceTimersByTime(1001);
      
      expect(cache.has('key1')).toBe(false);
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when maxSize is reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should keep frequently accessed entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');
      
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3);
    });

    it('should maintain maxSize constraint', () => {
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });
  });

  describe('cache statistics', () => {
    it('should track cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      cache.get('nonexistent');
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(66.67);
    });

    it('should return 0 hit rate when no operations', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should include cache options in stats', () => {
      const stats = cache.getStats();
      expect(stats.maxSize).toBe(3);
      expect(stats.ttl).toBe(1000);
    });
  });

  describe('clear()', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should reset hit and miss counters', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('nonexistent');
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('default options', () => {
    it('should use default maxSize if not provided', () => {
      const defaultCache = new SearchCache<string>();
      const stats = defaultCache.getStats();
      expect(stats.maxSize).toBe(1000);
    });

    it('should use default TTL if not provided', () => {
      const defaultCache = new SearchCache<string>();
      const stats = defaultCache.getStats();
      expect(stats.ttl).toBe(60000);
    });

    it('should allow partial options', () => {
      const customCache = new SearchCache<string>({ maxSize: 50 });
      const stats = customCache.getStats();
      expect(stats.maxSize).toBe(50);
      expect(stats.ttl).toBe(60000);
    });
  });

  describe('complex data types', () => {
    it('should cache objects', () => {
      const objCache = new SearchCache<{ name: string; age: number }>();
      const obj = { name: 'John', age: 30 };
      
      objCache.set('user', obj);
      const retrieved = objCache.get('user');
      
      expect(retrieved).toEqual(obj);
    });

    it('should cache arrays', () => {
      const arrCache = new SearchCache<number[]>();
      const arr = [1, 2, 3, 4, 5];
      
      arrCache.set('numbers', arr);
      const retrieved = arrCache.get('numbers');
      
      expect(retrieved).toEqual(arr);
    });
  });
});


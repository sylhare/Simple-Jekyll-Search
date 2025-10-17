import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { SearchStrategy } from '../../src/SearchStrategies/types';

describe('SearchStrategy Caching', () => {
  let strategy: SearchStrategy;
  let findMatchesCalls: number;

  beforeEach(() => {
    findMatchesCalls = 0;

    const findMatchesFunction = (text: string, criteria: string) => {
      findMatchesCalls++;
      const lowerText = text.toLowerCase();
      const lowerCriteria = criteria.toLowerCase();
      const index = lowerText.indexOf(lowerCriteria);
      
      if (index !== -1) {
        return [{
          start: index,
          end: index + criteria.length,
          text: text.substring(index, index + criteria.length),
          type: 'exact' as const
        }];
      }
      
      return [];
    };

    strategy = new SearchStrategy(findMatchesFunction);
  });

  afterEach(() => {
    if (strategy && strategy.clearCache) {
      strategy.clearCache();
    }
  });

  describe('matches() caching', () => {
    it('should cache matches() results', () => {
      strategy.matches('hello world', 'hello');
      strategy.matches('hello world', 'hello');
      
      expect(findMatchesCalls).toBe(1);
    });

    it('should use different cache keys for different texts', () => {
      strategy.matches('hello world', 'hello');
      strategy.matches('goodbye world', 'hello');
      
      expect(findMatchesCalls).toBe(2);
    });

    it('should use different cache keys for different criteria', () => {
      strategy.matches('hello world', 'hello');
      strategy.matches('hello world', 'world');
      
      expect(findMatchesCalls).toBe(2);
    });
  });

  describe('findMatches() caching', () => {
    it('should cache findMatches() results', () => {
      strategy.findMatches('hello world', 'hello');
      strategy.findMatches('hello world', 'hello');
      
      expect(findMatchesCalls).toBe(1);
    });

    it('should return correct match info on cache hit', () => {
      const result1 = strategy.findMatches('hello world', 'hello');
      const result2 = strategy.findMatches('hello world', 'hello');
      
      expect(result2).toEqual(result1);
      expect(result2[0].start).toBe(0);
      expect(result2[0].end).toBe(5);
    });
  });

  describe('shared cache between matches() and findMatches()', () => {
    it('should share cache between matches() and findMatches()', () => {
      strategy.matches('hello world', 'hello');
      strategy.findMatches('hello world', 'hello');
      
      expect(findMatchesCalls).toBe(1);
    });

    it('should share cache in reverse order', () => {
      strategy.findMatches('hello world', 'hello');
      strategy.matches('hello world', 'hello');
      
      expect(findMatchesCalls).toBe(1);
    });
  });

  describe('clearCache()', () => {
    it('should clear the cache', () => {
      strategy.matches('hello world', 'hello');
      strategy.clearCache();
      strategy.matches('hello world', 'hello');
      
      expect(findMatchesCalls).toBe(2);
    });

    it('should reset cache statistics', () => {
      strategy.matches('hello world', 'hello');
      strategy.matches('hello world', 'hello');
      
      const statsBefore = strategy.getCacheStats();
      expect(statsBefore.hitRate).toBeGreaterThan(0);
      
      strategy.clearCache();
      
      const statsAfter = strategy.getCacheStats();
      expect(statsAfter.hitRate).toBe(0);
      expect(statsAfter.size).toBe(0);
    });
  });

  describe('getCacheStats()', () => {
    it('should report cache statistics', () => {
      strategy.matches('hello world', 'hello');
      strategy.matches('hello world', 'hello');
      strategy.matches('goodbye world', 'hello');
      
      const stats = strategy.getCacheStats();
      
      expect(stats.hitRate).toBe(33.33);
      expect(stats.size).toBe(2);
    });

    it('should track cache hits correctly', () => {
      strategy.matches('test', 'test');
      strategy.matches('test', 'test');
      strategy.matches('test', 'test');
      
      const stats = strategy.getCacheStats();
      expect(stats.hitRate).toBe(66.67);
    });
  });

  describe('cache key generation', () => {
    it('should handle long texts in cache keys', () => {
      const longText = 'a'.repeat(1000);
      
      strategy.matches(longText, 'a');
      strategy.matches(longText, 'a');
      
      expect(findMatchesCalls).toBe(1);
    });

    it('should handle special characters in cache keys', () => {
      strategy.matches('hello:world', 'hello');
      strategy.matches('hello:world', 'hello');
      
      expect(findMatchesCalls).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should not cache null text', () => {
      strategy.matches(null, 'test');
      strategy.matches(null, 'test');
      
      expect(findMatchesCalls).toBe(0);
    });

    it('should not cache empty text', () => {
      strategy.matches('', 'test');
      strategy.matches('', 'test');
      
      expect(findMatchesCalls).toBe(0);
    });

    it('should not cache empty criteria', () => {
      strategy.matches('test', '');
      strategy.matches('test', '');
      
      expect(findMatchesCalls).toBe(0);
    });
  });

  describe('cache performance', () => {
    it('should significantly speed up repeated searches', () => {
      const text = 'Lorem ipsum dolor sit amet';
      const criteria = 'ipsum';
      
      const start1 = performance.now();
      strategy.matches(text, criteria);
      const time1 = performance.now() - start1;
      
      const start2 = performance.now();
      strategy.matches(text, criteria);
      const time2 = performance.now() - start2;
      
      expect(time2).toBeLessThan(time1);
    });
  });
});


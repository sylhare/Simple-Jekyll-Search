import { describe, expect, it } from 'vitest';
import { HybridSearchStrategy } from '../../src/SearchStrategies/HybridSearchStrategy';

describe('HybridSearchStrategy', () => {
  describe('wildcard detection', () => {
    const strategy = new HybridSearchStrategy();

    it('should use wildcard search when * is present', () => {
      const matches = strategy.findMatches('hello world', 'hel*rld');
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('wildcard');
    });

    it('should use wildcard search for multiple * patterns', () => {
      const matches = strategy.findMatches('hello amazing world', 'hello*world');
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('wildcard');
    });

    it('should fall back to literal if wildcard has no match', () => {
      const matches = strategy.findMatches('hello world', 'xyz*abc');
      expect(matches).toEqual([]);
    });
  });

  describe('multi-word detection', () => {
    const strategy = new HybridSearchStrategy();

    it('should use literal search for multi-word queries', () => {
      const matches = strategy.findMatches('hello amazing world', 'hello world');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('exact');
    });

    it('should find all words in multi-word search', () => {
      const matches = strategy.findMatches('test this amazing test', 'test amazing');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should not match if any word is missing', () => {
      const matches = strategy.findMatches('hello world', 'hello missing');
      expect(matches).toEqual([]);
    });
  });

  describe('fuzzy fallback', () => {
    const strategy = new HybridSearchStrategy();

    it('should use fuzzy search for single-word queries >= minFuzzyLength', () => {
      const matches = strategy.findMatches('javascript', 'jvscrpt');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('should use fuzzy for long single words', () => {
      const matches = strategy.findMatches('development', 'dvlpmnt');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });
  });

  describe('short query handling', () => {
    const strategy = new HybridSearchStrategy();

    it('should use literal search for queries < minFuzzyLength', () => {
      const matches = strategy.findMatches('hello', 'he');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('exact');
    });

    it('should use literal for 2-character queries', () => {
      const matches = strategy.findMatches('ab cd ef', 'ab');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should respect minFuzzyLength config', () => {
      const customStrategy = new HybridSearchStrategy({ minFuzzyLength: 5 });
      const matches = customStrategy.findMatches('test', 'test');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should respect preferFuzzy config', () => {
      const fuzzyPreferred = new HybridSearchStrategy({ preferFuzzy: true });
      const matches = fuzzyPreferred.findMatches('testing', 'tsting');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('should respect wildcardPriority = false', () => {
      const noWildcardPriority = new HybridSearchStrategy({ wildcardPriority: false });
      const matches = noWildcardPriority.findMatches('hello world', 'hello');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should return config via getConfig()', () => {
      const strategy = new HybridSearchStrategy({ minFuzzyLength: 5, preferFuzzy: true });
      const config = strategy.getConfig();
      expect(config.minFuzzyLength).toBe(5);
      expect(config.preferFuzzy).toBe(true);
      expect(config.wildcardPriority).toBe(true);
    });
  });

  describe('fallback chain', () => {
    const strategy = new HybridSearchStrategy();

    it('should fall back to literal when wildcard fails', () => {
      const matches = strategy.findMatches('hello world', 'world');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should fall back to literal when fuzzy fails', () => {
      const matches = strategy.findMatches('abc', 'xyz');
      expect(matches).toEqual([]);
    });

    it('should try all strategies in order', () => {
      const strategy = new HybridSearchStrategy();
      const matches = strategy.findMatches('hello world', 'hello');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    const strategy = new HybridSearchStrategy();

    it('should handle empty strings', () => {
      const matches = strategy.findMatches('', 'test');
      expect(matches).toEqual([]);
    });

    it('should handle special characters', () => {
      const matches = strategy.findMatches('test@example.com', '@example');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters', () => {
      const matches = strategy.findMatches('你好世界', '你好');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('matches() method', () => {
    const strategy = new HybridSearchStrategy();

    it('should return true for valid matches', () => {
      expect(strategy.matches('hello world', 'hello')).toBe(true);
      expect(strategy.matches('test', 'te*t')).toBe(true);
    });

    it('should return false for no matches', () => {
      expect(strategy.matches('hello', 'xyz')).toBe(false);
    });
  });
});


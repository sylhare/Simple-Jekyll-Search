import { describe, expect, it } from 'vitest';
import { UnifiedSearchStrategy } from '../../src/SearchStrategies/UnifiedSearchStrategy';
import { HybridSearchStrategy } from '../../src/SearchStrategies/HybridSearchStrategy';

/**
 * Part 1 mirrors the HybridSearchStrategy suite's behavioural assertions.
 * Part 2 is a direct parity sweep: for a corpus of (text, query) pairs it asserts
 * UnifiedSearchStrategy's matches() boolean agrees with the hybrid strategy's.
 */
describe('UnifiedSearchStrategy', () => {
  describe('wildcard', () => {
    const strategy = new UnifiedSearchStrategy();

    it('matches across one space by default (maxSpaces: 1)', () => {
      const matches = strategy.findMatches('hello world', 'hel*');
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('wildcard');
      expect(matches[0].text).toBe('hello world');
    });

    it('stops at the word boundary with maxSpaces: 0', () => {
      const noSpaces = new UnifiedSearchStrategy({ maxSpaces: 0 });
      const matches = noSpaces.findMatches('hello world', 'hel*');
      expect(matches).toHaveLength(1);
      expect(matches[0].text).toBe('hello');
    });

    it('spans a mid-pattern wildcard within the space budget', () => {
      expect(strategy.matches('hello world', 'hel*rld')).toBe(true);
      expect(new UnifiedSearchStrategy({ maxSpaces: 0 }).matches('hello world', 'hel*rld')).toBe(false);

      const twoSpaces = new UnifiedSearchStrategy({ maxSpaces: 2 });
      expect(twoSpaces.matches('hello brave world', 'hel*rld')).toBe(true);
      expect(twoSpaces.matches('hello brave new world', 'hel*rld')).toBe(false);
      expect(new UnifiedSearchStrategy({ maxSpaces: 3 }).matches('hello brave new world', 'hel*rld')).toBe(true);
    });

    it('returns nothing when the wildcard pattern is absent', () => {
      expect(strategy.findMatches('hello world', 'xyz*abc')).toEqual([]);
    });
  });

  describe('multi-word (exact per token, AND)', () => {
    const strategy = new UnifiedSearchStrategy();

    it('matches when every word is present', () => {
      const matches = strategy.findMatches('hello amazing world', 'hello world');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('exact');
    });

    it('finds all words', () => {
      expect(strategy.findMatches('test this amazing test', 'test amazing').length).toBeGreaterThan(0);
    });

    it('fails when any word is missing', () => {
      expect(strategy.findMatches('hello world', 'hello missing')).toEqual([]);
    });
  });

  describe('fuzzy single word', () => {
    const strategy = new UnifiedSearchStrategy();

    it('tolerates a dropped character for words >= minFuzzyLength', () => {
      const matches = strategy.findMatches('testing', 'tsting');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('tolerates a dropped character in a short-ish long word', () => {
      const matches = strategy.findMatches('hello', 'hllo');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });
  });

  describe('fuzzy span budget', () => {
    const longText = 'This is an article with more technical content to test the search functionality. A command with some regex and special characters.';

    it('rejects fuzzy matches that span too many extra characters by default', () => {
      expect(new UnifiedSearchStrategy().findMatches(longText, 'high')).toEqual([]);
    });

    it('allows wider spans when configured', () => {
      const permissive = new UnifiedSearchStrategy({ maxExtraFuzzyChars: Infinity });
      const matches = permissive.findMatches(longText, 'high');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('honours an explicit extra-char budget', () => {
      const strict = new UnifiedSearchStrategy({ maxExtraFuzzyChars: 0, minFuzzyLength: 1 });
      expect(strict.findMatches('hello world', 'hw')).toEqual([]);

      const lenient = new UnifiedSearchStrategy({ maxExtraFuzzyChars: 10, minFuzzyLength: 1 });
      const matches = lenient.findMatches('hello world', 'hw');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });
  });

  describe('short queries stay exact', () => {
    const strategy = new UnifiedSearchStrategy();

    it('uses exact matching below minFuzzyLength', () => {
      const matches = strategy.findMatches('hello', 'he');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('exact');
    });

    it('matches a 2-character query', () => {
      expect(strategy.findMatches('ab cd ef', 'ab').length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('respects minFuzzyLength', () => {
      expect(new UnifiedSearchStrategy({ minFuzzyLength: 5 }).findMatches('test', 'test').length).toBeGreaterThan(0);
    });

    it('respects preferFuzzy', () => {
      const fuzzyPreferred = new UnifiedSearchStrategy({ preferFuzzy: true });
      const matches = fuzzyPreferred.findMatches('testing', 'tsting');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('respects wildcardPriority = false', () => {
      const noWildcardPriority = new UnifiedSearchStrategy({ wildcardPriority: false });
      expect(noWildcardPriority.findMatches('hello world', 'hello').length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    const strategy = new UnifiedSearchStrategy();

    it('handles empty text', () => {
      expect(strategy.findMatches('', 'test')).toEqual([]);
    });

    it('handles special characters as literals (no regex injection)', () => {
      expect(strategy.findMatches('test@example.com', '@example').length).toBeGreaterThan(0);
      // A raw regex metachar in the query must be treated literally, not compiled.
      expect(strategy.findMatches('a+b', 'a+b').length).toBeGreaterThan(0);
      expect(strategy.findMatches('axxb', 'a+b')).toEqual([]);
    });

    it('handles unicode', () => {
      expect(strategy.findMatches('你好世界', '你好').length).toBeGreaterThan(0);
    });
  });

  describe('matches() method', () => {
    const strategy = new UnifiedSearchStrategy();

    it('returns true for valid matches', () => {
      expect(strategy.matches('hello world', 'hello')).toBe(true);
      expect(strategy.matches('test', 'te*t')).toBe(true);
    });

    it('returns false for no matches', () => {
      expect(strategy.matches('hello', 'xyz')).toBe(false);
    });
  });

  describe('parity sweep vs HybridSearchStrategy', () => {
    const corpus = [
      'The quick brown fox jumps over the lazy dog',
      'hello world',
      'hello amazing world',
      'test@example.com',
      'JavaScript client-side search library',
      '你好世界',
      'ab cd ef',
      'testing the search functionality',
    ];
    const queries = [
      'hello', 'world', 'hello world', 'hello missing', 'quick fox',
      'hel*', 'hel*rld', 'te*t', 'xyz*abc',
      'tsting', 'hllo', 'searh', 'functionalty', 'javascrpt',
      'he', 'ab', 'xyz', '@example', '你好', 'client-side',
    ];

    const configs: Array<Record<string, unknown>> = [
      {},
      { maxSpaces: 0 },
      { preferFuzzy: true },
      { minFuzzyLength: 1 },
      { maxExtraFuzzyChars: Infinity },
    ];

    for (const config of configs) {
      const label = JSON.stringify(config);
      const hybrid = new HybridSearchStrategy(config);
      const unified = new UnifiedSearchStrategy(config);

      for (const text of corpus) {
        for (const query of queries) {
          it(`matches() agrees for text=${JSON.stringify(text)} query=${JSON.stringify(query)} config=${label}`, () => {
            expect(unified.matches(text, query)).toBe(hybrid.matches(text, query));
          });
        }
      }
    }
  });
});

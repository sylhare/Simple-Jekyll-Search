import { describe, expect, it } from 'vitest';
import { UnifiedSearchStrategy } from '../../src/SearchStrategies/UnifiedSearchStrategy';
import { HybridSearchStrategy } from '../../src/SearchStrategies/HybridSearchStrategy';
import { StrategyFactory } from '../../src/SearchStrategies/StrategyFactory';
import { findWildcardMatches } from '../../src/SearchStrategies/search/findWildcardMatches';
import type { StrategyOptions } from '../../src/SearchStrategies/types';

const implementations = [
  { name: 'UnifiedSearchStrategy', make: (config?: StrategyOptions) => new UnifiedSearchStrategy(config) },
  { name: 'HybridSearchStrategy', make: (config?: StrategyOptions) => new HybridSearchStrategy(config) },
];

describe.each(implementations)('$name shared behaviour', ({ make }) => {
  const longText = 'This is an article with more technical content to test the search functionality. A command with some regex and special characters.';

  describe('wildcard', () => {
    it('matches across one space by default (maxSpaces: 1)', () => {
      const matches = make().findMatches('hello world', 'hel*');
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('wildcard');
      expect(matches[0].text).toBe('hello world');
    });

    it('spans to the next word from a mid-text match', () => {
      const matches = make().findMatches('hello amazing world', 'amaz*');
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('wildcard');
      expect(matches[0].text).toBe('amazing world');
    });

    it('stops at the word boundary with maxSpaces: 0', () => {
      const matches = make({ maxSpaces: 0 }).findMatches('hello world', 'hel*');
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('wildcard');
      expect(matches[0].text).toBe('hello');
    });

    it('spans a mid-pattern wildcard within the space budget', () => {
      expect(make().matches('hello world', 'hel*rld')).toBe(true);
      expect(make({ maxSpaces: 0 }).matches('hello world', 'hel*rld')).toBe(false);
      expect(make({ maxSpaces: 2 }).matches('hello brave world', 'hel*rld')).toBe(true);
      expect(make({ maxSpaces: 2 }).matches('hello brave new world', 'hel*rld')).toBe(false);
      expect(make({ maxSpaces: 3 }).matches('hello brave new world', 'hel*rld')).toBe(true);
    });

    it('returns nothing when the wildcard pattern is absent', () => {
      expect(make().findMatches('hello world', 'xyz*abc')).toEqual([]);
    });
  });

  describe('multi-word (exact per token, AND)', () => {
    it('matches when every word is present', () => {
      const matches = make().findMatches('hello amazing world', 'hello world');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('exact');
    });

    it('finds all words', () => {
      expect(make().findMatches('test this amazing test', 'test amazing').length).toBeGreaterThan(0);
    });

    it('fails when any word is missing', () => {
      expect(make().findMatches('hello world', 'hello missing')).toEqual([]);
    });
  });

  describe('fuzzy single word', () => {
    it('tolerates a dropped character for words >= minFuzzyLength', () => {
      const matches = make().findMatches('testing', 'tsting');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('tolerates a dropped character in a short-ish long word', () => {
      const matches = make().findMatches('hello', 'hllo');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });
  });

  describe('fuzzy span budget', () => {
    it('rejects fuzzy matches that span too many extra characters by default', () => {
      expect(make().findMatches(longText, 'high')).toEqual([]);
    });

    it('allows wider spans when configured', () => {
      const matches = make({ maxExtraFuzzyChars: Infinity }).findMatches(longText, 'high');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('honours an explicit extra-char budget', () => {
      expect(make({ maxExtraFuzzyChars: 0, minFuzzyLength: 1 }).findMatches('hello world', 'hw')).toEqual([]);
      const matches = make({ maxExtraFuzzyChars: 10, minFuzzyLength: 1 }).findMatches('hello world', 'hw');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });
  });

  describe('short queries stay exact', () => {
    it('uses exact matching below minFuzzyLength', () => {
      const matches = make().findMatches('hello', 'he');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('exact');
    });

    it('matches a 2-character query', () => {
      expect(make().findMatches('ab cd ef', 'ab').length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('respects minFuzzyLength when the query is long enough', () => {
      expect(make({ minFuzzyLength: 5 }).findMatches('test', 'test').length).toBeGreaterThan(0);
    });

    it('disables fuzzy for queries below minFuzzyLength', () => {
      expect(make({ minFuzzyLength: 10 }).findMatches('javascript', 'jvscrpt')).toEqual([]);
    });

    it('respects preferFuzzy', () => {
      const matches = make({ preferFuzzy: true }).findMatches('testing', 'tsting');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('fuzzy');
    });

    it('respects wildcardPriority = false', () => {
      expect(make({ wildcardPriority: false }).findMatches('hello world', 'hello').length).toBeGreaterThan(0);
    });
  });

  describe('intentional divergences from the original hybrid cascade', () => {
    it('never falls back to whole-query fuzzy for multi-word queries', () => {
      expect(make().findMatches('a b c d', 'ab cd')).toEqual([]);
      expect(make().matches('a b c d', 'ab cd')).toBe(false);
    });

    it('returns one exact span per occurrence when the query is an exact substring', () => {
      const matches = make().findMatches('test testing', 'test');
      expect(matches).toHaveLength(2);
      expect(matches.every(match => match.type === 'exact')).toBe(true);
      expect(matches.map(match => match.text)).toEqual(['test', 'test']);
    });
  });

  describe('fallback chain', () => {
    it('falls back to a literal match when the wildcard path is not taken', () => {
      expect(make().findMatches('hello world', 'world').length).toBeGreaterThan(0);
    });

    it('returns nothing when every path fails', () => {
      expect(make().findMatches('abc', 'xyz')).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles empty text', () => {
      expect(make().findMatches('', 'test')).toEqual([]);
    });

    it('handles special characters as literals (no regex injection)', () => {
      expect(make().findMatches('test@example.com', '@example').length).toBeGreaterThan(0);
      expect(make().findMatches('a+b', 'a+b').length).toBeGreaterThan(0);
      expect(make().findMatches('axxb', 'a+b')).toEqual([]);
    });

    it('handles unicode', () => {
      expect(make().findMatches('你好世界', '你好').length).toBeGreaterThan(0);
    });
  });

  describe('matches() method', () => {
    it('returns true for valid matches', () => {
      expect(make().matches('hello world', 'hello')).toBe(true);
      expect(make().matches('test', 'te*t')).toBe(true);
    });

    it('returns false for no matches', () => {
      expect(make().matches('hello', 'xyz')).toBe(false);
    });
  });
});

describe('wildcard strategy parity with findWildcardMatches', () => {
  const cases: Array<[string, string, StrategyOptions | undefined]> = [
    ['hello', 'he*o', undefined],
    ['hello', 'he*o*', undefined],
    ['test', 'te*t', undefined],
    ['text', 'te*t', undefined],
    ['hello amazing world', 'hello*world', undefined],
    ['hello world', 'hello*world', undefined],
    ['hello world', 'hello*', undefined],
    ['hello world', 'hel*rld', { maxSpaces: 1 }],
    ['hello brave new world', 'hel*rld', { maxSpaces: 2 }],
    ['hello brave new world', 'hel*rld', { maxSpaces: 3 }],
    ['world', 'h*o', undefined],
    ['hello world', 'miss*', undefined],
    ['hello world', '*world', undefined],
    ['hello world', '*llo wor*', undefined],
    ['this is a test article with many words', 't*', undefined],
    ['hello this is a long world sequence', 'hel*rld', { maxSpaces: Infinity }],
  ];

  const spans = (matches: Array<{ text: string; start: number; end: number }>) =>
    matches.map(({ text, start, end }) => ({ text, start, end }));

  for (const [text, pattern, options] of cases) {
    it(`spans agree for text=${JSON.stringify(text)} pattern=${JSON.stringify(pattern)}`, () => {
      const strategy = StrategyFactory.create({ type: 'wildcard', options });
      const expected = findWildcardMatches(text, pattern, options ?? {});
      expect(spans(strategy.findMatches(text, pattern))).toEqual(spans(expected));
    });
  }
});

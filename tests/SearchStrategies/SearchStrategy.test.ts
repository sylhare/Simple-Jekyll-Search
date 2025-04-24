import { describe, expect, it } from 'vitest';
import LiteralSearchStrategy from '../../src/SearchStrategies/LiteralSearchStrategy';
import WildcardSearchStrategy from '../../src/SearchStrategies/WildcardSearchStrategy';
import FuzzySearchStrategy from '../../src/SearchStrategies/FuzzySearchStrategy';

describe.each([
  { name: 'LiteralSearchStrategy', strategy: LiteralSearchStrategy },
  { name: 'FuzzySearchStrategy', strategy: FuzzySearchStrategy },
  { name: 'WildcardSearchStrategy', strategy: WildcardSearchStrategy },
])('$name', ({ strategy }) => {
  it('matches a word that is contained in the search criteria (single words)', () => {
    expect(strategy.matches('hello world test search text', 'world')).toBe(true);
  });

  it('does not match if a word is not contained in the search criteria', () => {
    expect(strategy.matches('hello world test search text', 'hello my world')).toBe(false);
  });

  it('matches a word that is contained in the search criteria (multiple words)', () => {
    expect(strategy.matches('hello world test search text', 'hello text world')).toBe(true);
  });

  it('matches exact words when exact words with space in the search criteria', () => {
    expect(strategy.matches('hello world test search text', 'hello world ')).toBe(true);
  });

  it.skip('does not match multiple words if not exact words with space in the search criteria', () => {
    expect(strategy.matches('hello world test search text', 'hello text world ')).toBe(false);
  });

  it('matches a word that is partially contained in the search criteria', () => {
    expect(strategy.matches('this tasty tester text', 'test')).toBe(true);
  });

  it('should handle empty strings correctly', () => {
    expect(strategy.matches('hello', '')).toBe(false);
    expect(strategy.matches('', 'hello')).toBe(false);
    expect(strategy.matches('', '')).toBe(false);
  });

  it('returns false when text is null', () => {
    expect(strategy.matches(null, 'criteria')).toBe(false);
  });
});
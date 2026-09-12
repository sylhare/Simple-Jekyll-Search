import { describe, expect, it } from 'vitest';
import { findRegexFuzzyMatches } from '../../src/SearchStrategies/search/findRegexFuzzyMatches';

describe('findRegexFuzzyMatches', () => {
  it('matches a contiguous substring as one span', () => {
    const matches = findRegexFuzzyMatches('testing', 'test');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ text: 'test', type: 'fuzzy' });
  });

  it('matches characters in order with gaps', () => {
    const matches = findRegexFuzzyMatches('testing', 'tsting');
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe('fuzzy');
    expect(matches[0].text).toBe('testing');
  });

  it('returns empty when the characters are not in order', () => {
    expect(findRegexFuzzyMatches('hello', 'olleh')).toEqual([]);
  });

  it('returns empty for an empty criteria', () => {
    expect(findRegexFuzzyMatches('hello', '')).toEqual([]);
    expect(findRegexFuzzyMatches('hello', '   ')).toEqual([]);
  });

  it('treats regex metacharacters in the query literally', () => {
    expect(findRegexFuzzyMatches('a+b', 'a+b')).toHaveLength(1);
    expect(findRegexFuzzyMatches('axxb', 'a+b')).toEqual([]);
  });
});

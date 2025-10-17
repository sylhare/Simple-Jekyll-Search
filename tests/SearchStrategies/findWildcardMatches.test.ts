import { describe, expect, it } from 'vitest';
import { findWildcardMatches } from '../../src/SearchStrategies/search/findWildcardMatches';

describe('findWildcardMatches', () => {
  it('should return matches for exact matches', () => {
    const matches = findWildcardMatches('hello', 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe('wildcard');
  });

  it('should return matches for patterns with wildcards', () => {
    expect(findWildcardMatches('hello', 'he*o')).toHaveLength(1);
    expect(findWildcardMatches('hello', 'he*o*')).toHaveLength(1);
    expect(findWildcardMatches('test', 'te*t')).toHaveLength(1);
    expect(findWildcardMatches('text', 'te*t')).toHaveLength(1);
  });

  it('should match multiple words with wildcards', () => {
    expect(findWildcardMatches('hello amazing world', 'hello*world')).toHaveLength(1);
    expect(findWildcardMatches('hello world', 'hello*world')).toHaveLength(1);
    expect(findWildcardMatches('hello world', 'hello*')).toHaveLength(1);
  });

  it('should return empty array for non-matching wildcard patterns', () => {
    expect(findWildcardMatches('world', 'h*o')).toEqual([]);
    expect(findWildcardMatches('xyz', 'abc')).toEqual([]);
  });

  it('should handle single-character patterns and texts', () => {
    expect(findWildcardMatches('a', 'a')).toHaveLength(1);
    expect(findWildcardMatches('b', 'a')).toEqual([]);
    const starMatches = findWildcardMatches('a', '*');
    expect(starMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array for a word not present in the text', () => {
    expect(findWildcardMatches('hello world', 'missing')).toEqual([]);
    expect(findWildcardMatches('hello world', 'miss*')).toEqual([]);
  });

  it('should return match info with correct positions', () => {
    const matches = findWildcardMatches('hello', 'hello');
    expect(matches[0].start).toBe(0);
    expect(matches[0].end).toBe(5);
    expect(matches[0].text).toBe('hello');
  });

  it('should handle wildcards at beginning and end', () => {
    expect(findWildcardMatches('hello world', '*world')).toHaveLength(1);
    expect(findWildcardMatches('hello world', 'hello*')).toHaveLength(1);
    expect(findWildcardMatches('hello world', '*llo wor*')).toHaveLength(1);
  });
});


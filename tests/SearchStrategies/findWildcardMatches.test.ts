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

  it('should match within words but stop at spaces', () => {
    expect(findWildcardMatches('hello amazing world', 'hello*world')).toHaveLength(0);
    expect(findWildcardMatches('hello world', 'hello*world')).toHaveLength(0);
    expect(findWildcardMatches('hello world', 'hello*')).toHaveLength(1);
    expect(findWildcardMatches('hello world', 'hello*')[0].text).toBe('hello');
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
    expect(findWildcardMatches('hello world', '*world')[0].text).toBe('world');
    expect(findWildcardMatches('hello world', 'hello*')).toHaveLength(1);
    expect(findWildcardMatches('hello world', 'hello*')[0].text).toBe('hello');
    expect(findWildcardMatches('hello world', '*llo wor*')).toHaveLength(1);
    expect(findWildcardMatches('hello world', '*llo wor*')[0].text).toBe('hello world');
  });

  it('should stop at spaces and not match entire article', () => {
    const article = 'this is a test article with many words';
    const matches = findWildcardMatches(article, 't*');
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches[0].text).toBe('this');
    expect(matches[1].text).toBe('test');
    matches.forEach(match => {
      expect(match.text).not.toContain(' ');
    });
  });

describe('buildWildcardFragment', () => {
  it('returns single-word pattern by default', () => {
    expect(buildWildcardFragment({})).toBe('[^ ]*');
  });

  it('allows configuring finite spaces', () => {
    expect(buildWildcardFragment({ maxSpaces: 2 })).toBe('[^ ]*(?: [^ ]*){0,2}');
  });

  it('normalizes values less than or equal to zero back to default', () => {
    expect(buildWildcardFragment({ maxSpaces: 0 })).toBe('[^ ]*');
    expect(buildWildcardFragment({ maxSpaces: -5 })).toBe('[^ ]*');
  });

  it('supports unlimited spaces with Infinity', () => {
    expect(buildWildcardFragment({ maxSpaces: Infinity })).toBe('[^ ]*(?: [^ ]*)*');
  });

  it('floors decimal inputs', () => {
    expect(buildWildcardFragment({ maxSpaces: 2.9 })).toBe('[^ ]*(?: [^ ]*){0,2}');
  });
});


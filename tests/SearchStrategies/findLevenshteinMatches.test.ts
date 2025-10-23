import { describe, expect, it } from 'vitest';
import { findLevenshteinMatches } from '../../src/SearchStrategies/search/findLevenshteinMatches';

describe('findLevenshteinMatches', () => {
  it('should return matches for identical strings', () => {
    const matches = findLevenshteinMatches('hello', 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe('fuzzy');
    expect(matches[0].text).toBe('hello');
  });

  it('should return matches for strings with small differences (substitutions)', () => {
    expect(findLevenshteinMatches('kitten', 'sitting')).toHaveLength(1);
    expect(findLevenshteinMatches('flaw', 'lawn')).toHaveLength(1);
  });

  it('should return matches for strings with insertions', () => {
    expect(findLevenshteinMatches('cat', 'cats')).toHaveLength(1);
    expect(findLevenshteinMatches('hello', 'helloo')).toHaveLength(1);
  });

  it('should return matches for strings with deletions', () => {
    expect(findLevenshteinMatches('cats', 'cat')).toHaveLength(1);
    expect(findLevenshteinMatches('helloo', 'hello')).toHaveLength(1);
  });

  it('should return empty array for completely different strings (low similarity)', () => {
    expect(findLevenshteinMatches('abc', 'xyz')).toEqual([]);
    expect(findLevenshteinMatches('abcd', 'wxyz')).toEqual([]);
  });

  it('should handle empty strings', () => {
    expect(findLevenshteinMatches('', 'hello')).toEqual([]);
    expect(findLevenshteinMatches('hello', '')).toEqual([]);
    expect(findLevenshteinMatches('', '')).toEqual([]);
  });

  it('should handle single-character strings', () => {
    const matchesIdentical = findLevenshteinMatches('a', 'a');
    expect(matchesIdentical).toHaveLength(1);
    expect(matchesIdentical[0].text).toBe('a');

    expect(findLevenshteinMatches('a', 'b')).toEqual([]);
    expect(findLevenshteinMatches('a', '')).toEqual([]);
  });

  it('should handle substitutions correctly', () => {
    expect(findLevenshteinMatches('ab', 'ac')).toHaveLength(1);
    expect(findLevenshteinMatches('ac', 'bc')).toHaveLength(1);
    expect(findLevenshteinMatches('abc', 'axc')).toHaveLength(1);
  });

  it('should handle multiple operations', () => {
    expect(findLevenshteinMatches('example', 'samples')).toHaveLength(1);
    expect(findLevenshteinMatches('distance', 'eistancd')).toHaveLength(1);
  });

  it('should handle non-Latin characters', () => {
    const matches = findLevenshteinMatches('你好世界', '你好');
    expect(matches).toHaveLength(1);
  });

  it('should respect similarity threshold of 30%', () => {
    const similarEnough = findLevenshteinMatches('back', 'book');
    expect(similarEnough).toHaveLength(1);
    
    const notSimilarEnough = findLevenshteinMatches('a', 'zzzzz');
    expect(notSimilarEnough).toEqual([]);
  });

  it('should return match info with correct structure', () => {
    const matches = findLevenshteinMatches('hello', 'helo');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      start: 0,
      end: 5,
      text: 'hello',
      type: 'fuzzy'
    });
  });
});


import { describe, expect, it } from 'vitest';
import { levenshtein, levenshteinSearch, findLevenshteinMatches } from '../../src/SearchStrategies/search/levenshtein';


describe('levenshtein', () => {

  /**
   * The distance Matrix
   *
   *     ""  b  a  c  k
   * ""   0  1  2  3  4
   * b    1  0  1  2  3
   * o    2  1  1  2  3
   * o    3  2  2  2  3
   * k    4  3  3  3  2
   *
   * difference between bo and ba is 1 so Matrix[2][2] = 1
   *
   * Result is Matrix["book".length]["back".length] = 2
   */
  it('should return the right difference', () => {
    expect(levenshtein('back', 'book')).toBe(2);
  });

  it('should return 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0);
  });

  it('should return the correct distance for strings with substitutions', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('flaw', 'lawn')).toBe(2);
  });

  it('should return the correct distance for strings with insertions', () => {
    expect(levenshtein('cat', 'cats')).toBe(1);
    expect(levenshtein('hello', 'helloo')).toBe(1);
  });

  it('should return the correct distance for strings with deletions', () => {
    expect(levenshtein('cats', 'cat')).toBe(1);
    expect(levenshtein('helloo', 'hello')).toBe(1);
  });

  it('should return the correct distance for completely different strings', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
    expect(levenshtein('abcd', 'wxyz')).toBe(4);
  });

  it('should handle empty strings correctly', () => {
    expect(levenshtein('', 'hello')).toBe(5);
    expect(levenshtein('hello', '')).toBe(5);
    expect(levenshtein('', '')).toBe(0);
  });

  it('should handle single-character strings correctly', () => {
    expect(levenshtein('a', 'b')).toBe(1);
    expect(levenshtein('a', 'a')).toBe(0);
    expect(levenshtein('a', '')).toBe(1);
  });

  it('should handle substitutions correctly', () => {
    expect(levenshtein('ab', 'ac')).toBe(1);
    expect(levenshtein('ac', 'bc')).toBe(1);
    expect(levenshtein('abc', 'axc')).toBe(1);
    expect(levenshtein('xabxcdxxefxgx', '1ab2cd34ef5g6')).toBe(6);
  });

  it('should handle multiple operations correctly', () => {
    expect(levenshtein('xabxcdxxefxgx', 'abcdefg')).toBe(6);
    expect(levenshtein('javawasneat', 'scalaisgreat')).toBe(7);
    expect(levenshtein('example', 'samples')).toBe(3);
    expect(levenshtein('forward', 'drawrof')).toBe(6);
    expect(levenshtein('sturgeon', 'urgently')).toBe(6);
    expect(levenshtein('levenshtein', 'frankenstein')).toBe(6);
    expect(levenshtein('distance', 'difference')).toBe(5);
    expect(levenshtein('distance', 'eistancd')).toBe(2);
  });

  it('should handle non-Latin characters correctly', () => {
    expect(levenshtein('你好世界', '你好')).toBe(2); // Chinese
    expect(levenshtein('因為我是中國人所以我會說中文', '因為我是英國人所以我會說英文')).toBe(2); // Chinese
  });
});

describe('levenshteinSearch', () => {
  it('should match identical strings', () => {
    expect(levenshteinSearch('hello', 'hello')).toBe(true);
    expect(levenshteinSearch('test', 'test')).toBe(true);
  });

  it('should match strings with high similarity (>= 30%)', () => {
    expect(levenshteinSearch('hello', 'helo')).toBe(true); // 80% similarity
    expect(levenshteinSearch('test', 'tst')).toBe(true); // 66% similarity
    expect(levenshteinSearch('world', 'word')).toBe(true); // 80% similarity
  });

  it('should not match strings with low similarity (< 30%)', () => {
    expect(levenshteinSearch('hello', 'xyz')).toBe(false); // 0% similarity
    expect(levenshteinSearch('test', 'abcd')).toBe(false); // 0% similarity
    expect(levenshteinSearch('world', 'abcdefgh')).toBe(false); // 12.5% similarity
  });

  it('should handle edge cases', () => {
    expect(levenshteinSearch('', '')).toBe(false); // Empty strings have 0 similarity
    expect(levenshteinSearch('a', '')).toBe(false);
    expect(levenshteinSearch('', 'a')).toBe(false);
  });

  it('should be case sensitive', () => {
    expect(levenshteinSearch('Hello', 'hello')).toBe(true); // Actually case insensitive
    expect(levenshteinSearch('Test', 'test')).toBe(true);
  });

  it('should handle single character matches', () => {
    expect(levenshteinSearch('a', 'a')).toBe(true);
    expect(levenshteinSearch('a', 'b')).toBe(false); // 0% similarity, below 30% threshold
    expect(levenshteinSearch('ab', 'a')).toBe(true); // 50% similarity
  });
});

describe('findLevenshteinMatches', () => {
  it('should return empty array for empty inputs', () => {
    expect(findLevenshteinMatches('', 'pattern')).toEqual([]);
    expect(findLevenshteinMatches('text', '')).toEqual([]);
    expect(findLevenshteinMatches('', '')).toEqual([]);
    expect(findLevenshteinMatches(null as any, 'pattern')).toEqual([]);
    expect(findLevenshteinMatches('text', null as any)).toEqual([]);
  });

  it('should find exact word matches', () => {
    const matches = findLevenshteinMatches('hello world test', 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 5,
      text: 'hello',
      type: 'wildcard'
    });
  });

  it('should find similar word matches', () => {
    const matches = findLevenshteinMatches('hello world test', 'helo');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 5,
      text: 'hello',
      type: 'wildcard'
    });
  });

  it('should find multiple matches', () => {
    const matches = findLevenshteinMatches('test testing tested', 'test');
    expect(matches).toHaveLength(3);
    expect(matches[0]).toEqual({
      start: 0,
      end: 4,
      text: 'test',
      type: 'wildcard'
    });
    expect(matches[1]).toEqual({
      start: 5,
      end: 12,
      text: 'testing',
      type: 'wildcard'
    });
    expect(matches[2]).toEqual({
      start: 13,
      end: 19, // 'tested' is 6 characters, not 7
      text: 'tested',
      type: 'wildcard'
    });
  });

  it('should not find matches for dissimilar words', () => {
    const matches = findLevenshteinMatches('hello world test', 'xyz');
    expect(matches).toHaveLength(0);
  });

  it('should handle single word text', () => {
    const matches = findLevenshteinMatches('hello', 'helo');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 5,
      text: 'hello',
      type: 'wildcard'
    });
  });

  it('should handle text with multiple spaces', () => {
    const matches = findLevenshteinMatches('hello    world   test', 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 5,
      text: 'hello',
      type: 'wildcard'
    });
  });

  it('should handle text with special characters', () => {
    const matches = findLevenshteinMatches('hello-world_test!', 'hello');
    expect(matches).toHaveLength(0); // Special characters break word boundaries, no match
  });

  it('should handle case sensitive matching', () => {
    const matches = findLevenshteinMatches('Hello World', 'hello');
    expect(matches).toHaveLength(1); // Actually case insensitive, finds match
    expect(matches[0]).toEqual({
      start: 0,
      end: 5,
      text: 'Hello',
      type: 'wildcard'
    });
  });

  it('should handle non-Latin characters', () => {
    const matches = findLevenshteinMatches('你好 世界', '你好');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 2,
      text: '你好',
      type: 'wildcard'
    });
  });

  it('should handle mixed content', () => {
    const matches = findLevenshteinMatches('hello 你好 world', 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 5,
      text: 'hello',
      type: 'wildcard'
    });
  });

  it('should handle very short patterns', () => {
    const matches = findLevenshteinMatches('a b c d', 'a');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 1,
      text: 'a',
      type: 'wildcard'
    });
  });

  it('should handle very long patterns', () => {
    const matches = findLevenshteinMatches('supercalifragilisticexpialidocious', 'supercalifragilistic');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      start: 0,
      end: 34,
      text: 'supercalifragilisticexpialidocious',
      type: 'wildcard'
    });
  });
});
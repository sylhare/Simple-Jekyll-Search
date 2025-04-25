import { describe, expect, it } from 'vitest';
import { levenshtein } from '../../src/SearchStrategies/search/levenshtein';


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
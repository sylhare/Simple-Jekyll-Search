import { wildcardSearch } from '../../src/utils/wildcardSearch';
import { describe, expect, it } from 'vitest';

describe('wildcardFuzzySearch', () => {
  it('should return true for exact matches', () => {
    expect(wildcardSearch('hello', 'hello')).toBe(true);
  });

  it('should return true for matches with wildcards', () => {
    expect(wildcardSearch('hello', 'he*o')).toBe(true);
    expect(wildcardSearch('hello', 'he*o*')).toBe(true);
    expect(wildcardSearch('test', 'te*t')).toBe(true);
    expect(wildcardSearch('text', 'te*t')).toBe(true);
  });

  it('should match multiple words with wildcards', () => {
    expect(wildcardSearch('hello amazing world', 'hello*world')).toBe(true);
    expect(wildcardSearch('hello world', 'hello*world')).toBe(true);
    expect(wildcardSearch('hello world', 'hello*')).toBe(true);
  });

  it('should return true for fuzzy matches with high similarity', () => {
    expect(wildcardSearch('hello', 'helo')).toBe(true); // 80% similarity
    expect(wildcardSearch('hello', 'hell')).toBe(true); // 80% similarity
  });

  it('should return false for matches below the similarity threshold', () => {
    expect(wildcardSearch('world', 'h*o')).toBe(false);
    expect(wildcardSearch('xyz', 'abc')).toBe(false);
  });

  it('should handle single-character patterns and texts', () => {
    expect(wildcardSearch('a', 'a')).toBe(true);
    expect(wildcardSearch('b', 'a')).toBe(false);
    expect(wildcardSearch('a', '*')).toBe(true);
  });
});
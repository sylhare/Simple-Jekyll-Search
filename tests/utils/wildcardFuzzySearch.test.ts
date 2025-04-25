import { wildcardFuzzySearch } from '../../src/utils/wildcardFuzzySearch';
import { describe, expect, it } from 'vitest';

describe('wildcardFuzzySearch', () => {
  it('should return true for exact matches', () => {
    expect(wildcardFuzzySearch('hello', 'hello')).toBe(true);
  });

  it('should return true for matches with wildcards', () => {
    expect(wildcardFuzzySearch('hello', 'he*o')).toBe(true);
    expect(wildcardFuzzySearch('hello', 'he*o*')).toBe(true);
    expect(wildcardFuzzySearch('test', 'te*t')).toBe(true);
    expect(wildcardFuzzySearch('text', 'te*t')).toBe(true);
  });

  it('should match multiple words with wildcards', () => {
    expect(wildcardFuzzySearch('hello amazing world', 'hello*world')).toBe(true);
    expect(wildcardFuzzySearch('hello world', 'hello*world')).toBe(true);
    expect(wildcardFuzzySearch('hello world', 'hello*')).toBe(true);
  });

  it('should return true for fuzzy matches with high similarity', () => {
    expect(wildcardFuzzySearch('hello', 'helo')).toBe(true); // 80% similarity
    expect(wildcardFuzzySearch('hello', 'hell')).toBe(true); // 80% similarity
  });

  it('should return false for matches below the similarity threshold', () => {
    expect(wildcardFuzzySearch('world', 'h*o')).toBe(false);
    expect(wildcardFuzzySearch('xyz', 'abc')).toBe(false);
  });

  it('should handle empty strings correctly', () => {
    expect(wildcardFuzzySearch('hello', '')).toBe(false);
    expect(wildcardFuzzySearch('', 'hello')).toBe(false);
    expect(wildcardFuzzySearch('', '')).toBe(false);
  });

  it('should handle single-character patterns and texts', () => {
    expect(wildcardFuzzySearch('a', 'a')).toBe(true);
    expect(wildcardFuzzySearch('b', 'a')).toBe(false);
    expect(wildcardFuzzySearch('a', '*')).toBe(true);
  });
});
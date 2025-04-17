import { wildcardFuzzySearch } from '../../src/utils/wildcardFuzzySearch';
import { describe, expect, it } from 'vitest';

describe('wildcardFuzzySearch', () => {
  it('should return true for exact matches', () => {
    expect(wildcardFuzzySearch('hello', 'hello')).toBe(true);
  });

  it('should return true for matches with wildcards', () => {
    expect(wildcardFuzzySearch('he*o', 'hello')).toBe(true);
    expect(wildcardFuzzySearch('he*o*', 'hello')).toBe(true);
    expect(wildcardFuzzySearch('te*t', 'test')).toBe(true);
    expect(wildcardFuzzySearch('te*t', 'text')).toBe(true);
  });

  it('should return true for fuzzy matches with high similarity', () => {
    expect(wildcardFuzzySearch('helo', 'hello')).toBe(true); // 80% similarity
    expect(wildcardFuzzySearch('hell', 'hello')).toBe(true); // 80% similarity
  });

  it('should return false for matches below the similarity threshold', () => {
    expect(wildcardFuzzySearch('h*o', 'world')).toBe(false);
    expect(wildcardFuzzySearch('abc', 'xyz')).toBe(false);
  });

  it('should handle empty strings correctly', () => {
    expect(wildcardFuzzySearch('', 'hello')).toBe(false);
    expect(wildcardFuzzySearch('hello', '')).toBe(false);
    expect(wildcardFuzzySearch('', '')).toBe(false);
  });

  it('should handle single-character patterns and texts', () => {
    expect(wildcardFuzzySearch('a', 'a')).toBe(true);
    expect(wildcardFuzzySearch('a', 'b')).toBe(false);
    expect(wildcardFuzzySearch('*', 'a')).toBe(true);
  });
});
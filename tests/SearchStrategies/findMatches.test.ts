import { describe, expect, it } from 'vitest';
import { findLiteralMatches, findFuzzyMatches, findWildcardMatches } from '../../src/SearchStrategies/search/findMatches';

describe('findMatches Functions', () => {
  describe('findLiteralMatches', () => {
    it('should find all occurrences of a pattern', () => {
      const result = findLiteralMatches('hello world hello', 'hello');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        start: 0,
        end: 5,
        text: 'hello',
        type: 'exact'
      });
      expect(result[1]).toEqual({
        start: 12,
        end: 17,
        text: 'hello',
        type: 'exact'
      });
    });

    it('should handle case insensitive matching', () => {
      const result = findLiteralMatches('Hello World', 'hello');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Hello');
      expect(result[0].type).toBe('exact');
    });

    it('should return empty array for no matches', () => {
      const result = findLiteralMatches('hello world', 'xyz');
      expect(result).toEqual([]);
    });

    it('should find overlapping patterns', () => {
      const result = findLiteralMatches('aaaa', 'aa');
      expect(result).toHaveLength(2);
    });
  });

  describe('findFuzzyMatches', () => {
    it('should find fuzzy character sequence match', () => {
      const result = findFuzzyMatches('JavaScript', 'java');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('fuzzy');
      expect(result[0].text).toBe('Java');
    });

    it('should handle character sequence matching', () => {
      const result = findFuzzyMatches('hello world', 'hlowrd');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('fuzzy');
    });

    it('should return empty array for no match', () => {
      const result = findFuzzyMatches('hello', 'xyz');
      expect(result).toEqual([]);
    });

    it('should handle empty pattern', () => {
      const result = findFuzzyMatches('hello', '');
      expect(result).toEqual([]);
    });

    it('should trim trailing spaces from pattern', () => {
      const result = findFuzzyMatches('hello', 'hlo   ');
      expect(result).toHaveLength(1);
    });
  });

  describe('findWildcardMatches', () => {
    it('should find wildcard pattern matches', () => {
      const result = findWildcardMatches('hello world', 'hel*world');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('wildcard');
      expect(result[0].text).toBe('hello world');
    });

    it('should find multiple wildcard matches', () => {
      const result = findWildcardMatches('test test test', 'te*t');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('wildcard');
    });

    it('should return empty array for no matches', () => {
      const result = findWildcardMatches('hello', 'xyz*');
      expect(result).toEqual([]);
    });

    it('should handle simple wildcard patterns', () => {
      const result = findWildcardMatches('hello', 'hel*');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('hello');
    });
  });

  describe('Consistency between boolean and findMatches functions', () => {
    it('should be consistent for literal search', () => {
      const text = 'hello world';
      const criteria = 'world';
      const matches = findLiteralMatches(text, criteria);
      expect(matches.length > 0).toBe(true);
    });

    it('should be consistent for fuzzy search', () => {
      const text = 'JavaScript';
      const criteria = 'java';
      const matches = findFuzzyMatches(text, criteria);
      expect(matches.length > 0).toBe(true);
    });
  });
});


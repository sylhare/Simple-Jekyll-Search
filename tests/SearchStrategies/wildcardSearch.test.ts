import { describe, expect, it } from 'vitest';
import { findWildcardMatches } from '../../src/SearchStrategies/search/wildcardSearch';

describe('findWildcardMatches', () => {
  it('should find exact matches', () => {
    const matches = findWildcardMatches('hello', 'hello');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].type).toBe('wildcard');
  });

  it('should find matches with wildcards', () => {
    const matches1 = findWildcardMatches('hello', 'he*o');
    expect(matches1.length).toBeGreaterThan(0);
    expect(matches1[0].type).toBe('wildcard');
    
    const matches2 = findWildcardMatches('hello', 'he*o*');
    expect(matches2.length).toBeGreaterThan(0);
    expect(matches2[0].type).toBe('wildcard');
    
    const matches3 = findWildcardMatches('test', 'te*t');
    expect(matches3.length).toBeGreaterThan(0);
    expect(matches3[0].type).toBe('wildcard');
    
    const matches4 = findWildcardMatches('text', 'te*t');
    expect(matches4.length).toBeGreaterThan(0);
    expect(matches4[0].type).toBe('wildcard');
  });

  it('should match multiple words with wildcards', () => {
    const matches1 = findWildcardMatches('hello amazing world', 'hello*world');
    expect(matches1.length).toBeGreaterThan(0);
    expect(matches1[0].type).toBe('wildcard');
    
    const matches2 = findWildcardMatches('hello world', 'hello*world');
    expect(matches2.length).toBeGreaterThan(0);
    expect(matches2[0].type).toBe('wildcard');
    
    const matches3 = findWildcardMatches('hello world', 'hello*');
    expect(matches3.length).toBeGreaterThan(0);
    expect(matches3[0].type).toBe('wildcard');
  });

  it('should find fuzzy matches with high similarity', () => {
    const matches1 = findWildcardMatches('hello', 'helo'); // 80% similarity
    expect(matches1.length).toBeGreaterThan(0);
    expect(matches1[0].type).toBe('wildcard'); // Levenshtein fallback
    
    const matches2 = findWildcardMatches('hello', 'hell'); // 80% similarity
    expect(matches2.length).toBeGreaterThan(0);
    expect(matches2[0].type).toBe('wildcard'); // Levenshtein fallback
  });

  it('should return empty array for matches below the similarity threshold', () => {
    const matches1 = findWildcardMatches('world', 'h*o');
    expect(matches1.length).toBe(0);
    
    const matches2 = findWildcardMatches('xyz', 'abc');
    expect(matches2.length).toBe(0);
  });

  it('should handle single-character patterns and texts', () => {
    const matches1 = findWildcardMatches('a', 'a');
    expect(matches1.length).toBeGreaterThan(0);
    expect(matches1[0].type).toBe('wildcard');
    
    const matches2 = findWildcardMatches('b', 'a');
    expect(matches2.length).toBe(0);
    
    const matches3 = findWildcardMatches('a', '*');
    expect(matches3.length).toBeGreaterThan(0);
    expect(matches3[0].type).toBe('wildcard');
  });

  it('should return empty array for a word not present in the text', () => {
    const matches1 = findWildcardMatches('hello world', 'missing');
    expect(matches1.length).toBe(0);
    
    const matches2 = findWildcardMatches('hello world', 'miss*');
    expect(matches2.length).toBe(0);
  });

});
import { describe, expect, it } from 'vitest';
import FuzzySearchStrategy from '../../src/SearchStrategies/FuzzySearchStrategy';

describe('FuzzySearchStrategy', () => {
  it('does not match words that don\'t contain the search criteria', () => {
    expect(FuzzySearchStrategy.matches('fuzzy', 'fzyyy')).toBe(false);
    expect(FuzzySearchStrategy.matches('react', 'angular')).toBe(false);
    expect(FuzzySearchStrategy.matches('what the heck', 'wth?')).toBe(false);
  });

  it('matches words containing the search criteria', () => {
    expect(FuzzySearchStrategy.matches('fuzzy', 'fzy')).toBe(true);
    expect(FuzzySearchStrategy.matches('react', 'rct')).toBe(true);
    expect(FuzzySearchStrategy.matches('what the heck', 'wth')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(FuzzySearchStrategy.matches('Different Cases', 'dc')).toBe(true);
    expect(FuzzySearchStrategy.matches('UPPERCASE', 'upprcs')).toBe(true);
    expect(FuzzySearchStrategy.matches('lowercase', 'lc')).toBe(true);
    expect(FuzzySearchStrategy.matches('DiFfErENt cASeS', 'dc')).toBe(true);
  });

  it('handles empty strings correctly', () => {
    expect(FuzzySearchStrategy.matches('', '')).toBe(true);
    expect(FuzzySearchStrategy.matches('text', '')).toBe(true);
    expect(FuzzySearchStrategy.matches('', 'pattern')).toBe(false);
  });

  it('handles null values', () => {
    expect(FuzzySearchStrategy.matches(null, 'test')).toBe(false);
  });

  it('matches characters in sequence', () => {
    expect(FuzzySearchStrategy.matches('hello world', 'hlo wld')).toBe(true);
    expect(FuzzySearchStrategy.matches('hello world', 'hw')).toBe(true);
    expect(FuzzySearchStrategy.matches('hello world', 'hlowrd')).toBe(true);
    expect(FuzzySearchStrategy.matches('hello world', 'wrld')).toBe(true);
    expect(FuzzySearchStrategy.matches('hello world', 'wh')).toBe(false);
  });

  it('does not match when character frequency in the pattern exceeds the text', () => {
    expect(FuzzySearchStrategy.matches('goggles', 'gggggggg')).toBe(false);
    expect(FuzzySearchStrategy.matches('aab', 'aaaa')).toBe(false);
  });

  it('match ordered multiple words', () => {
    expect(FuzzySearchStrategy.matches('Ola que tal', 'ola tal')).toBe(true);
  });
}); 
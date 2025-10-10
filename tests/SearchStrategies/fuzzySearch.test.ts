import { describe, expect, it } from 'vitest';
import { findFuzzyMatches } from '../../src/SearchStrategies/search/fuzzySearch';

describe('findFuzzyMatches', () => {
  it('matches exact strings', () => {
    const matches1 = findFuzzyMatches('hello', 'hello');
    expect(matches1.length).toBeGreaterThan(0);
    expect(matches1[0].type).toBe('exact');
    
    const matches2 = findFuzzyMatches('test', 'test');
    expect(matches2.length).toBeGreaterThan(0);
    expect(matches2[0].type).toBe('exact');
  });

  it('matches substrings', () => {
    expect(findFuzzyMatches('hello', 'hlo').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('test', 'tst').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('fuzzy', 'fzy').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('react', 'rct').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('what the heck', 'wth').length).toBeGreaterThan(0);
  });

  it('matches characters in sequence', () => {
    expect(findFuzzyMatches('hello world', 'hw').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('a1b2c3', 'abc').length).toBeGreaterThan(0);
  });

  it('does not match out-of-sequence characters', () => {
    expect(findFuzzyMatches('abc', 'cba').length).toBe(0);
    expect(findFuzzyMatches('abcd', 'dc').length).toBe(0);
  });

  it('does not match words that don\'t contain the search criteria', () => {
    expect(findFuzzyMatches('fuzzy', 'fzyyy').length).toBe(0);
    expect(findFuzzyMatches('react', 'angular').length).toBe(0);
    expect(findFuzzyMatches('what the heck', 'wth?').length).toBe(0);
  });

  it('is case insensitive', () => {
    expect(findFuzzyMatches('HELLO', 'hello').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('world', 'WORLD').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('hEllO', 'HeLLo').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('Different Cases', 'dc').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('UPPERCASE', 'upprcs').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('lowercase', 'lc').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('DiFfErENt cASeS', 'dc').length).toBeGreaterThan(0);
  });

  it('handles special characters', () => {
    expect(findFuzzyMatches('hello!@#$', 'h!@#$').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('abc123xyz', '123').length).toBeGreaterThan(0);
  });

  it('handles spaces correctly', () => {
    expect(findFuzzyMatches('hello world', 'hw').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('hello world', 'h w').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('hello world', 'hw ').length).toBeGreaterThan(0);
  });

  it('matches characters in sequence', () => {
    expect(findFuzzyMatches('hello world', 'hlo wld').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('hello world', 'hw').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('hello world', 'hlowrd').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('hello world', 'wrld').length).toBeGreaterThan(0);
    expect(findFuzzyMatches('hello world', 'wh').length).toBe(0);
  });

  it('does not match when character frequency in the pattern exceeds the text', () => {
    expect(findFuzzyMatches('goggles', 'gggggggg').length).toBe(0);
    expect(findFuzzyMatches('aab', 'aaaa').length).toBe(0);
  });

  it('match ordered multiple words', () => {
    expect(findFuzzyMatches('Ola que tal', 'ola tal').length).toBeGreaterThan(0);
  });

  describe('original fuzzysearch test cases', () => {
    it('matches cartwheel test cases', () => {
      expect(findFuzzyMatches('cartwheel', 'car').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('cartwheel', 'cwhl').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('cartwheel', 'cwheel').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('cartwheel', 'cartwheel').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('cartwheel', 'cwheeel').length).toBe(0);
      expect(findFuzzyMatches('cartwheel', 'lw').length).toBe(0);
    });

    it('matches Chinese Unicode test cases', () => {
      expect(findFuzzyMatches('php语言', '语言').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('php语言', 'hp语').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('Python开发者', 'Py开发').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('Python开发者', 'Py 开发').length).toBe(0);
      expect(findFuzzyMatches('爪哇开发进阶', '爪哇进阶').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('非常简单的格式化工具', '格式工具').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('学习正则表达式怎么学习', '正则').length).toBeGreaterThan(0);
      expect(findFuzzyMatches('正则表达式怎么学习', '学习正则').length).toBe(0);
    });
  });
}); 
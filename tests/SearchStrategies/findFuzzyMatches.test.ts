import { describe, expect, it } from 'vitest';
import { findFuzzyMatches } from '../../src/SearchStrategies/search/findFuzzyMatches';

describe('findFuzzyMatches', () => {
  it('matches exact strings', () => {
    const matches1 = findFuzzyMatches('hello', 'hello');
    expect(matches1).toHaveLength(1);
    expect(matches1[0].type).toBe('fuzzy');
    
    const matches2 = findFuzzyMatches('test', 'test');
    expect(matches2).toHaveLength(1);
    expect(matches2[0].type).toBe('fuzzy');
  });

  it('matches substrings', () => {
    expect(findFuzzyMatches('hello', 'hlo')).toHaveLength(1);
    expect(findFuzzyMatches('test', 'tst')).toHaveLength(1);
    expect(findFuzzyMatches('fuzzy', 'fzy')).toHaveLength(1);
    expect(findFuzzyMatches('react', 'rct')).toHaveLength(1);
    expect(findFuzzyMatches('what the heck', 'wth')).toHaveLength(1);
  });

  it('matches characters in sequence', () => {
    expect(findFuzzyMatches('hello world', 'hw')).toHaveLength(1);
    expect(findFuzzyMatches('a1b2c3', 'abc')).toHaveLength(1);
  });

  it('does not match out-of-sequence characters', () => {
    expect(findFuzzyMatches('abc', 'cba')).toEqual([]);
    expect(findFuzzyMatches('abcd', 'dc')).toEqual([]);
  });

  it('does not match words that don\'t contain the search criteria', () => {
    expect(findFuzzyMatches('fuzzy', 'fzyyy')).toEqual([]);
    expect(findFuzzyMatches('react', 'angular')).toEqual([]);
    expect(findFuzzyMatches('what the heck', 'wth?')).toEqual([]);
  });

  it('is case insensitive', () => {
    expect(findFuzzyMatches('HELLO', 'hello')).toHaveLength(1);
    expect(findFuzzyMatches('world', 'WORLD')).toHaveLength(1);
    expect(findFuzzyMatches('hEllO', 'HeLLo')).toHaveLength(1);
    expect(findFuzzyMatches('Different Cases', 'dc')).toHaveLength(1);
    expect(findFuzzyMatches('UPPERCASE', 'upprcs')).toHaveLength(1);
    expect(findFuzzyMatches('lowercase', 'lc')).toHaveLength(1);
    expect(findFuzzyMatches('DiFfErENt cASeS', 'dc')).toHaveLength(1);
  });

  it('handles special characters', () => {
    expect(findFuzzyMatches('hello!@#$', 'h!@#$')).toHaveLength(1);
    expect(findFuzzyMatches('abc123xyz', '123')).toHaveLength(1);
  });

  it('handles spaces correctly', () => {
    expect(findFuzzyMatches('hello world', 'hw')).toHaveLength(1);
    expect(findFuzzyMatches('hello world', 'h w')).toHaveLength(1);
    expect(findFuzzyMatches('hello world', 'hw ')).toHaveLength(1);
  });

  it('matches characters in sequence', () => {
    expect(findFuzzyMatches('hello world', 'hlo wld')).toHaveLength(1);
    expect(findFuzzyMatches('hello world', 'hw')).toHaveLength(1);
    expect(findFuzzyMatches('hello world', 'hlowrd')).toHaveLength(1);
    expect(findFuzzyMatches('hello world', 'wrld')).toHaveLength(1);
    expect(findFuzzyMatches('hello world', 'wh')).toEqual([]);
  });

  it('does not match when character frequency in the pattern exceeds the text', () => {
    expect(findFuzzyMatches('goggles', 'gggggggg')).toEqual([]);
    expect(findFuzzyMatches('aab', 'aaaa')).toEqual([]);
  });

  it('match ordered multiple words', () => {
    expect(findFuzzyMatches('Ola que tal', 'ola tal')).toHaveLength(1);
  });

  describe('original fuzzysearch test cases', () => {
    it('matches cartwheel test cases', () => {
      expect(findFuzzyMatches('cartwheel', 'car')).toHaveLength(1);
      expect(findFuzzyMatches('cartwheel', 'cwhl')).toHaveLength(1);
      expect(findFuzzyMatches('cartwheel', 'cwheel')).toHaveLength(1);
      expect(findFuzzyMatches('cartwheel', 'cartwheel')).toHaveLength(1);
      expect(findFuzzyMatches('cartwheel', 'cwheeel')).toEqual([]);
      expect(findFuzzyMatches('cartwheel', 'lw')).toEqual([]);
    });

    it('matches Chinese Unicode test cases', () => {
      expect(findFuzzyMatches('php语言', '语言')).toHaveLength(1);
      expect(findFuzzyMatches('php语言', 'hp语')).toHaveLength(1);
      expect(findFuzzyMatches('Python开发者', 'Py开发')).toHaveLength(1);
      expect(findFuzzyMatches('Python开发者', 'Py 开发')).toEqual([]);
      expect(findFuzzyMatches('爪哇开发进阶', '爪哇进阶')).toHaveLength(1);
      expect(findFuzzyMatches('非常简单的格式化工具', '格式工具')).toHaveLength(1);
      expect(findFuzzyMatches('学习正则表达式怎么学习', '正则')).toHaveLength(1);
      expect(findFuzzyMatches('正则表达式怎么学习', '学习正则')).toEqual([]);
    });
  });
});


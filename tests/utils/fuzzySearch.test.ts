import { describe, it, expect } from 'vitest';
import { fuzzySearch } from '../../src/utils/fuzzySearch';

describe('fuzzySearch', () => {
  it('matches exact strings', () => {
    expect(fuzzySearch('hello', 'hello')).toBe(true);
    expect(fuzzySearch('test', 'test')).toBe(true);
  });

  it('matches substrings', () => {
    expect(fuzzySearch('hlo', 'hello')).toBe(true);
    expect(fuzzySearch('tst', 'test')).toBe(true);
  });

  it('matches characters in sequence', () => {
    expect(fuzzySearch('hw', 'hello world')).toBe(true);
    expect(fuzzySearch('abc', 'a1b2c3')).toBe(true);
  });

  it('does not match out-of-sequence characters', () => {
    expect(fuzzySearch('cba', 'abc')).toBe(false);
    expect(fuzzySearch('dc', 'abcd')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(fuzzySearch('hello', 'HELLO')).toBe(true);
    expect(fuzzySearch('WORLD', 'world')).toBe(true);
    expect(fuzzySearch('HeLLo', 'hEllO')).toBe(true);
  });

  it('handles empty strings', () => {
    expect(fuzzySearch('', '')).toBe(true);
    expect(fuzzySearch('', 'text')).toBe(true);
    expect(fuzzySearch('pattern', '')).toBe(false);
  });

  it('handles special characters', () => {
    expect(fuzzySearch('h!@#$', 'hello!@#$')).toBe(true);
    expect(fuzzySearch('123', 'abc123xyz')).toBe(true);
  });

  it('handles spaces correctly', () => {
    expect(fuzzySearch('hw', 'hello world')).toBe(true);
    expect(fuzzySearch('h w', 'hello world')).toBe(true);
    expect(fuzzySearch('hw ', 'hello world')).toBe(true);
  });

  describe('original fuzzysearch test cases', () => {
    it('matches cartwheel test cases', () => {
      expect(fuzzySearch('car', 'cartwheel')).toBe(true);
      expect(fuzzySearch('cwhl', 'cartwheel')).toBe(true);
      expect(fuzzySearch('cwheel', 'cartwheel')).toBe(true);
      expect(fuzzySearch('cartwheel', 'cartwheel')).toBe(true);
      expect(fuzzySearch('cwheeel', 'cartwheel')).toBe(false);
      expect(fuzzySearch('lw', 'cartwheel')).toBe(false);
    });

    it('matches Chinese Unicode test cases', () => {
      expect(fuzzySearch('语言', 'php语言')).toBe(true);
      expect(fuzzySearch('hp语', 'php语言')).toBe(true);
      expect(fuzzySearch('Py开发', 'Python开发者')).toBe(true);
      expect(fuzzySearch('Py 开发', 'Python开发者')).toBe(false);
      expect(fuzzySearch('爪哇进阶', '爪哇开发进阶')).toBe(true);
      expect(fuzzySearch('格式工具', '非常简单的格式化工具')).toBe(true);
      expect(fuzzySearch('正则', '学习正则表达式怎么学习')).toBe(true);
      expect(fuzzySearch('学习正则', '正则表达式怎么学习')).toBe(false);
    });
  });
}); 
import { describe, it, expect } from 'vitest';
import { fuzzySearch } from '../../src/utils/fuzzySearch';

describe('fuzzySearch', () => {
  it('matches exact strings', () => {
    expect(fuzzySearch('hello', 'hello')).toBe(true);
    expect(fuzzySearch('test', 'test')).toBe(true);
  });

  it('matches substrings', () => {
    expect(fuzzySearch('hello', 'hlo')).toBe(true);
    expect(fuzzySearch('test', 'tst')).toBe(true);
  });

  it('matches characters in sequence', () => {
    expect(fuzzySearch('hello world', 'hw')).toBe(true);
    expect(fuzzySearch('a1b2c3', 'abc')).toBe(true);
  });

  it('does not match out-of-sequence characters', () => {
    expect(fuzzySearch('abc', 'cba')).toBe(false);
    expect(fuzzySearch('abcd', 'dc')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(fuzzySearch('HELLO', 'hello')).toBe(true);
    expect(fuzzySearch('world', 'WORLD')).toBe(true);
    expect(fuzzySearch('hEllO', 'HeLLo')).toBe(true);
  });

  it('handles empty strings', () => {
    expect(fuzzySearch('', '')).toBe(true);
    expect(fuzzySearch('text', '')).toBe(true);
    expect(fuzzySearch('', 'pattern')).toBe(false);
  });

  it('handles special characters', () => {
    expect(fuzzySearch('hello!@#$', 'h!@#$')).toBe(true);
    expect(fuzzySearch('abc123xyz', '123')).toBe(true);
  });

  it('handles spaces correctly', () => {
    expect(fuzzySearch('hello world', 'hw')).toBe(true);
    expect(fuzzySearch('hello world', 'h w')).toBe(true);
    expect(fuzzySearch('hello world', 'hw ')).toBe(true);
  });

  describe('original fuzzysearch test cases', () => {
    it('matches cartwheel test cases', () => {
      expect(fuzzySearch('cartwheel', 'car')).toBe(true);
      expect(fuzzySearch('cartwheel', 'cwhl')).toBe(true);
      expect(fuzzySearch('cartwheel', 'cwheel')).toBe(true);
      expect(fuzzySearch('cartwheel', 'cartwheel')).toBe(true);
      expect(fuzzySearch('cartwheel', 'cwheeel')).toBe(false);
      expect(fuzzySearch('cartwheel', 'lw')).toBe(false);
    });

    it('matches Chinese Unicode test cases', () => {
      expect(fuzzySearch('php语言', '语言')).toBe(true);
      expect(fuzzySearch('php语言', 'hp语')).toBe(true);
      expect(fuzzySearch('Python开发者', 'Py开发')).toBe(true);
      expect(fuzzySearch('Python开发者', 'Py 开发')).toBe(false);
      expect(fuzzySearch('爪哇开发进阶', '爪哇进阶')).toBe(true);
      expect(fuzzySearch('非常简单的格式化工具', '格式工具')).toBe(true);
      expect(fuzzySearch('学习正则表达式怎么学习', '正则')).toBe(true);
      expect(fuzzySearch('正则表达式怎么学习', '学习正则')).toBe(false);
    });
  });
}); 
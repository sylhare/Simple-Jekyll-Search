import { describe, expect, it } from 'vitest';
import { isJSON, isObject, memoizeLast, NoSort } from '../src/utils';

describe('utils', () => {

  describe('isJSON', () => {
    it('returns true for plain objects', () => {
      expect(isJSON({ foo: 'bar' })).toBe(true);
      expect(isJSON({})).toBe(true);
      expect(isJSON({ nested: { key: 'value' } })).toBe(true);
    });

    it('returns true for arrays', () => {
      expect(isJSON([])).toBe(true);
      expect(isJSON([1, 2, 3])).toBe(true);
      expect(isJSON([{ foo: 'bar' }])).toBe(true);
    });

    it('returns false for null', () => {
      expect(isJSON(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isJSON(undefined)).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isJSON(42)).toBe(false);
      expect(isJSON(0)).toBe(false);
      expect(isJSON('string')).toBe(false);
      expect(isJSON('')).toBe(false);
      expect(isJSON(true)).toBe(false);
      expect(isJSON(false)).toBe(false);
    });

    it('returns true for Date objects', () => {
      expect(isJSON(new Date())).toBe(true);
    });

    it('returns true for RegExp objects', () => {
      expect(isJSON(/regex/)).toBe(true);
    });

    it('returns false for functions', () => {
      expect(isJSON(() => {})).toBe(false);
      expect(isJSON(function() {})).toBe(false);
    });
  });

  describe('NoSort', () => {
    it('always returns 0', () => {
      expect(NoSort()).toBe(0);
    });
  });

  describe('isObject', () => {
    it('returns true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('returns false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('returns false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('returns false for primitive types', () => {
      expect(isObject(42)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  describe('memoizeLast', () => {
    it('computes on the first call', () => {
      let calls = 0;
      const upper = memoizeLast((s: string) => { calls++; return s.toUpperCase(); });

      expect(upper('a')).toBe('A');
      expect(calls).toBe(1);
    });

    it('reuses the cached result for a repeated key', () => {
      let calls = 0;
      const upper = memoizeLast((s: string) => { calls++; return s.toUpperCase(); });

      upper('a');
      upper('a');
      upper('a');

      expect(calls).toBe(1);
    });

    it('recomputes when the key changes', () => {
      let calls = 0;
      const upper = memoizeLast((s: string) => { calls++; return s.toUpperCase(); });

      expect(upper('a')).toBe('A');
      expect(upper('b')).toBe('B');
      expect(calls).toBe(2);
    });

    it('only caches the last key, not every seen key', () => {
      let calls = 0;
      const upper = memoizeLast((s: string) => { calls++; return s.toUpperCase(); });

      upper('a');
      upper('b');
      upper('a');

      expect(calls).toBe(3);
    });

    it('caches the first call even when the key is an empty string', () => {
      let calls = 0;
      const identity = memoizeLast((s: string) => { calls++; return s; });

      expect(identity('')).toBe('');
      expect(identity('')).toBe('');
      expect(calls).toBe(1);
    });

    it('derives the cache key from multiple arguments via keyOf', () => {
      let calls = 0;
      const add = memoizeLast(
        (a: number, b: number) => { calls++; return a + b; },
        (a, b) => `${a},${b}`,
      );

      expect(add(1, 2)).toBe(3);
      expect(add(1, 2)).toBe(3);
      expect(calls).toBe(1);

      expect(add(1, 3)).toBe(4);
      expect(calls).toBe(2);
    });
  });
});
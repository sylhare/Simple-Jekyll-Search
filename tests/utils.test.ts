import { describe, expect, it } from 'vitest';
import { isJSON, isObject, merge, NoSort } from '../src/utils';

describe('utils', () => {

  describe('merge', () => {
    it('merges objects', () => {
      const defaultOptions = { foo: '', bar: '' };
      const options = { bar: 'overwritten' };
      const mergedOptions = merge(defaultOptions, options);

      expect(mergedOptions.foo).toBe(defaultOptions.foo);
      expect(mergedOptions.bar).toBe(options.bar);
    });

    it('merges objects with overlapping keys', () => {
      const defaultOptions = { foo: 'default', bar: 'default' };
      const options = { bar: 'custom' };
      const mergedOptions = merge(defaultOptions, options);

      expect(mergedOptions).toEqual({ foo: 'default', bar: 'custom' });
    });

    it('merges when the second object is empty', () => {
      const defaultOptions = { foo: 'default', bar: 'default' };
      const options = {};
      const mergedOptions = merge(defaultOptions, options);

      expect(mergedOptions).toEqual(defaultOptions);
    });

    it('merges nested objects', () => {
      const defaultOptions = { foo: { nested: 'default' }, bar: 'default' };
      const options = { foo: { nested: 'custom' } };
      const mergedOptions = merge(defaultOptions, options);

      expect(mergedOptions).toEqual({ foo: { nested: 'custom' }, bar: 'default' });
    });

    it('does not mutate the original objects', () => {
      const defaultOptions = { foo: 'default', bar: 'default' };
      const options = { bar: 'custom' };
      const defaultOptionsCopy = { ...defaultOptions };
      const optionsCopy = { ...options };

      merge(defaultOptions, options);

      expect(defaultOptions).toEqual(defaultOptionsCopy);
      expect(options).toEqual(optionsCopy);
    });
  });

  describe('isJSON', () => {
    it('returns true if is JSON object', () => {
      expect(isJSON({ foo: 'bar' })).toBe(true);
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
});
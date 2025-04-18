import { describe, it, expect } from 'vitest';
import { merge, isJSON } from '../src/utils';

describe('utils', () => {
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

  it('returns true if is JSON object', () => {
    expect(isJSON({ foo: 'bar' })).toBe(true);
  });
});
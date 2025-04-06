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

  it('returns true if is JSON object', () => {
    expect(isJSON({ foo: 'bar' })).toBe(true);
  });
});
import test from 'ava';
import { merge, isJSON } from '../src/utils';

test('merges objects', t => {
  const defaultOptions = { foo: '', bar: '' };
  const options = { bar: 'overwritten' };
  const mergedOptions = merge(defaultOptions, options);

  t.deepEqual(mergedOptions.foo, defaultOptions.foo);
  t.deepEqual(mergedOptions.bar, options.bar);
});

test('returns true if is JSON object', t => {
  t.true(isJSON({ foo: 'bar' }));
}); 
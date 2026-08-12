import { RepositoryData } from './utils/types';

export { RelevanceSort } from './utils/RelevanceSort';

export function merge<T>(target: T, source: Partial<T>): T {
  return { ...target, ...source } as T;
}

export function isJSON(json: any): boolean {
  return Array.isArray(json) || (json !== null && typeof json === 'object');
}

export function NoSort(): number {
  return 0;
}

export function isObject(obj: any): obj is RepositoryData {
  return Boolean(obj) && Object.prototype.toString.call(obj) === '[object Object]';
}

/** Memoizes the last result of `compute`, recomputing only when the key (the first argument, or `keyOf`) changes. */
export function memoizeLast<A extends any[], V>(
  compute: (...args: A) => V,
  keyOf: (...args: A) => string = (...args) => String(args[0]),
): (...args: A) => V {
  let cachedKey: string | undefined;
  let cachedValue: V;
  let hasValue = false;
  return (...args: A): V => {
    const key = keyOf(...args);
    if (!hasValue || key !== cachedKey) {
      cachedKey = key;
      cachedValue = compute(...args);
      hasValue = true;
    }
    return cachedValue;
  };
}
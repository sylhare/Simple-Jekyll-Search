import { RepositoryData } from './utils/types';

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

export function clone<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(item => clone(item)) as unknown as T;
  }

  const output: Record<string, any> = {};
  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      output[key] = clone((input as Record<string, any>)[key]);
    }
  }

  return output as T;
}
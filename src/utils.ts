export function merge<T>(target: T, source: Partial<T>): T {
  return { ...target, ...source } as T;
}

export function isJSON(json: any): boolean {
  try {
    return !!(json instanceof Object && JSON.parse(JSON.stringify(json)));

  } catch (_err) {
    return false;
  }
} 
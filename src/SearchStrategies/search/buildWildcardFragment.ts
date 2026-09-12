import { WildcardConfig } from '../types';

/**
 * Builds the regex fragment a `*` wildcard expands to. `maxSpaces` bounds how many
 * spaces one `*` may span (0 stops at the first space, Infinity spans any number of words).
 */
export function buildWildcardFragment(config: WildcardConfig): string {
  const maxSpaces = normalizeMaxSpaces(config.maxSpaces);
  if (maxSpaces === 0) {
    return '[^ ]*';
  }

  if (maxSpaces === Infinity) {
    return '[^ ]*(?: [^ ]*)*';
  }

  return `[^ ]*(?: [^ ]*){0,${maxSpaces}}`;
}

function normalizeMaxSpaces(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return Infinity;
  }

  return Math.floor(value);
}

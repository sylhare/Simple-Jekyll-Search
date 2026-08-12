import { MatchInfo } from '../types';

/**
 * Unused — not wired into any strategy (tree-shaken from the bundle); a rejected
 * alternative to {@link findFuzzyMatches}. See `tests/performance/README.md`.
 */
export function findRegexFuzzyMatches(text: string, criteria: string): MatchInfo[] {
  const trimmed = criteria.trimEnd();
  if (trimmed.length === 0) {
    return [];
  }

  const pattern = [...trimmed]
    .map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*?');
  const match = new RegExp(pattern, 'i').exec(text);
  if (match === null) {
    return [];
  }

  return [{ start: match.index, end: match.index + match[0].length, text: match[0], type: 'fuzzy' }];
}

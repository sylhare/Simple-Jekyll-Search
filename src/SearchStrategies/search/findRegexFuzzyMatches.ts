import { MatchInfo } from '../types';

/**
 * UNUSED / REJECTED — kept for benchmarking only.
 *
 * Not wired into any strategy or the public entry, so it is tree-shaken out of the
 * bundle. Matches a fuzzy token by joining the escaped query characters with a lazy
 * `.*?` and running a single regex. Rejected because that lazy quantifier chain
 * backtracks catastrophically on long queries against non-matching text; see the
 * `regex-fuzzy` row in `tests/performance/strategy.bench.ts`. {@link findFuzzyMatches}
 * does the same subsequence match with a linear single pass and is used instead.
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

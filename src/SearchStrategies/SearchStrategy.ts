import { findLiteralMatches } from './search/findLiteralMatches';
import { findFuzzyMatches } from './search/findFuzzyMatches';
import { SearchStrategy } from './types';

/**
 * Unused at runtime — the 'literal' and 'fuzzy' strategy types are backed by
 * configured UnifiedSearchStrategy instances (see StrategyFactory). Kept as
 * single-purpose baselines for tests/benchmark; tree-shaken from the bundle.
 * See `tests/performance/README.md`.
 */
export const LiteralSearchStrategy = new SearchStrategy(
  findLiteralMatches
);

export const FuzzySearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    const fuzzyMatches = findFuzzyMatches(text, criteria);
    if (fuzzyMatches.length > 0) {
      return fuzzyMatches;
    }
    return findLiteralMatches(text, criteria);
  }
);

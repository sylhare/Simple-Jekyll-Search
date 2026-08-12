import { findLiteralMatches } from './search/findLiteralMatches';
import { findFuzzyMatches } from './search/findFuzzyMatches';
import { findWildcardMatches } from './search/findWildcardMatches';
import { SearchStrategy, WildcardConfig } from './types';

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

/**
 * UNUSED at runtime — the `'wildcard'` strategy is now served by
 * {@link UnifiedSearchStrategy} via {@link StrategyFactory}, so this class is not
 * reachable from the public entry and is tree-shaken out of the bundle. Kept as the
 * previous wildcard-engine baseline in `tests/performance/strategy.bench.ts`.
 */
export class WildcardSearchStrategy extends SearchStrategy {
  constructor(config: WildcardConfig = {}) {
    const normalizedConfig = { ...config };
    super((text: string, criteria: string) => {
      const wildcardMatches = findWildcardMatches(text, criteria, normalizedConfig);
      if (wildcardMatches.length > 0) {
        return wildcardMatches;
      }
      return findLiteralMatches(text, criteria);
    });
  }
}

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

export class WildcardSearchStrategy extends SearchStrategy {
  private readonly config: Readonly<WildcardConfig>;

  constructor(config: WildcardConfig = {}) {
    const normalizedConfig = { ...config };
    super((text: string, criteria: string) => {
      const wildcardMatches = findWildcardMatches(text, criteria, normalizedConfig);
      if (wildcardMatches.length > 0) {
        return wildcardMatches;
      }
      return findLiteralMatches(text, criteria);
    });
    this.config = normalizedConfig;
  }

  getConfig(): Readonly<WildcardConfig> {
    return { ...this.config };
  }
}

export const DefaultWildcardSearchStrategy = new WildcardSearchStrategy();
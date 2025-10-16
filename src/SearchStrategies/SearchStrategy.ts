import { findLiteralMatches } from './search/findLiteralMatches';
import { findFuzzyMatches } from './search/findFuzzyMatches';
import { findWildcardMatches } from './search/findWildcardMatches';
import { SearchStrategy } from './types';

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

export const WildcardSearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    const wildcardMatches = findWildcardMatches(text, criteria);
    if (wildcardMatches.length > 0) {
      return wildcardMatches;
    }
    return findLiteralMatches(text, criteria);
  }
);
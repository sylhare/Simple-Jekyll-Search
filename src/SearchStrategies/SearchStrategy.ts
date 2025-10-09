import { fuzzySearch, findFuzzyMatches } from './search/fuzzySearch';
import { literalSearch, findLiteralMatches } from './search/literalSearch';
import { wildcardSearch, findWildcardMatches } from './search/wildcardSearch';
import { SearchStrategy } from './types';

export const LiteralSearchStrategy = new SearchStrategy(literalSearch, findLiteralMatches);

export const FuzzySearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    return fuzzySearch(text, criteria) || literalSearch(text, criteria);
  },
  (text: string, criteria: string) => {
    // Try fuzzy matches first, then fall back to literal matches
    const fuzzyMatches = findFuzzyMatches(text, criteria);
    if (fuzzyMatches.length > 0) {
      return fuzzyMatches;
    }
    return findLiteralMatches(text, criteria);
  }
);

export const WildcardSearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    return wildcardSearch(text, criteria) || literalSearch(text, criteria);
  },
  (text: string, criteria: string) => {
    // Try wildcard matches first, then fall back to literal matches
    const wildcardMatches = findWildcardMatches(text, criteria);
    if (wildcardMatches.length > 0) {
      return wildcardMatches;
    }
    return findLiteralMatches(text, criteria);
  }
);
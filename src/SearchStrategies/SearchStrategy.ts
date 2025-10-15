import { fuzzySearch } from './search/fuzzySearch';
import { literalSearch } from './search/literalSearch';
import { wildcardSearch } from './search/wildcardSearch';
import { findLiteralMatches, findFuzzyMatches, findWildcardMatches } from './search/findMatches';
import { SearchStrategy } from './types';

export const LiteralSearchStrategy = new SearchStrategy(
  literalSearch,
  findLiteralMatches
);

export const FuzzySearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    return fuzzySearch(text, criteria) || literalSearch(text, criteria);
  },
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
    return wildcardSearch(text, criteria) || literalSearch(text, criteria);
  },
  (text: string, criteria: string) => {
    const wildcardMatches = findWildcardMatches(text, criteria);
    if (wildcardMatches.length > 0) {
      return wildcardMatches;
    }
    return findLiteralMatches(text, criteria);
  }
);
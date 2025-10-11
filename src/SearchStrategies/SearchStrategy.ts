import { findFuzzyMatches } from './search/fuzzySearch';
import { findLiteralMatches } from './search/literalSearch';
import { findWildcardMatches } from './search/wildcardSearch';
import { SearchStrategy } from './types';

export const LiteralSearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    const literalMatches = findLiteralMatches(text, criteria);
    return literalMatches.length > 0;
  },
  findLiteralMatches
);

export const FuzzySearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    const fuzzyMatches = findFuzzyMatches(text, criteria);
    return fuzzyMatches.length > 0;
  },
  findFuzzyMatches
);

export const WildcardSearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    const wildcardMatches = findWildcardMatches(text, criteria);
    return wildcardMatches.length > 0;
  },
  findWildcardMatches
);
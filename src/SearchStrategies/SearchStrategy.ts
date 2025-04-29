import { fuzzySearch } from './search/fuzzySearch';
import { literalSearch } from './search/literalSearch';
import { wildcardSearch } from './search/wildcardSearch';
import { SearchStrategy } from './types';

export const LiteralSearchStrategy = new SearchStrategy(literalSearch);
export const FuzzySearchStrategy = new SearchStrategy((text: string, criteria: string) => {
  return fuzzySearch(text, criteria) || literalSearch(text, criteria);
});
export const WildcardSearchStrategy = new SearchStrategy((text: string, criteria: string) => {
  return wildcardSearch(text, criteria) || literalSearch(text, criteria);
});
import { SearchStrategy } from './types';
import { literalSearch } from './search/literalSearch';
import { wildcardSearch } from './search/wildcardSearch';
import { fuzzySearch } from './search/fuzzySearch';

export const LiteralSearchStrategy = new SearchStrategy(literalSearch);
export const FuzzySearchStrategy = new SearchStrategy((text: string | null, criteria: string) => {
  return fuzzySearch(text, criteria) || literalSearch(text, criteria);
});
export const WildcardSearchStrategy = new SearchStrategy((text: string | null, criteria: string) => {
  return wildcardSearch(text, criteria) || literalSearch(text, criteria);
});
import { fuzzySearch } from '../utils/fuzzySearch';

export interface SearchStrategy {
  matches(string: string | null, criteria: string): boolean;
}

export class FuzzySearchStrategy implements SearchStrategy {
  public matches(string: string | null, criteria: string): boolean {
    if (string === null) {
      return false;
    }
    return fuzzySearch(criteria, string);
  }
}

export default new FuzzySearchStrategy(); 
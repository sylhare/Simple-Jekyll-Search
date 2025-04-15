import { fuzzySearch } from '../utils/fuzzySearch';

export interface SearchStrategy {
  matches(text: string | null, criteria: string): boolean;
}

export class FuzzySearchStrategy implements SearchStrategy {
  public matches(text: string | null, criteria: string): boolean {
    if (text === null) {
      return false;
    }
    return fuzzySearch(criteria, text);
  }
}

export default new FuzzySearchStrategy(); 
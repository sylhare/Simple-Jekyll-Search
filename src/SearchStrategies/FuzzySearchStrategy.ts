import fuzzysearch from 'fuzzysearch';

export interface SearchStrategy {
  matches(string: string | null, criteria: string): boolean;
}

export class FuzzySearchStrategy implements SearchStrategy {
  public matches(string: string | null, criteria: string): boolean {
    if (string === null) {
      return false;
    }
    return fuzzysearch(criteria.toLowerCase(), string.toLowerCase());
  }
}

export default new FuzzySearchStrategy(); 
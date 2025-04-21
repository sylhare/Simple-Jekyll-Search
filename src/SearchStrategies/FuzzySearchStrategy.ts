import { fuzzySearch } from '../utils/fuzzySearch';
import { SearchStrategy } from './types';

export class FuzzySearchStrategy implements SearchStrategy {
  public matches(text: string | null, criteria: string): boolean {
    if (text === null) {
      return false;
    }
    return fuzzySearch(text, criteria);
  }
}

export default new FuzzySearchStrategy(); 
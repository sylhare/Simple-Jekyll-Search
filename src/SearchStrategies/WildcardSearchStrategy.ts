import { SearchStrategy } from './types';
import { wildcardFuzzySearch } from '../utils/wildcardFuzzySearch';

export class WildcardSearchStrategy implements SearchStrategy {
  public matches(text: string | null, criteria: string): boolean {
    if (text === null) {
      return false;
    }

    return wildcardFuzzySearch(text, criteria);
  }
}

export default new WildcardSearchStrategy(); 
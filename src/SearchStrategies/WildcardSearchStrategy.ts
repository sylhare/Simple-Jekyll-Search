import { AbstractSearchStrategy } from './types';
import { wildcardFuzzySearch } from '../utils/wildcardFuzzySearch';
import { literalSearch } from './LiteralSearchStrategy';

export class WildcardSearchStrategy extends AbstractSearchStrategy {
  doMatch(text: string | null, criteria: string): boolean {
    return wildcardFuzzySearch(text, criteria) || literalSearch(text, criteria);
  }
}

export default new WildcardSearchStrategy(); 
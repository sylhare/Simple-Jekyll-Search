import { AbstractSearchStrategy } from './types';
import { wildcardSearch } from '../utils/wildcardSearch';
import { literalSearch } from './LiteralSearchStrategy';

export class WildcardSearchStrategy extends AbstractSearchStrategy {
  doMatch(text: string | null, criteria: string): boolean {
    return wildcardSearch(text, criteria) || literalSearch(text, criteria);
  }
}

export default new WildcardSearchStrategy(); 
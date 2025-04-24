import { fuzzySearch } from '../utils/fuzzySearch';
import { AbstractSearchStrategy } from './types';
import { literalSearch } from './LiteralSearchStrategy';

export class FuzzySearchStrategy extends AbstractSearchStrategy {

  doMatch(text: string | null, criteria: string): boolean {
    return fuzzySearch(text, criteria) || literalSearch(text, criteria);
  }
}

export default new FuzzySearchStrategy(); 
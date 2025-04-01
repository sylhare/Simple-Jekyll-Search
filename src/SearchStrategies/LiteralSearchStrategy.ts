import { SearchStrategy } from './FuzzySearchStrategy';

export class LiteralSearchStrategy implements SearchStrategy {
  public matches(str: string | null, crit: string): boolean {
    if (!str) return false;
    str = str.trim().toLowerCase();
    const criteria = crit.endsWith(' ') ? [crit.toLowerCase()] : crit.trim().toLowerCase().split(' ');

    return criteria.filter((word: string) => str.indexOf(word) >= 0).length === criteria.length;
  }
}

export default new LiteralSearchStrategy(); 
import { SearchStrategy } from './FuzzySearchStrategy';

export class LiteralSearchStrategy implements SearchStrategy {
  public matches(text: string | null, criteria: string): boolean {
    if (!text) return false;
    text = text.trim().toLowerCase();
    const pattern = criteria.endsWith(' ') ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(' ');

    return pattern.filter((word: string) => text.indexOf(word) >= 0).length === pattern.length;
  }
}

export default new LiteralSearchStrategy(); 
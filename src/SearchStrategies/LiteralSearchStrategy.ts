import { AbstractSearchStrategy } from './types';

export class LiteralSearchStrategy extends AbstractSearchStrategy {
  doMatch(text: string | null, criteria: string): boolean {
    return literalSearch(text, criteria);
  }
}

export function literalSearch(text: string | null, criteria: string): boolean {
  text = text.trim().toLowerCase();
  const pattern = criteria.endsWith(' ') ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(' ');

  return pattern.filter((word: string) => text.indexOf(word) >= 0).length === pattern.length;
}

export default new LiteralSearchStrategy(); 
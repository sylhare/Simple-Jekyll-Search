import FuzzySearchStrategy from './FuzzySearchStrategy';
import LiteralSearchStrategy from './LiteralSearchStrategy';

export interface SearchStrategy {
  matches(text: string | null, criteria: string): boolean;
}

export function strategyFactory(
  strategy: 'literal' | 'fuzzy' | 'wildcard',
): SearchStrategy {
  switch (strategy) {
    case 'fuzzy':
      return FuzzySearchStrategy;
    case 'wildcard':
      return FuzzySearchStrategy;
    default:
      return LiteralSearchStrategy;
  }
}
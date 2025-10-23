import { SearchStrategy, MatchInfo } from './types';
import { findLiteralMatches } from './search/findLiteralMatches';
import { findFuzzyMatches } from './search/findFuzzyMatches';
import { findWildcardMatches } from './search/findWildcardMatches';

export interface HybridConfig {
  preferFuzzy?: boolean;
  wildcardPriority?: boolean;
  minFuzzyLength?: number;
}

export class HybridSearchStrategy extends SearchStrategy {
  private config: Required<HybridConfig>;

  constructor(config: HybridConfig = {}) {
    super((text: string, criteria: string) => {
      return this.hybridFind(text, criteria);
    });
    
    this.config = {
      preferFuzzy: config.preferFuzzy ?? false,
      wildcardPriority: config.wildcardPriority ?? true,
      minFuzzyLength: config.minFuzzyLength ?? 3,
    };
  }

  private hybridFind(text: string, criteria: string): MatchInfo[] {
    if (this.config.wildcardPriority && criteria.includes('*')) {
      const wildcardMatches = findWildcardMatches(text, criteria);
      if (wildcardMatches.length > 0) return wildcardMatches;
    }

    if (criteria.includes(' ') || criteria.length < this.config.minFuzzyLength) {
      const literalMatches = findLiteralMatches(text, criteria);
      if (literalMatches.length > 0) return literalMatches;
    }

    if (this.config.preferFuzzy || criteria.length >= this.config.minFuzzyLength) {
      const fuzzyMatches = findFuzzyMatches(text, criteria);
      if (fuzzyMatches.length > 0) return fuzzyMatches;
    }

    return findLiteralMatches(text, criteria);
  }

  getConfig(): Readonly<Required<HybridConfig>> {
    return { ...this.config };
  }
}

export const DefaultHybridSearchStrategy = new HybridSearchStrategy();


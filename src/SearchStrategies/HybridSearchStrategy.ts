import { SearchStrategy, MatchInfo, StrategyOptions } from './types';
import { findLiteralMatches } from './search/findLiteralMatches';
import { findFuzzyMatches } from './search/findFuzzyMatches';
import { findWildcardMatches } from './search/findWildcardMatches';

export class HybridSearchStrategy extends SearchStrategy {
  private config: Readonly<StrategyOptions>;

  constructor(config: StrategyOptions = {}) {
    super((text: string, criteria: string) => {
      return this.hybridFind(text, criteria);
    });
    
    this.config = {
      ...config,
      preferFuzzy: config.preferFuzzy ?? false,
      wildcardPriority: config.wildcardPriority ?? true,
      minFuzzyLength: config.minFuzzyLength ?? 3,
      maxExtraFuzzyChars: config.maxExtraFuzzyChars ?? 4,
    };
  }

  private hybridFind(text: string, criteria: string): MatchInfo[] {
    if (this.config.wildcardPriority && criteria.includes('*')) {
      const wildcardMatches = findWildcardMatches(text, criteria, this.config);
      if (wildcardMatches.length > 0) return wildcardMatches;
    }

    if (criteria.includes(' ') || criteria.length < this.config.minFuzzyLength) {
      const literalMatches = findLiteralMatches(text, criteria);
      if (literalMatches.length > 0) return literalMatches;
    }

    if (this.config.preferFuzzy || criteria.length >= this.config.minFuzzyLength) {
      const fuzzyMatches = findFuzzyMatches(text, criteria);
      if (fuzzyMatches.length > 0) {
        const constrainedMatches = this.applyFuzzyConstraints(fuzzyMatches, criteria);
        if (constrainedMatches.length > 0) return constrainedMatches;
      }
    }

    return findLiteralMatches(text, criteria);
  }

  private applyFuzzyConstraints(matches: MatchInfo[], criteria: string): MatchInfo[] {
    const limit = this.config.maxExtraFuzzyChars;
    if (!Number.isFinite(limit) || limit < 0) {
      return matches;
    }

    const normalizedCriteriaLength = this.normalizeLength(criteria);
    if (normalizedCriteriaLength === 0) {
      return matches;
    }

    return matches.filter(match => {
      const normalizedMatchLength = this.normalizeLength(match.text);
      const extraChars = Math.max(0, normalizedMatchLength - normalizedCriteriaLength);
      return extraChars <= limit;
    });
  }

  private normalizeLength(value: string): number {
    return value.replace(/\s+/g, '').length;
  }
}

export const DefaultHybridSearchStrategy = new HybridSearchStrategy();


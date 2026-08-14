import { SearchStrategy, StrategyConfig } from './types';
import { LiteralSearchStrategy, FuzzySearchStrategy } from './SearchStrategy';
import { HybridSearchStrategy } from './HybridSearchStrategy';
import { UnifiedSearchStrategy } from './UnifiedSearchStrategy';

export type StrategyType = 'literal' | 'fuzzy' | 'wildcard' | 'hybrid' | 'unified';

export class StrategyFactory {
  static create(config: StrategyConfig = { type: 'literal' }): SearchStrategy {
    const { options } = config;
    const type = this.isValidStrategy(config.type) ? config.type : 'literal';

    switch (type) {
      case 'literal':
        return LiteralSearchStrategy;
      
      case 'fuzzy':
        return FuzzySearchStrategy;
      
      case 'wildcard':
        return new UnifiedSearchStrategy({ maxSpaces: 0, ...options, preferFuzzy: false, minFuzzyLength: Number.POSITIVE_INFINITY });
      
      case 'hybrid':
        return new HybridSearchStrategy(options);

      case 'unified':
        return new UnifiedSearchStrategy(options);

      default:
        return LiteralSearchStrategy;
    }
  }

  static getAvailableStrategies(): StrategyType[] {
    return ['literal', 'fuzzy', 'wildcard', 'hybrid', 'unified'];
  }

  static isValidStrategy(type: string): type is StrategyType {
    return this.getAvailableStrategies().includes(type as StrategyType);
  }
}


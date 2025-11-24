import { SearchStrategy, StrategyConfig } from './types';
import { LiteralSearchStrategy, FuzzySearchStrategy, WildcardSearchStrategy } from './SearchStrategy';
import { HybridSearchStrategy } from './HybridSearchStrategy';

export type StrategyType = 'literal' | 'fuzzy' | 'wildcard' | 'hybrid';

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
        return new WildcardSearchStrategy(options);
      
      case 'hybrid':
        return new HybridSearchStrategy(options);
      
      default:
        return LiteralSearchStrategy;
    }
  }

  static getAvailableStrategies(): StrategyType[] {
    return ['literal', 'fuzzy', 'wildcard', 'hybrid'];
  }

  static isValidStrategy(type: string): type is StrategyType {
    return this.getAvailableStrategies().includes(type as StrategyType);
  }
}


import { SearchStrategy } from './types';
import { LiteralSearchStrategy, FuzzySearchStrategy, WildcardSearchStrategy } from './SearchStrategy';
import { HybridSearchStrategy, HybridConfig } from './HybridSearchStrategy';

export type StrategyType = 'literal' | 'fuzzy' | 'wildcard' | 'hybrid';

export interface StrategyConfig {
  type: StrategyType;
  hybridConfig?: HybridConfig;
}

export class StrategyFactory {
  static create(config: StrategyConfig | StrategyType): SearchStrategy {
    if (typeof config === 'string') {
      config = { type: config };
    }

    switch (config.type) {
      case 'literal':
        return LiteralSearchStrategy;
      
      case 'fuzzy':
        return FuzzySearchStrategy;
      
      case 'wildcard':
        return WildcardSearchStrategy;
      
      case 'hybrid':
        return new HybridSearchStrategy(config.hybridConfig);
      
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


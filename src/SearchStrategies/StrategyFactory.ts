import { SearchStrategy, StrategyConfig } from './types';
import { UnifiedSearchStrategy } from './UnifiedSearchStrategy';

export type StrategyType = 'literal' | 'fuzzy' | 'wildcard' | 'hybrid' | 'unified';

export class StrategyFactory {
  static create(config: StrategyConfig = { type: 'literal' }): SearchStrategy {
    const { options } = config;
    const type = this.isValidStrategy(config.type) ? config.type : 'literal';

    switch (type) {
      case 'fuzzy':
        return new UnifiedSearchStrategy({ ...options, wildcardPriority: false, preferFuzzy: true, minFuzzyLength: 1, maxExtraFuzzyChars: Number.POSITIVE_INFINITY });

      case 'wildcard':
        return new UnifiedSearchStrategy({ maxSpaces: 0, ...options, wildcardPriority: true, preferFuzzy: false, minFuzzyLength: Number.POSITIVE_INFINITY });

      case 'hybrid':
      case 'unified':
        return new UnifiedSearchStrategy(options);

      case 'literal':
      default:
        return new UnifiedSearchStrategy({ ...options, wildcardPriority: false, preferFuzzy: false, minFuzzyLength: Number.POSITIVE_INFINITY });
    }
  }

  static getAvailableStrategies(): StrategyType[] {
    return ['literal', 'fuzzy', 'wildcard', 'hybrid', 'unified'];
  }

  static isValidStrategy(type: string): type is StrategyType {
    return this.getAvailableStrategies().includes(type as StrategyType);
  }
}

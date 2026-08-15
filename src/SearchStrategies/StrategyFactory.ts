import { SearchStrategy, StrategyConfig, StrategyOptions } from './types';
import { UnifiedSearchStrategy } from './UnifiedSearchStrategy';

export type StrategyType = 'literal' | 'fuzzy' | 'wildcard' | 'hybrid' | 'unified';

const INFINITY = Number.POSITIVE_INFINITY;

/** Overrides forced after caller options, per strategy type. */
const FORCED: Record<StrategyType, StrategyOptions> = {
  literal: { wildcardPriority: false, preferFuzzy: false, minFuzzyLength: INFINITY },
  fuzzy: { wildcardPriority: false, preferFuzzy: true, minFuzzyLength: 1, maxExtraFuzzyChars: INFINITY },
  wildcard: { wildcardPriority: true, preferFuzzy: false, minFuzzyLength: INFINITY },
  hybrid: {},
  unified: {},
};

/** Defaults applied before caller options, so callers can still override them. */
const DEFAULTS: Partial<Record<StrategyType, StrategyOptions>> = {
  wildcard: { maxSpaces: 0 },
};

export class StrategyFactory {
  static create(config: StrategyConfig = { type: 'literal' }): SearchStrategy {
    const type = this.isValidStrategy(config.type) ? config.type : 'literal';
    return new UnifiedSearchStrategy({ ...DEFAULTS[type], ...config.options, ...FORCED[type] });
  }

  static getAvailableStrategies(): StrategyType[] {
    return Object.keys(FORCED) as StrategyType[];
  }

  static isValidStrategy(type: string): type is StrategyType {
    return this.getAvailableStrategies().includes(type as StrategyType);
  }
}

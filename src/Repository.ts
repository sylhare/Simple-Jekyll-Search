import { Matcher, MatchInfo, StrategyConfig, StrategyResolver } from './SearchStrategies/types';
import { StrategyFactory, type StrategyType } from './SearchStrategies/StrategyFactory';
import { isObject } from './utils';
import { DEFAULT_OPTIONS } from './utils/default';
import { RepositoryData, RepositoryOptions } from './utils/types';

export class Repository {
  private data: RepositoryData[] = [];
  private options!: Required<Omit<RepositoryOptions, 'fuzzy'>> & Pick<RepositoryOptions, 'fuzzy'>;
  private excludePatterns: RegExp[] = [];
  private readonly strategyResolver: StrategyResolver;

  constructor(initialOptions: RepositoryOptions = {}, strategyResolver: StrategyResolver = (config) => StrategyFactory.create(config)) {
    this.strategyResolver = strategyResolver;
    this.setOptions(initialOptions);
  }

  public put(input: RepositoryData | RepositoryData[]): RepositoryData[] | undefined {
    if (isObject(input)) {
      return this.addObject(input);
    }
    if (Array.isArray(input)) {
      return this.addArray(input);
    }
    return undefined;
  }

  public clear(): RepositoryData[] {
    this.data.length = 0;
    return this.data;
  }

  public search(criteria: string): RepositoryData[] {
    if (!criteria) {
      return [];
    }
    const matches = this.findMatches(this.data, criteria).sort(this.options.sortMiddleware);
    return matches.map(item => ({ ...item }));
  }

  public setOptions(newOptions: RepositoryOptions): void {
    let strategyConfig = this.normalizeStrategyOption(newOptions?.strategy);
    
    if (newOptions?.fuzzy && !newOptions?.strategy) {
      console.warn('[Simple Jekyll Search] Warning: fuzzy option is deprecated. Use strategy: "fuzzy" instead.');
      strategyConfig = { type: 'fuzzy' };
    }
    
    const exclude = newOptions?.exclude || DEFAULT_OPTIONS.exclude;
    this.excludePatterns = exclude.map(pattern => new RegExp(pattern));
    this.options = {
      limit: newOptions?.limit || DEFAULT_OPTIONS.limit,
      searchStrategy: this.searchStrategy(strategyConfig),
      sortMiddleware: newOptions?.sortMiddleware || DEFAULT_OPTIONS.sortMiddleware,
      exclude: exclude,
      strategy: strategyConfig,
    };
  }

  private addObject(obj: RepositoryData): RepositoryData[] {
    this.data.push(obj);
    return this.data;
  }

  private addArray(arr: RepositoryData[]): RepositoryData[] {
    const added: RepositoryData[] = [];
    this.clear();
    for (const item of arr) {
      if (isObject(item)) {
        added.push(this.addObject(item)[0]);
      }
    }
    return added;
  }

  private findMatches(data: RepositoryData[], criteria: string): RepositoryData[] {
    const matches: RepositoryData[] = [];
    for (let i = 0; i < data.length && matches.length < this.options.limit; i++) {
      const match = this.findMatchesInObject(data[i], criteria);
      if (match) {
        matches.push(match);
      }
    }
    return matches;
  }

  private findMatchesInObject(obj: RepositoryData, criteria: string): RepositoryData | undefined {
    const strategy = this.options.searchStrategy;
    const matchInfoMap: Record<string, MatchInfo[]> = {};
    let hasMatch = false;

    for (const key in obj) {
      if (this.isExcluded(obj[key])) {
        continue;
      }

      if (strategy.findMatches) {
        const matchInfo = strategy.findMatches(obj[key], criteria);
        if (matchInfo.length > 0) {
          matchInfoMap[key] = matchInfo;
          hasMatch = true;
        }
      } else if (strategy.matches(obj[key], criteria)) {
        hasMatch = true;
      }
    }

    if (!hasMatch) {
      return undefined;
    }

    const result = { ...obj };
    result._matchInfo = matchInfoMap;
    return result;
  }

  private isExcluded(term: any): boolean {
    const termStr = String(term);
    return this.excludePatterns.some(regex => regex.test(termStr));
  }

  private searchStrategy(strategy: StrategyConfig): Matcher {
    return this.strategyResolver(strategy);
  }

  private normalizeStrategyOption(strategy?: StrategyType | StrategyConfig | null): StrategyConfig {
    const resolved = strategy || DEFAULT_OPTIONS.strategy;
    return typeof resolved === 'string' ? { type: resolved } : resolved;
  }
}

import { FuzzySearchStrategy, LiteralSearchStrategy, WildcardSearchStrategy } from './SearchStrategies/SearchStrategy';
import { Matcher } from './SearchStrategies/types';
import { StrategyFactory, StrategyType } from './SearchStrategies/StrategyFactory';
import { clone, isObject } from './utils';
import { DEFAULT_OPTIONS } from './utils/default';
import { RepositoryData, RepositoryOptions } from './utils/types';

export class Repository {
  private data: RepositoryData[] = [];
  private options!: Required<RepositoryOptions>;

  constructor(initialOptions: RepositoryOptions = {}) {
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
    return clone(this.findMatches(this.data, criteria).sort(this.options.sortMiddleware));
  }

  public setOptions(newOptions: RepositoryOptions): void {
    this.options = {
      fuzzy: newOptions?.fuzzy || DEFAULT_OPTIONS.fuzzy,
      limit: newOptions?.limit || DEFAULT_OPTIONS.limit,
      searchStrategy: this.searchStrategy(newOptions?.strategy || (newOptions.fuzzy && 'fuzzy') || DEFAULT_OPTIONS.strategy),
      sortMiddleware: newOptions?.sortMiddleware || DEFAULT_OPTIONS.sortMiddleware,
      exclude: newOptions?.exclude || DEFAULT_OPTIONS.exclude,
      strategy: newOptions?.strategy || DEFAULT_OPTIONS.strategy,
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
    let hasMatch = false;
    const result = { ...obj };
    result._matchInfo = {};

    for (const key in obj) {
      if (!this.isExcluded(obj[key]) && this.options.searchStrategy.matches(obj[key], criteria)) {
        hasMatch = true;
        
        if (this.options.searchStrategy.findMatches) {
          const matchInfo = this.options.searchStrategy.findMatches(obj[key], criteria);
          if (matchInfo && matchInfo.length > 0) {
            result._matchInfo[key] = matchInfo;
          }
        }
      }
    }

    return hasMatch ? result : undefined;
  }

  private isExcluded(term: any): boolean {
    for (const excludedTerm of this.options.exclude) {
      if (new RegExp(excludedTerm).test(String(term))) {
        return true;
      }
    }
    return false;
  }

  private searchStrategy(
    strategy: StrategyType,
  ): Matcher {
    if (StrategyFactory.isValidStrategy(strategy)) {
      return StrategyFactory.create(strategy);
    }
    switch (strategy) {
      case 'fuzzy':
        return FuzzySearchStrategy;
      case 'wildcard':
        return WildcardSearchStrategy;
      default:
        return LiteralSearchStrategy;
    }
  }
}

import { isObject } from './utils';
import { RepositoryOptions } from './utils/types';
import { DEFAULT_OPTIONS } from './utils/default';
import { SearchStrategy } from './SearchStrategies/types';
import FuzzySearchStrategy from './SearchStrategies/FuzzySearchStrategy';
import LiteralSearchStrategy from './SearchStrategies/LiteralSearchStrategy';
import WildcardSearchStrategy from './SearchStrategies/WildcardSearchStrategy';

interface RepositoryData {
  [key: string]: any;
}

export class Repository {
  private data: RepositoryData[] = [];
  private options: Required<RepositoryOptions>;

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
    return this.findMatches(this.data, criteria).sort(this.options.sortMiddleware);
  }

  public setOptions(newOptions: RepositoryOptions): void {
    this.options = {
      fuzzy: newOptions?.fuzzy || false,
      limit: newOptions?.limit || DEFAULT_OPTIONS.limit,
      searchStrategy: this.searchStrategy(newOptions?.strategy || newOptions.fuzzy && 'fuzzy'),
      sortMiddleware: newOptions?.sortMiddleware || DEFAULT_OPTIONS.sortMiddleware,
      exclude: newOptions?.exclude || DEFAULT_OPTIONS.exclude,
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
    for (const key in obj) {
      if (!this.isExcluded(obj[key]) && this.options.searchStrategy.matches(obj[key], criteria)) {
        return obj;
      }
    }
    return undefined;
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
    strategy: 'literal' | 'fuzzy' | 'wildcard',
  ): SearchStrategy {
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

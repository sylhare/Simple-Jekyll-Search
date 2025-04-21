import { FuzzySearchStrategy } from './SearchStrategies/FuzzySearchStrategy';
import { LiteralSearchStrategy } from './SearchStrategies/LiteralSearchStrategy';
import { isObject, NoSort } from './utils';
import { RepositoryOptions } from './utils/types';

interface RepositoryData {
  [key: string]: any;
}

export class Repository {
  private data: RepositoryData[] = [];
  private options: Required<RepositoryOptions>;

  constructor(initialOptions: RepositoryOptions = {}) {
    this.options = {
      fuzzy: initialOptions.fuzzy || false,
      limit: initialOptions.limit || 10,
      searchStrategy: initialOptions.fuzzy ? new FuzzySearchStrategy() : new LiteralSearchStrategy(),
      sortMiddleware: initialOptions.sortMiddleware,
      exclude: initialOptions.exclude || [],
    };
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
      fuzzy: newOptions.fuzzy || false,
      limit: newOptions.limit || 10,
      searchStrategy: newOptions.fuzzy ? new FuzzySearchStrategy() : new LiteralSearchStrategy(),
      sortMiddleware: newOptions.sortMiddleware || NoSort,
      exclude: newOptions.exclude || [],
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
}
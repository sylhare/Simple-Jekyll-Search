import { FuzzySearchStrategy, SearchStrategy } from './SearchStrategies/FuzzySearchStrategy';
import { LiteralSearchStrategy } from './SearchStrategies/LiteralSearchStrategy';

interface RepositoryOptions {
  fuzzy?: boolean;
  limit?: number;
  searchStrategy?: SearchStrategy;
  sort?: (a: any, b: any) => number;
  exclude?: string[];
}

interface RepositoryData {
  [key: string]: any;
}

function NoSort(): number {
  return 0;
}

const data: RepositoryData[] = [];
let opt: RepositoryOptions & { fuzzy: boolean; limit: number; searchStrategy: SearchStrategy; sort: (a: any, b: any) => number; exclude: string[] } = {
  fuzzy: false,
  limit: 10,
  searchStrategy: new FuzzySearchStrategy(),
  sort: NoSort,
  exclude: []
};

export function put(input: RepositoryData | RepositoryData[]): RepositoryData[] | undefined {
  if (isObject(input)) {
    return addObject(input);
  }
  if (isArray(input)) {
    return addArray(input);
  }
  return undefined;
}

export function clear(): RepositoryData[] {
  data.length = 0;
  return data;
}

function isObject(obj: any): obj is RepositoryData {
  return Boolean(obj) && Object.prototype.toString.call(obj) === '[object Object]';
}

function isArray(obj: any): obj is RepositoryData[] {
  return Boolean(obj) && Object.prototype.toString.call(obj) === '[object Array]';
}

function addObject(_data: RepositoryData): RepositoryData[] {
  data.push(_data);
  return data;
}

function addArray(_data: RepositoryData[]): RepositoryData[] {
  const added: RepositoryData[] = [];
  clear();
  for (let i = 0, len = _data.length; i < len; i++) {
    if (isObject(_data[i])) {
      added.push(addObject(_data[i])[0]);
    }
  }
  return added;
}

export function search(criteria: string): RepositoryData[] {
  if (!criteria) {
    return [];
  }
  return findMatches(data, criteria, opt.searchStrategy, opt).sort(opt.sort);
}

export function setOptions(_opt: RepositoryOptions): void {
  opt = {
    fuzzy: _opt.fuzzy || false,
    limit: _opt.limit || 10,
    searchStrategy: _opt.fuzzy ? new FuzzySearchStrategy() : new LiteralSearchStrategy(),
    sort: _opt.sort || NoSort,
    exclude: _opt.exclude || []
  };
}

function findMatches(data: RepositoryData[], criteria: string, strategy: SearchStrategy, opt: RepositoryOptions): RepositoryData[] {
  const matches: RepositoryData[] = [];
  for (let i = 0; i < data.length && matches.length < opt.limit!; i++) {
    const match = findMatchesInObject(data[i], criteria, strategy, opt);
    if (match) {
      matches.push(match);
    }
  }
  return matches;
}

function findMatchesInObject(obj: RepositoryData, criteria: string, strategy: SearchStrategy, opt: RepositoryOptions): RepositoryData | undefined {
  for (const key in obj) {
    if (!isExcluded(obj[key], opt.exclude!) && strategy.matches(obj[key], criteria)) {
      return obj;
    }
  }
  return undefined;
}

function isExcluded(term: any, excludedTerms: string[]): boolean {
  for (let i = 0, len = excludedTerms.length; i < len; i++) {
    const excludedTerm = excludedTerms[i];
    if (new RegExp(excludedTerm).test(String(term))) {
      return true;
    }
  }
  return false;
} 
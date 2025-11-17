import { Matcher, StrategyConfig } from '../SearchStrategies/types';
import { StrategyType } from '../SearchStrategies/StrategyFactory';

export interface SearchResult {
  url: string;
  title: string;
  desc: string;
  query?: string;
}

export interface SearchData {
  url: string;
  title: string;
  category?: string;
  tags?: string;
  date?: string;
}

export interface RepositoryOptions {
  /** @deprecated Use strategy instead (e.g. `strategy: 'fuzzy'`) */
  fuzzy?: boolean;
  strategy?: StrategyType | StrategyConfig;
  limit?: number;
  searchStrategy?: Matcher;
  sortMiddleware?: (a: any, b: any) => number;
  exclude?: string[];
}

export interface RepositoryData {
  [key: string]: any;
  _matchInfo?: Record<string, import('../SearchStrategies/types').MatchInfo[]>;
}

export interface SearchOptions extends Omit<RepositoryOptions, 'searchStrategy'> {
  searchInput: HTMLInputElement;
  resultsContainer: HTMLElement;
  json: SearchData[] | string;
  success?: (this: { search: (query: string) => void }) => void;
  searchResultTemplate?: string;
  templateMiddleware?: (
    prop: string, 
    value: string, 
    template: string, 
    query?: string, 
    matchInfo?: import('../SearchStrategies/types').MatchInfo[]
  ) => string | undefined;
  noResultsText?: string;
  debounceTime?: number | null;
  onSearch?: () => void;
  onError?: (error: Error) => void;
}

export interface SimpleJekyllSearchInstance {
  search: (query: string) => void;
} 
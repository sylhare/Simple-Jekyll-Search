import { Matcher } from '../SearchStrategies/types';

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
  strategy?: 'literal' | 'fuzzy' | 'wildcard';
  limit?: number;
  searchStrategy?: Matcher;
  sortMiddleware?: (a: any, b: any) => number;
  exclude?: string[];
}

export interface SearchOptions extends Omit<RepositoryOptions, 'searchStrategy'> {
  searchInput: HTMLInputElement;
  resultsContainer: HTMLElement;
  json: SearchData[] | string;
  success?: (this: { search: (query: string) => void }) => void;
  searchResultTemplate?: string;
  templateMiddleware?: (prop: string, value: string, template: string) => string | undefined;
  noResultsText?: string;
  debounceTime?: number | null;
  onSearch?: () => void;
}

export interface SimpleJekyllSearchInstance {
  search: (query: string) => void;
} 
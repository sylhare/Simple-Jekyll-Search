import { SearchStrategy } from '../SearchStrategies/types';

export interface SearchResult {
  url: string;
  desc: string;
  title: string;
  query?: string;
  [key: string]: string | undefined;
}

export interface SearchData {
  title: string;
  category?: string;
  tags?: string;
  url: string;
  date?: string;
  [key: string]: string | undefined;
}

export interface RepositoryOptions {
  /** @deprecated Use strategy instead (e.g. `strategy: 'fuzzy'`) */
  fuzzy?: boolean;
  strategy?: 'literal' | 'fuzzy' | 'wildcard';
  limit?: number;
  searchStrategy?: SearchStrategy;
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
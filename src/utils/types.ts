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

export interface SearchOptions {
  searchInput: HTMLInputElement;
  resultsContainer: HTMLElement;
  json: SearchData[] | string;
  success?: (this: { search: (query: string) => void }) => void;
  searchResultTemplate?: string;
  templateMiddleware?: (prop: string, value: string, template: string) => string | undefined;
  sortMiddleware?: (a: SearchResult, b: SearchResult) => number;
  noResultsText?: string;
  limit?: number;
  fuzzy?: boolean;
  debounceTime?: number | null;
  exclude?: string[];
  onSearch?: () => void;
}

export interface SimpleJekyllSearchInstance {
  search: (query: string) => void;
} 
import { SearchOptions } from './types';

export const DEFAULT_OPTIONS: SearchOptions = {
  searchInput: null!,
  resultsContainer: null!,
  json: [],
  success: function(this: { search: (query: string) => void }) {},
  searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
  templateMiddleware: (_prop: string, _value: string, _template: string) => undefined,
  sortMiddleware: () => 0,
  noResultsText: 'No results found',
  limit: 10,
  fuzzy: false,
  debounceTime: null,
  exclude: [],
  onSearch: () => {}
};

export const REQUIRED_OPTIONS = ['searchInput', 'resultsContainer', 'json'];

export const WHITELISTED_KEYS = new Set([13, 16, 20, 37, 38, 39, 40, 91]); 
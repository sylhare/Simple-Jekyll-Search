import { NoSort } from '../utils';
import { SearchOptions } from './types';

export const DEFAULT_OPTIONS: Required<SearchOptions> = {
  searchInput: null!,
  resultsContainer: null!,
  json: [],
  success: function(this: { search: (query: string) => void }) {},
  searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
  templateMiddleware: (_prop: string, _value: string, _template: string) => undefined,
  sortMiddleware: NoSort,
  noResultsText: 'No results found',
  limit: 10,
  strategy: 'literal',
  debounceTime: null,
  exclude: [],
  onSearch: () => {},
  onError: (error: Error) => console.error('SimpleJekyllSearch error:', error),
  fuzzy: false  // Deprecated, use strategy: 'fuzzy' instead
};

export const REQUIRED_OPTIONS = ['searchInput', 'resultsContainer', 'json'];

export const WHITELISTED_KEYS = new Set([
  'Enter', 'Shift', 'CapsLock', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Meta',
]);
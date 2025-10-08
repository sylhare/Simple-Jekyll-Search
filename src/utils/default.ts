import { NoSort } from '../utils';
import { SearchOptions } from './types';

export const DEFAULT_OPTIONS: Required<Omit<SearchOptions, 'highlightMiddleware'>> & Pick<SearchOptions, 'highlightMiddleware'> = {
  searchInput: null!,
  resultsContainer: null!,
  json: [],
  success: function(this: { search: (query: string) => void }) {},
  searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
  templateMiddleware: (_prop: string, _value: string, _template: string) => undefined,
  highlightMiddleware: undefined,
  sortMiddleware: NoSort,
  noResultsText: 'No results found',
  limit: 10,
  fuzzy: false,
  strategy: 'literal',
  debounceTime: null,
  exclude: [],
  onSearch: () => {}
};

export const REQUIRED_OPTIONS = ['searchInput', 'resultsContainer', 'json'];

export const WHITELISTED_KEYS = new Set([
  'Enter', 'Shift', 'CapsLock', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Meta',
]);
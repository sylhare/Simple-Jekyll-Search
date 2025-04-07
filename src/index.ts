interface SearchResult {
  url: string;
  desc: string;
  title: string;
  query?: string;
  [key: string]: string | undefined;
}

interface SearchData {
  title: string;
  category?: string;
  tags?: string;
  url: string;
  date?: string;
  [key: string]: string | undefined;
}

interface SearchOptions {
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

interface SimpleJekyllSearchInstance {
  search: (query: string) => void;
}

const DEFAULT_OPTIONS: SearchOptions = {
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

const REQUIRED_OPTIONS = ['searchInput', 'resultsContainer', 'json'];
const WHITELISTED_KEYS = new Set([13, 16, 20, 37, 38, 39, 40, 91]);

let options: SearchOptions = { ...DEFAULT_OPTIONS };
let debounceTimerHandle: NodeJS.Timeout;

import { load as loadJSON } from './JSONLoader';
import { OptionsValidator } from './OptionsValidator';
import { put, search as repositorySearch, setOptions as setRepositoryOptions } from './Repository';
import { compile as compileTemplate, setOptions as setTemplaterOptions } from './Templater';
import { isJSON, merge } from './utils';

const optionsValidator = new OptionsValidator({
  required: REQUIRED_OPTIONS
});

declare global {
  interface Window {
    SimpleJekyllSearch: (options: SearchOptions) => SimpleJekyllSearchInstance;
  }
}

const debounce = (func: () => void, delayMillis: number | null): void => {
  if (delayMillis) {
    clearTimeout(debounceTimerHandle);
    debounceTimerHandle = setTimeout(func, delayMillis);
  } else {
    func();
  }
};

const throwError = (message: string): never => {
  throw new Error(`SimpleJekyllSearch --- ${message}`);
};

const emptyResultsContainer = (): void => {
  options.resultsContainer.innerHTML = '';
};

const appendToResultsContainer = (text: string): void => {
  options.resultsContainer.insertAdjacentHTML('beforeend', text);
};

const isValidQuery = (query: string): boolean => {
  return Boolean(query?.trim());
};

const isWhitelistedKey = (key: number): boolean => {
  return !WHITELISTED_KEYS.has(key);
};

const initWithJSON = (json: SearchData[]): void => {
  put(json);
  registerInput();
};

const initWithURL = (url: string): void => {
  loadJSON(url, (err, json) => {
    if (err) {
      throwError(`Failed to load JSON from ${url}: ${err.message}`);
    }
    initWithJSON(json);
  });
};

const registerInput = (): void => {
  options.searchInput.addEventListener('input', (e: Event) => {
    const inputEvent = e as KeyboardEvent;
    if (isWhitelistedKey(inputEvent.which)) {
      emptyResultsContainer();
      debounce(() => { 
        search((e.target as HTMLInputElement).value); 
      }, options.debounceTime ?? null);
    }
  });
};

const search = (query: string): void => {
  if (isValidQuery(query)) {
    emptyResultsContainer();
    const results = repositorySearch(query);
    render(results as SearchResult[], query);
    options.onSearch?.();
  }
};

const render = (results: SearchResult[], query: string): void => {
  if (results.length === 0) {
    appendToResultsContainer(options.noResultsText!);
    return;
  }

  const fragment = document.createDocumentFragment();
  results.forEach(result => {
    result.query = query;
    const li = document.createElement('li');
    li.innerHTML = compileTemplate(result);
    fragment.appendChild(li);
  });
  
  options.resultsContainer.appendChild(fragment);
};

window.SimpleJekyllSearch = function(_options: SearchOptions): SimpleJekyllSearchInstance {
  const errors = optionsValidator.validate(_options);
  if (errors.length > 0) {
    throwError(`Missing required options: ${REQUIRED_OPTIONS.join(', ')}`);
  }

  options = merge(options, _options) as SearchOptions;

  setTemplaterOptions({
    template: options.searchResultTemplate,
    middleware: options.templateMiddleware
  });

  setRepositoryOptions({
    fuzzy: options.fuzzy,
    limit: options.limit,
    sort: options.sortMiddleware,
    exclude: options.exclude
  });

  if (isJSON(options.json)) {
    initWithJSON(options.json as SearchData[]);
  } else {
    initWithURL(options.json as string);
  }

  const rv = {
    search
  };

  options.success?.call(rv);
  return rv;
}; 
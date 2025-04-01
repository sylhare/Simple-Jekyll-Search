interface SearchOptions {
  searchInput: HTMLInputElement;
  resultsContainer: HTMLElement;
  json: any[] | string;
  success?: (this: { search: (query: string) => void }) => void;
  searchResultTemplate?: string;
  templateMiddleware?: (prop: string, value: any, template: string) => any;
  sortMiddleware?: (a: any, b: any) => number;
  noResultsText?: string;
  limit?: number;
  fuzzy?: boolean;
  debounceTime?: number | null;
  exclude?: string[];
  onSearch?: () => void;
}

interface SearchResult {
  url: string;
  desc: string;
  title: string;
  query?: string;
  [key: string]: any;
}

interface SimpleJekyllSearchInstance {
  search: (query: string) => void;
}

let options: SearchOptions = {
  searchInput: null!,
  resultsContainer: null!,
  json: [],
  success: function(this: { search: (query: string) => void }) {},
  searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
  templateMiddleware: function(_prop: string, _value: any, _template: string) { return undefined; },
  sortMiddleware: function(_a: any, _b: any) {
    return 0;
  },
  noResultsText: 'No results found',
  limit: 10,
  fuzzy: false,
  debounceTime: null,
  exclude: [],
  onSearch: function() {}
};

let debounceTimerHandle: NodeJS.Timeout;
const debounce = function(func: () => void, delayMillis: number | null): void {
  if (delayMillis) {
    clearTimeout(debounceTimerHandle);
    debounceTimerHandle = setTimeout(func, delayMillis);
  } else {
    func.call(null);
  }
};

const requiredOptions = ['searchInput', 'resultsContainer', 'json'];

import { setOptions as setTemplaterOptions, compile as compileTemplate } from './Templater';
import { put, search as repositorySearch, setOptions as setRepositoryOptions } from './Repository';
import { load as loadJSON } from './JSONLoader';
import { OptionsValidator } from './OptionsValidator';
import { merge, isJSON } from './utils';

const optionsValidator = new OptionsValidator({
  required: requiredOptions
});

declare global {
  interface Window {
    SimpleJekyllSearch: (options: SearchOptions) => SimpleJekyllSearchInstance;
  }
}

window.SimpleJekyllSearch = function(_options: SearchOptions): SimpleJekyllSearchInstance {
  const errors = optionsValidator.validate(_options);
  if (errors.length > 0) {
    throwError('You must specify the following required options: ' + requiredOptions);
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
    initWithJSON(options.json as any[]);
  } else {
    initWithURL(options.json as string);
  }

  const rv = {
    search: search
  };

  typeof options.success === 'function' && options.success.call(rv);
  return rv;
};

function initWithJSON(json: any[]): void {
  put(json);
  registerInput();
}

function initWithURL(url: string): void {
  loadJSON(url, function(err, json) {
    if (err) {
      throwError('failed to get JSON (' + url + ')');
    }
    initWithJSON(json);
  });
}

function emptyResultsContainer(): void {
  options.resultsContainer.innerHTML = '';
}

function appendToResultsContainer(text: string): void {
  options.resultsContainer.innerHTML += text;
}

function registerInput(): void {
  options.searchInput.addEventListener('input', function(e: Event) {
    const inputEvent = e as KeyboardEvent;
    if (isWhitelistedKey(inputEvent.which)) {
      emptyResultsContainer();
      debounce(function() { 
        search((e.target as HTMLInputElement).value); 
      }, options.debounceTime || null);
    }
  });
}

function search(query: string): void {
  if (isValidQuery(query)) {
    emptyResultsContainer();
    const results = repositorySearch(query);
    render(results as SearchResult[], query);

    typeof options.onSearch === 'function' && options.onSearch.call(null);
  }
}

function render(results: SearchResult[], query: string): void {
  const len = results.length;
  if (len === 0) {
    return appendToResultsContainer(options.noResultsText!);
  }
  for (let i = 0; i < len; i++) {
    results[i].query = query;
    appendToResultsContainer(compileTemplate(results[i]));
  }
}

function isValidQuery(query: string): boolean {
  return Boolean(query && query.length > 0);
}

function isWhitelistedKey(key: number): boolean {
  return [13, 16, 20, 37, 38, 39, 40, 91].indexOf(key) === -1;
}

function throwError(message: string): never {
  throw new Error('SimpleJekyllSearch --- ' + message);
} 
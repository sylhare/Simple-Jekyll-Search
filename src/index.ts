import { Repository } from './Repository';
import { load as loadJSON } from './JSONLoader';
import { OptionsValidator } from './OptionsValidator';
import { compile as compileTemplate, setOptions as setTemplaterOptions } from './Templater';
import { isJSON, merge } from './utils';
import { DEFAULT_OPTIONS, REQUIRED_OPTIONS, WHITELISTED_KEYS } from './utils/default';
import { SearchData, SearchOptions, SearchResult, SimpleJekyllSearchInstance } from './utils/types';

let options: SearchOptions = { ...DEFAULT_OPTIONS };
let debounceTimerHandle: NodeJS.Timeout;

const repository = new Repository();
const optionsValidator = new OptionsValidator({
  required: REQUIRED_OPTIONS
});

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
  repository.put(json);
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
    const results = repository.search(query);
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

  options = merge<SearchOptions>(options, _options);

  setTemplaterOptions({
    template: options.searchResultTemplate,
    middleware: options.templateMiddleware
  });

  repository.setOptions({
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
import { load as loadJSON } from './JSONLoader';
import { OptionsValidator } from './OptionsValidator';
import { Repository } from './Repository';
import { compile as compileTemplate, setOptions as setTemplaterOptions } from './Templater';
import { isJSON, merge } from './utils';
import { DEFAULT_OPTIONS, REQUIRED_OPTIONS, WHITELISTED_KEYS } from './utils/default';
import { SearchData, SearchOptions, SearchResult, SimpleJekyllSearchInstance } from './utils/types';

class SimpleJekyllSearch {
  private options: SearchOptions;
  private repository: Repository;
  private optionsValidator: OptionsValidator;
  private debounceTimerHandle: NodeJS.Timeout | null = null;
  private eventHandler: ((e: Event) => void) | null = null;
  private pageShowHandler: (() => void) | null = null;
  private pendingRequest: XMLHttpRequest | null = null;
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = 'sjs-search-state';

  constructor() {
    this.options = { ...DEFAULT_OPTIONS };
    this.repository = new Repository();
    this.optionsValidator = new OptionsValidator({
      required: REQUIRED_OPTIONS,
    });
  }

  private debounce(func: () => void, delayMillis: number | null): void {
    if (delayMillis) {
      if (this.debounceTimerHandle) {
        clearTimeout(this.debounceTimerHandle);
      }
      this.debounceTimerHandle = setTimeout(func, delayMillis);
    } else {
      func();
    }
  }

  private throwError(message: string): never {
    throw new Error(`SimpleJekyllSearch --- ${message}`);
  }

  private emptyResultsContainer(): void {
    this.options.resultsContainer.innerHTML = '';
  }

  private initWithJSON(json: SearchData[]): void {
    this.repository.put(json);
    this.registerInput();
  }

  private initWithURL(url: string): void {
    loadJSON(url, (err, json) => {
      if (err) {
        this.throwError(`Failed to load JSON from ${url}: ${err.message}`);
      }
      this.initWithJSON(json);
    });
  }

  private registerInput(): void {
    this.eventHandler = (e: Event) => {
      try {
        const inputEvent = e as KeyboardEvent;
        if (!WHITELISTED_KEYS.has(inputEvent.key)) {
          this.emptyResultsContainer();
          this.debounce(() => {
            try {
              this.search((e.target as HTMLInputElement).value);
            } catch (searchError) {
              console.error('Search error:', searchError);
              this.options.onError?.(searchError as Error);
            }
          }, this.options.debounceTime ?? null);
        }
      } catch (error) {
        console.error('Input handler error:', error);
        this.options.onError?.(error as Error);
      }
    };
    
    this.options.searchInput.addEventListener('input', this.eventHandler);

    this.pageShowHandler = () => {
      this.restoreSearchState();
    };
    window.addEventListener('pageshow', this.pageShowHandler);

    this.restoreSearchState();
  }

  private saveSearchState(query: string): void {
    if (!query?.trim()) {
      this.clearSearchState();
      return;
    }
    try {
      const state = {
        query: query.trim(),
        timestamp: Date.now(),
        path: window.location.pathname
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {
    }
  }

  private getStoredSearchState(): string | null {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;

      const state = JSON.parse(raw);

      if (typeof state?.query !== 'string') return null;

      const MAX_AGE_MS = 30 * 60 * 1000;
      if (Date.now() - state.timestamp > MAX_AGE_MS) {
        this.clearSearchState();
        return null;
      }

      if (state.path && state.path !== window.location.pathname) {
        this.clearSearchState();
        return null;
      }

      return state.query;
    } catch {
      this.clearSearchState();
      return null;
    }
  }

  private clearSearchState(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch {
    }
  }

  private restoreSearchState(): void {
    const hasExistingResults = this.options.resultsContainer.children.length > 0;
    if (hasExistingResults) return;

    let query = this.options.searchInput.value?.trim();

    if (!query) {
      query = this.getStoredSearchState() || '';
    }

    if (query.length > 0) {
      this.options.searchInput.value = query;
      this.search(query);
    }
  }

  public search(query: string): void {
    if (query?.trim().length > 0) {
      this.saveSearchState(query);
      this.emptyResultsContainer();
      const results = this.repository.search(query) as SearchResult[];
      this.render(results, query);
      this.options.onSearch?.();
    } else {
      this.clearSearchState();
    }
  }

  private render(results: SearchResult[], query: string): void {
    if (results.length === 0) {
      this.options.resultsContainer.insertAdjacentHTML('beforeend', this.options.noResultsText!);
      return;
    }

    const fragment = document.createDocumentFragment();
    results.forEach(result => {
      result.query = query;
      const div = document.createElement('div');
      div.innerHTML = compileTemplate(result, query);
      fragment.appendChild(div);
    });

    this.options.resultsContainer.appendChild(fragment);
  }

  public destroy(): void {
    if (this.eventHandler) {
      this.options.searchInput.removeEventListener('input', this.eventHandler);
      this.eventHandler = null;
    }

    if (this.pageShowHandler) {
      window.removeEventListener('pageshow', this.pageShowHandler);
      this.pageShowHandler = null;
    }

    if (this.debounceTimerHandle) {
      clearTimeout(this.debounceTimerHandle);
      this.debounceTimerHandle = null;
    }

    this.clearSearchState();
  }

  public init(_options: SearchOptions): SimpleJekyllSearchInstance {
    const errors = this.optionsValidator.validate(_options);
    if (errors.length > 0) {
      this.throwError(`Missing required options: ${REQUIRED_OPTIONS.join(', ')}`);
    }

    this.options = merge<SearchOptions>(this.options, _options);

    setTemplaterOptions({
      template: this.options.searchResultTemplate,
      middleware: this.options.templateMiddleware,
    });

    this.repository.setOptions({
      limit: this.options.limit,
      sortMiddleware: this.options.sortMiddleware,
      strategy: this.options.strategy,
      exclude: this.options.exclude,
    });

    if (isJSON(this.options.json)) {
      this.initWithJSON(this.options.json as SearchData[]);
    } else {
      this.initWithURL(this.options.json as string);
    }

    const rv = {
      search: this.search.bind(this),
      destroy: this.destroy.bind(this),
    };

    this.options.success?.call(rv);
    return rv;
  }
}

export default SimpleJekyllSearch;
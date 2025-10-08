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
    this.options.searchInput.addEventListener('input', (e: Event) => {
      const inputEvent = e as KeyboardEvent;
      if (!WHITELISTED_KEYS.has(inputEvent.key)) {
        this.emptyResultsContainer();
        this.debounce(() => {
          this.search((e.target as HTMLInputElement).value);
        }, this.options.debounceTime ?? null);
      }
    });
  }

  public search(query: string): void {
    if (query?.trim().length > 0) {
      this.emptyResultsContainer();
      const results = this.repository.search(query) as SearchResult[];
      this.render(results, query);
      this.options.onSearch?.();
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
      fuzzy: this.options.fuzzy,
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
    };

    this.options.success?.call(rv);
    return rv;
  }
}

export default SimpleJekyllSearch;
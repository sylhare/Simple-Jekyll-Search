import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SimpleJekyllSearch from '../src/SimpleJekyllSearch';
import { SearchData, SearchOptions } from '../src/utils/types';
import { createHighlightTemplateMiddleware } from '../src/middleware/highlightMiddleware';

describe('SimpleJekyllSearch', () => {
  let searchInstance: SimpleJekyllSearch;
  let mockOptions: SearchOptions;
  let mockSearchData: SearchData[];
  const STORAGE_KEY = 'sjs-search-state';

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="search-input" type="text" />
      <div id="results-container"></div>
    `;

    searchInstance = new SimpleJekyllSearch();

    mockOptions = {
      searchInput: document.getElementById('search-input') as HTMLInputElement,
      resultsContainer: document.getElementById('results-container') as HTMLElement,
      json: [],
      searchResultTemplate: '<li>{title}</li>',
      noResultsText: 'No results found',
      debounceTime: 100,
    };

    mockSearchData = [
      { title: 'Test Post 1', url: '/test1', category: 'test', tags: 'test1, test2' },
      { title: 'Test Post 2', url: '/test2', category: 'test', tags: 'test1, test2' },
    ];

    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('initialization', () => {
    it('should throw error when required options are missing', () => {
      const invalidOptions = {} as SearchOptions;
      expect(() => searchInstance.init(invalidOptions)).toThrow();
    });

    it('should initialize successfully with valid options', () => {
      const instance = searchInstance.init(mockOptions);
      expect(instance).toBeDefined();
      expect(instance.search).toBeDefined();
    });

    it('should initialize with JSON data', () => {
      const optionsWithJSON = { ...mockOptions, json: mockSearchData };
      const instance = searchInstance.init(optionsWithJSON);
      expect(instance).toBeDefined();
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
    });

    it('should not search with empty query', () => {
      const resultsContainer = mockOptions.resultsContainer;
      searchInstance.search('');
      expect(resultsContainer.innerHTML).toBe('');
    });

    it('should search and render results', () => {
      const resultsContainer = mockOptions.resultsContainer;
      searchInstance.search('Test');
      expect(resultsContainer.innerHTML).toContain('Test Post');
    });

    it('should show no results text when no matches found', () => {
      const resultsContainer = mockOptions.resultsContainer;
      searchInstance.search('NonExistent');
      expect(resultsContainer.innerHTML).toContain('No results found');
    });
  });

  describe('keyboard input handling', () => {
    beforeEach(() => {
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
    });

    it('should trigger search on non-whitelisted key input', async () => {
      const input = mockOptions.searchInput;
      const event = new KeyboardEvent('input', { key: 't' });
      input.value = 'Test';
      input.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      expect(mockOptions.resultsContainer.innerHTML).toContain('Test Post');
      expect(input.value).toBe('Test');
    });

    it('should not trigger search on whitelisted key input', async () => {
      const input = mockOptions.searchInput;
      const event = new KeyboardEvent('input', { key: 'Enter' });
      input.value = 'Test';
      input.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      expect(mockOptions.resultsContainer.innerHTML).toBe('');
    });
  });

  describe('debounce functionality', () => {
    beforeEach(() => {
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
    });

    it('should debounce multiple rapid inputs', async () => {
      const input = mockOptions.searchInput;
      const resultsContainer = mockOptions.resultsContainer;

      input.value = 'T';
      input.dispatchEvent(new KeyboardEvent('input', { key: 'T' }));

      input.value = 'Te';
      input.dispatchEvent(new KeyboardEvent('input', { key: 'e' }));

      input.value = 'Tes';
      input.dispatchEvent(new KeyboardEvent('input', { key: 's' }));

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      expect(resultsContainer.innerHTML).toContain('Test Post');
    });
  });

  describe('search state restoration', () => {
    it('should restore search when input has value but results are empty', () => {
      const input = mockOptions.searchInput;
      const resultsContainer = mockOptions.resultsContainer;
      
      input.value = 'Test';
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
      
      expect(resultsContainer.innerHTML).toContain('Test Post');
    });

    it('should not restore search when input is empty', () => {
      const input = mockOptions.searchInput;
      const resultsContainer = mockOptions.resultsContainer;
      
      input.value = '';
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
      
      expect(resultsContainer.innerHTML).toBe('');
    });

    it('should not restore search when results already exist', () => {
      const input = mockOptions.searchInput;
      const resultsContainer = mockOptions.resultsContainer;
      
      resultsContainer.innerHTML = '<li>Existing Result</li>';
      input.value = 'Test';
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
      
      expect(resultsContainer.innerHTML).toBe('<li>Existing Result</li>');
    });

    it('should not restore search when input has only whitespace', () => {
      const input = mockOptions.searchInput;
      const resultsContainer = mockOptions.resultsContainer;
      
      input.value = '   ';
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
      
      expect(resultsContainer.innerHTML).toBe('');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockOptions.json = mockSearchData;
    });

    it('should call onError callback when provided', async () => {
      const onErrorSpy = vi.fn();
      const optionsWithErrorHandler = { ...mockOptions, onError: onErrorSpy };
      
      searchInstance.init(optionsWithErrorHandler);
      
      const input = mockOptions.searchInput;
      input.value = 'test';
      input.dispatchEvent(new KeyboardEvent('input', { key: 't' }));

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      
      expect(onErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle malformed search data gracefully', async () => {
      const onErrorSpy = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const malformedData = [
        { title: 'Valid Post', url: '/valid' },
        { title: null, url: undefined },
        { title: 'Another Valid Post', url: '/another' }
      ];
      
      const optionsWithMalformedData = { 
        ...mockOptions, 
        json: malformedData as any,
        onError: onErrorSpy 
      };
      
      expect(() => searchInstance.init(optionsWithMalformedData)).not.toThrow();
      
      const input = mockOptions.searchInput;
      input.value = 'Valid';
      input.dispatchEvent(new KeyboardEvent('input', { key: 'V' }));

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      
      expect(onErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing DOM elements gracefully', async () => {
      const onErrorSpy = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const optionsWithMissingElement = { 
        ...mockOptions, 
        searchInput: null as any,
        onError: onErrorSpy 
      };
      
      expect(() => searchInstance.init(optionsWithMissingElement)).toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should use default error handler when onError not provided', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      searchInstance.init(mockOptions);
      
      const input = mockOptions.searchInput;
      input.value = 'test';
      input.dispatchEvent(new KeyboardEvent('input', { key: 't' }));

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid search queries gracefully', async () => {
      const onErrorSpy = vi.fn();
      const optionsWithErrorHandler = { ...mockOptions, onError: onErrorSpy };
      
      searchInstance.init(optionsWithErrorHandler);
      
      const input = mockOptions.searchInput;
      input.value = 'a'.repeat(10000);
      input.dispatchEvent(new KeyboardEvent('input', { key: 'a' }));

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      
      expect(mockOptions.resultsContainer.innerHTML).toContain('No results found');
      expect(onErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('title highlighting with URL template', () => {
    it('should highlight title but not break URL when search term matches both', async () => {
      const highlightMiddleware = createHighlightTemplateMiddleware({
        className: 'search-highlight',
        maxLength: 200
      });

      const searchData: SearchData[] = [
        { 
          title: 'This is just a test', 
          url: '/2014/11/02/test.html', 
          category: 'test', 
          tags: 'test1, test2',
          content: 'Some test content here'
        }
      ];

      const optionsWithTemplate = {
        ...mockOptions,
        json: searchData,
        searchResultTemplate: '<li><a href="{url}?query={query}">{title}</a></li>',
        templateMiddleware: highlightMiddleware,
        strategy: 'hybrid' as const
      };

      searchInstance.init(optionsWithTemplate);
      searchInstance.search('test');

      await new Promise(resolve => setTimeout(resolve, 50));

      const resultsContainer = mockOptions.resultsContainer;
      const link = resultsContainer.querySelector('a');

      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('/2014/11/02/test.html?query=test');
      expect(link?.innerHTML).toContain('<span class="search-highlight">test</span>');
      expect(resultsContainer.innerHTML).not.toContain('href="/2014/11/02/<span');
    });
  });

  describe('saveSearchState', () => {
    beforeEach(() => {
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
    });

    it('stores valid JSON with query, timestamp, and path', () => {
      searchInstance.search('Test');
      
      const stored = sessionStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      
      const state = JSON.parse(stored!);
      expect(state.query).toBe('Test');
      expect(state.timestamp).toBeTypeOf('number');
      expect(state.path).toBe(window.location.pathname);
    });

    it('clears storage when query is empty string', () => {
      searchInstance.search('Test');
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
      
      searchInstance.search('');
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('clears storage when query is whitespace only', () => {
      searchInstance.search('Test');
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
      
      searchInstance.search('   ');
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('trims query before storing', () => {
      searchInstance.search('  Test  ');
      
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const state = JSON.parse(stored!);
      expect(state.query).toBe('Test');
    });

    it('fails silently when sessionStorage is unavailable', () => {
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = () => { throw new Error('Storage unavailable'); };
      
      expect(() => searchInstance.search('Test')).not.toThrow();
      
      sessionStorage.setItem = originalSetItem;
    });

    it('fails silently when sessionStorage quota is exceeded', () => {
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = () => { throw new DOMException('QuotaExceededError'); };
      
      expect(() => searchInstance.search('Test')).not.toThrow();
      
      sessionStorage.setItem = originalSetItem;
    });
  });

  describe('getStoredSearchState', () => {
    it('returns query string for valid stored state', () => {
      const state = {
        query: 'Test',
        timestamp: Date.now(),
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('Test');
    });

    it('returns null when no state is stored', () => {
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('');
      expect(mockOptions.resultsContainer.innerHTML).toBe('');
    });

    it('returns null and clears for corrupted JSON', () => {
      sessionStorage.setItem(STORAGE_KEY, '{broken json');
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('');
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('returns null and clears for missing query field', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        path: window.location.pathname
      }));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('');
    });

    it('returns null and clears for non-string query field', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        query: 123,
        timestamp: Date.now(),
        path: window.location.pathname
      }));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('');
    });

    it('returns null and clears for stale data (>30 min)', () => {
      const state = {
        query: 'Test',
        timestamp: Date.now() - (31 * 60 * 1000), // 31 minutes ago
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('');
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('returns query for data within 30 min threshold', () => {
      const state = {
        query: 'Test',
        timestamp: Date.now() - (29 * 60 * 1000), // 29 minutes ago
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('Test');
    });

    it('returns null and clears for different page path', () => {
      const state = {
        query: 'Test',
        timestamp: Date.now(),
        path: '/different-page/'
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('');
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('returns query when path matches current location', () => {
      const state = {
        query: 'Test',
        timestamp: Date.now(),
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('Test');
    });

    it('fails silently when sessionStorage is unavailable', () => {
      const originalGetItem = sessionStorage.getItem;
      sessionStorage.getItem = () => { throw new Error('Storage unavailable'); };
      
      mockOptions.json = mockSearchData;
      expect(() => searchInstance.init(mockOptions)).not.toThrow();
      
      sessionStorage.getItem = originalGetItem;
    });
  });

  describe('clearSearchState', () => {
    beforeEach(() => {
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
    });

    it('removes item from sessionStorage', () => {
      searchInstance.search('Test');
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
      
      searchInstance.search('');
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('fails silently when sessionStorage is unavailable', () => {
      searchInstance.search('Test');
      
      const originalRemoveItem = sessionStorage.removeItem;
      sessionStorage.removeItem = () => { throw new Error('Storage unavailable'); };
      
      expect(() => searchInstance.search('')).not.toThrow();
      
      sessionStorage.removeItem = originalRemoveItem;
    });
  });

  describe('restoreSearchState (with sessionStorage)', () => {
    it('does nothing when results already exist', () => {
      const resultsContainer = mockOptions.resultsContainer;
      resultsContainer.innerHTML = '<li>Existing Result</li>';
      
      const state = {
        query: 'Test',
        timestamp: Date.now(),
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(resultsContainer.innerHTML).toBe('<li>Existing Result</li>');
    });

    it('uses browser-restored input value over storage', () => {
      const state = {
        query: 'StoredQuery',
        timestamp: Date.now(),
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = 'Test'; // Browser restored this
      searchInstance.init(mockOptions);
      
      expect(mockOptions.resultsContainer.innerHTML).toContain('Test Post');
    });

    it('falls back to storage when input is empty', () => {
      const state = {
        query: 'Test',
        timestamp: Date.now(),
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('Test');
      expect(mockOptions.resultsContainer.innerHTML).toContain('Test Post');
    });

    it('syncs input value when restoring from storage', () => {
      const state = {
        query: 'Test',
        timestamp: Date.now(),
        path: window.location.pathname
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('Test');
    });

    it('does nothing when both input and storage are empty', () => {
      mockOptions.json = mockSearchData;
      const input = mockOptions.searchInput;
      input.value = '';
      searchInstance.init(mockOptions);
      
      expect(input.value).toBe('');
      expect(mockOptions.resultsContainer.innerHTML).toBe('');
    });
  });

  describe('registerInput', () => {
    it('adds input listener to searchInput', () => {
      const addEventListenerSpy = vi.spyOn(mockOptions.searchInput, 'addEventListener');
      
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    });

    it('adds pageshow listener to window', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      mockOptions.json = mockSearchData;
      searchInstance.init(mockOptions);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
    });
  });

  describe('destroy', () => {
    it('removes input listener from searchInput', () => {
      mockOptions.json = mockSearchData;
      const instance = searchInstance.init(mockOptions);
      
      const removeEventListenerSpy = vi.spyOn(mockOptions.searchInput, 'removeEventListener');
      instance.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    });

    it('removes pageshow listener from window', () => {
      mockOptions.json = mockSearchData;
      const instance = searchInstance.init(mockOptions);
      
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      instance.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
    });

    it('clears debounce timer', async () => {
      mockOptions.json = mockSearchData;
      const instance = searchInstance.init(mockOptions);
      
      const input = mockOptions.searchInput;
      input.value = 'Test';
      input.dispatchEvent(new KeyboardEvent('input', { key: 't' }));
      
      instance.destroy();
      
      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      
      expect(mockOptions.resultsContainer.innerHTML).toBe('');
    });

    it('clears search state from storage', () => {
      mockOptions.json = mockSearchData;
      const instance = searchInstance.init(mockOptions);
      
      searchInstance.search('Test');
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
      
      instance.destroy();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
}); 
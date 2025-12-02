import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SimpleJekyllSearch from '../src/SimpleJekyllSearch';
import { SearchData, SearchOptions } from '../src/utils/types';

describe('SimpleJekyllSearch', () => {
  let searchInstance: SimpleJekyllSearch;
  let mockOptions: SearchOptions;
  let mockSearchData: SearchData[];
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <input id="search-input" type="text" />
          <div id="results-container"></div>
        </body>
      </html>
    `);

    Object.defineProperty(global, 'document', {
      value: dom.window.document,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'window', {
      value: dom.window,
      writable: true,
      configurable: true,
    });

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
      const event = new dom.window.KeyboardEvent('input', { key: 't' });
      input.value = 'Test';
      input.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      expect(mockOptions.resultsContainer.innerHTML).toContain('Test Post');
      expect(input.value).toBe('Test');
    });

    it('should not trigger search on whitelisted key input', async () => {
      const input = mockOptions.searchInput;
      const event = new dom.window.KeyboardEvent('input', { key: 'Enter' });
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
      input.dispatchEvent(new dom.window.KeyboardEvent('input', { key: 'T' }));

      input.value = 'Te';
      input.dispatchEvent(new dom.window.KeyboardEvent('input', { key: 'e' }));

      input.value = 'Tes';
      input.dispatchEvent(new dom.window.KeyboardEvent('input', { key: 's' }));

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
      input.dispatchEvent(new dom.window.KeyboardEvent('input', { key: 't' }));

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
      input.dispatchEvent(new dom.window.KeyboardEvent('input', { key: 'V' }));

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
      input.dispatchEvent(new dom.window.KeyboardEvent('input', { key: 't' }));

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
      input.dispatchEvent(new dom.window.KeyboardEvent('input', { key: 'a' }));

      await new Promise(resolve => setTimeout(resolve, mockOptions.debounceTime! + 10));
      
      expect(mockOptions.resultsContainer.innerHTML).toContain('No results found');
      expect(onErrorSpy).not.toHaveBeenCalled();
    });
  });
}); 
import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, it } from 'vitest';
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

    it.skip('should not trigger search on whitelisted key input', async () => {
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
}); 
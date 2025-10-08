import { describe, it, expect } from 'vitest';
import { createHighlightMiddleware, highlightText, HighlightOptions } from '../src/utils/highlightMiddleware';

describe('highlightText', () => {
  it('should highlight single match with default options', () => {
    const text = 'This is a test search result';
    const query = 'search';
    const result = highlightText(text, query);
    
    expect(result.highlightedText).toBe('This is a test <span class="sjs-highlight">search</span> result');
    expect(result.matchCount).toBe(1);
  });

  it('should highlight multiple matches', () => {
    const text = 'This search result contains search terms';
    const query = 'search';
    const result = highlightText(text, query);
    
    expect(result.highlightedText).toBe('This <span class="sjs-highlight">search</span> result contains <span class="sjs-highlight">search</span> terms');
    expect(result.matchCount).toBe(2);
  });

  it('should handle case insensitive matching', () => {
    const text = 'This is a Search result';
    const query = 'search';
    const result = highlightText(text, query);
    
    expect(result.highlightedText).toBe('This is a <span class="sjs-highlight">Search</span> result');
    expect(result.matchCount).toBe(1);
  });

  it('should handle multiple search terms', () => {
    const text = 'This is a test search result with multiple terms';
    const query = 'search result';
    const result = highlightText(text, query);
    
    expect(result.highlightedText).toBe('This is a test <span class="sjs-highlight">search</span> <span class="sjs-highlight">result</span> with multiple terms');
    expect(result.matchCount).toBe(2);
  });

  it('should provide context around matches', () => {
    const text = 'This is a very long text that contains a search term in the middle of it';
    const query = 'search';
    const options: HighlightOptions = {
      contextBefore: 10,
      contextAfter: 10,
      maxLength: 50
    };
    const result = highlightText(text, query, options);
    
    expect(result.highlightedText).toContain('<span class="sjs-highlight">search</span>');
    // The text is long enough to trigger context mode
    expect(result.matchCount).toBe(1);
    // Should show context around the match
    expect(result.highlightedText.length).toBeLessThan(text.length);
  });

  it('should respect maxLength option', () => {
    const text = 'This is a very long text that contains a search term in the middle of it and continues with more text and even more text to make it really long';
    const query = 'search';
    const options: HighlightOptions = {
      maxLength: 30
    };
    const result = highlightText(text, query, options);
    
    // The result should be truncated
    expect(result.highlightedText).toContain('<span class="sjs-highlight">search</span>');
    // The result should be significantly shorter than the original text
    expect(result.highlightedText.length).toBeLessThan(text.length);
  });

  it('should use custom highlight class', () => {
    const text = 'This is a test search result';
    const query = 'search';
    const options: HighlightOptions = {
      highlightClass: 'custom-highlight'
    };
    const result = highlightText(text, query, options);
    
    expect(result.highlightedText).toBe('This is a test <span class="custom-highlight">search</span> result');
  });

  it('should handle empty query', () => {
    const text = 'This is a test search result';
    const query = '';
    const result = highlightText(text, query);
    
    expect(result.highlightedText).toBe(text);
    expect(result.matchCount).toBe(0);
  });

  it('should handle empty text', () => {
    const text = '';
    const query = 'search';
    const result = highlightText(text, query);
    
    expect(result.highlightedText).toBe('');
    expect(result.matchCount).toBe(0);
  });

  it('should merge overlapping matches', () => {
    const text = 'searching for search';
    const query = 'search';
    const result = highlightText(text, query);
    
    // Should merge the overlapping "search" matches
    expect(result.highlightedText).toBe('<span class="sjs-highlight">search</span>ing for <span class="sjs-highlight">search</span>');
    expect(result.matchCount).toBe(2);
  });
});

describe('createHighlightMiddleware', () => {
  it('should create a middleware function that processes search results', () => {
    const middleware = createHighlightMiddleware();
    const result = {
      title: 'Test Title',
      desc: 'This is a test description with search terms',
      url: '/test'
    };
    const query = 'search';
    
    const processed = middleware(result, query);
    
    expect(processed.title).toBe('Test Title'); // Should not be modified
    expect(processed.desc).toContain('<span class="sjs-highlight">search</span>');
    expect(processed.url).toBe('/test'); // Should not be modified
  });

  it('should handle custom options', () => {
    const middleware = createHighlightMiddleware({
      highlightClass: 'custom-highlight',
      contextBefore: 5,
      contextAfter: 5
    });
    const result = {
      title: 'Test Title',
      desc: 'This is a test description with search terms',
      url: '/test'
    };
    const query = 'search';
    
    const processed = middleware(result, query);
    
    expect(processed.desc).toContain('<span class="custom-highlight">search</span>');
  });

  it('should not modify non-string fields', () => {
    const middleware = createHighlightMiddleware();
    const result = {
      title: 'Test Title',
      desc: 'This is a test description with search terms',
      url: '/test',
      tags: ['tag1', 'tag2'],
      date: new Date('2023-01-01')
    };
    const query = 'search';
    
    const processed = middleware(result, query);
    
    expect(processed.tags).toEqual(['tag1', 'tag2']);
    expect(processed.date).toBeInstanceOf(Date);
  });

  it('should handle empty query', () => {
    const middleware = createHighlightMiddleware();
    const result = {
      title: 'Test Title',
      desc: 'This is a test description',
      url: '/test'
    };
    const query = '';
    
    const processed = middleware(result, query);
    
    expect(processed).toEqual(result);
  });

  it('should handle null/undefined result', () => {
    const middleware = createHighlightMiddleware();
    const result = null;
    const query = 'search';
    
    const processed = middleware(result, query);
    
    expect(processed).toBeNull();
  });
});

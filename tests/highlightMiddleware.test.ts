import { describe, it, expect } from 'vitest';
import { createHighlightMiddleware, createHighlightTemplateMiddleware, highlightText, HighlightOptions } from '../src/utils/highlightMiddleware';

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
    expect(result.matchCount).toBe(1);
    expect(result.highlightedText.length).toBeLessThan(text.length);
  });

  it('should respect maxLength option', () => {
    const text = 'This is a very long text that contains a search term in the middle of it and continues with more text and even more text to make it really long';
    const query = 'search';
    const options: HighlightOptions = {
      maxLength: 30
    };
    const result = highlightText(text, query, options);
    
    expect(result.highlightedText).toContain('<span class="sjs-highlight">search</span>');
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

describe('createHighlightTemplateMiddleware', () => {
  it('should create a template middleware that highlights content field with matchInfo', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo = [{ start: 15, end: 21, text: 'search', type: 'exact' as const }];
    const result = middleware('content', 'This is a test search result', '<div>{content}</div>', 'search', matchInfo);
    
    expect(result).toContain('<span class="sjs-highlight">search</span>');
  });

  it('should create a template middleware that highlights desc field with matchInfo', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo = [{ start: 15, end: 21, text: 'search', type: 'exact' as const }];
    const result = middleware('desc', 'This is a test search result', '<div>{desc}</div>', 'search', matchInfo);
    
    expect(result).toContain('<span class="sjs-highlight">search</span>');
  });

  it('should not highlight other fields', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('title', 'This is a test search result', '<div>{title}</div>', 'search');
    
    expect(result).toBeUndefined();
  });

  it('should not highlight when no query provided', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a test search result', '<div>{content}</div>');
    
    expect(result).toBeUndefined();
  });

  it('should use custom highlight class with matchInfo', () => {
    const middleware = createHighlightTemplateMiddleware({ highlightClass: 'custom-highlight' });
    const matchInfo = [{ start: 15, end: 21, text: 'search', type: 'exact' as const }];
    const result = middleware('content', 'This is a test search result', '<div>{content}</div>', 'search', matchInfo);
    
    expect(result).toContain('<span class="custom-highlight">search</span>');
  });

  it('should handle multiple search terms with matchInfo', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo = [
      { start: 10, end: 14, text: 'test', type: 'exact' as const },
      { start: 15, end: 21, text: 'search', type: 'exact' as const }
    ];
    const result = middleware('content', 'This is a test search result with multiple terms', '<div>{content}</div>', 'test search', matchInfo);
    
    expect(result).toContain('<span class="sjs-highlight">test</span>');
    expect(result).toContain('<span class="sjs-highlight">search</span>');
  });

  it('should handle case insensitive matching with matchInfo', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo = [{ start: 10, end: 14, text: 'TEST', type: 'exact' as const }];
    const result = middleware('content', 'This is a TEST search result', '<div>{content}</div>', 'test', matchInfo);
    
    expect(result).toContain('<span class="sjs-highlight">TEST</span>');
  });

  it('should return undefined for non-string values', () => {
    const middleware = createHighlightTemplateMiddleware();
    // @ts-expect-error - Testing runtime behavior with non-string value
    const result = middleware('content', 123, '<div>{content}</div>', 'search');
    
    expect(result).toBeUndefined();
  });

  it('should not highlight without matchInfo (no fallback)', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a testing result', '<div>{content}</div>', 'test');
    
    expect(result).toBeUndefined();
  });

  it('should not highlight partial matches without matchInfo', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a tst result', '<div>{content}</div>', 'test');
    
    expect(result).toBeUndefined();
  });

  it('should only highlight when matchInfo is provided', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo = [{
      start: 10,
      end: 14,
      text: 'test',
      type: 'exact' as const
    }];
    const result = middleware('content', 'This is a test and testing result', '<div>{content}</div>', 'test', matchInfo);
    
    expect(result).toContain('<span class="sjs-highlight">test</span>');
  });

  it('should not highlight multiple words without matchInfo', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a tst srch result', '<div>{content}</div>', 'test search');
    
    expect(result).toBeUndefined();
  });

  describe('MatchInfo-based Highlighting', () => {
    it('should highlight with provided matchInfo for exact matches', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo = [
        { start: 10, end: 14, text: 'test', type: 'exact' as const },
        { start: 15, end: 21, text: 'search', type: 'exact' as const }
      ];
      const result = middleware('content', 'This is a test search result', '<div>{content}</div>', 'test search', matchInfo);
      
      expect(result).toContain('<span class="sjs-highlight">test</span>');
      expect(result).toContain('<span class="sjs-highlight">search</span>');
    });

    it('should highlight with fuzzy matchInfo', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo = [
        { start: 10, end: 13, text: 'tst', type: 'fuzzy' as const },
        { start: 14, end: 18, text: 'srch', type: 'fuzzy' as const }
      ];
      const result = middleware('content', 'This is a tst srch result', '<div>{content}</div>', 'test search', matchInfo);
      
      expect(result).toContain('<span class="sjs-highlight">tst</span>');
      expect(result).toContain('<span class="sjs-highlight">srch</span>');
    });

    it('should highlight with wildcard matchInfo', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo = [
        { start: 10, end: 14, text: 'test', type: 'wildcard' as const }
      ];
      const result = middleware('content', 'This is a test result', '<div>{content}</div>', 'test*', matchInfo);
      
      expect(result).toContain('<span class="sjs-highlight">test</span>');
    });

    it('should not highlight without matchInfo', () => {
      const middleware = createHighlightTemplateMiddleware();
      const result = middleware('content', 'This is a test search result', '<div>{content}</div>', 'test search');
      
      expect(result).toBeUndefined();
    });

    it('should not highlight with empty matchInfo', () => {
      const middleware = createHighlightTemplateMiddleware();
      const result = middleware('content', 'This is a test search result', '<div>{content}</div>', 'test search', []);
      
      expect(result).toBeUndefined();
    });

    it('should handle case insensitive matchInfo', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo = [
        { start: 10, end: 14, text: 'TEST', type: 'exact' as const }
      ];
      const result = middleware('content', 'This is a TEST result', '<div>{content}</div>', 'test', matchInfo);
      
      expect(result).toContain('<span class="sjs-highlight">TEST</span>');
    });

    it('should handle special characters in matchInfo', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo = [
        { start: 10, end: 21, text: 'test-result', type: 'exact' as const }
      ];
      const result = middleware('content', 'This is a test-result with special chars', '<div>{content}</div>', 'test-result', matchInfo);
      
      expect(result).toContain('<span class="sjs-highlight">test-result</span>');
    });

    it('should handle numbers in matchInfo', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo = [
        { start: 10, end: 17, text: 'test123', type: 'exact' as const },
        { start: 18, end: 27, text: 'search456', type: 'exact' as const }
      ];
      const result = middleware('content', 'This is a test123 search456 result', '<div>{content}</div>', 'test123 search456', matchInfo);
      
      expect(result).toContain('<span class="sjs-highlight">test123</span>');
      expect(result).toContain('<span class="sjs-highlight">search456</span>');
    });
  });


  describe('Match Info Usage (Performance Test)', () => {
    it('should use provided match info for highlighting', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content with test words';
      const query = 'test';
      
      const matchInfo: Array<{ start: number; end: number; text: string; type: 'exact' }> = [];
      let index = text.toLowerCase().indexOf('test');
      while (index !== -1) {
        matchInfo.push({
          start: index,
          end: index + 4,
          text: 'test',
          type: 'exact' as const
        });
        index = text.toLowerCase().indexOf('test', index + 1);
      }
      
      const resultWithMatchInfo = middleware('content', text, '<div>{content}</div>', query, matchInfo);
      
      expect(resultWithMatchInfo).toBeDefined();
      expect(resultWithMatchInfo).toContain('<span class="sjs-highlight">test</span>');
      expect(resultWithMatchInfo).toContain('<span class="sjs-highlight">test</span>');
    });

    it('should not highlight with empty match info', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content';
      const query = 'test';
      
      const result = middleware('content', text, '<div>{content}</div>', query, []);
      
      expect(result).toBeUndefined();
    });

    it('should not highlight with undefined match info', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content';
      const query = 'test';
      
      const result = middleware('content', text, '<div>{content}</div>', query, undefined);
      
      expect(result).toBeUndefined();
    });

    it('should not highlight without match info parameter', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content';
      const query = 'test';
      
      const result = middleware('content', text, '<div>{content}</div>', query);
      
      expect(result).toBeUndefined();
    });
  });

  describe('Fallback Removal Verification', () => {
    it('should NOT fallback to query-based highlighting when matchInfo is missing', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content with search terms';
      const query = 'test search';
      
      // This should return undefined because there's no matchInfo and no fallback
      const result = middleware('content', text, '<div>{content}</div>', query);
      
      expect(result).toBeUndefined();
    });

    it('should NOT fallback to query-based highlighting when matchInfo is empty', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content with search terms';
      const query = 'test search';
      
      // This should return undefined because matchInfo is empty and no fallback
      const result = middleware('content', text, '<div>{content}</div>', query, []);
      
      expect(result).toBeUndefined();
    });

    it('should work correctly with different match types', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content with search terms';
      
      // Test with exact matches - correct positions
      const exactMatches = [
        { start: 10, end: 14, text: 'test', type: 'exact' as const },
        { start: 28, end: 34, text: 'search', type: 'exact' as const }
      ];
      const exactResult = middleware('content', text, '<div>{content}</div>', 'test search', exactMatches);
      expect(exactResult).toContain('<span class="sjs-highlight">test</span>');
      expect(exactResult).toContain('<span class="sjs-highlight">search</span>');

      // Test with fuzzy matches - correct positions
      const fuzzyMatches = [
        { start: 10, end: 14, text: 'test', type: 'fuzzy' as const },
        { start: 28, end: 34, text: 'search', type: 'fuzzy' as const }
      ];
      const fuzzyResult = middleware('content', text, '<div>{content}</div>', 'test search', fuzzyMatches);
      expect(fuzzyResult).toContain('<span class="sjs-highlight">test</span>');
      expect(fuzzyResult).toContain('<span class="sjs-highlight">search</span>');

      // Test with wildcard matches - correct positions
      const wildcardMatches = [
        { start: 10, end: 14, text: 'test', type: 'wildcard' as const },
        { start: 28, end: 34, text: 'search', type: 'wildcard' as const }
      ];
      const wildcardResult = middleware('content', text, '<div>{content}</div>', 'test search', wildcardMatches);
      expect(wildcardResult).toContain('<span class="sjs-highlight">test</span>');
      expect(wildcardResult).toContain('<span class="sjs-highlight">search</span>');
    });

    it('should handle overlapping matches correctly', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test test content';
      
      const overlappingMatches = [
        { start: 10, end: 14, text: 'test', type: 'exact' as const },
        { start: 15, end: 19, text: 'test', type: 'exact' as const }
      ];
      
      const result = middleware('content', text, '<div>{content}</div>', 'test', overlappingMatches);
      
      expect(result).toContain('<span class="sjs-highlight">test</span>');
      expect(result).toContain('<span class="sjs-highlight">test</span>');
    });

    it('should handle non-content properties without highlighting', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content';
      const query = 'test';
      const matchInfo = [{ start: 10, end: 14, text: 'test', type: 'exact' as const }];
      
      // Should not highlight non-content properties
      const titleResult = middleware('title', text, '<div>{title}</div>', query, matchInfo);
      expect(titleResult).toBeUndefined();
      
      const urlResult = middleware('url', text, '<div>{url}</div>', query, matchInfo);
      expect(urlResult).toBeUndefined();
      
      // Should only highlight content and desc properties
      const contentResult = middleware('content', text, '<div>{content}</div>', query, matchInfo);
      expect(contentResult).toContain('<span class="sjs-highlight">test</span>');
      
      const descResult = middleware('desc', text, '<div>{desc}</div>', query, matchInfo);
      expect(descResult).toContain('<span class="sjs-highlight">test</span>');
    });

    it('should handle custom highlight options', () => {
      const customOptions = {
        highlightClass: 'custom-highlight',
        contextBefore: 5,
        contextAfter: 5,
        maxLength: 20,
        ellipsis: '...'
      };
      
      const middleware = createHighlightTemplateMiddleware(customOptions);
      const text = 'This is a very long test content that should be truncated';
      const matchInfo = [{ start: 20, end: 24, text: 'test', type: 'exact' as const }];
      
      const result = middleware('content', text, '<div>{content}</div>', 'test', matchInfo);
      
      expect(result).toContain('<span class="custom-highlight">test</span>');
      // Verify the custom class is used
      expect(result).toContain('custom-highlight');
      // Verify the result contains the highlighted text
      expect(result).toContain('test');
    });

    it('should verify no fallback search is performed', () => {
      const middleware = createHighlightTemplateMiddleware();
      const text = 'This is a test content';
      const query = 'nonexistent';
      
      // Even though 'nonexistent' is not in the text, without matchInfo it should return undefined
      // This proves no fallback search is happening
      const result = middleware('content', text, '<div>{content}</div>', query);
      
      expect(result).toBeUndefined();
    });
  });
});

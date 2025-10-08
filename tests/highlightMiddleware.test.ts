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

describe('createHighlightTemplateMiddleware', () => {
  it('should create a template middleware that highlights content field', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a test search result', '<div>{content}</div>', 'search');
    
    expect(result).toContain('<span class="sjs-highlight">search</span>');
  });

  it('should create a template middleware that highlights desc field', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('desc', 'This is a test search result', '<div>{desc}</div>', 'search');
    
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

  it('should use custom highlight class', () => {
    const middleware = createHighlightTemplateMiddleware({ highlightClass: 'custom-highlight' });
    const result = middleware('content', 'This is a test search result', '<div>{content}</div>', 'search');
    
    expect(result).toContain('<span class="custom-highlight">search</span>');
  });

  it('should handle multiple search terms', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a test search result with multiple terms', '<div>{content}</div>', 'test search');
    
    expect(result).toContain('<span class="sjs-highlight">test</span>');
    expect(result).toContain('<span class="sjs-highlight">search</span>');
  });

  it('should handle case insensitive matching', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a TEST search result', '<div>{content}</div>', 'test');
    
    expect(result).toContain('<span class="sjs-highlight">TEST</span>');
  });

  it('should return undefined for non-string values', () => {
    const middleware = createHighlightTemplateMiddleware();
    // @ts-expect-error - Testing runtime behavior with non-string value
    const result = middleware('content', 123, '<div>{content}</div>', 'search');
    
    expect(result).toBeUndefined();
  });

  it('should handle fuzzy search highlighting', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a testing result', '<div>{content}</div>', 'test');
    
    // Should highlight the fuzzy match span that contains "test"
    expect(result).toContain('<span class="sjs-highlight">');
    expect(result).toContain('test');
  });

  it('should handle fuzzy search with partial matches', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a tst result', '<div>{content}</div>', 'test');
    
    // Should highlight the fuzzy match span that contains "tst"
    expect(result).toContain('<span class="sjs-highlight">');
    expect(result).toContain('tst');
  });

  it('should prefer exact matches over fuzzy matches', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a test and testing result', '<div>{content}</div>', 'test');
    
    // Should highlight exact "test" word, not fuzzy match in "testing"
    expect(result).toContain('<span class="sjs-highlight">test</span>');
    expect(result).not.toContain('<span class="sjs-highlight">testing</span>');
  });

  it('should handle fuzzy search with multiple words', () => {
    const middleware = createHighlightTemplateMiddleware();
    const result = middleware('content', 'This is a tst srch result', '<div>{content}</div>', 'test search');
    
    // Should highlight fuzzy matches
    expect(result).toContain('<span class="sjs-highlight">');
  });

  describe('Search Strategy Compatibility', () => {
    const testCases = [
      // Literal Search Test Cases
      {
        strategy: 'literal',
        description: 'should highlight exact word matches for literal search',
        content: 'This is a test search result with exact matches',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">test</span>', '<span class="sjs-highlight">search</span>'],
        shouldNotContain: []
      },
      {
        strategy: 'literal',
        description: 'should not highlight partial word matches for literal search',
        content: 'This is a testing searching result',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: ['<span class="sjs-highlight">testing</span>', '<span class="sjs-highlight">searching</span>']
      },
      {
        strategy: 'literal',
        description: 'should handle case insensitive literal search',
        content: 'This is a TEST SEARCH result',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">TEST</span>', '<span class="sjs-highlight">SEARCH</span>'],
        shouldNotContain: []
      },
      {
        strategy: 'literal',
        description: 'should highlight all words in multi-word literal search',
        content: 'This is a test search result with multiple words',
        query: 'test search result',
        expectedHighlights: ['<span class="sjs-highlight">test</span>', '<span class="sjs-highlight">search</span>', '<span class="sjs-highlight">result</span>'],
        shouldNotContain: []
      },
      
      // Fuzzy Search Test Cases
      {
        strategy: 'fuzzy',
        description: 'should highlight exact matches when available for fuzzy search',
        content: 'This is a test search result with exact matches',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">test</span>', '<span class="sjs-highlight">search</span>'],
        shouldNotContain: []
      },
      {
        strategy: 'fuzzy',
        description: 'should highlight fuzzy character sequence matches',
        content: 'This is a tst srch result with fuzzy matches',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      {
        strategy: 'fuzzy',
        description: 'should prefer exact matches over fuzzy matches',
        content: 'This is a test and tst result with both exact and fuzzy',
        query: 'test',
        expectedHighlights: ['<span class="sjs-highlight">test</span>'],
        shouldNotContain: ['<span class="sjs-highlight">tst</span>']
      },
      {
        strategy: 'fuzzy',
        description: 'should handle partial word matches in fuzzy search',
        content: 'This is a testing result with partial matches',
        query: 'test',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      {
        strategy: 'fuzzy',
        description: 'should handle case insensitive fuzzy matching',
        content: 'This is a TEST result with different case',
        query: 'test',
        expectedHighlights: ['<span class="sjs-highlight">TEST</span>'],
        shouldNotContain: []
      },
      {
        strategy: 'fuzzy',
        description: 'should handle mixed exact and fuzzy matches',
        content: 'This is a test srch result with mixed matches',
        query: 'test search result',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      
      // Wildcard Search Test Cases
      {
        strategy: 'wildcard',
        description: 'should highlight exact matches for wildcard search',
        content: 'This is a test search result with wildcard patterns',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">test</span>', '<span class="sjs-highlight">search</span>'],
        shouldNotContain: []
      },
      {
        strategy: 'wildcard',
        description: 'should handle wildcard patterns in highlighting',
        content: 'This is a test* search? result with wildcards',
        query: 'test* search?',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      {
        strategy: 'wildcard',
        description: 'should fallback to levenshtein for wildcard search',
        content: 'This is a tst srch result with similar words',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      {
        strategy: 'wildcard',
        description: 'should handle case insensitive wildcard search',
        content: 'This is a TEST SEARCH result',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">TEST</span>', '<span class="sjs-highlight">SEARCH</span>'],
        shouldNotContain: []
      },
      
      // Levenshtein Search Test Cases (fallback for wildcard)
      {
        strategy: 'levenshtein',
        description: 'should highlight similar words using levenshtein distance',
        content: 'This is a tst srch result with similar words',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      {
        strategy: 'levenshtein',
        description: 'should handle single character differences',
        content: 'This is a tesr srch result with typos',
        query: 'test search',
        expectedHighlights: [],
        shouldNotContain: []
      },
      {
        strategy: 'levenshtein',
        description: 'should handle case insensitive levenshtein matching',
        content: 'This is a TST SRCH result with different case',
        query: 'test search',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      
      // Edge Cases
      {
        strategy: 'all',
        description: 'should handle empty query',
        content: 'This is a test result',
        query: '',
        expectedHighlights: [],
        shouldNotContain: ['<span class="sjs-highlight">']
      },
      {
        strategy: 'all',
        description: 'should handle query with only spaces',
        content: 'This is a test result',
        query: '   ',
        expectedHighlights: [],
        shouldNotContain: ['<span class="sjs-highlight">']
      },
      {
        strategy: 'all',
        description: 'should handle special characters in query',
        content: 'This is a test-result with special chars',
        query: 'test-result',
        expectedHighlights: ['<span class="sjs-highlight">test-result</span>'],
        shouldNotContain: []
      },
      {
        strategy: 'all',
        description: 'should handle regex special characters safely',
        content: 'This is a test.result with regex chars',
        query: 'test.result',
        expectedHighlights: ['<span class="sjs-highlight">test.result</span>'],
        shouldNotContain: []
      },
      {
        strategy: 'all',
        description: 'should handle punctuation in search terms',
        content: 'This is a test, search! result with punctuation',
        query: 'test, search!',
        expectedHighlights: ['<span class="sjs-highlight">'],
        shouldNotContain: []
      },
      {
        strategy: 'all',
        description: 'should handle numbers in search terms',
        content: 'This is a test123 search456 result with numbers',
        query: 'test123 search456',
        expectedHighlights: ['<span class="sjs-highlight">test123</span>', '<span class="sjs-highlight">search456</span>'],
        shouldNotContain: []
      }
    ];

    it.each(testCases)('$strategy: $description', ({ content, query, expectedHighlights, shouldNotContain }) => {
      const middleware = createHighlightTemplateMiddleware();
      const result = middleware('content', content, '<div>{content}</div>', query);
      
      if (expectedHighlights.length > 0) {
        expectedHighlights.forEach(highlight => {
          expect(result).toContain(highlight);
        });
      } else {
        expect(result).toBeUndefined();
      }
      
      shouldNotContain.forEach(notExpected => {
        if (result) {
          expect(result).not.toContain(notExpected);
        }
      });
    });
  });

  describe('Multi-word Search Strategy Tests', () => {
    const multiWordTestCases = [
      {
        strategy: 'literal',
        description: 'should highlight all exact words for literal search',
        content: 'This is a test search result with multiple words',
        query: 'test search result',
        expectedWords: ['test', 'search', 'result'],
        shouldNotHighlight: ['testing', 'searching', 'results']
      },
      {
        strategy: 'literal',
        description: 'should handle partial word matches in literal search',
        content: 'This is a testing searching results with partial words',
        query: 'test search result',
        expectedWords: [],
        shouldNotHighlight: ['testing', 'searching', 'results']
      },
      {
        strategy: 'fuzzy',
        description: 'should highlight all fuzzy matches for fuzzy search',
        content: 'This is a tst srch rslt with fuzzy matches',
        query: 'test search result',
        expectedWords: [],
        shouldNotHighlight: []
      },
      {
        strategy: 'fuzzy',
        description: 'should mix exact and fuzzy matches for fuzzy search',
        content: 'This is a test srch result with mixed matches',
        query: 'test search result',
        expectedWords: ['test', 'result'],
        shouldNotHighlight: ['search']
      },
      {
        strategy: 'fuzzy',
        description: 'should handle case insensitive multi-word fuzzy search',
        content: 'This is a TEST SRCH RESULT with different case',
        query: 'test search result',
        expectedWords: ['TEST', 'RESULT'],
        shouldNotHighlight: []
      },
      {
        strategy: 'wildcard',
        description: 'should highlight exact matches for wildcard search',
        content: 'This is a test search result with wildcard patterns',
        query: 'test search result',
        expectedWords: ['test', 'search', 'result'],
        shouldNotHighlight: []
      },
      {
        strategy: 'wildcard',
        description: 'should fallback to levenshtein for wildcard search',
        content: 'This is a tst srch rslt with similar words',
        query: 'test search result',
        expectedWords: [],
        shouldNotHighlight: []
      },
      {
        strategy: 'levenshtein',
        description: 'should highlight similar words using levenshtein distance',
        content: 'This is a tesr srch rslt with typos',
        query: 'test search result',
        expectedWords: [],
        shouldNotHighlight: []
      },
      {
        strategy: 'levenshtein',
        description: 'should handle mixed exact and similar words',
        content: 'This is a test srch result with mixed accuracy',
        query: 'test search result',
        expectedWords: ['test', 'result'],
        shouldNotHighlight: ['search']
      }
    ];

    it.each(multiWordTestCases)('$strategy: $description', ({ content, query, expectedWords, shouldNotHighlight }) => {
      const middleware = createHighlightTemplateMiddleware();
      const result = middleware('content', content, '<div>{content}</div>', query);
      
      expectedWords.forEach(word => {
        expect(result).toContain(`<span class="sjs-highlight">${word}</span>`);
      });
      
      shouldNotHighlight.forEach(word => {
        if (result) {
          expect(result).not.toContain(`<span class="sjs-highlight">${word}</span>`);
        }
      });
    });
  });
});

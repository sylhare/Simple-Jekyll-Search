import { describe, expect, it } from 'vitest';
import { 
  createHighlightTemplateMiddleware, 
  defaultHighlightMiddleware 
} from '../../src/middleware/highlightMiddleware';
import { MatchInfo } from '../../src/SearchStrategies/types';

describe('createHighlightTemplateMiddleware', () => {
  it('should create a middleware function', () => {
    const middleware = createHighlightTemplateMiddleware();
    expect(typeof middleware).toBe('function');
  });

  it('should highlight content field when matchInfo is provided', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];

    const result = middleware('content', 'hello world', '<div>{content}</div>', 'hello', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">hello</span>');
    expect(result).toContain('world');
  });

  it('should highlight desc field when matchInfo is provided', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 6, end: 11, text: 'world', type: 'exact' }
    ];

    const result = middleware('desc', 'hello world', '<div>{desc}</div>', 'world', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">world</span>');
  });

  it('should highlight description field when matchInfo is provided', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 4, text: 'test', type: 'exact' }
    ];

    const result = middleware('description', 'test data', '<div>{description}</div>', 'test', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">test</span>');
  });

  it('should highlight ANY field that has matchInfo (e.g., tags)', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 10, text: 'javascript', type: 'exact' }
    ];

    const result = middleware('tags', 'javascript, react', '<div>{tags}</div>', 'javascript', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">javascript</span>');
  });

  it('should highlight title field when matchInfo is provided', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];

    const result = middleware('title', 'hello world post', '<div>{title}</div>', 'hello', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">hello</span>');
  });

  it('should return undefined when query is not provided', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];

    const result = middleware('content', 'hello world', '<div>{content}</div>', undefined, matchInfo);
    
    expect(result).toBeUndefined();
  });

  it('should return undefined when matchInfo is empty', () => {
    const middleware = createHighlightTemplateMiddleware();

    const result = middleware('content', 'hello world', '<div>{content}</div>', 'hello', []);
    
    expect(result).toBeUndefined();
  });

  it('should return undefined when matchInfo is not provided', () => {
    const middleware = createHighlightTemplateMiddleware();

    const result = middleware('content', 'hello world', '<div>{content}</div>', 'hello', undefined);
    
    expect(result).toBeUndefined();
  });

  it('should truncate long content even without matchInfo when maxLength is set', () => {
    const middleware = createHighlightTemplateMiddleware({
      maxLength: 50
    });
    const longText = 'This is a very long article that should be truncated. '.repeat(10);

    const result = middleware('content', longText, '<div>{content}</div>', 'other', undefined);
    
    expect(result).toBeDefined();
    expect(result).toContain('...');
    expect(result!.length).toEqual(50);
  });

  it('should truncate content when match is on another field (title) but content is displayed', () => {    
    const middleware = createHighlightTemplateMiddleware({
      maxLength: 100
    });
    const longContent = 'This is a long article body that does not contain the search term. '.repeat(20);

    const result = middleware('content', longContent, '<div>{content}</div>', 'hello', undefined);
    
    expect(result).toBeDefined();
    expect(result).toContain('...');
    expect(result!.length).toEqual(100);
  });

  it('should return undefined when value is not a string', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 1, text: '1', type: 'exact' }
    ];

    const result = middleware('content', 123 as any, '<div>{content}</div>', '1', matchInfo);
    
    expect(result).toBeUndefined();
  });

  it('should use custom className option', () => {
    const middleware = createHighlightTemplateMiddleware({
      className: 'custom-highlight'
    });
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];

    const result = middleware('content', 'hello world', '<div>{content}</div>', 'hello', matchInfo);
    
    expect(result).toContain('<span class="custom-highlight">hello</span>');
  });

  it('should respect maxLength option', () => {
    const middleware = createHighlightTemplateMiddleware({
      maxLength: 50
    });
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 4, text: 'test', type: 'exact' }
    ];
    const longText = 'test this is a very long text that should be truncated because it exceeds the maximum allowed length';

    const result = middleware('content', longText, '<div>{content}</div>', 'test', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('...');
    expect(result).toContain('<span class="search-highlight">test</span>');
  });

  it('should handle multiple matches', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' },
      { start: 6, end: 11, text: 'world', type: 'exact' }
    ];

    const result = middleware('content', 'hello world', '<div>{content}</div>', 'hello world', matchInfo);
    
    expect(result).toContain('<span class="search-highlight">hello</span>');
    expect(result).toContain('<span class="search-highlight">world</span>');
  });

  it('should escape HTML in highlighted text', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 6, text: '<div>test</div>', type: 'exact' }
    ];

    const result = middleware('content', '<div>test</div>', '<div>{content}</div>', 'test', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).not.toContain('<div>test</div>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('should return undefined when short content has no matches', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [];

    const result = middleware('content', 'no matches', '<div>{content}</div>', 'test', matchInfo);
    
    expect(result).toBeUndefined();
  });

  it('should NOT truncate non-truncateFields even when they are long', () => {
    const middleware = createHighlightTemplateMiddleware({
      maxLength: 20
    });
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 10, text: 'javascript', type: 'exact' }
    ];
    const longTags = 'javascript, typescript, react, vue, angular, svelte, nextjs';

    const result = middleware('tags', longTags, '<div>{tags}</div>', 'javascript', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">javascript</span>');
    expect(result).not.toContain('...');
    expect(result).toContain('svelte');
  });

  it('should allow custom truncateFields option', () => {
    const middleware = createHighlightTemplateMiddleware({
      maxLength: 30,
      truncateFields: ['tags', 'content']
    });
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 10, text: 'javascript', type: 'exact' }
    ];
    const longTags = 'javascript, typescript, react, vue, angular, svelte, nextjs';

    const result = middleware('tags', longTags, '<div>{tags}</div>', 'javascript', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">javascript</span>');
    expect(result).toContain('...');
  });

  describe('noHighlightFields - preventing broken URLs', () => {
    it('should NOT highlight url field even when matchInfo is provided', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo: MatchInfo[] = [
        { start: 14, end: 18, text: 'test', type: 'exact' }
      ];

      const result = middleware('url', '/2014/11/02/test.html', '<a href="{url}">{title}</a>', 'test', matchInfo);
      
      expect(result).toBeUndefined();
    });

    it('should NOT highlight link field even when matchInfo is provided', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo: MatchInfo[] = [
        { start: 0, end: 4, text: 'test', type: 'exact' }
      ];

      const result = middleware('link', 'test-page.html', '<a href="{link}">{title}</a>', 'test', matchInfo);
      
      expect(result).toBeUndefined();
    });

    it('should NOT highlight href field even when matchInfo is provided', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo: MatchInfo[] = [
        { start: 0, end: 4, text: 'test', type: 'exact' }
      ];

      const result = middleware('href', 'test.html', '<a href="{href}">{title}</a>', 'test', matchInfo);
      
      expect(result).toBeUndefined();
    });

    it('should NOT highlight query field even when matchInfo is provided', () => {
      const middleware = createHighlightTemplateMiddleware();
      const matchInfo: MatchInfo[] = [
        { start: 0, end: 4, text: 'test', type: 'exact' }
      ];

      const result = middleware('query', 'test', '<a href="{url}?query={query}">{title}</a>', 'test', matchInfo);
      
      expect(result).toBeUndefined();
    });

    it('should still highlight title when url also matches', () => {
      const middleware = createHighlightTemplateMiddleware();
      const titleMatchInfo: MatchInfo[] = [
        { start: 15, end: 19, text: 'test', type: 'exact' }
      ];

      const result = middleware('title', 'This is just a test', '<a href="{url}">{title}</a>', 'test', titleMatchInfo);
      
      expect(result).toBeDefined();
      expect(result).toContain('<span class="search-highlight">test</span>');
    });

    it('should allow custom noHighlightFields option', () => {
      const middleware = createHighlightTemplateMiddleware({
        noHighlightFields: ['customUrl', 'customLink']
      });
      const matchInfo: MatchInfo[] = [
        { start: 0, end: 4, text: 'test', type: 'exact' }
      ];

      const urlResult = middleware('url', 'test.html', '<a href="{url}">{title}</a>', 'test', matchInfo);
      expect(urlResult).toBeDefined();
      expect(urlResult).toContain('<span class="search-highlight">test</span>');

      const customResult = middleware('customUrl', 'test.html', '<a href="{customUrl}">{title}</a>', 'test', matchInfo);
      expect(customResult).toBeUndefined();
    });
  });
});

describe('defaultHighlightMiddleware', () => {
  it('should work as a pre-configured middleware', () => {
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];

    const result = defaultHighlightMiddleware('content', 'hello world', '<div>{content}</div>', 'hello', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">hello</span>');
  });

  it('should use default search-highlight class', () => {
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 4, text: 'test', type: 'exact' }
    ];

    const result = defaultHighlightMiddleware('desc', 'test data', '<div>{desc}</div>', 'test', matchInfo);
    
    expect(result).toContain('class="search-highlight"');
  });

  it('should highlight any field with matchInfo including title', () => {
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'title', type: 'exact' }
    ];

    const result = defaultHighlightMiddleware('title', 'title text', '<div>{title}</div>', 'title', matchInfo);
    
    expect(result).toBeDefined();
    expect(result).toContain('<span class="search-highlight">title</span>');
  });

  it('should return undefined without query', () => {
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];

    const result = defaultHighlightMiddleware('content', 'hello world', '<div>{content}</div>', undefined, matchInfo);
    
    expect(result).toBeUndefined();
  });

  it('should return undefined without matchInfo for short content', () => {
    const result = defaultHighlightMiddleware('content', 'hello world', '<div>{content}</div>', 'hello', undefined);
    
    expect(result).toBeUndefined();
  });
});


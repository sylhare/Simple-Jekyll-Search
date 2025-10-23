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

  it('should return undefined for non-content fields', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'title', type: 'exact' }
    ];

    const result = middleware('title', 'title text', '<div>{title}</div>', 'title', matchInfo);
    
    expect(result).toBeUndefined();
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

  it('should return undefined when highlighted result equals original', () => {
    const middleware = createHighlightTemplateMiddleware();
    const matchInfo: MatchInfo[] = [];

    const result = middleware('content', 'no matches', '<div>{content}</div>', 'test', matchInfo);
    
    expect(result).toBeUndefined();
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

  it('should return undefined for non-content fields', () => {
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'title', type: 'exact' }
    ];

    const result = defaultHighlightMiddleware('title', 'title text', '<div>{title}</div>', 'title', matchInfo);
    
    expect(result).toBeUndefined();
  });

  it('should return undefined without query', () => {
    const matchInfo: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];

    const result = defaultHighlightMiddleware('content', 'hello world', '<div>{content}</div>', undefined, matchInfo);
    
    expect(result).toBeUndefined();
  });

  it('should return undefined without matchInfo', () => {
    const result = defaultHighlightMiddleware('content', 'hello world', '<div>{content}</div>', 'hello', undefined);
    
    expect(result).toBeUndefined();
  });
});


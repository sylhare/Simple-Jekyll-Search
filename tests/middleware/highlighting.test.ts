import { describe, expect, it } from 'vitest';
import { 
  escapeHtml, 
  mergeOverlappingMatches, 
  highlightWithMatchInfo 
} from '../../src/middleware/highlighting';
import { MatchInfo } from '../../src/SearchStrategies/types';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    expect(escapeHtml("'hello'")).toBe('&#039;hello&#039;');
  });

  it('should handle mixed content', () => {
    expect(escapeHtml('<script>alert("XSS")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not escape safe text', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('mergeOverlappingMatches', () => {
  it('should return empty array for empty input', () => {
    expect(mergeOverlappingMatches([])).toEqual([]);
  });

  it('should return single match unchanged', () => {
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];
    expect(mergeOverlappingMatches(matches)).toEqual(matches);
  });

  it('should merge overlapping matches', () => {
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' },
      { start: 3, end: 8, text: 'lo wo', type: 'exact' }
    ];
    const result = mergeOverlappingMatches(matches);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(8);
  });

  it('should merge adjacent matches', () => {
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' },
      { start: 5, end: 11, text: ' world', type: 'exact' }
    ];
    const result = mergeOverlappingMatches(matches);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(11);
  });

  it('should keep separate non-overlapping matches', () => {
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' },
      { start: 10, end: 15, text: 'world', type: 'exact' }
    ];
    const result = mergeOverlappingMatches(matches);
    expect(result).toHaveLength(2);
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(5);
    expect(result[1].start).toBe(10);
    expect(result[1].end).toBe(15);
  });

  it('should handle unsorted matches', () => {
    const matches: MatchInfo[] = [
      { start: 10, end: 15, text: 'world', type: 'exact' },
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];
    const result = mergeOverlappingMatches(matches);
    expect(result).toHaveLength(2);
    expect(result[0].start).toBe(0);
    expect(result[1].start).toBe(10);
  });

  it('should merge multiple overlapping matches', () => {
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' },
      { start: 3, end: 8, text: 'lo wo', type: 'exact' },
      { start: 6, end: 11, text: 'world', type: 'exact' }
    ];
    const result = mergeOverlappingMatches(matches);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(11);
  });
});

describe('highlightWithMatchInfo', () => {
  it('should return escaped text with no matches', () => {
    const text = 'hello world';
    const matches: MatchInfo[] = [];
    expect(highlightWithMatchInfo(text, matches)).toBe('hello world');
  });

  it('should highlight single match', () => {
    const text = 'hello world';
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches);
    expect(result).toBe('<span class="search-highlight">hello</span> world');
  });

  it('should highlight multiple matches', () => {
    const text = 'hello world';
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' },
      { start: 6, end: 11, text: 'world', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches);
    expect(result).toBe('<span class="search-highlight">hello</span> <span class="search-highlight">world</span>');
  });

  it('should use custom className', () => {
    const text = 'hello world';
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches, { className: 'custom-highlight' });
    expect(result).toBe('<span class="custom-highlight">hello</span> world');
  });

  it('should escape HTML in text', () => {
    const text = '<div>hello</div>';
    const matches: MatchInfo[] = [
      { start: 5, end: 10, text: 'hello', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches);
    expect(result).toBe('&lt;div&gt;<span class="search-highlight">hello</span>&lt;/div&gt;');
  });

  it('should handle empty text', () => {
    const text = '';
    const matches: MatchInfo[] = [];
    expect(highlightWithMatchInfo(text, matches)).toBe('');
  });

  it('should merge overlapping matches before highlighting', () => {
    const text = 'hello world';
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' },
      { start: 3, end: 8, text: 'lo wo', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches);
    expect(result).toBe('<span class="search-highlight">hello wo</span>rld');
  });

  it('should truncate long text with maxLength option', () => {
    const text = 'This is a very long text that should be truncated when it exceeds the maximum length';
    const matches: MatchInfo[] = [
      { start: 10, end: 14, text: 'very', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches, { maxLength: 50, contextLength: 10 });
    expect(result.length).toBeLessThan(text.length);
    expect(result).toContain('very');
    expect(result).toContain('...');
  });

  it('should handle match at the beginning of text', () => {
    const text = 'hello world';
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches);
    expect(result).toBe('<span class="search-highlight">hello</span> world');
  });

  it('should handle match at the end of text', () => {
    const text = 'hello world';
    const matches: MatchInfo[] = [
      { start: 6, end: 11, text: 'world', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches);
    expect(result).toBe('hello <span class="search-highlight">world</span>');
  });

  it('should handle entire text as match', () => {
    const text = 'hello';
    const matches: MatchInfo[] = [
      { start: 0, end: 5, text: 'hello', type: 'exact' }
    ];
    const result = highlightWithMatchInfo(text, matches);
    expect(result).toBe('<span class="search-highlight">hello</span>');
  });
});


import { MatchInfo } from '../SearchStrategies/types';

/**
 * Highlight middleware that wraps search matches with HTML spans
 * and provides context around matches with a configurable character limit
 */

export interface HighlightOptions {
  /** CSS class name for highlighted spans (default: 'sjs-highlight') */
  highlightClass?: string;
  /** Number of characters to show before each match (default: 50) */
  contextBefore?: number;
  /** Number of characters to show after each match (default: 50) */
  contextAfter?: number;
  /** Maximum total characters for the highlighted text (default: 250) */
  maxLength?: number;
  /** Ellipsis to show when text is truncated (default: '...') */
  ellipsis?: string;
}

export interface HighlightResult {
  /** The highlighted text with HTML spans */
  highlightedText: string;
  /** The number of matches found */
  matchCount: number;
}

/**
 * Creates a highlight middleware function that can be used with SimpleJekyllSearch
 * 
 * @param options Configuration options for highlighting
 * @returns A middleware function that processes search results
 */
export function createHighlightMiddleware(options: HighlightOptions = {}): (result: any, query: string) => any {
  const {
    highlightClass = 'sjs-highlight',
    contextBefore = 50,
    contextAfter = 50,
    maxLength = 250,
    ellipsis = '...'
  } = options;

  return function(result: any, query: string): any {
    if (!query || !result) {
      return result;
    }

    const highlightedResult = { ...result };
    const textFields = ['title', 'desc', 'content', 'excerpt'];
    
    for (const field of textFields) {
      if (highlightedResult[field] && typeof highlightedResult[field] === 'string') {
        const highlighted = highlightText(
          highlightedResult[field],
          query,
          { highlightClass, contextBefore, contextAfter, maxLength, ellipsis }
        );
        
        if (highlighted.highlightedText !== highlightedResult[field]) {
          highlightedResult[field] = highlighted.highlightedText;
        }
      }
    }

    return highlightedResult;
  };
}

/**
 * Highlights search terms in text with HTML spans and provides context
 * 
 * @param text The text to highlight
 * @param query The search query
 * @param options Highlighting options
 * @returns Object containing highlighted text and match count
 */
export function highlightText(
  text: string,
  query: string,
  options: HighlightOptions = {}
): HighlightResult {
  const {
    highlightClass = 'sjs-highlight',
    contextBefore = 50,
    contextAfter = 50,
    maxLength = 250,
    ellipsis = '...'
  } = options;

  if (!text || !query) {
    return { highlightedText: text, matchCount: 0 };
  }

  const originalText = text;
  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0);
  
  if (searchTerms.length === 0) {
    return { highlightedText: text, matchCount: 0 };
  }

  const matches: Array<{ start: number; end: number; term: string }> = [];
  
  for (const term of searchTerms) {
    let index = 0;
    while (index < text.length) {
      const found = text.toLowerCase().indexOf(term, index);
      if (found === -1) break;
      
      matches.push({
        start: found,
        end: found + term.length,
        term: text.substring(found, found + term.length)
      });
      
      index = found + 1;
    }
  }

  if (matches.length === 0) {
    return { highlightedText: text, matchCount: 0 };
  }

  matches.sort((a, b) => a.start - b.start);

  const mergedMatches: Array<{ start: number; end: number; term: string }> = [];
  for (const match of matches) {
    if (mergedMatches.length === 0 || mergedMatches[mergedMatches.length - 1].end < match.start) {
      mergedMatches.push(match);
    } else {
      const lastMatch = mergedMatches[mergedMatches.length - 1];
      lastMatch.end = Math.max(lastMatch.end, match.end);
      lastMatch.term = text.substring(lastMatch.start, lastMatch.end);
    }
  }

  if (text.length <= maxLength) {
    let highlightedText = text;
    for (let i = mergedMatches.length - 1; i >= 0; i--) {
      const match = mergedMatches[i];
      const before = highlightedText.substring(0, match.start);
      const after = highlightedText.substring(match.end);
      const matchText = highlightedText.substring(match.start, match.end);
      highlightedText = before + `<span class="${highlightClass}">${matchText}</span>` + after;
    }
    return { highlightedText, matchCount: mergedMatches.length };
  }

  let highlightedText = '';
  let totalLength = 0;
  let lastEnd = 0;

  for (let i = 0; i < mergedMatches.length; i++) {
    const match = mergedMatches[i];
    
    const contextStart = Math.max(lastEnd, match.start - contextBefore);
    const contextEnd = Math.min(text.length, match.end + contextAfter);
    
    if (contextStart > lastEnd && lastEnd > 0) {
      highlightedText += ellipsis;
      totalLength += ellipsis.length;
    }
    
    if (contextStart < match.start) {
      const beforeText = text.substring(contextStart, match.start);
      highlightedText += beforeText;
      totalLength += beforeText.length;
    }
    
    const matchText = text.substring(match.start, match.end);
    highlightedText += `<span class="${highlightClass}">${matchText}</span>`;
    totalLength += matchText.length;
    
    if (match.end < contextEnd) {
      const afterText = text.substring(match.end, contextEnd);
      highlightedText += afterText;
      totalLength += afterText.length;
    }
    
    lastEnd = contextEnd;
    
    if (totalLength >= maxLength) {
      if (contextEnd < text.length) {
        highlightedText += ellipsis;
      }
      break;
    }
  }

  return {
    highlightedText: highlightedText || originalText,
    matchCount: mergedMatches.length
  };
}

/**
 * Default highlight middleware with standard options
 */
export const defaultHighlightMiddleware = createHighlightMiddleware();


/**
 * Highlights text using provided match information (faster, more accurate)
 */
function highlightWithMatchInfo(text: string, matchInfo: MatchInfo[], options: Required<HighlightOptions>): string {
  if (matchInfo.length === 0) return text;
  
  const sortedMatches = [...matchInfo].sort((a, b) => b.start - a.start);
  
  let highlightedText = text;
  for (const match of sortedMatches) {
    const before = highlightedText.substring(0, match.start);
    const after = highlightedText.substring(match.end);
    const matchText = highlightedText.substring(match.start, match.end);
    highlightedText = before + `<span class="${options.highlightClass}">${matchText}</span>` + after;
  }
  
  return highlightedText;
}


/**
 * Creates a templateMiddleware that includes highlighting functionality
 * @param options - Highlighting options
 * @returns A templateMiddleware function that can highlight text
 */
export function createHighlightTemplateMiddleware(options: HighlightOptions = {}) {
  const highlightOptions = {
    highlightClass: 'sjs-highlight',
    contextBefore: 50,
    contextAfter: 50,
    maxLength: 250,
    ellipsis: '...',
    ...options
  };

  return function(prop: string, value: string, _template: string, query?: string, matchInfo?: MatchInfo[]): string | undefined {
    if ((prop === 'content' || prop === 'desc') && query && typeof value === 'string') {
      if (matchInfo && matchInfo.length > 0) {
        const highlighted = highlightWithMatchInfo(value, matchInfo, highlightOptions);
        return highlighted !== value ? highlighted : undefined;
      }
    }
    return undefined;
  };
}

export const defaultHighlightTemplateMiddleware = createHighlightTemplateMiddleware();

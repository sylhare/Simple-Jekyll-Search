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

    // Create a copy of the result to avoid modifying the original
    const highlightedResult = { ...result };

    // Process each text field in the result
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

  // Find all matches with their positions
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

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Merge overlapping matches
  const mergedMatches: Array<{ start: number; end: number; term: string }> = [];
  for (const match of matches) {
    if (mergedMatches.length === 0 || mergedMatches[mergedMatches.length - 1].end < match.start) {
      mergedMatches.push(match);
    } else {
      // Extend the previous match
      const lastMatch = mergedMatches[mergedMatches.length - 1];
      lastMatch.end = Math.max(lastMatch.end, match.end);
      lastMatch.term = text.substring(lastMatch.start, lastMatch.end);
    }
  }

  // If the text is short enough, just highlight all matches without context
  if (text.length <= maxLength) {
    let highlightedText = text;
    // Process matches in reverse order to maintain positions
    for (let i = mergedMatches.length - 1; i >= 0; i--) {
      const match = mergedMatches[i];
      const before = highlightedText.substring(0, match.start);
      const after = highlightedText.substring(match.end);
      const matchText = highlightedText.substring(match.start, match.end);
      highlightedText = before + `<span class="${highlightClass}">${matchText}</span>` + after;
    }
    return { highlightedText, matchCount: mergedMatches.length };
  }

  // Build highlighted text with context for longer texts
  let highlightedText = '';
  let totalLength = 0;
  let lastEnd = 0;

  for (let i = 0; i < mergedMatches.length; i++) {
    const match = mergedMatches[i];
    
    // Calculate context boundaries for this match
    const contextStart = Math.max(lastEnd, match.start - contextBefore);
    const contextEnd = Math.min(text.length, match.end + contextAfter);
    
    // Add ellipsis if there's a gap between matches
    if (contextStart > lastEnd && lastEnd > 0) {
      highlightedText += ellipsis;
      totalLength += ellipsis.length;
    }
    
    // Add text before the match
    if (contextStart < match.start) {
      const beforeText = text.substring(contextStart, match.start);
      highlightedText += beforeText;
      totalLength += beforeText.length;
    }
    
    // Add the highlighted match
    const matchText = text.substring(match.start, match.end);
    highlightedText += `<span class="${highlightClass}">${matchText}</span>`;
    totalLength += matchText.length;
    
    // Add text after the match
    if (match.end < contextEnd) {
      const afterText = text.substring(match.end, contextEnd);
      highlightedText += afterText;
      totalLength += afterText.length;
    }
    
    lastEnd = contextEnd;
    
    // Check if we've exceeded the max length
    if (totalLength >= maxLength) {
      // Add ellipsis at the end if we're not at the end of the original text
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

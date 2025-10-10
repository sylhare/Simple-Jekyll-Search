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
 * Finds fuzzy match positions in text for highlighting
 * @param text - The text to search in
 * @param pattern - The search pattern
 * @returns Array of match positions
 */
function findFuzzyMatches(text: string, pattern: string): Array<{ start: number; end: number; text: string }> {
  const matches: Array<{ start: number; end: number; text: string }> = [];
  const lowerText = text.toLowerCase();
  const lowerPattern = pattern.toLowerCase().trim();
  
  if (lowerPattern.length === 0) return matches;
  
  const patternWords = lowerPattern.split(/\s+/);
  
  for (const word of patternWords) {
    if (word.length === 0) continue;
    
    const wordMatches = findFuzzyWordMatches(lowerText, word);
    matches.push(...wordMatches);
  }
  
  return matches;
}

/**
 * Finds fuzzy matches for a single word
 */
function findFuzzyWordMatches(text: string, word: string): Array<{ start: number; end: number; text: string }> {
  const matches: Array<{ start: number; end: number; text: string }> = [];
  
  const exactRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  let match;
  while ((match = exactRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0]
    });
  }
  
  if (matches.length === 0) {
    for (let i = 0; i < text.length; i++) {
      const fuzzyMatch = findFuzzySequenceMatch(text, word, i);
      if (fuzzyMatch) {
        matches.push(fuzzyMatch);
        i = fuzzyMatch.end - 1; // Skip to end of match
      }
    }
  }
  
  return matches;
}

/**
 * Finds a fuzzy sequence match starting from a given position
 */
function findFuzzySequenceMatch(text: string, pattern: string, startPos: number): { start: number; end: number; text: string } | null {
  let textIndex = startPos;
  let patternIndex = 0;
  let matchStart = -1;
  let maxGap = 3;
  const matchedPositions: number[] = [];
  
  while (textIndex < text.length && patternIndex < pattern.length) {
    if (text[textIndex] === pattern[patternIndex]) {
      if (matchStart === -1) {
        matchStart = textIndex;
      }
      matchedPositions.push(textIndex);
      patternIndex++;
    } else if (matchStart !== -1) {
      if (textIndex - matchStart > maxGap * pattern.length) {
        return null;
      }
    }
    textIndex++;
  }
  
  if (patternIndex === pattern.length && matchStart !== -1 && matchedPositions.length > 0) {
    const actualStart = matchedPositions[0];
    const actualEnd = matchedPositions[matchedPositions.length - 1] + 1;
    
    return {
      start: actualStart,
      end: actualEnd,
      text: text.substring(actualStart, actualEnd)
    };
  }
  
  return null;
}

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
 * Highlights text using query-based search (fallback for backward compatibility)
 */
function highlightWithQuery(text: string, query: string, options: Required<HighlightOptions>): string {
  let highlightedText = text;
  let hasMatches = false;
  
  const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
  for (const term of searchTerms) {
    const regex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    if (regex.test(highlightedText)) {
      highlightedText = highlightedText.replace(regex, `<span class="${options.highlightClass}">$1</span>`);
      hasMatches = true;
    }
  }
  
  if (!hasMatches) {
    const fuzzyMatches = findFuzzyMatches(text, query);
    if (fuzzyMatches.length > 0) {
      fuzzyMatches.sort((a, b) => b.start - a.start);
      
      for (const match of fuzzyMatches) {
        const before = highlightedText.substring(0, match.start);
        const after = highlightedText.substring(match.end);
        const matchText = highlightedText.substring(match.start, match.end);
        highlightedText = before + `<span class="${options.highlightClass}">${matchText}</span>` + after;
      }
      hasMatches = true;
    }
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
      const highlighted = highlightWithQuery(value, query, highlightOptions);
      return highlighted !== value ? highlighted : undefined;
    }
    return undefined;
  };
}

export const defaultHighlightTemplateMiddleware = createHighlightTemplateMiddleware();

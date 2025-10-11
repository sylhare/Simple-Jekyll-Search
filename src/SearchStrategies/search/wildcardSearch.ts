import { levenshteinSearch } from './levenshtein';
import { MatchInfo } from '../types';
import { mergeAndSortMatches } from './utils';


/**
 * Finds wildcard matches in text and returns their positions
 * @param text The text to search in
 * @param pattern The search pattern
 * @returns Array of match information
 */
export function findWildcardMatches(text: string, pattern: string): MatchInfo[] {
  if (!text || !pattern) return [];
  
  // Try wildcard matching first
  const wildcardMatches = findWildcardPatternMatches(text, pattern);
  if (wildcardMatches.length > 0) {
    return mergeAndSortMatches(wildcardMatches);
  }
  
  // Fall back to levenshtein matching for fuzzy search
  if (levenshteinSearch(text, pattern)) {
    return [{
      start: 0,
      end: text.length,
      text: text,
      type: 'wildcard'
    }];
  }
  
  return [];
}

/**
 * Finds wildcard pattern matches
 */
function findWildcardPatternMatches(text: string, pattern: string): MatchInfo[] {
  const matches: MatchInfo[] = [];
  
  // Convert pattern to regex
  let regexPattern: string;
  if (pattern.includes('*') || pattern.includes('?')) {
    // For wildcard patterns, use regex matching
    regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
  } else {
    // For non-wildcard patterns, use partial word matching (no word boundaries)
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    regexPattern = escapedPattern;
  }
  
  const regex = new RegExp(regexPattern, 'gi');
  let match;
  let lastIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index === lastIndex && match[0].length === 0) {
      break;
    }
    lastIndex = match.index;
    
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'wildcard'
    });
    
    if (match[0].length === text.length) {
      break;
    }
  }
  
  return matches;
}


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
  
  const wildcardMatches = findWildcardPatternMatches(text, pattern);
  if (wildcardMatches.length > 0) {
    return mergeAndSortMatches(wildcardMatches);
  }
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
  const regexPattern = pattern.replace(/\*/g, '.*');
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


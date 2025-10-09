import { levenshteinSearch, findLevenshteinMatches } from './levenshtein';
import { MatchInfo } from '../types';

/**
 * Matches a pattern with wildcards (*) against a text.
 *
 * @param text - The text to search in
 * @param pattern - The pattern to search for (supports * as a wildcard for unknown characters)
 * @returns true if matches, false otherwise
 */
export function wildcardSearch(text: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`, 'i');

  if (regex.test(text)) return true;

  return levenshteinSearch(text, pattern);
}

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
  
  // Fall back to levenshtein matching
  const levenshteinMatches = findLevenshteinMatches(text, pattern);
  return mergeAndSortMatches(levenshteinMatches);
}

/**
 * Finds wildcard pattern matches
 */
function findWildcardPatternMatches(text: string, pattern: string): MatchInfo[] {
  const matches: MatchInfo[] = [];
  const regexPattern = pattern.replace(/\*/g, '.*');
  const regex = new RegExp(regexPattern, 'gi');
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'wildcard'
    });
  }
  
  return matches;
}

/**
 * Merges overlapping matches and sorts them by position
 */
function mergeAndSortMatches(matches: MatchInfo[]): MatchInfo[] {
  if (matches.length === 0) return [];
  
  // Sort matches by start position
  const sortedMatches = matches.sort((a, b) => a.start - b.start);
  const merged: MatchInfo[] = [];
  
  for (const match of sortedMatches) {
    const lastMerged = merged[merged.length - 1];
    
    // If this match overlaps with the last merged match, extend it
    if (lastMerged && match.start <= lastMerged.end) {
      lastMerged.end = Math.max(lastMerged.end, match.end);
      lastMerged.text = lastMerged.text + match.text.slice(lastMerged.end - match.start);
    } else {
      merged.push({ ...match });
    }
  }
  
  return merged;
}

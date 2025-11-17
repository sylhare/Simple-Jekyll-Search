import { MatchInfo } from '../types';

/**
 * Finds matches using wildcard patterns (* matches any non-space characters).
 * Uses regex to find all matching patterns in the text.
 * Wildcards stop at spaces - they only match within a single word.
 *
 * @param text - The text to search in
 * @param pattern - The wildcard pattern (e.g., "hel*" matches "hello" but not "hello world")
 * @returns Array of MatchInfo objects for each wildcard match
 */
export function findWildcardMatches(text: string, pattern: string): MatchInfo[] {
  const regexPattern = pattern.replace(/\*/g, '[^ ]*');
  const regex = new RegExp(regexPattern, 'gi');
  const matches: MatchInfo[] = [];
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'wildcard'
    });
    
    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
  }
  
  return matches;
}


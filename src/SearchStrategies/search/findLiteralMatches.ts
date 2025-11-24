import { MatchInfo } from '../types';

/**
 * Finds all literal matches of a search criteria in the text.
 * Handles multi-word searches by splitting on spaces and finding each word.
 * All words must be present for a match.
 *
 * @param text - The text to search in
 * @param criteria - The search criteria (can be multi-word)
 * @returns Array of MatchInfo objects for each word found
 */
export function findLiteralMatches(text: string, criteria: string): MatchInfo[] {
  const lowerText = text.trim().toLowerCase();
  const pattern = criteria.endsWith(' ') 
    ? [criteria.toLowerCase()] 
    : criteria.trim().toLowerCase().split(' ');

  const wordsFound = pattern.filter((word: string) => lowerText.indexOf(word) >= 0).length;
  
  if (wordsFound !== pattern.length) {
    return [];
  }

  const matches: MatchInfo[] = [];
  
  for (const word of pattern) {
    if (!word || word.length === 0) continue;
    
    let startIndex = 0;
    while ((startIndex = lowerText.indexOf(word, startIndex)) !== -1) {
      matches.push({
        start: startIndex,
        end: startIndex + word.length,
        text: text.substring(startIndex, startIndex + word.length),
        type: 'exact'
      });
      startIndex += word.length;
    }
  }
  
  return matches;
}


import { MatchInfo } from '../types';

/**
 * This function performs a literal search (look for the exact sequence of characters)
 * on the given text using the provided criteria.
 *
 * @param text
 * @param criteria
 */
export function literalSearch(text: string, criteria: string): boolean {
  text = text.trim().toLowerCase();
  const pattern = criteria.endsWith(' ') ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(' ');

  return pattern.filter((word: string) => text.indexOf(word) >= 0).length === pattern.length;
}

/**
 * Finds all literal matches in text and returns their positions
 * @param text The text to search in
 * @param criteria The search criteria
 * @returns Array of match information
 */
export function findLiteralMatches(text: string, criteria: string): MatchInfo[] {
  if (!text || !criteria) return [];
  
  const lowerText = text.toLowerCase();
  const words = criteria.trim().toLowerCase().split(/\s+/);
  const matches: MatchInfo[] = [];
  
  let textIndex = 0;
  for (const word of words) {
    if (word.length === 0) continue;
    
    const wordIndex = lowerText.indexOf(word, textIndex);
    if (wordIndex !== -1) {
      matches.push({
        start: wordIndex,
        end: wordIndex + word.length,
        text: text.substring(wordIndex, wordIndex + word.length),
        type: 'exact'
      });
      textIndex = wordIndex + word.length;
    }
  }
  
  return matches;
}
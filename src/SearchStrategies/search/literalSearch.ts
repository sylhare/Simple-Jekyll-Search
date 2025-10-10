import { MatchInfo } from '../types';


/**
 * Finds all literal matches in text and returns their positions
 * @param text The text to search in
 * @param criteria The search criteria
 * @returns Array of match information
 */
export function findLiteralMatches(text: string, criteria: string): MatchInfo[] {
  if (!text || !criteria) return [];
  
  const lowerText = text.toLowerCase();
  const hasTrailingSpace = criteria.endsWith(' ');
  const words = criteria.trim().toLowerCase().split(/\s+/);
  const matches: MatchInfo[] = [];
  
  let textIndex = 0;
  for (const word of words) {
    if (word.length === 0) continue;
    
    let wordIndex = lowerText.indexOf(word, textIndex);
    
    // If this is the last word and criteria has trailing space, ensure it's a complete word
    if (hasTrailingSpace && word === words[words.length - 1]) {
      while (wordIndex !== -1) {
        const nextChar = lowerText[wordIndex + word.length];
        if (!nextChar || !/\w/.test(nextChar)) {
          // Found complete word match
          break;
        }
        wordIndex = lowerText.indexOf(word, wordIndex + 1);
      }
    }
    
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
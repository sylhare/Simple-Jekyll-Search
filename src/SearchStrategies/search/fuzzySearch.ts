import { MatchInfo } from '../types';


/**
 * Finds fuzzy matches in text and returns their positions
 * @param text The text to search in
 * @param pattern The search pattern
 * @returns Array of match information
 */
export function findFuzzyMatches(text: string, pattern: string): MatchInfo[] {
  if (!text || !pattern) return [];
  
  const lowerText = text.toLowerCase();
  const lowerPattern = pattern.toLowerCase().trim();
  
  if (lowerPattern.length === 0) return [];
  
  // Try character-by-character fuzzy matching first
  const matches: MatchInfo[] = [];
  for (let i = 0; i < lowerText.length; i++) {
    const match = findFuzzySequenceMatch(lowerText, lowerPattern, i);
    if (match) {
      const isExact = match.text === lowerPattern;
      
      matches.push({
        start: match.start,
        end: match.end,
        text: text.substring(match.start, match.end),
        type: isExact ? 'exact' : 'fuzzy'
      });
      i = match.end - 1;
    }
  }
  
  // If no fuzzy matches found, try literal word matching as fallback
  if (matches.length === 0) {
    const words = lowerPattern.split(/\s+/);
    if (words.length > 1) {
      // For multi-word patterns, check if all words are present (flexible word order)
      for (const word of words) {
        if (word.length === 0) continue;
        const wordIndex = lowerText.indexOf(word);
        if (wordIndex !== -1) {
          matches.push({
            start: wordIndex,
            end: wordIndex + word.length,
            text: text.substring(wordIndex, wordIndex + word.length),
            type: 'exact'
          });
        } else {
          // If any word is not found, return empty array
          return [];
        }
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
  let maxGap = 10; // Increased gap limit to allow for spaces between words
  
  while (textIndex < text.length && patternIndex < pattern.length) {
    if (text[textIndex] === pattern[patternIndex]) {
      if (matchStart === -1) {
        matchStart = textIndex;
      }
      patternIndex++;
    } else if (matchStart !== -1) {
      const gap = textIndex - matchStart;
      if (gap > maxGap) {
        return null;
      }
    }
    textIndex++;
  }
  
  if (patternIndex === pattern.length && matchStart !== -1) {
    return {
      start: matchStart,
      end: textIndex,
      text: text.substring(matchStart, textIndex)
    };
  }
  
  return null;
}

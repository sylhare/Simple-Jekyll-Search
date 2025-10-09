import { MatchInfo } from '../types';

/**
 * A simple fuzzy search implementation that checks if characters in the pattern appear
 * in order (but not necessarily consecutively) in the text.
 *
 * - Case-insensitive.
 * - Ignores trailing spaces in the pattern.
 * - Empty text matches nothing (unless pattern is also empty)
 * - Empty pattern matches everything
 *
 * @param pattern - The pattern to search for
 * @param text - The text to search in
 * @returns true if all characters in pattern appear in order in text
 */
export function fuzzySearch(text: string, pattern: string): boolean {
  pattern = pattern.trimEnd();
  if (pattern.length === 0) return true;

  pattern = pattern.toLowerCase();
  text = text.toLowerCase();

  let remainingText = text, currentIndex = -1;
  
  for (const char of pattern) {
    const nextIndex = remainingText.indexOf(char);

    if (nextIndex === -1 || (currentIndex !== -1 && remainingText.slice(0, nextIndex).split(' ').length - 1 > 2)) {
      return false;
    }

    currentIndex = nextIndex;
    remainingText = remainingText.slice(nextIndex + 1);
  }

  return true;
}

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
  
  const patternWords = lowerPattern.split(/\s+/);
  const matches: MatchInfo[] = [];
  
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
function findFuzzyWordMatches(text: string, word: string): MatchInfo[] {
  const matches: MatchInfo[] = [];
  
  // Try exact word matches first
  const exactRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  let match;
  while ((match = exactRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'exact'
    });
  }
  
  // If no exact matches, try fuzzy matching
  if (matches.length === 0) {
    for (let i = 0; i < text.length; i++) {
      const fuzzyMatch = findFuzzySequenceMatch(text, word, i);
      if (fuzzyMatch) {
        matches.push({ ...fuzzyMatch, type: 'fuzzy' });
        i = fuzzyMatch.end - 1;
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
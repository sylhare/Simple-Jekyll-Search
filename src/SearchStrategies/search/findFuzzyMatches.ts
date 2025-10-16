import { MatchInfo } from '../types';

/**
 * Finds fuzzy matches where characters appear in sequence (but not necessarily consecutively).
 * Returns a single match spanning from the first to last matched character.
 *
 * @param text - The text to search in
 * @param criteria - The search criteria
 * @returns Array with single MatchInfo if all characters found in sequence, empty array otherwise
 */
export function findFuzzyMatches(text: string, criteria: string): MatchInfo[] {
  criteria = criteria.trimEnd();
  if (criteria.length === 0) return [];

  const lowerText = text.toLowerCase();
  const lowerCriteria = criteria.toLowerCase();
  
  let textIndex = 0;
  let criteriaIndex = 0;
  const matchedIndices: number[] = [];
  
  while (textIndex < text.length && criteriaIndex < criteria.length) {
    if (lowerText[textIndex] === lowerCriteria[criteriaIndex]) {
      matchedIndices.push(textIndex);
      criteriaIndex++;
    }
    textIndex++;
  }
  
  if (criteriaIndex !== criteria.length) {
    return [];
  }
  
  if (matchedIndices.length === 0) {
    return [];
  }
  
  const start = matchedIndices[0];
  const end = matchedIndices[matchedIndices.length - 1] + 1;
  
  return [{
    start,
    end,
    text: text.substring(start, end),
    type: 'fuzzy'
  }];
}


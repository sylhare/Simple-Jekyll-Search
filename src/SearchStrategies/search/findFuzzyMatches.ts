import { MatchInfo } from '../types';
import { memoizeLast } from '../../utils';

/** Memoizes the trim/lowercase of the criteria, reused across every item in a search. */
const normalizeCriteria = memoizeLast((raw: string) => {
  const criteria = raw.trimEnd();
  return { criteria, lower: criteria.toLowerCase() };
});

/**
 * Finds fuzzy matches where characters appear in sequence (but not necessarily consecutively).
 * Returns a single match spanning from the first to last matched character.
 *
 * @param text - The text to search in
 * @param criteria - The search criteria
 * @returns Array with single MatchInfo if all characters found in sequence, empty array otherwise
 */
export function findFuzzyMatches(text: string, criteria: string): MatchInfo[] {
  const { criteria: normalized, lower: lowerCriteria } = normalizeCriteria(criteria);
  criteria = normalized;
  if (criteria.length === 0) return [];

  const lowerText = text.toLowerCase();

  let textIndex = 0;
  let criteriaIndex = 0;
  let firstIndex = -1;
  let lastIndex = -1;

  while (textIndex < text.length && criteriaIndex < criteria.length) {
    if (lowerText[textIndex] === lowerCriteria[criteriaIndex]) {
      if (firstIndex === -1) firstIndex = textIndex;
      lastIndex = textIndex;
      criteriaIndex++;
    }
    textIndex++;
  }

  if (criteriaIndex !== criteria.length) {
    return [];
  }

  const start = firstIndex;
  const end = lastIndex + 1;

  return [{
    start,
    end,
    text: text.substring(start, end),
    type: 'fuzzy'
  }];
}


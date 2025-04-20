import { levenshtein } from './levenshtein';

/**
 * Matches a pattern with wildcards (*) against a text with a high degree of certainty (80% or above)
 * using the levenshtein distance.
 *
 * @param text - The text to search in
 * @param pattern - The pattern to search for (supports * as a wildcard for unknown characters)
 * @returns true if the match is 80% or above, false otherwise
 */
export function wildcardFuzzySearch(text: string, pattern: string): boolean {
  if (!pattern || !text) return false;

  const regexPattern = pattern.replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`, 'i');

  if (regex.test(text)) return true;

  const distance = levenshtein(pattern.replace(/\*/g, ''), text);
  const similarity = 1 - distance / Math.max(pattern.length, text.length);

  return similarity >= 0.8;
}
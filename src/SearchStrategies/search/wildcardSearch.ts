import { levenshteinSearch } from './levenshtein';

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
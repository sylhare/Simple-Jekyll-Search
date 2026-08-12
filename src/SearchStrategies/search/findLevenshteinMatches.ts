import { MatchInfo } from '../types';

/**
 * UNUSED / NOT WIRED IN — kept for reference and benchmarking only.
 *
 * Not reachable from any strategy or the public entry, so it is tree-shaken out of
 * the bundle. Replaced by {@link findFuzzyMatches}: this edit-distance matcher
 * compares the query against the whole field (`similarity = 1 - distance / maxLen`),
 * so it only matches when the query length is close to the field length — unsuitable
 * for in-document search. Benchmarked in `tests/performance/strategy.bench.ts`.
 */

/**
 * Calculates the Levenshtein distance between two strings.
 *
 * The Levenshtein distance is a measure of the difference between two strings.
 * It is calculated as the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one string into the other.
 *
 * @param a - The first string
 * @param b - The second string
 * @returns The Levenshtein distance
 */
function levenshtein(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  const distanceMatrix: number[][] = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0));

  for (let i = 0; i <= lenA; i++) distanceMatrix[i][0] = i;
  for (let j = 0; j <= lenB; j++) distanceMatrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distanceMatrix[i][j] = Math.min(
        distanceMatrix[i - 1][j] + 1,
        distanceMatrix[i][j - 1] + 1,
        distanceMatrix[i - 1][j - 1] + cost
      );
    }
  }

  return distanceMatrix[lenA][lenB];
}

/**
 * Finds matches based on Levenshtein distance (edit distance).
 * Returns a match if the similarity is >= 30% (edit distance allows for typos).
 *
 * @param text - The text to search in
 * @param pattern - The pattern to search for
 * @returns Array with single MatchInfo if similarity threshold met, empty array otherwise
 */
export function findLevenshteinMatches(text: string, pattern: string): MatchInfo[] {
  const distance = levenshtein(pattern, text);
  const similarity = 1 - distance / Math.max(pattern.length, text.length);

  if (similarity >= 0.3) {
    return [{
      start: 0,
      end: text.length,
      text: text,
      type: 'fuzzy'
    }];
  }

  return [];
}

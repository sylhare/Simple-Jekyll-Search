import { MatchInfo } from '../types';

/** Unused — not wired into any strategy (tree-shaken from the bundle). See `tests/performance/README.md`. */

/** Levenshtein edit distance between two strings. */
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

/** Matches when edit-distance similarity to the whole text is >= 30%. */
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

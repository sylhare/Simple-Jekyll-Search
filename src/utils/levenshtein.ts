/**
 * Calculates the Levenshtein distance between two strings.
 *
 * The Levenshtein distance is a measure of the difference between two strings.
 * It is calculated as the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one string into the other.
 *
 * Example:
 * For the strings 'a' and 'b', the Levenshtein distance is 1 because:
 * - Substituting 'a' with 'b' results in the string 'b'.
 *
 * @param a - The first string
 * @param b - The second string
 * @returns The Levenshtein distance
 */
export function levenshtein(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  const distanceMatrix: number[][] = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0));

  // Initialize the first row and column
  for (let i = 0; i <= lenA; i++) distanceMatrix[i][0] = i;
  for (let j = 0; j <= lenB; j++) distanceMatrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      // Calculate the minimum cost of the three possible operations to make it closer to the other string
      distanceMatrix[i][j] = Math.min(
        distanceMatrix[i - 1][j] + 1,        // Removing a character from one string
        distanceMatrix[i][j - 1] + 1,        // Adding a character to one string to make it closer to the other string.
        distanceMatrix[i - 1][j - 1] + cost  // Replacing one character in a string with another
      );
    }
  }

  // Return the distance between the two strings
  return distanceMatrix[lenA][lenB];
}
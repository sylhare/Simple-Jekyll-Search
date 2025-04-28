/**
 * This function performs a literal search (look for the exact sequence of characters)
 * on the given text using the provided criteria.
 *
 * @param text
 * @param criteria
 */
export function literalSearch(text: string, criteria: string): boolean {
  text = text.trim().toLowerCase();
  const pattern = criteria.endsWith(' ') ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(' ');

  return pattern.filter((word: string) => text.indexOf(word) >= 0).length === pattern.length;
}
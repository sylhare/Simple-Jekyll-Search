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
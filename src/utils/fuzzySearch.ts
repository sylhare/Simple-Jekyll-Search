/**
 * A simple fuzzy search implementation that checks if characters in the pattern appear
 * in order (but not necessarily consecutively) in the text.
 * 
 * @param pattern - The pattern to search for
 * @param text - The text to search in
 * @returns true if all characters in pattern appear in order in text
 */
export function fuzzySearch(pattern: string, text: string): boolean {
  // Trim trailing spaces from pattern as they don't affect matching
  pattern = pattern.trimEnd();
  
  // Empty pattern matches everything
  if (pattern.length === 0) return true;
  
  // Empty text matches nothing (unless pattern is also empty)
  if (text.length === 0) return false;

  // Convert both strings to lowercase for case-insensitive comparison
  pattern = pattern.toLowerCase();
  text = text.toLowerCase();

  let remainingText = text;
  
  // For each character in the pattern
  for (const char of pattern) {
    // Find the next occurrence of this character in the remaining text
    const nextIndex = remainingText.indexOf(char);
    
    // If we can't find the character, no match
    if (nextIndex === -1) {
      return false;
    }
    
    // Update our remaining text to ensure characters are found in sequence
    remainingText = remainingText.slice(nextIndex + 1);
  }

  return true;
} 
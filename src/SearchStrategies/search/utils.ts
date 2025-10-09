import { MatchInfo } from '../types';

/**
 * Merges overlapping matches and sorts them by position
 */
export function mergeAndSortMatches(matches: MatchInfo[]): MatchInfo[] {
  if (matches.length === 0) return [];
  
  // Sort matches by start position
  const sortedMatches = matches.sort((a, b) => a.start - b.start);
  const merged: MatchInfo[] = [];
  
  for (const match of sortedMatches) {
    const lastMerged = merged[merged.length - 1];
    
    // If this match overlaps with the last merged match, extend it
    if (lastMerged && match.start <= lastMerged.end) {
      lastMerged.end = Math.max(lastMerged.end, match.end);
      lastMerged.text = lastMerged.text + match.text.slice(lastMerged.end - match.start);
    } else {
      merged.push({ ...match });
    }
  }
  
  return merged;
}

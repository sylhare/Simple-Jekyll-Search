import { findFuzzyMatches } from './search/fuzzySearch';
import { findLiteralMatches } from './search/literalSearch';
import { findWildcardMatches } from './search/wildcardSearch';
import { SearchStrategy } from './types';

export const LiteralSearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    if (!text || !criteria) return false;
    const lowerText = text.trim().toLowerCase();
    const pattern = criteria.endsWith(' ') ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(' ');
    return pattern.filter((word: string) => lowerText.indexOf(word) >= 0).length === pattern.length;
  },
  findLiteralMatches
);

export const FuzzySearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    const pattern = criteria.trimEnd();
    if (pattern.length === 0) return true;

    const lowerPattern = pattern.toLowerCase();
    const lowerText = text.toLowerCase();

    let remainingText = lowerText, currentIndex = -1;
    
    for (const char of lowerPattern) {
      const nextIndex = remainingText.indexOf(char);

      if (nextIndex === -1 || (currentIndex !== -1 && remainingText.slice(0, nextIndex).split(' ').length - 1 > 2)) {
        const lowerText2 = text.trim().toLowerCase();
        const pattern2 = criteria.endsWith(' ') ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(' ');
        return pattern2.filter((word: string) => lowerText2.indexOf(word) >= 0).length === pattern2.length;
      }

      currentIndex = nextIndex;
      remainingText = remainingText.slice(nextIndex + 1);
    }

    return true;
  },
  (text: string, criteria: string) => {
    const fuzzyMatches = findFuzzyMatches(text, criteria);
    if (fuzzyMatches.length > 0) {
      return fuzzyMatches;
    }
    return findLiteralMatches(text, criteria);
  }
);

export const WildcardSearchStrategy = new SearchStrategy(
  (text: string, criteria: string) => {
    const wildcardMatches = findWildcardMatches(text, criteria);
    return wildcardMatches.length > 0;
  },
  (text: string, criteria: string) => {
    const wildcardMatches = findWildcardMatches(text, criteria);
    if (wildcardMatches.length > 0) {
      return wildcardMatches;
    }
    return findLiteralMatches(text, criteria);
  }
);
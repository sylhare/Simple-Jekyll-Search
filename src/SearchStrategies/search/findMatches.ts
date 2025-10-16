import { MatchInfo } from '../types';

export function findLiteralMatches(text: string, criteria: string): MatchInfo[] {
  const lowerText = text.trim().toLowerCase();
  const pattern = criteria.endsWith(' ') 
    ? [criteria.toLowerCase()] 
    : criteria.trim().toLowerCase().split(' ');

  const wordsFound = pattern.filter((word: string) => lowerText.indexOf(word) >= 0).length;
  
  if (wordsFound !== pattern.length) {
    return [];
  }

  const matches: MatchInfo[] = [];
  
  for (const word of pattern) {
    let startIndex = 0;
    while ((startIndex = lowerText.indexOf(word, startIndex)) !== -1) {
      matches.push({
        start: startIndex,
        end: startIndex + word.length,
        text: text.substring(startIndex, startIndex + word.length),
        type: 'exact'
      });
      startIndex += word.length;
    }
  }
  
  return matches;
}

export function findFuzzyMatches(text: string, criteria: string): MatchInfo[] {
  criteria = criteria.trimEnd();
  if (criteria.length === 0) return [];

  const lowerText = text.toLowerCase();
  const lowerCriteria = criteria.toLowerCase();
  
  let textIndex = 0;
  let criteriaIndex = 0;
  const matchedIndices: number[] = [];
  
  while (textIndex < text.length && criteriaIndex < criteria.length) {
    if (lowerText[textIndex] === lowerCriteria[criteriaIndex]) {
      matchedIndices.push(textIndex);
      criteriaIndex++;
    }
    textIndex++;
  }
  
  if (criteriaIndex !== criteria.length) {
    return [];
  }
  
  if (matchedIndices.length === 0) {
    return [];
  }
  
  const start = matchedIndices[0];
  const end = matchedIndices[matchedIndices.length - 1] + 1;
  
  return [{
    start,
    end,
    text: text.substring(start, end),
    type: 'fuzzy'
  }];
}

export function findWildcardMatches(text: string, pattern: string): MatchInfo[] {
  const regexPattern = pattern.replace(/\*/g, '.*');
  const regex = new RegExp(regexPattern, 'gi');
  const matches: MatchInfo[] = [];
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'wildcard'
    });
    
    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
  }
  
  return matches;
}


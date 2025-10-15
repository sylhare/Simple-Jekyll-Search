import { MatchInfo } from '../SearchStrategies/types';

export interface HighlightOptions {
  className?: string;
  maxLength?: number;
  contextLength?: number;
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export function mergeOverlappingMatches(matches: MatchInfo[]): MatchInfo[] {
  if (matches.length === 0) return [];
  
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const merged: MatchInfo[] = [{ ...sorted[0] }];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }
  
  return merged;
}

export function highlightWithMatchInfo(
  text: string, 
  matchInfo: MatchInfo[], 
  options: HighlightOptions = {}
): string {
  if (!text || matchInfo.length === 0) {
    return escapeHtml(text);
  }
  
  const className = options.className || 'search-highlight';
  const maxLength = options.maxLength;
  
  const mergedMatches = mergeOverlappingMatches(matchInfo);
  
  let result = '';
  let lastIndex = 0;
  
  for (const match of mergedMatches) {
    result += escapeHtml(text.substring(lastIndex, match.start));
    result += `<span class="${className}">${escapeHtml(text.substring(match.start, match.end))}</span>`;
    lastIndex = match.end;
  }
  
  result += escapeHtml(text.substring(lastIndex));
  
  if (maxLength && result.length > maxLength) {
    result = truncateAroundMatches(text, mergedMatches, maxLength, options.contextLength || 30, className);
  }
  
  return result;
}

function truncateAroundMatches(
  text: string,
  matches: MatchInfo[],
  maxLength: number,
  contextLength: number,
  className: string
): string {
  if (matches.length === 0) {
    const truncated = text.substring(0, maxLength - 3);
    return escapeHtml(truncated) + '...';
  }
  
  const firstMatch = matches[0];
  const start = Math.max(0, firstMatch.start - contextLength);
  const end = Math.min(text.length, firstMatch.end + contextLength);
  
  let result = '';
  
  if (start > 0) {
    result += '...';
  }
  
  const snippet = text.substring(start, end);
  const adjustedMatches = matches
    .filter(m => m.start < end && m.end > start)
    .map(m => ({
      ...m,
      start: Math.max(0, m.start - start),
      end: Math.min(snippet.length, m.end - start)
    }));
  
  let lastIndex = 0;
  for (const match of adjustedMatches) {
    result += escapeHtml(snippet.substring(lastIndex, match.start));
    result += `<span class="${className}">${escapeHtml(snippet.substring(match.start, match.end))}</span>`;
    lastIndex = match.end;
  }
  result += escapeHtml(snippet.substring(lastIndex));
  
  if (end < text.length) {
    result += '...';
  }
  
  return result;
}


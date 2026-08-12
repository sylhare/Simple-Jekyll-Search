import { MatchInfo, WildcardConfig } from '../types';
import { memoizeLast } from '../../utils';

/** Memoizes the compiled regex for the last (pattern, maxSpaces), reused across every item in a search. */
const buildWildcardRegex = memoizeLast(
  (pattern: string, config: WildcardConfig) =>
    new RegExp(pattern.replace(/\*/g, buildWildcardFragment(config)), 'gi'),
  (pattern, config) => `${pattern} ${config.maxSpaces ?? ''}`,
);

function getWildcardRegex(pattern: string, config: WildcardConfig): RegExp {
  const regex = buildWildcardRegex(pattern, config);
  regex.lastIndex = 0;
  return regex;
}

/**
 * Finds matches using wildcard patterns (* matches any non-space characters).
 * Uses regex to find all matching patterns in the text.
 * Wildcards stop at spaces by default - configure `maxSpaces` to span across words.
 *
 * UNUSED at runtime: only {@link buildWildcardFragment} is used by the in-use
 * strategies ({@link UnifiedSearchStrategy}). This function is reached only by the
 * unused {@link WildcardSearchStrategy}, so it is tree-shaken out of the bundle.
 *
 * @param text - The text to search in
 * @param pattern - The wildcard pattern (e.g., "hel*" matches "hello" but not "hello world")
 * @param config - Optional wildcard configuration
 * @returns Array of MatchInfo objects for each wildcard match
 */
export function findWildcardMatches(text: string, pattern: string, config: WildcardConfig = {}): MatchInfo[] {
  const regex = getWildcardRegex(pattern, config);
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

export function buildWildcardFragment(config: WildcardConfig): string {
  const maxSpaces = normalizeMaxSpaces(config.maxSpaces);
  if (maxSpaces === 0) {
    return '[^ ]*';
  }

  if (maxSpaces === Infinity) {
    return '[^ ]*(?: [^ ]*)*';
  }

  return `[^ ]*(?: [^ ]*){0,${maxSpaces}}`;
}

function normalizeMaxSpaces(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return Infinity;
  }

  return Math.floor(value);
}

import { MatchInfo, WildcardConfig } from '../types';
import { memoizeLast } from '../../utils';
import { buildWildcardFragment } from './buildWildcardFragment';

/** Unused — the pre-unified wildcard matcher, tree-shaken from the bundle. See `tests/performance/README.md`. */

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

/** Finds wildcard matches; `*` spans non-space characters, `maxSpaces` lets it cross words. */
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

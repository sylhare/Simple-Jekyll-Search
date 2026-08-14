import { findWildcardMatches } from './search/findWildcardMatches';
import { findLiteralMatches } from './search/findLiteralMatches';
import { SearchStrategy, WildcardConfig } from './types';

/** Unused — standalone wildcard strategy superseded by UnifiedSearchStrategy (tree-shaken from the bundle). See `tests/performance/README.md`. */
export class WildcardSearchStrategy extends SearchStrategy {
  constructor(config: WildcardConfig = {}) {
    const normalizedConfig = { ...config };
    super((text: string, criteria: string) => {
      const wildcardMatches = findWildcardMatches(text, criteria, normalizedConfig);
      if (wildcardMatches.length > 0) {
        return wildcardMatches;
      }
      return findLiteralMatches(text, criteria);
    });
  }
}

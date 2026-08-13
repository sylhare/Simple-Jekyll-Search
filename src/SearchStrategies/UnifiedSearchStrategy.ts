import { SearchStrategy, MatchInfo, StrategyOptions } from './types';
import { buildWildcardFragment } from './search/findWildcardMatches';
import { findFuzzyMatches } from './search/findFuzzyMatches';

/**
 * A single-strategy alternative to HybridSearchStrategy, selectable as the
 * 'unified' strategy and used to back the 'wildcard' strategy. It replaces the
 * findLiteralMatches path and the hybridFind cascade with per-token regexes, and
 * folds applyFuzzyConstraints into one inline budget check:
 *
 *   exact    → the escaped token           (native literal substring, all occurrences)
 *   wildcard → `*` swapped for the shared wildcard fragment (reuses buildWildcardFragment)
 *   fuzzy    → the existing linear findFuzzyMatches, then a budget check
 *
 * Fuzzy deliberately does NOT use a regex: a lazy `.*?` subsequence pattern
 * backtracks catastrophically on long queries against non-matching text
 * (measured ~80x slower + a ReDoS cliff), whereas findFuzzyMatches is a linear
 * single pass. A fuzzy-eligible token tries exact first, then fuzzy.
 *
 * Two intentional differences from the original hybrid cascade (pinned in the tests):
 * multi-word queries AND their tokens exact-per-token with no whole-query fuzzy
 * fallback, and an exact substring returns one 'exact' span per occurrence rather
 * than a single 'fuzzy' span.
 *
 * It extends SearchStrategy (the Matcher API) and accepts the same
 * StrategyOptions as HybridSearchStrategy. See tests/performance for the
 * benchmark that motivated adopting it.
 */

type ResolvedOptions = Required<Pick<StrategyOptions,
  'preferFuzzy' | 'wildcardPriority' | 'minFuzzyLength' | 'maxExtraFuzzyChars' | 'maxSpaces'>>;

/** JS regex metacharacters; META_NO_STAR keeps '*' unescaped so the wildcard path can translate it. */
const META = /[.*+?^${}()|[\]\\]/g;
const META_NO_STAR = /[.+?^${}()|[\]\\]/g;

function stripWhitespace(value: string): string {
  return value.replace(/\s+/g, '');
}

type SpanMatcher = (text: string) => MatchInfo[];

interface Clause {
  matchers: SpanMatcher[];
}

export class UnifiedSearchStrategy extends SearchStrategy {
  private readonly config: Readonly<ResolvedOptions>;
  private cachedCriteria: string | undefined;
  private cachedClauses: Clause[] = [];

  constructor(config: StrategyOptions = {}) {
    super((text: string, criteria: string) => this.find(text, criteria));
    this.config = {
      preferFuzzy: config.preferFuzzy ?? false,
      wildcardPriority: config.wildcardPriority ?? true,
      minFuzzyLength: config.minFuzzyLength ?? 4,
      maxExtraFuzzyChars: config.maxExtraFuzzyChars ?? 2,
      maxSpaces: config.maxSpaces ?? 1,
    };
  }

  private find(text: string, criteria: string): MatchInfo[] {
    const clauses = this.compile(criteria);
    if (clauses.length === 0) {
      return [];
    }

    const matches: MatchInfo[] = [];
    for (const clause of clauses) {
      const spans = this.run(clause, text);
      if (spans.length === 0) {
        return [];
      }
      matches.push(...spans);
    }
    return matches;
  }

  /** Memoizes clause compilation on the last criteria seen, reused across every item in a search. */
  private compile(criteria: string): Clause[] {
    if (criteria !== this.cachedCriteria) {
      this.cachedCriteria = criteria;
      this.cachedClauses = this.buildClauses(criteria);
    }
    return this.cachedClauses;
  }

  private buildClauses(criteria: string): Clause[] {
    if (this.config.wildcardPriority && criteria.includes('*')) {
      return [{ matchers: [this.wildcardMatcher(criteria)] }];
    }

    const tokens = criteria.split(/\s+/).filter(Boolean);
    const multiWord = tokens.length > 1;
    return tokens.map(token => {
      const fuzzy = !multiWord && (this.config.preferFuzzy || token.length >= this.config.minFuzzyLength);
      const matchers = fuzzy
        ? [this.exactMatcher(token), this.fuzzyMatcher(token)]
        : [this.exactMatcher(token)];
      return { matchers };
    });
  }

  private exactMatcher(token: string): SpanMatcher {
    const regex = new RegExp(token.replace(META, '\\$&'), 'gi');
    return (text: string) => this.collect(regex, text, 'exact');
  }

  private wildcardMatcher(criteria: string): SpanMatcher {
    const pattern = criteria.replace(META_NO_STAR, '\\$&').replace(/\*/g, buildWildcardFragment(this.config));
    const regex = new RegExp(pattern, 'gi');
    return (text: string) => this.collect(regex, text, 'wildcard');
  }

  private fuzzyMatcher(token: string): SpanMatcher {
    const tokenLength = stripWhitespace(token).length;
    return (text: string) => {
      const matches = findFuzzyMatches(text, token); // linear subsequence scan, no backtracking
      if (matches.length === 0 || !this.withinBudget(tokenLength, matches[0].text)) {
        return [];
      }
      return matches;
    };
  }

  private run(clause: Clause, text: string): MatchInfo[] {
    for (const matcher of clause.matchers) {
      const spans = matcher(text);
      if (spans.length > 0) {
        return spans;
      }
    }
    return [];
  }

  private collect(regex: RegExp, text: string, type: MatchInfo['type']): MatchInfo[] {
    regex.lastIndex = 0;
    const spans: MatchInfo[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      spans.push({ start: match.index, end: match.index + match[0].length, text: match[0], type });
      if (regex.lastIndex === match.index) {
        regex.lastIndex++; // avoid an infinite loop on a zero-width match
      }
    }
    return spans;
  }

  private withinBudget(tokenLength: number, matchText: string): boolean {
    const limit = this.config.maxExtraFuzzyChars;
    if (!Number.isFinite(limit) || limit < 0 || tokenLength === 0) {
      return true;
    }
    const extra = Math.max(0, stripWhitespace(matchText).length - tokenLength);
    return extra <= limit;
  }
}

export const DefaultUnifiedSearchStrategy = new UnifiedSearchStrategy();

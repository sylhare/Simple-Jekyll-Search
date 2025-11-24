import type { StrategyType } from './StrategyFactory';

export interface MatchInfo {
  start: number;
  end: number;
  text: string;
  type: 'exact' | 'fuzzy' | 'wildcard';
}

export interface Matcher {
  matches(text: string | null, criteria: string): boolean;
  findMatches?(text: string | null, criteria: string): MatchInfo[];
}

export interface HybridConfig {
  preferFuzzy?: boolean;
  wildcardPriority?: boolean;
  minFuzzyLength?: number;
  /**
   * Maximum number of additional non-whitespace characters that a fuzzy match
   * is allowed to span beyond the query length. Set to a negative number or
   * Infinity to disable this guard.
   */
  maxExtraFuzzyChars?: number;
}

export interface WildcardOptions {
  /**
   * Maximum number of spaces a `*` wildcard is allowed to span within a single match.
   * Defaults to 0, which means wildcards stop at spaces.
   */
  maxSpaces?: number;
}

export type WildcardConfig = WildcardOptions;

export interface StrategyOptions extends HybridConfig, WildcardConfig {}

export interface StrategyConfig {
  type: StrategyType;
  options?: StrategyOptions;
}

export class SearchStrategy implements Matcher {
  private readonly findMatchesFunction: (text: string, criteria: string) => MatchInfo[];

  constructor(findMatchesFunction: (text: string, criteria: string) => MatchInfo[]) {
    this.findMatchesFunction = findMatchesFunction;
  }

  matches(text: string | null, criteria: string): boolean {
    if (text === null || text.trim() === '' || !criteria) {
      return false;
    }

    const matchInfo = this.findMatchesFunction(text, criteria);
    return matchInfo.length > 0;
  }

  findMatches(text: string | null, criteria: string): MatchInfo[] {
    if (text === null || text.trim() === '' || !criteria) {
      return [];
    }

    return this.findMatchesFunction(text, criteria);
  }
}
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

export class SearchStrategy implements Matcher {
  private readonly matchFunction: (text: string, criteria: string) => boolean;
  private readonly findMatchesFunction?: (text: string, criteria: string) => MatchInfo[];

  constructor(matchFunction: (text: string, criteria: string) => boolean, findMatchesFunction?: (text: string, criteria: string) => MatchInfo[]) {
    this.matchFunction = matchFunction;
    this.findMatchesFunction = findMatchesFunction;
  }

  matches(text: string | null, criteria: string): boolean {
    if (text === null || text.trim() === '' || !criteria) {
      return false;
    }

    return this.matchFunction(text, criteria);
  }

  findMatches?(text: string | null, criteria: string): MatchInfo[] {
    if (text === null || text.trim() === '' || !criteria || !this.findMatchesFunction) {
      return [];
    }

    return this.findMatchesFunction(text, criteria);
  }
}
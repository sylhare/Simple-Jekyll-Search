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
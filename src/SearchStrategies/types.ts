export interface Matcher {
  matches(text: string | null, criteria: string): boolean;
}

export class SearchStrategy implements Matcher {
  private readonly matchFunction: (text: string | null, criteria: string) => boolean;

  constructor(matchFunction: (text: string | null, criteria: string) => boolean) {
    this.matchFunction = matchFunction;
  }

  matches(text: string | null, criteria: string): boolean {
    if (text === null || text.trim() === '' || !criteria) {
      return false;
    }

    return this.matchFunction(text, criteria);
  }
}
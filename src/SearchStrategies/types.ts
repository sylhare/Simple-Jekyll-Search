export interface SearchStrategy {
  matches(text: string | null, criteria: string): boolean;
}

export abstract class AbstractSearchStrategy implements SearchStrategy {
  abstract doMatch(text: string | null, criteria: string): boolean;

  matches(text: string | null, criteria: string): boolean {
    if (text === null || text.trim() === '' || !criteria) {
      return false;
    }

    return this.doMatch(text, criteria);
  }
}

export interface SearchStrategy {
  matches(text: string | null, criteria: string): boolean;
} 
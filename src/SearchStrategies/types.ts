import { SearchCache } from './SearchCache';

export interface MatchInfo {
  start: number;
  end: number;
  text: string;
  type: 'exact' | 'fuzzy' | 'wildcard';
}

export interface Matcher {
  matches(text: string | null, criteria: string): boolean;
  findMatches?(text: string | null, criteria: string): MatchInfo[];
  clearCache?(): void;
  getCacheStats?(): { hitRate: number; size: number };
}

interface CachedResult {
  matches: boolean;
  matchInfo: MatchInfo[];
}

export class SearchStrategy implements Matcher {
  private readonly findMatchesFunction: (text: string, criteria: string) => MatchInfo[];
  private readonly cache: SearchCache<CachedResult>;

  constructor(
    findMatchesFunction: (text: string, criteria: string) => MatchInfo[]
  ) {
    this.findMatchesFunction = findMatchesFunction;
    this.cache = new SearchCache<CachedResult>({ maxSize: 500, ttl: 60000 });
  }

  matches(text: string | null, criteria: string): boolean {
    if (text === null || text.trim() === '' || !criteria) {
      return false;
    }

    const cacheKey = this.getCacheKey(text, criteria);
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached.matches;
    }

    const matchInfo = this.findMatchesInternal(text, criteria);
    const result: CachedResult = {
      matches: matchInfo.length > 0,
      matchInfo
    };
    
    this.cache.set(cacheKey, result);
    return result.matches;
  }

  findMatches(text: string | null, criteria: string): MatchInfo[] {
    if (text === null || text.trim() === '' || !criteria) {
      return [];
    }

    const cacheKey = this.getCacheKey(text, criteria);
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached.matchInfo;
    }

    const matchInfo = this.findMatchesInternal(text, criteria);
    const result: CachedResult = {
      matches: matchInfo.length > 0,
      matchInfo
    };
    
    this.cache.set(cacheKey, result);
    return result.matchInfo;
  }

  private findMatchesInternal(text: string, criteria: string): MatchInfo[] {
    if (this.findMatchesFunction) {
      return this.findMatchesFunction(text, criteria);
    }
    return [];
  }

  private getCacheKey(text: string, criteria: string): string {
    return `${text.length}:${criteria}:${text.substring(0, 20)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { hitRate: number; size: number } {
    const stats = this.cache.getStats();
    return {
      hitRate: stats.hitRate,
      size: stats.size
    };
  }
}
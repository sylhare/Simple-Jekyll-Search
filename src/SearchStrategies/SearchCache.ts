export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

export interface CacheOptions {
  maxSize: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  ttl: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export class SearchCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: CacheOptions;
  private hitCount = 0;
  private missCount = 0;
  
  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 60000
    };
  }
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }
    
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }
    
    entry.hits++;
    this.hitCount++;
    
    return entry.value;
  }
  
  set(key: string, value: T): void {
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    });
  }
  
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
  
  private evictOldest(): void {
    let oldestKey: string | undefined;
    let lowestScore = Infinity;
    
    for (const [key, entry] of this.cache) {
      const score = entry.timestamp + (entry.hits * 10000);
      if (score < lowestScore) {
        lowestScore = score;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      ttl: this.options.ttl,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: Math.round(hitRate * 10000) / 100
    };
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}


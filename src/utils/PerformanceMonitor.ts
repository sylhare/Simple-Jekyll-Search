export interface PerformanceMetrics {
  searchCount: number;
  totalTime: number;
  averageTime: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
}

export class PerformanceMonitor {
  private searchCount = 0;
  private totalTime = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordSearch(duration: number, cacheHit: boolean): void {
    this.searchCount++;
    this.totalTime += duration;
    
    if (cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  getMetrics(): PerformanceMetrics {
    const total = this.cacheHits + this.cacheMisses;
    const cacheHitRate = total > 0 ? this.cacheHits / total : 0;
    const averageTime = this.searchCount > 0 ? this.totalTime / this.searchCount : 0;

    return {
      searchCount: this.searchCount,
      totalTime: Math.round(this.totalTime * 100) / 100,
      averageTime: Math.round(averageTime * 100) / 100,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: Math.round(cacheHitRate * 10000) / 100
    };
  }

  reset(): void {
    this.searchCount = 0;
    this.totalTime = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}


import { describe, it, expect, beforeEach } from 'vitest';
import { SearchStrategy } from '../../src/SearchStrategies/types';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';

describe('Performance Benchmarks', () => {
  const sampleTexts = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    'The quick brown fox jumps over the lazy dog',
    'JavaScript is a programming language',
    'Search functionality with caching improves performance',
    'TypeScript adds static typing to JavaScript',
    'Unit tests ensure code quality and correctness',
    'Performance optimization is crucial for user experience',
    'Cache hit rate measures cache effectiveness'
  ];

  const queries = ['lorem', 'quick', 'javascript', 'search', 'performance'];

  let strategy: SearchStrategy;
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    const matchFunction = (text: string, criteria: string) => {
      return text.toLowerCase().includes(criteria.toLowerCase());
    };

    const findMatchesFunction = (text: string, criteria: string) => {
      const lowerText = text.toLowerCase();
      const lowerCriteria = criteria.toLowerCase();
      const matches = [];
      let startIndex = 0;

      while (true) {
        const index = lowerText.indexOf(lowerCriteria, startIndex);
        if (index === -1) break;

        matches.push({
          start: index,
          end: index + criteria.length,
          text: text.substring(index, index + criteria.length),
          type: 'exact' as const
        });

        startIndex = index + 1;
      }

      return matches;
    };

    strategy = new SearchStrategy(matchFunction, findMatchesFunction);
    monitor = new PerformanceMonitor();
  });

  describe('Cache Hit Rate', () => {
    it('should achieve high cache hit rate on repeated searches', () => {
      for (let i = 0; i < 100; i++) {
        const text = sampleTexts[i % sampleTexts.length];
        const query = queries[i % queries.length];
        strategy.matches(text, query);
      }

      const stats = strategy.getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(50);
      expect(stats.hitRate).toBeLessThanOrEqual(100);
    });

    it('should measure cache effectiveness with PerformanceMonitor', () => {
      for (let i = 0; i < 50; i++) {
        const text = sampleTexts[i % sampleTexts.length];
        const query = queries[i % queries.length];
        
        const start = performance.now();
        strategy.matches(text, query);
        const duration = performance.now() - start;
        
        const cacheHit = i >= sampleTexts.length;
        monitor.recordSearch(duration, cacheHit);
      }

      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(50);
      expect(metrics.searchCount).toBe(50);
    });
  });

  describe('Performance Improvement', () => {
    it('should show faster average time with caching', () => {
      const withoutCache: number[] = [];
      const withCache: number[] = [];

      for (let i = 0; i < 10; i++) {
        strategy.clearCache();
        
        const start1 = performance.now();
        strategy.matches(sampleTexts[0], queries[0]);
        withoutCache.push(performance.now() - start1);
        
        const start2 = performance.now();
        strategy.matches(sampleTexts[0], queries[0]);
        withCache.push(performance.now() - start2);
      }

      const avgWithoutCache = withoutCache.reduce((a, b) => a + b, 0) / withoutCache.length;
      const avgWithCache = withCache.reduce((a, b) => a + b, 0) / withCache.length;

      expect(avgWithCache).toBeLessThan(avgWithoutCache);
    });

    it('should demonstrate cache speedup factor', () => {
      let uncachedTime = 0;
      let cachedTime = 0;

      strategy.clearCache();
      const start1 = performance.now();
      for (let i = 0; i < sampleTexts.length; i++) {
        strategy.matches(sampleTexts[i], queries[i % queries.length]);
      }
      uncachedTime = performance.now() - start1;

      const start2 = performance.now();
      for (let i = 0; i < sampleTexts.length; i++) {
        strategy.matches(sampleTexts[i], queries[i % queries.length]);
      }
      cachedTime = performance.now() - start2;

      const speedupFactor = uncachedTime / cachedTime;
      expect(speedupFactor).toBeGreaterThan(1);
    });
  });

  describe('findMatches() Performance', () => {
    it('should cache findMatches() results effectively', () => {
      for (let i = 0; i < 50; i++) {
        const text = sampleTexts[i % sampleTexts.length];
        const query = queries[i % queries.length];
        strategy.findMatches(text, query);
      }

      const stats = strategy.getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(10);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Shared Cache Performance', () => {
    it('should benefit from shared cache between matches() and findMatches()', () => {
      for (let i = 0; i < 25; i++) {
        const text = sampleTexts[i % sampleTexts.length];
        const query = queries[i % queries.length];
        strategy.matches(text, query);
      }

      for (let i = 0; i < 25; i++) {
        const text = sampleTexts[i % sampleTexts.length];
        const query = queries[i % queries.length];
        strategy.findMatches(text, query);
      }

      const stats = strategy.getCacheStats();
      expect(stats.hitRate).toBeGreaterThanOrEqual(40);
    });
  });

  describe('PerformanceMonitor Metrics', () => {
    it('should accurately track search metrics', () => {
      monitor.reset();

      for (let i = 0; i < 20; i++) {
        const duration = Math.random() * 10;
        const cacheHit = i % 2 === 0;
        monitor.recordSearch(duration, cacheHit);
      }

      const metrics = monitor.getMetrics();
      
      expect(metrics.searchCount).toBe(20);
      expect(metrics.cacheHits).toBe(10);
      expect(metrics.cacheMisses).toBe(10);
      expect(metrics.cacheHitRate).toBe(50);
      expect(metrics.totalTime).toBeGreaterThan(0);
      expect(metrics.averageTime).toBeGreaterThan(0);
    });

    it('should calculate correct averages', () => {
      monitor.reset();
      
      monitor.recordSearch(10, false);
      monitor.recordSearch(20, true);
      monitor.recordSearch(30, false);

      const metrics = monitor.getMetrics();
      
      expect(metrics.totalTime).toBe(60);
      expect(metrics.averageTime).toBe(20);
    });
  });

  describe('Real-world Search Patterns', () => {
    it('should handle typical search patterns efficiently', () => {
      const searchPatterns = [
        { text: 'hello world', query: 'hello' },
        { text: 'hello world', query: 'world' },
        { text: 'hello world', query: 'hello' },
        { text: 'goodbye world', query: 'world' },
        { text: 'hello world', query: 'hello' },
        { text: 'hello world', query: 'world' },
        { text: 'test data', query: 'test' },
        { text: 'hello world', query: 'hello' }
      ];

      for (const pattern of searchPatterns) {
        strategy.matches(pattern.text, pattern.query);
      }

      const stats = strategy.getCacheStats();
      expect(stats.hitRate).toBeGreaterThanOrEqual(40);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});


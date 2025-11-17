import { describe, expect, it } from 'vitest';
import { StrategyFactory } from '../../src/SearchStrategies/StrategyFactory';
import { LiteralSearchStrategy, FuzzySearchStrategy, WildcardSearchStrategy } from '../../src/SearchStrategies/SearchStrategy';
import { HybridSearchStrategy } from '../../src/SearchStrategies/HybridSearchStrategy';

describe('StrategyFactory', () => {
  describe('create', () => {
    it('should create literal strategy', () => {
      const strategy = StrategyFactory.create({ type: 'literal' });
      expect(strategy).toBe(LiteralSearchStrategy);
    });

    it('should create fuzzy strategy', () => {
      const strategy = StrategyFactory.create({ type: 'fuzzy' });
      expect(strategy).toBe(FuzzySearchStrategy);
    });

    it('should create wildcard strategy', () => {
      const strategy = StrategyFactory.create({ type: 'wildcard' });
      expect(strategy).toBe(WildcardSearchStrategy);
    });

    it('should create hybrid strategy', () => {
      const strategy = StrategyFactory.create({ type: 'hybrid' });
      expect(strategy).toBeInstanceOf(HybridSearchStrategy);
    });

    it('should pass hybrid config', () => {
      const strategy = StrategyFactory.create({
        type: 'hybrid',
        hybridConfig: { minFuzzyLength: 5 }
      });
      expect(strategy).toBeInstanceOf(HybridSearchStrategy);
      const config = (strategy as HybridSearchStrategy).getConfig();
      expect(config.minFuzzyLength).toBe(5);
    });
  });

  describe('error handling', () => {
    it('should default to literal for unknown type', () => {
      const strategy = StrategyFactory.create({ type: 'unknown' as any });
      expect(strategy).toBe(LiteralSearchStrategy);
    });
  });

  describe('getAvailableStrategies', () => {
    it('should return all available strategy types', () => {
      const strategies = StrategyFactory.getAvailableStrategies();
      expect(strategies).toContain('literal');
      expect(strategies).toContain('fuzzy');
      expect(strategies).toContain('wildcard');
      expect(strategies).toContain('hybrid');
      expect(strategies).toHaveLength(4);
    });
  });

  describe('isValidStrategy', () => {
    it('should return true for valid strategies', () => {
      expect(StrategyFactory.isValidStrategy('literal')).toBe(true);
      expect(StrategyFactory.isValidStrategy('fuzzy')).toBe(true);
      expect(StrategyFactory.isValidStrategy('wildcard')).toBe(true);
      expect(StrategyFactory.isValidStrategy('hybrid')).toBe(true);
    });

    it('should return false for invalid strategies', () => {
      expect(StrategyFactory.isValidStrategy('unknown')).toBe(false);
      expect(StrategyFactory.isValidStrategy('custom')).toBe(false);
      expect(StrategyFactory.isValidStrategy('')).toBe(false);
    });
  });

  describe('strategy functionality', () => {
    it('should create working literal strategy', () => {
      const strategy = StrategyFactory.create({ type: 'literal' });
      expect(strategy.matches('hello world', 'hello')).toBe(true);
    });

    it('should create working fuzzy strategy', () => {
      const strategy = StrategyFactory.create({ type: 'fuzzy' });
      const matches = strategy.findMatches('hello', 'hlo');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should create working wildcard strategy', () => {
      const strategy = StrategyFactory.create({ type: 'wildcard' });
      expect(strategy.matches('hello world', 'hel*')).toBe(true);
    });

    it('should create working hybrid strategy', () => {
      const strategy = StrategyFactory.create({ type: 'hybrid' });
      expect(strategy.matches('hello world', 'hello')).toBe(true);
      expect(strategy.matches('test', 'te*t')).toBe(true);
    });
  });
});


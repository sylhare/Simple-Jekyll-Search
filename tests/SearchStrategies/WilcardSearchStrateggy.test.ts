import { describe, it, expect } from 'vitest';
import WildcardSearchStrategy from '../../src/SearchStrategies/WildcardSearchStrategy';

describe('WildcardSearchStrategy', () => {
  const strategy = WildcardSearchStrategy;

  it('returns false when text is null', () => {
    const result = WildcardSearchStrategy.matches(null, 'criteria');
    expect(result).toBe(false);
  });

  it('returns true when text matches the criteria', () => {
    const result = strategy.matches('hello world', 'hello *');
    expect(result).toBe(true);
  });

  it('returns false when text does not match the criteria', () => {
    const result = strategy.matches('hello world', 'bye*');
    expect(result).toBe(false);
  });

  it('handles empty criteria', () => {
    const result = strategy.matches('hello world', '');
    expect(result).toBe(false);
  });

  it('handles empty text', () => {
    const result = strategy.matches('', 'criteria');
    expect(result).toBe(false);
  });

  it('handles wildcard patterns correctly', () => {
    const result = strategy.matches('hello world', 'h*o w*d');
    expect(result).toBe(true);
  });
});
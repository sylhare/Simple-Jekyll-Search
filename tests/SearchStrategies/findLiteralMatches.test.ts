import { describe, expect, it } from 'vitest';
import { findLiteralMatches } from '../../src/SearchStrategies/search/findLiteralMatches';

describe('findLiteralMatches', () => {
  it('does not match a word that is partially contained in the search criteria when followed by a space', () => {
    expect(findLiteralMatches('this tasty tester text', 'test ')).toEqual([]);
  });

  it('matches exact single word', () => {
    const matches = findLiteralMatches('hello world', 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0].start).toBe(0);
    expect(matches[0].end).toBe(5);
    expect(matches[0].text).toBe('hello');
    expect(matches[0].type).toBe('exact');
  });

  it('matches multiple occurrences of the same word', () => {
    const matches = findLiteralMatches('hello world hello', 'hello');
    expect(matches).toHaveLength(2);
    expect(matches[0].start).toBe(0);
    expect(matches[0].end).toBe(5);
    expect(matches[1].start).toBe(12);
    expect(matches[1].end).toBe(17);
  });

  it('matches multi-word queries when all words present', () => {
    const matches = findLiteralMatches('hello amazing world', 'hello world');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some(m => m.text === 'hello')).toBe(true);
    expect(matches.some(m => m.text === 'world')).toBe(true);
  });

  it('does not match when not all words are present', () => {
    expect(findLiteralMatches('hello world', 'hello missing')).toEqual([]);
  });

  it('is case insensitive', () => {
    const matches = findLiteralMatches('HELLO world', 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('HELLO');
  });

  it('handles empty or null inputs', () => {
    expect(findLiteralMatches('', 'test')).toEqual([]);
    expect(findLiteralMatches('test', '')).toEqual([]);
  });

  it('matches substring within longer text', () => {
    const matches = findLiteralMatches('javascript is great', 'script');
    expect(matches).toHaveLength(1);
    expect(matches[0].start).toBe(4);
    expect(matches[0].end).toBe(10);
  });

  it('handles special characters', () => {
    const matches = findLiteralMatches('hello@world.com', '@world');
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('@world');
  });
});


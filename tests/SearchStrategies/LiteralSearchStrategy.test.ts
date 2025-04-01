import { describe, it, expect } from 'vitest';
import LiteralSearchStrategy from '../../src/SearchStrategies/LiteralSearchStrategy';

describe('LiteralSearchStrategy', () => {
  it('matches a word that is contained in the search criteria (single words)', () => {
    expect(LiteralSearchStrategy.matches('hello world test search text', 'world')).toBe(true);
  });

  it('does not match if a word is not contained in the search criteria', () => {
    expect(LiteralSearchStrategy.matches('hello world test search text', 'hello my world')).toBe(false);
  });

  it('matches a word that is contained in the search criteria (multiple words)', () => {
    expect(LiteralSearchStrategy.matches('hello world test search text', 'hello text world')).toBe(true);
  });

  it('matches exact words when exacts words with space in the search criteria', () => {
    expect(LiteralSearchStrategy.matches('hello world test search text', 'hello world ')).toBe(true);
  });

  it('does not matches multiple words if not exact words with space in the search criteria', () => {
    expect(LiteralSearchStrategy.matches('hello world test search text', 'hello text world ')).toBe(false);
  });

  it('matches a word that is partially contained in the search criteria', () => {
    expect(LiteralSearchStrategy.matches('this tasty tester text', 'test')).toBe(true);
  });

  it('does not matches a word that is partially contained in the search criteria when followed by a space', () => {
    expect(LiteralSearchStrategy.matches('this tasty tester text', 'test ')).toBe(false);
  });
}); 
import { describe, expect, it } from 'vitest';
import { findLiteralMatches } from '../../src/SearchStrategies/search/literalSearch';

describe('findLiteralMatches', () => {

  it('does not match a word that is partially contained in the search criteria when followed by a space', () => {
    const matches = findLiteralMatches('this tasty tester text', 'test ');
    expect(matches.length).toBe(0);
  });
});
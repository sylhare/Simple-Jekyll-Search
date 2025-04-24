import { describe, expect, it } from 'vitest';
import { literalSearch } from '../../src/SearchStrategies/LiteralSearchStrategy';

describe('literalSearch', () => {

  it('does not match a word that is partially contained in the search criteria when followed by a space', () => {
    expect(literalSearch('this tasty tester text', 'test ')).toBe(false);
  });
});
import { describe, expect, it } from 'vitest';
import { buildWildcardFragment } from '../../src/SearchStrategies/search/buildWildcardFragment';

describe('buildWildcardFragment', () => {
  it('returns single-word pattern by default', () => {
    expect(buildWildcardFragment({})).toBe('[^ ]*');
  });

  it('allows configuring finite spaces', () => {
    expect(buildWildcardFragment({ maxSpaces: 2 })).toBe('[^ ]*(?: [^ ]*){0,2}');
  });

  it('normalizes values less than or equal to zero back to default', () => {
    expect(buildWildcardFragment({ maxSpaces: 0 })).toBe('[^ ]*');
    expect(buildWildcardFragment({ maxSpaces: -5 })).toBe('[^ ]*');
  });

  it('supports unlimited spaces with Infinity', () => {
    expect(buildWildcardFragment({ maxSpaces: Infinity })).toBe('[^ ]*(?: [^ ]*)*');
  });

  it('floors decimal inputs', () => {
    expect(buildWildcardFragment({ maxSpaces: 2.9 })).toBe('[^ ]*(?: [^ ]*){0,2}');
  });
});

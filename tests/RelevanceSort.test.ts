import { describe, expect, it } from 'vitest';
import { RelevanceSort, scoreResult } from '../src/utils/RelevanceSort';
import { RepositoryData } from '../src/utils/types';

function makeResult(matchInfo: RepositoryData['_matchInfo']): RepositoryData {
  return { _matchInfo: matchInfo };
}

describe('scoreResult', () => {
  it('returns 0 when there is no _matchInfo', () => {
    expect(scoreResult({})).toBe(0);
    expect(scoreResult({ _matchInfo: {} })).toBe(0);
  });

  it('scores exact matches higher than fuzzy matches', () => {
    const exact = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });
    const fuzzy = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'fuzzy' }],
    });

    expect(scoreResult(exact)).toBeGreaterThan(scoreResult(fuzzy));
  });

  it('scores fuzzy matches higher than wildcard matches', () => {
    const fuzzy = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'fuzzy' }],
    });
    const wildcard = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'wildcard' }],
    });

    expect(scoreResult(fuzzy)).toBeGreaterThan(scoreResult(wildcard));
  });

  it('scores title matches higher than content matches', () => {
    const titleMatch = makeResult({
      title: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });
    const contentMatch = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });

    expect(scoreResult(titleMatch)).toBeGreaterThan(scoreResult(contentMatch));
  });

  it('scores earlier matches higher than later ones', () => {
    const earlyMatch = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });
    const lateMatch = makeResult({
      content: [{ start: 50, end: 53, text: 'foo', type: 'exact' }],
    });

    expect(scoreResult(earlyMatch)).toBeGreaterThan(scoreResult(lateMatch));
  });

  it('accumulates score across multiple matches', () => {
    const singleMatch = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });
    const doubleMatch = makeResult({
      content: [
        { start: 0, end: 3, text: 'foo', type: 'exact' },
        { start: 10, end: 13, text: 'bar', type: 'exact' },
      ],
    });

    expect(scoreResult(doubleMatch)).toBeGreaterThan(scoreResult(singleMatch));
  });

  it('accumulates score across multiple fields', () => {
    const oneField = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });
    const twoFields = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
      tags: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });

    expect(scoreResult(twoFields)).toBeGreaterThan(scoreResult(oneField));
  });

  it('does not give negative position bonus for very late matches', () => {
    const lateMatch = makeResult({
      content: [{ start: 200, end: 203, text: 'foo', type: 'exact' }],
    });

    expect(scoreResult(lateMatch)).toBeGreaterThan(0);
  });

  it('scores adjacent multi-word matches higher than spread-out ones', () => {
    const adjacent = makeResult({
      content: [
        { start: 0, end: 3, text: 'mac', type: 'exact' },
        { start: 4, end: 8, text: 'tips', type: 'exact' },
      ],
    });
    const spreadOut = makeResult({
      content: [
        { start: 0, end: 3, text: 'mac', type: 'exact' },
        { start: 40, end: 44, text: 'tips', type: 'exact' },
      ],
    });

    expect(scoreResult(adjacent)).toBeGreaterThan(scoreResult(spreadOut));
  });

  it('gives no proximity bonus for a single match regardless of position', () => {
    const earlyScore = scoreResult(makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    }));
    const lateScore = scoreResult(makeResult({
      content: [{ start: 10, end: 13, text: 'foo', type: 'exact' }],
    }));
    expect(earlyScore - lateScore).toBe(10 * 2);
  });

  it('gives maximum proximity bonus when matches are consecutive', () => {
    const consecutive = makeResult({
      content: [
        { start: 0, end: 3, text: 'mac', type: 'exact' },
        { start: 3, end: 7, text: 'tips', type: 'exact' },
      ],
    });
    const gapped = makeResult({
      content: [
        { start: 0, end: 3, text: 'mac', type: 'exact' },
        { start: 4, end: 8, text: 'tips', type: 'exact' },
      ],
    });

    expect(scoreResult(consecutive)).toBeGreaterThan(scoreResult(gapped));
  });
});

describe('RelevanceSort', () => {
  it('sorts higher-scoring results first', () => {
    const titleMatch = makeResult({
      title: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });
    const contentMatch = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });

    const results = [contentMatch, titleMatch];
    results.sort(RelevanceSort);

    expect(results[0]).toBe(titleMatch);
    expect(results[1]).toBe(contentMatch);
  });

  it('returns 0 for equally-scored results', () => {
    const a = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });
    const b = makeResult({
      content: [{ start: 0, end: 3, text: 'foo', type: 'exact' }],
    });

    expect(RelevanceSort(a, b)).toBe(0);
  });

  it('sorts a realistic set of results by relevance', () => {
    const exactTitle = makeResult({
      title: [{ start: 0, end: 6, text: 'jekyll', type: 'exact' }],
    });
    const exactContent = makeResult({
      content: [{ start: 20, end: 26, text: 'jekyll', type: 'exact' }],
    });
    const fuzzyContent = makeResult({
      content: [{ start: 5, end: 11, text: 'jkyll', type: 'fuzzy' }],
    });

    const results = [fuzzyContent, exactContent, exactTitle];
    results.sort(RelevanceSort);

    expect(results[0]).toBe(exactTitle);
    expect(results[1]).toBe(exactContent);
    expect(results[2]).toBe(fuzzyContent);
  });
});

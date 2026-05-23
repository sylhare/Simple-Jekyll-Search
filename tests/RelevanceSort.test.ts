import { describe, expect, it } from 'vitest';
import { RelevanceSort, scoreResult } from '../src/utils/RelevanceSort';
import { MatchInfo } from '../src/SearchStrategies/types';
import { RepositoryData } from '../src/utils/types';

function makeMatch(overrides: Partial<MatchInfo> = {}): MatchInfo {
  return { start: 0, end: 3, text: 'foo', type: 'exact', ...overrides };
}

function makeResult(matchInfo: RepositoryData['_matchInfo']): RepositoryData {
  return { _matchInfo: matchInfo };
}

describe('scoreResult', () => {
  it('returns 0 when there is no _matchInfo', () => {
    expect(scoreResult({})).toBe(0);
    expect(scoreResult({ _matchInfo: {} })).toBe(0);
  });

  it('scores exact matches higher than fuzzy matches', () => {
    const exact = makeResult({ content: [makeMatch()] });
    const fuzzy = makeResult({ content: [makeMatch({ type: 'fuzzy' })] });

    expect(scoreResult(exact)).toBeGreaterThan(scoreResult(fuzzy));
  });

  it('scores fuzzy matches higher than wildcard matches', () => {
    const fuzzy = makeResult({ content: [makeMatch({ type: 'fuzzy' })] });
    const wildcard = makeResult({ content: [makeMatch({ type: 'wildcard' })] });

    expect(scoreResult(fuzzy)).toBeGreaterThan(scoreResult(wildcard));
  });

  it('scores title matches higher than content matches', () => {
    const titleMatch = makeResult({ title: [makeMatch()] });
    const contentMatch = makeResult({ content: [makeMatch()] });

    expect(scoreResult(titleMatch)).toBeGreaterThan(scoreResult(contentMatch));
  });

  it('scores earlier matches higher than later ones', () => {
    const earlyMatch = makeResult({ content: [makeMatch()] });
    const lateMatch = makeResult({ content: [makeMatch({ start: 50, end: 53 })] });

    expect(scoreResult(earlyMatch)).toBeGreaterThan(scoreResult(lateMatch));
  });

  it('accumulates score across multiple matches', () => {
    const singleMatch = makeResult({ content: [makeMatch()] });
    const doubleMatch = makeResult({
      content: [makeMatch(), makeMatch({ start: 10, end: 13, text: 'bar' })],
    });

    expect(scoreResult(doubleMatch)).toBeGreaterThan(scoreResult(singleMatch));
  });

  it('accumulates score across multiple fields', () => {
    const oneField = makeResult({ content: [makeMatch()] });
    const twoFields = makeResult({ content: [makeMatch()], tags: [makeMatch()] });

    expect(scoreResult(twoFields)).toBeGreaterThan(scoreResult(oneField));
  });

  it('does not give negative position bonus for very late matches', () => {
    const lateMatch = makeResult({ content: [makeMatch({ start: 200, end: 203 })] });

    expect(scoreResult(lateMatch)).toBeGreaterThan(0);
  });

  it('scores adjacent multi-word matches higher than spread-out ones', () => {
    const adjacent = makeResult({
      content: [makeMatch({ text: 'mac' }), makeMatch({ start: 4, end: 8, text: 'tips' })],
    });
    const spreadOut = makeResult({
      content: [makeMatch({ text: 'mac' }), makeMatch({ start: 40, end: 44, text: 'tips' })],
    });

    expect(scoreResult(adjacent)).toBeGreaterThan(scoreResult(spreadOut));
  });

  it('gives no proximity bonus for a single match regardless of position', () => {
    const earlyScore = scoreResult(makeResult({ content: [makeMatch()] }));
    const lateScore = scoreResult(makeResult({ content: [makeMatch({ start: 10, end: 13 })] }));
    expect(earlyScore - lateScore).toBe(10 * 2);
  });

  it('gives maximum proximity bonus when matches are consecutive', () => {
    const consecutive = makeResult({
      content: [makeMatch({ text: 'mac' }), makeMatch({ start: 3, end: 7, text: 'tips' })],
    });
    const gapped = makeResult({
      content: [makeMatch({ text: 'mac' }), makeMatch({ start: 4, end: 8, text: 'tips' })],
    });

    expect(scoreResult(consecutive)).toBeGreaterThan(scoreResult(gapped));
  });
});

describe('RelevanceSort', () => {
  it('sorts higher-scoring results first', () => {
    const titleMatch = makeResult({ title: [makeMatch()] });
    const contentMatch = makeResult({ content: [makeMatch()] });

    const results = [contentMatch, titleMatch];
    results.sort(RelevanceSort);

    expect(results[0]).toBe(titleMatch);
    expect(results[1]).toBe(contentMatch);
  });

  it('returns 0 for equally-scored results', () => {
    const a = makeResult({ content: [makeMatch()] });
    const b = makeResult({ content: [makeMatch()] });

    expect(RelevanceSort(a, b)).toBe(0);
  });

  it('sorts a realistic set of results by relevance', () => {
    const exactTitle = makeResult({ title: [makeMatch({ end: 6, text: 'jekyll' })] });
    const exactContent = makeResult({ content: [makeMatch({ start: 20, end: 26, text: 'jekyll' })] });
    const fuzzyContent = makeResult({ content: [makeMatch({ start: 5, end: 11, text: 'jkyll', type: 'fuzzy' })] });

    const results = [fuzzyContent, exactContent, exactTitle];
    results.sort(RelevanceSort);

    expect(results[0]).toBe(exactTitle);
    expect(results[1]).toBe(exactContent);
    expect(results[2]).toBe(fuzzyContent);
  });
});

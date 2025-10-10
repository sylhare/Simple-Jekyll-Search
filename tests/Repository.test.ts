import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Repository } from '../src/Repository';

interface TestElement {
  title: string;
  content: string;
}

interface EmployeeElement {
  name: string;
  role: string;
}

const barElement: TestElement = { title: 'bar', content: 'bar' };
const almostBarElement: TestElement = { title: 'almostbar', content: 'almostbar' };
const loremElement: TestElement = { title: 'lorem', content: 'lorem ipsum' };

const data: TestElement[] = [barElement, almostBarElement, loremElement];

function stripMatchInfo(results: any[]): any[] {
  return results.map(result => {
    const { _matchInfo, ...cleanResult } = result;
    return cleanResult;
  });
}

describe('Repository', () => {
  let repository: Repository;

  beforeEach(() => {
    repository = new Repository();
    repository.put(data);
  });

  afterEach(() => {
    repository.clear();
  });

  it('finds a simple string', () => {
    expect(stripMatchInfo(repository.search('bar'))).toEqual([barElement, almostBarElement]);
  });

  it('limits the search results to one even if found more', () => {
    repository.setOptions({ limit: 1 });
    expect(stripMatchInfo(repository.search('bar'))).toEqual([barElement]);
  });

  it('finds a long string', () => {
    expect(stripMatchInfo(repository.search('lorem ipsum'))).toEqual([loremElement]);
  });

  it('[deprecated] finds a fuzzy string', () => {
    repository.setOptions({ fuzzy: true });
    expect(stripMatchInfo(repository.search('lrm ism'))).toEqual([loremElement]);
  });

  it('finds a fuzzy string', () => {
    repository.setOptions({ strategy: 'fuzzy' });
    expect(stripMatchInfo(repository.search('lrm ism'))).toEqual([loremElement]);
  });

  it('finds items using a wildcard pattern', () => {
    repository.setOptions({ strategy: 'wildcard' });
    expect(stripMatchInfo(repository.search('* ispum'))).toEqual([loremElement]);
    expect(stripMatchInfo(repository.search('*bar'))).toEqual([barElement, almostBarElement]);
  });

  it('returns empty search results when an empty criteria is provided', () => {
    expect(repository.search('')).toEqual([]);
  });

  it('excludes items from search #1', () => {
    repository.setOptions({
      exclude: ['almostbar'],
    });
    expect(repository.search('almostbar')).toEqual([]);
  });

  it('excludes items from search #2', () => {
    repository.setOptions({
      sortMiddleware: (a: TestElement, b: TestElement) => {
        return a.title.localeCompare(b.title);
      },
    });
    expect(stripMatchInfo(repository.search('r'))).toEqual([almostBarElement, barElement, loremElement]);
  });

  it('search results should be a clone and not a reference to repository data', () => {
    const query = 'Developer';
    repository.put([
      { name: 'Alice', role: 'Developer' },
      { name: 'Bob', role: 'Designer' },
    ]);

    const results = repository.search(query);
    expect(stripMatchInfo(results)).toEqual([{ name: 'Alice', role: 'Developer' }]);

    (results as EmployeeElement[]).forEach(result => {
      result.role = 'Modified Role';
    });

    const originalData = repository.search(query);
    expect(stripMatchInfo(originalData)).toEqual([{ name: 'Alice', role: 'Developer' }]);
  });
});
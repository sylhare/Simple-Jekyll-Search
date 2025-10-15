import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Repository } from '../src/Repository';
import { SearchResult } from '../src/utils/types';

interface TestElement {
  title: string;
  content: string;
}

const barElement: TestElement = { title: 'bar', content: 'bar' };
const almostBarElement: TestElement = { title: 'almostbar', content: 'almostbar' };
const loremElement: TestElement = { title: 'lorem', content: 'lorem ipsum' };

const data: TestElement[] = [barElement, almostBarElement, loremElement];

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
    const results = repository.search('bar');
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject(barElement);
    expect(results[1]).toMatchObject(almostBarElement);
    expect(results[0]._matchInfo).toBeDefined();
  });

  it('limits the search results to one even if found more', () => {
    repository.setOptions({ limit: 1 });
    const results = repository.search('bar');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject(barElement);
    expect(results[0]._matchInfo).toBeDefined();
  });

  it('finds a long string', () => {
    const results = repository.search('lorem ipsum');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject(loremElement);
    expect(results[0]._matchInfo).toBeDefined();
  });

  it('[deprecated] finds a fuzzy string', () => {
    repository.setOptions({ fuzzy: true });
    const results = repository.search('lrm ism');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject(loremElement);
    expect(results[0]._matchInfo).toBeDefined();
  });

  it('finds a fuzzy string', () => {
    repository.setOptions({ strategy: 'fuzzy' });
    const results = repository.search('lrm ism');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject(loremElement);
    expect(results[0]._matchInfo).toBeDefined();
  });

  it('finds items using a wildcard pattern', () => {
    repository.setOptions({ strategy: 'wildcard' });
    const results1 = repository.search('* ipsum');
    expect(results1).toHaveLength(1);
    expect(results1[0]).toMatchObject(loremElement);
    expect(results1[0]._matchInfo).toBeDefined();
    
    const results2 = repository.search('*bar');
    expect(results2).toHaveLength(2);
    expect(results2[0]).toMatchObject(barElement);
    expect(results2[1]).toMatchObject(almostBarElement);
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
    const results = repository.search('r');
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject(almostBarElement);
    expect(results[1]).toMatchObject(barElement);
    expect(results[2]).toMatchObject(loremElement);
  });

  it('search results should be a clone and not a reference to repository data', () => {
    const query = 'Developer';
    repository.put(
      { name: 'Alice', role: 'Developer' },
      { name: 'Bob', role: 'Designer' },
    );

    const results = repository.search(query);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: 'Alice', role: 'Developer' });

    (results as SearchResult[]).forEach(result => {
      result.role = 'Modified Role';
    });

    const originalData = repository.search(query);
    expect(originalData).toHaveLength(1);
    expect(originalData[0]).toMatchObject({ name: 'Alice', role: 'Developer' });
  });
});
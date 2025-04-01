import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as repository from '../src/Repository';

interface TestElement {
  title: string;
  content: string;
}

const barElement: TestElement = { title: 'bar', content: 'bar' };
const almostBarElement: TestElement = { title: 'almostbar', content: 'almostbar' };
const loremElement: TestElement = { title: 'lorem', content: 'lorem ipsum' };

const data: TestElement[] = [barElement, almostBarElement, loremElement];

describe('Repository', () => {
  beforeEach(() => {
    repository.put(data);
  });

  afterEach(() => {
    repository.clear();
  });

  it('finds a simple string', () => {
    expect(repository.search('bar')).toEqual([barElement, almostBarElement]);
  });

  it('limits the search results to one even if found more', () => {
    repository.setOptions({ limit: 1 });
    expect(repository.search('bar')).toEqual([barElement]);
  });

  it('finds a long string', () => {
    expect(repository.search('lorem ipsum')).toEqual([loremElement]);
  });

  it('finds a fuzzy string', () => {
    repository.setOptions({ fuzzy: true });
    expect(repository.search('lrm ism')).toEqual([loremElement]);
  });

  it('returns empty search results when an empty criteria is provided', () => {
    expect(repository.search('')).toEqual([]);
  });

  it('excludes items from search #1', () => {
    repository.setOptions({
      exclude: ['almostbar']
    });
    expect(repository.search('almostbar')).toEqual([]);
  });

  it('excludes items from search #2', () => {
    repository.setOptions({
      sort: (a: TestElement, b: TestElement) => {
        return a.title.localeCompare(b.title);
      }
    });
    expect(repository.search('r')).toEqual([almostBarElement, barElement, loremElement]);
  });
}); 
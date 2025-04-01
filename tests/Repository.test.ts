import test from 'ava';
import * as repository from '../src/Repository';

interface TestElement {
  title: string;
  content: string;
}

const barElement: TestElement = { title: 'bar', content: 'bar' };
const almostBarElement: TestElement = { title: 'almostbar', content: 'almostbar' };
const loremElement: TestElement = { title: 'lorem', content: 'lorem ipsum' };

const data: TestElement[] = [barElement, almostBarElement, loremElement];

test.beforeEach(() => {
  repository.put(data);
});

test.afterEach(() => {
  repository.clear();
});

test('finds a simple string', t => {
  t.deepEqual(repository.search('bar'), [barElement, almostBarElement]);
});

test('limits the search results to one even if found more', t => {
  repository.setOptions({ limit: 1 });
  t.deepEqual(repository.search('bar'), [barElement]);
});

test('finds a long string', t => {
  t.deepEqual(repository.search('lorem ipsum'), [loremElement]);
});

test('finds a fuzzy string', t => {
  repository.setOptions({ fuzzy: true });
  t.deepEqual(repository.search('lrm ism'), [loremElement]);
});

test('returns empty search results when an empty criteria is provided', t => {
  t.deepEqual(repository.search(''), []);
});

test('excludes items from search #1', t => {
  repository.setOptions({
    exclude: ['almostbar']
  });
  t.deepEqual(repository.search('almostbar'), []);
});

test('excludes items from search #2', t => {
  repository.setOptions({
    sort: (a: TestElement, b: TestElement) => {
      return a.title.localeCompare(b.title);
    }
  });
  t.deepEqual(repository.search('r'), [almostBarElement, barElement, loremElement]);
}); 
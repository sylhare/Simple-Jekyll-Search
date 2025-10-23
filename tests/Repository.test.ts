import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Repository } from '../src/Repository';

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

  it('[v1.x deprecated] fuzzy option still works via backward compatibility', () => {
    // Test backward compatibility: fuzzy: true should work and show warning
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    repository.setOptions({ fuzzy: true });
    const results = repository.search('lrm ism');
    
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject(loremElement);
    expect(results[0]._matchInfo).toBeDefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[Simple Jekyll Search] Warning: fuzzy option is deprecated. Use strategy: "fuzzy" instead.');
    
    consoleWarnSpy.mockRestore();
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

  it('sorts search results alphabetically by title', () => {
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

  it('uses default NoSort when no sortMiddleware provided', () => {
    const results = repository.search('r');
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject(barElement);
    expect(results[1]).toMatchObject(almostBarElement);
    expect(results[2]).toMatchObject(loremElement);
  });

  it('demonstrates README example: custom sorting by section and caption', () => {
    const testData = [
      { section: 'Getting Started', caption: 'Installation', title: 'How to install' },
      { section: 'API Reference', caption: 'Methods', title: 'Available methods' },
      { section: 'Getting Started', caption: 'Configuration', title: 'How to configure' },
      { section: 'API Reference', caption: 'Properties', title: 'Object properties' }
    ];
    
    repository.put(testData);
    repository.setOptions({
      sortMiddleware: (a: any, b: any) => {
        const astr = String(a.section) + "-" + String(a.caption);
        const bstr = String(b.section) + "-" + String(b.caption);
        return astr.localeCompare(bstr);
      },
    });
    
    const results = repository.search('How');
    expect(results).toHaveLength(2);
    // Should be sorted by section first, then caption
    expect(results[0].section).toBe('Getting Started');
    expect(results[0].caption).toBe('Configuration');
    expect(results[1].section).toBe('Getting Started');
    expect(results[1].caption).toBe('Installation');
  });

  it('search results should be a clone and not a reference to repository data', () => {
    const query = 'Developer';
    const testData = [
      { name: 'Alice', role: 'Developer' },
      { name: 'Bob', role: 'Designer' }
    ];
    repository.put(testData);

    const results = repository.search(query);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: 'Alice', role: 'Developer' });

    (results as any[]).forEach(result => {
      result.role = 'Modified Role';
    });

    const originalData = repository.search(query);
    expect(originalData).toHaveLength(1);
    expect(originalData[0]).toMatchObject({ name: 'Alice', role: 'Developer' });
  });

  it('demonstrates README sortMiddleware example exactly', () => {
    // This test matches the exact example from the README
    const testData = [
      { section: 'API Reference', caption: 'Properties', title: 'Object properties' },
      { section: 'Getting Started', caption: 'Installation', title: 'How to install' },
      { section: 'API Reference', caption: 'Methods', title: 'Available methods' },
      { section: 'Getting Started', caption: 'Configuration', title: 'How to configure' }
    ];
    
    repository.put(testData);
    repository.setOptions({
      sortMiddleware: function(a: any, b: any) {
        var astr = String(a.section) + "-" + String(a.caption);
        var bstr = String(b.section) + "-" + String(b.caption);
        return astr.localeCompare(bstr);
      },
    });
    
    const results = repository.search('a'); // Search for 'a' to get all results
    expect(results).toHaveLength(4);
    
    // Should be sorted by section first, then caption alphabetically
    expect(results[0].section).toBe('API Reference');
    expect(results[0].caption).toBe('Methods');
    expect(results[1].section).toBe('API Reference');
    expect(results[1].caption).toBe('Properties');
    expect(results[2].section).toBe('Getting Started');
    expect(results[2].caption).toBe('Configuration');
    expect(results[3].section).toBe('Getting Started');
    expect(results[3].caption).toBe('Installation');
  });
});
import { describe, it, beforeEach, expect } from 'vitest';
import * as templater from '../src/Templater';

describe('Templater', () => {
  beforeEach(() => {
    templater.setOptions({
      template: '{foo}',
      pattern: /\{(.*?)\}/g
    });
  });

  it('renders the template with the provided data', () => {
    expect(templater.compile({ foo: 'bar' })).toBe('bar');

    templater.setOptions({
      template: '<a href="{url}">url</a>'
    });

    expect(templater.compile({ url: 'http://google.com' })).toBe('<a href="http://google.com">url</a>');
  });

  it('renders the template with the provided data and query', () => {
    expect(templater.compile({ foo: 'bar' })).toBe('bar');

    templater.setOptions({
      template: '<a href="{url}?query={query}">url</a>'
    });

    expect(templater.compile({ url: 'http://google.com', query: 'bar' })).toBe('<a href="http://google.com?query=bar">url</a>');
  });

  it('replaces not found properties with the original pattern', () => {
    const template = '{foo}';
    templater.setOptions({
      template
    });
    expect(templater.compile({ x: 'bar' })).toBe(template);
  });

  it('allows custom patterns to be set', () => {
    templater.setOptions({
      template: '{{foo}}',
      pattern: /\{\{(.*?)\}\}/g
    });
    expect(templater.compile({ foo: 'bar' })).toBe('bar');
  });

  it('middleware gets parameter to return new replacement', () => {
    templater.setOptions({
      template: '{foo} - {bar}',
      middleware(prop: string, value: string) {
        if (prop === 'bar') {
          return value.replace(/^\//, '');
        }
      }
    });

    const compiled = templater.compile({ foo: 'foo', bar: '/leading/slash' });

    expect(compiled).toBe('foo - leading/slash');
  });

  it('compile accepts optional query parameter', () => {
    templater.setOptions({
      template: '{foo}',
      middleware(_prop: string, value: string, _template: string, query?: string) {
        if (query) {
          return `${value} (query: ${query})`;
        }
        return value;
      }
    });

    const compiled = templater.compile({ foo: 'bar' }, 'test');
    expect(compiled).toBe('bar (query: test)');
  });

  it('middleware receives matchInfo when available', () => {
    templater.setOptions({
      template: '{desc}',
      middleware(_prop: string, value: string, _template: string, _query?: string, matchInfo?: any[]) {
        if (matchInfo && matchInfo.length > 0) {
          return `${value} [${matchInfo.length} matches]`;
        }
        return value;
      }
    });

    const data = {
      desc: 'hello world',
      _matchInfo: {
        desc: [
          { start: 0, end: 5, text: 'hello', type: 'exact' }
        ]
      }
    };

    const compiled = templater.compile(data, 'hello');
    expect(compiled).toBe('hello world [1 matches]');
  });

  it('middleware maintains backward compatibility with 3 parameters', () => {
    templater.setOptions({
      template: '{foo}',
      middleware(_prop: string, value: string) {
        return value.toUpperCase();
      }
    });

    const compiled = templater.compile({ foo: 'bar' }, 'query');
    expect(compiled).toBe('BAR');
  });

  it('middleware receives query but not matchInfo when matchInfo is unavailable', () => {
    templater.setOptions({
      template: '{foo}',
      middleware(_prop: string, value: string, _template: string, query?: string, matchInfo?: any[]) {
        if (query && !matchInfo) {
          return `${value} (query: ${query}, no matches)`;
        }
        return value;
      }
    });

    const compiled = templater.compile({ foo: 'bar' }, 'test');
    expect(compiled).toBe('bar (query: test, no matches)');
  });

  it('compile works without query parameter (backward compatible)', () => {
    templater.setOptions({
      template: '{foo}',
      middleware(_prop: string, value: string) {
        return value;
      }
    });

    const compiled = templater.compile({ foo: 'bar' });
    expect(compiled).toBe('bar');
  });

  it('demonstrates README example: uppercase title middleware', () => {
    templater.setOptions({
      template: '<li>{title}</li>',
      middleware(prop: string, value: string) {
        if (prop === 'title') {
          return value.toUpperCase();
        }
        return undefined
      }
    });

    const data = { title: 'my post' };
    const compiled = templater.compile(data);
    expect(compiled).toBe('<li>MY POST</li>');
  });

  it('demonstrates multiple property processing with different transformations', () => {
    templater.setOptions({
      template: '<li><a href="{url}">{title}</a><p>{desc}</p></li>',
      middleware(prop: string, value: string) {
        if (prop === 'url') {
          return value.replace(/^\//, ''); // Remove leading slash
        }
        if (prop === 'title') {
          return value.toUpperCase();
        }
        return undefined;
      }
    });

    const data = { 
      url: '/blog/post', 
      title: 'my post', 
      desc: 'description' 
    };
    const compiled = templater.compile(data);
    expect(compiled).toBe('<li><a href="blog/post">MY POST</a><p>description</p></li>');
  });
}); 
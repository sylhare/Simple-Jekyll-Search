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
}); 
import { MatchInfo } from './SearchStrategies/types';

type MiddlewareFunction = (
  prop: string, 
  value: any, 
  template: string, 
  query?: string, 
  matchInfo?: MatchInfo[]
) => any;

interface TemplaterOptions {
  pattern?: RegExp;
  template?: string;
  middleware?: MiddlewareFunction;
}

interface Data {
  [key: string]: any;
  _matchInfo?: Record<string, MatchInfo[]>;
}

const options: TemplaterOptions & { pattern: RegExp; template: string; middleware: MiddlewareFunction } = {
  pattern: /\{(.*?)\}/g,
  template: '',
  middleware: function() { return undefined; }
};

export function setOptions(_options: TemplaterOptions): void {
  if (_options.pattern) {
    options.pattern = _options.pattern;
  }
  if (_options.template) {
    options.template = _options.template;
  }
  if (typeof _options.middleware === 'function') {
    options.middleware = _options.middleware;
  }
}

function resolveMiddlewareValue(prop: string, data: Data, query?: string): any {
  const matchInfo = data._matchInfo?.[prop];
  const attempts: Array<() => any> = [];

  if (matchInfo && matchInfo.length > 0 && query) {
    attempts.push(() => options.middleware(prop, data[prop], options.template, query, matchInfo));
  }
  if (query) {
    attempts.push(() => options.middleware(prop, data[prop], options.template, query));
  }
  attempts.push(() => options.middleware(prop, data[prop], options.template));

  for (const attempt of attempts) {
    const value = attempt();
    if (typeof value !== 'undefined') {
      return value;
    }
  }
  return undefined;
}

export function compile(data: Data, query?: string): string {
  return options.template.replace(options.pattern, function(match: string, prop: string) {
    const value = resolveMiddlewareValue(prop, data, query);
    return typeof value !== 'undefined' ? value : (data[prop] || match);
  });
} 
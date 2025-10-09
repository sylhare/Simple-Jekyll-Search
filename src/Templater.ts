type MiddlewareFunction = (prop: string, value: any, template: string, query?: string) => any;

interface TemplaterOptions {
  pattern?: RegExp;
  template?: string;
  middleware?: MiddlewareFunction;
}

interface Data {
  [key: string]: any;
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

export function compile(data: Data, query?: string): string {
  return options.template.replace(options.pattern, function(match: string, prop: string) {
    // Check if middleware supports matchInfo parameter (5 parameters including matchInfo)
    if (options.middleware.length >= 5 && data._matchInfo && data._matchInfo[prop]) {
      const value = (options.middleware as any)(prop, data[prop], options.template, query, data._matchInfo[prop]);
      if (typeof value !== 'undefined') {
        return value;
      }
    }
    
    // Fallback to current behavior
    const value = options.middleware(prop, data[prop], options.template, query);
    if (typeof value !== 'undefined') {
      return value;
    }
    return data[prop] || match;
  });
} 
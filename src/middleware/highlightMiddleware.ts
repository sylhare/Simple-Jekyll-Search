import { MatchInfo } from '../SearchStrategies/types';
import { highlightWithMatchInfo, HighlightOptions } from './highlighting';

export function createHighlightTemplateMiddleware(options: HighlightOptions = {}) {
  const highlightOptions: HighlightOptions = {
    className: options.className || 'search-highlight',
    maxLength: options.maxLength,
    contextLength: options.contextLength || 30
  };

  return function(
    prop: string, 
    value: string, 
    _template: string, 
    query?: string, 
    matchInfo?: MatchInfo[]
  ): string | undefined {
    if ((prop === 'content' || prop === 'desc' || prop === 'description') && query && typeof value === 'string') {
      if (matchInfo && matchInfo.length > 0) {
        const highlighted = highlightWithMatchInfo(value, matchInfo, highlightOptions);
        return highlighted !== value ? highlighted : undefined;
      }
    }
    
    return undefined;
  };
}

export function defaultHighlightMiddleware(
  prop: string, 
  value: string, 
  template: string, 
  query?: string, 
  matchInfo?: MatchInfo[]
): string | undefined {
  const middleware = createHighlightTemplateMiddleware();
  return middleware(prop, value, template, query, matchInfo);
}


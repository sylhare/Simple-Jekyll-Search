import { MatchInfo } from '../SearchStrategies/types';
import { highlightWithMatchInfo, HighlightOptions, escapeHtml } from './highlighting';

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
    if ((prop === 'content' || prop === 'desc' || prop === 'description') && typeof value === 'string') {
      if (matchInfo && matchInfo.length > 0 && query) {
        const highlighted = highlightWithMatchInfo(value, matchInfo, highlightOptions);
        return highlighted !== value ? highlighted : undefined;
      }
      
      if (highlightOptions.maxLength && value.length > highlightOptions.maxLength) {
        const truncated = value.substring(0, highlightOptions.maxLength - 3) + '...';
        return escapeHtml(truncated);
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


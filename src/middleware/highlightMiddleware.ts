import { MatchInfo } from '../SearchStrategies/types';
import { highlightWithMatchInfo, HighlightOptions, escapeHtml } from './highlighting';

export interface HighlightMiddlewareOptions extends HighlightOptions {
  /**
   * Fields that should be truncated when exceeding maxLength.
   * @default ['content', 'desc', 'description']
   */
  truncateFields?: string[];
}

/** Fields that contain long content and should be truncated by default */
const DEFAULT_TRUNCATE_FIELDS = ['content', 'desc', 'description'];

/**
 * Creates a template middleware that highlights search matches and truncates long content.
 * 
 * When a field has match info, the matched text is wrapped in a highlight span.
 * Fields in `truncateFields` are truncated to `maxLength` even without matches.
 * 
 * @param options - Configuration options for highlighting and truncation
 * @returns A middleware function for use with SimpleJekyllSearch's templateMiddleware option
 */
export function createHighlightTemplateMiddleware(options: HighlightMiddlewareOptions = {}) {
  const highlightOptions: HighlightOptions = {
    className: options.className || 'search-highlight',
    maxLength: options.maxLength,
    contextLength: options.contextLength || 30
  };
  
  const truncateFields = options.truncateFields || DEFAULT_TRUNCATE_FIELDS;

  return function(
    prop: string, 
    value: string, 
    _template: string, 
    query?: string, 
    matchInfo?: MatchInfo[]
  ): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    if (matchInfo && matchInfo.length > 0 && query) {
      const shouldTruncate = truncateFields.includes(prop);
      const fieldOptions: HighlightOptions = {
        ...highlightOptions,
        maxLength: shouldTruncate ? highlightOptions.maxLength : undefined
      };
      const highlighted = highlightWithMatchInfo(value, matchInfo, fieldOptions);
      return highlighted !== value ? highlighted : undefined;
    }
    
    const shouldTruncate = truncateFields.includes(prop);
    if (shouldTruncate && highlightOptions.maxLength && value.length > highlightOptions.maxLength) {
      const truncated = value.substring(0, highlightOptions.maxLength - 3) + '...';
      return escapeHtml(truncated);
    }
    
    return undefined;
  };
}

/**
 * Pre-configured highlight middleware with default options.
 * 
 * @param prop - The property name being rendered
 * @param value - The property value
 * @param template - The template string
 * @param query - The search query
 * @param matchInfo - Match position information for highlighting
 * @returns The highlighted/truncated value, or undefined to use original
 */
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


import { MatchInfo } from '../SearchStrategies/types';
import { highlightWithMatchInfo, HighlightOptions, escapeHtml } from './highlighting';

export interface HighlightMiddlewareOptions extends HighlightOptions {
  /**
   * Fields that should be truncated when exceeding maxLength.
   * @default ['content', 'desc', 'description']
   */
  truncateFields?: string[];
  
  /**
   * Fields that should NOT be highlighted (e.g., fields used in URLs/attributes).
   * These fields will be left untouched to prevent breaking HTML structure.
   * @default ['url', 'link', 'href', 'query']
   */
  noHighlightFields?: string[];
}

/** Fields that contain long content and should be truncated by default */
const DEFAULT_TRUNCATE_FIELDS = ['content', 'desc', 'description'];

/** Fields that should never be highlighted (used in HTML attributes) */
const DEFAULT_NO_HIGHLIGHT_FIELDS = ['url', 'link', 'href', 'query'];

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
  const noHighlightFields = options.noHighlightFields || DEFAULT_NO_HIGHLIGHT_FIELDS;

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

    if (noHighlightFields.includes(prop)) {
      return undefined;
    }

    const shouldTruncate = truncateFields.includes(prop);

    if (matchInfo && matchInfo.length > 0 && query) {
      const fieldOptions: HighlightOptions = {
        ...highlightOptions,
        maxLength: shouldTruncate ? highlightOptions.maxLength : undefined
      };
      const highlighted = highlightWithMatchInfo(value, matchInfo, fieldOptions);
      return highlighted !== value ? highlighted : undefined;
    }
    
    if (shouldTruncate && highlightOptions.maxLength && value.length > highlightOptions.maxLength) {
      return escapeHtml(value.substring(0, highlightOptions.maxLength - 3) + '...');
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


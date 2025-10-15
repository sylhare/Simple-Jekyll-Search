import SimpleJekyllSearchClass from './SimpleJekyllSearch';
import { SearchOptions, SimpleJekyllSearchInstance } from './utils/types';
import { createHighlightTemplateMiddleware } from './middleware/highlightMiddleware';

function SimpleJekyllSearch(options: SearchOptions): SimpleJekyllSearchInstance {
  const instance = new SimpleJekyllSearchClass();
  return instance.init(options);
}

export default SimpleJekyllSearch;
export type { MatchInfo } from './SearchStrategies/types';
export type { HighlightOptions } from './middleware/highlighting';
export { highlightWithMatchInfo, escapeHtml, mergeOverlappingMatches } from './middleware/highlighting';
export { createHighlightTemplateMiddleware, defaultHighlightMiddleware } from './middleware/highlightMiddleware';

// Add to window if in browser environment
if (typeof window !== 'undefined') {
  (window as any).SimpleJekyllSearch = SimpleJekyllSearch;
  (window as any).createHighlightTemplateMiddleware = createHighlightTemplateMiddleware;
}

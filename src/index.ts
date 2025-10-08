import SimpleJekyllSearchClass from './SimpleJekyllSearch';
import { SearchOptions, SimpleJekyllSearchInstance } from './utils/types';
export { 
  createHighlightMiddleware, 
  createHighlightTemplateMiddleware,
  highlightText, 
  defaultHighlightMiddleware,
  defaultHighlightTemplateMiddleware
} from './utils/highlightMiddleware';
export type { HighlightOptions, HighlightResult } from './utils/highlightMiddleware';

function SimpleJekyllSearch(options: SearchOptions): SimpleJekyllSearchInstance {
  const instance = new SimpleJekyllSearchClass();
  return instance.init(options);
}

export default SimpleJekyllSearch;

// Add to window if in browser environment
if (typeof window !== 'undefined') {
  (window as any).SimpleJekyllSearch = SimpleJekyllSearch;
}

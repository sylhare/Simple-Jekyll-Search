import SimpleJekyllSearchClass from './SimpleJekyllSearch';
import { SearchOptions, SimpleJekyllSearchInstance } from './utils/types';
import { 
  createHighlightMiddleware, 
  createHighlightTemplateMiddleware,
  highlightText, 
  defaultHighlightMiddleware,
  defaultHighlightTemplateMiddleware
} from './utils/highlightMiddleware';

export { 
  createHighlightMiddleware, 
  createHighlightTemplateMiddleware,
  highlightText, 
  defaultHighlightMiddleware,
  defaultHighlightTemplateMiddleware
};
export type { HighlightOptions, HighlightResult } from './utils/highlightMiddleware';
export type { MatchInfo } from './SearchStrategies/types';

function SimpleJekyllSearch(options: SearchOptions): SimpleJekyllSearchInstance {
  const instance = new SimpleJekyllSearchClass();
  return instance.init(options);
}

export default SimpleJekyllSearch;

if (typeof window !== 'undefined') {
  (window as any).SimpleJekyllSearch = SimpleJekyllSearch;
  (window as any).SimpleJekyllSearch.createHighlightMiddleware = createHighlightMiddleware;
  (window as any).SimpleJekyllSearch.createHighlightTemplateMiddleware = createHighlightTemplateMiddleware;
  (window as any).SimpleJekyllSearch.highlightText = highlightText;
  (window as any).SimpleJekyllSearch.defaultHighlightMiddleware = defaultHighlightMiddleware;
  (window as any).SimpleJekyllSearch.defaultHighlightTemplateMiddleware = defaultHighlightTemplateMiddleware;
}

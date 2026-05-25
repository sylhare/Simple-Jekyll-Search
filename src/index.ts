import SimpleJekyllSearchClass from './SimpleJekyllSearch';
import { StrategyFactory } from './SearchStrategies/StrategyFactory';
import { SearchOptions, SimpleJekyllSearchInstance } from './utils/types';
import { createHighlightTemplateMiddleware } from './middleware/highlightMiddleware';
import { RelevanceSort } from './utils';

function SimpleJekyllSearch(options: SearchOptions): SimpleJekyllSearchInstance {
  const instance = new SimpleJekyllSearchClass((config) => StrategyFactory.create(config));
  return instance.init(options);
}

export default SimpleJekyllSearch;
export type { MatchInfo } from './SearchStrategies/types';
export type { HighlightOptions } from './middleware/highlighting';
export { highlightWithMatchInfo, escapeHtml, mergeOverlappingMatches } from './middleware/highlighting';
export { createHighlightTemplateMiddleware, defaultHighlightMiddleware } from './middleware/highlightMiddleware';

export { HybridSearchStrategy, DefaultHybridSearchStrategy } from './SearchStrategies/HybridSearchStrategy';
export type { HybridConfig } from './SearchStrategies/types';
export { StrategyFactory } from './SearchStrategies/StrategyFactory';
export type { StrategyType } from './SearchStrategies/StrategyFactory';

export { RelevanceSort } from './utils';

// Add to window if in browser environment
if (typeof window !== 'undefined') {
  (window as any).SimpleJekyllSearch = SimpleJekyllSearch;
  (window as any).createHighlightTemplateMiddleware = createHighlightTemplateMiddleware;
  (window as any).RelevanceSort = RelevanceSort;
}

/**
 * Backward-compatible alias of UnifiedSearchStrategy; the 'hybrid' strategy is now
 * the unified engine. Kept only so existing `HybridSearchStrategy` imports and
 * `instanceof` checks keep working.
 */
export {
  UnifiedSearchStrategy as HybridSearchStrategy,
  DefaultUnifiedSearchStrategy as DefaultHybridSearchStrategy,
} from './UnifiedSearchStrategy';

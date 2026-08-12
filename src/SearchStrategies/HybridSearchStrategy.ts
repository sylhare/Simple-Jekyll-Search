import { UnifiedSearchStrategy } from './UnifiedSearchStrategy';

/**
 * Backed by UnifiedSearchStrategy, which is faster and passes the same tests.
 * Kept as a distinct exported class for backward compatibility (public API and
 * `instanceof` checks) and shares the same defaults; it adds no behaviour of its own.
 */
export class HybridSearchStrategy extends UnifiedSearchStrategy {}

export const DefaultHybridSearchStrategy = new HybridSearchStrategy();

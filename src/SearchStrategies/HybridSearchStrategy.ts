import { UnifiedSearchStrategy } from './UnifiedSearchStrategy';

/**
 * Backed by UnifiedSearchStrategy and kept as a distinct exported class only for
 * public-API / `instanceof` backward compatibility; it adds no behaviour of its own
 * and shares the same defaults.
 *
 * The unified engine intentionally redesigned match *results* relative to the original
 * hybrid cascade: multi-word queries AND their tokens with no whole-query fuzzy fallback,
 * and an exact substring yields one 'exact' span per occurrence rather than a single
 * 'fuzzy' span. Those choices are pinned in UnifiedSearchStrategy.test.ts.
 */
export class HybridSearchStrategy extends UnifiedSearchStrategy {}

export const DefaultHybridSearchStrategy = new HybridSearchStrategy();

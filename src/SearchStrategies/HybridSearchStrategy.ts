import { UnifiedSearchStrategy } from './UnifiedSearchStrategy';

/**
 * Backed by UnifiedSearchStrategy; a distinct exported class only for public-API /
 * `instanceof` compatibility. Match results follow UnifiedSearchStrategy (see its
 * docblock for the intentional differences from the old hybrid cascade).
 */
export class HybridSearchStrategy extends UnifiedSearchStrategy {}

export const DefaultHybridSearchStrategy = new HybridSearchStrategy();

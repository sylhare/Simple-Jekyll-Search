/**
 * Throughput benchmark for the search strategies, scanning a synthetic corpus.
 * Run with `yarn test:benchmark`.
 *
 * Rows are the strategies as the factory actually builds them (what `strategy: 'x'`
 * gives you), plus the tried-but-unused matchers so their cost is measured rather
 * than described:
 *   - wildcard (legacy): the previous wildcard engine, replaced by unified
 *   - levenshtein:        removed edit-distance matcher (kept for reference)
 *   - regex-fuzzy:        rejected lazy-`.*?` fuzzy matcher
 * `'unified'` is not shown separately: the `'hybrid'` type resolves to the same
 * default UnifiedSearchStrategy.
 * See ./README.md for results and rationale.
 */
import { bench, describe } from 'vitest';
import { StrategyFactory } from '../../src/SearchStrategies/StrategyFactory';
import { WildcardSearchStrategy } from '../../src/SearchStrategies/SearchStrategy';
import { SearchStrategy, Matcher } from '../../src/SearchStrategies/types';
import { findLevenshteinMatches } from '../../src/SearchStrategies/search/findLevenshteinMatches';
import { findRegexFuzzyMatches } from '../../src/SearchStrategies/search/findRegexFuzzyMatches';

// Themed words keep the scenario queries hitting some documents; the filler tokens
// widen the vocabulary so a query word only appears in a realistic fraction of docs
// (a common word here lands in ~6-7% of bodies, not ~50% as with a tiny vocabulary).
const THEMED = (
  'the quick brown fox jumps over a lazy dog client side search library javascript ' +
  'jekyll static site content article technical functionality command regex special ' +
  'characters testing performance benchmark hybrid unified strategy matcher fuzzy exact ' +
  'wildcard token document title body index relevance sort highlight middleware repository'
).split(' ');
const FILLER = Array.from({ length: 500 }, (_, i) => `term${String(i).padStart(4, '0')}`);
const VOCAB = [...THEMED, ...FILLER];

// Deterministic PRNG so every strategy sees identical input every run.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function makeCorpus(docs: number): Array<{ title: string; body: string }> {
  const rand = lcg(42);
  const pick = () => VOCAB[Math.floor(rand() * VOCAB.length)];
  const corpus: Array<{ title: string; body: string }> = [];
  for (let i = 0; i < docs; i++) {
    const title = `${pick()} ${pick()} ${pick()}`;
    const bodyLength = 20 + Math.floor(rand() * 60); // 20-79 words, varied per document
    const body = Array.from({ length: bodyLength }, pick).join(' ') + '.';
    corpus.push({ title, body });
  }
  return corpus;
}

const CORPUS = makeCorpus(2000);

const STRATEGIES: Array<{ name: string; matcher: Matcher }> = [
  { name: 'literal', matcher: StrategyFactory.create({ type: 'literal' }) },
  { name: 'fuzzy', matcher: StrategyFactory.create({ type: 'fuzzy' }) },
  { name: 'wildcard', matcher: StrategyFactory.create({ type: 'wildcard' }) },   // unified, fuzzy disabled
  { name: 'hybrid', matcher: StrategyFactory.create({ type: 'hybrid' }) },       // unified, default (== 'unified' type)
  { name: 'wildcard (legacy)', matcher: new WildcardSearchStrategy() },          // previous wildcard engine; baseline
  { name: 'levenshtein', matcher: new SearchStrategy(findLevenshteinMatches) },  // removed from strategies; reference
  { name: 'regex-fuzzy', matcher: new SearchStrategy(findRegexFuzzyMatches) },   // rejected alternative to findFuzzyMatches
];

// One "scan" = what Repository.findMatches does across a whole dataset for a query:
// call findMatches on every field of every document.
function scan(matcher: Matcher, query: string): number {
  let hits = 0;
  for (const doc of CORPUS) {
    if (matcher.findMatches(doc.title, query).length > 0) hits++;
    if (matcher.findMatches(doc.body, query).length > 0) hits++;
  }
  return hits;
}

const SCENARIOS: Array<{ name: string; query: string }> = [
  { name: 'exact single word ("search")', query: 'search' },
  { name: 'multi-word ("technical content")', query: 'technical content' },
  { name: 'short query ("re")', query: 're' },
  { name: 'fuzzy typo ("serch")', query: 'serch' },
  { name: 'fuzzy typo long ("functionalty")', query: 'functionalty' },
  { name: 'wildcard ("java*")', query: 'java*' },
  { name: 'wildcard span ("wild*rd")', query: 'wild*rd' },
  { name: 'no match ("zzzzzz")', query: 'zzzzzz' },
];

for (const { name, query } of SCENARIOS) {
  describe(name, () => {
    for (const { name: strategyName, matcher } of STRATEGIES) {
      bench(strategyName, () => { scan(matcher, query); });
    }
  });
}

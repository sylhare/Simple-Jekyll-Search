/**
 * Throughput benchmark for every search strategy, scanning a synthetic corpus.
 * Run with `yarn test:benchmark`. See ./README.md for results and the history of
 * algorithms that were tried, kept, or removed (Levenshtein, regex-fuzzy, unified).
 */
import { bench, describe } from 'vitest';
import { LiteralSearchStrategy, FuzzySearchStrategy, WildcardSearchStrategy } from '../../src/SearchStrategies/SearchStrategy';
import { HybridSearchStrategy } from '../../src/SearchStrategies/HybridSearchStrategy';
import { UnifiedSearchStrategy } from '../../src/SearchStrategies/UnifiedSearchStrategy';
import { Matcher } from '../../src/SearchStrategies/types';

// Deterministic corpus so every strategy sees identical input every run.
const WORDS = (
  'the quick brown fox jumps over a lazy dog client side search library javascript ' +
  'jekyll static site content article technical functionality command regex special ' +
  'characters testing performance benchmark hybrid unified strategy matcher fuzzy exact ' +
  'wildcard token document title body index relevance sort highlight middleware repository'
).split(' ');

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function makeCorpus(docs: number, wordsPerBody: number): Array<{ title: string; body: string }> {
  const rand = lcg(42);
  const pick = () => WORDS[Math.floor(rand() * WORDS.length)];
  const corpus: Array<{ title: string; body: string }> = [];
  for (let i = 0; i < docs; i++) {
    const title = `${pick()} ${pick()} ${pick()}`;
    const body = Array.from({ length: wordsPerBody }, pick).join(' ') + '.';
    corpus.push({ title, body });
  }
  return corpus;
}

const CORPUS = makeCorpus(2000, 40);

const STRATEGIES: Array<{ name: string; matcher: Matcher }> = [
  { name: 'literal', matcher: LiteralSearchStrategy },
  { name: 'fuzzy', matcher: FuzzySearchStrategy },
  { name: 'wildcard', matcher: new WildcardSearchStrategy() },
  { name: 'hybrid', matcher: new HybridSearchStrategy() },
  { name: 'unified', matcher: new UnifiedSearchStrategy() },
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

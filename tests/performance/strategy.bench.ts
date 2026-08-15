import fs from 'node:fs';
import path from 'node:path';
import { bench, describe } from 'vitest';
import { StrategyFactory } from '../../src/SearchStrategies/StrategyFactory';
import { WildcardSearchStrategy } from '../../src/SearchStrategies/WildcardSearchStrategy';
import { SearchStrategy, Matcher } from '../../src/SearchStrategies/types';
import { findLevenshteinMatches } from '../../src/SearchStrategies/search/findLevenshteinMatches';
import { findRegexFuzzyMatches } from '../../src/SearchStrategies/search/findRegexFuzzyMatches';

const BODY_CAP = 400;
const CORPUS_SIZE = 192;

function collectMarkdownFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectMarkdownFiles(full));
    } else if (entry.name.endsWith('.md')) {
      found.push(full);
    }
  }
  return found;
}

function parseSections(file: string): Array<{ title: string; body: string }> {
  const raw = fs.readFileSync(file, 'utf8');
  const stripped = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const withoutCode = stripped.replace(/```[\s\S]*?```/g, '');
  const heading = withoutCode.match(/^# (.+)$/m);
  const title = heading ? heading[1].trim() : path.basename(file, '.md');
  return stripped
    .split(/\n{2,}/)
    .map((section) => section.replace(/\s+/g, ' ').trim())
    .filter((section) => section.length > 0)
    .map((section) => ({ title, body: section.slice(0, BODY_CAP) }));
}

const DOCS_DIR = path.join(process.cwd(), 'docs');
const SECTIONS = collectMarkdownFiles(DOCS_DIR)
  .sort()
  .flatMap(parseSections);
const CORPUS = Array.from({ length: CORPUS_SIZE }, (_, i) => SECTIONS[i % SECTIONS.length]);

const STRATEGIES: Array<{ name: string; matcher: Matcher }> = [
  { name: 'literal', matcher: StrategyFactory.create({ type: 'literal' }) },
  { name: 'fuzzy', matcher: StrategyFactory.create({ type: 'fuzzy' }) },
  { name: 'wildcard', matcher: StrategyFactory.create({ type: 'wildcard' }) },
  { name: 'hybrid', matcher: StrategyFactory.create({ type: 'hybrid' }) },
  { name: 'wildcard (legacy)', matcher: new WildcardSearchStrategy() },
  { name: 'levenshtein', matcher: new SearchStrategy(findLevenshteinMatches) },
  { name: 'regex-fuzzy', matcher: new SearchStrategy(findRegexFuzzyMatches) },
];

function scan(matcher: Matcher, query: string): number {
  let hits = 0;
  for (const page of CORPUS) {
    if (matcher.findMatches(page.title, query).length > 0) hits++;
    if (matcher.findMatches(page.body, query).length > 0) hits++;
  }
  return hits;
}

const SCENARIOS: Array<{ name: string; query: string }> = [
  { name: 'exact single word ("jekyll")', query: 'jekyll' },
  { name: 'multi-word ("technical content")', query: 'technical content' },
  { name: 'technical term ("functionality")', query: 'functionality' },
  { name: 'short query ("re")', query: 're' },
  { name: 'fuzzy typo ("serch")', query: 'serch' },
  { name: 'fuzzy typo long ("functionalty")', query: 'functionalty' },
  { name: 'wildcard ("search*")', query: 'search*' },
  { name: 'wildcard span ("high*ght")', query: 'high*ght' },
  { name: 'no match ("zzzzzz")', query: 'zzzzzz' },
];

for (const { name, query } of SCENARIOS) {
  describe(name, () => {
    for (const { name: strategyName, matcher } of STRATEGIES) {
      bench(strategyName, () => { scan(matcher, query); });
    }
  });
}

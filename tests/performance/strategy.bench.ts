import { bench, describe } from 'vitest';
import { StrategyFactory } from '../../src/SearchStrategies/StrategyFactory';
import { WildcardSearchStrategy } from '../../src/SearchStrategies/SearchStrategy';
import { SearchStrategy, Matcher } from '../../src/SearchStrategies/types';
import { findLevenshteinMatches } from '../../src/SearchStrategies/search/findLevenshteinMatches';
import { findRegexFuzzyMatches } from '../../src/SearchStrategies/search/findRegexFuzzyMatches';

const MARKDOWN = import.meta.glob(['../../docs/**/*.md', '!**/_site/**'], {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>;

function parsePage(raw: string): { title: string; body: string } {
  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = frontmatter ? frontmatter[1] : '';
  const title = (meta.match(/title:\s*"?(.+?)"?\s*$/m)?.[1] ?? 'Untitled').trim();
  const content = (frontmatter ? raw.slice(frontmatter[0].length) : raw).replace(/\s+/g, ' ').trim();
  return { title, body: content.slice(0, 600) };
}

const PAGES = Object.values(MARKDOWN).map(parsePage);
const CORPUS = Array.from({ length: 500 }, (_, i) => PAGES[i % PAGES.length]);

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
  { name: 'technical term ("hostname")', query: 'hostname' },
  { name: 'short query ("re")', query: 're' },
  { name: 'fuzzy typo ("functionalty")', query: 'functionalty' },
  { name: 'wildcard ("high*")', query: 'high*' },
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

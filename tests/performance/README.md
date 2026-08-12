# Search strategy benchmarks

Throughput benchmarks for the search strategies, plus a record of which matching
algorithms are used, kept for reference, or rejected — with measured numbers.

## Running

From the repo root:

```bash
yarn test:benchmark
```

## Method

`strategy.bench.ts` builds its corpus from the repository's own docs pages
(`docs/**/*.md`: `get-started`, `Wiki`, and the blog posts). Each page is parsed into
a `{ title, body }` (frontmatter title + content, body capped at 600 chars) and the
set is repeated to 500 documents so a scan is large enough to time. One "scan" calls
`findMatches` on every field of every document — what `Repository` does for a single
search. Queries are real technical terms drawn from those pages. Numbers are relative
`hz` (higher is faster), single machine, and vary run to run.

Rows are the strategies as `StrategyFactory` builds them (what `strategy: 'x'` gives
you); `'hybrid'` and `'unified'` resolve to the same default `UnifiedSearchStrategy`,
shown once as `hybrid`. Three extra rows are matchers that are **not** wired into any
strategy (they tree-shake out of the bundle) but are benchmarked so their cost is
measured, not asserted:

- **wildcard (legacy)** — the previous standalone wildcard engine, replaced by unified
- **levenshtein** — a removed edit-distance matcher (`findLevenshteinMatches`)
- **regex-fuzzy** — a rejected lazy-`.*?` fuzzy matcher (`findRegexFuzzyMatches`)

## Results (hz, higher is faster)

| scenario | literal | fuzzy | wildcard | hybrid | wildcard (legacy) | levenshtein | regex-fuzzy |
|---|--:|--:|--:|--:|--:|--:|--:|
| exact single word (`jekyll`) | 4810 | 2385 | 10119 | 2883 | 5395 | 122 | 749 |
| multi-word (`technical content`) | 3432 | 2190 | 12172 | 12284 | 3124 | 44 | 621 |
| technical term (`hostname`) | 4092 | 2603 | 10397 | 1722 | 3105 | 90 | 1213 |
| short query (`re`) | 3535 | 4329 | 4980 | 6337 | 5822 | 310 | 3616 |
| fuzzy typo (`functionalty`) | 5075 | 2471 | 17034 | 1548 | 3547 | 63 | 866 |
| wildcard (`high*`) | 4315 | 1387 | 15221 | 14834 | 3961 | 142 | **16** |
| wildcard span (`high*ght`) | 4204 | 1238 | 14837 | 14352 | 3819 | 90 | **16** |
| no match (`zzzzzz`) | 5443 | 1292 | 20698 | 1459 | 4452 | 125 | 1589 |

### How to read it

`literal` and `fuzzy` are single-purpose (substring-only / subsequence-only); compare
like-for-like.

- **`wildcard` (unified, fuzzy off) is the fastest strategy and ~2–4.6× the legacy
  wildcard engine** (e.g. 20698 vs 4452 on a miss, 17034 vs 3547 on a typo). It has no
  fuzzy fallback, so it stays at compiled-regex speed. This is why `'wildcard'` is now
  backed by unified.
- **`hybrid`/unified wins on multi-word (~3.6× `literal`) and wildcard (~3.5× the
  legacy engine)** — the AND short-circuit and the compiled regex beat both.
- **On single-word queries that mostly miss, `hybrid` is fuzzy-bound** (e.g. 1548 on a
  typo vs 5075 for `literal`): it runs the linear `findFuzzyMatches` on every
  non-matching document. That is the cost of typo tolerance, not a regression —
  `literal` and the fuzzy-off `wildcard` strategy are faster precisely because they do
  no fuzzy work.

## Algorithms tried

### Rejected: regex-fuzzy (`findRegexFuzzyMatches`)

Matches a fuzzy token by joining the query characters with a lazy `.*?` and running one
regex. The `regex-fuzzy` row shows why it is not used: **~16 hz on the wildcard
scenarios** and sub-1000 hz elsewhere — the lazy quantifier chain backtracks
catastrophically on non-matching text, a ReDoS-class cliff. Fuzzy matching uses the
linear, single-pass `findFuzzyMatches` instead; regex is used only for the exact and
wildcard paths.

### Removed: Levenshtein (`findLevenshteinMatches`)

An edit-distance matcher, kept for reference. The `levenshtein` row is 44–310 hz
(often 40–80× slower than `literal`): it runs an O(n·m) distance matrix per field, and
compares the query against the whole field, so it only matches when the query length is
close to the field length — unsuitable for in-document search. Replaced by
`findFuzzyMatches`.

### Adopted: unified

Regex for exact and wildcard matching (compiled once per query, memoized), the linear
`findFuzzyMatches` for fuzzy, and one inline extra-character budget check. It backs both
`'hybrid'` (fuzzy on) and `'wildcard'` (fuzzy off), and escapes regex metacharacters in
the query, closing an injection/ReDoS hole in the raw wildcard path.

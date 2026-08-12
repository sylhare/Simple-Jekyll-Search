# Search strategy benchmarks

Throughput benchmarks for the search strategies, plus a record of which matching
algorithms are used, kept for reference, or rejected — with measured numbers.

```bash
yarn test:benchmark
```

## Method

`strategy.bench.ts` builds a deterministic synthetic corpus: 2000 documents, each a
3-word title and a 20–79 word body, with words drawn from a ~580-word vocabulary
(themed words so the scenario queries hit some documents, plus filler tokens so a
common word lands in only ~6–7% of documents — closer to a real corpus than a tiny
vocabulary where every query matches half the set). One "scan" calls `findMatches`
on every field of every document, which is what `Repository` does for a single
search. Numbers are relative `hz` (higher is faster), single machine.

Rows are the strategies as `StrategyFactory` builds them (what `strategy: 'x'` gives
you). `'hybrid'` and `'unified'` resolve to the same default `UnifiedSearchStrategy`,
shown once as `hybrid`. Three extra rows are matchers that are **not** wired into any
strategy (they tree-shake out of the bundle) but are benchmarked here so their cost is
measured, not asserted:

- **wildcard (legacy)** — the previous standalone wildcard engine, replaced by unified
- **levenshtein** — a removed edit-distance matcher (`findLevenshteinMatches`)
- **regex-fuzzy** — a rejected lazy-`.*?` fuzzy matcher (`findRegexFuzzyMatches`)

## Results (hz, higher is faster)

| scenario | literal | fuzzy | wildcard | hybrid | wildcard (legacy) | levenshtein | regex-fuzzy |
|---|--:|--:|--:|--:|--:|--:|--:|
| exact single word (`search`) | 5085 | 470 | 4990 | 458 | 2414 | 38 | 33 |
| multi-word (`technical content`) | 1571 | 367 | 3520 | 3630 | 1005 | 14 | **0.97** |
| short query (`re`) | 972 | 2471 | 2250 | 2320 | 969 | 99 | 944 |
| fuzzy typo (`serch`) | 4754 | 480 | 3674 | 440 | 2129 | 44 | 19 |
| fuzzy typo, long (`functionalty`) | 4796 | 462 | 4031 | 441 | 1818 | 20 | 213 |
| wildcard (`java*`) | 5005 | 445 | 4705 | 4576 | 2553 | 46 | 425 |
| wildcard span (`wild*rd`) | 4980 | 439 | 4319 | 4324 | 2515 | 33 | 326 |
| no match (`zzzzzz`) | 5028 | 446 | 5679 | 449 | 2805 | 39 | 417 |

### How to read it

`literal` and `fuzzy` are single-purpose: `literal` is fast because it only does
substring matching (and returns nothing for wildcard/typo queries); `fuzzy` always
pays for a subsequence scan. Compare like-for-like.

- **wildcard (unified, fuzzy off) is ~2× the legacy wildcard engine** across the board
  (e.g. 4990 vs 2414, 5679 vs 2805) and runs near `literal` speed — it has no fuzzy
  fallback. This is why `'wildcard'` is now backed by unified.
- **hybrid/unified wins on multi-word (~2.3× `literal`) and wildcard (~1.8× the legacy
  engine)** — the AND short-circuit and the compiled regex beat `literal`'s
  whole-field lowercase + per-word `indexOf`, and beat the old wildcard engine.
- **On single-word queries that mostly miss, hybrid is fuzzy-bound (~450 hz, same as
  `fuzzy`)** — it runs the linear `findFuzzyMatches` on every non-matching document.
  That is the unavoidable cost of typo tolerance, not a regression: `literal` and the
  fuzzy-off `wildcard` strategy are faster precisely because they do no fuzzy work.

## Algorithms tried

### Rejected: regex-fuzzy (`findRegexFuzzyMatches`)

Matches a fuzzy token by joining the query characters with a lazy `.*?` and running
one regex. The `regex-fuzzy` row shows why it is not used: **0.97 hz on the multi-word
scenario** (≈1 second per scan) and 19–213 hz on typo queries. The lazy quantifier
chain backtracks catastrophically on non-matching text — a ReDoS-class cliff. Fuzzy
matching uses the linear, single-pass `findFuzzyMatches` instead (the `fuzzy`/`hybrid`
rows), and regex is used only for the exact and wildcard paths.

### Removed: Levenshtein (`findLevenshteinMatches`)

An edit-distance matcher, kept for reference. The `levenshtein` row is 14–99 hz
(50–260× slower than `literal`): it runs an O(n·m) distance matrix per field. It also
compares the query against the **whole field**, so it only matches when the query
length is close to the field length — unsuitable for in-document search. Replaced by
`findFuzzyMatches`.

### Adopted: unified

Regex for exact and wildcard matching (compiled once per query, memoized), the linear
`findFuzzyMatches` for fuzzy, and one inline extra-character budget check. It backs
both `'hybrid'` (fuzzy on) and `'wildcard'` (fuzzy off), and escapes regex
metacharacters in the query, closing an injection/ReDoS hole in the raw wildcard path.

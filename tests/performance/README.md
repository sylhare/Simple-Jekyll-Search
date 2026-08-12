# Search strategy benchmarks

Throughput benchmarks for the search strategies, plus a record of which matching
algorithms were tried, kept, or removed — and why.

```bash
yarn test:benchmark
```

`strategy.bench.ts` builds a deterministic synthetic corpus (2000 documents, each a
3-word title and a 40-word body) and, for a set of representative queries, measures
one full "scan" per strategy — i.e. calling `findMatches` on every field of every
document, which is what `Repository` does for a single search. Numbers are relative
(vitest/tinybench `hz`), single machine, and meant for comparison between strategies,
not as absolute figures.

## How to read the numbers

`literal`, `fuzzy`, and `wildcard` are **single-purpose** strategies. They often appear
"fastest" on a query they don't actually support — e.g. `literal` on `java*` treats
`*` as a literal character, finds nothing, and returns immediately. Speed from doing
less (or returning wrong results) is not a win. The comparisons that matter:

- **`unified` vs `hybrid`** — both are feature-complete (exact + fuzzy + wildcard with
  fallbacks). This is the drop-in comparison.
- **`unified` vs `wildcard`** — on wildcard queries, against the dedicated strategy.

### Results (unified relative to the meaningful baseline)

| Scenario | Query | unified vs hybrid | notes |
|---|---|---|---|
| exact single word | `search` | **1.79× faster** | |
| multi-word | `technical content` | **5.11× faster** | fastest strategy overall — beats even `literal` (1.99×) |
| short query | `re` | **1.16× faster** | |
| wildcard | `java*` | **3.76× faster** | also **1.41× faster than the dedicated `wildcard` strategy** |
| wildcard span | `wild*rd` | **3.10× faster** | also **1.15× faster than `wildcard`** |
| no match | `zzzzzz` | **1.08× faster** | |
| fuzzy typo | `serch` | ~1.0× (tie) | identical algorithm (`findFuzzyMatches`) |
| fuzzy typo, long | `functionalty` | ~1.0× (tie) | identical algorithm |

`unified` is **faster or tied on every scenario**, with large wins on exact,
multi-word, and wildcard matching. This is why the `'wildcard'` strategy is now backed
by `UnifiedSearchStrategy` (same behaviour, configured with fuzzy disabled and
`maxSpaces` defaulting to 0), and why `'unified'` is offered as a general-purpose
strategy.

## Algorithms tried

### Removed: Levenshtein (`findLevenshteinMatches`)

An edit-distance matcher (`similarity = 1 - distance / max(len)`, threshold 0.3). It was
never wired into any strategy, and as written it compared the query against the **whole
field**, so for any realistic document `distance ≈ field length` and it effectively only
matched when the query length was close to the field length — useless as an in-document
search matcher. Removed (see commit "Remove unused strategy"); `findFuzzyMatches`
(subsequence) is the right tool for in-document typo tolerance.

### Rejected: regex fuzzy (lazy `.*?` subsequence)

The first `UnifiedSearchStrategy` prototype matched fuzzy tokens with a single regex
built by joining the query characters with lazy `.*?`. It benchmarked **~78–80× slower**
than `hybrid` on a long typo query against non-matching text (≈154 ms per scan) — the
lazy quantifier chain backtracks catastrophically, a ReDoS-class cliff unacceptable for a
search library. Fuzzy matching therefore uses the linear, single-pass `findFuzzyMatches`
instead; regex is used only for the exact and wildcard paths, where it is a clear win.

### Adopted: unified

Regex for exact and wildcard matching (native, compiled once per query and memoized),
the linear `findFuzzyMatches` for fuzzy, and one inline extra-character budget check
in place of the hybrid cascade + `applyFuzzyConstraints`. It also escapes regex
metacharacters in the query, closing an injection/ReDoS hole in the raw wildcard path.

# Search strategy benchmarks

Throughput of each search strategy over a corpus built from the repo's `docs/**/*.md` pages.

## Run

```bash
yarn test:benchmark
```

## Method

Each docs Markdown file is split into bounded sections, one document `{ title, body }` per
section. One scan calls `findMatches` on every field of every document. Numbers are relative
`hz` (higher is faster) and vary by machine and run.

## Results

### Throughput (scans per second, higher is faster)

| scenario | literal | fuzzy | wildcard | hybrid | wildcard (legacy) | levenshtein | regex-fuzzy |
|---|--:|--:|--:|--:|--:|--:|--:|
| exact single word (`jekyll`) | 39,971 hz | 13,141 hz | 64,566 hz | 13,981 hz | 27,430 hz | 1,236 hz | 3,938 hz |
| multi-word (`technical content`) | 30,722 hz | 10,309 hz | 48,811 hz | 49,494 hz | 17,849 hz | 469 hz | 80 hz |
| technical term (`functionality`) | 41,834 hz | 11,558 hz | 57,157 hz | 11,749 hz | 21,393 hz | 609 hz | 728 hz |
| short query (`re`) | 31,624 hz | 20,314 hz | 38,994 hz | 38,855 hz | 25,469 hz | 2,899 hz | 9,149 hz |
| fuzzy typo (`serch`) | 33,546 hz | 15,025 hz | 54,504 hz | 11,946 hz | 22,454 hz | 1,439 hz | 3,041 hz |
| fuzzy typo long (`functionalty`) | 42,523 hz | 11,610 hz | 59,463 hz | 11,585 hz | 21,028 hz | 654 hz | 700 hz |
| wildcard (`search*`) | 33,877 hz | 10,459 hz | 45,661 hz | 43,449 hz | 24,713 hz | 1,081 hz | 42 hz |
| wildcard span (`high*ght`) | 38,470 hz | 10,793 hz | 54,784 hz | 55,539 hz | 25,328 hz | 975 hz | 1,668 hz |
| no match (`zzzzzz`) | 44,026 hz | 11,621 hz | 63,550 hz | 12,963 hz | 28,828 hz | 1,260 hz | 4,248 hz |

### Latency (per scan, fast → slow)

Per-scan latency (`1e6 / hz`), averaged over the scenarios above.

| strategy | avg | range |
|---|--:|--:|
| wildcard | 19 µs | 16 – 26 µs |
| literal | 27 µs | 23 – 33 µs |
| wildcard (legacy) | 43 µs | 35 – 56 µs |
| hybrid | 55 µs | 18 – 86 µs |
| fuzzy | 82 µs | 49 – 97 µs |
| levenshtein | 1,100 µs | 345 – 2,132 µs |
| regex-fuzzy | 4,515 µs | 109 – 23,810 µs |

## Strategies

- `literal` / `fuzzy` — single-purpose (substring / subsequence); compare like-for-like.
- `wildcard` — `UnifiedSearchStrategy`, fuzzy disabled.
- `hybrid` — default `UnifiedSearchStrategy` (`'unified'` resolves to the same).
- `wildcard (legacy)` — previous standalone wildcard engine; baseline only.
- `levenshtein`, `regex-fuzzy` — unused matchers, not wired into any strategy (tree-shaken
  from the bundle), benchmarked for reference.

`hybrid` drops to fuzzy speed on single-word misses: it runs the linear fuzzy scan on every
non-matching document (the cost of typo tolerance).

## Tried, not used

- **regex-fuzzy** — lazy `.*?` join; backtracks catastrophically on non-matching text. Use
  linear `findFuzzyMatches`.
- **levenshtein** — O(n·m) per field, matches against the whole field only; unsuitable for
  in-document search. Replaced by `findFuzzyMatches`.
- **wildcard (legacy)** — ~2× slower than the unified-backed `wildcard`.

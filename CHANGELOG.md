# Changelog

Notable user-facing changes. Follows [Semantic Versioning](https://semver.org/).

## [2.1.5]
- Fixed: matches in text with leading whitespace now highlight at the correct position.

## [2.1.4]
- New: results can be sorted by relevance (enabled in the example config).

## [2.1.1]
- New: the search query and results are kept when navigating away and back
  (session-storage persistence).

## [2.1.0]
- New: tag highlighting shown in the example search config.
- Changed: now requires Node ≥ 24 to build from source.
- Fixed: broken link on highlighted titles, and result truncation past the max length.

## [2.0.1]
- Changed: stricter default fuzzy matching for the hybrid strategy (`minFuzzyLength` 4,
  `maxExtraFuzzyChars` 2, `maxSpaces` 1).
- Fixed: result state is restored when navigating back to a previous search.

## [2.0.0]
- New: configurable search strategies (`literal`, `fuzzy`, `wildcard`, `hybrid`) chosen via options.
- New: result highlighting via the `defaultHighlightMiddleware`, with custom highlight
  tags through `createHighlightTemplateMiddleware`.
- Deprecated: the `fuzzy` boolean option — use `strategy: 'fuzzy'` instead.

_Earlier releases (`v1.x`) are recorded only as git tags._

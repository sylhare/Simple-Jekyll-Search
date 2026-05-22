import { MatchInfo } from '../SearchStrategies/types';
import { RepositoryData } from './types';

const TYPE_SCORES: Record<MatchInfo['type'], number> = {
  exact: 100,
  fuzzy: 50,
  wildcard: 25,
};

const TITLE_FIELD_WEIGHT = 10;
const DEFAULT_FIELD_WEIGHT = 1;
const POSITION_BONUS_MAX = 50;
const POSITION_DECAY = 2;
const PROXIMITY_BONUS_MAX = 80;

function fieldWeight(field: string): number {
  return field === 'title' ? TITLE_FIELD_WEIGHT : DEFAULT_FIELD_WEIGHT;
}

function proximityBonus(matches: MatchInfo[]): number {
  if (matches.length < 2) return 0;
  const firstStart = Math.min(...matches.map(m => m.start));
  const lastEnd = Math.max(...matches.map(m => m.end));
  const totalMatchLength = matches.reduce((sum, m) => sum + (m.end - m.start), 0);
  const span = lastEnd - firstStart;
  const gap = span - totalMatchLength;
  if (gap <= 0) return PROXIMITY_BONUS_MAX;
  return Math.max(0, PROXIMITY_BONUS_MAX - gap * 2);
}

/** Computes a "relevance" score for a search result based on match type, position, proximity, and field. */
export function scoreResult(result: RepositoryData): number {
  const matchInfo = result._matchInfo;
  if (!matchInfo || Object.keys(matchInfo).length === 0) return 0;

  let score = 0;

  for (const [field, matches] of Object.entries(matchInfo)) {
    const weight = fieldWeight(field);

    for (const match of matches) {
      let matchScore = TYPE_SCORES[match.type] ?? 0;
      matchScore += Math.max(0, POSITION_BONUS_MAX - match.start * POSITION_DECAY);
      score += matchScore * weight;
    }

    score += proximityBonus(matches) * weight;
  }

  return score;
}

/** Sort comparator that ranks higher-relevance search results first. */
export function RelevanceSort(a: RepositoryData, b: RepositoryData): number {
  return scoreResult(b) - scoreResult(a);
}

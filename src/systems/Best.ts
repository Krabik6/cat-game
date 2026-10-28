const KEY = 'muchineko.best';

export interface BestRecord {
  /** Лучший результат по корму среди забегов, дошедших до финиша. */
  score: number;
  /** Самая длинная дистанция, м. */
  meters: number;
}

export function loadBest(): BestRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { score: 0, meters: 0, ...JSON.parse(raw) };
  } catch {
    /* хранилище недоступно */
  }
  return { score: 0, meters: 0 };
}

/** Сохраняет рекорд и возвращает true, если поставлен новый. */
export function saveBest(result: 'dead' | 'goal', score: number, meters: number): boolean {
  const best = loadBest();
  const newScore = result === 'goal' && score > best.score;
  const next = { score: newScore ? score : best.score, meters: Math.max(best.meters, meters) };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* не страшно */
  }
  return newScore;
}

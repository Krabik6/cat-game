const KEY = 'muchineko.progress.v3';

export interface LevelProgress {
  stars: [boolean, boolean, boolean];
  bestPoints: number;
}

type Store = Record<string, LevelProgress> & { endlessBest?: never };

function read(): { levels: Store; endlessBest: number } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { levels: {}, endlessBest: 0, ...JSON.parse(raw) };
  } catch {
    /* хранилище недоступно */
  }
  return { levels: {} as Store, endlessBest: 0 };
}

function write(data: ReturnType<typeof read>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* не страшно: прогресс просто не сохранится */
  }
}

export const progress = {
  get(id: string): LevelProgress | undefined {
    return read().levels[id];
  },
  starCount(id: string) {
    return (read().levels[id]?.stars ?? []).filter(Boolean).length;
  },
  totalStars() {
    return Object.values(read().levels).reduce((n, l) => n + l.stars.filter(Boolean).length, 0);
  },
  /** Уровень открыт, если пройден предыдущий. */
  unlocked(index: number, ids: string[]) {
    if (index === 0) return true;
    return !!read().levels[ids[index - 1]]?.stars[0];
  },
  /** Звёзды не теряются: сохраняется объединение лучших результатов. */
  record(id: string, stars: [boolean, boolean, boolean], points: number) {
    const data = read();
    const prev = data.levels[id];
    const merged: [boolean, boolean, boolean] = prev ? [0, 1, 2].map((i) => prev.stars[i] || stars[i]) as [boolean, boolean, boolean] : stars;
    const isNew = merged.filter(Boolean).length > (prev?.stars.filter(Boolean).length ?? 0);
    data.levels[id] = { stars: merged, bestPoints: Math.max(prev?.bestPoints ?? 0, points) };
    write(data);
    return isNew;
  },
  endlessBest() {
    return read().endlessBest;
  },
  recordEndless(meters: number) {
    const data = read();
    const isNew = meters > data.endlessBest;
    if (isNew) data.endlessBest = meters;
    write(data);
    return isNew;
  },
};

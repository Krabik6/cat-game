import { LevelBuilder } from '../sim/builder';
import type { LevelData } from '../sim/types';
import type { World } from '../sim/world';
import { rng } from '../art/city';

interface EndlessState {
  x: number;
  y: number;
  chunks: number;
  rand: () => number;
}


/** Бесконечный режим: стартовая крыша, дальше куски дописываются на бегу. */
export function endlessLevel(): LevelData {
  const b = new LevelBuilder({
    id: 'endless',
    index: 0,
    name: 'どこまでも',
    nameEn: 'ENDLESS',
    blurb: 'どこまで走れる？',
    startWeight: 0.25,
    targetPoints: 0,
  });
  b.roof(900, 420).row('kkkk', 420);
  const lv = b.data;
  lv.endless = true;
  lv.goal = { x: Number.POSITIVE_INFINITY, y: 0 };
  lv.gen = { x: b.x, y: b.y, chunks: 0, rand: rng(Date.now() % 100000) } satisfies EndlessState;
  return lv;
}

type Chunk = (b: LevelBuilder, d: number, r: () => number) => void;

const pick = <T>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];
const clampY = (y: number) => Math.max(240, Math.min(460, y));

const CHUNKS: { weight: number; make: Chunk }[] = [
  {
    weight: 3,
    make: (b, d, r) => {
      const y = clampY(b.y + (r() - 0.55) * 100);
      b.gapArc(90 + 70 * d + r() * 40, pick(r, ['kk', 'kkk', '']), 70, y).roof(300 + r() * 260, y);
      b.row(pick(r, ['kkkk', 'kk.kk', 'c', 'k.c.k', '']), 60);
    },
  },
  {
    weight: 2,
    make: (b, d, r) => {
      const max = 0.3 + r() * 0.15;
      b.roof(260, b.y).row('t', 120);
      b.wireRoad(520 + d * 240, max, pick(r, ['k.k.k', 'kkk', 'k.c.k']), pick(r, ['c..c', 'cc', 'c.c']));
      b.roof(300, b.y);
    },
  },
  {
    weight: 2,
    make: (b, d, r) => {
      b.roof(560, b.y).row('c.c', 120, { step: 90 }).futonEnd();
      b.roof(360 + r() * 120, clampY(b.y - 150 - d * 30)).row('kkk', 80);
    },
  },
  {
    // Широкий промежуток: без ぴょん не перелететь.
    weight: 2,
    make: (b, d, r) => {
      b.roof(320, b.y).row('kkk', 80);
      const y = clampY(b.y + (r() - 0.5) * 80);
      b.gapArc(270 + d * 50, 'kkkkk', 150, y).roof(380, y).row(pick(r, ['c', 'kk', 'k.k']), 100);
    },
  },
  {
    weight: 2,
    make: (b, d, r) => {
      const min = 0.3 + d * 0.3 + r() * 0.1;
      b.roof(560, b.y).row('c.c', 80, { step: 80 }).crates(320, 1 + Math.floor(r() * 3), Math.round(min * 20) / 20, 44, pick(r, ['kk', 'c', 'kkk']));
    },
  },
  {
    weight: 1.5,
    make: (b, d, r) => {
      b.roof(480, b.y).row('c.c', 100, { step: 100 });
      b.bridge(260 + d * 80, 0.45 + r() * 0.1).roof(380, b.y).row('kk', 120);
    },
  },
];

/** Дописывает уровень, когда кот приближается к краю построенного. */
export function extendEndless(world: World) {
  const lv = world.level;
  const st = lv.gen as EndlessState | undefined;
  if (!st) return;
  while (st.x < world.cat.x + 1800) {
    const d = Math.min(1, st.chunks / 30);
    const b = new LevelBuilder({ id: lv.id, index: 0, name: '', nameEn: '', blurb: '', startWeight: 0, targetPoints: 0 });
    b.x = st.x;
    b.y = st.y;
    // Номера сущностей не должны пересекаться с уже существующими.
    (b as unknown as { id: number }).id = 100000 + st.chunks * 1000;
    const total = CHUNKS.reduce((s, c) => s + c.weight, 0);
    let roll = st.rand() * total;
    const chunk = CHUNKS.find((c) => (roll -= c.weight) < 0) ?? CHUNKS[0];
    b.gap(100 + 40 * d);
    chunk.make(b, d, st.rand);
    const add = b.data;
    lv.roofs.push(...add.roofs);
    lv.items.push(...add.items);
    lv.wires.push(...add.wires);
    lv.futons.push(...add.futons);
    lv.vents.push(...add.vents);
    lv.crates.push(...add.crates);
    lv.bridges.push(...add.bridges);
    st.x = b.x;
    st.y = b.y;
    st.chunks++;
  }
  // Пройденное далеко позади можно забыть.
  const behind = world.cat.x - 1200;
  lv.items = lv.items.filter((i) => i.x > behind);
}

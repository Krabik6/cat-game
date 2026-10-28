import { World } from '../src/sim/world';
import type { Input, LevelData } from '../src/sim/types';

/** Решение раз в 0.1 с: такой темп по силам человеку. */
export const DECISION_STEPS = 12;

const ACTIONS: Input[] = [
  { jump: false, down: false },
  { jump: true, down: false },
  { jump: false, down: true },
];

interface Node {
  world: World;
  parent: Node | null;
  action: number;
}

export interface Finish {
  points: number;
  bells: number;
  weight: number;
  stars: [boolean, boolean, boolean];
  actions: number[];
}

export interface SolveReport {
  finishes: number;
  maxPoints: number;
  minWeight: number;
  maxWeight: number;
  threeStar: Finish | null;
  maxBells: number;
  bestPoints: Finish | null;
  /** Где погибает больше всего вариантов: подсказка, какое место самое трудное. */
  deathsAt: Record<string, number>;
  layers: number;
  /** Самая дальняя точка и вес там — для отладки непроходимых мест. */
  furthest: { x: number; weights: string };
}

function key(w: World, prevJump: boolean) {
  const c = w.cat;
  const lv = w.level;
  let flags = '';
  for (const x of lv.wires) flags += x.broken ? '1' : '0';
  for (const b of lv.bridges) flags += b.open ? '1' : b.reading === null ? '0' : '2';
  for (const k of lv.crates) if (k.x > c.x - 200 && k.x < c.x + 900) flags += k.broken ? '1' : '0';
  return `${Math.round(c.y / 3)}|${Math.round(c.vy / 80)}|${Math.round(c.weight * 50)}|${c.grounded ? 1 : 0}|${c.airUsed ? 1 : 0}|${prevJump ? 1 : 0}|${w.bells}|${flags}`;
}

/** Колокольчики важнее очков: без них нет третьей звезды. */
const score = (w: World) => w.bells * 1000 + w.points;

function trace(n: Node): number[] {
  const out: number[] = [];
  for (let p: Node | null = n; p && p.parent; p = p.parent) out.push(p.action);
  return out.reverse();
}

export function solve(level: LevelData, beam = 3000): SolveReport {
  let layer: Node[] = [{ world: new World(level), parent: null, action: 0 }];
  const finishes: Finish[] = [];
  const deathsAt: Record<string, number> = {};
  let layers = 0;
  let furthest = { x: 0, weights: '' };

  while (layer.length) {
    layers++;
    const next = new Map<string, Node>();
    for (const node of layer) {
      for (let a = 0; a < ACTIONS.length; a++) {
        const c = node.world.cat;
        if (a === 2 && c.grounded) continue;
        const w = node.world.clone();
        for (let i = 0; i < DECISION_STEPS && w.status === 'run'; i++) w.step(ACTIONS[a]);
        const child: Node = { world: w, parent: node, action: a };
        if (w.status === 'goal') {
          const r = w.result();
          finishes.push({ points: r.points, bells: r.bells, weight: r.weight, stars: r.stars, actions: trace(child) });
          continue;
        }
        if (w.status !== 'run') {
          const bucket = `${Math.floor(w.cat.x / 200) * 200}:${w.status}`;
          deathsAt[bucket] = (deathsAt[bucket] ?? 0) + 1;
          continue;
        }
        const k = key(w, ACTIONS[a].jump);
        const prev = next.get(k);
        if (!prev || score(prev.world) < score(w)) next.set(k, child);
      }
    }
    layer = [...next.values()];
    if (layer.length) {
      const ws = layer.map((n) => n.world.cat.weight);
      furthest = {
        x: Math.round(layer[0].world.cat.x),
        weights: `${Math.round(Math.min(...ws) * 100)}..${Math.round(Math.max(...ws) * 100)}%`,
      };
    }
    if (layer.length > beam) {
      // Сохраняем разнообразие по весу: сортировка только по очкам съела бы лёгкие варианты.
      layer.sort((a, b) => score(b.world) - score(a.world) || a.world.cat.weight - b.world.cat.weight);
      const byWeight = new Map<number, Node[]>();
      for (const n of layer) {
        const wb = Math.round(n.world.cat.weight * 20);
        if (!byWeight.has(wb)) byWeight.set(wb, []);
        byWeight.get(wb)!.push(n);
      }
      const per = Math.ceil(beam / byWeight.size);
      layer = [...byWeight.values()].flatMap((l) => l.slice(0, per));
    }
  }

  const three = finishes.filter((f) => f.stars.every(Boolean)).sort((a, b) => b.points - a.points)[0] ?? null;
  const best = [...finishes].sort((a, b) => b.points - a.points)[0] ?? null;
  return {
    finishes: finishes.length,
    maxPoints: best?.points ?? 0,
    minWeight: Math.min(...finishes.map((f) => f.weight)),
    maxWeight: Math.max(...finishes.map((f) => f.weight)),
    threeStar: three,
    maxBells: Math.max(0, ...finishes.map((f) => f.bells)),
    bestPoints: best,
    deathsAt,
    layers,
    furthest,
  };
}

/** Проигрывает записанные решения и возвращает итог: проверка, что трасса воспроизводима. */
export function replay(level: LevelData, actions: number[]) {
  const w = new World(level);
  for (const a of actions) for (let i = 0; i < DECISION_STEPS && w.status === 'run'; i++) w.step(ACTIONS[a]);
  while (w.status === 'run' && w.time < 120) w.step(ACTIONS[0]);
  return w.result();
}

/** Простые «стратегии» человека — чтобы убедиться, что жадность наказывается. */
export function policyRun(level: LevelData, decide: (w: World) => Input) {
  const w = new World(level);
  while (w.status === 'run' && w.time < 120) {
    const input = decide(w);
    for (let i = 0; i < DECISION_STEPS && w.status === 'run'; i++) w.step(input);
  }
  return w.result();
}

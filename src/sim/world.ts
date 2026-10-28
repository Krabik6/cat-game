import { ITEM, physics, SIM } from './constants';
import type { Crate, Input, LevelData, Requirement, Result, SimEvent, Status } from './types';

export interface Cat {
  x: number;
  /** Низ хитбокса (лапы). */
  y: number;
  vy: number;
  weight: number;
  grounded: boolean;
  /** На чём стоит: для провисания проводов и весов. */
  ground: { kind: 'roof' | 'wire' | 'bridge' | 'crate'; id: number } | null;
  coyote: number;
  buffer: number;
  jumpCut: boolean;
  diving: boolean;
  inVent: boolean;
  /** Прыжок в воздухе уже потрачен в этом полёте. */
  airUsed: boolean;
}

type Surface = { kind: 'roof' | 'wire' | 'bridge' | 'futon' | 'crate'; id: number; x1: number; x2: number; y: number };

const EPS = 1e-9;

/**
 * Детерминированная симуляция забега. Не знает про Phaser: её же гоняет
 * бот-решатель в tools/solver.ts, чтобы проверять уровни.
 */
export class World {
  readonly level: LevelData;
  cat: Cat;
  status: Status = 'run';
  time = 0;
  points = 0;
  bells = 0;
  /** Сколько чекпоинтов позади. */
  checkpoint = 0;
  events: SimEvent[] = [];
  private prevJump = false;

  constructor(source: LevelData) {
    this.level = copyLevel(source);
    const start = this.level.roofs[0];
    this.cat = {
      x: start.x + 160,
      y: start.y,
      vy: 0,
      weight: this.level.startWeight,
      grounded: true,
      ground: { kind: 'roof', id: start.id },
      coyote: 0,
      buffer: 0,
      jumpCut: false,
      diving: false,
      inVent: false,
      airUsed: false,
    };
  }

  /** Глубокая копия: для перебора вариантов в боте и для чекпоинтов. */
  clone(): World {
    const w = Object.create(World.prototype) as World;
    Object.assign(w, this);
    (w as { level: LevelData }).level = copyLevel(this.level);
    w.cat = { ...this.cat, ground: this.cat.ground && { ...this.cat.ground } };
    w.events = [];
    return w;
  }

  get bellsTotal() {
    return this.level.items.filter((i) => i.kind === 'bell').length;
  }

  step(input: Input) {
    if (this.status !== 'run') return;
    const dt = SIM.dt;
    const c = this.cat;
    const lv = this.level;
    this.time += dt;

    const pressed = input.jump && !this.prevJump;
    this.prevJump = input.jump;
    c.buffer = Math.max(0, c.buffer - dt);
    c.coyote = Math.max(0, c.coyote - dt);

    if (pressed) {
      if (c.grounded || c.coyote > 0) c.buffer = SIM.jumpBuffer;
      else if (!c.airUsed && c.weight >= SIM.airCost - EPS) this.airJump();
      else c.buffer = SIM.jumpBuffer;
    }
    if (c.buffer > 0 && (c.grounded || c.coyote > 0)) {
      c.vy = -physics.jumpV(c.weight);
      c.grounded = false;
      c.ground = null;
      c.coyote = 0;
      c.buffer = 0;
      c.jumpCut = false;
      c.diving = false;
      this.events.push({ type: 'jump', weight: c.weight });
    }
    if (!input.jump && !c.jumpCut && c.vy < -SIM.jumpCutV) {
      c.vy = -SIM.jumpCutV;
      c.jumpCut = true;
    }
    if (input.down && !c.grounded && c.vy < SIM.fastFallV) {
      c.vy = SIM.fastFallV;
      c.diving = true;
    }

    // Вертикаль.
    const prevY = c.y;
    if (c.grounded && !this.supportAt(c.x, c.y)) {
      c.grounded = false;
      c.ground = null;
      c.coyote = SIM.coyote;
    }
    if (!c.grounded) {
      let g = physics.gravity(c.weight);
      const vent = lv.vents.find((v) => c.x > v.x && c.x < v.x + v.w);
      c.inVent = !!vent && c.y - physics.height(c.weight) > vent.top - 40;
      if (vent && c.inVent && !c.diving) g -= SIM.ventLift * (1 - c.weight);
      c.vy = Math.min(SIM.maxFallV, c.vy + g * dt);
      if (c.inVent && !c.diving) c.vy = Math.max(c.vy, -SIM.ventMaxUp);
      c.y += c.vy * dt;
      const top = c.y - physics.height(c.weight);
      if (top < SIM.ceilingY) {
        c.y += SIM.ceilingY - top;
        c.vy = Math.max(c.vy, 0);
      }
      if (c.vy >= 0) this.tryLand(prevY);
    } else {
      c.inVent = false;
    }

    // Горизонталь: бежим всегда. Стена — это «ごつん», ящик тяжёлый проламывает.
    c.x += lv.speed * dt;
    const half = physics.halfW(c.weight);
    for (const r of lv.roofs) {
      if (c.x + half <= r.x || c.x - half >= r.x + r.w) continue;
      if (r.y >= c.y) continue;
      if (c.y - r.y <= SIM.stepUp) {
        c.y = r.y;
        if (!c.grounded) this.land({ kind: 'roof', id: r.id, x1: r.x, x2: r.x + r.w, y: r.y });
        continue;
      }
      return this.finish('bonk');
    }
    for (const k of lv.crates) {
      if (k.broken || c.x + half <= k.x || c.x - half >= k.x + k.w) continue;
      const top = k.y - k.h;
      if (c.y <= top + SIM.stepUp || c.y - physics.height(c.weight) >= k.y) continue;
      if (c.weight >= k.min - EPS) this.smash(k);
      else return this.finish('bonk');
    }

    // Футон на крыше: забежал — подбросило.
    if (c.grounded) {
      const f = lv.futons.find((f) => c.x > f.x && c.x < f.x + f.w && Math.abs(c.y - f.y) < 1);
      if (f) {
        c.grounded = false;
        c.ground = null;
        this.land({ kind: 'futon', id: f.id, x1: f.x, x2: f.x + f.w, y: f.y });
      }
    }

    // Вес чуть сгорает на бегу; провод рвётся под тяжёлым.
    if (c.grounded) c.weight = Math.max(0, c.weight - SIM.burnPerSec * dt);
    if (c.ground?.kind === 'wire') {
      const wire = lv.wires.find((w) => w.id === c.ground!.id)!;
      if (c.weight > wire.max + EPS) this.snap(wire.id);
    }

    // Весы перед мостом.
    for (const b of lv.bridges) {
      if (b.reading === null && c.grounded && Math.abs(c.x - b.scaleX) < 24) {
        b.reading = c.weight;
        b.open = c.weight >= b.min - EPS;
        this.events.push({ type: 'scale', id: b.id, reading: c.weight, ok: b.open });
      }
    }

    // Еда: кот растёт и захватывает больше.
    const h = physics.height(c.weight);
    const cy = c.y - h / 2;
    const reachX = physics.halfW(c.weight) + SIM.itemRadius;
    const reachY = h / 2 + SIM.itemRadius;
    for (const it of lv.items) {
      if (it.taken || Math.abs(it.x - c.x) > reachX || Math.abs(it.y - cy) > reachY) continue;
      if (it.inCrate !== undefined && !lv.crates.find((k) => k.id === it.inCrate)?.broken) continue;
      it.taken = true;
      const def = ITEM[it.kind];
      c.weight = Math.min(1, Math.max(0, c.weight + def.weight));
      this.points += def.points;
      if (it.kind === 'bell') this.bells++;
      this.events.push({ type: 'eat', kind: it.kind, id: it.id });
    }

    const cps = lv.checkpoints;
    if (this.checkpoint < cps.length && c.x >= cps[this.checkpoint] && c.grounded) {
      this.events.push({ type: 'checkpoint', x: cps[this.checkpoint] });
      this.checkpoint++;
    }

    if (c.y > SIM.deathY) return this.finish('fall');
    if (c.x >= lv.goal.x && !lv.endless) return this.finish('goal');
  }

  private airJump() {
    const c = this.cat;
    c.weight = Math.max(0, c.weight - SIM.airCost);
    c.vy = -physics.jumpV(c.weight) * SIM.airV;
    c.airUsed = true;
    c.jumpCut = false;
    c.diving = false;
    c.buffer = 0;
    this.events.push({ type: 'airJump', weight: c.weight });
  }

  private surfaces(): Surface[] {
    const lv = this.level;
    const out: Surface[] = [];
    const x = this.cat.x;
    for (const r of lv.roofs) if (r.x < x + 100 && r.x + r.w > x - 100) out.push({ kind: 'roof', id: r.id, x1: r.x, x2: r.x + r.w, y: r.y });
    for (const w of lv.wires) if (!w.broken) out.push({ kind: 'wire', id: w.id, x1: w.x1, x2: w.x2, y: w.y });
    for (const b of lv.bridges) if (b.open) out.push({ kind: 'bridge', id: b.id, x1: b.x, x2: b.x + b.w, y: b.y });
    for (const f of lv.futons) out.push({ kind: 'futon', id: f.id, x1: f.x, x2: f.x + f.w, y: f.y });
    for (const k of lv.crates) if (!k.broken) out.push({ kind: 'crate', id: k.id, x1: k.x, x2: k.x + k.w, y: k.y - k.h });
    return out;
  }

  private supportAt(x: number, y: number) {
    const half = physics.halfW(this.cat.weight);
    return this.surfaces().some((s) => s.kind !== 'futon' && Math.abs(s.y - y) < 0.5 && x + half > s.x1 && x - half < s.x2);
  }

  private tryLand(prevY: number) {
    const c = this.cat;
    const half = physics.halfW(c.weight);
    let best: Surface | null = null;
    for (const s of this.surfaces()) {
      if (c.x + half <= s.x1 || c.x - half >= s.x2) continue;
      // Провода и футоны — только сверху; узкие, поэтому ловим центром кота.
      if ((s.kind === 'wire' || s.kind === 'futon') && (c.x < s.x1 - 6 || c.x > s.x2 + 6)) continue;
      if (s.y < prevY - 0.01 || s.y > c.y) continue;
      if (!best || s.y < best.y) best = s;
    }
    if (best) this.land(best);
  }

  private land(s: Surface) {
    const c = this.cat;
    if (s.kind === 'futon') {
      c.y = s.y;
      c.vy = -physics.futonV(c.weight);
      c.jumpCut = true;
      c.diving = false;
      c.airUsed = false;
      this.events.push({ type: 'bounce', id: s.id, weight: c.weight });
      return;
    }
    if (s.kind === 'wire') {
      const wire = this.level.wires.find((w) => w.id === s.id)!;
      if (c.weight > wire.max + EPS) {
        this.snap(wire.id);
        return;
      }
    }
    if (s.kind === 'crate') {
      // Тяжёлый кот падает на ящик сверху — ящику конец, летим дальше вниз.
      const k = this.level.crates.find((k) => k.id === s.id)!;
      if (c.weight >= k.min - EPS) {
        this.smash(k);
        this.tryLand(s.y);
        return;
      }
    }
    this.events.push({ type: 'land', vy: c.vy, weight: c.weight });
    c.y = s.y;
    c.vy = 0;
    c.grounded = true;
    c.diving = false;
    c.airUsed = false;
    c.ground = { kind: s.kind as 'roof' | 'wire' | 'bridge' | 'crate', id: s.id };
  }

  private smash(k: Crate) {
    k.broken = true;
    this.points += SIM.cratePoints;
    this.events.push({ type: 'smash', id: k.id, weight: this.cat.weight });
    if (this.cat.ground?.kind === 'crate' && this.cat.ground.id === k.id) {
      this.cat.grounded = false;
      this.cat.ground = null;
    }
  }

  private snap(id: number) {
    const wire = this.level.wires.find((w) => w.id === id)!;
    wire.broken = true;
    this.events.push({ type: 'wireSnap', id });
    if (this.cat.ground?.kind === 'wire' && this.cat.ground.id === id) {
      this.cat.grounded = false;
      this.cat.ground = null;
    }
  }

  private finish(status: Exclude<Status, 'run'>) {
    this.status = status;
    this.events.push({ type: 'finish', result: this.result() });
  }

  result(): Result {
    const lv = this.level;
    const goal = this.status === 'goal';
    const total = this.bellsTotal;
    return {
      status: this.status === 'run' ? 'fall' : this.status,
      points: this.points,
      weight: this.cat.weight,
      distance: Math.max(0, Math.floor((this.cat.x - lv.roofs[0].x) / 50)),
      bells: this.bells,
      bellsTotal: total,
      stars: [goal, goal && this.points >= lv.targetPoints, goal && this.bells >= total],
    };
  }

  /** Ближайшее испытание впереди: HUD показывает его порог на шкале веса. */
  nextRequirement(range = 1100): Requirement | null {
    const x = this.cat.x;
    const lv = this.level;
    const list: Requirement[] = [];
    const y = this.cat.y;
    // Испытание показываем, только если кот на его ярусе: провод — сверху, футон нижней дороги — снизу.
    for (const w of lv.wires) if (!w.broken && w.x2 > x && y <= w.y + 40) list.push({ kind: 'wire', max: w.max, x: w.x1 });
    for (const v of lv.vents) if (v.x + v.w > x) list.push({ kind: 'vent', max: physics.ventLimit(), x: v.x });
    for (const b of lv.bridges) if (b.reading === null && b.scaleX > x) list.push({ kind: 'bridge', min: b.min, x: b.scaleX });
    for (const f of lv.futons) {
      const min = futonMin(lv, f);
      if (min > 0 && f.x + f.w > x && y >= f.y - 60) list.push({ kind: 'futon', min, x: f.x });
    }
    for (const k of lv.crates) if (!k.broken && k.x + k.w > x) list.push({ kind: 'crate', min: k.min, x: k.x });
    list.sort((a, b) => a.x - b.x);
    const next = list.find((r) => r.x + 60 > x);
    return next && next.x - x < range ? next : null;
  }
}

function copyLevel(src: LevelData): LevelData {
  return {
    ...src,
    items: src.items.map((i) => ({ ...i })),
    wires: src.wires.map((i) => ({ ...i })),
    bridges: src.bridges.map((i) => ({ ...i })),
    crates: src.crates.map((i) => ({ ...i })),
  };
}

/** Минимальный вес, при котором футон забросит на следующую крышу (без прыжка в воздухе). */
export function futonMin(lv: LevelData, f: { x: number; y: number; w: number }): number {
  // Стеной считается только дом сразу за краем крыши с футоном; футон посреди крыши — просто батут.
  const wall = lv.roofs.filter((r) => r.x > f.x && r.x < f.x + f.w + 260).sort((a, b) => a.x - b.x)[0];
  const rise = wall ? f.y - wall.y + 12 : 0;
  for (let w = 0; w <= 1.0001; w += 0.01) if (physics.futonHeight(w) >= rise) return Math.round(w * 100) / 100;
  return 1;
}

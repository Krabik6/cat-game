import { ITEM, physics, SIM } from './constants';
import type { Input, LevelData, Requirement, Result, SimEvent, Status } from './types';

export interface Cat {
  x: number;
  /** Низ хитбокса (лапы). */
  y: number;
  vy: number;
  weight: number;
  grounded: boolean;
  /** На чём стоит: для провисания проводов и весов. */
  ground: { kind: 'roof' | 'wire' | 'bridge'; id: number } | null;
  coyote: number;
  buffer: number;
  jumpCut: boolean;
  diving: boolean;
  inVent: boolean;
}

type Surface = { kind: 'roof' | 'wire' | 'bridge' | 'futon'; id: number; x1: number; x2: number; y: number };

const HALF = SIM.catW / 2;

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
  events: SimEvent[] = [];
  private prevJump = false;

  constructor(source: LevelData) {
    const level: LevelData = {
      ...source,
      items: source.items.map((i) => ({ ...i })),
      wires: source.wires.map((i) => ({ ...i })),
      bridges: source.bridges.map((i) => ({ ...i })),
    };
    this.level = level;
    const start = level.roofs[0];
    this.cat = {
      x: start.x + 160,
      y: start.y,
      vy: 0,
      weight: level.startWeight,
      grounded: true,
      ground: { kind: 'roof', id: start.id },
      coyote: 0,
      buffer: 0,
      jumpCut: false,
      diving: false,
      inVent: false,
    };
  }

  /** Глубокая копия для перебора вариантов в боте. */
  clone(): World {
    const w = Object.create(World.prototype) as World;
    Object.assign(w, this);
    (w as { level: LevelData }).level = {
      ...this.level,
      items: this.level.items.map((i) => ({ ...i })),
      wires: this.level.wires.map((i) => ({ ...i })),
      bridges: this.level.bridges.map((i) => ({ ...i })),
    };
    w.cat = { ...this.cat, ground: this.cat.ground && { ...this.cat.ground } };
    w.events = [];
    return w;
  }

  step(input: Input) {
    if (this.status !== 'run') return;
    const dt = SIM.dt;
    const c = this.cat;
    const lv = this.level;
    this.time += dt;

    if (input.jump && !this.prevJump) c.buffer = SIM.jumpBuffer;
    this.prevJump = input.jump;
    c.buffer = Math.max(0, c.buffer - dt);
    c.coyote = Math.max(0, c.coyote - dt);

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
    if (c.grounded) {
      if (!this.supportAt(c.x, c.y)) {
        c.grounded = false;
        c.ground = null;
        c.coyote = SIM.coyote;
      }
    }
    if (!c.grounded) {
      let g = physics.gravity(c.weight);
      const vent = lv.vents.find((v) => c.x > v.x && c.x < v.x + v.w);
      c.inVent = !!vent && c.y - SIM.catH > vent.top - 40;
      if (vent && c.inVent && !c.diving) g -= SIM.ventLift * (1 - c.weight);
      c.vy = Math.min(SIM.maxFallV, c.vy + g * dt);
      if (c.inVent && !c.diving) c.vy = Math.max(c.vy, -SIM.ventMaxUp);
      c.y += c.vy * dt;
      if (c.y - SIM.catH < SIM.ceilingY) {
        c.y = SIM.ceilingY + SIM.catH;
        c.vy = Math.max(c.vy, 0);
      }
      if (c.vy >= 0) this.tryLand(prevY);
    } else {
      c.inVent = false;
    }

    // Горизонталь: бежим всегда, стена — это «ごつん».
    c.x += lv.speed * dt;
    for (const r of lv.roofs) {
      if (c.x + HALF <= r.x || c.x - HALF >= r.x + r.w) continue;
      if (r.y >= c.y) continue;
      if (c.y - r.y <= SIM.stepUp) {
        c.y = r.y;
        if (!c.grounded) this.land({ kind: 'roof', id: r.id, x1: r.x, x2: r.x + r.w, y: r.y });
        continue;
      }
      return this.finish('bonk');
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

    // Вес: сгорает на бегу, провод рвётся под тяжёлым.
    if (c.grounded) c.weight = Math.max(0, c.weight - SIM.burnPerSec * dt);
    if (c.ground?.kind === 'wire') {
      const wire = lv.wires.find((w) => w.id === c.ground!.id)!;
      if (c.weight > wire.max + 1e-9) this.snap(wire.id);
    }

    // Весы перед мостом.
    for (const b of lv.bridges) {
      if (b.reading === null && c.grounded && Math.abs(c.x - b.scaleX) < 24) {
        b.reading = c.weight;
        b.open = c.weight >= b.min - 1e-9;
        this.events.push({ type: 'scale', id: b.id, reading: c.weight, ok: b.open });
      }
    }

    // Еда.
    const cy = c.y - SIM.catH / 2;
    for (const it of lv.items) {
      if (it.taken || Math.abs(it.x - c.x) > HALF + SIM.itemRadius) continue;
      if (Math.abs(it.y - cy) > SIM.catH / 2 + SIM.itemRadius) continue;
      it.taken = true;
      const def = ITEM[it.kind];
      c.weight = Math.min(1, Math.max(0, c.weight + def.weight));
      this.points += def.points;
      this.events.push({ type: 'eat', kind: it.kind, id: it.id });
    }

    if (c.y > SIM.deathY) return this.finish('fall');
    if (c.x >= lv.goal.x && !lv.endless) return this.finish('goal');
  }

  private surfaces(): Surface[] {
    const lv = this.level;
    const out: Surface[] = [];
    const x = this.cat.x;
    for (const r of lv.roofs) if (r.x < x + 100 && r.x + r.w > x - 100) out.push({ kind: 'roof', id: r.id, x1: r.x, x2: r.x + r.w, y: r.y });
    for (const w of lv.wires) if (!w.broken) out.push({ kind: 'wire', id: w.id, x1: w.x1, x2: w.x2, y: w.y });
    for (const b of lv.bridges) if (b.open) out.push({ kind: 'bridge', id: b.id, x1: b.x, x2: b.x + b.w, y: b.y });
    for (const f of lv.futons) out.push({ kind: 'futon', id: f.id, x1: f.x, x2: f.x + f.w, y: f.y });
    return out;
  }

  private supportAt(x: number, y: number) {
    return this.surfaces().some((s) => s.kind !== 'futon' && Math.abs(s.y - y) < 0.5 && x + HALF > s.x1 && x - HALF < s.x2);
  }

  private tryLand(prevY: number) {
    const c = this.cat;
    let best: Surface | null = null;
    for (const s of this.surfaces()) {
      if (c.x + HALF <= s.x1 || c.x - HALF >= s.x2) continue;
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
      this.events.push({ type: 'bounce', id: s.id, weight: c.weight });
      return;
    }
    if (s.kind === 'wire') {
      const wire = this.level.wires.find((w) => w.id === s.id)!;
      if (c.weight > wire.max + 1e-9) {
        this.snap(wire.id);
        return;
      }
    }
    this.events.push({ type: 'land', vy: c.vy, weight: c.weight });
    c.y = s.y;
    c.vy = 0;
    c.grounded = true;
    c.diving = false;
    c.ground = { kind: s.kind as 'roof' | 'wire' | 'bridge', id: s.id };
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
    const w = this.cat.weight;
    const goal = this.status === 'goal';
    return {
      status: this.status === 'run' ? 'fall' : this.status,
      points: this.points,
      weight: w,
      distance: Math.max(0, Math.floor((this.cat.x - lv.roofs[0].x) / 50)),
      stars: [goal, goal && this.points >= lv.targetPoints, goal && w >= lv.goal.band[0] - 1e-9 && w <= lv.goal.band[1] + 1e-9],
    };
  }

  /** Ближайшее испытание впереди: HUD показывает его порог на шкале веса. */
  nextRequirement(range = 1100): Requirement | null {
    const x = this.cat.x;
    const lv = this.level;
    const list: Requirement[] = [];
    for (const w of lv.wires) if (!w.broken && w.x2 > x) list.push({ kind: 'wire', max: w.max, x: w.x1 });
    for (const v of lv.vents) if (v.x + v.w > x) list.push({ kind: 'vent', max: physics.ventLimit(), x: v.x });
    for (const b of lv.bridges) if (b.reading === null && b.scaleX > x) list.push({ kind: 'bridge', min: b.min, x: b.scaleX });
    for (const f of lv.futons) if (f.x + f.w > x) list.push({ kind: 'futon', min: futonMin(lv, f), x: f.x });
    list.sort((a, b) => a.x - b.x);
    const next = list.find((r) => r.x + 400 > x);
    return next && next.x - x < range ? next : null;
  }
}

/** Минимальный вес, при котором футон забросит на следующую крышу. */
export function futonMin(lv: LevelData, f: { x: number; y: number; w: number }): number {
  const wall = lv.roofs.filter((r) => r.x > f.x && r.x < f.x + 700).sort((a, b) => a.x - b.x)[0];
  const rise = wall ? f.y - wall.y + 12 : 0;
  for (let w = 0; w <= 1.0001; w += 0.01) if (physics.futonHeight(w) >= rise) return Math.round(w * 100) / 100;
  return 1;
}

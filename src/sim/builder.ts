import type { Item, ItemKind, LevelData, Roof, RoofStyle } from './types';

const KIND: Record<string, ItemKind> = { k: 'kibble', c: 'can', t: 'toy' };

export interface LevelMeta {
  id: string;
  index: number;
  name: string;
  nameEn: string;
  blurb: string;
  speed?: number;
  startWeight: number;
  targetPoints: number;
}

/**
 * Конструктор уровня: курсор идёт слева направо, крыши и препятствия
 * добавляются по очереди. Высоты — верх крыши в пикселях мира (экран 540).
 */
export class LevelBuilder {
  /** Текущая высота поверхности. */
  y = 440;
  /** Правый край последнего элемента. */
  x = 0;
  private id = 0;
  private styleIdx = 0;
  readonly data: LevelData;
  private last!: Roof;

  constructor(meta: LevelMeta) {
    this.data = {
      ...meta,
      speed: meta.speed ?? 300,
      roofs: [],
      items: [],
      wires: [],
      futons: [],
      vents: [],
      bridges: [],
      signs: [],
      goal: { x: 0, y: 0, band: [0, 1] },
    };
  }

  private nextId() {
    return ++this.id;
  }

  /** Крыша шириной w; y — новая высота (по умолчанию прежняя). */
  roof(w: number, y = this.y, style?: RoofStyle) {
    const styles: RoofStyle[] = ['ink', 'stone', 'ink', 'charcoal'];
    this.y = y;
    this.last = {
      id: this.nextId(),
      x: this.x,
      y,
      w,
      style: style ?? styles[this.styleIdx++ % styles.length],
      seed: (this.id * 7919) % 1000,
    };
    this.data.roofs.push(this.last);
    this.x += w;
    return this;
  }

  gap(w: number) {
    this.x += w;
    return this;
  }

  /** Ряд предметов на последней крыше: k — корм, c — консервы, t — игрушка, «.» — пропуск. */
  row(pattern: string, dx: number, opts: { dy?: number; step?: number; rise?: number } = {}) {
    const { dy = -24, step = 40, rise = 0 } = opts;
    [...pattern].forEach((ch, i) => {
      if (KIND[ch]) this.item(KIND[ch], this.last.x + dx + i * step, this.last.y + dy - rise * i);
    });
    return this;
  }

  /** Предмет в абсолютных координатах. */
  item(kind: ItemKind, x: number, y: number) {
    const it: Item = { id: this.nextId(), kind, x, y, taken: false };
    this.data.items.push(it);
    return this;
  }

  /** Дуга предметов от точки (x0,y0) к (x1,y1) с вершиной на peak выше. */
  arc(pattern: string, x0: number, y0: number, x1: number, y1: number, peak: number) {
    const n = pattern.length;
    [...pattern].forEach((ch, i) => {
      if (!KIND[ch]) return;
      const t = (i + 1) / (n + 1);
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t - 4 * t * (1 - t) * peak;
      this.item(KIND[ch], x, y);
    });
    return this;
  }

  /** Дуга над промежутком, который сейчас начнётся: до следующей крыши на высоте y1. */
  gapArc(w: number, pattern: string, peak: number, y1 = this.y) {
    this.arc(pattern, this.x, this.y - 24, this.x + w, y1 - 24, peak);
    return this.gap(w);
  }

  /** Провод от края крыши до следующей крыши на той же высоте. */
  wire(len: number, max: number, pattern = '') {
    const w = { id: this.nextId(), x1: this.x, x2: this.x + len, y: this.y, max, broken: false };
    this.data.wires.push(w);
    if (pattern) {
      const step = len / (pattern.length + 1);
      [...pattern].forEach((ch, i) => KIND[ch] && this.item(KIND[ch], w.x1 + step * (i + 1), w.y - 24));
    }
    this.x += len;
    return this;
  }

  /** Футон перед краем последней крыши: следующий дом — стена, на которую он забросит. */
  futonEnd(before = 190, w = 64) {
    return this.futon(this.last.w - before, w);
  }

  /** Футон на последней крыше со смещением dx. */
  futon(dx: number, w = 64) {
    this.data.futons.push({ id: this.nextId(), x: this.last.x + dx, y: this.last.y, w });
    return this;
  }

  /** Промежуток с восходящим потоком: поднимает до высоты top. */
  vent(w: number, top: number) {
    this.data.vents.push({ id: this.nextId(), x: this.x, w, top });
    return this.gap(w);
  }

  /** Весы в конце последней крыши и мост через промежуток gapW. */
  bridge(gapW: number, min: number) {
    this.data.bridges.push({
      id: this.nextId(),
      x: this.x,
      w: gapW,
      y: this.y,
      min,
      scaleX: this.x - 70,
      open: false,
      reading: null,
    });
    return this.gap(gapW);
  }

  sign(dx: number, text: string, sub: string) {
    this.data.signs.push({ x: this.last.x + dx, y: this.last.y, text, sub });
    return this;
  }

  /** Финишная крыша с весами-целью. */
  goal(band: [number, number], w = 700) {
    this.roof(w);
    this.data.goal = { x: this.last.x + 260, y: this.last.y, band };
    return this.data;
  }
}

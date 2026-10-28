import type { Item, ItemKind, LevelData, Roof, RoofStyle } from './types';

const KIND: Record<string, ItemKind> = { k: 'kibble', c: 'can', t: 'toy', b: 'bell' };

export interface LevelMeta {
  id: string;
  index: number;
  name: string;
  nameEn: string;
  blurb: string;
  speed?: number;
  startWeight: number;
  targetPoints: number;
  night?: boolean;
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
      crates: [],
      checkpoints: [],
      signs: [],
      goal: { x: 0, y: 0 },
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

  /** Ряд предметов на последней крыше: k — корм, c — консервы, t — игрушка, b — колокольчик, «.» — пропуск. */
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

  /**
   * Провод с нижней дорогой. Лёгкий идёт поверху, тяжёлый (или порвавший провод)
   * бежит внизу: там консервы и футон обратно наверх.
   */
  wireRoad(len: number, max: number, top = '', low = 'c..c', depth = 170) {
    const x0 = this.x;
    const y0 = this.y;
    this.wire(len, max, top);
    const x1 = this.x;
    this.x = x0;
    this.roof(len, y0 + depth);
    if (low) this.row(low, 90, { step: 60 });
    this.futonEnd(190);
    this.x = x1;
    this.y = y0;
    return this;
  }

  /** Предмет над текущим курсором: dx назад от x, dy вверх от поверхности. */
  at(kind: ItemKind, dxBack: number, dyUp: number) {
    return this.item(kind, this.x - dxBack, this.y - dyUp);
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

  /**
   * Ящик 段ボール на последней крыше. Тяжёлый (вес ≥ min) проламывает его,
   * лёгкий должен перепрыгнуть. inside — что спрятано внутри.
   */
  crate(dx: number, min: number, inside = '', opts: { w?: number; h?: number; stack?: number } = {}) {
    const { w = 44, h = 40 } = opts;
    const x = this.last.x + dx;
    const id = this.nextId();
    this.data.crates.push({ id, x, y: this.last.y, w, h, min, broken: false });
    [...inside].forEach((ch, i) => {
      if (!KIND[ch]) return;
      const it: Item = { id: this.nextId(), kind: KIND[ch], x: x + w / 2 + (i - (inside.length - 1) / 2) * 12, y: this.last.y - h / 2, taken: false, inCrate: id };
      this.data.items.push(it);
    });
    return this;
  }

  /** Ряд ящиков подряд с шагом step. */
  crates(dx: number, n: number, min: number, step = 44, inside = '') {
    for (let i = 0; i < n; i++) this.crate(dx + i * step, min, i === n - 1 ? inside : '');
    return this;
  }

  /** Чекпоинт 提灯 на последней крыше. */
  checkpoint(dx = 120) {
    this.data.checkpoints.push(this.last.x + dx);
    return this;
  }

  sign(dx: number, text: string, sub: string) {
    this.data.signs.push({ x: this.last.x + dx, y: this.last.y, text, sub });
    return this;
  }

  /** Финишная крыша. */
  goal(w = 700) {
    this.roof(w);
    this.data.goal = { x: this.last.x + 260, y: this.last.y };
    this.data.checkpoints.sort((a, b) => a - b);
    return this.data;
  }
}

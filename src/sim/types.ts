export type ItemKind = 'kibble' | 'can' | 'toy' | 'bell';
export type RoofStyle = 'ink' | 'stone' | 'charcoal';

export interface Roof {
  id: number;
  x: number;
  /** Верхняя поверхность. Крыша — сплошной блок до низа экрана. */
  y: number;
  w: number;
  style: RoofStyle;
  seed: number;
}

export interface Item {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  taken: boolean;
  /** Спрятан в ящике с этим id: доступен, только когда ящик разбит. */
  inCrate?: number;
}

/** 段ボール: тяжёлый кот проламывает, лёгкому надо перепрыгнуть. */
export interface Crate {
  id: number;
  x: number;
  /** Низ ящика (крыша, на которой стоит). */
  y: number;
  w: number;
  h: number;
  min: number;
  broken: boolean;
}

/** 電線: проходимо, только если вес не больше max. */
export interface Wire {
  id: number;
  x1: number;
  x2: number;
  y: number;
  max: number;
  broken: boolean;
}

/** ふとん: подбрасывает, тем выше, чем тяжелее кот. */
export interface Futon {
  id: number;
  x: number;
  y: number;
  w: number;
}

/** ビル風: восходящий поток между домами, держит только лёгкого кота. */
export interface Vent {
  id: number;
  x: number;
  w: number;
  /** Выше этой высоты поток не поднимает. */
  top: number;
}

/** 体重計 и мост: мост опускается, если на весах вес не меньше min. */
export interface Bridge {
  id: number;
  x: number;
  w: number;
  y: number;
  min: number;
  scaleX: number;
  open: boolean;
  reading: number | null;
}

export interface Sign {
  x: number;
  y: number;
  text: string;
  sub: string;
}

export interface Goal {
  x: number;
  y: number;
}

export interface LevelData {
  id: string;
  index: number;
  name: string;
  nameEn: string;
  blurb: string;
  speed: number;
  startWeight: number;
  targetPoints: number;
  roofs: Roof[];
  items: Item[];
  wires: Wire[];
  futons: Futon[];
  vents: Vent[];
  bridges: Bridge[];
  crates: Crate[];
  /** Чекпоинты 提灯: x, после которого забег продолжается отсюда. */
  checkpoints: number[];
  signs: Sign[];
  goal: Goal;
  /** Бесконечный режим: уровень дописывается по ходу. */
  endless?: boolean;
  /** Ночная палитра. */
  night?: boolean;
  /** Состояние генератора бесконечного режима. */
  gen?: unknown;
}

export type Requirement =
  | { kind: 'wire'; max: number; x: number }
  | { kind: 'vent'; max: number; x: number }
  | { kind: 'bridge'; min: number; x: number }
  | { kind: 'futon'; min: number; x: number }
  | { kind: 'crate'; min: number; x: number };

export type SimEvent =
  | { type: 'jump'; weight: number }
  | { type: 'airJump'; weight: number }
  | { type: 'smash'; id: number; weight: number }
  | { type: 'checkpoint'; x: number }
  | { type: 'land'; vy: number; weight: number }
  | { type: 'eat'; kind: ItemKind; id: number }
  | { type: 'bounce'; id: number; weight: number }
  | { type: 'wireSnap'; id: number }
  | { type: 'scale'; id: number; reading: number; ok: boolean }
  | { type: 'finish'; result: Result };

export type Status = 'run' | 'fall' | 'bonk' | 'goal';

export interface Result {
  status: Exclude<Status, 'run'>;
  points: number;
  weight: number;
  distance: number;
  bells: number;
  bellsTotal: number;
  stars: [boolean, boolean, boolean];
}

export interface Input {
  jump: boolean;
  down: boolean;
}

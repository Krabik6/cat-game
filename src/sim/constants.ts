/**
 * Все числа физики в одном месте. Мир в «пикселях мира», y растёт вниз,
 * экран показывает 960×540 таких пикселей.
 */
export const SIM = {
  /** Шаг симуляции, с: физика детерминирована и одинакова в игре и в боте. */
  dt: 1 / 120,
  /** Скорость бега по умолчанию, px/с (уровень может переопределить). */
  speed: 290,
  /** Хитбокс худого кота; с весом он растёт (см. physics.size). */
  catW: 38,
  catH: 28,
  /** Во сколько раз вырастает кот при весе 100%. */
  grow: 0.5,
  coyote: 0.1,
  jumpBuffer: 0.14,
  /** Начальная скорость прыжка: [лёгкий, тяжёлый]. Тяжёлый прыгает ниже, но не беспомощен. */
  jumpV: [860, 720] as const,
  gravity: [2000, 2300] as const,
  /** Прыжок в воздухе ぴょん: стоит веса и даётся один раз до приземления. */
  airCost: 0.08,
  airV: 0.92,
  /** Отпустил кнопку — скорость подъёма обрезается до этой (короткий прыжок). */
  jumpCutV: 240,
  fastFallV: 1150,
  maxFallV: 1400,
  /** Вес, который сгорает за секунду бега по крыше. */
  burnPerSec: 0.003,
  /** Футон подбрасывает тем выше, чем тяжелее кот. */
  futonV: [600, 1200] as const,
  /** Подъёмная сила ビル風 (в уровнях не используется, оставлена для совместимости). */
  ventLift: 3667,
  ventMaxUp: 520,
  /** Ступенька, на которую кот забегает без прыжка. */
  stepUp: 8,
  deathY: 660,
  ceilingY: 36,
  itemRadius: 16,
  /** Очки за разбитый ящик. */
  cratePoints: 3,
} as const;

export const ITEM = {
  kibble: { weight: 0.025, points: 1 },
  can: { weight: 0.12, points: 5 },
  /** ねこじゃらし: наигрался — сбросил вес, и это тоже весело. */
  toy: { weight: -0.15, points: 2 },
  /** 鈴: колокольчики для третьей звезды. */
  bell: { weight: 0, points: 0 },
} as const;

const lerp = (r: readonly [number, number], w: number) => r[0] + (r[1] - r[0]) * w;

export const physics = {
  size: (w: number) => 1 + SIM.grow * w,
  halfW: (w: number) => (SIM.catW * physics.size(w)) / 2,
  height: (w: number) => SIM.catH * physics.size(w),
  jumpV: (w: number) => lerp(SIM.jumpV, w),
  gravity: (w: number) => lerp(SIM.gravity, w),
  futonV: (w: number) => lerp(SIM.futonV, w),
  jumpHeight: (w: number) => physics.jumpV(w) ** 2 / (2 * physics.gravity(w)),
  futonHeight: (w: number) => physics.futonV(w) ** 2 / (2 * physics.gravity(w)),
  /** Вес, при котором ビル風 перестаёт поднимать. */
  ventLimit: () => (SIM.ventLift - SIM.gravity[0]) / (SIM.ventLift + SIM.gravity[1] - SIM.gravity[0]),
};

/**
 * Все числа физики в одном месте. Мир в «пикселях мира», y растёт вниз,
 * экран показывает 960×540 таких пикселей.
 */
export const SIM = {
  /** Шаг симуляции, с: физика детерминирована и одинакова в игре и в боте. */
  dt: 1 / 120,
  /** Скорость бега по умолчанию, px/с (уровень может переопределить). */
  speed: 300,
  /** Хитбокс кота одинаков при любом весе: вес меняет физику, а не размер. */
  catW: 40,
  catH: 30,
  coyote: 0.08,
  jumpBuffer: 0.12,
  /** Начальная скорость прыжка: [лёгкий, тяжёлый]. */
  jumpV: [880, 560] as const,
  gravity: [2000, 2500] as const,
  /** Отпустил кнопку — скорость подъёма обрезается до этой (короткий прыжок). */
  jumpCutV: 240,
  fastFallV: 1150,
  maxFallV: 1400,
  /** Вес, который сгорает за секунду бега по крыше. */
  burnPerSec: 0.006,
  /** Футон подбрасывает тем выше, чем тяжелее кот. */
  futonV: [560, 1250] as const,
  /** Подъёмная сила ビル風: при весе 40% уравновешивает гравитацию. */
  ventLift: 3667,
  ventMaxUp: 520,
  /** Ступенька, на которую кот забегает без прыжка. */
  stepUp: 8,
  deathY: 660,
  ceilingY: 36,
  itemRadius: 16,
} as const;

export const ITEM = {
  kibble: { weight: 0.02, points: 1 },
  can: { weight: 0.12, points: 5 },
  toy: { weight: -0.2, points: 0 },
} as const;

const lerp = (r: readonly [number, number], w: number) => r[0] + (r[1] - r[0]) * w;

export const physics = {
  jumpV: (w: number) => lerp(SIM.jumpV, w),
  gravity: (w: number) => lerp(SIM.gravity, w),
  futonV: (w: number) => lerp(SIM.futonV, w),
  jumpHeight: (w: number) => physics.jumpV(w) ** 2 / (2 * physics.gravity(w)),
  futonHeight: (w: number) => physics.futonV(w) ** 2 / (2 * physics.gravity(w)),
  /** Вес, при котором ビル風 перестаёт поднимать. */
  ventLimit: () => (SIM.ventLift - SIM.gravity[0]) / (SIM.ventLift + SIM.gravity[1] - SIM.gravity[0]),
};

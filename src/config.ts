export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Палитра из референса. */
export const PALETTE = {
  ink: 0x111111,
  charcoal: 0x333333,
  gray: 0x777777,
  stone: 0xbeb8ad,
  sand: 0xe6e1d7,
  paper: 0xf6f4ee,
} as const;

export const CSS = {
  ink: '#111111',
  charcoal: '#333333',
  gray: '#777777',
  stone: '#BEB8AD',
  sand: '#E6E1D7',
  paper: '#F6F4EE',
} as const;

export const RUN = {
  catX: 220,
  /** Пикселей на «метр» для счётчика дистанции. */
  pxPerMeter: 50,
  /** Дистанция до финиша, м. */
  goalMeters: 600,
  /** Время, когда ещё можно прыгнуть после схода с крыши, мс. */
  coyoteMs: 90,
  /** Нажатие прыжка чуть раньше приземления запоминается, мс. */
  jumpBufferMs: 120,
} as const;

/** Параметры, которые плавно меняются от лёгкого (0) к тяжёлому (1) коту. */
export const WEIGHT = {
  start: 0.1,
  /** Сколько веса «сгорает» за секунду бега. */
  burnPerSec: 0.015,
  kibble: 0.018,
  can: 0.14,
  speed: [290, 230] as const,
  jumpVelocity: [860, 560] as const,
  gravity: [1900, 2500] as const,
  fastFallVelocity: 1100,
  /** Вес, под который рассчитаны самые сложные промежутки: тяжелее — можно не допрыгнуть. */
  designWeight: 0.55,
} as const;

export const SCORE = { kibble: 1, can: 5 } as const;

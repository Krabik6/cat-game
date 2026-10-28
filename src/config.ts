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
  /** Скорость прокрутки мира, px/с. */
  baseSpeed: 260,
  catX: 220,
  groundY: 440,
  gravity: 1800,
} as const;

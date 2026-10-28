/** Логический экран в пикселях мира; рендер идёт в 2× для чёткости. */
export const VIEW_W = 960;
export const VIEW_H = 540;
/** ?rs=1 — упрощённый рендер для слабых устройств и тестов. */
export const RENDER_SCALE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('rs') === '1' ? 1 : 2;

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

export const FONT = '"Zen Kaku Gothic New", "Hiragino Sans", "Noto Sans JP", "Helvetica Neue", Arial, sans-serif';
export const FONT_LATIN = '"Jost", "Futura", "Helvetica Neue", Arial, sans-serif';

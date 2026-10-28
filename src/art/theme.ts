/** Цветовые темы мира: дневная из референса и ночная для «夜の街». */
export interface Theme {
  name: 'day' | 'night';
  sky: string;
  layers: { body: string; window: string; lit?: string }[];
  roof: { ink: number; stone: number; charcoal: number; window: number; windowStone: number; rail: number; lit?: number };
  /** Провода, столбы и мосты: должны читаться на фоне неба. */
  line: number;
  text: string;
  sub: string;
}

export const DAY: Theme = {
  name: 'day',
  sky: '#F6F4EE',
  layers: [
    { body: '#E6E1D7', window: '#DAD4C8' },
    { body: '#CFC9BD', window: '#B5AFA3' },
    { body: '#A9A499', window: '#8E897F' },
    { body: '#777777', window: '#5C5C5C' },
  ],
  roof: { ink: 0x111111, stone: 0xbeb8ad, charcoal: 0x333333, window: 0x262626, windowStone: 0x111111, rail: 0x111111 },
  line: 0x111111,
  text: '#111111',
  sub: '#777777',
};

export const NIGHT: Theme = {
  name: 'night',
  sky: '#1A1A1A',
  layers: [
    { body: '#242424', window: '#2C2C2C', lit: '#4A4740' },
    { body: '#2E2E2E', window: '#363636', lit: '#7A756A' },
    { body: '#3A3A3A', window: '#2A2A2A', lit: '#BEB8AD' },
    { body: '#474747', window: '#2F2F2F', lit: '#E6E1D7' },
  ],
  roof: { ink: 0x0b0b0b, stone: 0x5a5650, charcoal: 0x262626, window: 0x1c1c1c, windowStone: 0xe6e1d7, rail: 0x050505, lit: 0xe6e1d7 },
  line: 0xbeb8ad,
  text: '#F6F4EE',
  sub: '#BEB8AD',
};

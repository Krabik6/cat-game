import Phaser from 'phaser';
import { RENDER_SCALE } from '../config';
import type { Roof } from '../sim/types';
import type { Theme } from './theme';

/** Ширина бесшовного тайла города, единицы мира. */
export const SKY_TILE = 1400;
export const SKY_H = 420;

type Ctx = CanvasRenderingContext2D;

/** Простой детерминированный ГПСЧ: город одинаков при каждом запуске. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

interface LayerCfg {
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  windows: number;
  props: number;
}

const LAYER_CFG: LayerCfg[] = [
  { minH: 200, maxH: 360, minW: 60, maxW: 130, windows: 0.55, props: 0.1 },
  { minH: 150, maxH: 300, minW: 50, maxW: 120, windows: 0.7, props: 0.25 },
  { minH: 110, maxH: 240, minW: 50, maxW: 110, windows: 0.8, props: 0.3 },
  { minH: 70, maxH: 170, minW: 60, maxW: 130, windows: 0.85, props: 0.3 },
];

function windowGrid(ctx: Ctx, r: () => number, x: number, top: number, w: number, h: number, color: string, lit?: string) {
  const kind = r();
  const cell = kind < 0.5 ? 9 : 12;
  const gap = kind < 0.5 ? 3 : 4;
  const cols = Math.max(1, Math.floor((w - 14) / cell));
  const rows = Math.max(1, Math.floor(Math.min(h - 24, 160) / (cell + 2)));
  const gx = x + (w - cols * cell) / 2;
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = lit && r() < 0.28 ? lit : color;
      if (kind > 0.8) ctx.fillRect(gx + c * cell, top + 14 + row * (cell + 2), cell - gap, 3);
      else ctx.fillRect(gx + c * cell, top + 14 + row * (cell + 2), cell - gap, cell - gap);
    }
  }
}

function waterTower(ctx: Ctx, x: number, top: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 3, top - 12, 2, 12);
  ctx.fillRect(x + 13, top - 12, 2, 12);
  ctx.fillRect(x - 6, top - 40, 24, 28);
  ctx.beginPath();
  ctx.arc(x + 6, top - 40, 12, Math.PI, 0);
  ctx.fill();
}

function antenna(ctx: Ctx, x: number, top: number, color: string, r: () => number) {
  ctx.fillStyle = color;
  const h = 20 + r() * 36;
  ctx.fillRect(x, top - h, 2, h);
  ctx.fillRect(x - 6, top - h + 8, 14, 1.5);
  if (r() < 0.5) ctx.fillRect(x - 4, top - h + 16, 10, 1.5);
}

/** Вертикальная вывеска «むちねこ» — как на референсе. */
function sign(ctx: Ctx, x: number, top: number, theme: Theme) {
  const w = 30;
  const h = 116;
  ctx.fillStyle = theme.name === 'day' ? '#F6F4EE' : '#E6E1D7';
  ctx.fillRect(x, top, w, h);
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3.5, top + 3.5, w - 7, h - 7);
  ctx.fillStyle = '#111111';
  ctx.font = '700 18px "Zen Kaku Gothic New", "Hiragino Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ['む', 'ち', 'ね', 'こ'].forEach((ch, i) => ctx.fillText(ch, x + w / 2, top + 20 + i * 25.5));
}

function drawLayer(ctx: Ctx, theme: Theme, index: number, seed: number) {
  const cfg = LAYER_CFG[index];
  const style = theme.layers[index];
  const r = rng(seed);
  let x = -10;
  let signDone = index !== 2;
  while (x < SKY_TILE) {
    let w = cfg.minW + r() * (cfg.maxW - cfg.minW);
    if (SKY_TILE - x - w < cfg.minW) w = SKY_TILE - x + 10;
    const h = cfg.minH + r() * (cfg.maxH - cfg.minH);
    const top = SKY_H - h;
    ctx.fillStyle = style.body;
    ctx.fillRect(x, top, w - 3, h);
    // Уступ: верхний этаж уже основного.
    if (r() < 0.3 && w > 70) ctx.fillRect(x + w * 0.2, top - 18, w * 0.5, 18);
    if (r() < cfg.windows && w > 40) windowGrid(ctx, r, x, top, w - 3, h, style.window, style.lit);
    const p = r();
    if (p < cfg.props * 0.4) waterTower(ctx, x + w * 0.3, top, style.body);
    else if (p < cfg.props) antenna(ctx, x + w * (0.2 + r() * 0.6), top, style.body, r);
    if (!signDone && w > 70 && h > 150 && x > 500) {
      sign(ctx, x + w - 44, top + 24, theme);
      signDone = true;
    }
    x += w;
  }
}

/** Текстуры четырёх слоёв города для темы, в 2× разрешении. */
export function createSkyline(scene: Phaser.Scene, theme: Theme) {
  const keys: string[] = [];
  theme.layers.forEach((_, i) => {
    const key = `sky-${theme.name}-${i}`;
    keys.push(key);
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, SKY_TILE * RENDER_SCALE, SKY_H * RENDER_SCALE)!;
    const ctx = tex.getContext();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    drawLayer(ctx, theme, i, 1000 + i * 77);
    tex.refresh();
  });
  return keys;
}

/**
 * Крыша-платформа: верх — поверхность бега; ниже фасад до низа экрана.
 * Рисуется векторно в Graphics, координаты локальные от верхнего левого угла.
 */
export function drawRoof(g: Phaser.GameObjects.Graphics, roof: Roof, theme: Theme, height: number) {
  const r = rng(roof.seed + 11);
  const t = theme.roof;
  const w = roof.w;
  const body = roof.style === 'stone' ? t.stone : roof.style === 'charcoal' ? t.charcoal : t.ink;
  const win = roof.style === 'stone' ? t.windowStone : t.window;

  g.fillStyle(body).fillRect(0, 0, w, height);
  // Парапет.
  g.fillStyle(t.ink).fillRect(-3, 0, w + 6, 9);
  g.fillStyle(roof.style === 'ink' ? t.charcoal : t.ink).fillRect(0, 9, w, 3);

  // Окна фасада: сетка с переплётами.
  const cell = roof.style === 'stone' ? 26 : 30;
  const cols = Math.floor((w - 28) / cell);
  const ox = (w - cols * cell) / 2;
  for (let row = 0; row < 8; row++) {
    for (let c = 0; c < cols; c++) {
      if (r() < 0.12) continue;
      const x = ox + c * cell + 4;
      const y = 32 + row * 40;
      const lit = t.lit !== undefined && r() < 0.35;
      g.fillStyle(lit ? t.lit! : win).fillRect(x, y, cell - 10, 22);
      if (roof.style === 'stone' && !lit) {
        g.fillStyle(body).fillRect(x + (cell - 10) / 2 - 1, y, 2, 22);
      }
    }
  }

  // Перила.
  g.fillStyle(t.rail);
  g.fillRect(4, -17, w - 8, 2.5);
  g.fillRect(4, -9, w - 8, 1.5);
  for (let x = 6; x < w - 4; x += 22) g.fillRect(x, -17, 2.5, 17);
}

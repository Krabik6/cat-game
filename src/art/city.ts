import Phaser from 'phaser';
import { CSS, PALETTE } from '../config';

export const SKYLINE_W = 1280;
export const SKYLINE_H = 360;

type Ctx = CanvasRenderingContext2D;

interface LayerStyle {
  body: string;
  window: string;
  minH: number;
  maxH: number;
  windowChance: number;
  extras: boolean;
}

const LAYERS: LayerStyle[] = [
  { body: CSS.sand, window: '#D8D2C6', minH: 140, maxH: 300, windowChance: 0.5, extras: false },
  { body: CSS.stone, window: '#A8A296', minH: 90, maxH: 230, windowChance: 0.7, extras: true },
  { body: CSS.gray, window: '#5E5E5E', minH: 50, maxH: 170, windowChance: 0.8, extras: true },
];

function windows(ctx: Ctx, x: number, top: number, w: number, color: string) {
  const cols = Math.max(2, Math.floor((w - 12) / 12));
  const rows = Phaser.Math.Between(2, 5);
  const cell = 10;
  const gx = x + (w - cols * cell) / 2;
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ctx.fillRect(gx + c * cell, top + 14 + r * cell, cell - 3, cell - 3);
}

function waterTower(ctx: Ctx, x: number, top: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 12, top - 30, 24, 26);
  ctx.beginPath();
  ctx.arc(x, top - 30, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 10, top - 6, 3, 6);
  ctx.fillRect(x + 7, top - 6, 3, 6);
}

/** Вертикальная вывеска «むちねこ», как на референсе. */
function sign(ctx: Ctx, x: number, top: number) {
  const w = 30;
  const h = 112;
  ctx.fillStyle = CSS.paper;
  ctx.fillRect(x, top, w, h);
  ctx.strokeStyle = CSS.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, top + 3, w - 6, h - 6);
  ctx.fillStyle = CSS.ink;
  ctx.font = 'bold 18px "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ['む', 'ち', 'ね', 'こ'].forEach((ch, i) => ctx.fillText(ch, x + w / 2, top + 18 + i * 25));
}

function drawLayer(ctx: Ctx, style: LayerStyle, index: number) {
  let x = 0;
  let signPlaced = index !== 2;
  while (x < SKYLINE_W) {
    let w = Phaser.Math.Between(50, 130);
    if (SKYLINE_W - x < 70) w = SKYLINE_W - x; // последний дом закрывает край, чтобы тайл был бесшовным
    const h = Phaser.Math.Between(style.minH, style.maxH);
    const top = SKYLINE_H - h;
    ctx.fillStyle = style.body;
    ctx.fillRect(x, top, w - 4, h);
    if (Math.random() < style.windowChance && w > 40) windows(ctx, x, top, w - 4, style.window);
    if (style.extras) {
      const r = Math.random();
      if (r < 0.12) waterTower(ctx, x + w / 2, top, style.body);
      else if (r < 0.3) ctx.fillRect(x + w * 0.3, top - Phaser.Math.Between(16, 40), 3, 40);
    }
    if (!signPlaced && w > 70 && h > 140 && x > 300) {
      sign(ctx, x + w - 46, top + 30);
      signPlaced = true;
    }
    x += w;
  }
}

export function createSkylineTextures(scene: Phaser.Scene) {
  LAYERS.forEach((style, i) => {
    const key = `skyline-${i}`;
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, SKYLINE_W, SKYLINE_H)!;
    drawLayer(tex.getContext(), style, i);
    tex.refresh();
  });
}

export type RoofStyle = 'ink' | 'concrete';

/** Рисует крышу-платформу в локальных координатах графики: верх — поверхность, по которой бежит кот. */
export function drawRoof(g: Phaser.GameObjects.Graphics, w: number, h: number, style: RoofStyle, goal = false) {
  const body = style === 'ink' ? PALETTE.ink : PALETTE.charcoal;
  const win = style === 'ink' ? PALETTE.charcoal : PALETTE.gray;
  g.fillStyle(body).fillRect(0, 0, w, h);
  // Парапет и тёмная полоса под ним.
  g.fillStyle(PALETTE.ink).fillRect(-4, 0, w + 8, 8);
  g.fillStyle(win).fillRect(0, 8, w, 3);

  // Ограждение на крыше: стойки и поручень.
  g.fillStyle(PALETTE.charcoal);
  g.fillRect(6, -16, w - 12, 2.5);
  for (let x = 8; x < w - 6; x += 26) g.fillRect(x, -16, 2.5, 16);

  // Сетка окон фасада.
  const cols = Math.floor((w - 40) / 30);
  g.fillStyle(win);
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 5 === 3) continue;
      g.fillRect(24 + c * 30, 34 + r * 34, 16, 20);
    }
  }
  // Вентиляционная будка на широких крышах.
  if (w > 380 && !goal) {
    g.fillStyle(PALETTE.charcoal).fillRect(w - 110, -30, 52, 30);
    g.fillStyle(PALETTE.gray).fillRect(w - 102, -24, 36, 4).fillRect(w - 102, -16, 36, 4);
  }
  if (goal) {
    // Финишный флаг.
    g.fillStyle(PALETTE.ink).fillRect(240, -90, 4, 90);
    g.fillStyle(PALETTE.paper).fillRect(244, -90, 46, 30);
    g.lineStyle(2, PALETTE.ink).strokeRect(244, -90, 46, 30);
    g.fillStyle(PALETTE.ink);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) g.fillRect(246 + i * 11, -88 + j * 13, 11, 13);
  }
}

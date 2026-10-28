import Phaser from 'phaser';
import { CSS, FONT, FONT_LATIN, RENDER_SCALE, VIEW_H, VIEW_W } from '../config';

/** Камера сцены: мир 960×540, рендер в 2×. */
export function setupCamera(scene: Phaser.Scene, bg?: string) {
  const cam = scene.cameras.main;
  cam.setZoom(RENDER_SCALE).centerOn(VIEW_W / 2, VIEW_H / 2);
  if (bg) cam.setBackgroundColor(bg);
  return cam;
}

export interface TextOpts {
  size?: number;
  color?: string;
  latin?: boolean;
  weight?: number;
  spacing?: number;
  align?: 'left' | 'center' | 'right';
  origin?: [number, number];
}

/** Текст с удвоенным разрешением, чтобы не мылился при зуме камеры. */
export function txt(scene: Phaser.Scene, x: number, y: number, text: string, o: TextOpts = {}) {
  const t = scene.add.text(x, y, text, {
    fontFamily: o.latin ? FONT_LATIN : FONT,
    fontSize: `${o.size ?? 16}px`,
    fontStyle: String(o.weight ?? (o.latin ? 500 : 500)),
    color: o.color ?? CSS.ink,
    align: o.align ?? 'left',
  });
  t.setResolution(RENDER_SCALE * (window.devicePixelRatio > 2 ? 1.5 : 1));
  if (o.spacing) t.setLetterSpacing(o.spacing);
  if (o.origin) t.setOrigin(...o.origin);
  return t;
}

/** Кнопка-надпись в стиле референса: текст в разрядку и тонкая рамка-пилюля. */
export function pillButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  o: { w?: number; filled?: boolean; color?: string; fill?: number; line?: number } = {},
) {
  const w = o.w ?? 150;
  const h = 34;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (hover: boolean) => {
    g.clear();
    if (o.filled || hover) g.fillStyle(o.fill ?? 0x111111, o.filled ? 1 : 0.06).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.lineStyle(1.4, o.line ?? 0x111111).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  };
  draw(false);
  const t = txt(scene, 0, 1, label, { size: 13, latin: true, spacing: 3, color: o.color ?? (o.filled ? CSS.paper : CSS.ink), origin: [0.5, 0.5] });
  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => draw(true));
  zone.on('pointerout', () => draw(false));
  zone.on('pointerdown', (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e.stopPropagation();
    onClick();
  });
  c.add([g, t, zone]);
  return c;
}

/** Звёздочка: заполненная или контур. */
export function drawStar(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, filled: boolean, color = 0x111111) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
  }
  if (filled) g.fillStyle(color).fillPoints(pts, true);
  g.lineStyle(1.4, color).strokePoints(pts, true, true);
}

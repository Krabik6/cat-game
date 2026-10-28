import Phaser from 'phaser';
import { CSS, VIEW_W } from '../config';
import { LEVELS } from '../levels';
import { progress } from '../systems/Progress';
import { sound } from '../systems/Sound';
import { drawStar, pillButton, setupCamera, txt } from '../ui/kit';

const MECHANIC: Record<string, string> = {
  l1: 'JUMP · GROW',
  l2: 'AIR JUMP',
  l3: 'SMASH ≥',
  l4: 'FUTONS ≥',
  l5: 'WIRES ≤',
  l6: 'SCALE ≥',
  l7: 'ALL · FAST',
  l8: 'ALL',
};

/** Выбор уровня: 8 этапов и бесконечный режим, звёзды за каждый. */
export class SelectScene extends Phaser.Scene {
  constructor() {
    super('Select');
  }

  create() {
    setupCamera(this, CSS.paper);
    txt(this, 60, 40, 'STAGE SELECT', { size: 12, latin: true, spacing: 6 });
    txt(this, 60, 62, 'ステージ', { size: 26 });
    const total = progress.totalStars();
    const g0 = this.add.graphics();
    drawStar(g0, VIEW_W - 120, 62, 9, true);
    txt(this, VIEW_W - 104, 62, `${total} / ${LEVELS.length * 3}`, { size: 14, latin: true, spacing: 1, origin: [0, 0.5] });

    const levels = LEVELS.map((make) => make());
    const ids = levels.map((l) => l.id);
    const cw = 196;
    const ch = 132;
    const gap = 18;
    const ox = (VIEW_W - (cw * 4 + gap * 3)) / 2;
    levels.forEach((lv, i) => {
      const x = ox + (i % 4) * (cw + gap);
      const y = 112 + Math.floor(i / 4) * (ch + gap);
      const open = progress.unlocked(i, ids);
      this.card(x, y, cw, ch, lv.index, lv.name, lv.nameEn, MECHANIC[lv.id] ?? '', open, progress.get(lv.id)?.stars, !!lv.night, () =>
        this.start(i),
      );
    });

    const endlessOpen = progress.unlocked(4, ids);
    const ey = 112 + 2 * (ch + gap);
    const g = this.add.graphics();
    g.lineStyle(1.4, endlessOpen ? 0x111111 : 0xbeb8ad).strokeRoundedRect(ox, ey, cw * 2 + gap, 52, 6);
    txt(this, ox + 20, ey + 26, 'どこまでも', { size: 17, color: endlessOpen ? CSS.ink : CSS.stone, origin: [0, 0.5] });
    txt(this, ox + 132, ey + 27, 'ENDLESS', { size: 11, latin: true, spacing: 4, color: endlessOpen ? CSS.charcoal : CSS.stone, origin: [0, 0.5] });
    txt(this, ox + cw * 2 + gap - 18, ey + 27, endlessOpen ? `BEST ${progress.endlessBest()} m` : 'STAGE 4 で解放', {
      size: 11,
      latin: endlessOpen,
      spacing: 2,
      color: CSS.gray,
      origin: [1, 0.5],
    });
    if (endlessOpen) {
      this.add
        .zone(ox, ey, cw * 2 + gap, 52)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.start('endless'));
    }

    pillButton(this, VIEW_W - ox - 75, ey + 26, 'TITLE', () => this.scene.start('Title'), { w: 150 });
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('Title'));
  }

  private card(
    x: number,
    y: number,
    w: number,
    h: number,
    index: number,
    name: string,
    nameEn: string,
    mech: string,
    open: boolean,
    stars: [boolean, boolean, boolean] | undefined,
    night: boolean,
    onClick: () => void,
  ) {
    const g = this.add.graphics();
    const draw = (hover: boolean) => {
      g.clear();
      if (night && open) g.fillStyle(0x1a1a1a).fillRoundedRect(x, y, w, h, 6);
      else if (hover) g.fillStyle(0x111111, 0.05).fillRoundedRect(x, y, w, h, 6);
      g.lineStyle(1.4, open ? 0x111111 : 0xbeb8ad).strokeRoundedRect(x, y, w, h, 6);
      for (let i = 0; i < 3; i++) drawStar(g, x + w - 62 + i * 20, y + h - 22, 7, !!stars?.[i], open ? (night ? 0xf6f4ee : 0x111111) : 0xbeb8ad);
    };
    draw(false);
    const fg = !open ? CSS.stone : night ? CSS.paper : CSS.ink;
    const sub = !open ? CSS.stone : night ? CSS.stone : CSS.gray;
    txt(this, x + 16, y + 14, String(index).padStart(2, '0'), { size: 26, latin: true, weight: 400, color: fg });
    txt(this, x + 16, y + 56, open ? name : '？？？', { size: 17, color: fg });
    txt(this, x + 16, y + 82, open ? nameEn : 'LOCKED', { size: 9.5, latin: true, spacing: 3, color: sub });
    txt(this, x + 16, y + h - 22, open ? mech : '', { size: 9, latin: true, spacing: 2, color: sub, origin: [0, 0.5] });
    if (!open) return;
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => draw(false));
    zone.on('pointerdown', onClick);
  }

  private start(level: number | 'endless') {
    sound.unlock();
    sound.click();
    this.scene.start('Game', { level });
  }
}

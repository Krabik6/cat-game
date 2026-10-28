import Phaser from 'phaser';
import { catKey } from '../art/cat';
import { CSS, VIEW_W } from '../config';
import { sound } from '../systems/Sound';
import { pillButton, setupCamera, txt } from '../ui/kit';

/** Титул в духе концепт-листа из референса: название, концепция, состояния кота. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    setupCamera(this, CSS.paper);
    const inv = 0.5;

    txt(this, 60, 54, 'むちねこ', { size: 64, weight: 500 });
    txt(this, 64, 136, 'MUCHI  NEKO', { size: 12, latin: true, spacing: 9, color: CSS.charcoal });
    txt(this, 62, 168, '食べるほど、強くなる。', { size: 18, spacing: 2 });
    this.add.rectangle(62, 214, 36, 2, 0x111111).setOrigin(0);

    txt(this, VIEW_W - 320, 62, 'CONCEPT', { size: 12, latin: true, spacing: 5 });
    ['• 食べるほど、大きく強くなる。', '• 重さで、箱も橋も味方になる。', '• 空中ぴょんで、体重を使う。'].forEach((l, i) =>
      txt(this, VIEW_W - 320, 92 + i * 26, l, { size: 14, spacing: 2, color: CSS.charcoal }),
    );

    // CAT STATE: три кота от лёгкого к тяжёлому, как на референсе.
    const baseY = 380;
    txt(this, 60, 262, 'CAT STATE', { size: 11, latin: true, spacing: 5 });
    const states: [number, string][] = [
      [0, 'ちび'],
      [0.5, 'ふつう'],
      [1, 'むちむち'],
    ];
    states.forEach(([w, label], i) => {
      const x = 110 + i * 150;
      const k = inv * (0.85 + w * 0.45);
      const cat = this.add.image(x, baseY, catKey(w, 'sit')).setScale(k).setOrigin(0.46, 0.92);
      this.tweens.add({ targets: cat, scaleY: k * 1.03, duration: 900 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      txt(this, x, baseY + 22, label, { size: 13, origin: [0.5, 0] });
      if (i < 2) txt(this, x + 75, baseY - 30, '→', { size: 18, latin: true, origin: [0.5, 0.5] });
    });
    this.add.rectangle(540, 262, 1.2, 160, 0xbeb8ad).setOrigin(0);

    txt(this, 580, 262, 'ITEMS', { size: 11, latin: true, spacing: 5 });
    const items: [string, string, string][] = [
      ['kibble', 'カリカリ', '+2.5%'],
      ['can', 'ねこ缶', '+12%'],
      ['toy', 'ねこじゃらし', '−15%'],
      ['bell', '鈴', '★'],
    ];
    items.forEach(([key, label, val], i) => {
      const x = 612 + i * 92;
      this.add.image(x, baseY - 26, key).setScale(inv * 1.5);
      txt(this, x, baseY + 22, label, { size: 12, origin: [0.5, 0] });
      txt(this, x, baseY + 42, val, { size: 11, latin: true, spacing: 1, color: CSS.gray, origin: [0.5, 0] });
    });

    const go = () => {
      sound.unlock();
      sound.click();
      this.scene.start('Select');
    };
    pillButton(this, VIEW_W / 2, 486, 'START', go, { w: 200, filled: true });
    const soundBtn = txt(this, VIEW_W - 44, 486, '', { size: 11, latin: true, spacing: 3, color: CSS.gray, origin: [1, 0.5] })
      .setPadding(10)
      .setInteractive({ useHandCursor: true });
    const label = () => soundBtn.setText(`SOUND ${sound.muted ? 'OFF' : 'ON'}`);
    label();
    soundBtn.on('pointerdown', (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      sound.toggleMute();
      label();
    });
    this.input.keyboard!.once('keydown-SPACE', go);
    this.input.keyboard!.once('keydown-ENTER', go);
  }
}

import Phaser from 'phaser';
import { CAT_FRAME, CAT_SCALE } from '../art/cat';
import { SKYLINE_H } from '../art/city';
import { CSS, GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../config';
import { loadBest } from '../systems/Best';
import { sound } from '../systems/Sound';
import { FONT } from './UIScene';

/** Титульный экран в духе концепт-листа из референса. */
export class MenuScene extends Phaser.Scene {
  private layers: Phaser.GameObjects.TileSprite[] = [];

  constructor() {
    super('Menu');
  }

  create() {
    this.layers = [0, 1, 2].map((i) =>
      this.add
        .tileSprite(0, GAME_HEIGHT - SKYLINE_H + 40 - i * 10, GAME_WIDTH, SKYLINE_H, `skyline-${i}`)
        .setOrigin(0)
        .setAlpha(0.55),
    );
    this.add.rectangle(0, 440, GAME_WIDTH, 100, PALETTE.ink).setOrigin(0);
    this.add.sprite(GAME_WIDTH / 2 + 260, 440 - (CAT_FRAME.feetY - CAT_FRAME.h / 2) * CAT_SCALE, 'cat-normal-run0').play('run-normal');

    this.add.text(64, 70, 'むちねこ', { fontFamily: FONT, fontSize: '72px', color: CSS.ink });
    this.add.text(68, 166, 'MUCHI  NEKO', { fontFamily: FONT, fontSize: '14px', color: CSS.charcoal }).setLetterSpacing(8);
    this.add.text(66, 200, '食べたい。でも、飛べなくなる。', { fontFamily: FONT, fontSize: '20px', color: CSS.ink }).setLetterSpacing(2);
    this.add.rectangle(66, 248, 40, 2, PALETTE.ink).setOrigin(0);

    const concept = ['• 食べるほど、重くなる。', '• 走る、跳ぶ、落ちる。', '• むちむちでも、ゴールをめざす。'];
    this.add.text(GAME_WIDTH - 330, 74, 'CONCEPT', { fontFamily: FONT, fontSize: '13px', color: CSS.ink }).setLetterSpacing(4);
    concept.forEach((line, i) =>
      this.add.text(GAME_WIDTH - 330, 104 + i * 28, line, { fontFamily: FONT, fontSize: '15px', color: CSS.charcoal }).setLetterSpacing(2),
    );

    const best = loadBest();
    this.add
      .text(66, 280, `BEST  × ${best.score}     ${best.meters} m`, { fontFamily: FONT, fontSize: '14px', color: CSS.gray })
      .setLetterSpacing(3);

    const start = this.add
      .text(GAME_WIDTH / 2, 490, 'TAP TO START', { fontFamily: FONT, fontSize: '18px', color: CSS.paper })
      .setOrigin(0.5)
      .setLetterSpacing(6);
    this.tweens.add({ targets: start, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

    const soundLabel = () => `SOUND ${sound.muted ? 'OFF' : 'ON'}`;
    const soundBtn = this.add
      .text(GAME_WIDTH - 40, 490, soundLabel(), { fontFamily: FONT, fontSize: '13px', color: CSS.stone })
      .setOrigin(1, 0.5)
      .setLetterSpacing(3)
      .setPadding(12)
      .setInteractive({ useHandCursor: true });
    const toggleSound = () => {
      sound.toggleMute();
      soundBtn.setText(soundLabel());
    };
    soundBtn.on('pointerdown', (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      toggleSound();
    });

    const go = () => {
      sound.unlock();
      this.scene.start('Game');
    };
    this.input.on('pointerdown', go);
    this.input.keyboard!.on('keydown-SPACE', go);
    this.input.keyboard!.on('keydown-ENTER', go);
    this.input.keyboard!.on('keydown-M', toggleSound);
  }

  update(_t: number, delta: number) {
    this.layers.forEach((l, i) => (l.tilePositionX += delta * 0.02 * (1 + i)));
  }
}

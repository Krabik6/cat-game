import Phaser from 'phaser';
import { PALETTE } from '../config';

/** Генерирует временные текстуры; настоящая графика появится на этапе 4. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const g = this.make.graphics({}, false);

    // Кот-заглушка: белое тело с чёрным пятном и ушами.
    g.fillStyle(PALETTE.ink).fillRoundedRect(0, 8, 64, 40, 18);
    g.fillStyle(PALETTE.paper).fillRoundedRect(3, 11, 58, 34, 15);
    g.fillStyle(PALETTE.ink).fillEllipse(22, 22, 26, 16);
    g.fillStyle(PALETTE.ink).fillTriangle(42, 12, 47, 0, 52, 12).fillTriangle(52, 12, 58, 1, 62, 14);
    g.generateTexture('cat', 64, 48).clear();

    // カリカリ: три коричнево-серых зёрнышка.
    g.fillStyle(PALETTE.charcoal).fillCircle(6, 14, 6).fillCircle(18, 14, 6).fillCircle(12, 5, 5);
    g.generateTexture('kibble', 24, 20).clear();

    // ねこ缶: банка с котом на этикетке.
    g.fillStyle(PALETTE.ink).fillRoundedRect(0, 0, 36, 28, 5);
    g.fillStyle(PALETTE.paper).fillRect(4, 7, 28, 14);
    g.fillStyle(PALETTE.ink).fillCircle(18, 15, 4);
    g.generateTexture('can', 36, 28).destroy();

    this.scene.start('Game');
  }
}

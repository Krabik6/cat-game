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

    g.fillStyle(PALETTE.ink).fillRect(0, 0, 32, 32);
    g.generateTexture('block', 32, 32).destroy();

    this.scene.start('Game');
  }
}

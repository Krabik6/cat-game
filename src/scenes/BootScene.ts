import Phaser from 'phaser';
import { catTextures } from '../art/cat';
import { bellNightSvg, bellSvg, canSvg, crateSvg, flagSvg, futonSvg, kibbleSvg, lanternOnSvg, lanternSvg, needleSvg, pigeonSvg, scaleSvg, toySvg } from '../art/props';
import { addSvgTextures } from '../art/svg';
import { CSS } from '../config';
import { setupCamera, txt } from '../ui/kit';

/** Ждёт шрифты, растеризует векторную графику и уходит на титульный экран. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    setupCamera(this, CSS.paper);
    const label = txt(this, 480, 270, 'むちねこ', { size: 22, origin: [0.5, 0.5], color: CSS.gray });
    const fonts = Promise.all([
      document.fonts.load('500 20px "Zen Kaku Gothic New"'),
      document.fonts.load('700 20px "Zen Kaku Gothic New"'),
      document.fonts.load('500 20px "Jost"'),
      document.fonts.load('600 20px "Jost"'),
    ]).catch(() => undefined);
    const timeout = new Promise((r) => setTimeout(r, 2500));

    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillCircle(8, 8, 8);
    g.generateTexture('dot', 16, 16).clear();
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, 4, 56, 2);
    g.generateTexture('streak', 4, 56).destroy();

    Promise.race([fonts, timeout])
      .then(() =>
        addSvgTextures(this, {
          ...catTextures(),
          kibble: kibbleSvg,
          can: canSvg,
          toy: toySvg,
          futon: futonSvg,
          scale: scaleSvg,
          needle: needleSvg,
          flag: flagSvg,
          pigeon: pigeonSvg,
          crate: crateSvg,
          bell: bellSvg,
          bellNight: bellNightSvg,
          lantern: lanternSvg,
          lanternOn: lanternOnSvg,
        }),
      )
      .then(() => {
        label.destroy();
        const start = new URLSearchParams(location.search).get('stage');
        if (start) this.scene.start('Game', { level: start === 'endless' ? 'endless' : +start - 1 });
        else this.scene.start('Title');
      });
  }
}

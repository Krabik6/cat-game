import Phaser from 'phaser';
import { CAT_POSES, CAT_STAGES, catTextures } from '../art/cat';
import { createSkylineTextures } from '../art/city';
import { canSvg, kibbleSvg } from '../art/items';
import { addSvgTextures } from '../art/svg';

/** Растеризует векторную графику в текстуры и заводит анимации. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createSkylineTextures(this);
    addSvgTextures(this, { ...catTextures(), kibble: kibbleSvg, can: canSvg }).then(() => {
      for (const stage of CAT_STAGES) {
        this.anims.create({
          key: `run-${stage}`,
          frames: CAT_POSES.filter((p) => p.startsWith('run')).map((p) => ({ key: `cat-${stage}-${p}` })),
          frameRate: 12,
          repeat: -1,
        });
      }
      const g = this.make.graphics({}, false);
      g.fillStyle(0xffffff).fillCircle(4, 4, 4);
      g.generateTexture('dot', 8, 8).destroy();
      this.scene.start('Game');
    });
  }
}

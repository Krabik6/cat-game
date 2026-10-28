import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, RUN } from '../config';

export class GameScene extends Phaser.Scene {
  private cat!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.GameObjects.TileSprite;
  private skyline: Phaser.GameObjects.TileSprite[] = [];
  private speed: number = RUN.baseSpeed;

  constructor() {
    super('Game');
  }

  create() {
    this.createSkyline();

    this.ground = this.add.tileSprite(0, RUN.groundY, GAME_WIDTH, GAME_HEIGHT - RUN.groundY, 'block').setOrigin(0);
    this.physics.add.existing(this.ground, true);

    this.cat = this.physics.add.sprite(RUN.catX, RUN.groundY - 40, 'cat');
    this.cat.body.setSize(52, 36).setOffset(6, 12);
    this.physics.add.collider(this.cat, this.ground as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType);
  }

  update(_time: number, delta: number) {
    const dx = (this.speed * delta) / 1000;
    this.ground.tilePositionX += dx;
    this.skyline.forEach((layer, i) => (layer.tilePositionX += dx * (0.15 + i * 0.2)));
    // Лёгкое покачивание при беге.
    this.cat.setAngle(Math.sin(this.time.now / 70) * 2);
  }

  /** Временный параллакс-город из прямоугольников палитры. */
  private createSkyline() {
    const layers = [
      { color: PALETTE.sand, minH: 120, maxH: 260 },
      { color: PALETTE.stone, minH: 80, maxH: 200 },
      { color: PALETTE.gray, minH: 40, maxH: 140 },
    ];
    layers.forEach((cfg, i) => {
      const key = `skyline-${i}`;
      const w = 1024;
      const g = this.make.graphics({}, false);
      g.fillStyle(cfg.color);
      for (let x = 0; x < w; ) {
        const bw = Phaser.Math.Between(40, 110);
        const bh = Phaser.Math.Between(cfg.minH, cfg.maxH);
        g.fillRect(x, 300 - bh, bw - 6, bh);
        x += bw;
      }
      g.generateTexture(key, w, 300).destroy();
      this.skyline.push(this.add.tileSprite(0, RUN.groundY - 300, GAME_WIDTH, 300, key).setOrigin(0));
    });
  }
}

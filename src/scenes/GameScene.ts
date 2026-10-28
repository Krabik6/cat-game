import Phaser from 'phaser';
import { CSS, GAME_HEIGHT, GAME_WIDTH, PALETTE, RUN, SCORE, WEIGHT } from '../config';
import { Weight } from '../systems/Weight';
import { ItemKind, LevelGenerator } from '../world/LevelGenerator';

type State = 'running' | 'dead' | 'goal';

export class GameScene extends Phaser.Scene {
  private cat!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private skyline: Phaser.GameObjects.TileSprite[] = [];
  private level!: LevelGenerator;
  private weight = new Weight();
  private state: State = 'running';
  private traveled = 0;
  private score = 0;
  private lastGroundedAt = 0;
  private jumpPressedAt = -Infinity;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  create() {
    this.state = 'running';
    this.traveled = 0;
    this.score = 0;
    this.weight = new Weight();
    this.skyline = [];
    this.createSkyline();

    this.level = new LevelGenerator(this);
    this.level.start();

    this.cat = this.physics.add.sprite(RUN.catX, 380, 'cat');
    this.cat.body.setSize(52, 36).setOffset(6, 12);
    this.physics.add.collider(this.cat, this.level.roofs);
    this.physics.add.overlap(this.cat, this.level.items, (_cat, item) =>
      this.eat(item as Phaser.Physics.Arcade.Image),
    );

    this.setupInput();
    this.debugText = this.add.text(16, 12, '', { fontFamily: 'monospace', fontSize: '16px', color: CSS.ink });
  }

  private setupInput() {
    const press = () => {
      if (this.state !== 'running') return this.scene.restart();
      this.jumpPressedAt = this.time.now;
    };
    const release = () => {
      // Короткое нажатие — низкий прыжок.
      if (this.cat.body.velocity.y < 0) this.cat.body.velocity.y *= 0.45;
    };
    this.input.on('pointerdown', press);
    this.input.on('pointerup', release);
    const kb = this.input.keyboard!;
    for (const key of ['SPACE', 'UP', 'W']) {
      kb.on(`keydown-${key}`, (e: KeyboardEvent) => !e.repeat && press());
      kb.on(`keyup-${key}`, release);
    }
    for (const key of ['DOWN', 'S']) kb.on(`keydown-${key}`, () => this.fastFall());
  }

  update(time: number, delta: number) {
    if (this.state !== 'running') return;
    const dt = delta / 1000;
    const w = this.weight.value;
    const speed = Weight.speed(w);
    const dx = speed * dt;

    this.traveled += dx;
    this.weight.burn(dt);
    this.level.update(dx, speed, this.traveled);
    this.skyline.forEach((layer, i) => (layer.tilePositionX += dx * (0.15 + i * 0.2)));

    const body = this.cat.body;
    body.setGravityY(Weight.gravity(w) - this.physics.world.gravity.y);
    // Кот держится на своей позиции, но стена крыши может его оттолкнуть.
    body.setVelocityX((RUN.catX - this.cat.x) * 4);

    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.lastGroundedAt = time;
    const canJump = time - this.lastGroundedAt <= RUN.coyoteMs;
    if (canJump && time - this.jumpPressedAt <= RUN.jumpBufferMs) {
      body.setVelocityY(-Weight.jumpVelocity(w));
      this.jumpPressedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
    }

    // Временная визуализация веса до появления спрайтов стадий.
    this.cat.setScale(1 + w * 0.45, 1 + w * 0.25);
    this.cat.setAngle(grounded ? Math.sin(time / 70) * 2 : Phaser.Math.Clamp(body.velocity.y / 40, -12, 12));

    if (this.cat.y > this.scale.height + 80 || this.cat.x < -40) this.finish('dead');

    const meters = Math.floor(this.traveled / RUN.pxPerMeter);
    this.debugText.setText(`W ${Math.round(w * 100)}%  ×${this.score}  ${meters}/${RUN.goalMeters}m  ${this.weight.stage}`);
  }

  private fastFall() {
    if (this.state === 'running' && !this.cat.body.blocked.down) {
      this.cat.body.setVelocityY(WEIGHT.fastFallVelocity);
    }
  }

  private eat(item: Phaser.Physics.Arcade.Image) {
    const kind = item.getData('kind') as ItemKind;
    if (item.getData('goal')) return this.finish('goal');
    this.weight.add(kind === 'can' ? WEIGHT.can : WEIGHT.kibble);
    this.score += kind === 'can' ? SCORE.can : SCORE.kibble;
    item.destroy();
  }

  private finish(state: State) {
    this.state = state;
    this.physics.pause();
    const label = state === 'goal' ? 'ゴール！' : 'おちた…';
    this.add
      .text(GAME_WIDTH / 2, 220, `${label}\n×${this.score}\n\ntap / space`, {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: CSS.ink,
        align: 'center',
      })
      .setOrigin(0.5);
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
      if (!this.textures.exists(key)) {
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
      }
      this.skyline.push(this.add.tileSprite(0, GAME_HEIGHT - 300, GAME_WIDTH, 300, key).setOrigin(0).setScrollFactor(0));
    });
  }
}

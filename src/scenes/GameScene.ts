import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, RUN, SCORE, WEIGHT } from '../config';
import { CAT_FRAME, CAT_SCALE } from '../art/cat';
import { SKYLINE_H, SKYLINE_W } from '../art/city';
import { saveBest } from '../systems/Best';
import { sound } from '../systems/Sound';
import { CatStage, Weight } from '../systems/Weight';
import { ItemKind, LevelGenerator } from '../world/LevelGenerator';
import { HudState, PAUSE_ZONE } from './UIScene';

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
  private wasGrounded = true;
  private stage: CatStage = 'light';
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;

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

    this.cat = this.physics.add.sprite(RUN.catX, 380, 'cat-light-run0').setDepth(10);
    // Тело одинаковое для всех стадий: вес влияет на физику, а не на хитбокс.
    const k = CAT_SCALE;
    this.cat.body.setSize(46 * k, 34 * k).setOffset((CAT_FRAME.cx - 18) * k, (CAT_FRAME.feetY - 34) * k);
    this.stage = this.weight.stage;
    this.cat.play(`run-${this.stage}`);
    this.wasGrounded = true;

    this.dust = this.add
      .particles(0, 0, 'dot', {
        tint: PALETTE.stone,
        lifespan: 380,
        speed: { min: 30, max: 90 },
        angle: { min: 190, max: 260 },
        scale: { start: 0.9, end: 0 },
        emitting: false,
      })
      .setDepth(9);
    this.physics.add.collider(this.cat, this.level.roofs);
    this.physics.add.overlap(this.cat, this.level.items, (_cat, item) =>
      this.eat(item as Phaser.Physics.Arcade.Image),
    );

    this.setupInput();
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
  }

  private setupInput() {
    const press = () => {
      if (this.state !== 'running') return;
      this.jumpPressedAt = this.time.now;
    };
    const release = () => {
      // Короткое нажатие — низкий прыжок.
      if (this.cat.body.velocity.y < 0) this.cat.body.velocity.y *= 0.45;
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const z = PAUSE_ZONE;
      if (p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h) return;
      press();
    });
    this.input.on('pointerup', release);
    // Свайп вниз — быстрое падение.
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown && p.y - p.downY > 40 && p.getDuration() < 400) this.fastFall();
    });
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
      this.jumpLines();
      sound.jump(w);
    }

    this.animateCat(grounded, speed);

    if (this.cat.y > this.scale.height + 80 || this.cat.x < -40) this.finish('dead');

    this.events.emit('hud', this.hudState());
  }

  private animateCat(grounded: boolean, speed: number) {
    const body = this.cat.body;
    const stage = this.weight.stage;
    if (stage !== this.stage) {
      this.stage = stage;
      // «Пуф» при смене стадии.
      this.tweens.add({ targets: this.cat, scaleX: 1.15, scaleY: 0.9, duration: 90, yoyo: true });
    }
    if (grounded) {
      if (!this.wasGrounded) this.land();
      this.cat.anims.play(`run-${stage}`, true);
      this.cat.anims.timeScale = speed / 260;
      this.cat.setAngle(0);
    } else {
      this.cat.anims.stop();
      this.cat.setTexture(`cat-${stage}-${body.velocity.y < 60 ? 'jump' : 'fall'}`);
      this.cat.setAngle(Phaser.Math.Clamp(body.velocity.y / 45, -14, 16));
    }
    this.wasGrounded = grounded;
  }

  private land() {
    const heavy = this.weight.value;
    this.dust.explode(Math.round(4 + heavy * 8), this.cat.x - 10, this.cat.y + (CAT_FRAME.feetY - CAT_FRAME.h / 2) * CAT_SCALE);
    this.tweens.add({ targets: this.cat, scaleY: 1 - 0.08 - heavy * 0.12, scaleX: 1.06 + heavy * 0.08, duration: 70, yoyo: true });
    if (heavy > 0.67) this.cameras.main.shake(90, 0.004 * heavy);
    sound.land(heavy);
  }

  /** Штрихи «движения» под котом в момент прыжка, как на референсе. */
  private jumpLines() {
    const x = this.cat.x - 18;
    const y = this.cat.y + 22;
    for (let i = 0; i < 3; i++) {
      const line = this.add
        .rectangle(x - i * 9, y - i * 7, 8, 2.2, PALETTE.ink)
        .setAngle(-50)
        .setDepth(9);
      this.tweens.add({ targets: line, alpha: 0, x: line.x - 30, duration: 320, onComplete: () => line.destroy() });
    }
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
    // Съеденное «впрыгивает» в кота.
    const ghost = this.add.image(item.x, item.y, item.texture.key).setDepth(11);
    item.destroy();
    this.tweens.add({
      targets: ghost,
      x: this.cat.x + 20,
      y: this.cat.y - 10,
      scale: 0.2,
      alpha: 0,
      duration: 160,
      onComplete: () => ghost.destroy(),
    });
    if (kind === 'can') sound.can();
    else sound.kibble();
    if (kind === 'can') this.tweens.add({ targets: this.cat, scaleX: 1.2, scaleY: 1.12, duration: 110, yoyo: true });
  }

  private hudState(): HudState {
    return {
      weight: this.weight.value,
      score: this.score,
      meters: Math.min(RUN.goalMeters, Math.floor(this.traveled / RUN.pxPerMeter)),
    };
  }

  private finish(state: Exclude<State, 'running'>) {
    if (this.state !== 'running') return;
    this.state = state;
    this.physics.pause();
    if (state === 'goal') sound.goal();
    else sound.fall();
    const hud = this.hudState();
    const newBest = saveBest(state, hud.score, hud.meters);
    this.events.emit('finish', state, hud, newBest);
  }

  /** Город в три слоя параллакса. */
  private createSkyline() {
    for (let i = 0; i < 3; i++) {
      const y = GAME_HEIGHT - SKYLINE_H + 40 - i * 10;
      const layer = this.add.tileSprite(0, y, GAME_WIDTH, SKYLINE_H, `skyline-${i}`).setOrigin(0);
      layer.tilePositionX = Phaser.Math.Between(0, SKYLINE_W);
      this.skyline.push(layer);
    }
  }
}

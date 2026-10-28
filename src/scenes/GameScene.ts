import Phaser from 'phaser';
import { DAY, NIGHT } from '../art/theme';
import { CSS, VIEW_H } from '../config';
import { LEVELS } from '../levels';
import { endlessLevel, extendEndless } from '../levels/endless';
import { WorldView } from '../render/WorldView';
import { SIM } from '../sim/constants';
import type { Input, LevelData, Result, SimEvent } from '../sim/types';
import { World } from '../sim/world';
import { progress } from '../systems/Progress';
import { sound } from '../systems/Sound';
import { setupCamera, txt } from '../ui/kit';
import { PAUSE_ZONE } from './UIScene';

export interface GameInit {
  level: number | 'endless';
}

export interface HudFrame {
  world: World;
  level: LevelData;
}

export interface FinishInfo {
  result: Result;
  level: LevelData;
  levelIndex: number | 'endless';
  newRecord: boolean;
}

/** Игровая сцена: шагает симуляцию с фиксированным шагом и показывает её. */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private view!: WorldView;
  private levelIndex: number | 'endless' = 0;
  private acc = 0;
  private input_: Input = { jump: false, down: false };
  private downUntil = 0;
  private started = false;
  private paused = false;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Только для разработки: проигрывание решения бота (?replay) и ускорение (?fast=N). */
  private replay: number[] | null = null;
  private steps = 0;
  private fast = 1;

  constructor() {
    super('Game');
  }

  init(data: GameInit) {
    this.levelIndex = data.level ?? 0;
  }

  create() {
    setupCamera(this);
    const level = this.levelIndex === 'endless' ? endlessLevel() : LEVELS[this.levelIndex]();
    this.world = new World(level);
    this.view = new WorldView(this, this.world, level.night ? NIGHT : DAY);
    this.acc = 0;
    this.started = false;
    this.paused = false;
    this.input_ = { jump: false, down: false };

    this.dust = this.add
      .particles(0, 0, 'dot', {
        tint: level.night ? 0x777777 : 0xbeb8ad,
        lifespan: 420,
        speed: { min: 30, max: 110 },
        angle: { min: 190, max: 350 },
        gravityY: 120,
        scale: { start: 0.55, end: 0 },
        emitting: false,
      })
      .setDepth(9);

    this.setupInput();
    this.steps = 0;
    this.replay = null;
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(location.search);
      this.fast = +(q.get('fast') ?? 1);
      if (q.has('replay')) {
        void import('../../tools/traces.json').then((m) => {
          this.replay = (m.default as Record<string, number[]>)[level.id] ?? null;
          this.started = true;
          this.events.emit('started');
        });
      }
    }
    this.scene.launch('UI', { level, levelIndex: this.levelIndex });
    this.scene.bringToTop('UI');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('UI'));
    this.view.update(0);
    this.showIntro();
  }

  /** Старт после заставки уровня (её рисует HUD): по таймеру или по первому тапу. */
  private showIntro() {
    const begin = () => {
      if (this.started) return;
      this.started = true;
      this.events.emit('started');
    };
    this.time.delayedCall(1600, begin);
    this.input.once('pointerdown', begin);
    this.input.keyboard?.once('keydown-SPACE', begin);
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    const jumpKeys = [kb.addKey('SPACE'), kb.addKey('UP'), kb.addKey('W')];
    const downKeys = [kb.addKey('DOWN'), kb.addKey('S')];
    this.registry.set('keys', { jumpKeys, downKeys });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      sound.unlock();
      if (this.inPauseZone(p)) return;
      this.input_.jump = true;
    });
    this.input.on('pointerup', () => (this.input_.jump = false));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown && p.y - p.downY > 60 && p.getDuration() < 450) {
        this.downUntil = this.time.now + 160;
        this.input_.jump = false;
      }
    });
    this.events.on('update', () => {
      const keyJump = jumpKeys.some((k) => k.isDown);
      const keyDown = downKeys.some((k) => k.isDown);
      const pointerJump = this.input.activePointer.isDown && !this.inPauseZone(this.input.activePointer) && this.input_.jump;
      this.input_ = { jump: keyJump || pointerJump, down: keyDown || this.time.now < this.downUntil };
    });
  }

  private inPauseZone(p: Phaser.Input.Pointer) {
    const z = PAUSE_ZONE;
    const x = p.x / this.scale.width;
    const y = p.y / this.scale.height;
    return x >= z.x && y <= z.y;
  }

  setPaused(v: boolean) {
    this.paused = v;
    this.input_.jump = false;
  }

  update(time: number, delta: number) {
    if (this.started && !this.paused && this.world.status === 'run') {
      this.acc += (Math.min(delta, 100) / 1000) * this.fast;
      while (this.acc >= SIM.dt) {
        if (this.replay) {
          const a = this.replay[Math.floor(this.steps / 12)] ?? 0;
          this.world.step({ jump: a === 1, down: a === 2 });
          this.steps++;
        } else this.world.step(this.input_);
        this.acc -= SIM.dt;
        if (this.world.level.endless) extendEndless(this.world);
        if (this.world.status !== 'run') break;
      }
      for (const e of this.world.events) this.onEvent(e);
      this.world.events.length = 0;
    }
    this.view.update(time);
    this.events.emit('hud', { world: this.world, level: this.world.level } satisfies HudFrame);
  }

  private onEvent(e: SimEvent) {
    const c = this.world.cat;
    switch (e.type) {
      case 'jump':
        sound.jump(e.weight);
        this.jumpLines();
        this.view.squashCat(0.9, 1.12, 120);
        break;
      case 'land': {
        const hard = Math.min(1, e.vy / 1100);
        this.dust.explode(Math.round(3 + e.weight * 8 + hard * 4), c.x - 6, c.y - 2);
        this.view.squashCat(1.08 + e.weight * 0.1, 0.9 - e.weight * 0.1);
        sound.land(e.weight);
        if (e.weight > 0.7) {
          this.cameras.main.shake(110, 0.0035 * e.weight);
          this.pop('ドスン', c.x - 20, c.y - 60, 18);
        }
        break;
      }
      case 'eat': {
        const img = this.view.itemImage(e.id);
        if (img) this.eatFx(img, e.kind);
        if (e.kind === 'can') {
          sound.can();
          this.pop('もぐ', c.x + 30, c.y - 70, 15);
          this.view.squashCat(1.18, 1.1, 160);
        } else if (e.kind === 'toy') {
          sound.toy();
          this.pop('−20%', c.x + 30, c.y - 70, 16, true);
        } else sound.kibble();
        break;
      }
      case 'bounce':
        sound.bounce(e.weight);
        this.view.bounceFuton(e.id);
        this.pop('ぼよん', c.x, c.y - 60, 18);
        break;
      case 'wireSnap':
        sound.snap();
        this.pop('プツン', c.x + 10, c.y - 70, 20);
        this.cameras.main.shake(120, 0.004);
        break;
      case 'scale':
        sound.scale(e.ok);
        this.view.showScale(e.id);
        this.pop(e.ok ? 'ガコン' : 'ブー', c.x + 40, c.y - 90, 18);
        break;
      case 'finish':
        this.onFinish(e.result);
        break;
    }
  }

  /** Японская ономатопея, как в манге. */
  private pop(text: string, x: number, y: number, size: number, latin = false) {
    const night = !!this.world.level.night;
    const t = txt(this, x, y, text, { size, weight: 700, latin, color: night ? CSS.paper : CSS.ink, origin: [0.5, 0.5] })
      .setDepth(20)
      .setAngle(Phaser.Math.Between(-8, 8))
      .setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 18, delay: 380, duration: 300, onComplete: () => t.destroy() });
  }

  private jumpLines() {
    const c = this.world.cat;
    const night = !!this.world.level.night;
    for (let i = 0; i < 3; i++) {
      const line = this.add
        .rectangle(c.x - 22 - i * 7, c.y - 4 + i * 1, 2, 9, night ? 0xf6f4ee : 0x111111)
        .setAngle(-28 - i * 6)
        .setDepth(9);
      this.tweens.add({ targets: line, alpha: 0, x: line.x - 26, y: line.y + 6, duration: 300, onComplete: () => line.destroy() });
    }
  }

  private eatFx(img: Phaser.GameObjects.Image, kind: string) {
    img.setData('eating', true).setVisible(true);
    this.tweens.add({
      targets: img,
      x: this.view.cat.x + 34,
      y: this.view.cat.y - 30,
      scale: img.scale * (kind === 'can' ? 1.3 : 0.3),
      alpha: 0,
      duration: kind === 'can' ? 240 : 140,
      onComplete: () => img.setVisible(false),
    });
  }

  private onFinish(result: Result) {
    const lv = this.world.level;
    if (result.status === 'goal') sound.goal();
    else if (result.status === 'bonk') {
      sound.bonk();
      this.pop('ごつん', this.world.cat.x + 20, this.world.cat.y - 50, 22);
      this.cameras.main.shake(160, 0.006);
    } else sound.fall();
    let newRecord = false;
    if (lv.endless) newRecord = progress.recordEndless(result.distance);
    else newRecord = progress.record(lv.id, result.stars, result.points);
    const info: FinishInfo = { result, level: lv, levelIndex: this.levelIndex, newRecord };
    this.time.delayedCall(result.status === 'goal' ? 500 : 700, () => this.events.emit('finish', info));
    if (result.status !== 'goal') {
      // Кот улетает вниз — дадим камере увидеть падение.
      this.tweens.add({ targets: this.view.cat, y: VIEW_H + 120, angle: 40, duration: 700, ease: 'Quad.easeIn' });
    }
  }
}

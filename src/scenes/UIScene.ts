import Phaser from 'phaser';
import { CSS, GAME_HEIGHT, GAME_WIDTH, PALETTE, RUN } from '../config';
import { sound } from '../systems/Sound';

export const FONT = '"Helvetica Neue", "Hiragino Sans", "Noto Sans JP", Arial, sans-serif';

/** Состояние, которое игровая сцена передаёт в HUD каждый кадр. */
export interface HudState {
  weight: number;
  score: number;
  meters: number;
}

export type RunResult = 'dead' | 'goal';

const BAR = { x: 48, y: 52, w: 200, h: 14 } as const;
/** Зона кнопки паузы: тапы в ней не считаются прыжком. */
export const PAUSE_ZONE = { x: GAME_WIDTH - 96, y: 0, w: 96, h: 90 } as const;

/** HUD поверх игры: шкала веса, счётчик корма, прогресс, пауза и итоговый экран. */
export class UIScene extends Phaser.Scene {
  private barFill!: Phaser.GameObjects.Graphics;
  private percent!: Phaser.GameObjects.Text;
  private count!: Phaser.GameObjects.Text;
  private progress!: Phaser.GameObjects.Graphics;
  private overlay?: Phaser.GameObjects.Container;
  private shownWeight = 0;

  constructor() {
    super('UI');
  }

  create() {
    this.overlay = undefined;
    const label = { fontFamily: FONT, fontSize: '15px', color: CSS.ink };

    this.add.text(BAR.x, BAR.y - 26, 'WEIGHT', label).setLetterSpacing(3);
    this.add
      .graphics()
      .fillStyle(PALETTE.sand)
      .fillRoundedRect(BAR.x, BAR.y, BAR.w, BAR.h, BAR.h / 2)
      .lineStyle(1.5, PALETTE.ink)
      .strokeRoundedRect(BAR.x, BAR.y, BAR.w, BAR.h, BAR.h / 2);
    this.barFill = this.add.graphics();
    this.percent = this.add.text(BAR.x, BAR.y + 24, '0%', label).setLetterSpacing(2);

    this.add.image(GAME_WIDTH - 158, 54, 'kibble');
    this.count = this.add.text(GAME_WIDTH - 140, 45, '× 0', { ...label, fontSize: '17px' }).setLetterSpacing(1);

    // Прогресс до финиша — тонкая линия по центру сверху.
    this.progress = this.add.graphics();

    this.createPauseButton();

    const game = this.scene.get('Game');
    game.events.on('hud', this.updateHud, this);
    game.events.on('finish', this.showResult, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      game.events.off('hud', this.updateHud, this);
      game.events.off('finish', this.showResult, this);
    });
  }

  private createPauseButton() {
    const cx = PAUSE_ZONE.x + PAUSE_ZONE.w / 2;
    const g = this.add.graphics().fillStyle(PALETTE.ink);
    g.fillRect(cx - 8, 42, 5, 22).fillRect(cx + 3, 42, 5, 22);
    this.add
      .zone(PAUSE_ZONE.x, PAUSE_ZONE.y, PAUSE_ZONE.w, PAUSE_ZONE.h)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());
    this.input.keyboard!.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard!.on('keydown-M', () => sound.toggleMute());
    this.input.keyboard!.on('keydown-P', () => this.togglePause());
  }

  private togglePause() {
    if (this.overlay && !this.scene.isPaused('Game')) return; // экран итогов
    if (this.scene.isPaused('Game')) {
      this.overlay?.destroy();
      this.overlay = undefined;
      this.scene.resume('Game');
    } else {
      this.scene.pause('Game');
      this.overlay = this.makeOverlay('PAUSE', 'tap to resume', () => this.togglePause());
    }
  }

  private updateHud(s: HudState) {
    // Шкала догоняет значение плавно, как в референсе.
    this.shownWeight = Phaser.Math.Linear(this.shownWeight, s.weight, 0.15);
    const w = Math.max(BAR.h, BAR.w * this.shownWeight);
    this.barFill.clear();
    if (this.shownWeight > 0.005) {
      this.barFill.fillStyle(PALETTE.ink).fillRoundedRect(BAR.x, BAR.y, w, BAR.h, BAR.h / 2);
    }
    this.percent.setText(`${Math.round(s.weight * 100)}%`);
    this.count.setText(`× ${s.score}`);

    const pw = 240;
    const px = (GAME_WIDTH - pw) / 2;
    const t = Phaser.Math.Clamp(s.meters / RUN.goalMeters, 0, 1);
    this.progress
      .clear()
      .fillStyle(PALETTE.stone)
      .fillRect(px, 30, pw, 2)
      .fillStyle(PALETTE.ink)
      .fillRect(px, 30, pw * t, 2)
      .fillCircle(px + pw * t, 31, 4)
      .lineStyle(1.5, PALETTE.ink)
      .strokeCircle(px + pw, 31, 5);
  }

  private showResult(result: RunResult, s: HudState, newBest: boolean) {
    this.updateHud(s);
    const title = result === 'goal' ? 'ゴール！' : 'おちた…';
    const sub = `× ${s.score}    ${s.meters} m    ${Math.round(s.weight * 100)}%${newBest ? '    NEW BEST' : ''}`;
    this.time.delayedCall(400, () => {
      this.overlay = this.makeOverlay(title, sub, () => this.retry(), 'tap to retry');
      this.input.keyboard!.once('keydown-ESC', () => this.toMenu());
    });
  }

  private toMenu() {
    this.scene.stop('Game');
    this.scene.start('Menu');
  }

  private retry() {
    this.scene.get('Game').scene.restart();
    this.scene.restart();
  }

  private makeOverlay(title: string, sub: string, onTap: () => void, hint?: string) {
    const c = this.add.container(0, 0);
    const bg = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, PALETTE.paper, 0.86)
      .setOrigin(0)
      .setInteractive()
      .on('pointerdown', onTap);
    const t = this.add.text(GAME_WIDTH / 2, 210, title, { fontFamily: FONT, fontSize: '56px', color: CSS.ink }).setOrigin(0.5);
    const line = this.add.rectangle(GAME_WIDTH / 2, 262, 40, 2, PALETTE.ink);
    const st = this.add
      .text(GAME_WIDTH / 2, 300, sub, { fontFamily: FONT, fontSize: '20px', color: CSS.charcoal })
      .setOrigin(0.5)
      .setLetterSpacing(3);
    const menu = this.add
      .text(GAME_WIDTH / 2, 440, 'MENU', { fontFamily: FONT, fontSize: '14px', color: CSS.ink })
      .setOrigin(0.5)
      .setLetterSpacing(4)
      .setPadding(16)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        this.toMenu();
      });
    c.add([bg, t, line, st, menu]);
    if (hint) {
      c.add(
        this.add
          .text(GAME_WIDTH / 2, 370, hint.toUpperCase(), { fontFamily: FONT, fontSize: '14px', color: CSS.gray })
          .setOrigin(0.5)
          .setLetterSpacing(4),
      );
      this.input.keyboard!.once('keydown-SPACE', onTap);
    }
    return c;
  }
}

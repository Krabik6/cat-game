import Phaser from 'phaser';
import { CSS, VIEW_H, VIEW_W } from '../config';
import { LEVELS } from '../levels';
import { SIM } from '../sim/constants';
import type { LevelData, Requirement } from '../sim/types';
import { sound } from '../systems/Sound';
import { drawStar, pillButton, setupCamera, txt } from '../ui/kit';
import type { FinishInfo, GameScene, HudFrame } from './GameScene';

/** Доли экрана, где тап — это пауза, а не прыжок (правый верхний угол). */
export const PAUSE_ZONE = { x: 0.88, y: 0.17 } as const;

const BAR = { x: 40, y: 50, w: 220, h: 14 } as const;
const pct = (w: number) => `${Math.round(w * 100)}%`;

const REQ_LABEL: Record<Requirement['kind'], string> = {
  wire: '電線',
  vent: 'ビル風',
  bridge: '体重計',
  futon: 'ふとん',
  crate: '段ボール',
};

/** HUD поверх игры: шкала веса с порогом ближайшего испытания, очки, прогресс, пауза и итоги. */
export class UIScene extends Phaser.Scene {
  private level!: LevelData;
  private levelIndex: number | 'endless' = 0;
  private ink = 0x111111;
  private inkCss: string = CSS.ink;
  private barG!: Phaser.GameObjects.Graphics;
  private pctText!: Phaser.GameObjects.Text;
  private reqText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;
  private bellIcons: Phaser.GameObjects.Image[] = [];
  private bellsShown = 0;
  private progG!: Phaser.GameObjects.Graphics;
  private shown = 0;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('UI');
  }

  init(data: { level: LevelData; levelIndex: number | 'endless' }) {
    this.level = data.level;
    this.levelIndex = data.levelIndex;
  }

  create() {
    setupCamera(this);
    this.overlay = undefined;
    this.shown = this.level.startWeight;
    const night = !!this.level.night;
    this.ink = night ? 0xf6f4ee : 0x111111;
    this.inkCss = night ? CSS.paper : CSS.ink;

    txt(this, BAR.x, BAR.y - 22, 'WEIGHT', { size: 11, latin: true, spacing: 4, color: this.inkCss });
    this.barG = this.add.graphics();
    this.pctText = txt(this, BAR.x, BAR.y + 22, '0%', { size: 13, latin: true, spacing: 2, color: this.inkCss });
    this.reqText = txt(this, BAR.x + 56, BAR.y + 21, '', { size: 12, color: this.inkCss });

    this.add.image(VIEW_W - 170, 50, 'kibble').setScale(0.45);
    this.pointsText = txt(this, VIEW_W - 150, 50, '× 0', { size: 15, latin: true, spacing: 1, color: this.inkCss, origin: [0, 0.5] });

    // 鈴: пустые силуэты, которые темнеют по мере сбора.
    this.bellIcons = [];
    this.bellsShown = 0;
    const bells = this.level.endless ? 0 : this.level.items.filter((i) => i.kind === 'bell').length;
    for (let i = 0; i < bells; i++) {
      this.bellIcons.push(this.add.image(VIEW_W - 166 + i * 26, 80, night ? 'bellNight' : 'bell').setScale(0.4).setAlpha(0.22));
    }

    const g = this.add.graphics().fillStyle(this.ink);
    g.fillRect(VIEW_W - 58, 40, 4.5, 20).fillRect(VIEW_W - 48, 40, 4.5, 20);
    this.add
      .zone(VIEW_W - 51, 50, 70, 70)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());

    this.progG = this.add.graphics();

    const game = this.scene.get('Game');
    game.events.on('hud', this.onHud, this);
    game.events.on('finish', this.onFinish, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      game.events.off('hud', this.onHud, this);
      game.events.off('finish', this.onFinish, this);
    });
    this.intro(game);
    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => this.togglePause());
    kb.on('keydown-P', () => this.togglePause());
    kb.on('keydown-M', () => sound.toggleMute());
    kb.on('keydown-R', () => this.retry());
  }

  /** Заставка уровня: номер, название и одна строка о механике. */
  private intro(game: Phaser.Scene) {
    const lv = this.level;
    const color = this.inkCss;
    const cx = VIEW_W / 2;
    const label = lv.endless ? 'ENDLESS' : `STAGE ${String(lv.index).padStart(2, '0')}`;
    const items: Phaser.GameObjects.GameObject[] = [
      txt(this, cx, 168, label, { size: 13, latin: true, spacing: 6, color, origin: [0.5, 0.5] }),
      txt(this, cx, 212, lv.name, { size: 44, color, origin: [0.5, 0.5] }),
      this.add.rectangle(cx, 246, 36, 2, this.ink),
      txt(this, cx, 266, lv.nameEn, { size: 12, latin: true, spacing: 5, color: lv.night ? CSS.stone : CSS.gray, origin: [0.5, 0.5] }),
      txt(this, cx, 300, lv.blurb, { size: 15, color, origin: [0.5, 0.5] }),
    ];
    if (!lv.endless) {
      items.push(
        txt(this, cx, 336, `× ${lv.targetPoints}   ·   鈴 ${lv.items.filter((i) => i.kind === 'bell').length}`, {
          size: 11,
          latin: true,
          spacing: 3,
          color: lv.night ? CSS.stone : CSS.gray,
          origin: [0.5, 0.5],
        }),
      );
    }
    game.events.once('started', () => {
      this.tweens.add({ targets: items, alpha: 0, y: '-=10', duration: 260, onComplete: () => items.forEach((i) => i.destroy()) });
    });
  }

  private onHud({ world }: HudFrame) {
    const w = world.cat.weight;
    this.shown = Phaser.Math.Linear(this.shown, w, 0.2);
    const req = world.nextRequirement();
    const g = this.barG.clear();
    const { x, y, w: bw, h } = BAR;
    const night = !!this.level.night;

    // Коридор, в котором испытание проходимо, — светлая полоса под шкалой.
    let ok = true;
    if (req) {
      const lo = 'min' in req ? req.min : 0;
      const hi = 'max' in req ? req.max : 1;
      ok = w >= lo - 1e-9 && w <= hi + 1e-9;
      g.fillStyle(night ? 0x777777 : 0xbeb8ad, 0.9).fillRect(x + bw * lo, y + h + 3, bw * (hi - lo), 3);
    }
    g.fillStyle(night ? 0x333333 : 0xe6e1d7).fillRoundedRect(x, y, bw, h, h / 2);
    const fw = Math.max(h, bw * this.shown);
    g.fillStyle(this.ink).fillRoundedRect(x, y, fw, h, h / 2);
    g.lineStyle(1.4, this.ink).strokeRoundedRect(x, y, bw, h, h / 2);
    // Запас на ぴょん: последние 8% шкалы светлее, если прыжок в воздухе доступен.
    const c = world.cat;
    if (!c.airUsed && w >= SIM.airCost) {
      const sx = x + bw * Math.max(0, this.shown - SIM.airCost);
      g.fillStyle(night ? 0x111111 : 0xf6f4ee, c.grounded ? 0.35 : 0.6).fillRect(sx, y + 4, Math.max(2, bw * this.shown - (sx - x) - 3), h - 8);
    }
    if (req) {
      const t = 'min' in req ? req.min : req.max;
      const tx = x + bw * t;
      const blink = !ok && Math.floor(this.time.now / 220) % 2 === 0;
      g.fillStyle(blink ? (night ? 0x111111 : 0xf6f4ee) : this.ink).fillRect(tx - 1, y - 7, 2, h + 14);
      g.fillStyle(this.ink).fillTriangle(tx - 5, y - 11, tx + 5, y - 11, tx, y - 5);
      const sign = 'min' in req ? '≥' : '≤';
      this.reqText.setText(`${REQ_LABEL[req.kind]} ${sign}${pct(t)}  ${ok ? 'OK' : 'NG'}`);
      this.reqText.setAlpha(ok ? 0.75 : blink ? 0.4 : 1);
    } else this.reqText.setText('');
    this.pctText.setText(pct(w));

    const target = this.level.targetPoints;
    this.pointsText.setText(this.level.endless ? `× ${world.points}` : `× ${world.points} / ${target}`);
    this.pointsText.setAlpha(world.points >= target && !this.level.endless ? 1 : 0.85);
    if (world.bells !== this.bellsShown) {
      this.bellIcons.forEach((b, i) => b.setAlpha(i < world.bells ? 1 : 0.22));
      const got = this.bellIcons[world.bells - 1];
      if (world.bells > this.bellsShown && got) this.tweens.add({ targets: got, scale: { from: 0.7, to: 0.4 }, duration: 300, ease: 'Back.easeOut' });
      this.bellsShown = world.bells;
    }

    // Прогресс к финишу или метры в бесконечном режиме.
    const p = this.progG.clear();
    if (this.level.endless) return;
    const start = this.level.roofs[0].x;
    const len = this.level.goal.x - start;
    const t = Phaser.Math.Clamp((world.cat.x - start) / len, 0, 1);
    const pw = 240;
    const px = (VIEW_W - pw) / 2;
    p.fillStyle(night ? 0x555555 : 0xbeb8ad).fillRect(px, 30, pw, 2);
    p.fillStyle(this.ink).fillRect(px, 30, pw * t, 2).fillCircle(px + pw * t, 31, 4);
    p.lineStyle(1.4, this.ink).strokeCircle(px + pw, 31, 5);
  }

  private togglePause() {
    const game = this.scene.get('Game') as GameScene;
    if (this.overlay?.getData('result')) return;
    sound.click();
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = undefined;
      game.setPaused(false);
      return;
    }
    game.setPaused(true);
    const c = this.panel();
    c.add(txt(this, VIEW_W / 2, 190, 'PAUSE', { size: 40, latin: true, spacing: 10, origin: [0.5, 0.5] }));
    c.add(pillButton(this, VIEW_W / 2, 270, 'RESUME', () => this.togglePause(), { filled: true }));
    c.add(pillButton(this, VIEW_W / 2, 316, 'RETRY', () => this.retry()));
    c.add(pillButton(this, VIEW_W / 2, 362, 'STAGES', () => this.toStages()));
    this.overlay = c;
  }

  private panel() {
    const c = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0xf6f4ee, 0.92).setOrigin(0).setInteractive();
    c.add(bg);
    return c;
  }

  private retry() {
    sound.click();
    this.scene.get('Game').scene.restart({ level: this.levelIndex });
  }

  private toStages() {
    sound.click();
    this.scene.stop('Game');
    this.scene.start('Select');
  }

  private onFinish(info: FinishInfo) {
    const { result, level } = info;
    const c = this.panel();
    c.setData('result', true);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
    this.overlay = c;
    const cx = VIEW_W / 2;

    const title = result.status === 'goal' ? 'ゴール！' : result.status === 'bonk' ? 'ごつん…' : 'おちた…';
    c.add(txt(this, cx, 96, level.endless ? 'ENDLESS' : `STAGE ${String(level.index).padStart(2, '0')}  ${level.nameEn}`, { size: 11, latin: true, spacing: 5, color: CSS.gray, origin: [0.5, 0.5] }));
    c.add(txt(this, cx, 140, title, { size: 46, origin: [0.5, 0.5] }));
    c.add(this.add.rectangle(cx, 178, 36, 2, 0x111111));

    if (level.endless) {
      c.add(txt(this, cx, 230, `${result.distance} m`, { size: 40, latin: true, spacing: 2, origin: [0.5, 0.5] }));
      c.add(txt(this, cx, 270, info.newRecord ? 'NEW RECORD' : `× ${result.points}`, { size: 13, latin: true, spacing: 4, color: CSS.charcoal, origin: [0.5, 0.5] }));
    } else {
      const stars = this.add.graphics();
      c.add(stars);
      const lines = [
        { label: 'ゴール', value: result.status === 'goal' ? 'CLEAR' : `${result.distance} m`, ok: result.stars[0] },
        { label: 'カリカリ', value: `${result.points} / ${level.targetPoints}`, ok: result.stars[1] },
        { label: '鈴', value: `${result.bells} / ${result.bellsTotal}`, ok: result.stars[2] },
      ];
      result.stars.forEach((_, i) => drawStar(stars, cx - 56 + i * 56, 222, 17, false));
      result.stars.forEach((on, i) => {
        if (!on) return;
        this.time.delayedCall(350 + i * 260, () => {
          drawStar(stars, cx - 56 + i * 56, 222, 17, true);
          sound.star(i);
          const ring = this.add.circle(cx - 56 + i * 56, 222, 18).setStrokeStyle(1.5, 0x111111).setDepth(101);
          this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
        });
      });
      lines.forEach((l, i) => {
        const y = 270 + i * 26;
        c.add(txt(this, cx - 150, y, l.label, { size: 13, origin: [0, 0.5] }));
        c.add(txt(this, cx + 120, y, l.value, { size: 13, latin: true, spacing: 1, color: CSS.charcoal, origin: [1, 0.5] }));
        c.add(txt(this, cx + 150, y, l.ok ? '✓' : '—', { size: 14, latin: true, color: l.ok ? CSS.ink : CSS.stone, origin: [1, 0.5] }));
      });
      const hint = this.hint(info);
      if (hint) c.add(txt(this, cx, 358, hint, { size: 12, color: CSS.gray, origin: [0.5, 0.5] }));
    }

    const hasNext = typeof info.levelIndex === 'number' && info.levelIndex < LEVELS.length - 1 && result.stars[0];
    const y = 410;
    if (hasNext) {
      c.add(pillButton(this, cx - 170, y, 'STAGES', () => this.toStages(), { w: 140 }));
      c.add(pillButton(this, cx, y, 'RETRY', () => this.retry(), { w: 140 }));
      c.add(pillButton(this, cx + 170, y, 'NEXT', () => this.next(), { w: 140, filled: true }));
    } else {
      c.add(pillButton(this, cx - 85, y, 'STAGES', () => this.toStages(), { w: 140 }));
      c.add(pillButton(this, cx + 85, y, 'RETRY', () => this.retry(), { w: 140, filled: true }));
    }
    this.input.keyboard!.once('keydown-SPACE', () => (hasNext ? this.next() : this.retry()));
    this.input.keyboard!.once('keydown-ENTER', () => (hasNext ? this.next() : this.retry()));
  }

  /** Подсказка после забега: что помешало взять звезду. */
  private hint({ result }: FinishInfo) {
    if (result.status === 'bonk') return 'ぶつかった。もっと食べれば箱もこわせる。';
    if (result.status === 'fall') return result.weight >= 0.08 ? '空中でもう一回タップ＝ぴょん！' : '食べておけば、空中でぴょんできる。';
    if (!result.stars[2]) return `鈴があと${result.bellsTotal - result.bells}個。重さを使って探そう。`;
    if (!result.stars[1]) return 'もっと食べよう。箱の中にもごはん。';
    return 'パーフェクト！';
  }

  private next() {
    sound.click();
    const i = (this.levelIndex as number) + 1;
    this.scene.get('Game').scene.restart({ level: i });
  }
}

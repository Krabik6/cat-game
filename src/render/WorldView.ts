import Phaser from 'phaser';
import { CAT_BOX, CAT_CX, CAT_FEET_Y, catKey, catWeightStep, RUN_POSES } from '../art/cat';
import { createSkyline, drawRoof, SKY_H, SKY_TILE } from '../art/city';
import type { Theme } from '../art/theme';
import { CSS, RENDER_SCALE, VIEW_H, VIEW_W } from '../config';
import { physics, SIM } from '../sim/constants';
import type { Bridge, Wire } from '../sim/types';
import { futonMin, World } from '../sim/world';
import { txt } from '../ui/kit';

const INV = 1 / RENDER_SCALE;
const PARALLAX = [0.06, 0.15, 0.28, 0.45];
const LAYER_Y = [VIEW_H - SKY_H - 30, VIEW_H - SKY_H + 10, VIEW_H - SKY_H + 70, VIEW_H - SKY_H + 190];
const pct = (w: number) => `${Math.round(w * 100)}%`;

interface BridgeView {
  data: Bridge;
  plank: Phaser.GameObjects.Graphics;
  needle: Phaser.GameObjects.Image;
  dialX: number;
  dialY: number;
  shown: boolean;
}

/** Отрисовка состояния симуляции. Сама ничего не решает: только показывает World. */
export class WorldView {
  readonly cat: Phaser.GameObjects.Image;
  private layers: Phaser.GameObjects.Image[][] = [];
  private items = new Map<number, Phaser.GameObjects.Image>();
  private wireG: Phaser.GameObjects.Graphics;
  private futons = new Map<number, Phaser.GameObjects.Image>();
  private bridges: BridgeView[] = [];
  private pigeons: { img: Phaser.GameObjects.Image; flown: boolean }[] = [];
  private catPose = 'run0';
  private seen = new Set<number>();
  /** Объекты с горизонтальными границами: вне экрана выключаются, чтобы не рисовать лишнее. */
  private cullable: { obj: Phaser.GameObjects.Components.Visible; x1: number; x2: number }[] = [];
  private squash = { x: 1, y: 1 };
  catTilt = 0;

  constructor(
    private scene: Phaser.Scene,
    private world: World,
    private theme: Theme,
  ) {
    const lv = world.level;
    scene.cameras.main.setBackgroundColor(theme.sky);

    createSkyline(scene, theme).forEach((key, i) => {
      const pair = [0, 1].map(() => scene.add.image(0, LAYER_Y[i], key).setOrigin(0).setScale(INV).setDepth(-100 + i));
      this.layers.push(pair);
    });

    this.wireG = scene.add.graphics().setDepth(3);
    for (const sg of lv.signs) this.billboard(sg.x, sg.y, sg.text, sg.sub);
    this.sync();

    const goal = lv.goal;
    if (!lv.endless) {
      scene.add.image(goal.x, goal.y + 1, 'flag').setOrigin(0.08, 1).setScale(INV).setDepth(1);
      this.tag(goal.x + 70, goal.y - 64, `${pct(goal.band[0])}–${pct(goal.band[1])}`, 'ゴール体重');
    }

    this.cat = scene.add
      .image(world.cat.x, world.cat.y, catKey(0, 'run0'))
      .setOrigin(CAT_CX / CAT_BOX.w, CAT_FEET_Y / CAT_BOX.h)
      .setScale(INV)
      .setDepth(10);
  }

  /** Создаёт картинки для сущностей, которых ещё нет (бесконечный режим дописывает уровень). */
  private sync() {
    const s = this.scene;
    const lv = this.world.level;
    const theme = this.theme;
    for (const r of lv.roofs) {
      if (this.seen.has(r.id)) continue;
      this.seen.add(r.id);
      const g = s.add.graphics({ x: r.x, y: r.y }).setDepth(0);
      drawRoof(g, r, theme, VIEW_H + 80 - r.y);
      this.cullable.push({ obj: g, x1: r.x - 10, x2: r.x + r.w + 10 });
    }

    // Восходящие потоки: штрихи ветра поднимаются из щели между домами.
    for (const v of lv.vents) {
      if (this.seen.has(v.id)) continue;
      this.seen.add(v.id);
      s.add
        .particles(0, 0, 'streak', {
          x: { min: v.x + 10, max: v.x + v.w - 10 },
          y: VIEW_H + 20,
          speedY: { min: -210, max: -260 },
          lifespan: ((VIEW_H + 20 - v.top) / 235) * 1000,
          alpha: { onUpdate: (_p: unknown, _k: string, t: number) => Math.sin(t * Math.PI) * 0.9 },
          tint: theme.name === 'day' ? 0x8e897f : 0x9a958b,
          scaleX: 0.9,
          scaleY: { min: 0.8, max: 1.6 },
          frequency: 28,
        })
        .setDepth(-5);
      // Завитки ветра у верхней границы потока.
      const swirl = s.add.graphics().setDepth(-4);
      swirl.lineStyle(1.6, theme.name === 'day' ? 0x8e897f : 0x9a958b, 0.9);
      for (let x = v.x + 30; x < v.x + v.w - 30; x += 70) {
        const y = v.top + 40 + ((x * 7) % 30);
        swirl.beginPath();
        swirl.arc(x, y, 7, Math.PI * 0.2, Math.PI * 1.7, false);
        swirl.strokePath();
        swirl.lineBetween(x + 6, y + 4, x + 24, y + 4);
      }
      this.tag(v.x + v.w / 2, v.top + 6, `≤${pct(physics.ventLimit())}`, 'ビル風');
    }

    for (const f of lv.futons) {
      if (this.seen.has(f.id)) continue;
      this.seen.add(f.id);
      const img = s.add.image(f.x + f.w / 2, f.y + 3, 'futon').setOrigin(0.5, 1).setScale(INV).setDepth(2);
      this.futons.set(f.id, img);
      this.tag(f.x + f.w / 2, f.y - 52, `≥${pct(futonMin(lv, f))}`, 'ふとん');
    }

    for (const w of lv.wires) {
      if (this.seen.has(w.id)) continue;
      this.seen.add(w.id);
      this.tag(w.x1 + 46, w.y - 54, `≤${pct(w.max)}`, '電線');
      if ((w.x2 - w.x1) > 300) {
        const px = w.x1 + (w.x2 - w.x1) * 0.62;
        const img = s.add.image(px, w.y + 1, 'pigeon').setOrigin(0.5, 1).setScale(INV).setDepth(4);
        this.pigeons.push({ img, flown: false });
      }
    }

    for (const b of lv.bridges) {
      if (this.seen.has(b.id)) continue;
      this.seen.add(b.id);
      this.bridges.push(this.makeBridge(b));
    }

    for (const it of lv.items) {
      if (this.items.has(it.id)) continue;
      const img = s.add.image(it.x, it.y, it.kind).setScale(INV).setDepth(5);
      this.items.set(it.id, img);
    }

  }

  /** Табличка-вывеска на крыше: японский текст и подпись латиницей. */
  private billboard(x: number, y: number, text: string, sub: string) {
    const s = this.scene;
    const t1 = txt(s, 0, -78, text, { size: 15, weight: 700, origin: [0.5, 0.5] });
    const t2 = txt(s, 0, -59, sub, { size: 8.5, latin: true, spacing: 2, color: CSS.charcoal, origin: [0.5, 0.5] });
    const w = Math.max(t1.width, t2.width) + 28;
    const g = s.add.graphics();
    g.fillStyle(0x111111).fillRect(-w / 2 + 14, -46, 3, 46).fillRect(w / 2 - 17, -46, 3, 46);
    g.fillStyle(0xf6f4ee).fillRect(-w / 2, -96, w, 50);
    g.lineStyle(2, 0x111111).strokeRect(-w / 2, -96, w, 50);
    g.lineStyle(1, 0x111111).strokeRect(-w / 2 + 4, -92, w - 8, 42);
    this.cullable.push({ obj: s.add.container(x, y, [g, t1, t2]).setDepth(1), x1: x - w, x2: x + w });
  }

  /** Бирка с порогом веса над препятствием. */
  private tag(x: number, y: number, value: string, label: string) {
    const s = this.scene;
    const day = this.theme.name === 'day';
    const t1 = txt(s, 0, -5, label, { size: 8, color: day ? CSS.charcoal : CSS.stone, origin: [0.5, 0.5] });
    const t2 = txt(s, 0, 8, value, { size: 12, latin: true, weight: 600, color: day ? CSS.ink : CSS.paper, origin: [0.5, 0.5] });
    const w = Math.max(t1.width, t2.width) + 14;
    const g = s.add.graphics();
    g.fillStyle(day ? 0xf6f4ee : 0x1a1a1a).fillRoundedRect(-w / 2, -13, w, 30, 4);
    g.lineStyle(1.4, day ? 0x111111 : 0xbeb8ad).strokeRoundedRect(-w / 2, -13, w, 30, 4);
    this.cullable.push({ obj: s.add.container(x, y, [g, t1, t2]).setDepth(6), x1: x - w, x2: x + w });
  }

  private makeBridge(b: Bridge): BridgeView {
    const s = this.scene;
    const dialX = b.scaleX;
    const dialY = b.y - 64 + 22;
    s.add.image(b.scaleX, b.y + 1, 'scale').setOrigin(0.5, 1).setScale(INV).setDepth(2);
    // Отметка порога на циферблате.
    const g = s.add.graphics().setDepth(3);
    const a = this.dialAngle(b.min);
    g.lineStyle(2.4, 0x111111).lineBetween(
      dialX + Math.cos(a) * 11,
      dialY + Math.sin(a) * 11,
      dialX + Math.cos(a) * 18,
      dialY + Math.sin(a) * 18,
    );
    const needle = s.add.image(dialX, dialY, 'needle').setOrigin(0.5, 20 / 34).setScale(INV).setDepth(4);
    needle.setRotation(this.dialAngle(0) + Math.PI / 2);
    this.tag(b.scaleX, b.y - 92, `≥${pct(b.min)}`, '体重計');

    const plank = s.add.graphics({ x: b.x, y: b.y }).setDepth(2);
    const w = b.w;
    plank.fillStyle(this.theme.line).fillRect(0, 0, w, 8);
    plank.lineStyle(2, this.theme.line);
    for (let x = 0; x < w - 10; x += 20) plank.lineBetween(x, 8, x + 10, 20).lineBetween(x + 10, 20, x + 20, 8);
    plank.lineBetween(0, 20, w, 20);
    plank.setAngle(-90);
    return { data: b, plank, needle, dialX, dialY, shown: false };
  }

  /** Угол на циферблате: от −210° (0%) до +30° (100%). */
  private dialAngle(w: number) {
    return Phaser.Math.DegToRad(-210 + 240 * w);
  }

  /** Эффект на взвешивании: стрелка качается и останавливается на весе. */
  showScale(id: number) {
    const v = this.bridges.find((b) => b.data.id === id);
    if (!v || v.shown) return;
    v.shown = true;
    const target = this.dialAngle(v.data.reading ?? 0) + Math.PI / 2;
    this.scene.tweens.add({ targets: v.needle, rotation: target, duration: 420, ease: 'Back.easeOut' });
    if (v.data.open) {
      this.scene.tweens.add({ targets: v.plank, angle: 0, duration: 380, delay: 120, ease: 'Bounce.easeOut' });
    } else {
      this.scene.tweens.add({ targets: v.plank, angle: -82, duration: 90, yoyo: true, repeat: 2, delay: 140 });
    }
  }

  bounceFuton(id: number) {
    const img = this.futons.get(id);
    if (!img) return;
    this.scene.tweens.add({ targets: img, scaleY: INV * 0.5, scaleX: INV * 1.12, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
  }

  itemImage(id: number) {
    return this.items.get(id);
  }

  squashCat(x: number, y: number, ms = 90) {
    this.squash = { x, y };
    this.scene.tweens.add({ targets: this.squash, x: 1, y: 1, duration: ms, ease: 'Quad.easeOut' });
  }

  /** Камера: кот всегда на трети экрана; слои города — с параллаксом. */
  update(time: number) {
    const w = this.world;
    const c = w.cat;
    if (w.level.endless) this.sync();
    const camX = c.x - 280;
    this.scene.cameras.main.centerOn(camX + VIEW_W / 2, VIEW_H / 2);

    for (const c of this.cullable) c.obj.setVisible(c.x2 > camX - 20 && c.x1 < camX + VIEW_W + 20);

    this.layers.forEach((pair, i) => {
      const off = ((camX * PARALLAX[i]) % SKY_TILE + SKY_TILE) % SKY_TILE;
      pair[0].x = camX - off;
      pair[1].x = camX - off + SKY_TILE;
    });

    // Корм покачивается, съеденное прячется.
    for (const it of w.level.items) {
      const img = this.items.get(it.id)!;
      if (it.taken) {
        if (img.visible && !img.getData('eating')) img.setVisible(false);
        continue;
      }
      img.y = it.y + Math.sin(time / 260 + it.x * 0.05) * 2;
    }

    this.drawWires(w.level.wires, time);

    for (const p of this.pigeons) {
      if (!p.flown && Math.abs(p.img.x - c.x) < 170) {
        p.flown = true;
        this.scene.tweens.add({ targets: p.img, x: p.img.x + 120, y: p.img.y - 160, alpha: 0, angle: -20, duration: 900, ease: 'Quad.easeIn' });
      }
    }

    // Поза кота.
    const step = catWeightStep(c.weight);
    let pose: string;
    if (c.grounded) pose = RUN_POSES[Math.floor((time / 1000) * 13 * (w.level.speed / 300)) % 4];
    else pose = c.vy < 120 ? 'jump' : 'fall';
    if (w.status === 'fall' || w.status === 'bonk') return;
    const key = catKey(step, pose as never);
    if (this.cat.texture.key !== key) this.cat.setTexture(key);
    this.catPose = pose;
    this.cat.setPosition(c.x, c.y);
    // Внутри шага текстур вес меняет масштаб плавно.
    const k = 1 + (c.weight - step) * 0.5;
    this.cat.setScale(INV * k * this.squash.x, INV * k * this.squash.y);
    const tilt = c.grounded ? 0 : Phaser.Math.Clamp(c.vy / 55, -14, 18);
    this.catTilt = Phaser.Math.Linear(this.catTilt, tilt, 0.25);
    this.cat.setAngle(this.catTilt);
  }

  private drawWires(wires: Wire[], time: number) {
    const g = this.wireG;
    const c = this.world.cat;
    const roofInk = this.theme.line;
    g.clear();
    for (const w of wires) {
      // Столбики на концах.
      for (const px of [w.x1 + 6, w.x2 - 6]) {
        g.fillStyle(roofInk).fillRect(px - 2, w.y - 46, 4, 46);
        g.fillRect(px - 9, w.y - 40, 18, 3);
      }
      if (w.broken) {
        g.lineStyle(2, roofInk);
        g.lineBetween(w.x1 + 6, w.y - 38, w.x1 + 22, w.y + 30);
        g.lineBetween(w.x2 - 6, w.y - 38, w.x2 - 22, w.y + 30);
        continue;
      }
      const onIt = c.ground?.kind === 'wire' && c.ground.id === w.id;
      const load = onIt ? c.weight / Math.max(0.05, w.max) : 0;
      const sagX = onIt ? c.x : (w.x1 + w.x2) / 2;
      const sag = 3 + load * 9 + (onIt ? Math.sin(time / 50) * load * 1.2 : 0);
      // Провод: от верха столбов вниз к точке опоры кота — кусочная кривая.
      g.lineStyle(2, roofInk);
      const pts = [
        new Phaser.Math.Vector2(w.x1 + 6, w.y - 38),
        new Phaser.Math.Vector2(w.x1 + 30, w.y - 4),
        new Phaser.Math.Vector2(sagX, w.y + sag),
        new Phaser.Math.Vector2(w.x2 - 30, w.y - 4),
        new Phaser.Math.Vector2(w.x2 - 6, w.y - 38),
      ];
      new Phaser.Curves.Spline(pts).draw(g, 48);
      // Второй, верхний провод — просто для вида.
      g.lineStyle(1.2, roofInk, 0.8);
      g.lineBetween(w.x1 + 6, w.y - 44, w.x2 - 6, w.y - 44);
      // Тревога: провод на грани.
      if (onIt && load > 0.85) {
        g.lineStyle(1.5, roofInk);
        const fx = c.x + 18;
        g.lineBetween(fx, w.y - 30, fx + 6, w.y - 36).lineBetween(fx + 8, w.y - 26, fx + 15, w.y - 28);
      }
    }
  }

  /** Индикатор: кот должен вот-вот приземлиться. Отдаёт верх экрана для эффектов. */
  get pose() {
    return this.catPose;
  }

  static catHeightTop(world: World) {
    return world.cat.y - SIM.catH;
  }
}

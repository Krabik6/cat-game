import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, RUN, WEIGHT } from '../config';
import { Weight } from '../systems/Weight';

export type ItemKind = 'kibble' | 'can';

const ROOF_MIN_Y = 300;
const ROOF_MAX_Y = 470;

/**
 * Генерирует крыши и еду справа за экраном. Все объекты мира едут влево
 * со скоростью кота; сцена обновляет скорость каждый кадр.
 */
export class LevelGenerator {
  readonly roofs: Phaser.Physics.Arcade.Group;
  readonly items: Phaser.Physics.Arcade.Group;
  /** Правый край последней крыши в мировых координатах экрана. */
  private lastRight = 0;
  private lastY = 440;
  private goalSpawned = false;

  constructor(private scene: Phaser.Scene) {
    const groupCfg = { allowGravity: false, immovable: true };
    this.roofs = scene.physics.add.group(groupCfg);
    this.items = scene.physics.add.group(groupCfg);
  }

  /** Стартовая длинная крыша под котом. */
  start() {
    this.addRoof(-40, this.lastY, 900);
  }

  update(dx: number, speed: number, traveled: number) {
    this.lastRight -= dx;
    for (const group of [this.roofs, this.items]) {
      group.getChildren().forEach((obj) => {
        const go = obj as Phaser.GameObjects.Rectangle;
        const body = go.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(-speed);
        if (go.x + go.displayWidth < -100) go.destroy();
      });
    }
    while (this.lastRight < GAME_WIDTH + 200 && !this.goalSpawned) {
      this.spawnNext(traveled);
    }
  }

  private spawnNext(traveled: number) {
    const ahead = traveled + (this.lastRight - RUN.catX);
    const goalPx = RUN.goalMeters * RUN.pxPerMeter;
    // Сложность растёт к финишу: 0 в начале, 1 у цели.
    const difficulty = Phaser.Math.Clamp(ahead / goalPx, 0, 1);

    const w = WEIGHT.designWeight;
    const maxRise = Weight.jumpHeight(w) * 0.6;
    const y = Phaser.Math.Clamp(this.lastY + Phaser.Math.Between(-Math.round(maxRise), 90), ROOF_MIN_Y, ROOF_MAX_Y);
    // На подъём лететь дольше по высоте и короче по дальности.
    const riseFactor = y < this.lastY ? 0.7 : 1;
    const maxGap = Weight.jumpDistance(w) * Phaser.Math.Linear(0.55, 1, difficulty) * riseFactor;
    const gap = Phaser.Math.Between(60, Math.max(70, Math.round(maxGap)));

    if (ahead >= goalPx) {
      this.goalSpawned = true;
      const roof = this.addRoof(this.lastRight + gap, y, 1400);
      roof.setData('goal', true);
      this.addItem('can', roof.x + 300, y - 40).setData('goal', true);
      return;
    }

    const width = Phaser.Math.Between(260, 640);
    const x = this.lastRight + gap;
    this.arcOverGap(this.lastRight, this.lastY, x, y);
    this.addRoof(x, y, width);
    this.decorateRoof(x, y, width, difficulty);
    this.lastY = y;
  }

  private addRoof(x: number, y: number, width: number) {
    const roof = this.scene.add.rectangle(x, y, width, GAME_HEIGHT - y + 40, 0x111111).setOrigin(0);
    this.roofs.add(roof);
    (roof.body as Phaser.Physics.Arcade.Body).setImmovable(true).setAllowGravity(false);
    roof.setData('kind', 'roof');
    this.lastRight = x + width;
    return roof;
  }

  /** Дорожка корма по дуге над промежутком — подсказка траектории. */
  private arcOverGap(x0: number, y0: number, x1: number, y1: number) {
    if (Math.random() < 0.4) return;
    const n = 4;
    const peak = Math.min(y0, y1) - 70;
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      const x = Phaser.Math.Linear(x0, x1, t);
      const yLine = Phaser.Math.Linear(y0, y1, t);
      const y = yLine - 4 * t * (1 - t) * (yLine - peak) - 30;
      this.addItem('kibble', x, y);
    }
  }

  private decorateRoof(x: number, y: number, width: number, difficulty: number) {
    const r = Math.random();
    if (r < 0.35) {
      const count = Math.floor(width / 70);
      const startX = x + Phaser.Math.Between(40, 80);
      for (let i = 0; i < count - 1; i++) this.addItem('kibble', startX + i * 50, y - 30);
    }
    // Консервы реже ближе к финишу: соблазн сильнее, когда прыжки сложнее.
    if (Math.random() < Phaser.Math.Linear(0.35, 0.22, difficulty)) {
      this.addItem('can', x + width * Phaser.Math.FloatBetween(0.4, 0.8), y - 26);
    }
  }

  private addItem(kind: ItemKind, x: number, y: number) {
    const item = this.scene.physics.add.image(x, y, kind);
    this.items.add(item);
    (item.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setImmovable(true);
    item.setData('kind', kind);
    return item;
  }
}

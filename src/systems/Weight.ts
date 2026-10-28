import Phaser from 'phaser';
import { WEIGHT } from '../config';

const lerp = (range: readonly [number, number], w: number) => Phaser.Math.Linear(range[0], range[1], w);

export type CatStage = 'light' | 'normal' | 'heavy';

/** Вес кота 0..1 и всё, что от него зависит. */
export class Weight {
  value: number = WEIGHT.start;

  add(amount: number) {
    this.value = Phaser.Math.Clamp(this.value + amount, 0, 1);
  }

  burn(dtSec: number) {
    this.add(-WEIGHT.burnPerSec * dtSec);
  }

  get stage(): CatStage {
    return this.value < 0.34 ? 'light' : this.value < 0.67 ? 'normal' : 'heavy';
  }

  static speed(w: number) {
    return lerp(WEIGHT.speed, w);
  }

  static jumpVelocity(w: number) {
    return lerp(WEIGHT.jumpVelocity, w);
  }

  static gravity(w: number) {
    return lerp(WEIGHT.gravity, w);
  }

  /** Максимальная высота прыжка при весе w. */
  static jumpHeight(w: number) {
    const v = Weight.jumpVelocity(w);
    return (v * v) / (2 * Weight.gravity(w));
  }

  /** Горизонтальная дальность прыжка на ту же высоту при весе w. */
  static jumpDistance(w: number) {
    return ((2 * Weight.jumpVelocity(w)) / Weight.gravity(w)) * Weight.speed(w);
  }
}

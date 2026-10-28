import Phaser from 'phaser';
import { CSS, RENDER_SCALE, VIEW_H, VIEW_W } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { SelectScene } from './scenes/SelectScene';
import { TitleScene } from './scenes/TitleScene';
import { UIScene } from './scenes/UIScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W * RENDER_SCALE,
  height: VIEW_H * RENDER_SCALE,
  backgroundColor: CSS.paper,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, TitleScene, SelectScene, GameScene, UIScene],
});

if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => undefined));
}

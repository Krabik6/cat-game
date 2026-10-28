import Phaser from 'phaser';
import { CSS, GAME_HEIGHT, GAME_WIDTH, RUN } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: CSS.paper,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: RUN.gravity } } },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, GameScene],
});

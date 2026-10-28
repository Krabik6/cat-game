import { LevelBuilder } from '../sim/builder';

/** 1. はじめの一歩 — прыжки и главное правило: еда делает тяжелее. */
export function level1() {
  const b = new LevelBuilder({
    id: 'l1',
    index: 1,
    name: 'はじめの一歩',
    nameEn: 'FIRST STEPS',
    blurb: '食べると重くなる。重いと低くしか跳べない。',
    speed: 270,
    startWeight: 0.1,
    targetPoints: 24,
  });
  b.roof(720, 440).sign(330, 'タップでジャンプ', 'TAP TO JUMP · HOLD = HIGHER');
  b.row('kkkk', 420);
  b.gapArc(110, 'kkk', 70).roof(420, 440).row('kkk', 120);
  b.gap(130).roof(520, 390).row('kkkkk', 80).row('c', 400, { dy: -26 });
  b.sign(250, '食べると重くなる', 'EAT = HEAVIER');
  b.gapArc(150, 'kkk', 80, 420).roof(460, 420).row('kkk.kkk', 60);
  b.gap(120).roof(380, 360).sign(150, '重いと低く跳ぶ', 'HEAVY = LOWER JUMPS');
  b.row('c', 250, { dy: -26 });
  b.gap(140).roof(420, 400).row('kkkk', 100);
  b.gapArc(130, 'kk', 60).roof(520, 400).row('kkk', 120);
  return b.goal([0.3, 0.7]);
}

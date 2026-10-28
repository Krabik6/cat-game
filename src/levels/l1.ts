import { LevelBuilder } from '../sim/builder';

/** 1. はじめの一歩 — прыжки и главное правило: чем больше ешь, тем больше кот. */
export function level1() {
  const b = new LevelBuilder({
    id: 'l1',
    index: 1,
    name: 'はじめの一歩',
    nameEn: 'FIRST STEPS',
    blurb: '食べるほど、大きくなる。',
    speed: 270,
    startWeight: 0.1,
    targetPoints: 30,
  });
  b.roof(720, 440).sign(330, 'タップでジャンプ', 'TAP TO JUMP · HOLD = HIGHER');
  b.row('kkkk', 420);
  b.gapArc(120, 'kkk', 70).roof(480, 440).row('kkkk', 80).row('c', 360);
  b.sign(200, '食べるほど大きくなる', 'EAT MORE = GROW BIGGER');
  b.gap(130).roof(560, 400).checkpoint(60);
  b.row('kkkkk', 120, { step: 36 }).row('kkkkk', 120, { step: 36, dy: -52 });
  b.sign(420, '大きいと二段まで取れる', 'BIG CAT = BIG BITES');
  // 鈴: высоко над промежутком — нужен полный прыжок.
  b.gapArc(150, 'kbk', 130).roof(460, 400).row('kkk', 80).row('c', 330);
  b.gap(120).roof(420, 350).row('kkkk', 80, { dy: -24 }).row('kkkk', 80, { dy: -52 });
  b.gap(140).roof(480, 400).checkpoint(60).row('kkk', 140);
  b.item('bell', b.x - 120, 400 - 150);
  b.gapArc(130, 'kk', 60).roof(420, 360).row('cc', 100, { step: 120 });
  b.gap(120).roof(300, 300).at('bell', 150, 140);
  b.gap(120).roof(520, 380).row('kkkk', 60).row('kkkk', 60, { dy: -52 });
  return b.goal();
}

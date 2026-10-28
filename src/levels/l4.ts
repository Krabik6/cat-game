import { LevelBuilder } from '../sim/builder';

/** 4. ビル風 — восходящий поток между домами держит только лёгкого кота. */
export function level4() {
  const b = new LevelBuilder({
    id: 'l4',
    index: 4,
    name: 'ビル風',
    nameEn: 'UPDRAFT',
    blurb: '風は軽い猫を空へ運ぶ。',
    startWeight: 0.2,
    targetPoints: 15,
  });
  b.roof(700, 420).sign(240, 'ビル風は軽い猫を運ぶ', 'UPDRAFTS LIFT CATS UNDER 40%').row('kkk', 420);
  b.vent(420, 200);
  b.arc('kkk', b.x - 420, 300, b.x, 300, 60);
  b.roof(420, 330).row('kk', 120).row('c', 300);
  b.gap(120).roof(380, 380).row('kkkk', 60);
  b.vent(480, 160);
  b.arc('k.k.k', b.x - 480, 240, b.x, 260, 80);
  b.roof(360, 300).row('t', 200);
  b.gap(110).roof(460, 360).row('c.c', 100, { step: 120 });
  b.vent(520, 180);
  b.arc('kkkk', b.x - 520, 280, b.x, 280, 90);
  b.roof(380, 320).row('kkk', 100);
  b.gap(120).roof(400, 380);
  return b.goal([0, 0.35]);
}

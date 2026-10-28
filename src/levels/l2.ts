import { LevelBuilder } from '../sim/builder';

/** 2. 電線 — провода держат только лёгкого кота: еда на них опасна. */
export function level2() {
  const b = new LevelBuilder({
    id: 'l2',
    index: 2,
    name: '電線',
    nameEn: 'WIRES',
    blurb: '電線は軽い猫しか支えない。',
    startWeight: 0.2,
    targetPoints: 22,
  });
  b.roof(700, 420).sign(260, '電線は軽い猫だけ', 'WIRES HOLD LIGHT CATS').row('kkk', 420);
  b.wire(380, 0.4, 'k.k').roof(440, 420).row('kk', 40).row('c', 280);
  b.wire(420, 0.4, 'kkk').roof(300, 420);
  b.gap(120).roof(420, 380).row('kkkk', 80);
  b.wire(460, 0.45, 'k.c.k').roof(380, 380).row('t', 220);
  b.sign(80, 'ねこじゃらしで軽くなる', 'CAT TOY = −20%');
  b.gapArc(140, 'kkk', 80, 400).roof(420, 400).row('c.c.c', 80, { step: 50 });
  b.wire(520, 0.35, 'kkkk').roof(320, 400);
  b.gapArc(130, 'kk', 70).roof(400, 400).row('kkk', 120);
  return b.goal([0.2, 0.45]);
}

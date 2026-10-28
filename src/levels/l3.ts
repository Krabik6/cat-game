import { LevelBuilder } from '../sim/builder';

/** 3. 段ボール — тяжёлый кот проламывает ящики, а в них спрятано лучшее. */
export function level3() {
  const b = new LevelBuilder({
    id: 'l3',
    index: 3,
    name: '段ボール',
    nameEn: 'CRASH BOXES',
    blurb: '重い猫は箱をこわして進む。',
    startWeight: 0.2,
    targetPoints: 50,
  });
  b.roof(820, 430).sign(220, '重いと箱をこわせる', 'HEAVY CAT SMASHES BOXES');
  b.row('kkkk', 400).crate(640, 0.3, 'kk');
  b.gap(120).roof(620, 430).row('c.c', 60, { step: 70 }).crate(330, 0.4, 'kkk').crate(480, 0.4, 'kk');
  b.gapArc(140, 'kkk', 70).roof(640, 400).checkpoint(60).row('kk', 150);
  b.crates(260, 3, 0.5, 44, 'b');
  b.row('kkk', 470);
  b.gap(130).roof(500, 400).row('cc', 80, { step: 100 }).crate(380, 0.55, 'ccc', { h: 56, w: 56 });
  b.gap(130).roof(600, 360).checkpoint(60).row('kkk', 120).crates(300, 2, 0.6, 44, 'kk');
  b.gap(300).roof(560, 360).row('t', 100).crate(300, 0.5, 'b');
  b.row('kkk', 420);
  b.gap(130).roof(520, 400).row('cc', 80, { step: 80 }).crates(300, 4, 0.65, 44, 'b');
  b.gap(130).roof(400, 400).row('kkkk', 80);
  return b.goal();
}

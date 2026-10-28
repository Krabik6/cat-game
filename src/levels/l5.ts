import { LevelBuilder } from '../sim/builder';

/** 5. 体重計 — мост опускается только под тяжёлым котом, а дальше провода. */
export function level5() {
  const b = new LevelBuilder({
    id: 'l5',
    index: 5,
    name: '体重計',
    nameEn: 'WEIGH-IN',
    blurb: '橋は重い猫にだけ降りる。',
    startWeight: 0.15,
    targetPoints: 42,
  });
  b.roof(800, 420).sign(200, '体重計：50%以上で橋', 'SCALE: ≥ 50% LOWERS THE BRIDGE');
  b.row('kkkk', 120).row('c.c.c', 340, { step: 70 });
  b.bridge(300, 0.5).roof(460, 420).row('kkk', 100);
  b.gap(120).roof(400, 400).row('t', 200);
  b.wire(420, 0.4, 'k.k').roof(520, 400).row('cc', 80, { step: 80 }).row('kkk', 300);
  b.bridge(320, 0.6).roof(420, 400);
  b.gap(110).roof(380, 360).row('kkkk', 80);
  b.gap(100).roof(440, 380).row('tt', 140, { step: 140 });
  b.vent(440, 200);
  b.arc('kkk', b.x - 440, 300, b.x, 300, 60);
  b.roof(460, 330).row('c.kk', 100);
  return b.goal([0.35, 0.6]);
}

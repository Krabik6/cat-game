import { LevelBuilder } from '../sim/builder';

/** 6. 体重計 — мост опускается только под тяжёлым котом. */
export function level6() {
  const b = new LevelBuilder({
    id: 'l6',
    index: 6,
    name: '体重計',
    nameEn: 'WEIGH-IN',
    blurb: '重ければ橋がおりる。軽ければ、ぴょん。',
    startWeight: 0.3,
    targetPoints: 44,
  });
  b.roof(820, 400).sign(200, '重いと橋がおりる', 'HEAVY CAT OPENS THE BRIDGE');
  b.row('kk', 400).row('c', 520);
  b.bridge(280, 0.4).at('bell', 140, 26);
  b.roof(560, 400).row('kkk', 100).row('cc', 340, { step: 70 });
  b.bridge(300, 0.6).at('bell', 150, 26);
  b.roof(520, 400).checkpoint(60).row('kkkk', 120);
  b.gap(130).roof(460, 340).row('t.k', 80, { step: 60 }).row('cc', 300, { step: 70 });
  b.sign(80, 'ダメならぴょん', 'TOO LIGHT? AIR JUMP');
  b.bridge(300, 0.5).roof(500, 340).checkpoint(60).row('kkk', 120);
  b.crate(220, 0.55, 'cc', { w: 56, h: 56 });
  b.bridge(300, 0.75).at('bell', 150, 26);
  b.roof(440, 340).row('kkkk', 100);
  return b.goal();
}

import { LevelBuilder } from '../sim/builder';

/** 8. むちねこタワー — финал: набирать и тратить вес снова и снова. */
export function level8() {
  const b = new LevelBuilder({
    id: 'l8',
    index: 8,
    name: 'むちねこタワー',
    nameEn: 'MUCHI TOWER',
    blurb: '食べて、こわして、跳んで。',
    startWeight: 0.2,
    targetPoints: 70,
  });
  b.roof(640, 430).row('kkkkk', 200);
  b.wireRoad(600, 0.35, 'k.k.k', 'cc').at('bell', 300, 40);
  b.roof(700, 430).checkpoint(60).row('c.c', 100, { step: 110 }).crate(400, 0.5, 'kk').futonEnd();
  b.roof(420, 230).row('kkk', 100);
  b.gapArc(300, 'kkkkk', 100, 300).roof(500, 300).row('cc', 100, { step: 80 }).crates(220, 3, 0.65, 44, 'b');
  b.bridge(320, 0.7).at('bell', 160, 26);
  b.roof(440, 300).checkpoint(60).row('kkk', 100);
  b.gap(120).roof(420, 360).row('t', 200);
  b.wireRoad(640, 0.3, 'kkk.kkk', 'c.c').roof(640, 360).checkpoint(60).row('c.c.c', 60, { step: 60 }).futonEnd();
  b.roof(420, 170).row('kkkk', 80).at('bell', 200, 70);
  b.gap(110).roof(400, 300);
  b.gap(110).roof(460, 380).row('t.kkk', 80);
  return b.goal();
}

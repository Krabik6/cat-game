import { LevelBuilder } from '../sim/builder';

/** 8. むちねこタワー — финал: вес приходится менять снова и снова. */
export function level8() {
  const b = new LevelBuilder({
    id: 'l8',
    index: 8,
    name: 'むちねこタワー',
    nameEn: 'MUCHI TOWER',
    blurb: 'ちょうどいい重さで、ゴールへ。',
    startWeight: 0.2,
    targetPoints: 58,
  });
  b.roof(640, 430).row('kkkkk', 200);
  b.wire(400, 0.35, 'k.k').roof(700, 430).row('c.c.c', 100, { step: 110 });
  b.futonEnd().roof(420, 230).row('kkk', 100);
  b.gap(110).roof(500, 340).row('ttt', 140, { step: 80 });
  b.vent(460, 170);
  b.arc('kkkk', b.x - 460, 270, b.x, 270, 80);
  b.roof(440, 300).row('cc.c', 80, { step: 60 });
  b.bridge(320, 0.55).roof(420, 300).row('kkk', 100);
  b.gap(120).roof(420, 360).row('t', 200);
  b.wire(440, 0.4, 'kkk').roof(640, 360).row('c.c.c', 60, { step: 60 }).futonEnd();
  b.roof(420, 170).row('kkkk', 80);
  b.gap(110).roof(400, 300);
  b.gap(110).roof(460, 380).row('t.kkk', 80);
  return b.goal([0.45, 0.55]);
}

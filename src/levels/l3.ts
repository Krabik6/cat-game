import { LevelBuilder } from '../sim/builder';

/** 3. ふとん — футон подбрасывает тяжёлого кота выше: надо наесться. */
export function level3() {
  const b = new LevelBuilder({
    id: 'l3',
    index: 3,
    name: 'ふとん',
    nameEn: 'FUTONS',
    blurb: 'ふとんは重いほど高く跳ねる。',
    startWeight: 0.3,
    targetPoints: 45,
  });
  b.roof(900, 440).sign(200, 'ふとんは重いほど跳ねる', 'FUTON: HEAVIER = HIGHER');
  b.row('kkkk', 300).row('c.c', 520, { step: 60 }).futonEnd();
  b.roof(520, 250).row('kkk', 120);
  b.gap(110).roof(700, 440).row('c..c', 80, { step: 60 }).row('kkk', 330).futonEnd();
  b.roof(460, 230).row('kkkk', 80);
  b.gap(100).roof(440, 320).row('kkk', 120);
  b.gapArc(130, 'kkk', 60, 420).roof(700, 420).row('cc', 120, { step: 70 }).futonEnd();
  b.roof(480, 190).row('kkkk', 100);
  b.gap(110).roof(400, 300).row('t.t', 120, { step: 120 });
  b.gap(110).roof(460, 380).row('kkk', 100);
  return b.goal([0.5, 0.85]);
}

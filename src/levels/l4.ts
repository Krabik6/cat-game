import { LevelBuilder } from '../sim/builder';

/** 4. ふとん — футон подбрасывает тем выше, чем кот тяжелее. */
export function level4() {
  const b = new LevelBuilder({
    id: 'l4',
    index: 4,
    name: 'ふとん',
    nameEn: 'FUTONS',
    blurb: 'ふとんは重いほど高く跳ねる。',
    startWeight: 0.25,
    targetPoints: 50,
  });
  b.roof(900, 440).sign(200, 'ふとんは重いほど跳ねる', 'FUTON: HEAVIER = HIGHER');
  b.row('kkkk', 300).row('c.c', 520, { step: 60 }).futonEnd();
  b.roof(520, 260).row('kkk', 120).at('bell', 300, 120);
  b.gap(110).roof(700, 440).checkpoint(60).row('c..c', 80, { step: 60 }).row('kkk', 330).futonEnd();
  b.roof(460, 230).row('kkkk', 80);
  b.gap(110).roof(640, 360).row('cc', 100, { step: 70 }).futon(300).row('kkk', 470);
  // Над футоном посреди крыши: подбросит — бери колокольчик.
  b.item('bell', b.x - 640 + 332, 360 - 230);
  b.gapArc(130, 'kkk', 60, 420).roof(700, 420).checkpoint(60).row('cc', 120, { step: 70 }).futonEnd();
  b.roof(480, 170).row('kkkk', 100).at('bell', 260, 60);
  b.gap(110).roof(400, 300).row('t.k', 120, { step: 60 });
  b.gap(110).roof(460, 380).row('kkk', 100);
  return b.goal();
}

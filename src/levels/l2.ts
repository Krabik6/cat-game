import { LevelBuilder } from '../sim/builder';

/** 2. ぴょん — прыжок в воздухе тратит вес: еда — это топливо. */
export function level2() {
  const b = new LevelBuilder({
    id: 'l2',
    index: 2,
    name: 'ぴょん',
    nameEn: 'AIR JUMP',
    blurb: '空中でもう一回ジャンプ。体重を8%使う。',
    startWeight: 0.3,
    targetPoints: 32,
  });
  b.roof(760, 430).sign(320, '空中でもう一回タップ', 'TAP AGAIN IN THE AIR · COSTS 8%');
  b.row('kkk', 560);
  b.gapArc(290, 'kkkkk', 120).roof(500, 430).row('cc', 120, { step: 140 });
  b.sign(300, '食べたぶんだけ跳べる', 'FOOD = FUEL');
  b.gapArc(300, 'kkbkk', 200).roof(480, 400).checkpoint(60).row('kkk', 200);
  b.gap(130).roof(360, 330).row('c', 180);
  b.gapArc(310, 'kkkkk', 150, 360).roof(520, 360).row('kkk', 100).row('c', 380);
  b.gap(300).roof(440, 300).checkpoint(80).row('kkkk', 120);
  b.at('bell', 340, 230);
  b.gap(140).roof(400, 380).row('cc', 100, { step: 120 });
  b.gapArc(320, 'kkkkk', 130, 340).roof(380, 340).row('kkk', 100);
  b.gap(120).roof(300, 260).at('bell', 150, 200);
  b.gap(260).roof(520, 400).row('kkkk', 80);
  return b.goal();
}

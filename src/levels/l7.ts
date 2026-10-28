import { LevelBuilder } from '../sim/builder';

/** 7. 夜の街 — ночью быстрее, и все механики подряд. */
export function level7() {
  const b = new LevelBuilder({
    id: 'l7',
    index: 7,
    name: '夜の街',
    nameEn: 'NIGHT RUN',
    blurb: '夜は速い。迷う時間はない。',
    speed: 320,
    startWeight: 0.3,
    targetPoints: 50,
    night: true,
  });
  b.roof(700, 400).row('kkk', 300).crate(540, 0.35, 'kk');
  b.wireRoad(640, 0.4, 'k.k.k', 'c.c').at('bell', 320, 40);
  b.roof(620, 400).checkpoint(60).row('cc', 80, { step: 90 }).futonEnd(210);
  b.roof(460, 220).row('kkkk', 80);
  b.gapArc(300, 'kkkkk', 120, 320).roof(460, 320).row('c.c', 60, { step: 140 });
  b.bridge(300, 0.55).at('bell', 150, 26);
  b.roof(460, 320).checkpoint(60).row('kkk', 80).crates(300, 3, 0.6, 44, 'kk');
  b.gap(130).roof(420, 380).row('t', 120).row('kk', 260);
  b.gap(300).roof(400, 320).at('bell', 200, 160);
  b.gap(130).roof(460, 380).row('kkkk', 100);
  return b.goal();
}

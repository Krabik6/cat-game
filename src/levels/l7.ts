import { LevelBuilder } from '../sim/builder';

/** 7. 夜の街 — ночью быстрее, и все механики подряд. */
export function level7() {
  const b = new LevelBuilder({
    id: 'l7',
    index: 7,
    name: '夜の街',
    nameEn: 'NIGHT RUN',
    blurb: '夜は速い。迷う時間はない。',
    speed: 340,
    startWeight: 0.3,
    targetPoints: 36,
    night: true,
  });
  b.roof(700, 420).row('kkk', 300).row('c', 520);
  b.wire(420, 0.45, 'kk').roof(560, 420).row('cc', 60, { step: 90 }).futonEnd(210);
  b.roof(460, 220).row('kkkk', 80);
  b.gap(120).roof(380, 340).row('tt', 100, { step: 120 });
  b.vent(460, 180);
  b.arc('kkk', b.x - 460, 280, b.x, 280, 70);
  b.roof(420, 320).row('c.c', 60, { step: 140 });
  b.bridge(300, 0.5).roof(380, 320).row('kkk', 80);
  b.gap(120).roof(400, 380).row('t', 220);
  b.wire(480, 0.35, 'kkkk').roof(420, 380);
  return b.goal([0.2, 0.5]);
}

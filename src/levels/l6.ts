import { LevelBuilder } from '../sim/builder';

/** 6. ふたつの道 — лёгкий идёт верхом по проводу, тяжёлый проваливается вниз и выбирается футоном. */
export function level6() {
  const b = new LevelBuilder({
    id: 'l6',
    index: 6,
    name: 'ふたつの道',
    nameEn: 'TWO ROADS',
    blurb: '軽ければ上の道、重ければ下の道。',
    startWeight: 0.25,
    targetPoints: 30,
  });
  b.roof(700, 400).row('kkkk', 200).row('c', 500);
  b.gap(110).roof(420, 280).sign(120, '上は軽い猫の道', 'UPPER ROAD: LIGHT CATS');
  const fork = b.x;
  // Верхняя дорога: длинный провод, корм на нём приближает обрыв.
  b.wire(1120, 0.35, 'k.k.k.k.k.k');
  const merge = b.x;
  // Нижняя дорога под проводом: консервы и футон обратно наверх.
  b.x = fork;
  b.roof(520, 470).row('c.c', 160, { step: 120 });
  b.gap(100).roof(merge - fork - 620, 470).row('kk', 80).futonEnd(200);
  b.x = merge;
  b.roof(560, 280).row('t', 80).row('cc', 300, { step: 70 }).sign(160, 'ここで合流', 'ROADS MEET');
  b.bridge(300, 0.45).roof(420, 280).row('kkk', 100);
  b.gap(120).roof(400, 340).row('t.kk', 80);
  return b.goal([0.3, 0.6]);
}

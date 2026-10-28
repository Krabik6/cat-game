import { LevelBuilder } from '../sim/builder';

/** 5. 電線 — поверху ходят лёгкие, понизу тяжёлые. Оба пути выгодны по-своему. */
export function level5() {
  const b = new LevelBuilder({
    id: 'l5',
    index: 5,
    name: '電線',
    nameEn: 'WIRES',
    blurb: '上は軽い猫の道、下は重い猫の道。',
    startWeight: 0.25,
    targetPoints: 40,
  });
  b.roof(760, 380).sign(250, '電線は軽い猫だけ', 'WIRES HOLD LIGHT CATS');
  b.row('kkk', 470);
  b.wireRoad(760, 0.4, 'k.k.k.k', 'c..c').at('bell', 380, 40);
  b.roof(520, 380).checkpoint(60).row('cc', 100, { step: 80 });
  b.sign(330, 'ぴょんで体重を落とす', 'AIR JUMP = LOSE WEIGHT');
  b.wireRoad(820, 0.35, 'k.k.k.k.k', 'cc..c').at('bell', 410, 40);
  b.roof(560, 380).checkpoint(60).row('t', 160).row('kkk', 300);
  b.wireRoad(700, 0.3, 'kk.kk.kk', 'c.c').at('bell', 350, 40);
  b.roof(480, 380).row('kkkk', 120);
  return b.goal();
}

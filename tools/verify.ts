import { LEVELS } from '../src/levels';
import { policyRun, replay, solve } from './solver';
import { writeFileSync } from 'node:fs';
import { World } from '../src/sim/world';

const only = process.argv[2];
const traces: Record<string, number[]> = {};
for (const make of LEVELS) {
  const lv = make();
  if (only && lv.id !== only) continue;
  const t0 = Date.now();
  const r = solve(lv);
  const ms = Date.now() - t0;
  const never = policyRun(lv, () => ({ jump: false, down: false }));
  const pct = (w: number) => `${Math.round(w * 100)}%`;
  console.log(
    `${lv.id} ${lv.nameEn.padEnd(16)} finishes=${String(r.finishes).padStart(6)} maxPts=${r.maxPoints}/${lv.targetPoints}` +
      ` w@goal=${pct(r.minWeight)}..${pct(r.maxWeight)} bells=${r.maxBells}/${new World(lv).bellsTotal}` +
      ` 3★=${r.threeStar ? `yes(${r.threeStar.points}pts,${pct(r.threeStar.weight)})` : 'NO'} noJump=${never.status}@${never.distance}m ${ms}ms`,
  );
  const deaths = Object.entries(r.deathsAt).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (!r.finishes) console.log(`   furthest x=${r.furthest.x} weights ${r.furthest.weights}`);
  console.log('   hardest:', deaths.map(([k, v]) => `${k}×${v}`).join('  '));
  if (r.threeStar) {
    const rr = replay(lv, r.threeStar.actions);
    if (!rr.stars.every(Boolean)) console.log('   !! replay mismatch', rr);
    traces[lv.id] = r.threeStar.actions;
  }
}
if (!only) writeFileSync('tools/traces.json', JSON.stringify(traces));

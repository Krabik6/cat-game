import { CSS } from '../config';

const KIBBLE_BROWN = '#5E5249';
const KIBBLE_LIGHT = '#857868';

function nugget(x: number, y: number, rot: number) {
  return `<g transform="rotate(${rot} ${x} ${y})">
    <ellipse cx="${x}" cy="${y}" rx="7" ry="6" fill="${KIBBLE_BROWN}"/>
    <ellipse cx="${x - 2}" cy="${y - 2}" rx="2.6" ry="1.6" fill="${KIBBLE_LIGHT}"/>
  </g>`;
}

/** カリカリ — три зёрнышка корма. */
export const kibbleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" viewBox="0 0 30 24">
  ${nugget(8, 16, -10)}${nugget(22, 16, 15)}${nugget(15, 7, 5)}
</svg>`;

/** ねこ缶 — банка с котом на этикетке и бликами. */
export const canSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
  <g stroke="${CSS.ink}" stroke-width="2" stroke-linecap="round">
    <line x1="10" y1="10" x2="6" y2="4"/><line x1="24" y1="7" x2="24" y2="1"/><line x1="38" y1="10" x2="42" y2="4"/>
  </g>
  <rect x="5" y="18" width="38" height="34" rx="4" fill="${CSS.gray}" stroke="${CSS.ink}" stroke-width="2.2"/>
  <rect x="5" y="23" width="38" height="24" fill="${CSS.sand}" stroke="${CSS.ink}" stroke-width="1.6"/>
  <ellipse cx="24" cy="18" rx="19" ry="4.5" fill="${CSS.stone}" stroke="${CSS.ink}" stroke-width="2.2"/>
  <ellipse cx="24" cy="18" rx="12" ry="2.4" fill="none" stroke="${CSS.gray}" stroke-width="1.4"/>
  <path d="M16 31 L17.5 26 L21 29 L27 29 L30.5 26 L32 31 Q34 40 24 41 Q14 40 16 31 Z" fill="${CSS.paper}" stroke="${CSS.ink}" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="21" cy="34" r="1.1" fill="${CSS.ink}"/><circle cx="27" cy="34" r="1.1" fill="${CSS.ink}"/>
  <path d="M23 36.5 h2 l-1 1.2 z" fill="${CSS.ink}"/>
</svg>`;

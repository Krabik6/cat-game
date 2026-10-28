import { CSS } from '../config';

const INK = CSS.ink;
const KIBBLE = '#6A5D52';
const KIBBLE_HI = '#8C7E70';

function nugget(x: number, y: number, rot: number) {
  return `<g transform="rotate(${rot} ${x} ${y})">
    <path d="M${x - 7},${y} q0,-6 7,-6 q7,0 7,6 q0,5 -7,5 q-7,0 -7,-5 z" fill="${KIBBLE}"/>
    <ellipse cx="${x - 2}" cy="${y - 2.5}" rx="2.6" ry="1.4" fill="${KIBBLE_HI}"/>
  </g>`;
}

/** カリカリ: три зёрнышка, как на референсе. */
export const kibbleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 26">
  ${nugget(9, 17, -12)}${nugget(23, 17, 14)}${nugget(16, 8, 4)}
</svg>`;

/** ねこ缶: серая банка, белая этикетка с котом, блики над крышкой. */
export const canSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 52">
  <g stroke="${INK}" stroke-width="1.8" stroke-linecap="round">
    <line x1="9" y1="9" x2="5" y2="3"/><line x1="23" y1="6" x2="23" y2="0.5"/><line x1="37" y1="9" x2="41" y2="3"/>
  </g>
  <path d="M4 17 v26 q0 6 19 6 q19 0 19 -6 v-26 z" fill="${CSS.gray}" stroke="${INK}" stroke-width="2"/>
  <path d="M4 22 h38 v18 q-19 4 -38 0 z" fill="${CSS.paper}" stroke="${INK}" stroke-width="1.4"/>
  <ellipse cx="23" cy="17" rx="19" ry="5" fill="${CSS.stone}" stroke="${INK}" stroke-width="2"/>
  <ellipse cx="23" cy="17" rx="13" ry="2.6" fill="none" stroke="${CSS.gray}" stroke-width="1.3"/>
  <g transform="translate(23 32)">
    <path d="M-7 -1 l1.5 -5 l3.5 3 h4 l3.5 -3 l1.5 5 q1.5 7 -7 7.5 q-8.5 -0.5 -7 -7.5 z" fill="${CSS.paper}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="-2.6" cy="1.2" r="0.9" fill="${INK}"/><circle cx="2.6" cy="1.2" r="0.9" fill="${INK}"/>
  </g>
</svg>`;

/** ねこじゃらし: изогнутый стебель с пушистым колоском. */
export const toySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52">
  <path d="M14 50 q2 -18 10 -30" fill="none" stroke="${CSS.charcoal}" stroke-width="2.2" stroke-linecap="round"/>
  <g transform="rotate(28 26 14)">
    <path d="M26 2 q7 4 6 12 q-1 9 -6 12 q-5 -3 -6 -12 q-1 -8 6 -12 z" fill="${CSS.stone}" stroke="${INK}" stroke-width="1.6"/>
    <g stroke="${INK}" stroke-width="1.1" stroke-linecap="round">
      <line x1="26" y1="5" x2="22" y2="2"/><line x1="26" y1="5" x2="30" y2="2"/>
      <line x1="26" y1="11" x2="20" y2="8"/><line x1="26" y1="11" x2="32" y2="8"/>
      <line x1="26" y1="17" x2="20" y2="15"/><line x1="26" y1="17" x2="32" y2="15"/>
    </g>
  </g>
  <path d="M7 30 l-5 -2 M8 36 l-6 1 M10 24 l-4 -4" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

/** ふとん: полосатый матрас, сложенный валиком. */
export const futonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 22">
  <rect x="1.5" y="5" width="69" height="15" rx="6" fill="${CSS.paper}" stroke="${INK}" stroke-width="2"/>
  <g fill="${CSS.stone}">
    <rect x="12" y="6.2" width="5" height="12.6"/><rect x="25" y="6.2" width="5" height="12.6"/>
    <rect x="38" y="6.2" width="5" height="12.6"/><rect x="51" y="6.2" width="5" height="12.6"/>
  </g>
  <rect x="1.5" y="5" width="69" height="15" rx="6" fill="none" stroke="${INK}" stroke-width="2"/>
  <path d="M8 5 q28 -6 56 0" fill="none" stroke="${INK}" stroke-width="1.6"/>
</svg>`;

/** 体重計: платформа весов и циферблат; стрелка — отдельный спрайт. */
export const scaleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="30" y="32" width="4" height="22" fill="${INK}"/>
  <circle cx="32" cy="22" r="19" fill="${CSS.paper}" stroke="${INK}" stroke-width="2.4"/>
  <circle cx="32" cy="22" r="14.5" fill="none" stroke="${CSS.stone}" stroke-width="1.2"/>
  <rect x="2" y="54" width="60" height="9" rx="2.5" fill="${CSS.sand}" stroke="${INK}" stroke-width="2"/>
  <rect x="10" y="57" width="44" height="3" rx="1.5" fill="${CSS.stone}"/>
</svg>`;

export const needleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 34">
  <path d="M4 1 L6 20 L4 22 L2 20 Z" fill="${INK}"/>
  <circle cx="4" cy="20" r="3" fill="${INK}"/>
</svg>`;

/** Финиш: флаг-шашечки на шесте. */
export const flagSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 110">
  <rect x="4" y="4" width="4" height="106" fill="${INK}"/>
  <circle cx="6" cy="4" r="4" fill="${INK}"/>
  <path d="M8 10 h56 v34 h-56 z" fill="${CSS.paper}" stroke="${INK}" stroke-width="2"/>
  <g fill="${INK}">
    <rect x="8" y="10" width="11" height="11"/><rect x="30" y="10" width="11" height="11"/><rect x="52" y="10" width="12" height="11"/>
    <rect x="19" y="21" width="11" height="12"/><rect x="41" y="21" width="11" height="12"/>
    <rect x="8" y="33" width="11" height="11"/><rect x="30" y="33" width="11" height="11"/><rect x="52" y="33" width="12" height="11"/>
  </g>
</svg>`;

/** Голубь сидит на проводе — для оживления сцены. */
export const pigeonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 24">
  <path d="M6 14 q0 -8 8 -9 q4 -5 8 -1 q2 2 1 4 l4 1 l-4 1 q1 8 -9 9 q-6 0 -8 -5 l-5 1 z" fill="${CSS.gray}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="19" cy="6.5" r="1" fill="${INK}"/>
  <path d="M10 13 q5 -2 8 2" fill="none" stroke="${INK}" stroke-width="1.2"/>
  <path d="M13 20 v3 M17 20 v3" stroke="${INK}" stroke-width="1.2"/>
</svg>`;

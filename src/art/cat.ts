import { CSS } from '../config';

/**
 * Кот в духе референса: мягкий «моти» без шеи, короткие лапки-пеньки,
 * чёрные пятна на спине и макушке, одно ухо серое. Рисуется кодом в SVG
 * для нескольких уровней веса и поз.
 */
export type CatPose = 'run0' | 'run1' | 'run2' | 'run3' | 'jump' | 'fall' | 'sit';
export const RUN_POSES: CatPose[] = ['run0', 'run1', 'run2', 'run3'];
export const CAT_POSES: CatPose[] = [...RUN_POSES, 'jump', 'fall', 'sit'];
/** Уровни веса, для которых рисуются текстуры. */
export const CAT_WEIGHTS = [0, 0.25, 0.5, 0.75, 1] as const;

/** Холст кота в единицах мира; лапы стоят на FEET_Y, центр хитбокса — на CX. */
export const CAT_BOX = { w: 140, h: 100 } as const;
export const CAT_FEET_Y = 92;
export const CAT_CX = 66;

const S = 2.2;
const INK = CSS.ink;

/** Суперэллипс: верх круглее, низ площе — как сидящий на животе кот. */
function blob(cx: number, cy: number, rx: number, ry: number, nTop = 2.3, nBottom = 3.2) {
  const pts: string[] = [];
  const N = 72;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const n = s > 0 ? nBottom : nTop;
    const x = cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Ухо: треугольник со скруглённой вершиной. */
function ear(bx1: number, by1: number, tx: number, ty: number, bx2: number, by2: number, fill: string) {
  const mx1 = bx1 + (tx - bx1) * 0.78;
  const my1 = by1 + (ty - by1) * 0.78;
  const mx2 = bx2 + (tx - bx2) * 0.78;
  const my2 = by2 + (ty - by2) * 0.78;
  return `<path d="M${bx1},${by1} L${mx1},${my1} Q${tx},${ty} ${mx2},${my2} L${bx2},${by2} Z" fill="${fill}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`;
}

/** Лапка-пенёк. angle поворачивает её вокруг верхней точки. */
function paw(x: number, top: number, len: number, angle: number, fill: string) {
  return `<rect x="${(x - 5).toFixed(2)}" y="${top.toFixed(2)}" width="10" height="${len.toFixed(2)}" rx="5"
    fill="${fill}" stroke="${INK}" stroke-width="${S}" transform="rotate(${angle.toFixed(1)} ${x.toFixed(2)} ${(top + 3).toFixed(2)})"/>`;
}

interface PoseSpec {
  /** Смещения и подъём лап: [задняя дальняя, передняя дальняя, задняя ближняя, передняя ближняя]. */
  legs: [number, number][];
  angles: number[];
  stretch: number;
  squash: number;
  bob: number;
  tail: number;
}

const RUN_LEGS: [number, number][][] = [
  [[-5, 0], [5, -3], [5, -3], [-5, 0]],
  [[0, -1], [0, -1], [0, 0], [0, 0]],
  [[5, -3], [-5, 0], [-5, 0], [5, -3]],
  [[0, 0], [0, 0], [0, -1], [0, -1]],
];

function poseSpec(pose: CatPose): PoseSpec {
  if (pose.startsWith('run')) {
    const i = +pose.slice(3);
    return { legs: RUN_LEGS[i], angles: [0, 0, 0, 0], stretch: 1, squash: 1, bob: i % 2 ? -1.5 : 0, tail: [0, 4, 0, -4][i] };
  }
  if (pose === 'jump') {
    return {
      legs: [[-6, -4], [6, -4], [-4, -2], [8, -2]],
      angles: [62, -62, 70, -70],
      stretch: 1.12,
      squash: 0.9,
      bob: -2,
      tail: -8,
    };
  }
  if (pose === 'fall') {
    return {
      legs: [[-3, 2], [3, 2], [-6, 3], [6, 3]],
      angles: [-12, 12, -18, 18],
      stretch: 0.96,
      squash: 1.06,
      bob: -4,
      tail: 6,
    };
  }
  return { legs: [], angles: [], stretch: 1, squash: 1, bob: 0, tail: 0 };
}

function face(hx: number, hy: number, r: number, pose: CatPose) {
  const ex1 = hx + r * 0.16;
  const ex2 = hx + r * 0.64;
  const ey = hy + r * 0.12;
  const eyes =
    pose === 'fall'
      ? `<path d="M${ex1 - 2.4},${ey - 1.6} l2.4,1.6 l-2.4,1.6 M${ex2 + 2.4},${ey - 1.6} l-2.4,1.6 l2.4,1.6" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="${ex1}" cy="${ey}" r="2" fill="${INK}"/><circle cx="${ex2}" cy="${ey}" r="2" fill="${INK}"/>`;
  const nx = hx + r * 0.42;
  const ny = hy + r * 0.36;
  return `${eyes}
    <path d="M${nx - 1.4},${ny} h2.8 l-1.4,1.7 Z" fill="${CSS.charcoal}"/>
    <path d="M${nx - 3},${ny + 3} q1.5,1.6 3,0 q1.5,1.6 3,0" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
    <ellipse cx="${hx - r * 0.18}" cy="${hy + r * 0.48}" rx="3" ry="1.7" fill="${CSS.stone}"/>`;
}

function head(hx: number, hy: number, r: number, id: string, pose: CatPose) {
  return `
  ${ear(hx - r * 0.92, hy - r * 0.32, hx - r * 0.72, hy - r * 1.42, hx - r * 0.12, hy - r * 0.9, INK)}
  ${ear(hx + r * 0.2, hy - r * 0.92, hx + r * 0.78, hy - r * 1.38, hx + r * 0.95, hy - r * 0.3, CSS.gray)}
  <defs><clipPath id="h${id}"><circle cx="${hx}" cy="${hy}" r="${r}"/></clipPath></defs>
  <circle cx="${hx}" cy="${hy}" r="${r}" fill="${CSS.paper}"/>
  <g clip-path="url(#h${id})">
    <ellipse cx="${hx - r * 0.62}" cy="${hy - r * 0.78}" rx="${r * 0.86}" ry="${r * 0.66}" fill="${INK}"/>
  </g>
  <circle cx="${hx}" cy="${hy}" r="${r}" fill="none" stroke="${INK}" stroke-width="${S}"/>
  ${face(hx, hy, r, pose)}`;
}

function sitting(w: number, id: string) {
  const { w: W, h: H } = CAT_BOX;
  const cx = 64;
  const rx = 20 + 12 * w;
  const ry = 24 + 6 * w;
  const cy = CAT_FEET_Y - ry;
  const r = 15 + 1.5 * w;
  const hx = cx + 3;
  const hy = cy - ry * 0.72;
  const bodyPath = blob(cx, cy, rx, ry, 2.2, 3.4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="b${id}"><path d="${bodyPath}"/></clipPath></defs>
  <path d="M${cx - rx + 4},${CAT_FEET_Y - 6} q-22,-2 -16,-26" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>
  <path d="${bodyPath}" fill="${CSS.paper}"/>
  <g clip-path="url(#b${id})">
    <ellipse cx="${cx - rx * 0.75}" cy="${cy - ry * 0.25}" rx="${rx * 0.45}" ry="${ry * 0.6}" fill="${INK}"/>
  </g>
  <path d="${bodyPath}" fill="none" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  ${paw(cx - 2, CAT_FEET_Y - 13, 13, 0, CSS.paper)}${paw(cx + 10, CAT_FEET_Y - 13, 13, 0, CSS.paper)}
  ${head(hx, hy, r, id, 'sit')}
</svg>`;
}

/** SVG кота при весе w (0..1) в позе pose. */
export function catSvg(w: number, pose: CatPose) {
  const id = `${Math.round(w * 100)}${pose}`;
  if (pose === 'sit') return sitting(w, id);
  const { w: W, h: H } = CAT_BOX;
  const p = poseSpec(pose);
  const legLen = 13 - 4 * w;
  const rx = (25 + 15 * w) * p.stretch;
  const ry = (15 + 11 * w) * p.squash;
  const cx = CAT_CX - 4 * w;
  const cy = CAT_FEET_Y - legLen - ry * 0.78 + p.bob;
  const r = 13.5 + 1.5 * w;
  const hx = cx + rx * 0.8;
  const hy = cy - ry * 0.5 - 3 + 2.5 * w;
  const hipY = cy + ry * 0.45;
  const bodyPath = blob(cx, cy, rx, ry);

  const legX = [cx - rx * 0.5 + 6, cx + rx * 0.45 + 6, cx - rx * 0.5, cx + rx * 0.45];
  const fills = [CSS.sand, CSS.sand, CSS.paper, CSS.paper];
  const legs = p.legs.map(([dx, dy], i) => paw(legX[i] + dx, hipY + dy, legLen + 8, p.angles[i], fills[i]));

  const tx = cx - rx + 4;
  const ty = cy - 2;
  const tw = p.tail;
  const tail = `<path d="M${tx},${ty} c${-10},${1} ${-19 - tw * 0.4},${-1 + tw * 0.3} ${-18 - tw * 0.5},${-15 - tw * 0.4}" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="b${id}"><path d="${bodyPath}"/></clipPath></defs>
  ${tail}
  ${legs[0]}${legs[1]}
  <path d="${bodyPath}" fill="${CSS.paper}"/>
  <g clip-path="url(#b${id})">
    <ellipse cx="${cx - rx * 0.12}" cy="${cy - ry * 0.95}" rx="${rx * 0.6}" ry="${ry * 0.68}" fill="${INK}"/>
    <ellipse cx="${cx - rx * 1.02}" cy="${cy + ry * 0.05}" rx="${rx * 0.3}" ry="${ry * 0.55}" fill="${INK}"/>
  </g>
  <path d="${bodyPath}" fill="none" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  ${legs[2]}${legs[3]}
  ${head(hx, hy, r, id, pose)}
</svg>`;
}

export const catKey = (w: number, pose: CatPose) => `cat-${Math.round(w * 100)}-${pose}`;

export function catTextures() {
  const out: Record<string, string> = {};
  for (const w of CAT_WEIGHTS) for (const pose of CAT_POSES) out[catKey(w, pose)] = catSvg(w, pose);
  return out;
}

/** Ближайший нарисованный уровень веса. */
export function catWeightStep(w: number) {
  return CAT_WEIGHTS.reduce((best, v) => (Math.abs(v - w) < Math.abs(best - w) ? v : best), 0 as number);
}

import { CSS } from '../config';
import type { CatStage } from '../systems/Weight';

export type CatPose = 'run0' | 'run1' | 'run2' | 'run3' | 'jump' | 'fall';
export const CAT_POSES: CatPose[] = ['run0', 'run1', 'run2', 'run3', 'jump', 'fall'];
export const CAT_STAGES: CatStage[] = ['light', 'normal', 'heavy'];

export const CAT_FRAME = { w: 104, h: 76, feetY: 70, cx: 44 } as const;
/** Во сколько раз текстура кота крупнее координат рисунка. */
export const CAT_SCALE = 1.3;

const STAGE_SHAPE: Record<CatStage, { rx: number; ry: number; head: number; leg: number }> = {
  light: { rx: 25, ry: 15, head: 13, leg: 11 },
  normal: { rx: 30, ry: 19, head: 14, leg: 9 },
  heavy: { rx: 36, ry: 24, head: 15, leg: 7 },
};

/** Углы ног (передняя ближняя, задняя ближняя) и подпрыгивание тела. */
const POSE: Record<CatPose, { front: number; back: number; bob: number }> = {
  run0: { front: 28, back: -24, bob: 0 },
  run1: { front: 8, back: -6, bob: -2 },
  run2: { front: -22, back: 26, bob: 0 },
  run3: { front: 6, back: 8, bob: -2 },
  jump: { front: 60, back: -62, bob: -4 },
  fall: { front: 22, back: 12, bob: -6 },
};

const STROKE = 2.4;

function leg(x: number, top: number, len: number, angle: number, fill: string) {
  return `<rect x="${x - 4.5}" y="${top}" width="9" height="${len + 6}" rx="4.5"
    fill="${fill}" stroke="${CSS.ink}" stroke-width="${STROKE}" transform="rotate(${angle} ${x} ${top + 2})"/>`;
}

/** Кот сбоку, смотрит вправо. Палитра и линия — как в референсе. */
export function catSvg(stage: CatStage, pose: CatPose) {
  const s = STAGE_SHAPE[stage];
  const p = POSE[pose];
  const { w, h, feetY, cx } = CAT_FRAME;
  const cy = feetY - s.leg - s.ry * 0.8 + p.bob;
  const hipY = cy + s.ry * 0.45;
  const frontX = cx + s.rx * 0.5;
  const backX = cx - s.rx * 0.5;
  const legLen = feetY - hipY - 4;
  const hx = cx + s.rx * 0.82;
  const hy = cy - s.ry * 0.5 - 2;
  const r = s.head;
  const id = `${stage}-${pose}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * CAT_SCALE}" height="${h * CAT_SCALE}" viewBox="0 0 ${w} ${h}">
  <defs>
    <clipPath id="b-${id}"><ellipse cx="${cx}" cy="${cy}" rx="${s.rx}" ry="${s.ry}"/></clipPath>
    <clipPath id="h-${id}"><circle cx="${hx}" cy="${hy}" r="${r}"/></clipPath>
  </defs>
  <path d="M ${cx - s.rx + 3} ${cy - 2} Q ${cx - s.rx - 16} ${cy - 4} ${cx - s.rx - 12} ${cy - 20}"
    fill="none" stroke="${CSS.ink}" stroke-width="6" stroke-linecap="round"/>
  ${leg(backX + 5, hipY, legLen, -p.back * 0.7, CSS.sand)}
  ${leg(frontX + 5, hipY, legLen, -p.front * 0.7, CSS.sand)}
  <ellipse cx="${cx}" cy="${cy}" rx="${s.rx}" ry="${s.ry}" fill="${CSS.paper}"/>
  <g clip-path="url(#b-${id})">
    <ellipse cx="${cx - s.rx * 0.15}" cy="${cy - s.ry * 0.75}" rx="${s.rx * 0.55}" ry="${s.ry * 0.62}" fill="${CSS.ink}"/>
    <ellipse cx="${cx - s.rx * 0.95}" cy="${cy + s.ry * 0.1}" rx="${s.rx * 0.28}" ry="${s.ry * 0.4}" fill="${CSS.ink}"/>
  </g>
  <ellipse cx="${cx}" cy="${cy}" rx="${s.rx}" ry="${s.ry}" fill="none" stroke="${CSS.ink}" stroke-width="${STROKE}"/>
  ${leg(backX, hipY, legLen, -p.back, CSS.paper)}
  ${leg(frontX, hipY, legLen, -p.front, CSS.paper)}
  <path d="M ${hx - r * 0.85} ${hy - r * 0.35} L ${hx - r * 0.6} ${hy - r * 1.35} L ${hx - r * 0.05} ${hy - r * 0.8} Z"
    fill="${CSS.ink}" stroke="${CSS.ink}" stroke-width="${STROKE}" stroke-linejoin="round"/>
  <path d="M ${hx + r * 0.15} ${hy - r * 0.85} L ${hx + r * 0.7} ${hy - r * 1.3} L ${hx + r * 0.88} ${hy - r * 0.3} Z"
    fill="${CSS.stone}" stroke="${CSS.ink}" stroke-width="${STROKE}" stroke-linejoin="round"/>
  <circle cx="${hx}" cy="${hy}" r="${r}" fill="${CSS.paper}"/>
  <g clip-path="url(#h-${id})">
    <ellipse cx="${hx - r * 0.55}" cy="${hy - r * 0.75}" rx="${r * 0.85}" ry="${r * 0.7}" fill="${CSS.ink}"/>
  </g>
  <circle cx="${hx}" cy="${hy}" r="${r}" fill="none" stroke="${CSS.ink}" stroke-width="${STROKE}"/>
  <circle cx="${hx + r * 0.2}" cy="${hy + r * 0.12}" r="1.7" fill="${CSS.ink}"/>
  <circle cx="${hx + r * 0.68}" cy="${hy + r * 0.12}" r="1.7" fill="${CSS.ink}"/>
  <path d="M ${hx + r * 0.38} ${hy + r * 0.38} l 2.2 0 l -1.1 1.6 Z" fill="${CSS.charcoal}"/>
  <ellipse cx="${hx - r * 0.1}" cy="${hy + r * 0.45}" rx="2.6" ry="1.5" fill="${CSS.stone}" opacity="0.8"/>
</svg>`;
}

export function catTextures() {
  const out: Record<string, string> = {};
  for (const stage of CAT_STAGES) for (const pose of CAT_POSES) out[`cat-${stage}-${pose}`] = catSvg(stage, pose);
  return out;
}

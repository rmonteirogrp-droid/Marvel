// Assemble un personnage : torse, cou, bras, mains, tête, accessoires, décor.
import {
  INK, f, P, add, sub, rot, polar, angle, dist, g, tr, path, line, circle, smooth, poly, shade, segment, hand, handFront,
  head, headCtx, headPts, feat, torsoPts, tone, resetIds, uid, clip, mix, ellipse,
} from './lib.js';

function buildArm(a, S, side, c, J) {
  const L1 = a.L1 ?? c.L1 ?? 82, L2 = a.L2 ?? c.L2 ?? 76;
  const r = (a.r || c.armR || [25, 19, 18, 14]).map(v => v * (c.armK ?? 1.16));
  const E = add(S, polar(L1, a.a1));
  const W = add(E, polar(L2, a.a2));
  const upper = a.upper || c.sleeve || c.suit;
  const lower = a.lower || c.forearm || upper;
  const glove = a.glove || c.glove || c.skin;
  const flip = a.flip ?? (Math.cos((a.a2 * Math.PI) / 180) >= 0 ? 1 : -1) * (side < 0 ? -1 : 1) * (a.hflip ?? 1);
  const segU = segment(S, E, r[0], r[1], upper, { bu: a.bu ?? c.bu ?? 2, bd: 1, detail: a.dU || c.dU });
  const segL = a.L2 === 0 ? '' : segment(E, W, r[2], r[3], lower, { bu: a.bl ?? c.bl ?? 1.5, bd: 1, detail: a.dL || c.dL });
  let handSvg = '';
  const ht = a.hand || 'fist';
  const front = ht.startsWith('f-');
  if (front) handSvg = g(handFront(ht.slice(2), glove, { a: a.ha ?? 0, s: a.hs ?? 1.15, rot: a.ha ?? 0 }), tr(add(W, a.hoff || [0, 0])));
  else if (ht !== 'none') {
    const ha = a.a2 + (a.hrot || 0);
    handSvg = g(hand(ht, glove, { flip, s: (a.hs ?? c.handS ?? 1.45) * 1.08, rot: ha, clawCol: a.clawCol, clawLen: a.clawLen, fingers: a.fingers, talons: a.talons }), tr(W, ha));
  }
  const arm = { S, E, W, a, side, ang: a.a2 };
  J.arms[side < 0 ? 0 : 1] = arm;
  const pr = a.prop ? a.prop(arm, c) : {};
  const body = a.upperTop ? segL + segU : segU + segL;
  return { layer: a.layer || 'mid', svg: (pr.back || '') + body + (a.handUnder ? '' : '') + (pr.mid || '') + handSvg + (pr.front || ''), arm };
}

// Modelé doux du torse : trapèzes, clavicules, dessous des pectoraux, flancs.
function bodyModel(T, col) {
  const s = T.sw / 2;
  const D = o => `fill="${col.dark}" opacity="${o}" filter="url(#soft)"`;
  const L = o => `fill="${col.light}" opacity="${o}" filter="url(#soft)"`;
  return ellipse([-s * 0.45, -2], s * 0.28, 9, L(0.45)) + ellipse([s * 0.5, 4], s * 0.26, 10, D(0.4)) +
    ellipse([-s * 0.35, 92], s * 0.32, 9, D(0.45)) + ellipse([s * 0.38, 94], s * 0.32, 10, D(0.6)) +
    ellipse([-s * 0.38, 58], s * 0.22, 14, L(0.35)) + ellipse([s * 0.82, 130], 16, 60, D(0.5)) + ellipse([-s * 0.8, 130], 12, 50, D(0.3));
}

export function figure(c) {
  const p = c.pose;
  const N = p.N || [200, 262];
  const tilt = p.tilt || 0;
  const sw0 = p.sw || 176;
  const T = { sw: sw0 * (c.swK ?? 1.14), ww: (p.ww || 126) * 1.06, nw: (p.nw || 18) * 1.35 };
  const toG = v => add(N, rot(v, tilt));
  const hs = (p.hs ?? 1.14) * (c.headK ?? 0.86);
  const ht = tilt + (p.htilt || 0);
  const H = add(toG([p.hx || 0, -(p.nl ?? 16) * 0.4 - 50 * hs]), p.hoff || [0, 0]);
  const toH = q => rot(sub(q, H), -ht).map(v => v / hs);
  const J = { N, tilt, T, toG, H, hs, ht, arms: [], c };
  const sh = [toG([-sw0 / 2 + 12, 30]), toG([sw0 / 2 - 12, 30])];
  J.sh = sh;
  const arms = [];
  if (p.armL) arms.push(buildArm(p.armL, sh[0], -1, c, J));
  if (p.armR) arms.push(buildArm(p.armR, sh[1], 1, c, J));
  const lay = l => arms.filter(a => a.layer === l).map(a => a.svg).join('');

  // torse
  const td = smooth(torsoPts(T), true, 1 / 6.5);
  const torso = g(shade(td, c.suit, { rot: tilt, s: 16, h: 3, inner: (c.torso ? c.torso(T, J) : '') + bodyModel(T, tone(c.suit)) }) + (c.torsoOver ? c.torsoOver(T, J) : ''), tr(N, tilt));

  // cou (dans le repère de la tête)
  const t = c.head.t || 0;
  const F = feat(t);
  const b1 = toH(toG([-T.nw - 3, 10])), b2 = toH(toG([T.nw + 3, 10]));
  const nx = F.cx * 0.45;
  const nd = smooth([[nx - 25, 20], [nx + 25, 20], [(nx + 25 + b2[0]) / 2 + 2, (20 + b2[1]) / 2], b2, [(b1[0] + b2[0]) / 2, b2[1] + 6], b1, [(nx - 25 + b1[0]) / 2 - 2, (20 + b1[1]) / 2]], true, 1 / 8);
  const neckCol = tone(c.neckCol || c.head.skin || '#f1c39b', { cool: 0.25 });
  const hp = smooth(headPts(t, c.head.shape || {}));
  const neck = c.noNeck ? '' : shade(nd, neckCol, {
    s: 5, lw: 3,
    inner: `<path d="${hp}" fill="${neckCol.dark}" transform="translate(${f(t * 5)} 13)"/>` + (c.neckDetail ? c.neckDetail(F) : ''),
  });
  const hback = c.head.back ? c.head.back(headCtx(c.head)) : '';
  const headSvg = g(hback + neck + head({ ...c.head, noBack: true }), `transform="translate(${f(H[0])} ${f(H[1])}) rotate(${f(ht)}) scale(${hs})"`);
  J.headSvg = headSvg;
  const ctx = J;
  return {
    behind: (c.behind ? c.behind(ctx) : ''),
    body: lay('back') + (c.cape ? c.cape(ctx) : '') + torso + lay('mid') + (c.preHead ? c.preHead(ctx) : '') + headSvg + lay('front'),
    front: c.front ? c.front(ctx) : '',
    J,
  };
}

// Point dans le repère de la tête -> écran
export function headToG(J, q) {
  return add(J.H, rot(q.map(v => v * J.hs), J.ht));
}

const DEFS = `
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<pattern id="hatch" width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><rect width="1.1" height="4.2" fill="#0a0418" opacity="0.42"/></pattern>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
<pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="1.6" fill="#000"/></pattern>
<pattern id="dotsW" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="1.6" fill="#fff"/></pattern>
<radialGradient id="vig" cx="0.5" cy="0.45" r="0.6"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
<radialGradient id="htFade" cx="0.5" cy="0.5" r="0.5"><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>
<mask id="htMask"><rect width="400" height="400" fill="url(#htFade)"/></mask>
`;

export function icon(c) {
  resetIds(c.id.replace(/[^a-z]/g, '').slice(0, 5) + '_');
  const fig = figure(c);
  const ring = tone(c.ring || '#e23636');
  const R = 186;
  const bg = c.bg(fig.J);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${c.name}">
<defs>${DEFS}<clipPath id="disc"><circle cx="200" cy="200" r="${R}"/></clipPath></defs>
<circle cx="200" cy="200" r="197" fill="${ring.base}" stroke="${INK}" stroke-width="5"/>
<path d="M200,6 A194,194 0 0 0 6,200" fill="none" stroke="${ring.light}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
<g clip-path="url(#disc)">
<rect width="400" height="400" fill="${c.sky || '#222'}"/>
${bg}
<rect width="400" height="400" fill="url(#dots)" opacity="0.10" mask="url(#htMask)"/>
${fig.behind}
${fig.body}
${fig.front}
<rect width="400" height="400" fill="url(#vig)"/>
</g>
<circle cx="200" cy="200" r="${R}" fill="none" stroke="${INK}" stroke-width="7"/>
<circle cx="200" cy="200" r="${R - 5}" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.35"/>
</svg>`;
}

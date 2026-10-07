// Les personnages : costume, tête, pose et décor de chacun.
import { INK, f, P, add, sub, polar, rot, lerp, path, line, circle, ellipse, smooth, poly, g, tr, shade, tone, mix, brush, clip, sym, beard, hairCap, headPts, capsule, eye, angle } from './lib.js';
import * as B from './bg.js';
import * as PR from './props.js';
import { headToG } from './figure.js';

// ---------- motifs réutilisables ----------
const webLines = (c, r, n = 10, w = 1.3, col = INK, op = 0.75) => B.web(c, r, col, w, op, n, -90);
// Lignes de toile le long d'un membre (repère local)
const limbWeb = (col = INK) => (L, r1) => {
  let d = '';
  for (const k of [-0.5, 0, 0.5]) d += `M0,${f(r1 * k)}L${f(L)},${f(r1 * k * 0.8)}`;
  for (let x = 10; x < L; x += 15) d += `M${x},${f(-r1)}Q${x + 4},0 ${x},${f(r1)}`;
  return path(d, `fill="none" stroke="${col}" stroke-width="1.1" opacity="0.7"`);
};
// Bande colorée sur un membre (de x0 à x1, en fraction de longueur)
const band = (col, k0, k1) => (L, r1) => `<rect x="${f(L * k0)}" y="-60" width="${f(L * (k1 - k0))}" height="120" fill="${col}"/>` + line(`M${f(L * k0)},-60V60`, 2.2);
const halfLimb = col => (L, r1) => `<rect x="-40" y="-60" width="${f(L + 80)}" height="60" fill="${col}"/>` + line(`M-40,0H${f(L + 40)}`, 2);
const spider = (c, s = 1, col = INK) => {
  const [x, y] = c;
  let d = '';
  for (const sd of [-1, 1]) {
    d += `M${x},${y - 4 * s}L${x + sd * 10 * s},${y - 14 * s}L${x + sd * 12 * s},${y - 24 * s}`;
    d += `M${x},${y - 2 * s}L${x + sd * 14 * s},${y - 6 * s}L${x + sd * 18 * s},${y - 14 * s}`;
    d += `M${x},${y + 2 * s}L${x + sd * 14 * s},${y + 6 * s}L${x + sd * 18 * s},${y + 16 * s}`;
    d += `M${x},${y + 4 * s}L${x + sd * 10 * s},${y + 14 * s}L${x + sd * 12 * s},${y + 26 * s}`;
  }
  return line(d, 2.6 * s, col) + ellipse([x, y - 6 * s], 4 * s, 6 * s, `fill="${col}"`) + ellipse([x, y + 8 * s], 5.5 * s, 9 * s, `fill="${col}"`);
};
const pecs = (T, col = INK, op = 0.55) => {
  const s = T.sw / 2;
  return line(`M${f(-s * 0.72)},48Q${f(-s * 0.35)},${92} ${-4},76M${f(s * 0.72)},48Q${f(s * 0.35)},${92} 4,76M0,40V${82}`, 2.2, col, `opacity="${op}"`);
};
const abs = (T, col = INK, op = 0.5) => {
  let d = 'M0,90V190';
  for (const y of [112, 136, 160]) d += `M-24,${y}Q-12,${y + 4} -2,${y}M2,${y}Q12,${y + 4} 24,${y}`;
  d += `M${f(-T.ww * 0.45)},120Q${f(-T.ww * 0.38)},150 ${f(-T.ww * 0.42)},180M${f(T.ww * 0.45)},120Q${f(T.ww * 0.38)},150 ${f(T.ww * 0.42)},180`;
  return line(d, 2, col, `opacity="${op}"`);
};
const hairShade = col => tone(col, { lt: 0.3 });
// cheveux : forme + mèches
const hair = (pts, col, o = {}) => shade(smooth(pts, true, o.k ?? 1 / 6), hairShade(col), { s: o.s ?? 6, lw: o.lw ?? 3, inner: o.inner || '' });
const strands = (list, col) => list.map(p => line(smooth(p, false), 1.8, col)).join('');

// Cheveux longs qui tombent sur les épaules, mèches en pointe
const longHair = (col, o = {}) => () => {
  const W = o.w ?? 58, L = o.len ?? 100, sk = o.skew ?? 0, top = o.top ?? -52;
  const R = [[44, top], [W, -10], [W + 3, 40], [W + 6 + sk, L - 12], [W - 4 + sk, L + 8], [W * 0.66 + sk, L - 4], [W * 0.5 + sk, L + 12], [W * 0.3 + sk * 0.5, L - 10], [W * 0.24, 50]];
  const Lf = [[-44, top], [-W, -10], [-W - 3, 40], [-W - 6 + sk, L - 12], [-W + 4 + sk, L + 8], [-W * 0.66 + sk, L - 4], [-W * 0.5 + sk, L + 12], [-W * 0.3 + sk * 0.5, L - 10], [-W * 0.24, 50]];
  const pts = [[0, -74], ...R, [0, 60], ...Lf.reverse()];
  const ct = tone(col, { lt: 0.3 });
  const st = strands([[[-W + 8, 0], [-W + 4, 50], [-W + 6 + sk, L - 6]], [[W - 8, 0], [W - 4, 50], [W - 6 + sk, L - 6]], [[-W * 0.6, 40], [-W * 0.55 + sk, L]], [[W * 0.6, 40], [W * 0.55 + sk, L]]], ct.dark);
  return shade(smooth(pts, true, 1 / 7), ct, { s: 7, lw: 3, inner: st });
};

export const CHARS = [];
const C = c => CHARS.push(c);

// =================== SPIDER-MAN ===================
C({
  id: 'spider-man', name: 'Spider-Man', group: 'spider', ring: '#d62a2a',
  sky: '#2b3a78',
  bg: J => B.sky(['#16224f', '#3557a8', '#f08a4b'], 'sm') + B.city({ far: '#2c3f80', near: '#141b3a', win: '#ffcf6a', base1: 360, base2: 420, seed: 3 }) +
    B.web([400, 0], 230, '#ffffff', 2, 0.55, 12, 90) + B.webLine([420, -30], add(J.arms[1]?.W || [300, 100], [8, -30]), 3),
  suit: '#d42a2a', neckCol: '#d42a2a', sleeve: '#d42a2a', glove: '#d42a2a',
  torso: T => {
    const s = T.sw / 2;
    return webLines([0, 70], 260, 14, 1.2) +
      shade(smooth([[s * 0.42, 70], [s + 30, 20], [s + 30, 270], [T.ww * 0.42, 270], [T.ww * 0.36, 150]], true), '#1f4fb5', { s: 8, lw: 2.6 }) +
      shade(smooth([[-s * 0.42, 70], [-s - 30, 20], [-s - 30, 270], [-T.ww * 0.42, 270], [-T.ww * 0.36, 150]], true), '#1f4fb5', { s: 8, lw: 2.6 }) +
      spider([0, 76], 1.15) + pecs(T, INK, 0.35);
  },
  dU: (L, r) => halfLimb('#1f4fb5')(L, r) + limbWeb()(L, r),
  dL: limbWeb(),
  head: {
    t: 0.28, expr: 'determined', skin: '#d42a2a', ears: false,
    shape: { jaw: 0.95 },
    mask: {
      type: 'full', color: '#d42a2a', lens: 'spidey', ang: 4, ls: 1.3,
      pattern: ({ F }) => webLines([F.cx + 2, 22], 150, 14, 1.3),
    },
  },
  pose: {
    N: [190, 262], tilt: -9, htilt: -4, sw: 172, ww: 118,
    armL: { a1: 118, a2: -30, hand: 'fist', layer: 'front', r: [24, 18, 17, 13] },
    armR: { a1: -38, a2: -58, L1: 76, L2: 64, hand: 'f-web', ha: 18, hs: 1.05, layer: 'mid', r: [24, 18, 17, 13] },
  },
});

// =================== HULK ===================
C({
  id: 'hulk', name: 'Hulk', group: 'avengers', ring: '#3f9b2f',
  sky: '#e0702a',
  bg: J => B.sky(['#f6c453', '#ec7a2c', '#a8342b'], 'hk') + B.rays([200, 230], '#fff6c8', 26, 0.22) +
    B.debris([200, 240], 16, '#8c6a4a', 4, 120, 200) + B.rocks(['#8a6a4f', '#6b513e'], 11, 10, 330) + B.cracks([200, 400], INK, 7, 160, 3),
  suit: '#5aa83a', skin: '#5aa83a', neckCol: '#5aa83a', sleeve: '#5aa83a', glove: '#5aa83a',
  bu: 5, bl: 3,
  torso: T => pecs(T, INK, 0.6) + abs(T, INK, 0.55) +
    line(`M${f(-T.sw * 0.42)},26Q${f(-T.sw * 0.3)},6 ${f(-T.nw - 6)},0M${f(T.sw * 0.42)},26Q${f(T.sw * 0.3)},6 ${f(T.nw + 6)},0`, 2.2, INK, 'opacity="0.5"') +
    // lambeaux de chemise violette
    shade(poly([[-T.sw / 2 - 20, 210], [-T.ww / 2 + 10, 190], [-T.ww / 2 + 30, 222], [-T.ww / 2 + 50, 200], [-T.ww / 2 + 66, 240], [-T.sw / 2 - 20, 270]]), '#6b3fa0', { s: 6, lw: 2.6 }),
  head: {
    t: -0.18, expr: 'furious', skin: '#5aa83a', mouth: 'roar', mouthW: 1.35,
    shape: { jaw: 1.28, wid: 1.06, cran: 0.9, chin: 1.25 },
    lines: ['cheek', 'fold', 'forehead'],
    eyes: { s: 0.9, iris: '#2f6b1c', lid: 3 }, brows: { th: 7, w: 1.15 },
    front: () => hair([[-48, -26], [-52, -50], [-34, -72], [-6, -80], [22, -76], [44, -64], [52, -40], [46, -24], [38, -40], [30, -30], [20, -44], [8, -34], [-4, -46], [-16, -34], [-26, -46], [-36, -30]], '#1d1d28', { s: 5 }),
  },
  pose: {
    N: [206, 272], tilt: 6, sw: 256, ww: 176, nw: 32, hs: 1.0, nl: 6, htilt: -6,
    armL: { a1: 100, a2: -72, L1: 66, L2: 34, hand: 'f-fist', hs: 1.85, ha: -12, layer: 'front', r: [44, 36, 36, 30] },
    armR: { a1: -26, a2: -108, L1: 84, L2: 70, hand: 'fist', hs: 1.5, layer: 'back', r: [42, 32, 32, 25], bu: 7 },
  },
});

// =================== WOLVERINE ===================
const wolvTorso = T => {
  const s = T.sw / 2;
  const blue = '#21409a';
  let side = '';
  for (const sd of [-1, 1]) {
    side += shade(smooth([[sd * s * 0.4, 30], [sd * (s + 30), 10], [sd * (s + 30), 270], [sd * T.ww * 0.36, 270], [sd * T.ww * 0.3, 160], [sd * s * 0.5, 90]], true), blue, { s: 8, lw: 2.6 });
    for (const y of [120, 160, 200]) side += path(`M${f(sd * (T.ww * 0.36))},${y}L${f(sd * (s + 10))},${y - 14}L${f(sd * (T.ww * 0.42))},${y + 6}Z`, `fill="${INK}"`);
  }
  return side + pecs(T, INK, 0.4) + abs(T, INK, 0.4) +
    `<rect x="-80" y="216" width="160" height="22" fill="#c8202e" stroke="${INK}" stroke-width="2.4"/>` + circle([0, 227], 14, `fill="#f5c518" stroke="${INK}" stroke-width="2.4"`) +
    path('M-7,220L7,234M7,220L-7,234', `stroke="#c8202e" stroke-width="3"`);
};
C({
  id: 'wolverine', name: 'Wolverine', group: 'xmen', ring: '#f5c518',
  sky: '#7a1d1d',
  bg: J => B.radial('wv', '#ff9a3a', '#5a0f14', 0.5, 0.42, 0.65) + B.rays([200, 200], '#ffd27a', 20, 0.18) +
    B.pines('#2a0b0b', 21, 9, 330) +
    [-1, 0, 1].map(k => B.bolt([[60 + k * 38, 40], [230 + k * 38, 140]], '#fff', 6, '#ffd27a')).join(''),
  suit: '#f5c518', neckCol: '#f5c518', sleeve: '#f5c518', glove: '#21409a',
  torso: wolvTorso,
  dU: (L, r) => `<rect x="-40" y="-60" width="${f(L * 0.28 + 40)}" height="120" fill="#21409a"/>` + line(`M${f(L * 0.28)},-60V60`, 2.2),
  dL: (L, r) => `<rect x="${f(L * 0.72)}" y="-60" width="80" height="120" fill="#21409a"/>` + line(`M${f(L * 0.72)},-60V60`, 2.2),
  head: {
    t: 0.12, expr: 'furious', skin: '#efbf94', mouth: 'grit', mouthW: 1.15,
    shape: { jaw: 1.12, chin: 1.05 }, lines: ['fold'],
    back: () => '',
    mask: {
      type: 'cowl', color: '#f5c518', top: 14, side: 33,
      pattern: ({ F, t }) =>
        // zones noires autour des yeux qui montent en ailerons
        [-1, 1].map(s => path(smooth([[F.cx + s * 4, -6], [F.cx + s * 20, -20], [F.cx + s * 46, -40], [F.cx + s * 52, -10], [F.cx + s * 40, 10], [F.cx + s * 18, 8]]), `fill="#1a1a22"`)).join(''),
      over: ({ F, t }) => [-1, 1].map(s => {
        const b = F.cx * 0.3 + s * 36;
        return shade(smooth([[b - s * 4, -40], [b + s * 18, -86], [b + s * 26, -96], [b + s * 22, -70], [b + s * 12, -30]]), '#1a1a22', { s: 3, lw: 3 });
      }).join(''),
      eyes: 'lens', lens: 'narrow', ls: 0.95,
    },
    front: ({ F }) => [-1, 1].map(s => path(poly([[F.cx + s * 34, 14], [F.cx + s * 42, 6], [F.cx + s * 40, 38], [F.cx + s * 30, 30]]), `fill="#1d1712" stroke="${INK}" stroke-width="1.6"`)).join(''),
  },
  pose: {
    N: [200, 266], sw: 196, ww: 138, nw: 22, hs: 1.1, htilt: 4,
    armL: { a1: 116, a2: -102, L1: 72, L2: 66, hand: 'claw', hs: 1.3, clawLen: 62, hrot: -6, layer: 'front', r: [27, 21, 20, 15] },
    armR: { a1: 64, a2: -78, L1: 72, L2: 66, hand: 'claw', hs: 1.3, clawLen: 62, hrot: 6, layer: 'front', r: [27, 21, 20, 15] },
  },
});

// =================== CAPTAIN AMERICA ===================
C({
  id: 'captain-america', name: 'Captain America', group: 'avengers', ring: '#2753b8',
  sky: '#1d3f8f',
  bg: J => B.stripes(['#c8202e', '#f2efe6'], 34, -24) +
    `<rect x="-40" y="-40" width="230" height="200" fill="#20408f" transform="rotate(-24 200 200)"/>` +
    [[60, 40], [110, 60], [40, 110], [95, 120], [150, 20]].map(c => path(B.starShape(c, 12), `fill="#fff"`)).join('') +
    B.rays([200, 200], '#ffffff', 18, 0.12) + B.speed([200, 200], '#fff', 30, 165, 0.4),
  suit: '#2753b8', neckCol: '#2753b8', sleeve: '#2753b8', glove: '#c8202e',
  torso: T => {
    let st = '';
    for (let i = 0; i < 8; i++) st += `<rect x="${-100 + i * 26}" y="118" width="13" height="200" fill="#c8202e"/>`;
    return `<rect x="-100" y="118" width="200" height="200" fill="#f4f1ea"/>` + st + line('M-100,118H100', 2.6) +
      path(B.starShape([0, 72], 30), `fill="#f8f8f8" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`) + pecs(T, INK, 0.35) +
      // écailles
      [-1, 1].map(s => line(`M${s * 50},30Q${s * 60},40 ${s * 70},30M${s * 58},50Q${s * 68},60 ${s * 78},50`, 1.5, '#163378')).join('');
  },
  dL: band('#c8202e', 0.68, 1.4),
  head: {
    t: -0.22, expr: 'determined', skin: '#f1c39b', mouth: 'grit', mouthW: 0.95,
    shape: { jaw: 1.06, chin: 1.08 }, lines: ['cleft', 'fold'],
    mask: {
      type: 'cowl', color: '#2753b8', top: 16, side: 30,
      over: ({ F, t }) => {
        const ax = F.cx * 0.7;
        return path(`M${f(ax - 12)},-30L${f(ax)},-58L${f(ax + 12)},-30L${f(ax + 6)},-30L${f(ax + 3)},-37L${f(ax - 3)},-37L${f(ax - 6)},-30Z M${f(ax - 2)},-43L${f(ax)},-49L${f(ax + 2)},-43Z`, `fill="#fff" stroke="${INK}" stroke-width="2" fill-rule="evenodd"`) +
          [-1, 1].map(s => {
            const x = F.cx + s * 40 - t * 6;
            return shade(smooth([[x, -4], [x + s * 10, -34], [x + s * 22, -50], [x + s * 14, -26], [x + s * 22, -32], [x + s * 12, -12], [x + s * 6, 6]]), '#f2f2f2', { s: 3, lw: 2.4 });
          }).join('');
      },
    },
  },
  pose: {
    N: [210, 266], tilt: -7, htilt: 2, sw: 188, ww: 128,
    armL: {
      a1: 112, a2: -18, L1: 74, L2: 70, hand: 'fist', layer: 'front', r: [27, 21, 20, 15],
      prop: arm => ({ front: PR.capShield(lerp(arm.E, arm.W, 0.45), 84, -12, 0.82) }),
    },
    armR: { a1: -28, a2: -62, L1: 78, L2: 66, hand: 'fist', hs: 1.15, layer: 'back', r: [27, 21, 20, 15] },
  },
});

// =================== THOR ===================
C({
  id: 'thor', name: 'Thor', group: 'avengers', ring: '#9aa3ad',
  sky: '#1b2346',
  bg: J => B.sky(['#0e1430', '#2b3570', '#4c4e8a'], 'th') + B.clouds('#3a3f6e', 300, 2, 1, 1.2) + B.clouds('#282b52', 340, 5, 1, 1) +
    B.clouds('#20244a', -30, 3, 0.8, 1.3, false),
  front: J => {
    const top = J.arms[1].W;
    const tip = add(top, [0, -100]);
    return B.bolt(B.zig([tip[0] - 30, -20], tip, 5, 14, 3), '#fffbd6', 6) + B.bolt(B.zig(tip, [60, 30], 6, 16, 8), '#fffbd6', 3.5) + B.bolt(B.zig(tip, [410, 150], 5, 14, 5), '#fffbd6', 3.5);
  },
  cape: J => PR.cape(J, '#c8202e', { spread: 1.1, wind: [30, 0] }),
  suit: '#262b3a', neckCol: '#f2c9a0', skin: '#f2c9a0', sleeve: '#f2c9a0', forearm: '#262b3a', glove: '#f2c9a0',
  torso: T => [[-28, 40], [28, 40], [-28, 90], [28, 90], [-28, 140], [28, 140]].map(c => circle(c, 15, `fill="#c9cfd6" stroke="${INK}" stroke-width="2.4"`) + circle(add(c, [-4, -4]), 5, `fill="#fff" opacity="0.7"`)).join('') +
    `<rect x="-80" y="205" width="160" height="16" fill="#e0b73a" stroke="${INK}" stroke-width="2.4"/>` +
    // col en V
    path(`M-${T.nw + 10},-6L0,26L${T.nw + 10},-6`, `fill="#f2c9a0" stroke="${INK}" stroke-width="2.4"`),
  dU: (L, r) => `<rect x="-40" y="-60" width="${f(L * 0.28 + 40)}" height="120" fill="#262b3a"/>` + line(`M${f(L * 0.28)},-60V60`, 2.2),
  dL: (L, r) => line(`M${f(L * 0.25)},-30V30M${f(L * 0.5)},-30V30M${f(L * 0.75)},-30V30`, 1.6, '#555c70'),
  head: {
    t: 0.22, expr: 'furious', skin: '#f2c9a0', mouth: 'grit', mouthW: 1.05,
    shape: { jaw: 1.14, chin: 1.08, cheek: 0.98 }, lines: ['fold'],
    beard: ctx => beard(ctx, '#d9a62a', { puff: 3 }),
    eyes: { iris: '#3b74c4' },
    back: longHair('#f1c23a', { w: 56, len: 76, skew: 8, top: -40 }),
    front: ({ F, t }) => {
      // casque ailé
      let o = '';
      o += shade(smooth([[-48, -26], [-46, -54], [-22, -72], [14, -73], [42, -58], [50, -28], [20, -33], [-14, -33]]), '#aab3bd', { s: 6, inner: line('M-46,-36Q0,-48 48,-36', 3, '#6f7884') + circle([F.cx - 20, -50], 4, `fill="#6f7884"`) + circle([F.cx + 20, -50], 4, `fill="#6f7884"`) });
      for (const s of [-1, 1]) {
        const x = s * 46 - t * 4;
        o += shade(smooth([[x, -30], [x + s * 18, -60], [x + s * 30, -96], [x + s * 22, -66], [x + s * 36, -84], [x + s * 30, -56], [x + s * 42, -64], [x + s * 30, -38], [x + s * 10, -24]]), '#e8edf3', { s: 4, lw: 2.8 });
      }
      return o;
    },
  },
  pose: {
    N: [190, 272], tilt: 5, htilt: -6, sw: 196, ww: 138, nw: 22,
    armL: { a1: 116, a2: 96, hand: 'fist', layer: 'mid', r: [28, 22, 21, 16] },
    armR: {
      a1: -54, a2: -96, L1: 74, L2: 62, hand: 'grip', layer: 'back', r: [28, 22, 21, 16], hrot: 0,
      prop: arm => ({ back: PR.mjolnir(add(arm.W, [0, -4]), -82, 0.95) }),
    },
  },
});

// =================== IRON MAN ===================
const IRED = '#c41e2a', GOLD = '#f0b93a';
C({
  id: 'iron-man', name: 'Iron Man', group: 'avengers', ring: GOLD,
  sky: '#0c1a33',
  bg: J => B.radial('im', '#1f5d8f', '#08122a', 0.5, 0.4, 0.7) + B.hud('#68e6ff', 0.4) + B.speed([200, 200], '#9ff0ff', 26, 170, 0.35),
  front: J => B.energy(add(J.arms[1].W, [0, 2]), 22, '#7fe9ff') + B.beam(add(J.arms[1].W, [10, -8]), [420, -60], 16, '#7fe9ff'),
  suit: IRED, neckCol: '#5a5f6b', sleeve: IRED, forearm: IRED, glove: IRED,
  torso: T => {
    const s = T.sw / 2;
    return shade(smooth([[-s * 0.55, 95], [-20, 88], [20, 88], [s * 0.55, 95], [s * 0.45, 200], [0, 214], [-s * 0.45, 200]]), GOLD, {
      s: 6, lw: 2.6,
      inner: line('M0,92V214M-50,130H50M-44,168H44', 2, '#9a6b16'),
    }) + line(`M${-s * 0.8},30Q${-s * 0.4},60 -28,58M${s * 0.8},30Q${s * 0.4},60 28,58`, 2.4, '#7a1018') +
      circle([0, 60], 26, `fill="#5ff0ff" opacity="0.55" filter="url(#blur6)"`) + circle([0, 60], 18, `fill="#c8fbff" stroke="${INK}" stroke-width="3"`) + circle([0, 60], 10, `fill="#ffffff"`) +
      shade(smooth([[-T.nw - 6, -4], [T.nw + 6, -4], [T.nw + 10, 14], [-T.nw - 10, 14]]), '#5a5f6b', { s: 3, lw: 2.4 });
  },
  dU: (L, r) => line(`M${f(L * 0.35)},-30V30`, 2, '#7a1018') + `<rect x="${f(L * 0.4)}" y="-60" width="${f(L * 0.22)}" height="120" fill="${GOLD}"/>` + line(`M${f(L * 0.4)},-60V60M${f(L * 0.62)},-60V60`, 2),
  dL: (L, r) => line(`M${f(L * 0.3)},-30V30M${f(L * 0.7)},-30V30`, 2, '#7a1018'),
  head: {
    t: 0.15, expr: 'angry', skin: IRED, ears: false,
    shape: { jaw: 1.02, chin: 1.04, wid: 1.02 },
    mask: {
      type: 'full', color: IRED, lens: 'slit', ls: 1.05, border: 3.5, lensFill: '#f2fdff', shine: false, dy: 1,
      pattern: ({ F, t }) => shade(smooth([[F.cx - 30, -44], [F.cx + 30, -44], [F.cx + 37 - t * 4, -6], [F.cx + 32, 30], [F.cx + 15, 54], [F.cx - 15, 54], [F.cx - 32, 30], [F.cx - 37 - t * 4, -6]]), GOLD, {
        s: 6, lw: 3, inner: line(`M${f(F.cx - 13)},40H${f(F.cx + 13)}M${f(F.cx)},-44V-20`, 2.6) + line(`M${f(F.cx - 28)},20L${f(F.cx - 16)},34M${f(F.cx + 28)},20L${f(F.cx + 16)},34`, 2, '#9a6b16'),
      }) + [-1, 1].map(s => path(`M${f(F.eye[s < 0 ? 0 : 1][0] - 16)},-2L${f(F.eye[s < 0 ? 0 : 1][0] + 16)},-2`, `stroke="#aef6ff" stroke-width="10" opacity="0.6" filter="url(#blur6)"`)).join(''),
    },
  },
  pose: {
    N: [192, 270], tilt: -6, htilt: 2, sw: 194, ww: 132, nw: 22,
    armL: { a1: 128, a2: 112, hand: 'fist', layer: 'mid', r: [29, 23, 22, 17] },
    armR: { a1: -8, a2: -72, L1: 64, L2: 40, hand: 'f-palm', hs: 1.35, ha: 22, layer: 'front', r: [29, 23, 23, 19] },
  },
});

// ---------- aides visage féminin ----------
const FEM = { jaw: 0.86, chin: 0.84, wid: 0.95, cheek: 0.98 };
const femEyes = (iris, o = {}) => ({ s: 1.1, lash: true, iris, ...o });
const bust = (T, col = INK, op = 0.5) => line(`M${f(-T.sw * 0.34)},62Q${f(-T.sw * 0.2)},96 -6,82M${f(T.sw * 0.34)},62Q${f(T.sw * 0.2)},96 6,82`, 2.2, col, `opacity="${op}"`);


// =================== BLACK WIDOW ===================
C({
  id: 'black-widow', name: 'Black Widow', group: 'avengers', ring: '#c8202e',
  sky: '#2a0a10',
  bg: J => B.radial('bw', '#8a1420', '#14060a', 0.5, 0.35, 0.7) +
    path('M-20,400L120,-20L170,-20L40,400Z', `fill="#ffeaea" opacity="0.10"`) + path('M420,400L290,-20L240,-20L380,400Z', `fill="#ffeaea" opacity="0.10"`) +
    B.city({ far: '#3a0d16', near: '#16070b', win: '#ff6a6a', base1: 380, base2: 430, seed: 8 }) +
    path(B.starShape([200, 170], 0, 1, 2), '') + g(path('M-18,-30L18,-30L0,0Z M-18,30L18,30L0,0Z', `fill="#e0202e" opacity="0.35"`), 'transform="translate(300 90) scale(1.6)"'),
  front: J => {
    const W = J.arms[0].W;
    return B.bolt(B.zig(add(W, [-10, 0]), add(W, [-46, -40]), 4, 8, 2), '#e6fbff', 2.5, '#5fd8ff') + B.bolt(B.zig(add(W, [6, -6]), add(W, [30, -54]), 4, 8, 5), '#e6fbff', 2.5, '#5fd8ff');
  },
  suit: '#23232e', neckCol: '#23232e', sleeve: '#23232e', glove: '#23232e',
  torso: T => bust(T, '#55556a', 0.8) + line('M0,0V200', 2, '#55556a') + circle([0, 8], 5, `fill="#9aa0aa" stroke="${INK}" stroke-width="1.5"`) +
    `<rect x="-60" y="172" width="120" height="14" fill="#3a3a48" stroke="${INK}" stroke-width="2"/>` +
    g(path('M-11,-12L11,-12L0,0Z M-11,12L11,12L0,0Z', `fill="#e0202e" stroke="${INK}" stroke-width="1.8"`), 'transform="translate(0 179)"'),
  dL: (L, r) => `<rect x="${f(L * 0.72)}" y="-40" width="${f(L * 0.16)}" height="80" fill="#c9ced6"/>` + line(`M${f(L * 0.72)},-40V40M${f(L * 0.88)},-40V40`, 2) + circle([L * 0.8, 0], 3.2, `fill="#5fd8ff"`),
  head: {
    t: -0.22, expr: 'smirk', skin: '#f6d0b0', mouth: 'lipsmirk', lip: '#b8323c', mouthW: 0.85,
    shape: FEM, eyes: femEyes('#3d7a4a'), brows: { th: 3.4, arch: 3 }, eyeSocket: false,
    back: longHair('#c7361f', { w: 56, len: 78, skew: 4 }),
    front: ctx => hairCap(ctx, '#c7361f', F => [[F.cx + 46, -2], [F.cx + 30, -34], [F.cx + 10, -44], [F.cx - 16, -40], [F.cx - 36, -24], [F.cx - 48, 6]], { cut: 8, puff: 7, inner: ct => strands([[[-10, -60], [10, -50], [30, -36]], [[-30, -54], [-34, -34], [-44, -10]]], ct.dark) }),
  },
  pose: {
    N: [196, 262], tilt: 4, htilt: -2, sw: 150, ww: 96, nw: 14, hs: 1.1,
    armL: { a1: 116, a2: -38, L1: 70, L2: 62, hand: 'fist', hs: 1.3, layer: 'front', r: [20, 15, 14, 11] },
    armR: {
      a1: 96, a2: -84, L1: 72, L2: 64, hand: 'grip', hs: 1.3, layer: 'front', r: [20, 15, 14, 11],
      prop: arm => ({ front: PR.gun(add(arm.W, [2, -18]), -90, { s: 1.15, flip: -1, len: 50 }) }),
    },
  },
});

// =================== HAWKEYE ===================
C({
  id: 'hawkeye', name: 'Hawkeye', group: 'avengers', ring: '#7b3fb8',
  sky: '#3a1d5c',
  bg: J => B.sky(['#2a1648', '#7a3f9a', '#f08a5a'], 'hw') + B.city({ far: '#4a2a6a', near: '#1e1030', win: '#ffb36a', base1: 380, base2: 420, seed: 11 }) +
    [70, 52, 34, 16].map((r, i) => circle([90, 110], r, `fill="${i % 2 ? '#fff' : '#d8344a'}" opacity="0.35"`)).join(''),
  front: J => {
    const bowC = J.arms[0].W, hand = J.arms[1].W;
    const top = add(bowC, [8, -96]), bot = add(bowC, [8, 96]);
    return line(`M${P(top)}L${P(add(hand, [-6, -2]))}L${P(bot)}`, 1.8, '#f2f2f2') + PR.arrow(add(hand, [-2, -2]), 180 + 1.5, 230);
  },
  suit: '#5a2f86', neckCol: '#f1c39b', sleeve: '#f1c39b', forearm: '#f1c39b', glove: '#4a2a6a',
  torso: T => line('M-30,-2L0,40L30,-2', 2.4) + path('M-34,60L0,96L34,60L34,76L0,112L-34,76Z', `fill="#2a1840" stroke="${INK}" stroke-width="2"`) +
    `<rect x="-80" y="190" width="160" height="14" fill="#2a1840"/>` + line('M60,0L-70,200', 9, '#2a1840'),
  dL: (L, r) => `<rect x="${f(L * 0.45)}" y="-40" width="${f(L * 0.6)}" height="80" fill="#2a1840"/>` + line(`M${f(L * 0.45)},-40V40`, 2),
  head: {
    t: -0.55, expr: 'determined', skin: '#f1c39b', mouth: 'flat', shape: { jaw: 1.04 }, lines: ['fold'],
    eyes: { iris: '#4a6a8a', look: [-3, 0] },
    front: ctx => hairCap(ctx, '#d9a63a', F => [[F.cx + 44, -18], [F.cx + 30, -36], [F.cx + 18, -46], [F.cx + 4, -40], [F.cx - 10, -50], [F.cx - 24, -40], [F.cx - 44, -26]], { cut: -12, puff: 6, top: [[0, -82], [18, -80]] }),
  },
  pose: {
    N: [244, 266], tilt: -6, htilt: 4, sw: 158, ww: 112, nw: 18,
    armL: {
      a1: 186, a2: 183, L1: 60, L2: 50, hand: 'grip', hs: 1.3, layer: 'mid', r: [24, 18, 17, 13],
      prop: arm => ({ back: PR.bow(add(arm.W, [10, 0]), 0, 196, '#5a2f86') }),
    },
    armR: { a1: -18, a2: 182, L1: 60, L2: 84, hand: 'grip', hs: 1.25, layer: 'front', r: [24, 18, 17, 13] },
  },
});

// =================== BLACK PANTHER ===================
C({
  id: 'black-panther', name: 'Black Panther', group: 'avengers', ring: '#8a4fe0',
  sky: '#160c2a',
  bg: J => B.sky(['#120a28', '#3b1f6e', '#7a3fb8'], 'bp') + circle([300, 110], 70, `fill="#e8dcff" opacity="0.9"`) + circle([300, 110], 90, `fill="#c9a8ff" opacity="0.35" filter="url(#blur14)"`) +
    B.leaves(['#0c0718', '#1a0f30', '#24143e'], 31, 22, 120) + B.pines('#0a0614', 4, 6, 400, 120, 200),
  suit: '#1d1b26', neckCol: '#1d1b26', sleeve: '#1d1b26', glove: '#1d1b26',
  torso: T => {
    let n = '';
    for (let i = -6; i <= 6; i++) {
      const p = [i * 9, 14 + Math.abs(i) * Math.abs(i) * 0.5];
      n += path(`M${f(p[0] - 4)},${f(p[1])}L${f(p[0] + 4)},${f(p[1])}L${f(p[0])},${f(p[1] + 14)}Z`, `fill="#d9dde6" stroke="${INK}" stroke-width="1.4"`);
    }
    return line('M-50,70L0,120L50,70M-40,140L0,180L40,140M0,120V250', 2.2, '#9a6bff', 'filter="url(#glow)"') + pecs(T, '#6a6880', 0.6) + n;
  },
  dL: (L, r) => line(`M0,0L${f(L)},0`, 1.6, '#9a6bff', 'opacity="0.8"'),
  head: {
    t: 0.12, expr: 'angry', skin: '#1d1b26', ears: false, shape: { jaw: 1.02, chin: 1.04 },
    mask: {
      type: 'full', color: '#23212e', lens: 'narrow', ls: 1.1, ang: 6, border: 4,
      pattern: ({ F }) => line(`M${f(F.cx)},-64V-26M${f(F.cx - 6)},-26L${f(F.cx)},-10L${f(F.cx + 6)},-26M${f(F.cx - 40)},-6Q${f(F.cx - 26)},-24 ${f(F.cx - 6)},-14M${f(F.cx + 40)},-6Q${f(F.cx + 26)},-24 ${f(F.cx + 6)},-14M${f(F.cx - 34)},30Q${f(F.cx)},44 ${f(F.cx + 34)},30`, 2.2, '#b9bccb'),
    },
    front: ({ F, t }) => [-1, 1].map(s => shade(poly([[s * 22 - t * 6, -58], [s * 34 - t * 6, -80], [s * 42 - t * 6, -48]]), '#23212e', { s: 2, lw: 3 })).join(''),
  },
  pose: {
    N: [200, 266], tilt: 2, sw: 186, ww: 124, nw: 20,
    armL: { a1: 140, a2: -96, L1: 74, L2: 70, hand: 'open', talons: true, hs: 1.4, layer: 'front', r: [26, 20, 19, 14], fingers: [[-26, 19], [-9, 22], [8, 21], [24, 17]] },
    armR: { a1: 46, a2: -80, L1: 74, L2: 70, hand: 'open', talons: true, hs: 1.4, layer: 'front', r: [26, 20, 19, 14], fingers: [[-26, 19], [-9, 22], [8, 21], [24, 17]] },
  },
});

// =================== DOCTOR STRANGE ===================
C({
  id: 'doctor-strange', name: 'Doctor Strange', group: 'avengers', ring: '#f08a1c',
  sky: '#120b2a',
  bg: J => B.radial('ds', '#3a2a7a', '#0a0718', 0.5, 0.4, 0.7) + B.mandala([200, 180], 175, '#7f6bff', { op: 0.35, n: 12, w: 2 }) +
    B.mandala([200, 180], 110, '#56d8c9', { op: 0.25, n: 6, w: 1.6, a0: 15 }) + B.stars(40, '#cfc8ff', 9),
  front: J => J.arms.map(a => B.mandala(a.W, 52, '#ffa53a', { n: 8, w: 2.6 })).join(''),
  cape: J => {
    const { toG } = J;
    // grand col de la Cape de lévitation
    return [-1, 1].map(s => shade(smooth([toG([s * 16, 24]), toG([s * 84, -10]), toG([s * 122, -70]), toG([s * 118, -120]), toG([s * 92, -112]), toG([s * 70, -70]), toG([s * 40, -30]), toG([s * 24, 0])]), '#c8202e', { s: 8, lw: 3, inner: line(`M${P(toG([s * 40, 0]))}Q${P(toG([s * 80, -40]))} ${P(toG([s * 104, -100]))}`, 2.2, '#7a0f18') })).join('') +
      PR.cape(J, '#c8202e', { spread: 1.2 });
  },
  suit: '#1f2f6a', neckCol: '#1f2f6a', sleeve: '#1f2f6a', forearm: '#1f2f6a', glove: '#e9b48c',
  torso: T => line('M-60,0L40,200M60,0L-40,200', 10, '#c99a36') + line('M-60,0L40,200M60,0L-40,200', 1.6, INK, 'opacity="0.7"') +
    circle([0, 64], 20, `fill="#e0b13a" stroke="${INK}" stroke-width="2.6"`) + ellipse([0, 64], 13, 7, `fill="#2bd96a" stroke="${INK}" stroke-width="2"`) + circle([0, 64], 3.4, `fill="${INK}"`) +
    path(`M-${T.nw + 6},-6L0,30L${T.nw + 6},-6`, `fill="#1a1f3a" stroke="${INK}" stroke-width="2.4"`),
  dL: band('#e8e2d0', 0.7, 0.9),
  head: {
    t: -0.06, expr: 'angry', skin: '#eab48c', mouth: 'flat', eyes: { iris: '#6b8aa0', lid: 3 }, shape: { jaw: 1.02, chin: 1.04, cheek: 0.96 }, lines: ['fold', 'forehead'],
    brows: { th: 4.6 },
    beard: ctx => beard(ctx, '#2a1f1c', { type: 'goatee' }),
    front: ctx => hairCap(ctx, '#2a1f1c', F => [[F.cx + 46, -6], [F.cx + 38, -30], [F.cx + 18, -46], [F.cx, -50], [F.cx - 18, -46], [F.cx - 38, -30], [F.cx - 46, -6]], {
      cut: 0, puff: 8, top: [[4, -80]],
      inner: ct => strands([[[-20, -56], [0, -76], [20, -62]], [[-30, -48], [-10, -70], [14, -74]]], ct.light),
    }),
  },
  pose: {
    N: [200, 268], tilt: 0, sw: 178, ww: 124, nw: 18,
    armL: { a1: 150, a2: -104, L1: 72, L2: 62, hand: 'f-mystic', hs: 1.05, ha: -20, layer: 'mid', r: [26, 20, 18, 14] },
    armR: { a1: 30, a2: -76, L1: 72, L2: 62, hand: 'f-mystic', hs: 1.05, ha: 20, layer: 'mid', r: [26, 20, 18, 14] },
  },
});

// =================== CAPTAIN MARVEL ===================
C({
  id: 'captain-marvel', name: 'Captain Marvel', group: 'avengers', ring: '#f5c518',
  sky: '#1a1440',
  bg: J => B.radial('cm', '#ffdf6a', '#3a1f6e', 0.5, 0.42, 0.75) + B.rays([200, 180], '#fff6c8', 24, 0.3) + B.stars(30, '#fff', 5, 160) + B.speed([200, 200], '#fff', 30, 170, 0.35, 8),
  behind: J => J.arms.map(a => B.aura(a.W, 46, '#ffd25a', 0.9)).join(''),
  front: J => J.arms.map(a => B.energy(a.W, 18, '#ffcf4a', '#fffbe8')).join(''),
  suit: '#1f3f9a', neckCol: '#1f3f9a', sleeve: '#c8202e', forearm: '#1f3f9a', glove: '#c8202e',
  torso: T => [-1, 1].map(s => shade(smooth([[s * 30, 40], [s * (T.sw / 2 + 30), 0], [s * (T.sw / 2 + 30), 270], [s * T.ww * 0.42, 270], [s * T.ww * 0.34, 150]], true), '#c8202e', { s: 6, lw: 2.4 })).join('') +
    bust(T, INK, 0.4) + path(B.starShape([0, 66], 30, 0.42), `fill="#f5c518" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`) +
    `<rect x="-60" y="176" width="120" height="14" fill="#f5c518" stroke="${INK}" stroke-width="2"/>`,
  dL: band('#c8202e', 0.7, 1.5),
  head: {
    t: 0.18, expr: 'determined', skin: '#f6d0b0', mouth: 'lips', lip: '#c0505a', mouthW: 0.82,
    shape: FEM, eyes: femEyes('#3b6fc4'), brows: { th: 3.4, arch: 2 }, eyeSocket: false,
    back: longHair('#f2c64a', { w: 60, len: 96, skew: 10 }),
    front: ctx => hairCap(ctx, '#f2c64a', F => [[F.cx + 48, 0], [F.cx + 36, -30], [F.cx + 20, -46], [F.cx - 6, -38], [F.cx - 30, -44], [F.cx - 46, -20], [F.cx - 50, 10]], { cut: 10, puff: 9 }),
  },
  pose: {
    N: [200, 266], tilt: -4, htilt: 2, sw: 158, ww: 102, nw: 14, hs: 1.1,
    armL: { a1: 128, a2: 112, L1: 70, L2: 62, hand: 'fist', hs: 1.3, layer: 'mid', r: [21, 16, 15, 12] },
    armR: { a1: -52, a2: -86, L1: 70, L2: 62, hand: 'fist', hs: 1.3, layer: 'back', r: [21, 16, 15, 12] },
  },
});

// =================== ANT-MAN ===================
C({
  id: 'ant-man', name: 'Ant-Man', group: 'avengers', ring: '#c41e2a',
  sky: '#b9e07a',
  bg: J => B.sky(['#e9f7c0', '#a8d870', '#4d8f2e'], 'am') + PR.flower([320, 90], 90, '#ffffff', '#f5c518', 12) + PR.grass() +
    [[60, 320, 20], [330, 330, -15], [110, 360, 10]].map(([x, y, a]) => g(ellipse([0, 0], 10, 6, `fill="${INK}"`) + ellipse([-12, 0], 7, 5, `fill="${INK}"`) + ellipse([12, 0], 12, 7, `fill="${INK}"`) + line('M-6,0L-10,10M0,0L0,11M6,0L10,10M-6,0L-10,-10M0,0L0,-11M6,0L10,-10M-16,-2L-26,-10', 1.6), `transform="translate(${x} ${y}) rotate(${a}) scale(1.3)"`)).join(''),
  suit: '#b51e28', neckCol: '#2a2a32', sleeve: '#b51e28', forearm: '#2a2a32', glove: '#2a2a32',
  torso: T => [-1, 1].map(s => path(`M${s * 20},10L${s * 70},10L${s * 50},140L${s * 26},140Z`, `fill="#2a2a32" stroke="${INK}" stroke-width="2"`)).join('') +
    `<rect x="-70" y="180" width="140" height="18" fill="#9aa3ad" stroke="${INK}" stroke-width="2.2"/>` + circle([0, 189], 12, `fill="#c41e2a" stroke="${INK}" stroke-width="2"`) +
    line('M-26,40V140M26,40V140', 2, '#7a121a'),
  head: {
    t: -0.12, expr: 'determined', skin: '#c41e2a', ears: false, shape: { wid: 1.06, cran: 1.02, jaw: 1.04 },
    mask: {
      type: 'full', color: '#b51e28', lens: 'round', ls: 1.35, lensFill: '#ff8a6a', border: 4.5,
      pattern: ({ F }) => shade(smooth([[F.cx - 34, 16], [F.cx + 34, 16], [F.cx + 30, 44], [F.cx + 14, 58], [F.cx - 14, 58], [F.cx - 30, 44]]), '#b8c0c8', {
        s: 4, inner: line(`M${f(F.cx - 20)},30H${f(F.cx + 20)}M${f(F.cx - 18)},38H${f(F.cx + 18)}M${f(F.cx - 14)},46H${f(F.cx + 14)}`, 2, '#5a626c'),
      }) + shade(smooth([[F.cx - 6, -66], [F.cx + 6, -66], [F.cx + 8, -20], [F.cx, -12], [F.cx - 8, -20]]), '#b8c0c8', { s: 2, lw: 2.4 }),
    },
    front: ({ F, t }) => [-1, 1].map(s => shade(smooth([[s * 44 - t * 4, -18], [s * 54 - t * 4, -12], [s * 54 - t * 4, 10], [s * 44 - t * 4, 14]]), '#b8c0c8', { s: 2, lw: 2.6 }) +
      line(`M${f(s * 52 - t * 4)},-14Q${f(s * 64)},-60 ${f(s * 46)},-96`, 3, INK)).join(''),
  },
  pose: {
    N: [196, 270], tilt: -5, sw: 182, ww: 128, nw: 20,
    armL: { a1: 140, a2: 100, L1: 72, L2: 66, hand: 'fist', layer: 'back', r: [25, 19, 18, 14] },
    armR: { a1: 64, a2: -112, L1: 58, L2: 34, hand: 'f-fist', hs: 1.35, ha: 10, layer: 'front', r: [26, 21, 21, 18] },
  },
});

// =================== LA GUÊPE ===================
C({
  id: 'la-guepe', name: 'La Guêpe', group: 'avengers', ring: '#f5c518',
  sky: '#7fd0f0',
  bg: J => {
    let hex = '';
    for (let y = -20; y < 420; y += 42) for (let x = -20; x < 420; x += 48) hex += path(B.starShape([x + ((y / 42) % 2) * 24, y], 24, 1, 6, 0), `fill="none" stroke="#fff" stroke-width="2"`);
    return B.sky(['#bfeaff', '#7fc8ef', '#f7d65a'], 'wp') + g(hex, 'opacity="0.35"') + PR.flower([70, 360], 70, '#ff9ac8', '#f5c518', 8) + PR.flower([350, 380], 56, '#ffffff', '#f5c518', 9);
  },
  behind: J => PR.wings(J, { insect: true, col: '#d6f6ff' }),
  front: J => B.beam(add(J.arms[1].W, [0, -6]), [430, -40], 12, '#ffd83a') + B.energy(J.arms[1].W, 16, '#ffd83a'),
  suit: '#1f1f26', neckCol: '#1f1f26', sleeve: '#f5c518', forearm: '#1f1f26', glove: '#f5c518',
  torso: T => path(`M${-T.sw / 2 - 10},20L0,110L${T.sw / 2 + 10},20L${T.sw / 2 + 10},60L0,150L${-T.sw / 2 - 10},60Z`, `fill="#f5c518" stroke="${INK}" stroke-width="2.4"`) + bust(T, '#55556a', 0.7) +
    `<rect x="-60" y="176" width="120" height="14" fill="#f5c518" stroke="${INK}" stroke-width="2"/>`,
  head: {
    t: 0.3, expr: 'smirk', skin: '#f6d0b0', mouth: 'lips', lip: '#c8405a', mouthW: 0.78, blush: true,
    shape: FEM, eyes: femEyes('#4a3a2a', { look: [2, 0] }), brows: { th: 3.2, arch: 2 }, eyeSocket: false,
    back: () => hair([[-46, -44], [-56, -10], [-56, 30], [-46, 44], [0, 40], [46, 44], [60, 30], [60, -10], [48, -44]], '#16141c', { s: 6 }),
    front: ctx => hairCap(ctx, '#16141c', F => [[F.cx + 50, 32], [F.cx + 44, -20], [F.cx + 30, -28], [F.cx + 10, -30], [F.cx - 10, -30], [F.cx - 30, -28], [F.cx - 44, -20], [F.cx - 50, 32], [F.cx - 58, 34]], {
      cut: 34, puff: 8, inner: ct => line('M-44,-34Q0,-52 46,-34', 6, '#f5c518') + line('M-44,-34Q0,-52 46,-34', 1.4, INK),
    }) + [-1, 1].map(s => line(`M${s * 18},-70Q${s * 26},-96 ${s * 40},-104`, 2.6) + circle([s * 40, -104], 4.5, `fill="#f5c518" stroke="${INK}" stroke-width="2"`)).join(''),
  },
  pose: {
    N: [190, 266], tilt: 8, htilt: -6, sw: 150, ww: 96, nw: 14, hs: 1.1,
    armL: { a1: 130, a2: 150, L1: 68, L2: 60, hand: 'fist', hs: 1.25, layer: 'mid', r: [19, 15, 14, 11] },
    armR: { a1: -12, a2: -30, L1: 66, L2: 58, hand: 'f-palm', hs: 0.95, ha: 40, layer: 'mid', r: [19, 15, 14, 11] },
  },
});

// =================== VISION ===================
C({
  id: 'vision', name: 'Vision', group: 'avengers', ring: '#2f9a5a',
  sky: '#0c2a26',
  bg: J => {
    let c = '';
    for (let i = 0; i < 14; i++) c += line(`M${i * 30},400V${300 - (i * 37) % 120}H${i * 30 + 20}V${180 - (i * 53) % 100}`, 2, '#3fe0a0');
    return B.radial('vi', '#1f6a5a', '#06120f', 0.5, 0.4, 0.7) + g(c, 'opacity="0.35"') + circle([200, 160], 150, `fill="none" stroke="#f5c518" stroke-width="3" opacity="0.35"`) + circle([200, 160], 120, `fill="none" stroke="#3fe0a0" stroke-width="2" opacity="0.3" stroke-dasharray="6 6"`);
  },
  front: J => {
    const gem = add(J.H, [0, -44 * J.hs]);
    return B.aura(gem, 20, '#ffe66a', 0.8);
  },
  cape: J => PR.cape(J, '#f2c230', { spread: 0.9 }) + [-1, 1].map(s => shade(smooth([J.toG([s * 20, 14]), J.toG([s * 66, -30]), J.toG([s * 90, -100]), J.toG([s * 70, -110]), J.toG([s * 44, -40]), J.toG([s * 28, 14])]), '#f2c230', { s: 5, lw: 3 })).join(''),
  suit: '#2c8a4e', neckCol: '#c42a3a', sleeve: '#2c8a4e', forearm: '#2c8a4e', glove: '#f2c230',
  torso: T => path('M-70,10L0,120L70,10L50,10L0,90L-50,10Z', `fill="#f2c230" stroke="${INK}" stroke-width="2.4"`) + line('M-40,130L0,190L40,130', 2.4, '#1a5a32') +
    `<rect x="-60" y="196" width="120" height="14" fill="#f2c230" stroke="${INK}" stroke-width="2"/>`,
  head: {
    t: 0.16, expr: 'calm', skin: '#c42a3a', mouth: 'flat', shape: { jaw: 1.0, chin: 1.0, cran: 1.06 }, ears: true,
    eyes: { type: 'white' }, brows: { none: true }, eyeSocket: true,
    mid: ({ F }) => line(`M${f(F.cx - 30)},-24L${f(F.cx)},-46L${f(F.cx + 30)},-24M${f(F.cx - 20)},-58L${f(F.cx)},-68L${f(F.cx + 20)},-58M${f(F.cx - 40)},-40L${f(F.cx - 30)},-24M${f(F.cx + 40)},-40L${f(F.cx + 30)},-24`, 2.2, '#2a8a4e') +
      path(`M${f(F.cx)},-52L${f(F.cx + 9)},-40L${f(F.cx)},-28L${f(F.cx - 9)},-40Z`, `fill="#ffe14a" stroke="${INK}" stroke-width="2.2"`) + path(`M${f(F.cx - 3)},-44L${f(F.cx)},-48L${f(F.cx + 2)},-42Z`, `fill="#fff"`),
  },
  pose: {
    N: [200, 268], tilt: 3, htilt: -4, sw: 176, ww: 122, nw: 18,
    armL: { a1: 112, a2: -10, L1: 72, L2: 66, hand: 'fist', layer: 'front', r: [24, 18, 17, 13] },
    armR: { a1: 10, a2: -36, L1: 72, L2: 56, hand: 'f-palm', hs: 1.1, ha: 30, layer: 'mid', r: [24, 18, 17, 13] },
  },
});

// =================== SCARLET WITCH ===================
const hexWisp = (c, r, seed) => {
  let out = '';
  for (let i = 0; i < 4; i++) {
    const a = i * 90 + seed * 30;
    out += line(`M${P(c)}Q${P(add(c, polar(r, a + 40)))} ${P(add(c, polar(r * 1.4, a + 90)))}`, 5, '#ff2a4a', 'filter="url(#glow)" opacity="0.85"');
  }
  return B.aura(c, r * 0.8, '#ff2a4a', 0.75) + out + circle(c, r * 0.32, `fill="#ffd6de" filter="url(#glow)"`);
};
C({
  id: 'scarlet-witch', name: 'Scarlet Witch', group: 'avengers', ring: '#c8102e',
  sky: '#1a0408',
  bg: J => {
    let sw = '';
    for (let i = 0; i < 6; i++) sw += path(`M200,200m${-40 - i * 26},0a${40 + i * 26},${40 + i * 26} 0 1,1 ${80 + i * 52},0`, `fill="none" stroke="#ff2a4a" stroke-width="${6 - i * 0.6}" opacity="${0.35 - i * 0.04}" transform="rotate(${i * 50} 200 200)"`);
    return B.radial('sw', '#7a0a1e', '#120206', 0.5, 0.42, 0.7) + sw + B.stars(30, '#ff9aa8', 13);
  },
  front: J => J.arms.map((a, i) => hexWisp(a.W, 34, i)).join(''),
  suit: '#a8142a', neckCol: '#f3cdb4', sleeve: '#a8142a', forearm: '#a8142a', glove: '#3a0a12',
  torso: T => path(`M-${T.nw + 4},-6Q0,60 ${T.nw + 4},-6L${T.nw + 14},-4Q0,80 -${T.nw + 14},-4Z`, `fill="#f3cdb4" stroke="${INK}" stroke-width="2"`) + bust(T, INK, 0.5) +
    path('M-26,20Q0,120 26,20', `fill="#f3cdb4" stroke="${INK}" stroke-width="2"`) + line('M-70,0Q-40,120 -50,260M70,0Q40,120 50,260', 3, '#5a0814'),
  head: {
    t: -0.25, expr: 'angry', skin: '#f3cdb4', mouth: 'lips', lip: '#9a1a2e', mouthW: 0.8,
    shape: FEM, eyes: femEyes('#ff3a5a', { type: 'glow', glow: '#ff6a80' }), brows: { th: 3.4, arch: 2 }, eyeSocket: false,
    back: longHair('#8a2a1e', { w: 60, len: 120, skew: -6 }),
    front: ctx => hairCap(ctx, '#8a2a1e', F => [[F.cx + 52, 30], [F.cx + 40, -16], [F.cx + 20, -40], [F.cx, -44], [F.cx - 20, -40], [F.cx - 40, -16], [F.cx - 52, 30]], { cut: 30, puff: 9 }) +
      // diadème
      shade(poly([[-36, -40], [-16, -46], [0, -76], [16, -46], [36, -40], [0, -32]]), '#c8102e', { s: 3, lw: 2.6 }),
  },
  pose: {
    N: [200, 266], tilt: 2, sw: 150, ww: 98, nw: 14, hs: 1.1,
    armL: { a1: 150, a2: -120, L1: 66, L2: 58, hand: 'f-palm', hs: 0.9, ha: -30, layer: 'mid', r: [19, 15, 14, 11] },
    armR: { a1: 30, a2: -60, L1: 66, L2: 58, hand: 'f-mystic', hs: 0.9, ha: 30, layer: 'mid', r: [19, 15, 14, 11] },
  },
});

// =================== FALCON ===================
C({
  id: 'falcon', name: 'Falcon', group: 'avengers', ring: '#c8202e',
  sky: '#5aa0e0',
  bg: J => B.sky(['#2f6fc4', '#7ab8ee', '#cfe8ff'], 'fa') + B.rays([200, 120], '#ffffff', 20, 0.15) + B.clouds('#ffffff', 330, 7, 1, 1) + B.speed([200, 200], '#fff', 30, 170, 0.45, 2),
  behind: J => PR.wings(J, { col: '#c8202e', col2: '#e8e8ee', span: 1.15, len: 1.1 }),
  suit: '#c8202e', neckCol: '#c8202e', sleeve: '#2a2a32', forearm: '#c8202e', glove: '#2a2a32',
  torso: T => path('M-60,0L0,60L60,0L60,30L0,100L-60,30Z', `fill="#e8e8ee" stroke="${INK}" stroke-width="2.4"`) + pecs(T, INK, 0.4) + abs(T, INK, 0.35) +
    line('M-60,140H60', 6, '#2a2a32'),
  head: {
    t: 0.1, expr: 'determined', skin: '#7a4a30', mouth: 'smirk', shape: { jaw: 1.04 }, lines: ['fold'],
    beard: ctx => beard(ctx, '#1a1210', { type: 'mous' }),
    front: ctx => hairCap(ctx, '#15100e', F => [[F.cx + 44, -20], [F.cx + 26, -40], [F.cx, -44], [F.cx - 26, -40], [F.cx - 44, -20]], { cut: -14, puff: 3 }) +
      // lunettes rouges
      shade(smooth([[-48, -12], [ctx.F.cx - 30, -18], [ctx.F.cx, -10], [ctx.F.cx + 30, -18], [48, -12], [ctx.F.cx + 34, 10], [ctx.F.cx + 6, 6], [ctx.F.cx, 0], [ctx.F.cx - 6, 6], [ctx.F.cx - 34, 10]]), '#d8202e', { s: 3, lw: 3, inner: path(`M${f(ctx.F.cx - 34)},-8L${f(ctx.F.cx - 16)},-12L${f(ctx.F.cx - 26)},2Z`, `fill="#fff" opacity="0.5"`) }),
  },
  pose: {
    N: [200, 268], tilt: 0, sw: 182, ww: 126, nw: 20,
    armL: { a1: 160, a2: 200, L1: 72, L2: 62, hand: 'fist', layer: 'mid', r: [25, 19, 18, 14] },
    armR: { a1: 20, a2: -20, L1: 72, L2: 62, hand: 'fist', layer: 'mid', r: [25, 19, 18, 14] },
  },
});

// =================== WINTER SOLDIER ===================
const METAL = '#b4bcc6';
C({
  id: 'winter-soldier', name: 'Winter Soldier', group: 'avengers', ring: '#7a8796',
  sky: '#55667a',
  bg: J => {
    const R = B.rng(4);
    let snow = '';
    for (let i = 0; i < 70; i++) snow += circle([R() * 400, R() * 400], R() * 2.4 + 0.6, `fill="#fff" opacity="${f(0.5 + R() * 0.5)}"`);
    return B.sky(['#2c3a4c', '#6f8296', '#c9d4de'], 'ws') + path(B.starShape([110, 140], 110), `fill="#b81e28" opacity="0.28"`) + B.pines('#1c2430', 7, 8, 380, 110, 200) + snow;
  },
  suit: '#2a2e38', neckCol: '#2a2e38', sleeve: '#2a2e38', forearm: '#2a2e38', glove: '#1c1e24',
  torso: T => line('M-50,20V220M50,20V220', 2, '#14161c') + `<rect x="-70" y="100" width="140" height="16" fill="#1a1c22" stroke="${INK}" stroke-width="2"/>` +
    line('M70,10L-60,200', 10, '#1a1c22') + pecs(T, '#5a606e', 0.7) + [-1, 0, 1].map(k => `<rect x="${-44 + k * 30}" y="130" width="24" height="30" rx="3" fill="#3a3f4c" stroke="${INK}" stroke-width="2"/>`).join(''),
  head: {
    t: 0.2, expr: 'angry', skin: '#efc6a2', mouth: 'flat', shape: { jaw: 1.06 }, eyes: { iris: '#4a6a8a', lid: 3 },
    back: longHair('#3a2a22', { w: 54, len: 58, skew: 2, top: -50 }),
    mid: ({ F, hd, t }) => ellipse([F.eye[0][0], -4], 17, 10, `fill="#1a1414" opacity="0.4"`) + ellipse([F.eye[1][0], -4], 15, 10, `fill="#1a1414" opacity="0.4"`) +
      clip(hd, shade(smooth([[F.cx - 50, 10], [F.cx, 8], [F.cx + 50, 10], [F.cx + 44, 40], [F.cx + 18, 64], [F.cx - 18, 64], [F.cx - 44, 40]]), '#1f2128', { s: 4, lw: 3, inner: line(`M${f(F.cx + t * 8 - 10)},34H${f(F.cx + t * 8 + 10)}M${f(F.cx + t * 8 - 10)},40H${f(F.cx + t * 8 + 10)}M${f(F.cx + t * 8 - 10)},46H${f(F.cx + t * 8 + 10)}`, 2, '#555b68') })),
    front: ctx => hairCap(ctx, '#3a2a22', F => [[F.cx + 50, 14], [F.cx + 40, -14], [F.cx + 30, -34], [F.cx + 12, -26], [F.cx + 2, -40], [F.cx - 14, -28], [F.cx - 26, -40], [F.cx - 42, -16], [F.cx - 50, 14]], { cut: 14, puff: 7 }),
  },
  pose: {
    N: [196, 266], tilt: -4, sw: 186, ww: 128, nw: 20,
    armL: {
      a1: 118, a2: 150, L1: 72, L2: 62, hand: 'grip', layer: 'mid', r: [25, 19, 18, 14],
      prop: arm => ({ front: PR.gun(add(arm.W, [-6, 4]), 160, { s: 1.2, len: 64, flip: -1 }) }),
    },
    armR: {
      a1: 64, a2: -104, L1: 64, L2: 32, hand: 'f-fist', hs: 1.6, ha: 8, layer: 'front', r: [28, 23, 23, 20],
      upper: METAL, lower: METAL, glove: METAL,
      dU: (L, r) => path(B.starShape([L * 0.3, 0], 13, 0.42, 5, 0), `fill="#c8202e" stroke="${INK}" stroke-width="1.6"`) + line(`M${f(L * 0.6)},-30V30M${f(L * 0.8)},-30V30`, 1.6, '#6a737e'),
      dL: (L, r) => line(`M${f(L * 0.4)},-30V30`, 1.6, '#6a737e'),
    },
  },
});

// =================== NICK FURY ===================
C({
  id: 'nick-fury', name: 'Nick Fury', group: 'avengers', ring: '#5a6474',
  sky: '#0f1a28',
  bg: J => {
    const eagle = path('M200,150L120,110L150,150L100,150L160,175L130,200L200,185L270,200L240,175L300,150L250,150L280,110Z', `fill="none" stroke="#cfd8e2" stroke-width="5"`);
    return B.radial('nf', '#2c3e58', '#070c14', 0.5, 0.4, 0.75) + B.hud('#9fb8d0', 0.25, 6) + g(circle([200, 160], 110, `fill="none" stroke="#cfd8e2" stroke-width="6"`) + eagle, 'opacity="0.14"') +
      path('M10,60L120,48L150,40L250,40L280,48L390,60L330,74L70,74Z', `fill="#1a2433" stroke="#0a0f18" stroke-width="2"`) + [100, 300].map(x => circle([x, 66], 20, `fill="none" stroke="#3a4a60" stroke-width="5"`)).join('');
  },
  suit: '#16171c', neckCol: '#16171c', sleeve: '#16171c', glove: '#16171c',
  torso: T => [-1, 1].map(s => shade(poly([[s * 10, 0], [s * 70, -10], [s * 76, 30], [s * 34, 140], [s * 6, 140]]), '#202228', { s: 4, lw: 2.4 })).join('') +
    shade(smooth([[-T.nw - 12, -12], [T.nw + 12, -12], [T.nw + 16, 20], [-T.nw - 16, 20]]), '#202228', { s: 3, lw: 2.4 }),
  head: {
    t: -0.15, expr: 'angry', skin: '#5e3a26', mouth: 'frown', shape: { jaw: 1.08, chin: 1.02, cran: 0.98 }, lines: ['fold', 'forehead', 'bags'],
    eyes: { iris: '#2a1a12', lid: 2.5 },
    beard: ctx => beard(ctx, '#1c1412', { type: 'goatee' }),
    front: ({ F, t }) => {
      const e = F.eye[1];
      return line(`M${f(e[0] - 4)},-10L${f(-42 + t * 10)},-40M${f(e[0] + 10)},-4L${f(46 - t * 4)},-2`, 3.4) +
        shade(smooth([[e[0] - 15, -6], [e[0], -16], [e[0] + 15, -6], [e[0] + 12, 8], [e[0], 14], [e[0] - 12, 8]]), '#121216', { s: 2, lw: 2.6 }) +
        line(`M${f(e[0] - 6)},-26L${f(e[0] + 2)},-16M${f(e[0] + 4)},12L${f(e[0] + 10)},24`, 2.2, '#3a2016');
    },
  },
  pose: {
    N: [200, 266], tilt: 3, sw: 190, ww: 134, nw: 20,
    armL: { a1: 128, a2: -70, L1: 72, L2: 64, hand: 'f-palm', hs: 1.05, ha: -16, layer: 'front', r: [27, 21, 20, 15] },
    armR: {
      a1: 50, a2: -52, L1: 70, L2: 54, hand: 'grip', layer: 'mid', r: [27, 21, 20, 15],
      prop: arm => ({ front: PR.gun(add(arm.W, [4, -6]), -52, { s: 1.25, len: 56, flip: 1 }) }),
    },
  },
});

// =================== SHE-HULK ===================
C({
  id: 'she-hulk', name: 'She-Hulk', group: 'avengers', ring: '#7a3fb8',
  sky: '#c04a9a',
  bg: J => B.radial('sh', '#ff9ad0', '#5a1f7a', 0.5, 0.42, 0.7) + B.rays([200, 200], '#ffffff', 22, 0.18) + B.debris([200, 200], 12, '#8a7ab0', 7, 130, 200),
  suit: '#f2f0f6', skin: '#62b45a', neckCol: '#62b45a', sleeve: '#62b45a', glove: '#62b45a', bu: 4, bl: 2,
  torso: T => [-1, 1].map(s => shade(smooth([[s * 26, 10], [s * (T.sw / 2 + 30), 10], [s * (T.sw / 2 + 30), 270], [s * T.ww * 0.36, 270], [s * T.ww * 0.3, 150]], true), '#7a3fb8', { s: 6, lw: 2.4 })).join('') +
    path(`M-${T.nw + 6},-8Q0,40 ${T.nw + 6},-8L${T.nw + 14},-4Q0,60 -${T.nw + 14},-4Z`, `fill="#62b45a" stroke="${INK}" stroke-width="2"`) + bust(T, INK, 0.45) + abs(T, INK, 0.25),
  head: {
    t: 0.2, expr: 'smirk', skin: '#62b45a', mouth: 'lipsmirk', lip: '#2f6e2a', mouthW: 0.86,
    shape: { ...FEM, jaw: 0.92 }, eyes: femEyes('#1f5a2a'), brows: { th: 3.6, arch: 3, col: '#1a3a1c' }, eyeSocket: false,
    back: longHair('#1f4a22', { w: 64, len: 106, skew: 6 }),
    front: ctx => hairCap(ctx, '#1f4a22', F => [[F.cx + 50, 20], [F.cx + 40, -20], [F.cx + 20, -44], [F.cx - 4, -36], [F.cx - 26, -46], [F.cx - 46, -18], [F.cx - 52, 16]], { cut: 20, puff: 10 }),
  },
  pose: {
    N: [200, 268], tilt: -3, sw: 186, ww: 112, nw: 17, hs: 1.08,
    armL: { a1: 112, a2: 30, L1: 74, L2: 62, hand: 'fist', hs: 1.4, layer: 'mid', r: [26, 20, 19, 14] },
    armR: { a1: -4, a2: -98, L1: 70, L2: 66, hand: 'fist', hs: 1.45, layer: 'back', r: [28, 22, 20, 15], bu: 7 },
  },
});

// =================== SHANG-CHI ===================
const tenRings = arm => {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const p = lerp(arm.E, arm.W, 0.3 + i * 0.13);
    out += g(ellipse([0, 0], 5, 22, `fill="none" stroke="#5fd8ff" stroke-width="7" opacity="0.5" filter="url(#blur6)"`) + ellipse([0, 0], 5, 21, `fill="none" stroke="${INK}" stroke-width="6"`) + ellipse([0, 0], 5, 21, `fill="none" stroke="#9ff0ff" stroke-width="3.4"`), tr(p, arm.ang));
  }
  return out;
};
C({
  id: 'shang-chi', name: 'Shang-Chi', group: 'avengers', ring: '#d4a017',
  sky: '#3a0a0a',
  bg: J => {
    const lan = (x, y, s) => line(`M${x},0V${y - 20 * s}`, 1.5, '#2a0a0a') + ellipse([x, y], 16 * s, 20 * s, `fill="#e8402a" stroke="${INK}" stroke-width="2"`) + line(`M${x - 16 * s},${y}H${x + 16 * s}M${x},${y - 20 * s}V${y + 20 * s}`, 1.4, '#a01a10') + `<rect x="${x - 6 * s}" y="${y + 18 * s}" width="${12 * s}" height="${6 * s}" fill="#f5c518"/>`;
    return B.radial('sc', '#a8261e', '#1a0404', 0.5, 0.4, 0.7) + [150, 110, 70].map(r => circle([200, 190], r, `fill="none" stroke="#f5c518" stroke-width="3" opacity="0.3"`)).join('') +
      path('M0,330L60,300L140,300L200,280L260,300L340,300L400,330L400,400L0,400Z', `fill="#1a0505"`) + lan(60, 90, 1.2) + lan(340, 70, 1) + lan(300, 130, 0.8);
  },
  suit: '#b51e24', neckCol: '#f0c8a0', sleeve: '#b51e24', forearm: '#b51e24', glove: '#f0c8a0',
  torso: T => line('M-14,-4V230', 3, '#f5c518') + [40, 70, 100, 130].map(y => line(`M-14,${y}H10`, 4, '#f5c518')).join('') +
    shade(smooth([[-T.nw - 4, -14], [T.nw + 4, -14], [T.nw + 8, 10], [-T.nw - 8, 10]]), '#b51e24', { s: 2, lw: 2.4 }) + line('M-70,180H70', 8, '#1a1a1a'),
  head: {
    t: -0.3, expr: 'determined', skin: '#f0c8a0', mouth: 'flat', shape: { jaw: 1.0 },
    eyes: { iris: '#2a1a12', h: 0.85 },
    front: ctx => hairCap(ctx, '#121014', F => [[F.cx + 46, -8], [F.cx + 34, -26], [F.cx + 18, -38], [F.cx + 2, -30], [F.cx - 14, -44], [F.cx - 30, -34], [F.cx - 46, -14]], { cut: -8, puff: 7 }),
  },
  pose: {
    N: [210, 268], tilt: -8, htilt: 4, sw: 176, ww: 120, nw: 18,
    armL: { a1: 168, a2: 196, L1: 66, L2: 56, hand: 'f-palm', hs: 1.15, ha: -62, layer: 'front', r: [24, 18, 17, 13], prop: arm => ({ mid: tenRings(arm) }) },
    armR: { a1: 98, a2: -60, L1: 72, L2: 60, hand: 'fist', layer: 'mid', r: [24, 18, 17, 13], prop: arm => ({ mid: tenRings(arm) }) },
  },
});

// =================== MS. MARVEL ===================
C({
  id: 'ms-marvel', name: 'Ms. Marvel', group: 'avengers', ring: '#e8402a',
  sky: '#3fc4d0',
  bg: J => {
    const R = B.rng(31);
    let dood = '';
    for (let i = 0; i < 9; i++) dood += path(B.starShape([R() * 400, R() * 260], 8 + R() * 10), `fill="none" stroke="#fff" stroke-width="2.4" opacity="0.8"`);
    return B.sky(['#ff7ab8', '#ffb15a', '#3fc4d0'], 'mm') + B.city({ far: '#e05a9a', near: '#2a4a8a', win: '#ffe46a', base1: 380, base2: 430, seed: 21 }) + dood +
      circle([330, 80], 26, `fill="none" stroke="#fff" stroke-width="3" opacity="0.8"`) + path('M60,60l10,-20l10,20l-20,-12h20z', `fill="none" stroke="#fff" stroke-width="2.4"`);
  },
  suit: '#1e2f6e', neckCol: '#1e2f6e', sleeve: '#c8202e', forearm: '#1e2f6e', glove: '#1e2f6e',
  torso: T => path('M-8,40L22,40L4,78L24,78L-16,130L-2,90L-20,90Z', `fill="#f5c518" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`) +
    shade(smooth([[-T.nw - 16, -8], [0, 14], [T.nw + 16, -8], [T.nw + 30, 6], [40, 40], [60, 150], [44, 150], [24, 40], [0, 28], [-T.nw - 26, 8]]), '#c8202e', { s: 3, lw: 2.4 }) + bust(T, '#4a5a9a', 0.8),
  head: {
    t: 0.22, expr: 'determined', skin: '#c8906a', mouth: 'smile', mouthW: 0.85, blush: true,
    shape: { ...FEM, wid: 0.94 }, eyes: femEyes('#3a2414'), brows: { th: 3.8, arch: 2 }, eyeSocket: false,
    back: longHair('#2a1a14', { w: 56, len: 70, skew: -4 }),
    mid: ({ F }) => '',
    front: ctx => hairCap(ctx, '#2a1a14', F => [[F.cx + 48, 10], [F.cx + 34, -26], [F.cx + 14, -42], [F.cx - 10, -36], [F.cx - 30, -44], [F.cx - 48, -14], [F.cx - 50, 14]], { cut: 14, puff: 8 }),
    mask: { type: 'domino', color: '#1e2f6e' },
  },
  pose: {
    N: [214, 270], tilt: 6, htilt: -4, sw: 156, ww: 102, nw: 14, hs: 1.1,
    armL: { a1: 106, a2: -96, L1: 62, L2: 30, hand: 'f-fist', hs: 2.3, ha: -8, layer: 'front', r: [24, 22, 24, 26] },
    armR: { a1: -36, a2: -82, L1: 64, L2: 56, hand: 'f-two', hs: 0.95, ha: 10, layer: 'back', r: [19, 15, 14, 11] },
  },
});

// =================== MOON KNIGHT ===================
const crescent = (c, r, a = 0) => g(path(`M0,${-r}A${r},${r} 0 1,1 0,${r}A${r * 0.75},${r * 0.9} 0 1,0 0,${-r}Z`, `fill="#f2f2f6" stroke="${INK}" stroke-width="2.2"`), tr(c, a));
C({
  id: 'moon-knight', name: 'Moon Knight', group: 'avengers', ring: '#d8dde6',
  sky: '#0c1226',
  bg: J => B.sky(['#070b1a', '#1a2a50', '#3a4a7a'], 'mk') + circle([200, 150], 140, `fill="#f6f2dc"`) + circle([200, 150], 160, `fill="#fffbe6" opacity="0.3" filter="url(#blur14)"`) +
    [[150, 110, 20], [250, 190, 14], [230, 90, 10]].map(([x, y, r]) => circle([x, y], r, `fill="#d8d2b8" opacity="0.7"`)).join('') +
    B.city({ far: '#1a2240', near: '#0a0e1c', win: '#e8e0a0', base1: 390, base2: 430, seed: 41 }),
  cape: J => PR.cape(J, '#e8eaf0', { spread: 1.3 }),
  suit: '#e8eaf0', neckCol: '#e8eaf0', sleeve: '#e8eaf0', glove: '#e8eaf0',
  torso: T => crescent([0, 64], 26, 0) + line('M-60,180H60', 10, '#b8bcc8') + line('M-60,180H60', 1.5) + pecs(T, '#8a90a0', 0.6),
  head: {
    t: -0.1, expr: 'angry', skin: '#eceef4', ears: false, shape: { jaw: 1.02 },
    back: ({ t }) => hair([[-50, -60], [-70, -10], [-74, 40], [-60, 80], [0, 90], [60, 80], [74, 40], [70, -10], [50, -60], [0, -84]], '#e8eaf0', { s: 8 }),
    mask: {
      type: 'full', color: '#eceef4', lens: 'narrow', ls: 1.1, ang: 6, lensFill: '#ffffff', border: 4,
      pattern: ({ F }) => [0, 1].map(i => ellipse([F.eye[i][0], -2], 20, 13, `fill="#1a1c24" opacity="0.85"`)).join('') + line(`M${f(F.cx - 30)},30Q${f(F.cx)},40 ${f(F.cx + 30)},30`, 1.6, '#9aa0b0'),
    },
    front: ({ t }) => {
      // capuche
      const d = smooth([[-56, 40], [-60, -10], [-50, -60], [0, -86], [50, -60], [60, -10], [56, 40], [46, 30], [48, -10], [38, -50], [0, -70], [-38, -50], [-48, -10], [-46, 30]]);
      return shade(d, '#e8eaf0', { s: 5, lw: 3 });
    },
  },
  pose: {
    N: [200, 268], tilt: 4, sw: 180, ww: 124, nw: 18,
    armL: { a1: 134, a2: 110, L1: 72, L2: 64, hand: 'fist', layer: 'mid', r: [25, 19, 18, 14] },
    armR: {
      a1: -24, a2: -70, L1: 70, L2: 60, hand: 'fist', layer: 'back', r: [25, 19, 18, 14],
      prop: arm => ({ front: [-34, 0, 34].map((a, i) => crescent(add(arm.W, polar(54, -84 + a)), 13, -84 + a)).join('') }),
    },
  },
});

// =================== MILES MORALES ===================
C({
  id: 'miles-morales', name: 'Miles Morales', group: 'spider', ring: '#d8202e',
  sky: '#2a0f3a',
  bg: J => {
    const R = B.rng(17);
    let spl = '';
    for (let i = 0; i < 10; i++) {
      const c = [R() * 400, R() * 300], r = 14 + R() * 30, col = ['#ff3aa0', '#3ad8ff', '#ffe23a', '#9a5aff'][i % 4];
      spl += circle(c, r, `fill="${col}" opacity="0.55"`);
      for (let k = 0; k < 5; k++) spl += circle(add(c, polar(r + 6 + R() * 16, R() * 360)), 2 + R() * 4, `fill="${col}" opacity="0.6"`);
    }
    return B.sky(['#1a0a2e', '#4a1a6e', '#c43a8a'], 'mi') + spl + B.city({ far: '#3a1a5a', near: '#12081e', win: '#ff5aa8', base1: 380, base2: 430, seed: 19 });
  },
  front: J => {
    const W = J.arms[1].W;
    return B.aura(W, 30, '#ffe23a', 0.6) + [0, 1, 2, 3].map(i => B.bolt(B.zig(W, add(W, polar(50, -150 + i * 50)), 4, 9, i + 2), '#fffbd0', 2.6, '#ffe23a')).join('');
  },
  suit: '#18181f', neckCol: '#18181f', sleeve: '#18181f', glove: '#d8202e',
  torso: T => webLines([0, 74], 260, 14, 1.3, '#d8202e', 0.9) + spider([0, 76], 1.2, '#d8202e') + pecs(T, '#3a3a48', 0.6),
  dU: limbWeb('#d8202e'), dL: limbWeb('#d8202e'),
  head: {
    t: -0.25, expr: 'angry', skin: '#18181f', ears: false, shape: { jaw: 0.94 },
    mask: { type: 'full', color: '#1c1c24', lens: 'spidey', ang: 6, ls: 1.25, pattern: ({ F }) => webLines([F.cx + 2, 22], 150, 14, 1.4, '#d8202e', 0.95) },
  },
  pose: {
    N: [204, 264], tilt: 8, htilt: -6, sw: 168, ww: 114,
    armL: { a1: 140, a2: 160, L1: 70, L2: 56, hand: 'f-web', hs: 1.05, ha: -50, layer: 'front', r: [23, 17, 16, 12] },
    armR: { a1: -30, a2: -84, L1: 70, L2: 60, hand: 'fist', layer: 'back', r: [23, 17, 16, 12] },
  },
});

// =================== SPIDER-GWEN ===================
C({
  id: 'spider-gwen', name: 'Spider-Gwen', group: 'spider', ring: '#ff4fa0',
  sky: '#f7b8d8',
  bg: J => B.sky(['#ffd1e6', '#c8b8ff', '#5ad8d8'], 'sg') + B.city({ far: '#b090d8', near: '#5a4a9a', win: '#ffe6f6', base1: 380, base2: 430, seed: 29 }) +
    B.web([0, 0], 200, '#ffffff', 2, 0.7, 10, 0) + B.webLine(add(J.arms[1].W, [0, -20]), [330, -20], 3),
  cape: J => {
    // capuche relevée derrière la tête
    const { H } = J;
    return '';
  },
  suit: '#f4f4f8', neckCol: '#f4f4f8', sleeve: '#18181f', forearm: '#f4f4f8', glove: '#18181f',
  torso: T => webLines([0, 70], 240, 12, 1.2, '#1a1a22', 0.6) + spider([0, 74], 1, INK) +
    [-1, 1].map(s => path(`M${s * (T.sw / 2 + 10)},20L${s * 50},40L${s * 46},120L${s * (T.ww / 2 + 10)},200Z`, `fill="#18181f" stroke="${INK}" stroke-width="2"`)).join('') +
    line('M-60,0Q0,30 60,0', 4, '#ff4fa0') + bust(T, '#9a9aaa', 0.6),
  dL: (L, r) => band('#ff4fa0', 0.6, 0.72)(L, r) + band('#2bd8d8', 0.72, 0.8)(L, r),
  head: {
    t: 0.3, expr: 'determined', skin: '#f4f4f8', ears: false, shape: { ...FEM, jaw: 0.9, chin: 0.88 },
    back: () => hair([[-50, -50], [-64, -6], [-64, 40], [-54, 80], [0, 92], [54, 80], [64, 40], [64, -6], [50, -50], [0, -84]], '#f4f4f8', { s: 8 }),
    mask: {
      type: 'full', color: '#f4f4f8', lens: 'spidey', ang: 2, ls: 1.2, border: 4.5,
      pattern: ({ F }) => webLines([F.cx + 2, 20], 120, 12, 1.1, '#2bd8d8', 0.7) + line(`M${f(F.cx - 46)},-20Q${f(F.cx)},-34 ${f(F.cx + 46)},-20`, 3, '#ff4fa0'),
    },
    front: ({ t }) => {
      const d = smooth([[-56, 46], [-60, -10], [-48, -62], [0, -88], [48, -62], [60, -10], [56, 46], [46, 36], [46, -10], [36, -50], [0, -70], [-36, -50], [-46, -10], [-46, 36]]);
      return shade(d, '#f4f4f8', { s: 5, lw: 3, inner: line('M-44,-30Q-40,-60 0,-74Q40,-60 44,-30', 3, '#ff4fa0') });
    },
  },
  pose: {
    N: [196, 266], tilt: -6, htilt: -10, sw: 150, ww: 96, nw: 14, hs: 1.1,
    armL: { a1: 130, a2: -14, L1: 66, L2: 58, hand: 'f-web', hs: 0.95, ha: 60, layer: 'front', r: [19, 15, 14, 11] },
    armR: { a1: -46, a2: -76, L1: 66, L2: 58, hand: 'grip', hs: 1.25, layer: 'back', r: [19, 15, 14, 11] },
  },
});

// =================== VENOM ===================
// Gueule énorme, crocs irréguliers, bave et langue
const venomMaw = (x, y, W = 62, H = 46, tongue = '') => {
  // rictus : coins relevés jusqu'aux tempes, crocs qui suivent la courbe
  const q = (P0, C, P2, t) => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P2[1]];
  const L0 = [x - W, y - 24], R0 = [x + W, y - 24], Ct = [x, y + 8], Cb = [x, y + H * 1.7];
  const d = `M${P(L0)}Q${P(Ct)} ${P(R0)}Q${P(Cb)} ${P(L0)}Z`;
  const R = B.rng(77);
  let teeth = '', upper = '';
  const n = 15;
  for (let i = 0; i < n; i++) {
    const t = 0.03 + (i / (n - 1)) * 0.94;
    const pt = q(L0, Ct, R0, t), pb = q(L0, Cb, R0, t);
    const gap = pb[1] - pt[1];
    const L = Math.min(gap * 0.55, 10 + R() * 12 + (i === 3 || i === n - 4 ? 10 : 0));
    upper += path(`M${f(pt[0] - 4.5)},${f(pt[1] - 6)}L${f(pt[0] + 4.5)},${f(pt[1] - 6)}L${f(pt[0] + R() * 2 - 1)},${f(pt[1] + L)}Z`, `fill="#f2efe2" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"`);
    const L2 = Math.min(gap * 0.45, 8 + R() * 10);
    teeth += path(`M${f(pb[0] - 4)},${f(pb[1] + 6)}L${f(pb[0] + 4)},${f(pb[1] + 6)}L${f(pb[0] + R() * 2 - 1)},${f(pb[1] - L2)}Z`, `fill="#e6e2d2" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"`);
  }
  let drool = '';
  for (const t of [0.22, 0.4, 0.62, 0.8]) {
    const pt = q(L0, Ct, R0, t), pb = q(L0, Cb, R0, t);
    drool += line(`M${f(pt[0])},${f(pt[1] + 4)}Q${f(pt[0] + 3)},${f((pt[1] + pb[1]) / 2)} ${f(pt[0] + 1)},${f(pb[1] - 2)}`, 1.8, '#cfe6f0', 'opacity="0.8"');
  }
  // ordre : fond de gueule, crocs du bas, contour, langue (par-dessus la lèvre du bas), crocs du haut, ombre du fond
  return path(d, `fill="#1a0408"`) + clip(d, ellipse([x, y + H * 0.55], W * 0.6, H * 0.4, `fill="#6a0f1e" filter="url(#soft)"`) + teeth) +
    path(d, `fill="none" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"`) + tongue +
    clip(d, ellipse([x - 6, y + 4], 18, 9, `fill="#0a0204" opacity="0.85" filter="url(#soft)"`) + upper + drool) +
    path(`M${P(L0)}Q${P(Ct)} ${P(R0)}`, `fill="none" stroke="${INK}" stroke-width="3.4"`);
};
const SYMB = { base: '#0f0f15', dark: '#020204', light: '#2c3350' };
const gloss = (pts, w = 3, op = 0.55) => line(smooth(pts, false), w, '#b8d0ff', `opacity="${op}"`);
C({
  id: 'venom', name: 'Venom', group: 'spider', ring: '#e8e8f0',
  sky: '#05060c',
  bg: J => {
    let ten = '';
    const R = B.rng(23);
    for (let i = 0; i < 14; i++) {
      const a = 180 + R() * 180, c = [200 + Math.cos(a * Math.PI / 180) * 40, 250];
      ten += line(smooth([c, add(c, polar(80, a + 25)), add(c, polar(150, a - 25)), add(c, polar(240, a + 15))], false), 16 - i * 0.7, '#020205');
    }
    let rain = '';
    for (let i = 0; i < 60; i++) rain += `M${f(R() * 420)},${f(R() * 400)}l-5,16`;
    return B.radial('vn', '#2a1438', '#020206', 0.5, 0.35, 0.7) + B.city({ far: '#140e22', near: '#06040c', win: '#9a6aff', base1: 380, base2: 430, seed: 33 }) +
      path(rain, `stroke="#8a8ab0" stroke-width="1" opacity="0.35"`) + ten;
  },
  behind: J => {
    let t = '';
    const R = B.rng(5);
    for (let i = 0; i < 8; i++) {
      const s = i % 2 ? 1 : -1, p0 = J.toG([s * 120, 10 + i * 6]);
      t += line(smooth([p0, add(p0, [s * (40 + R() * 30), -40 - R() * 40]), add(p0, [s * (60 + R() * 40), -110 - R() * 50]), add(p0, [s * (30 + R() * 50), -170 - R() * 40])], false), 9 - i * 0.6, INK);
    }
    return t;
  },
  suit: SYMB, neckCol: SYMB, sleeve: SYMB, glove: SYMB, bu: 9, bl: 5, armK: 1.25, swK: 1.2, headK: 1.0,
  torso: T => {
    const sp = s => path(smooth([[0, 34], [s * 34, 6], [s * 96, -26], [s * 84, 22], [s * 34, 46], [s * 20, 96], [s * 62, 170], [s * 44, 176], [s * 4, 110]]), `fill="#ecebf2" stroke="${INK}" stroke-width="2.4"`);
    return pecs(T, '#000000', 0.9) + abs(T, '#000000', 0.8) + sp(-1) + sp(1) + ellipse([0, 64], 22, 38, `fill="#ecebf2" stroke="${INK}" stroke-width="2.4"`) +
      gloss([[-T.sw * 0.38, 40], [-T.sw * 0.3, 30], [-T.sw * 0.18, 34]], 5) + gloss([[-30, 120], [-26, 140], [-30, 160]], 3, 0.4);
  },
  dU: (L, r) => gloss([[L * 0.15, -r * 0.55], [L * 0.5, -r * 0.75], [L * 0.85, -r * 0.5]], 4, 0.5),
  dL: (L, r) => gloss([[L * 0.15, -r * 0.5], [L * 0.6, -r * 0.6]], 3, 0.45),
  head: {
    t: 0.06, expr: 'furious', skin: SYMB, ears: false, shape: { jaw: 1.3, wid: 1.18, chin: 1.2, cran: 1.04, cheek: 1.12 },
    mask: {
      type: 'full', color: SYMB, lens: 'venom', ang: 4, ls: 0.92, border: 5, shine: false, dy: -14, modelK: 0.4,
      pattern: ({ F }) => gloss([[F.cx - 34, -50], [F.cx - 16, -60], [F.cx + 6, -60]], 5, 0.6) + gloss([[F.cx - 44, -10], [F.cx - 42, 10]], 3, 0.4),
    },
    front: ({ F }) => {
      const x = F.cx + 3, y = 22;
      // la langue part du fond de la gueule, passe par-dessus les dents du bas et pend sur le menton
      const tx = x - 6, ty = y + 8;
      const tongue = shade(smooth([[tx - 14, ty], [tx + 8, ty - 2], [tx + 10, ty + 18], [tx + 4, ty + 38], [tx - 6, ty + 58], [tx - 20, ty + 70], [tx - 30, ty + 64], [tx - 22, ty + 50], [tx - 16, ty + 30], [tx - 16, ty + 12]]), '#b82a52', {
        s: 5, lw: 3, inner: line(`M${tx - 2},${ty + 6}Q${tx - 4},${ty + 36} ${tx - 20},${ty + 62}`, 2, '#7a1434'),
      });
      return venomMaw(x, y, 52, 36, tongue);
    },
  },
  pose: {
    N: [200, 290], tilt: 0, sw: 262, ww: 176, nw: 34, hs: 1.46, nl: -10,
    armL: { a1: 128, a2: 64, L1: 76, L2: 72, hand: 'open', talons: true, clawCol: '#f0eee6', hs: 1.75, layer: 'front', r: [38, 30, 29, 21], fingers: [[-30, 22], [-11, 26], [8, 25], [26, 20]] },
    armR: { a1: 52, a2: 116, L1: 76, L2: 72, hand: 'open', talons: true, clawCol: '#f0eee6', hs: 1.75, layer: 'front', r: [38, 30, 29, 21], fingers: [[-30, 22], [-11, 26], [8, 25], [26, 20]] },
  },
});

// =================== CARNAGE ===================
const CARN = { base: '#c4141e', dark: '#4a0208', light: '#ff5a4a' };
const carnStreaks = (seed, n = 10, w = 120, h = 220, y0 = 0) => {
  const R = B.rng(seed);
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = (R() - 0.5) * w * 2, y = y0 + R() * h;
    o += line(smooth([[x, y], [x + 10 + R() * 20, y + 20 + R() * 20], [x - 6 + R() * 12, y + 50 + R() * 30], [x + 14, y + 90 + R() * 30]], false), 3 + R() * 4, '#14040a', 'opacity="0.85"');
  }
  return o;
};
C({
  id: 'carnage', name: 'Carnage', group: 'spider', ring: '#c4141e',
  sky: '#14020a',
  bg: J => {
    const R = B.rng(13);
    let spl = '';
    for (let i = 0; i < 14; i++) {
      const c = [R() * 400, R() * 300], r = 6 + R() * 22;
      spl += circle(c, r, `fill="#a8101c" opacity="0.6"`);
      for (let k = 0; k < 4; k++) spl += circle(add(c, polar(r + 4 + R() * 14, R() * 360)), 1.5 + R() * 3, `fill="#a8101c" opacity="0.6"`);
    }
    let ten = '';
    for (let i = 0; i < 12; i++) {
      const a = 180 + R() * 180, c = [200, 250];
      ten += line(smooth([c, add(c, polar(90, a + 30)), add(c, polar(170, a - 30)), add(c, polar(260, a + 10))], false), 12 - i * 0.6, i % 2 ? '#8a0a14' : '#14040a');
    }
    return B.radial('cg', '#5a0a14', '#050104', 0.5, 0.4, 0.72) + spl + B.city({ far: '#2a060c', near: '#0a0204', win: '#ff3a3a', base1: 390, base2: 430, seed: 57 }) + ten;
  },
  suit: CARN, neckCol: CARN, sleeve: CARN, glove: CARN, bu: 7, bl: 4, armK: 1.15, swK: 1.15, headK: 1.0,
  torso: T => pecs(T, '#000000', 0.7) + abs(T, '#000000', 0.6) + carnStreaks(3, 14, T.sw * 0.5, 230, 0),
  dU: (L, r) => line(`M${f(L * 0.1)},${f(-r * 0.3)}Q${f(L * 0.4)},${f(r * 0.5)} ${f(L * 0.9)},${f(-r * 0.2)}`, 4, '#14040a'),
  dL: (L, r) => line(`M${f(L * 0.2)},${f(r * 0.3)}Q${f(L * 0.5)},${f(-r * 0.5)} ${f(L)},${f(r * 0.2)}`, 4, '#14040a'),
  head: {
    t: -0.12, expr: 'furious', skin: CARN, ears: false, shape: { jaw: 1.24, wid: 1.08, chin: 1.2, cran: 0.98, cheek: 1.06 },
    mask: {
      type: 'full', color: CARN, lens: 'venom', ang: 12, ls: 1.0, border: 5, shine: false, dy: -10, modelK: 0.6,
      pattern: ({ F }) => carnStreaks(9, 14, 50, 140, -80),
    },
    front: ({ F }) => venomMaw(F.cx + 2, 24, 56, 40),
  },
  pose: {
    N: [196, 276], tilt: -8, htilt: 10, sw: 220, ww: 150, nw: 28, hs: 1.24, nl: -8,
    armL: {
      a1: 104, a2: -84, L1: 58, L2: 60, hand: 'none', layer: 'front', r: [32, 25, 24, 18],
      // bras transformé en lame
      prop: arm => ({ front: shade(smooth([add(arm.W, polar(20, arm.ang + 90)), add(arm.W, polar(70, arm.ang + 20)), add(arm.W, polar(150, arm.ang - 2)), add(arm.W, polar(60, arm.ang - 14)), add(arm.W, polar(18, arm.ang - 90))], true, 1 / 8), CARN, { s: 4, lw: 3, inner: carnStreaks(4, 3, 40, 60, 0) }) }),
    },
    armR: { a1: 52, a2: -112, L1: 72, L2: 64, hand: 'claw', clawCol: '#e8202e', clawLen: 70, hs: 1.5, hrot: 10, layer: 'front', r: [32, 25, 24, 18] },
  },
});

// =================== BOUFFON VERT ===================
const pumpkin = (c, r) => circle(c, r * 1.6, `fill="#ff8a1a" opacity="0.5" filter="url(#blur6)"`) + shade(smooth([[c[0], c[1] - r], [c[0] + r * 0.9, c[1] - r * 0.6], [c[0] + r, c[1] + r * 0.2], [c[0] + r * 0.6, c[1] + r * 0.9], [c[0], c[1] + r], [c[0] - r * 0.6, c[1] + r * 0.9], [c[0] - r, c[1] + r * 0.2], [c[0] - r * 0.9, c[1] - r * 0.6]]), '#f07a1a', {
  s: 4, inner: line(`M${c[0]},${c[1] - r}V${c[1] + r}M${c[0] - r * 0.5},${c[1] - r * 0.85}Q${c[0] - r * 0.7},${c[1]} ${c[0] - r * 0.5},${c[1] + r * 0.9}M${c[0] + r * 0.5},${c[1] - r * 0.85}Q${c[0] + r * 0.7},${c[1]} ${c[0] + r * 0.5},${c[1] + r * 0.9}`, 1.6, '#a84a10') +
    path(`M${c[0] - r * 0.5},${c[1] - r * 0.1}l${r * 0.3},${-r * 0.3}l${r * 0.1},${r * 0.3}Z M${c[0] + r * 0.5},${c[1] - r * 0.1}l${-r * 0.3},${-r * 0.3}l${-r * 0.1},${r * 0.3}Z M${c[0] - r * 0.5},${c[1] + r * 0.3}L${c[0] - r * 0.2},${c[1] + r * 0.5}L${c[0]},${c[1] + r * 0.3}L${c[0] + r * 0.2},${c[1] + r * 0.5}L${c[0] + r * 0.5},${c[1] + r * 0.3}L${c[0]},${c[1] + r * 0.7}Z`, `fill="#ffe14a"`),
}) + path(`M${c[0]},${c[1] - r}l-2,-8l6,0z`, `fill="#3a6a1a" stroke="${INK}" stroke-width="1.5"`);
C({
  id: 'bouffon-vert', name: 'Bouffon Vert', group: 'spider', ring: '#5a9a2a',
  sky: '#2a1040',
  bg: J => {
    const bat = (x, y, s) => g(path('M0,0Q-10,-10 -24,-4Q-18,-2 -16,4Q-8,0 0,6Q8,0 16,4Q18,-2 24,-4Q10,-10 0,0Z', `fill="#140a1e"`), `transform="translate(${x} ${y}) scale(${s})"`);
    return B.sky(['#1a0a2e', '#6a2a6e', '#f08a3a'], 'gg') + circle([310, 100], 60, `fill="#ffd27a"`) + circle([310, 100], 76, `fill="#ffb84a" opacity="0.4" filter="url(#blur14)"`) +
      bat(270, 60, 1.6) + bat(80, 80, 1.2) + bat(120, 140, 0.9) + B.city({ far: '#4a1a4a', near: '#1a0a1e', win: '#ffb84a', base1: 390, base2: 430, seed: 37 });
  },
  suit: '#6a3f9a', neckCol: '#6a3f9a', sleeve: '#7ab83a', forearm: '#7ab83a', glove: '#6a3f9a',
  torso: T => {
    let mail = '';
    for (let y = 120; y < 270; y += 10) for (let x = -90; x < 90; x += 12) mail += circle([x + ((y / 10) % 2) * 6, y], 4, `fill="none" stroke="#3a6a1a" stroke-width="1.4"`);
    return `<rect x="-100" y="110" width="200" height="200" fill="#7ab83a"/>` + mail + path('M-100,110L0,140L100,110L100,100L-100,100Z', `fill="#6a3f9a" stroke="${INK}" stroke-width="2.4"`) +
      line('M-70,80L-30,110M70,80L30,110', 2, '#3a1f5a') + `<rect x="-70" y="200" width="140" height="18" fill="#3a1f5a" stroke="${INK}" stroke-width="2"/>`;
  },
  head: {
    t: -0.2, expr: 'evil', skin: '#7ab83a', mouth: 'smile', mouthW: 1.4, shape: { jaw: 1.0, chin: 1.12, cheek: 1.02 }, lines: ['cheek', 'fold', 'forehead'],
    eyes: { iris: '#e8c020', lid: 3, h: 1.1 }, brows: { th: 6, col: '#2a4a12' },
    front: ({ F, t }) => {
      // oreilles pointues + bonnet violet
      let o = [-1, 1].map(s => {
        const x = s * 44 - t * 6;
        return shade(smooth([[x, -12], [x + s * 30, -40], [x + s * 20, -8], [x + s * 6, 12]]), '#7ab83a', { s: 3, lw: 2.6 });
      }).join('');
      o += shade(smooth([[-50, -26], [-48, -58], [-20, -78], [20, -80], [50, -62], [70, -60], [96, -36], [84, -34], [60, -46], [52, -24], [20, -40], [-20, -40]]), '#6a3f9a', { s: 6, lw: 3, inner: line('M-48,-34Q0,-50 52,-30', 3, '#3a1f5a') });
      return o;
    },
  },
  pose: {
    N: [200, 268], tilt: -6, htilt: 4, sw: 178, ww: 122, nw: 18,
    armL: { a1: 140, a2: 70, L1: 72, L2: 60, hand: 'open', talons: false, layer: 'mid', r: [24, 18, 17, 13] },
    armR: {
      a1: -40, a2: -76, L1: 70, L2: 60, hand: 'f-palm', hs: 0.95, ha: 16, layer: 'mid', r: [24, 18, 17, 13],
      prop: arm => ({ front: pumpkin(add(arm.W, [4, -30]), 26) }),
    },
  },
});

// =================== DAREDEVIL ===================
C({
  id: 'daredevil', name: 'Daredevil', group: 'spider', ring: '#b81e24',
  sky: '#2a0608',
  bg: J => {
    let rain = '';
    const R = B.rng(43);
    for (let i = 0; i < 60; i++) { const x = R() * 420, y = R() * 400; rain += `M${f(x)},${f(y)}l-6,18`; }
    return B.radial('dd', '#8a1a1e', '#120304', 0.5, 0.4, 0.7) + [60, 110, 160, 210].map(r => circle([200, 190], r, `fill="none" stroke="#ff8a8a" stroke-width="2" opacity="0.3"`)).join('') +
      B.city({ far: '#3a0a0e', near: '#14040a', win: '#ff6a5a', base1: 380, base2: 430, seed: 47 }) + path(rain, `stroke="#ffb0b0" stroke-width="1.2" opacity="0.4"`);
  },
  suit: '#b81e24', neckCol: '#b81e24', sleeve: '#b81e24', glove: '#b81e24',
  torso: T => pecs(T, '#5a0a10', 0.8) + abs(T, '#5a0a10', 0.6) +
    path('M-30,48H-6Q14,48 14,70Q14,92 -6,92H-30Z M-20,56V84H-8Q4,84 4,70Q4,56 -8,56Z', `fill="#5a0a10" fill-rule="evenodd"`) + path('M-6,48H18Q38,48 38,70Q38,92 18,92H-6Z M4,56V84H16Q28,84 28,70Q28,56 16,56Z', `fill="#5a0a10" fill-rule="evenodd"`),
  head: {
    t: 0.2, expr: 'angry', skin: '#efc6a2', mouth: 'grit', shape: { jaw: 1.06 }, lines: ['fold'],
    mask: {
      type: 'cowl', color: '#b81e24', top: 12, side: 30, eyes: 'lens', lens: 'narrow', ls: 0.95,
      over: ({ F, t }) => [-1, 1].map(s => shade(smooth([[F.cx * 0.4 + s * 20, -56], [F.cx * 0.4 + s * 30, -84], [F.cx * 0.4 + s * 36, -96], [F.cx * 0.4 + s * 38, -76], [F.cx * 0.4 + s * 34, -52]]), '#b81e24', { s: 2, lw: 2.8 })).join(''),
    },
  },
  pose: {
    N: [196, 268], tilt: 6, htilt: -4, sw: 180, ww: 124, nw: 19,
    armL: { a1: 120, a2: 40, L1: 72, L2: 60, hand: 'fist', layer: 'front', r: [25, 19, 18, 14] },
    armR: {
      a1: -30, a2: -60, L1: 72, L2: 60, hand: 'grip', layer: 'back', r: [25, 19, 18, 14],
      prop: arm => ({ mid: PR.staff(add(arm.W, polar(-50, -30)), add(arm.W, polar(80, -30)), '#b81e24', 10) }),
    },
  },
});

// ---------- cosmos ----------
const space = (id, c1, c2, neb, seed) => B.radial(id, c1, c2, 0.5, 0.4, 0.75) + B.nebula(neb, seed) + B.stars(80, '#ffffff', seed + 1);

// =================== STAR-LORD ===================
C({
  id: 'star-lord', name: 'Star-Lord', group: 'cosmos', ring: '#c8402a',
  sky: '#140a2a',
  bg: J => space('slb', '#3a1a6e', '#07041a', ['#ff5a8a', '#5ad8ff', '#9a5aff'], 3) + B.planet([320, 90], 44, '#e89a4a', '#ffd8a0') + B.planet([70, 300], 26, '#5ab8e8'),
  front: J => J.arms.map(a => B.energy(add(a.W, polar(70, a.ang - 10)), 9, '#ff9a3a')).join(''),
  suit: '#8a2a1e', neckCol: '#f0c8a0', sleeve: '#8a2a1e', forearm: '#8a2a1e', glove: '#3a2418',
  torso: T => shade(smooth([[-26, -4], [26, -4], [30, 200], [-30, 200]]), '#2a2a32', { s: 4, lw: 2.4 }) +
    [-1, 1].map(s => shade(poly([[s * 22, -4], [s * 60, -6], [s * 50, 40], [s * 30, 60]]), '#a8382a', { s: 3, lw: 2.4 })).join('') +
    line('M-70,40V200M70,40V200', 1.8, '#5a1a12') + `<rect x="-70" y="200" width="140" height="14" fill="#3a2418" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="40" y="186" width="30" height="22" rx="3" fill="#c9c9cf" stroke="${INK}" stroke-width="2"/>`,
  head: {
    t: -0.2, expr: 'smirk', skin: '#f0c8a0', mouth: 'smirk', shape: { jaw: 1.04 }, lines: ['fold'],
    eyes: { iris: '#5a7a4a' },
    beard: ctx => beard(ctx, '#7a4a2a', { type: 'stubble' }),
    front: ctx => hairCap(ctx, '#7a4a2a', F => [[F.cx + 46, -4], [F.cx + 36, -30], [F.cx + 16, -44], [F.cx - 4, -36], [F.cx - 24, -46], [F.cx - 42, -28], [F.cx - 48, -4]], { cut: -2, puff: 8, inner: ct => strands([[[-20, -70], [0, -56], [10, -40]], [[10, -76], [24, -60], [34, -40]]], ct.dark) }),
  },
  pose: {
    N: [200, 268], tilt: 4, htilt: -2, sw: 180, ww: 124, nw: 18,
    armL: { a1: 124, a2: -98, L1: 70, L2: 58, hand: 'grip', layer: 'mid', r: [25, 19, 18, 14], prop: arm => ({ front: PR.gun(add(arm.W, [-8, -4]), -125, { s: 1.15, len: 50, flip: -1, col: '#5a5f6b' }) }) },
    armR: { a1: 56, a2: -82, L1: 70, L2: 58, hand: 'grip', layer: 'mid', r: [25, 19, 18, 14], prop: arm => ({ front: PR.gun(add(arm.W, [8, -4]), -55, { s: 1.15, len: 50, col: '#5a5f6b' }) }) },
  },
});

// =================== GAMORA ===================
C({
  id: 'gamora', name: 'Gamora', group: 'cosmos', ring: '#2f9a5a',
  sky: '#1a0a1e',
  bg: J => space('gmb', '#6a1a3a', '#0a0410', ['#ff3a6a', '#ff9a3a', '#7a2a9a'], 7) + B.planet([90, 90], 36, '#3a8a6a'),
  suit: '#2a2a34', neckCol: '#5aa86a', sleeve: '#2a2a34', forearm: '#2a2a34', glove: '#5aa86a',
  torso: T => bust(T, '#5a5a6e', 0.8) + line('M-40,0L0,60L40,0', 2.4, '#5a5a6e') + `<rect x="-60" y="176" width="120" height="14" fill="#5a3a2a" stroke="${INK}" stroke-width="2"/>` +
    path(`M-${T.nw + 4},-6Q0,44 ${T.nw + 4},-6L${T.nw + 12},-4Q0,64 -${T.nw + 12},-4Z`, `fill="#5aa86a" stroke="${INK}" stroke-width="2"`),
  head: {
    t: 0.25, expr: 'angry', skin: '#5aa86a', mouth: 'lips', lip: '#2a5a3a', mouthW: 0.8,
    shape: FEM, eyes: femEyes('#c8402a'), brows: { th: 3.4, arch: 2, col: '#1a1a1a' }, eyeSocket: false,
    mid: ({ F }) => [0, 1].map(i => line(`M${f(F.eye[i][0] + (i ? 4 : -4))},8L${f(F.eye[i][0] + (i ? 10 : -10))},20M${f(F.eye[i][0] + (i ? 10 : -10))},10L${f(F.eye[i][0] + (i ? 14 : -14))},16`, 2, '#c8d0d8')).join(''),
    back: longHair('#2a1420', { w: 58, len: 104, skew: 10 }),
    front: ctx => hairCap(ctx, '#2a1420', F => [[F.cx + 50, 30], [F.cx + 40, -16], [F.cx + 22, -42], [F.cx - 2, -34], [F.cx - 24, -44], [F.cx - 46, -16], [F.cx - 52, 24]], { cut: 26, puff: 9, inner: ct => strands([[[30, -60], [46, -40], [54, -10]]], '#c83a7a') }),
  },
  pose: {
    N: [196, 268], tilt: -4, htilt: 2, sw: 150, ww: 96, nw: 14, hs: 1.1,
    armL: { a1: 120, a2: -40, L1: 66, L2: 58, hand: 'grip', hs: 1.25, layer: 'front', r: [19, 15, 14, 11], prop: arm => ({ back: PR.sword(arm.W, -58, 190, '#dfe6ee', { w: 7 }) }) },
    armR: { a1: 50, a2: 100, L1: 66, L2: 58, hand: 'fist', hs: 1.25, layer: 'mid', r: [19, 15, 14, 11] },
  },
});

// =================== DRAX ===================
const TAT = '#8e1414';
const draxTat = T => {
  const sw = T.sw / 2;
  let d = '';
  for (const s of [-1, 1]) {
    d += `M${f(s * sw * 0.86)},20Q${f(s * sw * 0.4)},18 ${f(s * 22)},44Q${f(s * 8)},70 ${f(s * 30)},86Q${f(s * 60)},96 ${f(s * sw * 0.6)},70Q${f(s * sw * 0.7)},52 ${f(s * sw * 0.5)},50`;
    d += `M${f(s * 8)},110Q${f(s * 40)},124 ${f(s * 34)},150Q${f(s * 26)},176 ${f(s * 48)},196`;
    d += `M${f(s * sw * 0.7)},110Q${f(s * sw * 0.56)},150 ${f(s * sw * 0.64)},200`;
  }
  return line(d, 5.5, TAT);
};
C({
  id: 'drax', name: 'Drax', group: 'cosmos', ring: '#a82a2a',
  sky: '#3a140a',
  bg: J => B.sky(['#1a0610', '#7a1e1a', '#e07a34'], 'dx') + B.planet([300, 90], 50, '#f0c06a') + B.rays([200, 220], '#ffd6a0', 22, 0.12) + B.rocks(['#5a2a1e', '#3a1a14'], 51, 10, 320) + B.debris([200, 220], 10, '#6a3a2a', 5, 140, 200),
  suit: '#7c9184', skin: '#7c9184', neckCol: '#7c9184', sleeve: '#7c9184', glove: '#7c9184', bu: 8, bl: 4, swK: 1.22, armK: 1.3, headK: 0.94,
  torso: T => pecs(T, '#1a2a22', 0.9) + abs(T, '#1a2a22', 0.8) + draxTat(T) + `<rect x="-130" y="222" width="260" height="40" fill="#4a2e22" stroke="${INK}" stroke-width="2.4"/>` + line('M-130,232H130', 3, '#2a1a12'),
  dU: (L, r) => line(`M${f(L * 0.1)},${f(-r * 0.5)}Q${f(L * 0.4)},${f(r * 0.6)} ${f(L * 0.7)},${f(-r * 0.2)}Q${f(L * 0.85)},${f(-r * 0.6)} ${f(L)},${f(-r * 0.1)}`, 5, TAT),
  dL: (L, r) => line(`M${f(L * 0.1)},${f(r * 0.3)}Q${f(L * 0.45)},${f(-r * 0.6)} ${f(L * 0.8)},${f(r * 0.2)}`, 4.5, TAT),
  head: {
    t: 0.08, expr: 'furious', skin: '#7c9184', mouth: 'grit', mouthW: 1.25, shape: { jaw: 1.28, wid: 1.12, chin: 1.14, cran: 0.9, cheek: 1.08 }, lines: ['fold', 'forehead'],
    eyes: { iris: '#5a1a14', lid: 4, s: 0.92 }, brows: { th: 9, col: '#3e5046', w: 1.2 },
    mid: ({ F }) => line(`M${f(F.cx)},-66V-26M${f(F.cx)},-26Q${f(F.cx - 14)},-30 ${f(F.cx - 26)},-42Q${f(F.cx - 38)},-50 ${f(F.cx - 40)},-30Q${f(F.cx - 40)},-14 ${f(F.cx - 30)},-12M${f(F.cx)},-26Q${f(F.cx + 14)},-30 ${f(F.cx + 26)},-42Q${f(F.cx + 38)},-50 ${f(F.cx + 40)},-30Q${f(F.cx + 40)},-14 ${f(F.cx + 30)},-12M${f(F.cx - 34)},14Q${f(F.cx - 36)},30 ${f(F.cx - 28)},44M${f(F.cx + 34)},14Q${f(F.cx + 36)},30 ${f(F.cx + 28)},44M${f(F.cx - 14)},-62Q${f(F.cx)},-50 ${f(F.cx + 14)},-62`, 4.6, TAT),
  },
  pose: {
    N: [200, 276], tilt: 0, sw: 236, ww: 164, nw: 30, hs: 1.1, nl: 0,
    armL: { a1: 100, a2: -58, L1: 66, L2: 62, hand: 'grip', hs: 1.45, layer: 'front', r: [36, 28, 27, 20], prop: arm => ({ front: PR.sword(arm.W, -104, 100, '#dfe6ee', { w: 10, guard: '#4a2e22', grip: '#2a1a12' }) }) },
    armR: { a1: 80, a2: -122, L1: 66, L2: 62, hand: 'grip', hs: 1.45, layer: 'front', r: [36, 28, 27, 20], prop: arm => ({ front: PR.sword(arm.W, -76, 100, '#dfe6ee', { w: 10, guard: '#4a2e22', grip: '#2a1a12' }) }) },
  },
});

// =================== GROOT ===================
const bark = (n = 8, seed = 3) => {
  const R = B.rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) { const x = -60 + R() * 120, y = -70 + R() * 140; d += `M${f(x)},${f(y)}q${f(R() * 6 - 3)},${f(14 + R() * 10)} ${f(R() * 4 - 2)},${f(26 + R() * 16)}`; }
  return line(d, 2, '#3a2414', 'opacity="0.7"');
};
const twig = (a, b, col = '#6a4426') => line(`M${P(a)}L${P(b)}`, 7, INK) + line(`M${P(a)}L${P(b)}`, 4, col);
const leaf = (c, a, s = 1) => g(path('M0,0Q8,-8 18,0Q8,8 0,0Z', `fill="#5ac83a" stroke="${INK}" stroke-width="1.6"`), `transform="translate(${f(c[0])} ${f(c[1])}) rotate(${a}) scale(${s})"`);
C({
  id: 'groot', name: 'Groot', group: 'cosmos', ring: '#6a4426',
  sky: '#0f2a1a',
  bg: J => {
    const R = B.rng(61);
    let ff = '';
    for (let i = 0; i < 26; i++) ff += circle([R() * 400, R() * 320], 2 + R() * 3, `fill="#d8ff7a" filter="url(#glow)" opacity="${f(0.5 + R() * 0.5)}"`);
    return B.radial('gr', '#3a7a3a', '#06140a', 0.5, 0.35, 0.75) + B.leaves(['#0e2a14', '#163a1c', '#1f4a24'], 63, 24, 0) + ff;
  },
  front: J => {
    const W = J.arms[1].W;
    return twig(W, add(W, [30, -40])) + twig(add(W, [14, -20]), add(W, [50, -14])) + leaf(add(W, [30, -40]), -60, 1.3) + leaf(add(W, [50, -14]), -10, 1.3) + leaf(add(W, [24, -30]), 30, 1);
  },
  suit: '#7a5230', skin: '#8a5e36', neckCol: '#7a5230', sleeve: '#7a5230', glove: '#7a5230',
  torso: T => bark(18, 5) + line('M-40,20Q-30,90 -40,200M40,20Q30,90 40,200M0,40Q8,120 0,220', 3, '#4a2e18'),
  dU: (L, r) => line(`M0,${f(-r * 0.3)}H${f(L)}M0,${f(r * 0.4)}H${f(L)}`, 2, '#4a2e18'), dL: (L, r) => line(`M0,${f(-r * 0.3)}H${f(L)}M0,${f(r * 0.4)}H${f(L)}`, 2, '#4a2e18'),
  head: {
    t: -0.15, expr: 'calm', skin: '#8a5e36', mouth: 'smile', mouthW: 0.9, ears: false, shape: { jaw: 0.9, chin: 0.92, cran: 1.06, wid: 0.98 },
    eyes: { iris: '#5a3a1a', s: 1.12, h: 1.2 }, brows: { th: 5, col: '#4a2e18', ang: -3 }, nose: false, eyeSocket: true,
    mid: ({ F }) => bark(10, 9) + line(`M${f(F.cx - 30)},-40Q${f(F.cx - 20)},-50 ${f(F.cx - 6)},-44M${f(F.cx + 30)},-42Q${f(F.cx + 20)},-52 ${f(F.cx + 6)},-46`, 2, '#3a2414'),
    front: () => twig([-20, -60], [-40, -100]) + twig([-30, -84], [-56, -96]) + twig([16, -62], [30, -104]) + twig([28, -90], [50, -100]) + leaf([-40, -100], -110) + leaf([-56, -96], -160) + leaf([30, -104], -70) + leaf([50, -100], -20) +
      circle([42, -70], 7, `fill="#ff9ad0" stroke="${INK}" stroke-width="1.6"`) + circle([42, -70], 2.6, `fill="#ffe14a"`),
  },
  pose: {
    N: [200, 268], tilt: 3, htilt: -4, sw: 176, ww: 116, nw: 22,
    armL: { a1: 120, a2: 80, L1: 76, L2: 66, hand: 'open', hs: 1.4, layer: 'mid', r: [24, 18, 17, 13], fingers: [[-26, 26], [-9, 30], [8, 29], [24, 24]] },
    armR: { a1: -10, a2: -54, L1: 74, L2: 62, hand: 'open', hs: 1.4, layer: 'mid', r: [24, 18, 17, 13], fingers: [[-26, 26], [-9, 30], [8, 29], [24, 24]] },
  },
});

// =================== ROCKET ===================
C({
  id: 'rocket', name: 'Rocket', group: 'cosmos', ring: '#e07a1a',
  sky: '#14102a',
  bg: J => space('rkb', '#2a3a7a', '#06081a', ['#5ad8ff', '#ff9a3a', '#3a5aff'], 11) + B.planet([300, 80], 34, '#c86a3a', '#ffd0a0'),
  front: J => {
    const A = J.arms[0].W, Bw = J.arms[1].W;
    const ang = angle(A, Bw), L = 200;
    const big = `<rect x="-40" y="-16" width="${L}" height="30" rx="6" fill="#5a5f6b" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="${L - 40}" y="-22" width="44" height="42" rx="5" fill="#3a3f4c" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="0" y="-26" width="80" height="12" rx="3" fill="#e07a1a" stroke="${INK}" stroke-width="2.4"/>` + line(`M-30,-6H${L - 50}`, 2, '#9aa0aa') +
      circle([L + 6, -1], 10, `fill="#5ad8ff" filter="url(#glow)"`);
    return g(big, tr(add(A, [0, -8]), ang)) + B.energy(add(A, polar(L + 6, ang)), 10, '#5ad8ff');
  },
  suit: '#e07a1a', neckCol: '#8a6a52', sleeve: '#8a6a52', forearm: '#8a6a52', glove: '#5a4a3a',
  torso: T => line('M0,0V220', 2.4, '#8a3a0a') + `<rect x="-50" y="60" width="40" height="34" rx="4" fill="#b85a10" stroke="${INK}" stroke-width="2"/>` + line('M60,0L-60,200', 8, '#3a2a1e'),
  head: {
    t: 0.18, expr: 'smirk', skin: '#9a7a5e', mouth: 'grit', mouthW: 0.8, ears: false, shape: { jaw: 0.86, chin: 0.8, wid: 1.06, cran: 0.94, cheek: 1.08 },
    eyes: { iris: '#3a2414', s: 1.05 }, brows: { th: 4, col: '#2a1a12' }, nose: false, eyeSocket: false,
    back: () => [-1, 1].map(s => shade(smooth([[s * 18, -52], [s * 34, -84], [s * 50, -86], [s * 58, -48]]), '#6a5240', { s: 3, lw: 3, inner: path(smooth([[s * 28, -56], [s * 38, -76], [s * 48, -76], [s * 50, -52]]), `fill="#e8d0c0"`) })).join(''),
    mid: ({ F, hd, t }) => clip(hd,
      // masque sombre autour des yeux, museau clair, joues blanches
      path(smooth([[F.cx - 60, -20], [F.cx - 30, -18], [F.cx, -6], [F.cx + 30, -18], [F.cx + 60, -20], [F.cx + 50, 14], [F.cx + 22, 10], [F.cx, 12], [F.cx - 22, 10], [F.cx - 50, 14]]), `fill="#2a1e18"`) +
      path(smooth([[F.cx - 40, 18], [F.cx - 20, 12], [F.cx + 20, 12], [F.cx + 40, 18], [F.cx + 30, 56], [F.cx, 64], [F.cx - 30, 56]]), `fill="#efe2d4"`) +
      line(`M${f(F.cx - 20)},-36L${f(F.cx)},-24L${f(F.cx + 20)},-36`, 6, '#efe2d4')) +
      [0, 1].map(i => eye(F.eye[i], F.esc[i] * 1.05, i ? 1 : -1, { iris: '#3a2414', t, lid: 1.5 })).join('') +
      ellipse([F.cx + t * 8, 22], 9, 6, `fill="${INK}"`) + ellipse([F.cx + t * 8 - 3, 20], 3, 1.6, `fill="#fff" opacity="0.6"`) +
      line(`M${f(F.cx - 40)},26L${f(F.cx - 60)},20M${f(F.cx - 40)},32L${f(F.cx - 60)},34M${f(F.cx + 40)},26L${f(F.cx + 60)},20M${f(F.cx + 40)},32L${f(F.cx + 60)},34`, 1.4),
  },
  pose: {
    N: [196, 276], tilt: -4, htilt: 4, sw: 140, ww: 100, nw: 16, hs: 1.24, nl: 8,
    armL: { a1: 110, a2: -10, L1: 54, L2: 50, hand: 'grip', hs: 1.1, layer: 'front', r: [18, 14, 13, 10] },
    armR: { a1: 60, a2: -20, L1: 54, L2: 50, hand: 'grip', hs: 1.1, layer: 'front', r: [18, 14, 13, 10] },
  },
  preHead: J => '',
  front2: true,
});

// =================== NEBULA ===================
C({
  id: 'nebula', name: 'Nebula', group: 'cosmos', ring: '#4a7ac8',
  sky: '#0a0e2a',
  bg: J => space('nbb', '#1a2a6e', '#04061a', ['#3a5aff', '#9a3aff', '#2ad8ff'], 13) + B.planet([300, 300], 70, '#6a3a8a', '#c8a0ff'),
  front: J => {
    const W = J.arms[1].W, tip = add(W, polar(80, -60));
    return B.bolt(B.zig(tip, add(tip, [30, -30]), 3, 6, 1), '#e6fbff', 2.4, '#5fd8ff') + B.bolt(B.zig(tip, add(tip, [-26, -34]), 3, 6, 4), '#e6fbff', 2.4, '#5fd8ff');
  },
  suit: '#2a2234', neckCol: '#4a7ac8', sleeve: '#2a2234', forearm: '#9aa3b0', glove: '#4a7ac8',
  torso: T => bust(T, '#5a5a6e', 0.8) + line('M-50,10L-20,200M50,10L20,200', 2, '#5a4a6e') +
    path(`M-${T.nw + 4},-6Q0,40 ${T.nw + 4},-6L${T.nw + 12},-4Q0,60 -${T.nw + 12},-4Z`, `fill="#4a7ac8" stroke="${INK}" stroke-width="2"`),
  dL: (L, r) => line(`M${f(L * 0.3)},-30V30M${f(L * 0.55)},-30V30M${f(L * 0.8)},-30V30`, 1.6, '#5a626e'),
  head: {
    t: -0.2, expr: 'angry', skin: '#4a7ac8', mouth: 'lips', lip: '#2a3a6a', mouthW: 0.75, ears: true,
    shape: { ...FEM, cran: 1.02 }, eyes: femEyes('#1a1a24', { lid: 3 }), brows: { none: true }, eyeSocket: true,
    mid: ({ F, t }) => shade(smooth([[F.cx + 10, -66], [F.cx + 40, -56], [F.cx + 46, -20], [F.cx + 30, -24], [F.cx + 24, -50]]), '#7a3a9a', { s: 3, lw: 2.4 }) +
      line(`M${f(F.cx - 20)},-64Q${f(F.cx - 30)},-40 ${f(F.cx - 44)},-30M${f(F.cx + 4)},-68V-50M${f(F.cx + 20)},-20L${f(F.cx + 40)},-10L${f(F.cx + 40)},20`, 2.2, '#2a3a6a') +
      circle([F.eye[1][0] + 18, -2], 3, `fill="#9aa3b0" stroke="${INK}" stroke-width="1.4"`),
  },
  pose: {
    N: [200, 268], tilt: 4, htilt: -4, sw: 150, ww: 96, nw: 14, hs: 1.1,
    armL: { a1: 110, a2: 60, L1: 66, L2: 58, hand: 'fist', hs: 1.25, layer: 'mid', r: [19, 15, 14, 11] },
    armR: { a1: 50, a2: -80, L1: 66, L2: 58, hand: 'grip', hs: 1.25, layer: 'front', r: [19, 15, 14, 11], prop: arm => ({ mid: PR.staff(add(arm.W, polar(-20, -60)), add(arm.W, polar(80, -60)), '#3a3f4c', 7) }) },
  },
});

// =================== THANOS ===================
const GEMS = ['#3a6aff', '#ff3a3a', '#ffe23a', '#3aff6a', '#ff8a1a', '#c83aff'];
C({
  id: 'thanos', name: 'Thanos', group: 'cosmos', ring: '#e0b13a',
  sky: '#1a0a2a',
  bg: J => space('tnb', '#5a1a6e', '#0a0414', ['#ff9a3a', '#9a3aff', '#ff3a8a'], 17) + B.rays([200, 160], '#ffd27a', 24, 0.12),
  front: J => {
    const W = J.arms[1].W, s = 1.5, a = J.c.pose.armR.ha;
    return B.aura(W, 50, '#ffd27a', 0.45) + GEMS.slice(0, 4).map((col, i) => circle(add(W, rot([(-19 + i * 12.5) * s, -15 * s], a)), 4.8, `fill="${col}" stroke="${INK}" stroke-width="1.6" filter="url(#glow)"`)).join('') +
      circle(add(W, rot([-12 * s, 9 * s], a)), 5, `fill="${GEMS[4]}" stroke="${INK}" stroke-width="1.6" filter="url(#glow)"`) + circle(add(W, rot([8 * s, 4 * s], a)), 7, `fill="${GEMS[5]}" stroke="${INK}" stroke-width="1.8" filter="url(#glow)"`);
  },
  suit: '#2a3a7a', skin: '#8a5aa8', neckCol: '#8a5aa8', sleeve: '#2a3a7a', forearm: '#e0b13a', glove: '#e0b13a', bu: 5, bl: 3,
  torso: T => shade(smooth([[-T.sw / 2 - 10, 10], [-30, 0], [30, 0], [T.sw / 2 + 10, 10], [T.sw / 2, 60], [30, 50], [-30, 50], [-T.sw / 2, 60]]), '#e0b13a', { s: 6, lw: 2.6 }) +
    line('M-60,90L0,140L60,90M-50,170H50', 4, '#e0b13a') + pecs(T, '#14204a', 0.6),
  head: {
    t: 0.12, expr: 'angry', skin: '#8a5aa8', mouth: 'frown', mouthW: 1.2, shape: { jaw: 1.32, wid: 1.1, chin: 1.36, cran: 0.98, cheek: 1.06 }, lines: ['fold', 'forehead', 'cheek'], ears: true,
    eyes: { iris: '#3a6aff', lid: 3 }, brows: { th: 5, col: '#4a2a5e' },
    mid: ({ F }) => line(`M${f(F.mouth[0] - 10)},${48}V${62}M${f(F.mouth[0])},${50}V${66}M${f(F.mouth[0] + 10)},${48}V${62}M${f(F.mouth[0] - 20)},${44}V${56}M${f(F.mouth[0] + 20)},${44}V${56}`, 2.2, '#4a2a5e'),
  },
  pose: {
    N: [196, 278], tilt: -3, sw: 240, ww: 170, nw: 30, hs: 1.26, nl: 18,
    armL: { a1: 130, a2: 104, L1: 76, L2: 66, hand: 'fist', hs: 1.6, layer: 'mid', r: [36, 28, 28, 22] },
    armR: { a1: 56, a2: -100, L1: 66, L2: 60, hand: 'f-fist', hs: 1.5, ha: 4, layer: 'front', r: [34, 27, 28, 24] },
  },
});

// =================== SILVER SURFER ===================
C({
  id: 'silver-surfer', name: 'Silver Surfer', group: 'cosmos', ring: '#c8d0dc',
  sky: '#06081a',
  bg: J => space('ssb', '#1a2a5a', '#02030c', ['#5ad8ff', '#9a5aff', '#ffffff'], 19) + B.speed([200, 200], '#bfe6ff', 50, 150, 0.5, 5) +
    path('M-40,420L120,250Q170,200 230,230L420,330L420,440Z', `fill="none"`),
  behind: J => {
    // planche de surf cosmique derrière, en diagonale
    const d = 'M0,0Q140,-26 280,0Q140,26 0,0Z';
    return g(path(d, `fill="#e6ecf4" stroke="${INK}" stroke-width="4"`) + path('M20,0Q140,-14 260,0', `fill="none" stroke="#ffffff" stroke-width="3"`) + path('M20,4Q140,16 260,4', `fill="none" stroke="#8a96a8" stroke-width="3"`), 'transform="translate(-30 340) rotate(-16) scale(1.6 1.4)"');
  },
  suit: '#c8d0dc', skin: '#c8d0dc', neckCol: '#c8d0dc', sleeve: '#c8d0dc', glove: '#c8d0dc', bu: 4,
  torso: T => pecs(T, '#6a7686', 0.8) + abs(T, '#6a7686', 0.7) + path('M-40,30Q-30,60 -60,90', `fill="none" stroke="#ffffff" stroke-width="5" opacity="0.8"`),
  head: {
    t: -0.3, expr: 'determined', skin: '#c8d0dc', mouth: 'flat', ears: true, shape: { jaw: 1.02, cran: 1.04 }, lines: ['cheek'],
    eyes: { type: 'white' }, brows: { th: 3, col: '#8a96a8' }, eyeSocket: true,
    mid: ({ F }) => path(`M${f(F.cx - 30)},-50Q${f(F.cx - 20)},-60 ${f(F.cx - 6)},-58`, `fill="none" stroke="#ffffff" stroke-width="4" opacity="0.9"`),
  },
  pose: {
    N: [204, 266], tilt: 10, htilt: -10, sw: 176, ww: 116, nw: 18,
    armL: { a1: 170, a2: 190, L1: 72, L2: 64, hand: 'open', hs: 1.3, layer: 'mid', r: [24, 18, 17, 13] },
    armR: { a1: -20, a2: -4, L1: 72, L2: 60, hand: 'open', hs: 1.3, layer: 'mid', r: [24, 18, 17, 13] },
  },
});

// ---------- X-Men ----------
const xbg = (id, c1, c2) => B.radial(id, c1, c2, 0.5, 0.42, 0.72) + B.rays([200, 190], '#ffffff', 20, 0.1);

// =================== CYCLOPE ===================
C({
  id: 'cyclope', name: 'Cyclope', group: 'xmen', ring: '#1f3f9a',
  sky: '#14204a',
  bg: J => {
    let grid = '';
    for (let i = -10; i <= 10; i++) grid += `M200,200L${200 + i * 60},420`;
    for (let y = 250; y < 420; y += 26) grid += `M0,${y}H400`;
    return xbg('cy', '#3a5ac8', '#0a1030') + B.xlogo([200, 160], 120, '#f5c518', 0.25, '#14204a') + path(grid, `stroke="#7ab0ff" stroke-width="1.4" opacity="0.35"`);
  },
  front: J => {
    const a = headToG(J, [J.c.head.t * 15 + 40, -2]);
    return B.beam(a, [440, 100], 26, '#ff2a3a', '#ffe0e0');
  },
  suit: '#1f3f9a', neckCol: '#1f3f9a', sleeve: '#1f3f9a', forearm: '#1f3f9a', glove: '#f5c518',
  torso: T => line('M-70,0L70,190M70,0L-70,190', 9, '#f5c518') + line('M-70,0L70,190M70,0L-70,190', 1.5, INK, 'opacity="0.6"') +
    `<rect x="-70" y="186" width="140" height="18" fill="#f5c518" stroke="${INK}" stroke-width="2.2"/>` + circle([0, 195], 12, `fill="#1f3f9a" stroke="${INK}" stroke-width="2"`) + pecs(T, '#0f2266', 0.6),
  head: {
    t: 0.24, expr: 'angry', skin: '#f1c39b', mouth: 'grit', shape: { jaw: 1.06 }, lines: ['fold'],
    mask: { type: 'cowl', color: '#1f3f9a', top: 14, side: 32, eyes: 'lens', lens: 'narrow', ls: 0.6 },
    front: ({ F, t }) => {
      const d = smooth([[-50, -16], [F.cx - 20, -20], [F.cx + 30, -18], [52, -14], [50, 8], [F.cx + 26, 10], [F.cx, 6], [F.cx - 24, 10], [-50, 8]], true, 1 / 8);
      return shade(d, '#f5c518', { s: 3, lw: 3 }) + path(smooth([[F.cx - 38, -10], [F.cx + 40, -10], [F.cx + 40, 2], [F.cx - 38, 2]], true, 1 / 10), `fill="#ff2a3a" stroke="${INK}" stroke-width="2.4"`) +
        path(`M${f(F.cx - 30)},-8L${f(F.cx + 4)},-8L${f(F.cx - 6)},-2Z`, `fill="#ffd0d4" opacity="0.8"`);
    },
  },
  pose: {
    N: [194, 268], tilt: -4, htilt: 2, sw: 178, ww: 122, nw: 18,
    armL: { a1: 116, a2: 70, L1: 72, L2: 64, hand: 'fist', layer: 'mid', r: [24, 18, 17, 13] },
    armR: { a1: 76, a2: -126, L1: 72, L2: 76, hand: 'open', hs: 1.3, hrot: -30, layer: 'front', r: [24, 18, 17, 13] },
  },
});

// =================== TORNADE ===================
C({
  id: 'tornade', name: 'Tornade', group: 'xmen', ring: '#f2f2f6',
  sky: '#141a34',
  bg: J => B.sky(['#0c1028', '#2a3a6e', '#5a6a9a'], 'st') + B.clouds('#2a3058', -40, 4, 0.9, 1.4, false) + B.clouds('#3a4270', 330, 6, 1, 1.1) +
    B.bolt(B.zig([60, -10], [20, 330], 7, 18, 4), '#fffbd6', 5) + B.bolt(B.zig([350, -10], [390, 300], 7, 18, 7), '#fffbd6', 4),
  front: J => J.arms.map((a, i) => B.aura(a.W, 30, '#bfe6ff', 0.7) + B.bolt(B.zig(a.W, [a.W[0] + (i ? 30 : -30), -20], 5, 12, i + 3), '#ffffff', 3.5)).join(''),
  cape: J => PR.cape(J, '#1a1a24', { spread: 1.5, wind: [0, -40] }),
  suit: '#1a1a24', neckCol: '#1a1a24', sleeve: '#1a1a24', glove: '#1a1a24',
  torso: T => bust(T, '#4a4a5e', 0.8) + path('M-40,0L0,60L40,0', `fill="none" stroke="#f2f2f6" stroke-width="5"`) + `<rect x="-60" y="176" width="120" height="14" fill="#c9a54a" stroke="${INK}" stroke-width="2"/>`,
  head: {
    t: 0, expr: 'determined', skin: '#7a4a32', mouth: 'lips', lip: '#5a2a24', mouthW: 0.82,
    shape: FEM, eyes: { type: 'glow', glow: '#ffffff' }, brows: { th: 3.4, arch: 3, col: '#e8e8f0' }, eyeSocket: false,
    back: longHair('#eeeef4', { w: 70, len: 110, skew: 0, top: -60 }),
    front: ctx => hairCap(ctx, '#eeeef4', F => [[F.cx + 54, 20], [F.cx + 40, -28], [F.cx + 14, -40], [F.cx - 14, -40], [F.cx - 40, -28], [F.cx - 54, 20]], { cut: 20, puff: 12 }) +
      path('M-30,-40L0,-50L30,-40L0,-62Z', `fill="#c9a54a" stroke="${INK}" stroke-width="2"`),
  },
  pose: {
    N: [200, 268], tilt: 0, sw: 152, ww: 98, nw: 14, hs: 1.1,
    armL: { a1: -150, a2: -112, L1: 66, L2: 58, hand: 'f-palm', hs: 0.9, ha: -20, layer: 'back', r: [19, 15, 14, 11] },
    armR: { a1: -30, a2: -68, L1: 66, L2: 58, hand: 'f-palm', hs: 0.9, ha: 20, layer: 'back', r: [19, 15, 14, 11] },
  },
});

// =================== MALICIA ===================
C({
  id: 'malicia', name: 'Malicia', group: 'xmen', ring: '#2f9a3a',
  sky: '#2a5a2a',
  bg: J => xbg('rg', '#e8e05a', '#1f5a24') + B.speed([200, 200], '#ffffff', 40, 150, 0.5, 9) + B.clouds('#f4f4e0', 340, 9, 0.8, 1),
  suit: '#2f8a3a', neckCol: '#2f8a3a', sleeve: '#6a4428', forearm: '#6a4428', glove: '#f5c518',
  torso: T => path('M-40,40L0,100L40,40L40,180L-40,180Z', `fill="#f5c518" stroke="${INK}" stroke-width="2.2"`) + path('M-10,60L10,60L0,80Z', `fill="#2f8a3a"`) +
    [-1, 1].map(s => shade(poly([[s * 30, -6], [s * (T.sw / 2 + 20), 0], [s * (T.sw / 2 + 20), 270], [s * 50, 270], [s * 46, 80]]), '#6a4428', { s: 5, lw: 2.4 })).join('') +
    `<rect x="-40" y="176" width="80" height="12" fill="#2f8a3a" stroke="${INK}" stroke-width="2"/>`,
  head: {
    t: -0.25, expr: 'smirk', skin: '#f3cdb4', mouth: 'lipsmirk', lip: '#a8304a', mouthW: 0.82,
    shape: FEM, eyes: femEyes('#3a7a4a'), brows: { th: 3.4, arch: 3, col: '#4a2014' }, eyeSocket: false,
    back: longHair('#6a2a14', { w: 64, len: 96, skew: 14 }),
    front: ctx => hairCap(ctx, '#6a2a14', F => [[F.cx + 52, 20], [F.cx + 38, -20], [F.cx + 18, -40], [F.cx - 6, -34], [F.cx - 24, -46], [F.cx - 46, -18], [F.cx - 52, 16]], {
      cut: 20, puff: 11, inner: ct => path(smooth([[-12, -84], [6, -86], [2, -60], [-12, -34], [-26, -38], [-20, -60]]), `fill="#f4f4f8" stroke="${INK}" stroke-width="1.6"`),
    }),
  },
  pose: {
    N: [200, 268], tilt: -10, htilt: 6, sw: 156, ww: 100, nw: 14, hs: 1.1,
    armL: { a1: 130, a2: 110, L1: 66, L2: 58, hand: 'fist', hs: 1.3, layer: 'mid', r: [21, 17, 15, 12] },
    armR: { a1: -30, a2: -50, L1: 62, L2: 44, hand: 'f-fist', hs: 1.3, ha: 20, layer: 'front', r: [21, 17, 17, 15] },
  },
});

// =================== GAMBIT ===================
C({
  id: 'gambit', name: 'Gambit', group: 'xmen', ring: '#e0389a',
  sky: '#1a0a24',
  bg: J => {
    let iron = '';
    for (let x = 0; x < 420; x += 22) iron += `M${x},250V400M${x},250q11,-14 22,0`;
    return B.radial('gb', '#7a2a8a', '#0a0410', 0.5, 0.4, 0.75) + circle([90, 90], 40, `fill="#f0e6d0" opacity="0.8"`) + path(iron + 'M0,250H420M0,300H420', `fill="none" stroke="#14060e" stroke-width="5"`) + B.stars(20, '#ffb0e0', 23, 200);
  },
  front: J => {
    const W = J.arms[0].W;
    return [-30, -10, 10, 30].map((a, i) => PR.card(add(W, polar(42, -100 + a)), a - 10, '#ff3da5')).join('');
  },
  suit: '#3a2a5a', neckCol: '#3a2a5a', sleeve: '#7a4a2a', forearm: '#7a4a2a', glove: '#2a2a32',
  cape: J => PR.cape(J, '#7a4a2a', { spread: 1.1 }),
  torso: T => [-1, 1].map(s => shade(poly([[s * 20, -6], [s * (T.sw / 2 + 20), 0], [s * (T.sw / 2 + 20), 270], [s * 50, 270], [s * 36, 80]]), '#7a4a2a', { s: 5, lw: 2.4 })).join('') + line('M-20,40H20M-20,70H20M-20,100H20', 2, '#5a3a8a'),
  head: {
    t: 0.2, expr: 'smirk', skin: '#efc6a2', mouth: 'smirk', shape: { jaw: 1.04 }, lines: ['fold'],
    eyes: { iris: '#ff2a4a', look: [1, 0] },
    beard: ctx => beard(ctx, '#5a3420', { type: 'stubble' }),
    back: longHair('#5a3420', { w: 54, len: 50, skew: 6, top: -48 }),
    mid: ({ F, hd }) => clip(hd, `<path d="M-120,-120H120V120H-120Z ${smooth([[F.cx - 40, 60], [F.cx - 42, 0], [F.cx - 34, -36], [F.cx, -48], [F.cx + 34, -36], [F.cx + 42, 0], [F.cx + 40, 60]])}" fill-rule="evenodd" fill="#e0389a"/>`) +
      line(smooth([[F.cx - 40, 60], [F.cx - 42, 0], [F.cx - 34, -36], [F.cx, -48], [F.cx + 34, -36], [F.cx + 42, 0], [F.cx + 40, 60]]), 2.6),
    front: ctx => hairCap(ctx, '#5a3420', F => [[F.cx + 30, -30], [F.cx + 10, -40], [F.cx - 6, -26], [F.cx - 20, -42], [F.cx - 30, -30], [F.cx - 26, -52], [F.cx + 26, -52]], { cut: -60, puff: 4 }),
  },
  pose: {
    N: [204, 268], tilt: 4, htilt: -4, sw: 176, ww: 122, nw: 18,
    armL: { a1: 140, a2: -76, L1: 70, L2: 62, hand: 'open', hs: 1.3, layer: 'front', r: [25, 19, 18, 14], fingers: [[-30, 19], [-14, 22], [2, 21], [18, 17]] },
    armR: { a1: 50, a2: 110, L1: 70, L2: 62, hand: 'grip', layer: 'mid', r: [25, 19, 18, 14], prop: arm => ({ back: PR.staff(add(arm.W, polar(-150, 70)), add(arm.W, polar(60, 70)), '#7a7a86', 7) }) },
  },
});

// =================== JEAN GREY ===================
C({
  id: 'jean-grey', name: 'Jean Grey', group: 'xmen', ring: '#f5a21a',
  sky: '#3a0a06',
  bg: J => {
    // oiseau de feu stylisé
    const bird = path('M200,170Q120,60 10,40Q90,110 70,140Q130,130 160,190Q140,240 110,330Q170,280 200,240Q230,280 290,330Q260,240 240,190Q270,130 330,140Q310,110 390,40Q280,60 200,170Z', `fill="#ffb02a" opacity="0.55" stroke="#ffe08a" stroke-width="3"`);
    return B.radial('jg', '#ff7a1a', '#2a0402', 0.5, 0.45, 0.72) + g(bird, 'filter="url(#glow)"') + B.flames(420, 120, ['#c81a0a', '#ff6a1a', '#ffc04a'], 9, false);
  },
  front: J => B.aura(J.arms[1].W, 34, '#ffb02a', 0.8) + B.flame(add(J.arms[1].W, [0, -6]), 50, 34, 10),
  suit: '#2f8a3a', neckCol: '#2f8a3a', sleeve: '#2f8a3a', glove: '#f5c518',
  torso: T => path('M-50,20Q-30,50 0,70Q30,50 50,20Q40,90 0,110Q-40,90 -50,20Z', `fill="#f5c518" stroke="${INK}" stroke-width="2.4"`) + bust(T, '#14501c', 0.6) +
    `<rect x="-60" y="176" width="120" height="14" fill="#f5c518" stroke="${INK}" stroke-width="2"/>`,
  head: {
    t: 0.15, expr: 'determined', skin: '#f6d0b0', mouth: 'lips', lip: '#b8323c', mouthW: 0.82,
    shape: FEM, eyes: femEyes('#2f8a3a', { type: 'glow', glow: '#ffd27a' }), brows: { th: 3.4, arch: 2, col: '#8a2414' }, eyeSocket: false,
    back: longHair('#d8381a', { w: 72, len: 120, skew: -10, top: -56 }),
    front: ctx => hairCap(ctx, '#d8381a', F => [[F.cx + 52, 24], [F.cx + 40, -20], [F.cx + 20, -42], [F.cx - 4, -36], [F.cx - 26, -46], [F.cx - 48, -18], [F.cx - 52, 20]], { cut: 22, puff: 12 }),
  },
  pose: {
    N: [196, 268], tilt: 2, sw: 152, ww: 98, nw: 14, hs: 1.1,
    armL: { a1: 140, a2: -150, L1: 64, L2: 54, hand: 'f-two', hs: 0.85, ha: -40, layer: 'front', r: [19, 15, 14, 11] },
    armR: { a1: 20, a2: -50, L1: 66, L2: 58, hand: 'f-palm', hs: 0.95, ha: 30, layer: 'mid', r: [19, 15, 14, 11] },
  },
});

// =================== LE FAUVE ===================
const furTufts = (pts, col) => path(poly(pts), `fill="${col}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`);
C({
  id: 'le-fauve', name: 'Le Fauve', group: 'xmen', ring: '#2a4ab8',
  sky: '#0a1030',
  bg: J => {
    let grid = '';
    for (let i = -10; i <= 10; i++) grid += `M200,190L${200 + i * 60},420`;
    for (let y = 250; y < 420; y += 26) grid += `M0,${y}H400`;
    return B.radial('bs', '#2a4ab8', '#03061a', 0.5, 0.4, 0.72) + B.xlogo([200, 150], 130, '#f5c518', 0.18, '#0a1030') +
      path(grid, `stroke="#5a8aff" stroke-width="1.4" opacity="0.3"`) + B.debris([200, 210], 12, '#4a5a8a', 41, 140, 200) +
      [0, 1, 2].map(k => B.bolt([[30 + k * 30, 30], [140 + k * 30, 110]], '#e8f0ff', 5, '#7ab0ff')).join('');
  },
  suit: '#2a48b0', skin: '#3150b8', neckCol: '#3150b8', sleeve: '#3150b8', glove: '#3150b8', bu: 8, bl: 4, armK: 1.3, swK: 1.2, headK: 0.92,
  torso: T => {
    let fur = '';
    const R = B.rng(3);
    for (let i = 0; i < 26; i++) { const x = -T.sw * 0.45 + R() * T.sw * 0.9, y = 10 + R() * 220; fur += `M${f(x)},${f(y)}l${f(3 + R() * 3)},${f(9 + R() * 5)}l${f(3 + R() * 3)},${f(-8 - R() * 4)}`; }
    return pecs(T, '#0a1450', 0.9) + abs(T, '#0a1450', 0.75) + line(fur, 1.8, '#14206a', 'opacity="0.8"') +
      `<rect x="-120" y="222" width="240" height="40" fill="#141420" stroke="${INK}" stroke-width="2.4"/>` + line('M-120,230H120', 4, '#f5c518');
  },
  dU: (L, r) => line(`M${f(L * 0.2)},${f(-r * 0.4)}l5,10l5,-8M${f(L * 0.55)},${f(-r * 0.2)}l5,10l5,-8M${f(L * 0.4)},${f(r * 0.3)}l5,10l5,-8`, 1.8, '#14206a'),
  head: {
    t: -0.16, expr: 'furious', skin: '#3150b8', mouth: 'roar', mouthW: 1.25, shape: { jaw: 1.3, wid: 1.14, chin: 1.08, cheek: 1.12, cran: 0.92 }, lines: ['cheek', 'fold', 'forehead'],
    eyes: { iris: '#f5c518', lid: 4, s: 0.95 }, brows: { th: 9, col: '#0e1650', w: 1.2 },
    mid: ({ F }) => {
      const [x, y] = F.mouth;
      return path(`M${x - 12},${y - 7}l3,14l4,-14Z M${x + 7},${y - 7}l3,14l4,-14Z`, `fill="#f2efe2" stroke="${INK}" stroke-width="1.4"`) +
        path(`M${x - 11},${y + 18}l3,-11l4,11Z M${x + 6},${y + 18}l3,-11l4,11Z`, `fill="#e6e2d2" stroke="${INK}" stroke-width="1.4"`);
    },
    back: () => hair([[-52, -46], [-74, -14], [-82, 26], [-66, 60], [-50, 40], [0, 50], [50, 40], [66, 60], [82, 26], [74, -14], [52, -46]], '#14206a', { s: 6 }),
    front: ctx => hairCap(ctx, '#1a2a8a', F => [[F.cx + 52, 6], [F.cx + 46, -14], [F.cx + 34, -30], [F.cx + 18, -24], [F.cx + 6, -36], [F.cx - 8, -24], [F.cx - 22, -36], [F.cx - 38, -22], [F.cx - 52, 4]], { cut: 6, puff: 13 }) +
      // favoris en touffes sur les joues
      furTufts([[-46, -4], [-60, 14], [-52, 16], [-62, 34], [-50, 32], [-52, 50], [-38, 36]], '#1f2f8a') + furTufts([[46, -4], [60, 14], [52, 16], [62, 34], [50, 32], [52, 50], [38, 36]], '#1a2878') +
      [-1, 1].map(s => shade(poly([[s * 42, -28], [s * 62, -64], [s * 56, -18]]), '#3150b8', { s: 2, lw: 2.6 })).join(''),
  },
  pose: {
    N: [204, 278], tilt: 8, htilt: -8, sw: 250, ww: 168, nw: 32, hs: 1.18, nl: -10,
    armL: { a1: 132, a2: -92, L1: 72, L2: 66, hand: 'open', talons: true, clawCol: '#f0eee6', hs: 1.75, layer: 'front', r: [36, 28, 27, 20], fingers: [[-30, 22], [-11, 26], [8, 25], [26, 20]] },
    armR: { a1: 62, a2: -106, L1: 62, L2: 34, hand: 'f-fist', hs: 1.6, ha: 6, layer: 'front', r: [36, 30, 30, 26] },
  },
});

// =================== PROFESSEUR X ===================
C({
  id: 'professeur-x', name: 'Professeur X', group: 'xmen', ring: '#4a8ae0',
  sky: '#06122a',
  bg: J => {
    let grid = '';
    for (let i = 0; i < 12; i++) grid += ellipse([200, 200], 190, 20 + i * 16, `fill="none" stroke="#5ab8ff" stroke-width="1.2"`);
    for (let i = 0; i < 12; i++) grid += ellipse([200, 200], 20 + i * 16, 190, `fill="none" stroke="#5ab8ff" stroke-width="1.2"`);
    return B.radial('px', '#1a4a8a', '#020814', 0.5, 0.45, 0.7) + g(grid, 'opacity="0.35"') + B.xlogo([200, 60], 30, '#f5c518', 0.35, '#0a1438');
  },
  behind: J => [60, 85, 110].map((r, i) => circle(J.H, r * J.hs, `fill="none" stroke="#9fe0ff" stroke-width="${4 - i}" opacity="${0.7 - i * 0.18}" filter="url(#glow)"`)).join(''),
  suit: '#2a2e3a', neckCol: '#f2f2f6', sleeve: '#2a2e3a', forearm: '#2a2e3a', glove: '#efc6a2',
  torso: T => shade(poly([[-T.nw - 6, -8], [0, 60], [T.nw + 6, -8], [T.nw + 10, 120], [-T.nw - 10, 120]]), '#f2f2f6', { s: 3, lw: 2.2 }) + path('M-8,4L8,4L4,30L10,90L0,100L-10,90L-4,30Z', `fill="#2a4a9a" stroke="${INK}" stroke-width="2"`) +
    [-1, 1].map(s => line(`M${s * 24},-6L${s * 6},70L${s * 50},200`, 3, '#14161e')).join(''),
  head: {
    t: -0.12, expr: 'determined', skin: '#efc6a2', mouth: 'flat', shape: { jaw: 1.02, cran: 1.06 }, lines: ['fold', 'forehead'],
    eyes: { iris: '#3a5a8a', lid: 2.5 },
  },
  pose: {
    N: [200, 270], tilt: 0, sw: 180, ww: 126, nw: 18,
    armL: { a1: 130, a2: 100, L1: 72, L2: 62, hand: 'fist', layer: 'mid', r: [25, 19, 18, 14] },
    armR: { a1: 64, a2: -114, L1: 70, L2: 70, hand: 'open', hs: 1.25, hrot: -40, layer: 'front', r: [25, 19, 18, 14], fingers: [[-30, 12], [-12, 26], [6, 26], [22, 12]] },
  },
});

// =================== MAGNETO ===================
C({
  id: 'magneto', name: 'Magneto', group: 'xmen', ring: '#8a1a3a',
  sky: '#2a0a24',
  bg: J => {
    let fl = '';
    for (let i = 1; i <= 7; i++) fl += ellipse([200, 200], 30 + i * 24, 14 + i * 10, `fill="none" stroke="#ff7ad0" stroke-width="2" opacity="${f(0.5 - i * 0.05)}"`);
    for (let i = 1; i <= 7; i++) fl += ellipse([200, 200], 14 + i * 10, 30 + i * 24, `fill="none" stroke="#ff7ad0" stroke-width="2" opacity="${f(0.5 - i * 0.05)}"`);
    return B.radial('mg', '#7a1a5a', '#14040e', 0.5, 0.42, 0.72) + fl + B.debris([200, 200], 14, '#8a8a96', 31, 120, 190);
  },
  front: J => J.arms.map(a => B.aura(a.W, 30, '#ff5ab8', 0.6) + [0, 1, 2].map(k => circle(a.W, 20 + k * 12, `fill="none" stroke="#ff9ad8" stroke-width="2" opacity="0.7" stroke-dasharray="8 6"`)).join('')).join(''),
  cape: J => PR.cape(J, '#6a2a8a', { spread: 1.6 }),
  suit: '#b81e3a', neckCol: '#b81e3a', sleeve: '#b81e3a', glove: '#6a2a8a',
  torso: T => pecs(T, '#6a0a1a', 0.7) + path('M-60,0L0,80L60,0', `fill="none" stroke="#6a2a8a" stroke-width="10"`) + `<rect x="-70" y="190" width="140" height="18" fill="#6a2a8a" stroke="${INK}" stroke-width="2"/>`,
  head: {
    t: 0.1, expr: 'angry', skin: '#efc6a2', mouth: 'frown', shape: { jaw: 1.08, chin: 1.06 }, lines: ['fold', 'forehead'],
    eyes: { iris: '#4a6a9a', lid: 3 },
    mask: {
      type: 'cowl', color: '#c8203a', top: 10, side: 34,
      pattern: ({ F }) => line(`M${f(F.cx - 46)},-30Q${f(F.cx)},-20 ${f(F.cx + 46)},-30`, 3, '#7a0a1e') + path(`M${f(F.cx - 12)},-52L${f(F.cx)},-30L${f(F.cx + 12)},-52Z`, `fill="#6a2a8a" stroke="${INK}" stroke-width="2"`),
      over: ({ F }) => [-1, 1].map(s => shade(smooth([[F.cx + s * 44, -40], [F.cx + s * 56, -50], [F.cx + s * 60, -10], [F.cx + s * 46, -6]]), '#c8203a', { s: 2, lw: 2.6 })).join(''),
    },
  },
  pose: {
    N: [200, 268], tilt: 0, sw: 182, ww: 126, nw: 18,
    armL: { a1: -160, a2: -118, L1: 72, L2: 62, hand: 'open', hs: 1.3, layer: 'back', r: [25, 19, 18, 14] },
    armR: { a1: -20, a2: -62, L1: 72, L2: 62, hand: 'open', hs: 1.3, layer: 'back', r: [25, 19, 18, 14] },
  },
});

// =================== DEADPOOL ===================
C({
  id: 'deadpool', name: 'Deadpool', group: 'xmen', ring: '#c41e2a',
  sky: '#f5c518',
  bg: J => B.radial('dp', '#fff27a', '#e0601a', 0.5, 0.42, 0.72) + B.rays([200, 190], '#ffffff', 24, 0.28) +
    g(path('M0,0L120,0L120,60L40,60L20,84L24,60L0,60Z', `fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"`) + `<text x="60" y="42" text-anchor="middle" font-family="Impact, sans-serif" font-size="30" fill="${INK}">BANG!</text>`, 'transform="translate(250 30) rotate(8)"') +
    g(path(B.starShape([0, 0], 40, 0.55, 10), `fill="#ff3a3a" stroke="${INK}" stroke-width="3"`) + `<text x="0" y="8" text-anchor="middle" font-family="Impact, sans-serif" font-size="20" fill="#fff">POW</text>`, 'transform="translate(70 90) rotate(-12)"'),
  behind: J => line(`M${P(J.toG([-90, -60]))}L${P(J.toG([60, 120]))}M${P(J.toG([90, -60]))}L${P(J.toG([-60, 120]))}`, 9, INK) + line(`M${P(J.toG([-90, -60]))}L${P(J.toG([-40, 0]))}M${P(J.toG([90, -60]))}L${P(J.toG([40, 0]))}`, 5, '#2a2a32'),
  suit: '#b81a26', neckCol: '#b81a26', sleeve: '#b81a26', forearm: '#b81a26', glove: '#1a1a22', bu: 2, bl: 1.5, swK: 1.0, armK: 1.0, headK: 0.92,
  torso: T => [-1, 1].map(s => shade(smooth([[s * 40, 46], [s * (T.sw / 2 + 30), 10], [s * (T.sw / 2 + 30), 270], [s * T.ww * 0.44, 270], [s * T.ww * 0.4, 150]], true), '#1a1a22', { s: 6, lw: 2.4 })).join('') +
    pecs(T, '#4a0610', 0.45) +
    line('M70,0L-70,210', 12, '#1a1a22') + line('M70,0L-70,210', 1.6, '#3a3a44') + `<rect x="-90" y="196" width="180" height="20" fill="#1a1a22" stroke="${INK}" stroke-width="2"/>` +
    circle([0, 206], 17, `fill="#b81a26" stroke="${INK}" stroke-width="2.6"`) + line('M0,189V223', 4) + [-60, -36, 36, 60].map(x => `<rect x="${x - 8}" y="194" width="16" height="22" rx="2" fill="#2a2a34" stroke="${INK}" stroke-width="1.6"/>`).join(''),
  dU: (L, r) => line(`M${f(L * 0.15)},${f(-r * 0.2)}Q${f(L * 0.5)},${f(-r * 0.9)} ${f(L * 0.85)},${f(-r * 0.3)}`, 1.8, '#4a0610', 'opacity="0.7"'),
  head: {
    t: -0.22, expr: 'angry', skin: '#b81a26', ears: false, shape: { jaw: 1.06, chin: 1.02, wid: 1.0 },
    mask: {
      type: 'full', color: '#b81a26', lens: 'narrow', ls: 0.95, ang: 8, border: 3.5, shine: false,
      pattern: ({ F }) => [0, 1].map(i => path(smooth([[F.eye[i][0] - 22, -2], [F.eye[i][0] - 6, -14], [F.eye[i][0] + 18, -16], [F.eye[i][0] + 26, -2], [F.eye[i][0] + 14, 16], [F.eye[i][0] - 12, 14]].map(([x, y]) => [i ? x : 2 * F.eye[i][0] - x, y])), `fill="#141418"`)).join('') +
        line(`M${f(F.cx + 2)},-64V-22`, 1.8, '#5a0610'),
    },
  },
  pose: {
    N: [200, 270], tilt: 6, htilt: -6, sw: 166, ww: 108, nw: 15,
    armL: { a1: -150, a2: -72, L1: 70, L2: 62, hand: 'grip', layer: 'back', r: [21, 16, 15, 12], prop: arm => ({ mid: PR.sword(arm.W, -32, 190, '#dfe6ee', { w: 7, guard: '#1a1a22', grip: '#1a1a22' }) }) },
    armR: { a1: 96, a2: -66, L1: 68, L2: 62, hand: 'grip', layer: 'front', r: [21, 16, 15, 12], prop: arm => ({ front: PR.gun(add(arm.W, [8, -12]), -66, { s: 1.3, len: 60, col: '#2a2a32' }) + B.energy(add(arm.W, polar(100, -70)), 8, '#ffd27a') }) },
  },
});

// ---------- Quatre Fantastiques & vilains ----------
// Plaques de roche de la Chose
const rockPlates = (x0, y0, w, h, seed, col = '#8a3a0a', cell = 22) => {
  const R = B.rng(seed);
  let d = '';
  const pts = [];
  for (let y = y0; y <= y0 + h; y += cell) {
    const row = [];
    for (let x = x0; x <= x0 + w; x += cell) row.push([x + (R() - 0.5) * cell * 0.6 + ((y / cell) % 2) * cell * 0.5, y + (R() - 0.5) * cell * 0.5]);
    pts.push(row);
  }
  for (let j = 0; j < pts.length; j++) for (let i = 0; i < pts[j].length; i++) {
    if (i + 1 < pts[j].length) d += `M${P(pts[j][i])}L${P(pts[j][i + 1])}`;
    if (j + 1 < pts.length) d += `M${P(pts[j][i])}L${P(pts[j + 1][i])}`;
  }
  return path(d, `fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"`);
};

// =================== LA CHOSE ===================
C({
  id: 'la-chose', name: 'La Chose', group: 'ff', ring: '#2a6ad8',
  sky: '#1a3a8a',
  bg: J => B.radial('th4', '#4a8ae8', '#0a1a4a', 0.5, 0.42, 0.72) + B.rays([200, 200], '#ffffff', 20, 0.14) +
    g(circle([0, 0], 60, `fill="#fff" stroke="${INK}" stroke-width="5"`) + `<text x="0" y="30" text-anchor="middle" font-family="Impact, sans-serif" font-size="90" fill="#2a6ad8" stroke="${INK}" stroke-width="3">4</text>`, 'transform="translate(320 80) rotate(10) scale(0.9)" opacity="0.5"') +
    B.debris([200, 220], 14, '#c86a2a', 8, 120, 200) + B.rocks(['#5a5a6e', '#3a3a4e'], 81, 8, 340),
  suit: '#e0782a', skin: '#e0782a', neckCol: '#e0782a', sleeve: '#e0782a', glove: '#e0782a', bu: 6, bl: 4,
  dU: (L, r) => rockPlates(-10, -r, L + 20, r * 2, 5, '#8a3a0a', 16), dL: (L, r) => rockPlates(-10, -r, L + 20, r * 2, 7, '#8a3a0a', 16),
  torso: T => rockPlates(-T.sw / 2 - 20, -10, T.sw + 40, 280, 3, '#8a3a0a', 26) + `<rect x="-120" y="222" width="240" height="60" fill="#2a4ab8" stroke="${INK}" stroke-width="2.6"/>`,
  head: {
    t: -0.1, expr: 'furious', skin: '#e0782a', mouth: 'grit', mouthW: 1.4, ears: false, shape: { jaw: 1.24, wid: 1.12, chin: 1.0, cran: 0.86, cheek: 1.08 },
    eyes: { iris: '#3a7ad8', s: 0.92, lid: 3.5 }, brows: { th: 10, col: '#b85a1a', w: 1.25 }, nose: false,
    mid: ({ F, hd }) => clip(hd, rockPlates(-60, -80, 120, 160, 11, '#8a3a0a', 20)) + path(smooth([[F.nose[0] - 12, 10], [F.nose[0] + 12, 10], [F.nose[0] + 14, 24], [F.nose[0], 28], [F.nose[0] - 14, 24]]), `fill="#c8661e" stroke="${INK}" stroke-width="2.2"`) +
      path(smooth([[F.cx - 50, -24], [F.cx, -36], [F.cx + 50, -24], [F.cx + 44, -12], [F.cx, -20], [F.cx - 44, -12]]), `fill="#c8661e" stroke="${INK}" stroke-width="2.4"`),
  },
  pose: {
    N: [202, 280], tilt: -4, sw: 260, ww: 190, nw: 34, hs: 1.12, nl: 0,
    armL: { a1: 120, a2: -10, L1: 74, L2: 66, hand: 'fist', hs: 1.75, layer: 'mid', r: [40, 32, 32, 26] },
    armR: { a1: 76, a2: -110, L1: 60, L2: 34, hand: 'f-fist', hs: 2.0, ha: 6, layer: 'front', r: [40, 34, 34, 30] },
  },
});

// =================== LA TORCHE ===================
const FIRE = ['#e8300a', '#ff8a1a', '#ffe14d'];
C({
  id: 'la-torche', name: 'La Torche', group: 'ff', ring: '#ff7a1a',
  sky: '#3a0a04',
  bg: J => {
    const R = B.rng(91);
    let sp = '';
    for (let i = 0; i < 40; i++) sp += circle([R() * 400, R() * 400], 1 + R() * 3, `fill="#ffd27a" opacity="${f(0.4 + R() * 0.6)}"`);
    return B.radial('jt', '#ff7a1a', '#2a0402', 0.5, 0.5, 0.7) + B.rays([200, 200], '#ffd27a', 26, 0.18) + sp + B.flames(430, 110, FIRE, 13, false);
  },
  behind: J => {
    let fl = '';
    const R = B.rng(5);
    for (let i = 0; i < 14; i++) {
      const a = 180 + i * (180 / 13), p = add(J.N, polar(130 + R() * 20, a));
      fl += B.flame(p, 70 + R() * 40, 46, a + 90, FIRE);
    }
    return fl;
  },
  front: J => {
    const W = J.arms[1].W;
    return B.aura(W, 40, '#ffb02a', 0.9) + circle(W, 28, `fill="#ffe14d" stroke="#ff7a1a" stroke-width="5" filter="url(#glow)"`) + B.flame(add(W, [0, 20]), 70, 50, 20, FIRE);
  },
  suit: '#ff6a1a', skin: '#ff7a1a', neckCol: '#ff6a1a', sleeve: '#ff6a1a', glove: '#ff6a1a',
  torso: T => path('M-30,40Q0,20 30,40Q30,80 0,90Q-30,80 -30,40Z', `fill="none" stroke="#ffe14d" stroke-width="4"`) + `<text x="0" y="74" text-anchor="middle" font-family="Impact, sans-serif" font-size="34" fill="#ffe14d">4</text>` + pecs(T, '#a82a0a', 0.6) + abs(T, '#a82a0a', 0.5),
  head: {
    t: 0.12, expr: 'determined', skin: '#ff7a1a', mouth: 'smirk', shape: { jaw: 1.0 },
    eyes: { type: 'glow', glow: '#fff6c8' }, brows: { th: 4, col: '#a82a0a' }, eyeSocket: false,
    front: () => [-36, -16, 6, 26, 42].map((x, i) => B.flame([x, -50 + Math.abs(x) * 0.3], 54 + (i % 2) * 22, 34, -10 + x * 0.6, FIRE)).join(''),
  },
  pose: {
    N: [196, 270], tilt: -4, sw: 176, ww: 118, nw: 18,
    armL: { a1: 130, a2: 80, L1: 72, L2: 62, hand: 'fist', layer: 'mid', r: [24, 18, 17, 13] },
    armR: { a1: -36, a2: -70, L1: 70, L2: 56, hand: 'f-palm', hs: 1.0, ha: 20, layer: 'mid', r: [24, 18, 17, 13] },
  },
});

// =================== DOCTEUR FATALIS ===================
C({
  id: 'docteur-fatalis', name: 'Docteur Fatalis', group: 'ff', ring: '#2a7a3a',
  sky: '#0a1a10',
  bg: J => {
    const castle = 'M0,400V300H30V260H44V280H60V240H74V200L90,170L106,200V250H130V230H150V280H250V230H270V250H294V200L310,170L326,200V240H340V280H356V260H370V300H400V400Z';
    return B.sky(['#061208', '#1f4a2a', '#5a8a4a'], 'dm') + B.clouds('#14301c', -40, 3, 0.9, 1.3, false) + B.bolt(B.zig([330, -10], [370, 200], 6, 14, 2), '#e6ffd8', 4, '#7aff9a') + path(castle, `fill="#0a140c"`);
  },
  front: J => {
    const W = J.arms[1].W;
    return B.aura(W, 36, '#3aff6a', 0.7) + [0, 1, 2, 3].map(i => B.bolt(B.zig(W, add(W, polar(60, -160 + i * 40)), 4, 9, i + 1), '#e6ffd8', 2.4, '#3aff6a')).join('');
  },
  cape: J => PR.cape(J, '#1f6a2e', { spread: 1.3 }),
  suit: '#7a828e', neckCol: '#1f6a2e', sleeve: '#7a828e', forearm: '#7a828e', glove: '#7a828e',
  torso: T => shade(smooth([[-T.sw / 2 - 10, 0], [0, 10], [T.sw / 2 + 10, 0], [T.sw / 2 + 10, 280], [-T.sw / 2 - 10, 280]]), '#1f6a2e', { s: 8, lw: 2.4 }) +
    shade(poly([[-40, 30], [40, 30], [44, 290], [-44, 290]]), '#7a828e', { s: 5, lw: 2.4 }) + line('M-40,80H40M-40,130H40M-40,180H40', 2, '#4a525e') +
    `<rect x="-50" y="200" width="100" height="16" fill="#c9a54a" stroke="${INK}" stroke-width="2"/>` + circle([0, 208], 11, `fill="#c9a54a" stroke="${INK}" stroke-width="2"`),
  head: {
    t: 0, expr: 'angry', skin: '#9aa3ad', ears: false, shape: { jaw: 1.06, chin: 1.0, wid: 0.98 },
    back: () => shade(smooth([[-62, 60], [-70, -10], [-54, -72], [0, -96], [54, -72], [70, -10], [62, 60], [0, 70]]), '#1f6a2e', { s: 8 }),
    mask: {
      type: 'full', color: '#9aa3ad', lens: 'slit', ls: 1.05, lensFill: '#1a1a22', border: 3, shine: false, ang: 4,
      pattern: ({ F }) => line(`M${f(F.cx)},-40V12M${f(F.cx - 40)},-14H${f(F.cx + 40)}M${f(F.cx - 30)},12Q${f(F.cx - 20)},28 ${f(F.cx - 26)},48M${f(F.cx + 30)},12Q${f(F.cx + 20)},28 ${f(F.cx + 26)},48`, 2.4, '#5a626e') +
        path(`M${f(F.cx - 16)},34H${f(F.cx + 16)}V40H${f(F.cx - 16)}Z`, `fill="#1a1a22" stroke="${INK}" stroke-width="1.6"`) +
        [[-32, -30], [32, -30], [-36, 24], [36, 24], [-20, 50], [20, 50]].map(([x, y]) => circle([F.cx + x, y], 2.6, `fill="#5a626e"`)).join(''),
    },
    front: () => {
      const d = smooth([[-60, 60], [-64, -10], [-50, -66], [0, -88], [50, -66], [64, -10], [60, 60], [48, 50], [52, -10], [42, -50], [0, -66], [-42, -50], [-52, -10], [-48, 50]]);
      return shade(d, '#1f6a2e', { s: 5, lw: 3 });
    },
  },
  pose: {
    N: [200, 270], tilt: 0, sw: 186, ww: 130, nw: 20,
    armL: { a1: 120, a2: 90, L1: 72, L2: 62, hand: 'fist', layer: 'mid', r: [26, 20, 19, 14] },
    armR: { a1: 40, a2: -70, L1: 70, L2: 62, hand: 'open', hs: 1.4, layer: 'front', r: [26, 20, 19, 14] },
  },
});

// =================== ULTRON ===================
C({
  id: 'ultron', name: 'Ultron', group: 'ff', ring: '#c41e2a',
  sky: '#140406',
  bg: J => B.radial('ul', '#6a0a14', '#0a0204', 0.5, 0.4, 0.72) + B.hud('#ff3a4a', 0.3, 9) + B.city({ far: '#2a0a10', near: '#120406', win: '#ff3a3a', base1: 400, base2: 430, seed: 59 }) +
    B.debris([200, 220], 12, '#5a5a66', 61, 130, 200),
  front: J => J.arms.map(a => B.energy(a.W, 16, '#ff3a3a', '#ffe0e0')).join('') + B.beam(J.arms[1].W, [430, 60], 14, '#ff3a3a'),
  suit: '#a8b0ba', neckCol: '#5a5f6b', sleeve: '#a8b0ba', forearm: '#a8b0ba', glove: '#a8b0ba',
  torso: T => line('M0,10V200M-60,40L-20,80M60,40L20,80M-50,120H50M-40,160H40', 2.4, '#5a626e') + circle([0, 70], 16, `fill="#ff3a3a" stroke="${INK}" stroke-width="2.6" filter="url(#glow)"`) + pecs(T, '#5a626e', 0.8),
  dU: (L, r) => line(`M${f(L * 0.3)},-30V30M${f(L * 0.7)},-30V30`, 2, '#5a626e'), dL: (L, r) => line(`M${f(L * 0.5)},-30V30`, 2, '#5a626e'),
  head: {
    t: 0.1, expr: 'furious', skin: '#a8b0ba', ears: false, shape: { jaw: 1.0, chin: 0.94, cran: 1.06, wid: 0.96 },
    mask: {
      type: 'full', color: '#a8b0ba', lens: 'slit', ls: 1.2, lensFill: '#ff3a3a', border: 3.4, shine: false, ang: 6,
      pattern: ({ F }) => line(`M${f(F.cx)},-66V-26M${f(F.cx - 20)},-60L${f(F.cx - 30)},-30M${f(F.cx + 20)},-60L${f(F.cx + 30)},-30M${f(F.cx - 40)},10L${f(F.cx - 24)},44M${f(F.cx + 40)},10L${f(F.cx + 24)},44`, 2.2, '#5a626e') +
        [0, 1].map(i => path(`M${f(F.eye[i][0] - 18)},-4H${f(F.eye[i][0] + 18)}`, `stroke="#ff3a3a" stroke-width="12" opacity="0.55" filter="url(#blur6)"`)).join(''),
      mouth: ({ F }) => path(`M${f(F.mouth[0] - 18)},28Q${f(F.mouth[0])},20 ${f(F.mouth[0] + 18)},28L${f(F.mouth[0] + 12)},44Q${f(F.mouth[0])},40 ${f(F.mouth[0] - 12)},44Z`, `fill="#ff3a3a" stroke="${INK}" stroke-width="2.4" filter="url(#glow)"`),
    },
  },
  pose: {
    N: [200, 270], tilt: 4, sw: 182, ww: 120, nw: 20,
    armL: { a1: 150, a2: 170, L1: 72, L2: 62, hand: 'open', hs: 1.35, layer: 'mid', r: [24, 18, 17, 13] },
    armR: { a1: -10, a2: -30, L1: 66, L2: 50, hand: 'f-palm', hs: 1.05, ha: 50, layer: 'mid', r: [24, 18, 17, 13] },
  },
});

// =================== LOKI ===================
C({
  id: 'loki', name: 'Loki', group: 'ff', ring: '#2a8a3a',
  sky: '#0a1a10',
  bg: J => {
    let sw = '';
    for (let i = 0; i < 5; i++) sw += path(`M200,200m${-50 - i * 30},0a${50 + i * 30},${50 + i * 30} 0 1,1 ${100 + i * 60},0`, `fill="none" stroke="#3aff7a" stroke-width="${5 - i * 0.7}" opacity="${0.4 - i * 0.05}" transform="rotate(${i * 70 + 20} 200 200)"`);
    return B.radial('lk', '#1f6a3a', '#020a06', 0.5, 0.4, 0.72) + sw + B.stars(30, '#bfffd0', 71);
  },
  front: J => {
    const W = J.arms[1].W, tip = add(W, polar(110, -84));
    return B.aura(tip, 20, '#5ad8ff', 0.8) + circle(tip, 9, `fill="#9ff0ff" stroke="${INK}" stroke-width="2" filter="url(#glow)"`);
  },
  cape: J => PR.cape(J, '#1f7a3a', { spread: 1.2 }),
  suit: '#1a1a22', neckCol: '#1a1a22', sleeve: '#1a1a22', forearm: '#2a6a3a', glove: '#1a1a22',
  torso: T => [-1, 1].map(s => shade(poly([[s * 14, -6], [s * 60, 0], [s * 50, 120], [s * 20, 160]]), '#2a7a3a', { s: 4, lw: 2.4 })).join('') + line('M-50,20L-20,60M50,20L20,60', 4, '#c9a54a') +
    shade(smooth([[-T.nw - 4, -14], [T.nw + 4, -14], [T.nw + 8, 10], [-T.nw - 8, 10]]), '#c9a54a', { s: 2, lw: 2.2 }),
  head: {
    t: -0.2, expr: 'evil', skin: '#f3d6c0', mouth: 'smirk', shape: { jaw: 0.98, chin: 1.0, cheek: 0.96 }, lines: ['cheek'],
    eyes: { iris: '#3a8a5a', lid: 2.5 }, brows: { th: 4, arch: 2 },
    back: longHair('#14141a', { w: 54, len: 60, skew: 6, top: -50 }),
    front: ({ F, t }) => {
      // casque doré à longues cornes
      let o = shade(smooth([[-50, -10], [-48, -52], [-24, -72], [24, -72], [48, -52], [50, -10], [40, -14], [36, -40], [14, -46], [F.cx, -36], [-14, -46], [-36, -40], [-40, -14]]), '#d8b03a', { s: 5, lw: 3, inner: line('M-40,-40Q0,-62 40,-40', 2, '#8a6a1a') });
      for (const s of [-1, 1]) o += shade(smooth([[s * 20, -62], [s * 24, -96], [s * 40, -136], [s * 70, -158], [s * 96, -160], [s * 70, -138], [s * 52, -104], [s * 42, -64]]), '#d8b03a', { s: 4, lw: 3, inner: line(`M${s * 32},-70Q${s * 36},-110 ${s * 70},-146`, 2, '#8a6a1a') });
      return o;
    },
  },
  pose: {
    N: [200, 270], tilt: -3, htilt: 4, sw: 172, ww: 116, nw: 17,
    armL: { a1: 130, a2: -60, L1: 72, L2: 62, hand: 'open', hs: 1.3, layer: 'front', r: [23, 17, 16, 12], fingers: [[-26, 17], [-9, 21], [8, 20], [24, 16]] },
    armR: { a1: 70, a2: -84, L1: 72, L2: 62, hand: 'grip', layer: 'mid', r: [23, 17, 16, 12], prop: arm => ({ back: PR.staff(add(arm.W, polar(-90, -84)), add(arm.W, polar(100, -84)), '#d8b03a', 7) }) },
  },
});

// =================== GHOST RIDER ===================
C({
  id: 'ghost-rider', name: 'Ghost Rider', group: 'ff', ring: '#ff6a1a',
  sky: '#120404',
  bg: J => B.radial('gr2', '#5a1404', '#060102', 0.5, 0.4, 0.72) + B.flames(420, 170, FIRE, 21, true) + path('M120,400L180,240H220L280,400Z', `fill="#1a1a1e"`) + line('M200,250V280M200,300V340M200,360V400', 5, '#ffe14d'),
  front: J => {
    // chaîne enflammée
    const W = J.arms[1].W;
    let ch = '';
    const pts = [];
    for (let i = 0; i <= 14; i++) { const k = i / 14; pts.push(add(W, [-k * 230 + Math.sin(k * 3.4) * 40, -k * 150 - Math.sin(k * 3.1) * 70])); }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = angle(pts[i], pts[i + 1]);
      ch += B.flame(pts[i], 30, 22, a + 90, FIRE, false) + g(ellipse([0, 0], 10, 6, `fill="none" stroke="${INK}" stroke-width="5"`) + ellipse([0, 0], 10, 6, `fill="none" stroke="#c9ced6" stroke-width="2.6"`), tr(pts[i], a + (i % 2) * 90));
    }
    return ch;
  },
  suit: '#1a1a1e', neckCol: '#e8e2cc', sleeve: '#1a1a1e', forearm: '#1a1a1e', glove: '#1a1a1e',
  torso: T => [-1, 1].map(s => shade(poly([[s * 18, -6], [s * 66, -8], [s * 50, 60], [s * 24, 120]]), '#2a2a30', { s: 4, lw: 2.4 })).join('') +
    [[-60, 10], [-50, 30], [60, 10], [50, 30]].map(([x, y]) => path(`M${x - 4},${y}L${x},${y - 12}L${x + 4},${y}Z`, `fill="#d8dde6" stroke="${INK}" stroke-width="1.4"`)).join('') + line('M0,120V240', 2, '#3a3a40'),
  dU: (L, r) => [0.3, 0.6].map(k => path(`M${f(L * k - 4)},${f(-r)}L${f(L * k)},${f(-r - 12)}L${f(L * k + 4)},${f(-r)}Z`, `fill="#d8dde6" stroke="${INK}" stroke-width="1.4"`)).join(''),
  head: {
    t: 0.1, expr: 'furious', skin: '#efe6cc', ears: false, shape: { jaw: 0.94, chin: 0.9, cheek: 1.04, cran: 1.04 },
    back: () => [-50, -30, -10, 10, 30, 50].map((x, i) => B.flame([x, -40 + Math.abs(x) * 0.4], 90 + (i % 2) * 40, 50, x * 0.5, FIRE)).join(''),
    mask: {
      type: 'full', color: '#efe6cc', lens: 'round', ls: 1.25, lensFill: '#120404', border: 3, shine: false, ang: 6,
      pattern: ({ F }) => path(`M${f(F.nose[0] - 7)},${12}L${f(F.nose[0])},${0}L${f(F.nose[0] + 7)},${12}L${f(F.nose[0])},${20}Z`, `fill="#120404" stroke="${INK}" stroke-width="2"`) +
        line(`M${f(F.cx - 40)},8Q${f(F.cx - 30)},24 ${f(F.cx - 24)},30M${f(F.cx + 40)},8Q${f(F.cx + 30)},24 ${f(F.cx + 24)},30M${f(F.cx + 10)},-60L${f(F.cx + 16)},-44L${f(F.cx + 8)},-36`, 2, '#8a8270'),
      mouth: ({ F }) => {
        const [x, y] = [F.mouth[0], 34];
        let t = '';
        for (let i = 0; i < 7; i++) t += `<rect x="${f(x - 21 + i * 6)}" y="${y - 6}" width="6" height="14" rx="1.5" fill="#f6f0dc" stroke="${INK}" stroke-width="1.6"/>`;
        return path(`M${x - 24},${y - 8}H${x + 24}V${y + 10}H${x - 24}Z`, `fill="#120404"`) + t;
      },
    },
    front: ({ F }) => [0, 1].map(i => circle([F.eye[i][0], -1], 4.5, `fill="#ff3a1a" filter="url(#glow)"`)).join(''),
  },
  pose: {
    N: [196, 272], tilt: 4, htilt: -4, sw: 184, ww: 126, nw: 16,
    armL: { a1: 126, a2: 70, L1: 72, L2: 62, hand: 'fist', layer: 'mid', r: [26, 20, 19, 14] },
    armR: { a1: 60, a2: -60, L1: 72, L2: 62, hand: 'grip', layer: 'front', r: [26, 20, 19, 14] },
  },
});

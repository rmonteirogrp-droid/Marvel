// Moteur de dessin des médaillons : géométrie, ombrage « cel », membres, mains, tête.
// Tout est généré en SVG, coordonnées du médaillon : 0..400.

let UID = 0;
let PREFIX = 'x';
export function resetIds(p) { UID = 0; PREFIX = p; }
export const uid = () => `${PREFIX}${UID++}`;

export const INK = '#120d1a';
export const f = n => Math.round(n * 10) / 10;
export const rad = d => (d * Math.PI) / 180;
export const deg = r => (r * 180) / Math.PI;
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export function rot([x, y], d) {
  const a = rad(d);
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}
export const polar = (len, d) => [len * Math.cos(rad(d)), len * Math.sin(rad(d))];
export const angle = (a, b) => deg(Math.atan2(b[1] - a[1], b[0] - a[0]));
export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const P = p => `${f(p[0])},${f(p[1])}`;

// ---------- Couleurs ----------
function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
const rgb2hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a, b, k) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A.map((v, i) => v + (B[i] - v) * k));
}
export const darken = (h, k) => rgb2hex(hex2rgb(h).map(v => v * (1 - k)));
// Une teinte = base + ombre (froide, violacée façon comics) + lumière.
export function tone(c, o = {}) {
  if (typeof c === 'object') return c;
  return {
    base: c,
    dark: mix(darken(c, o.dk ?? 0.5), '#24164e', o.cool ?? 0.2),
    light: mix(c, '#fff6e0', o.lt ?? 0.32),
  };
}

// ---------- Chemins ----------
export function smooth(pts, closed = true, k = 1 / 6) {
  const n = pts.length;
  const get = i => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${P(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return closed ? d + 'Z' : d;
}
export const poly = (pts, close = true) => 'M' + pts.map(P).join('L') + (close ? 'Z' : '');
export const mirror = pts => pts.map(([x, y]) => [-x, y]);
// Symétrique : liste de points du côté droit (de haut en bas), complétée en miroir.
export function sym(right, cx = 0) {
  const r = right.map(([x, y]) => [cx + x, y]);
  const l = right.slice(1, -1).reverse().map(([x, y]) => [cx - x, y]);
  return [...r, ...l];
}
export const circle = (c, r, attrs = '') => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" ${attrs}/>`;
export const ellipse = (c, rx, ry, attrs = '') => `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rx)}" ry="${f(ry)}" ${attrs}/>`;
export const path = (d, attrs = '') => `<path d="${d}" ${attrs}/>`;
export const line = (d, w = 2.4, col = INK, extra = '') =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
export const g = (inner, attrs = '') => `<g ${attrs}>${inner}</g>`;
export const tr = (p, a = 0, s = 1) => `transform="translate(${f(p[0])} ${f(p[1])})${a ? ` rotate(${f(a)})` : ''}${s !== 1 ? ` scale(${s})` : ''}"`;
export function clip(d, inner) {
  const id = uid();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
}
// Trait encré à épaisseur variable (pinceau) : polygone fuselé le long d'une polyligne.
export function brush(pts, w0 = 3, w1 = 0.6, col = INK, wMid) {
  const n = pts.length;
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
    const k = i / (n - 1);
    const w = wMid != null ? (k < 0.5 ? w0 + (wMid - w0) * k * 2 : wMid + (w1 - wMid) * (k - 0.5) * 2) : w0 + (w1 - w0) * k;
    left.push([pts[i][0] + Math.cos(ang) * w / 2, pts[i][1] + Math.sin(ang) * w / 2]);
    right.push([pts[i][0] - Math.cos(ang) * w / 2, pts[i][1] - Math.sin(ang) * w / 2]);
  }
  return `<path d="${smooth([...left, ...right.reverse()], true, 1 / 7)}" fill="${col}"/>`;
}

// ---------- Ombrage cel (lumière en haut à gauche) ----------
// a = rotation du repère local, pour garder une lumière fixe à l'écran.
export function shade(d, c, o = {}) {
  c = tone(c);
  const a = o.rot || 0;
  const s = o.s ?? 7, h = o.h ?? 2.6;
  const [sx, sy] = rot([-s * (o.sxk ?? 1), -s], -a);
  const [rx, ry] = [sx * 0.3, sy * 0.3];
  const [hx, hy] = rot([h, h], -a);
  const A = uid(), B = uid(), M = uid(), G1 = uid(), G2 = uid();
  const lw = o.lw ?? 3.2;
  // direction de la lumière dans le repère local -> centre des dégradés « aérographe »
  const [lx, ly] = rot([-0.7071, -0.7071], -a);
  const paint = o.paint !== false;
  const hatch = o.hatch ?? (s >= 4);
  const refl = mix(c.dark, c.base, 0.42);
  return (
    `<clipPath id="${A}"><path d="${d}"/></clipPath>` +
    `<clipPath id="${B}"><path d="${d}" transform="translate(${f(hx)} ${f(hy)})"/></clipPath>` +
    (paint ? `<radialGradient id="${G1}" cx="${f(0.5 + lx * 0.32)}" cy="${f(0.5 + ly * 0.32)}" r="0.62"><stop offset="0" stop-color="#fffbe8" stop-opacity="${o.sheen ?? 0.34}"/><stop offset="1" stop-color="#fffbe8" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${G2}" cx="${f(0.5 + lx * 0.25)}" cy="${f(0.5 + ly * 0.25)}" r="0.75"><stop offset="0.45" stop-color="#0a0418" stop-opacity="0"/><stop offset="1" stop-color="#0a0418" stop-opacity="${o.dim ?? 0.38}"/></radialGradient>` : '') +
    (hatch ? `<mask id="${M}"><rect x="-3000" y="-3000" width="6000" height="6000" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${f(sx * 0.85)} ${f(sy * 0.85)})"/></mask>` : '') +
    `<g clip-path="url(#${A})">` +
    `<path d="${d}" fill="${o.noHi ? c.base : c.light}"/>` +
    `<g clip-path="url(#${B})">` +
    `<path d="${d}" fill="${refl}"/>` +
    `<path d="${d}" fill="${c.dark}" transform="translate(${f(rx)} ${f(ry)})"/>` +
    `<path d="${d}" fill="${c.base}" transform="translate(${f(sx)} ${f(sy)})"/></g>` +
    (o.inner || '') +
    (paint ? `<path d="${d}" fill="url(#${G2})"/><path d="${d}" fill="url(#${G1})"/>` : '') +
    (hatch ? `<g mask="url(#${M})"><path d="${d}" fill="url(#hatch)" transform="translate(${f(rx)} ${f(ry)})"/></g>` : '') +
    `</g>` +
    (lw ? `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${lw}" stroke-linejoin="round"/>` : '')
  );
}

// ---------- Membres ----------
export function capsule(L, r1, r2, bu = 0, bd = 0) {
  const c = Math.max(-0.99, Math.min(0.99, (r1 - r2) / L));
  const phi = Math.acos(c);
  const A1 = [r1 * Math.cos(phi), -r1 * Math.sin(phi)];
  const A2 = [L + r2 * Math.cos(phi), -r2 * Math.sin(phi)];
  const B2 = [A2[0], -A2[1]], B1 = [A1[0], -A1[1]];
  const mU = [(A1[0] + A2[0]) / 2, (A1[1] + A2[1]) / 2 - bu * 2];
  const mD = [(B1[0] + B2[0]) / 2, (B1[1] + B2[1]) / 2 + bd * 2];
  const l2 = phi > Math.PI / 2 ? 1 : 0;
  const l1 = 2 * Math.PI - 2 * phi > Math.PI ? 1 : 0;
  return `M${P(A1)}Q${P(mU)} ${P(A2)}A${f(r2)},${f(r2)} 0 ${l2} 1 ${P(B2)}Q${P(mD)} ${P(B1)}A${f(r1)},${f(r1)} 0 ${l1} 1 ${P(A1)}Z`;
}
// Segment de membre entre deux points, avec détails dessinés dans le repère local (x le long du membre).
export function segment(p1, p2, r1, r2, col, o = {}) {
  const L = dist(p1, p2), a = angle(p1, p2);
  const d = capsule(L, r1, r2, o.bu ?? 0, o.bd ?? 0);
  const det = o.detail ? o.detail(L, r1, r2, a) : '';
  return g(shade(d, col, { rot: a, s: o.s ?? Math.max(4, r1 * 0.38), inner: det, lw: o.lw }) + (o.over ? o.over(L, r1, r2, a) : ''), tr(p1, a));
}

// ---------- Mains ----------
// Repère local : poignet en (0,0), x vers les doigts. flip=-1 inverse le pouce.
export function hand(type, col, o = {}) {
  col = tone(col);
  const fl = o.flip || 1;
  const S = (d, s = 3, extra = {}) => shade(d, col, { s, rot: o.rot || 0, lw: 2.6, ...extra });
  let out = '';
  if (type === 'fist' || type === 'grip' || type === 'claw') {
    // Poing vu de profil : bloc arrondi, phalanges, pouce enroulé.
    out += S(smooth([[0, -12], [14, -14], [27, -12], [31, -2], [30, 10], [22, 14], [6, 13], [-2, 6], [-2, -6]]), 4);
    out += line(`M24,${-11 * fl}Q30,${-2 * fl} 26,${12 * fl}`, 2.2);
    out += line(`M16,${-6 * fl}L27,${-6 * fl}M16,${0}L29,${1 * fl}M16,${6 * fl}L27,${7 * fl}`, 1.8);
    out += S(smooth([[4, -9 * fl], [14, -14 * fl], [22, -12 * fl], [20, -6 * fl], [10, -4 * fl], [4, -4 * fl]]), 2);
  } else if (type === 'open' || type === 'reach') {
    // Main ouverte, doigts écartés.
    const fingers = o.fingers || [[-22, 19], [-7, 22], [8, 21], [22, 17]];
    for (const [a, len] of fingers) {
      const base = [18, 0];
      const fb = add(base, [0, a / 4.5 * fl]);
      if (o.talons) {
        const tip = add(fb, rot([len + 3, 0], a * fl * 0.9));
        out += g(path('M-2,-3.6L14,0L-2,3.6Z', `fill="${o.clawCol || '#cfd6de'}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`), tr(tip, a * fl * 0.9 + 8 * fl));
      }
      out += g(S(capsule(len, 4.6, 3.6), 1.5), tr(fb, a * fl * 0.9));
    }
    out += S(smooth([[0, -11], [12, -13], [21, -10], [23, 0], [21, 10], [12, 13], [0, 11]]), 3);
    out += g(S(capsule(17, 5, 3.8), 1.5), tr([6, -9 * fl], -62 * fl));
  }
  if (type === 'claw' && o.claws !== false) {
    // Griffes d'adamantium (ou de vibranium) qui sortent des phalanges.
    const cl = o.clawCol || '#dfe6ee';
    const len = o.clawLen || 62;
    for (const dy of [-8, 0, 8]) {
      const y = dy * fl;
      out = path(`M24,${y - 2.6}L${24 + len},${y * 1.6 - 1}L${24 + len - 9},${y * 1.6 + 2.2}L24,${y + 2.6}Z`,
        `fill="${cl}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`) +
        line(`M28,${y - 0.6}L${18 + len},${y * 1.6}`, 1.4, '#ffffff', 'opacity="0.85"') + out;
    }
  }
  return g(out, `transform="scale(${o.s || 1})"`);
}

// Main vue de face (coup de poing vers le spectateur, paume ouverte, geste magique…).
// Repère : centre de la paume, y vers le haut des doigts = -y. a = rotation.
export function handFront(type, col, o = {}) {
  col = tone(col);
  const S = (d, s = 4) => shade(d, col, { s, rot: o.rot || 0, lw: 2.8 });
  let out = '';
  if (type === 'fist') {
    out += S(smooth([[-26, -18], [-8, -24], [12, -24], [27, -16], [30, 4], [24, 22], [0, 27], [-22, 22], [-30, 4]]), 6);
    for (let i = 0; i < 4; i++) {
      const x = -19 + i * 12.5;
      out += S(smooth([[x - 6, -20], [x, -25], [x + 6, -20], [x + 6, -8], [x, -5], [x - 6, -8]]), 2);
    }
    out += S(smooth([[-27, 6], [-6, 2], [10, 6], [12, 14], [-4, 16], [-24, 15]]), 3);
  } else {
    // paume ouverte ; type 'web' = signe de l'araignée, 'mystic' = mudra, 'palm' = paume pleine
    const up = { palm: [1, 1, 1, 1], web: [1, 0, 0, 1], mystic: [1, 1, 0, 0], point: [1, 0, 0, 0], two: [1, 1, 0, 0] }[type] || [1, 1, 1, 1];
    const fx = [-15, -5, 5, 15], fa = [-14, -5, 4, 13], fl = [30, 34, 33, 26];
    for (let i = 0; i < 4; i++) {
      const base = [fx[i] * 0.95, -14];
      if (up[i]) out += g(S(capsule(fl[i], 5.4, 4.4), 2), tr(base, -90 + fa[i]));
      else out += g(S(capsule(11, 5.4, 4.8), 2), tr(base, -90 + fa[i]));
    }
    out += S(smooth([[-21, -16], [0, -19], [21, -16], [23, 4], [17, 22], [0, 26], [-17, 22], [-23, 4]]), 5);
    out += line('M-10,2Q0,8 12,-2', 1.6, col.dark);
    out += g(S(capsule(24, 6.5, 4.8), 2), tr([-17, 10], type === 'web' ? -160 : -140));
  }
  return g(out, `transform="rotate(${o.a || 0}) scale(${o.s || 1})"`);
}

// ---------- Tête ----------
// Repère tête : centre entre les yeux ≈ (0,0), crâne à y=-64, menton à y=57.
// t = rotation 3/4 (-1 regarde à gauche … +1 regarde à droite).
export function headPts(t, o = {}) {
  const j = o.jaw ?? 1, c = o.chin ?? 1, w = o.wid ?? 1, cr = o.cran ?? 1;
  const R = [[0, -66 * cr], [22 * w, -62 * cr], [36 * w, -51 * cr], [43 * w, -33], [45 * w, -10], [42 * w * (o.cheek ?? 1), 12], [35 * j * w, 31], [24 * j * w, 46 + 4 * (c - 1)], [11 * c, 55 + 3 * (c - 1)], [0, 57 + 3 * (c - 1)]];
  const pts = sym(R);
  return pts.map(([x, y]) => {
    let X = x * (x > 0 ? 1 - 0.13 * t : 1 + 0.13 * t);
    if (y > -12) X += t * 10 * ((y + 12) / 70);
    if (y < -30) X -= t * 4;
    return [X, y];
  });
}
export const headPath = (t, o) => smooth(headPts(t, o));

export function feat(t) {
  const cx = t * 15;
  return {
    t, cx,
    eye: [-1, 1].map(s => [cx + s * 17 * (1 - 0.22 * t * s), -2]),
    esc: [-1, 1].map(s => 1 - 0.2 * t * s),
    nose: [cx + t * 8, 21],
    mouth: [cx + t * 7, 37],
    // côté « ombre » du visage (lumière à gauche)
  };
}

const EXPR = {
  calm: { brow: 0, lid: 0 },
  determined: { brow: 7, lid: 1.5 },
  angry: { brow: 12, lid: 2.5 },
  furious: { brow: 16, lid: 3 },
  smirk: { brow: 4, lid: 1, asym: 1 },
  sad: { brow: -7, lid: 1 },
  surprised: { brow: -6, lid: -1.5 },
  evil: { brow: 11, lid: 3, asym: 1 },
};

export function eye(c, sc, side, o = {}) {
  const [x, y] = c;
  const w = 10.8 * sc * (o.w ?? 1), h = 5.3 * sc * (o.h ?? 1);
  const lid = (o.lid || 0) * sc;
  const inner = side < 0 ? w : -w; // coin intérieur côté nez
  const iris = o.iris || '#5a3d26';
  const lx = (o.look?.[0] ?? 0) * sc, ly = (o.look?.[1] ?? 0) * sc;
  const tilt = (o.tilt || 0) * side; // coin extérieur relevé
  const pIn = [x + inner, y + 1 + tilt * 0.2], pOut = [x - inner, y - 1 - tilt];
  const top = [x, y - h * 1.5 + lid * 1.4], bot = [x, y + h * 1.05];
  const d = `M${P(pIn)}Q${P([top[0] + inner * 0.15, top[1]])} ${P(pOut)}Q${P([bot[0] - inner * 0.1, bot[1]])} ${P(pIn)}Z`;
  let out = '';
  if (o.type === 'glow' || o.type === 'white' || o.type === 'blank') {
    const col = o.type === 'glow' ? o.glow || '#fff3a0' : '#ffffff';
    if (o.type === 'glow') out += path(d, `fill="${o.glow || '#fff3a0'}" filter="url(#glow)" opacity="0.9"`);
    out += path(d, `fill="${col}" stroke="${INK}" stroke-width="${o.type === 'glow' ? 1.2 : 2.2}"`);
    out += line(`M${P(pIn)}Q${P([top[0] + inner * 0.15, top[1]])} ${P(pOut)}`, 3 * sc);
    return out;
  }
  out += path(d, `fill="#fbf6ee"`);
  out += clip(d,
    circle([x + lx + (o.t || 0) * 2.5, y + ly + 0.8], 4.3 * sc, `fill="${iris}"`) +
    circle([x + lx + (o.t || 0) * 2.5, y + ly + 0.8], 2 * sc, `fill="${INK}"`) +
    circle([x + lx + (o.t || 0) * 2.5 - 1.6 * sc, y + ly - 1], 1.2 * sc, `fill="#fff"`) +
    path(`M${P(pIn)}Q${P([top[0], top[1] + 4])} ${P(pOut)}L${P(pOut)}L${f(pOut[0])},${f(y - 20)}L${f(pIn[0])},${f(y - 20)}Z`, `fill="#000" opacity="0.18"`)
  );
  // paupière supérieure épaisse + trait de cil
  out += brush([pIn, [x + inner * 0.4, top[1] + 1.2], [x - inner * 0.35, top[1] + 0.6], pOut, [pOut[0] - (inner > 0 ? 1 : -1) * 3 * sc, pOut[1] - 1.5]], 2 * sc, 1, INK, 3.6 * sc);
  if (o.lash) {
    const sx = inner > 0 ? -1 : 1;
    out += brush([pOut, [pOut[0] + sx * 5 * sc, pOut[1] - 4 * sc], [pOut[0] + sx * 8 * sc, pOut[1] - 5 * sc]], 3 * sc, 0.6);
    out += brush([[x - inner * 0.55, top[1] + 1.6], [x - inner * 0.68 + sx * 2, top[1] - 3 * sc], [x - inner * 0.7 + sx * 4, top[1] - 4.6 * sc]], 2.4 * sc, 0.5);
  }
  out += line(`M${P([pIn[0] - inner * 0.2, pIn[1] + 1])}Q${P([x, bot[1] + 0.8])} ${P([pOut[0] + inner * 0.15, pOut[1] + 2])}`, 1.1 * sc, INK, 'opacity="0.55"');
  return out;
}
export function brow(c, sc, side, ang, o = {}) {
  const [x, y] = c;
  const w = 15 * sc * (o.w ?? 1), th = (o.th ?? 5) * sc;
  const yi = y - 11 * sc + ang * 0.55, yo = y - 13 * sc - ang * 0.35 + (o.arch ? -3 : 0);
  const xi = x - side * w * 0.75, xo = x + side * w * 1.05;
  const xm = (xi + xo) / 2, ym = Math.min(yi, yo) - 3 * sc - (o.arch || 0);
  const col = o.col || INK;
  return path(`M${f(xi)},${f(yi)}Q${f(xm)},${f(ym - th * 0.6)} ${f(xo)},${f(yo)}Q${f(xm)},${f(ym + th * 0.2)} ${f(xi)},${f(yi + th)}Z`,
    `fill="${col}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"`);
}
export function mouth(type, c, o = {}) {
  const [x, y] = c;
  const w = (o.w ?? 1) * 13;
  const lip = o.lip || '#a8514a';
  switch (type) {
    case 'grit': {
      // dents serrées, lèvres retroussées
      const tw = w * 1.05;
      const d = `M${x - tw},${y - 1}Q${x},${y - 6} ${x + tw},${y - 1}Q${x + tw * 0.7},${y + 6} ${x},${y + 6.5}Q${x - tw * 0.7},${y + 6} ${x - tw},${y - 1}Z`;
      return path(d, `fill="#2a0a0e"`) +
        clip(d, path(`M${x - tw},${y - 8}H${x + tw}V${y + 1.2}Q${x},${y + 2.4} ${x - tw},${y + 1.2}Z`, `fill="#e6dccb"`) +
          path(`M${x - tw},${y + 9}H${x + tw}V${y + 2.8}Q${x},${y + 4} ${x - tw},${y + 2.8}Z`, `fill="#d6cbb8"`) +
          line(`M${x - tw * 0.55},${y - 4}V${y + 6}M${x - tw * 0.18},${y - 5}V${y + 7}M${x + tw * 0.18},${y - 5}V${y + 7}M${x + tw * 0.55},${y - 4}V${y + 6}`, 0.9, '#7a6a5a') +
          ellipse([x + tw * 0.75, y + 1], tw * 0.3, 6, `fill="#2a0a0e" opacity="0.7" filter="url(#soft)"`)) +
        path(d, `fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`) +
        brush([[x - tw - 3, y + 1], [x - tw * 0.4, y - 7], [x + tw * 0.4, y - 7], [x + tw + 3, y + 1]], 1.2, 1.2, INK, 2.6) +
        line(`M${x - w * 0.7},${y + 12}Q${x},${y + 14} ${x + w * 0.7},${y + 12}`, 1.6, INK, 'opacity="0.55"');
    }
    case 'roar':
    case 'shout': {
      const hh = type === 'roar' ? 17 : 12;
      const d = `M${x - w},${y - 4}Q${x},${y - 9} ${x + w},${y - 4}Q${x + w * 0.9},${y + hh} ${x},${y + hh + 2}Q${x - w * 0.9},${y + hh} ${x - w},${y - 4}Z`;
      return path(d, `fill="#3a0d14"`) +
        clip(d, ellipse([x, y + hh + 2], w * 0.6, 7, `fill="#c4404a"`) +
          path(`M${x - w},${y - 8}L${x + w},${y - 8}L${x + w},${y - 1}Q${x},${y + 2} ${x - w},${y - 1}Z`, `fill="#fffaf0"`) +
          (type === 'roar' ? path(`M${x - w},${y + hh + 6}L${x + w},${y + hh + 6}L${x + w},${y + hh - 2}Q${x},${y + hh - 5} ${x - w},${y + hh - 2}Z`, `fill="#fffaf0"`) +
            line(`M${x - w * 0.4},${y - 6}L${x - w * 0.4},${y}M${x + w * 0.4},${y - 6}L${x + w * 0.4},${y}`, 1.2) : '')) +
        path(d, `fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`);
    }
    case 'smirk':
      return brush([[x - w * 0.9, y + 1], [x - w * 0.2, y + 2], [x + w * 0.5, y], [x + w * 1.05, y - 4]], 1.6, 1.2, INK, 3) +
        line(`M${x + w * 0.95},${y - 6}Q${x + w * 1.25},${y - 3} ${x + w * 1.05},${y + 1}`, 1.5) +
        line(`M${x - w * 0.5},${y + 8}Q${x},${y + 10} ${x + w * 0.5},${y + 8}`, 1.5, INK, 'opacity="0.55"');
    case 'smile':
      return path(`M${x - w},${y - 2}Q${x},${y + 2} ${x + w},${y - 2}Q${x},${y + 13} ${x - w},${y - 2}Z`, `fill="#fffaf0" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`) +
        line(`M${x - w * 0.8},${y + 3}Q${x},${y + 6} ${x + w * 0.8},${y + 3}`, 1.1);
    case 'open':
      return path(`M${x - w * 0.7},${y - 2}Q${x},${y - 5} ${x + w * 0.7},${y - 2}Q${x + w * 0.5},${y + 7} ${x},${y + 8}Q${x - w * 0.5},${y + 7} ${x - w * 0.7},${y - 2}Z`, `fill="#3a0d14" stroke="${INK}" stroke-width="2.2"`);
    case 'frown':
      return brush([[x - w, y + 3], [x - w * 0.3, y - 1], [x + w * 0.4, y - 1], [x + w, y + 3]], 1.4, 1.4, INK, 3.2) +
        line(`M${x - w * 0.5},${y + 9}Q${x},${y + 11} ${x + w * 0.5},${y + 9}`, 1.5, INK, 'opacity="0.55"');
    case 'lips':
      return path(`M${x - w},${y}Q${x - w * 0.4},${y - 5} ${x},${y - 2.5}Q${x + w * 0.4},${y - 5} ${x + w},${y}Q${x},${y + 9} ${x - w},${y}Z`, `fill="${lip}" stroke="${INK}" stroke-width="1.8"`) +
        line(`M${x - w},${y}Q${x},${y + 2.5} ${x + w},${y}`, 1.8) +
        path(`M${x - w * 0.3},${y + 3.2}Q${x},${y + 5} ${x + w * 0.35},${y + 3.2}`, `fill="none" stroke="#fff" stroke-width="1.3" opacity="0.6"`);
    case 'lipsmirk':
      return path(`M${x - w},${y + 1}Q${x - w * 0.4},${y - 4} ${x},${y - 2}Q${x + w * 0.4},${y - 5} ${x + w * 1.05},${y - 3}Q${x},${y + 9} ${x - w},${y + 1}Z`, `fill="${lip}" stroke="${INK}" stroke-width="1.8"`) +
        line(`M${x - w},${y + 1}Q${x},${y + 2} ${x + w * 1.05},${y - 3}`, 1.8);
    default: // flat
      return brush([[x - w * 0.9, y], [x, y + 1.2], [x + w * 0.9, y]], 1.6, 1.6, INK, 3) +
        line(`M${x - w * 0.5},${y + 8}Q${x},${y + 10} ${x + w * 0.5},${y + 8}`, 1.5, INK, 'opacity="0.55"');
  }
}

// Masque intégral : lentilles blanches.
export function lens(c, sc, side, shape, o = {}) {
  const [x, y] = c;
  const ang = o.ang ?? 0; // colère : coin intérieur abaissé
  let pts;
  if (shape === 'spidey')
    pts = [[-13, -4 + ang], [2, -15], [15, -12], [19, -2], [11, 11], [-6, 10], [-14, 4 + ang * 0.4]];
  else if (shape === 'round')
    pts = [[-11, -3 + ang], [-2, -10], [10, -9], [13, 0], [8, 8], [-4, 8], [-11, 4]];
  else if (shape === 'narrow')
    pts = [[-13, -2 + ang], [0, -7], [14, -8], [16, -2], [9, 4], [-6, 4], [-13, 2]];
  else if (shape === 'venom')
    pts = [[-14, 10 + ang], [-2, -4], [12, -16], [26, -26], [38, -32], [36, -14], [30, 2], [18, 14], [2, 18]];
  else if (shape === 'slit')
    pts = [[-12, -1 + ang], [2, -5], [15, -6], [12, 2], [-4, 3]];
  const s = sc * (o.s ?? 1);
  // le côté gauche est le miroir du côté droit : coin intérieur vers le nez
  const P2 = pts.map(([px, py]) => [x + side * px * s, y + py * s]);
  const d = shape === 'narrow' || shape === 'slit' ? poly(P2) : smooth(P2, true, shape === 'venom' ? 1 / 16 : 1 / 7);
  return path(d, `fill="${o.fill || '#ffffff'}" stroke="${INK}" stroke-width="${o.border ?? 5}" stroke-linejoin="round"`) +
    (o.shine === false ? '' : path(d, `fill="#b9d4ff" opacity="0.35" transform="translate(${f(x)} ${f(y)}) scale(0.55) translate(${f(-x + side * 4)} ${f(-y + 6)})"`));
}


// Modelé « peint » du visage : ombres et lumières douces (aérographe).
export function faceModel(F, skin, t, k = 1) {
  const D = (o) => `fill="${skin.dark}" opacity="${f(o * k)}" filter="url(#soft)"`;
  const L = (o) => `fill="${skin.light}" opacity="${f(o * k)}" filter="url(#soft)"`;
  let o = '';
  o += ellipse([F.cx - 10, -42], 20, 9, L(0.55));
  o += ellipse([F.cx + 42, -24], 8, 15, D(0.45));
  F.eye.forEach((e, i) => {
    o += ellipse([e[0], -5], 17 * F.esc[i], 10, D(i ? 0.75 : 0.55));
    o += ellipse([e[0] - 3, -21], 13 * F.esc[i], 3.5, L(0.5));
  });
  o += path(`M${f(F.cx - 35)},10Q${f(F.cx - 30)},30 ${f(F.cx - 20)},42`, `fill="none" stroke="${skin.dark}" stroke-width="9" opacity="${f(0.38 * k)}" filter="url(#soft)"`);
  o += path(`M${f(F.cx + 35)},10Q${f(F.cx + 30)},30 ${f(F.cx + 21)},42`, `fill="none" stroke="${skin.dark}" stroke-width="11" opacity="${f(0.55 * k)}" filter="url(#soft)"`);
  o += ellipse([F.cx - 25, 8], 10, 5, L(0.5));
  o += path(`M${f(F.nose[0] - 4)},-6L${f(F.nose[0] - 3)},16`, `stroke="${skin.light}" stroke-width="3.4" stroke-linecap="round" opacity="${f(0.75 * k)}" filter="url(#soft)"`);
  o += ellipse([F.nose[0], 28], 9, 3, D(0.55));
  o += ellipse([F.mouth[0], 47], 10, 3.6, D(0.5));
  o += ellipse([F.mouth[0] - 3, 53], 8, 3, L(0.45));
  return o;
}

// Construit la tête complète. h : description du personnage.
// Retourne un <g> dans le repère tête.
export function headCtx(h) {
  const t = h.t || 0;
  return { t, F: feat(t), hd: headPath(t, h.shape || {}), skin: tone(h.skin || '#f1c39b', { cool: 0.25 }), ex: EXPR[h.expr || 'determined'], h };
}
export function head(h) {
  const t = h.t || 0;
  const F = feat(t);
  const ex = EXPR[h.expr || 'determined'];
  const ho = h.shape || {};
  const hd = headPath(t, ho);
  const skin = tone(h.skin || '#f1c39b', { cool: 0.25 });
  const ctx = { t, F, hd, skin, ex, h };
  let out = '';
  if (h.back && !h.noBack) out += h.back(ctx);
  if (h.custom) return out + h.custom(ctx);
  // oreilles
  if (h.ears !== false) {
    for (const s of [-1, 1]) {
      if (t * s > 0.45) continue;
      const ex0 = s * 44 * (1 - 0.13 * t * s) + t * 6;
      const ed = smooth([[ex0 - s * 4, -12], [ex0 + s * 6, -16], [ex0 + s * 9, -2], [ex0 + s * 5, 14], [ex0 - s * 3, 16]]);
      out += shade(ed, skin, { s: 3, lw: 2.6 }) + line(`M${f(ex0 + s * 3)},${-8}Q${f(ex0 + s * 6)},${0} ${f(ex0 + s * 2)},${8}`, 1.6, skin.dark);
    }
  }
  // visage
  let face = '';
  // ombres structurelles : orbites, joue côté ombre, sous le nez, sous la lèvre
  const shadowSide = 1; // lumière à gauche
  face += path(smooth([[F.cx + 30 - t * 4, -26], [F.cx + 48, -8], [F.cx + 44, 26], [F.cx + 30, 52], [F.cx + 22, 30], [F.cx + 26, 6]]), `fill="${skin.dark}" opacity="0.55"`);
  if (!h.mask || h.mask.type === 'cowl' || h.mask.type === 'domino') {
    face += path(smooth([[F.nose[0] + 2, 4], [F.nose[0] + 7, 16], [F.nose[0] + 2, 24], [F.nose[0] - 3, 18], [F.nose[0] - 1, 8]]), `fill="${skin.dark}" opacity="0.8"`);
    face += faceModel(F, skin, t, h.modelK ?? 1);
  }
  out += shade(hd, skin, { s: 9, h: 3, lw: 0, inner: face });
  if (!h.mask || h.mask.type === 'cowl' || h.mask.type === 'domino') out += features(ctx);
  if (h.mask) out += maskLayer(ctx);
  if (h.mid) out += h.mid(ctx);
  out += path(hd, `fill="none" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"`);
  if (h.front) out += h.front(ctx);
  return out;
}

export function features(ctx) {
  const { F, ex, h, skin, t } = ctx;
  let out = '';
  const ey = h.eyes || {};
  const br = h.brows || {};
  const ang = (br.ang ?? ex.brow);
  // yeux
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const c = add(F.eye[i], [0, ey.dy || 0]);
    const sc = F.esc[i] * (ey.s || 1);
    if (h.eyeSocket !== false) out += ellipse([c[0], c[1] - 3], 15 * sc, 9 * sc, `fill="${skin.dark}" opacity="0.42"`);
    out += eye(c, sc, s, { ...ey, lid: (ey.lid ?? ex.lid) + (ex.asym && s > 0 ? 2.5 : 0), t });
    if (br.none) continue;
    const a2 = ex.asym && s < 0 ? ang * 0.3 - 4 : ang;
    out += brow([c[0], c[1] - (br.dy || 0)], sc, s, a2, br);
  }
  if (ang > 6 && !br.none) out += line(`M${f(F.cx - 3)},${-16}L${f(F.cx - 1)},${-9}M${f(F.cx + 3)},${-16}L${f(F.cx + 2)},${-9}`, 1.5, INK, 'opacity="0.6"');
  // nez
  if (h.nose !== false) {
    const [nx, ny] = F.nose;
    out += line(`M${f(nx - 2 + t * 2)},${2}Q${f(nx + 4)},${12} ${f(nx + 3)},${ny}`, 2, INK, 'opacity="0.75"');
    out += line(`M${f(nx - 7)},${ny + 1}Q${f(nx - 3)},${ny + 5} ${f(nx + 1)},${ny + 3}Q${f(nx + 5)},${ny + 5} ${f(nx + 7)},${ny}`, 2.2);
  }
  // rides
  const L = h.lines || [];
  if (L.includes('cheek')) out += line(`M${f(F.cx - 30)},${14}Q${f(F.cx - 26)},${26} ${f(F.cx - 24)},${36}M${f(F.cx + 30)},${14}Q${f(F.cx + 27)},${26} ${f(F.cx + 25)},${36}`, 1.6, INK, 'opacity="0.55"');
  if (L.includes('fold')) out += line(`M${f(F.nose[0] - 10)},${24}Q${f(F.mouth[0] - 17)},${32} ${f(F.mouth[0] - 15)},${40}M${f(F.nose[0] + 11)},${24}Q${f(F.mouth[0] + 18)},${32} ${f(F.mouth[0] + 16)},${40}`, 1.7, INK, 'opacity="0.6"');
  if (L.includes('cleft')) out += line(`M${f(F.mouth[0] + 1)},${49}L${f(F.mouth[0] + 1)},${54}`, 1.8, INK, 'opacity="0.6"');
  if (L.includes('bags')) out += line(`M${f(F.eye[0][0] - 9)},${8}Q${f(F.eye[0][0])},${12} ${f(F.eye[0][0] + 8)},${8}M${f(F.eye[1][0] - 8)},${8}Q${f(F.eye[1][0])},${12} ${f(F.eye[1][0] + 9)},${8}`, 1.4, INK, 'opacity="0.5"');
  if (L.includes('forehead')) out += line(`M${f(F.cx - 16)},${-30}Q${f(F.cx)},${-34} ${f(F.cx + 16)},${-30}M${f(F.cx - 12)},${-37}Q${f(F.cx)},${-40} ${f(F.cx + 12)},${-37}`, 1.5, INK, 'opacity="0.5"');
  if (h.blush) out += ellipse([F.cx - 24, 18], 8, 4, `fill="#e8806f" opacity="0.35"`) + ellipse([F.cx + 24, 18], 8, 4, `fill="#e8806f" opacity="0.35"`);
  if (h.beard) out += h.beard(ctx);
  out += mouth(h.mouth || 'flat', add(F.mouth, [0, h.mouthDy || 0]), { w: h.mouthW, lip: h.lip });
  return out;
}

function maskLayer(ctx) {
  const { F, hd, h, t, ex } = ctx;
  const m = h.mask;
  const col = tone(m.color);
  let out = '';
  if (m.type === 'full') {
    let inner = faceModel(F, col, t, m.modelK ?? 0.8) + (m.pattern ? m.pattern(ctx) : '');
    out += shade(hd, col, { s: 10, h: 3, lw: 0, inner });
    const ang = m.ang ?? ex.brow * 0.5;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1;
      out += lens(add(F.eye[i], [s * 1, m.dy ?? 0]), F.esc[i] * (m.ls || 1), s, m.lens || 'spidey', { ang, fill: m.lensFill, border: m.border, shine: m.shine });
    }
    if (m.mouth) out += m.mouth(ctx);
  } else if (m.type === 'cowl') {
    // masque qui couvre tout sauf le bas du visage
    const top = m.top ?? 12;
    const sw = m.side ?? 30;
    const open = smooth([
      [F.cx - sw - 6 + t * 4, 90], [F.cx - sw - 2, 40], [F.cx - sw + 2 + t * 3, top + 8], [F.cx - 12 + t * 4, top + 2], [F.cx + t * 6, top + 6],
      [F.cx + 12 + t * 8, top + 2], [F.cx + sw + t * 3, top + 8], [F.cx + sw + 4, 40], [F.cx + sw + 8 + t * 4, 90],
    ]);
    const id = uid();
    let inner = `<path d="M-120,-120H120V120H-120Z ${open}" fill-rule="evenodd" fill="${col.base}"/>`;
    out += `<clipPath id="${id}"><path d="${hd}"/></clipPath><g clip-path="url(#${id})">` +
      `<mask id="${id}m"><rect x="-120" y="-120" width="240" height="240" fill="#fff"/><path d="${open}" fill="#000"/></mask>` +
      `<g mask="url(#${id}m)">${shade(hd, col, { s: 10, h: 3, lw: 0, inner: m.pattern ? m.pattern(ctx) : '' })}</g>` +
      path(open, `fill="none" stroke="${INK}" stroke-width="2.6"`) + '</g>';
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1;
      const c = F.eye[i];
      const sc = F.esc[i];
      if (m.eyes === 'lens') out += lens(c, sc * (m.ls || 0.85), s, m.lens || 'narrow', { ang: ex.brow * 0.5, border: 3.6, shine: false });
      else {
        // trou des yeux : peau + œil
        const inX = c[0] - s * 13 * sc, outX = c[0] + s * 15 * sc;
        out += path(smooth([[inX, c[1] - 3 + ex.brow * 0.25], [c[0], c[1] - 8 * sc + ex.brow * 0.2], [outX, c[1] - 6], [c[0] + s * 8 * sc, c[1] + 6 * sc], [c[0] - s * 8 * sc, c[1] + 6 * sc]], true, 1 / 8), `fill="${ctx.skin.dark}" stroke="${INK}" stroke-width="2.2"`);
        out += eye(c, sc * 0.9, s, { ...(h.eyes || {}), lid: (h.eyes?.lid ?? ex.lid) + 1.5, t });
        out += brow([c[0], c[1] + 1], sc, s, ex.brow, { col: col.dark, th: 4 });
      }
    }
    if (m.over) out += m.over(ctx);
  } else if (m.type === 'domino') {
    const d = smooth([[F.cx - 40, -8], [F.eye[0][0], -16], [F.cx, -8], [F.eye[1][0], -16], [F.cx + 40 - t * 6, -8], [F.eye[1][0] + 10, 10], [F.cx + 4, 5], [F.eye[0][0] - 10, 10]]);
    out += clip(hd, shade(d, col, { s: 3, lw: 2.4 }));
    for (let i = 0; i < 2; i++) out += lens(F.eye[i], F.esc[i] * 0.8, i ? 1 : -1, 'narrow', { ang: ex.brow * 0.4, border: 3, shine: false });
  }
  return out;
}

// ---------- Torse ----------
// Repère torse : base du cou en (0,0), y vers le bas.
export function torsoPts(T) {
  const { sw, ww, nw } = T;
  const s = sw / 2;
  return sym([[0, -4], [nw, -30], [nw + (s - nw) * 0.35, -12], [nw + (s - nw) * 0.75, 6], [s, 30], [s + 2, 56], [s - 8, 96], [ww / 2 + 4, 140], [ww / 2, 175], [ww / 2 + 8, 260], [0, 262]]);
}

// Barbe : 'full' (barbe pleine), 'goatee' (bouc), 'stubble' (barbe de trois jours), 'mous' (moustache seule)
export function beard(ctx, col, o = {}) {
  const { F, t, h } = ctx;
  const [mx, my] = add(F.mouth, [0, h.mouthDy || 0]);
  const c = tone(col, { lt: 0.3 });
  const type = o.type || 'full';
  let d;
  if (type === 'goatee' || type === 'mous') {
    const pts = [[mx - 17, my + 2], [mx - 15, my - 7], [mx, my - 10], [mx + 15, my - 7], [mx + 17, my + 2], [mx + 12, my - 1], [mx, my - 4], [mx - 12, my - 1]];
    d = smooth(pts, true, 1 / 8);
    let out = shade(d, c, { s: 2, lw: 2 });
    if (type === 'goatee') {
      const d2 = smooth([[mx - 9, my + 8], [mx, my + 6], [mx + 9, my + 8], [mx + 8, my + 18], [mx + 2, my + 27], [mx - 2, my + 27], [mx - 8, my + 18]], true);
      out += shade(d2, c, { s: 2, lw: 2 });
    }
    return out;
  }
  const hp = headPts(t, h.shape || {});
  const top = o.top ?? 2;
  const puff = o.puff ?? 4;
  const lower = hp.filter(([x, y]) => y > top).map(([x, y]) => [x + Math.sign(x - F.cx) * puff * 0.5, y + (y > 40 ? puff : 0)]);
  const inner = [[F.cx - 33 + t * 4, top + 10], [mx - 18, my - 6], [mx - 8, my - 10], [mx + 8, my - 10], [mx + 18, my - 6], [F.cx + 33 + t * 4, top + 10]].reverse();
  // lower : côté droit (descendant) puis gauche (montant) ; on referme par l'intérieur de gauche à droite
  d = smooth([...lower, ...inner.reverse()], true, 1 / 8);
  if (type === 'stubble') return clip(headPath(t, h.shape || {}), path(d, `fill="${c.dark}" opacity="0.32"`));
  const st = [];
  for (let i = -3; i <= 3; i++) st.push(line(`M${f(mx + i * 9)},${f(my + 10)}Q${f(mx + i * 11)},${f(my + 18)} ${f(mx + i * 10)},${f(my + 24 - Math.abs(i) * 2)}`, 1.4, c.dark));
  return shade(d, c, { s: 4, lw: 2.6, inner: st.join('') });
}

// Calotte de cheveux qui épouse le crâne ; edge = ligne de cheveux (de droite à gauche), cut = hauteur des tempes
export function hairCap(ctx, col, edge, o = {}) {
  const { t, h, F } = ctx;
  const hp = headPts(t, h.shape || {});
  const n = hp.length, half = (n) / 2; // 0 = sommet, half = menton
  const cutR = o.cutR ?? o.cut ?? -10, cutL = o.cutL ?? o.cut ?? -10;
  const right = [], left = [];
  for (let i = 1; i < half; i++) if (hp[i][1] < cutR) right.push(hp[i]);
  for (let i = half + 1; i < n; i++) if (hp[i][1] < cutL) left.push(hp[i]);
  const c0 = [F.cx * 0.3, o.cy ?? -6];
  const puff = o.puff ?? 6;
  const ex = p => { const d = Math.hypot(p[0] - c0[0], p[1] - c0[1]); return [p[0] + ((p[0] - c0[0]) / d) * puff, p[1] + ((p[1] - c0[1]) / d) * puff * (o.puffY ?? 1)]; };
  const arc = [...left, hp[0], ...right].map(ex);
  if (o.top) arc.splice(Math.floor(arc.length / 2), 0, ...o.top);
  const e = typeof edge === 'function' ? edge(F) : edge;
  const pts = [...arc, ...e];
  const ct = tone(col, { lt: 0.3 });
  return shade(smooth(pts, true, 1 / 6.5), ct, { s: o.s ?? 6, lw: o.lw ?? 3, inner: o.inner ? o.inner(ct) : '' });
}

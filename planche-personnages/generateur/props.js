// Accessoires : bouclier, marteau, arc, épées, cartes, pistolets…
import { INK, f, P, add, sub, polar, rot, angle, path, line, circle, ellipse, smooth, poly, g, tr, shade, tone, capsule, mix, brush } from './lib.js';
import { starShape } from './bg.js';

// Bouclier de Captain America, vu en perspective (squash) et incliné (a).
export function capShield(c, r, a = 0, squash = 0.8) {
  const rings = [['#c8202e', 1], ['#f4f4f4', 0.78], ['#c8202e', 0.58], ['#1f4fa8', 0.4]];
  let out = '';
  out += ellipse([4, 5], r, r, `fill="${INK}"`);
  for (const [col, k] of rings) {
    const t = tone(col);
    out += circle([0, 0], r * k, `fill="${t.base}" stroke="${INK}" stroke-width="2.6"`);
    out += path(`M${f(-r * k * 0.7)},${f(-r * k * 0.7)}A${f(r * k)},${f(r * k)} 0 0 1 ${f(r * k * 0.7)},${f(-r * k * 0.7)}`, `fill="none" stroke="${t.light}" stroke-width="${f(r * 0.05)}" opacity="0.8" transform="translate(0 ${f(r * 0.04)}) scale(0.94)"`);
  }
  out += path(starShape([0, 0], r * 0.37), `fill="#f8f8f8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`);
  out += path(`M${f(-r * 0.9)},${f(r * 0.3)}A${f(r)},${f(r)} 0 0 0 ${f(r * 0.4)},${f(r * 0.92)}`, `fill="none" stroke="#000" stroke-width="${f(r * 0.12)}" opacity="0.18"`);
  out += ellipse([-r * 0.35, -r * 0.45], r * 0.22, r * 0.08, `fill="#fff" opacity="0.6" transform="rotate(-35 ${f(-r * 0.35)} ${f(-r * 0.45)})"`);
  return g(g(out, `transform="scale(${squash} 1)"`), tr(c, a));
}

// Mjolnir : manche depuis la main, tête rectangulaire. a = direction du manche (vers la tête).
export function mjolnir(hand, a, s = 1) {
  let out = '';
  const L = 58 * s;
  out += g(shade(capsule(L, 6 * s, 6 * s), '#7a4a2a', { s: 2, lw: 2.6, inner: line(`M8,-6L4,6M18,-6L14,6M28,-6L24,6M38,-6L34,6`, 1.6, '#3a2010') }), tr(hand, a));
  const hc = add(hand, polar(L + 18 * s, a));
  const w = 70 * s, h = 42 * s;
  const d = `M${-h / 2},${-w / 2}H${h / 2}V${w / 2}H${-h / 2}Z`;
  out += g(shade(d, '#9aa3ad', { s: 7, rot: a, lw: 3.2, inner: `<rect x="${-h / 2 + 5}" y="${-w / 2 + 5}" width="${h - 10}" height="${w - 10}" fill="none" stroke="#5e6670" stroke-width="2"/>` + circle([0, 0], 9 * s, `fill="none" stroke="#5e6670" stroke-width="2"`) }), tr(hc, a));
  // lanière
  out += line(`M${P(add(hand, polar(-4, a)))}Q${P(add(hand, polar(-24, a + 25)))} ${P(add(hand, polar(-14, a + 60)))}`, 3.5, '#5a3418');
  return out;
}

export function sword(hand, a, len = 150, col = '#dfe6ee', o = {}) {
  let out = '';
  const bw = o.w || 8;
  const tip = add(hand, polar(len, a));
  const base = add(hand, polar(16, a));
  const n = polar(bw, a + 90);
  out += path(poly([add(base, n), add(tip, polar(-14, a)), tip, sub(add(tip, polar(-14, a)), mul2(n, 0.2)), sub(base, n)]), `fill="${col}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`);
  out += line(`M${P(add(base, mul2(n, 0.3)))}L${P(add(tip, polar(-16, a)))}`, 1.6, '#ffffff', 'opacity="0.9"');
  out += g(shade(capsule(20, 4, 4), o.grip || '#3a2a20', { s: 1, lw: 2.2 }), tr(add(hand, polar(-8, a)), a));
  out += g(`<rect x="-3" y="${-(bw + 9)}" width="7" height="${2 * (bw + 9)}" rx="2" fill="${o.guard || '#c9a54a'}" stroke="${INK}" stroke-width="2.2"/>`, tr(add(hand, polar(14, a)), a));
  return out;
}
const mul2 = (p, k) => [p[0] * k, p[1] * k];

export function bow(c, a, h = 170, col = '#5a2f86') {
  // arc recourbé, centre de poignée en c, a = orientation (perpendiculaire à la flèche)
  const tip1 = [0, -h / 2], tip2 = [0, h / 2];
  const d = `M${P(tip1)}Q${f(-26)},${f(-h * 0.36)} -16,-14Q-12,0 -16,14Q-26,${f(h * 0.36)} ${P(tip2)}`;
  return g(
    line(d, 9, INK) + line(d, 5.5, col) + line(`M-14,-10Q-10,0 -14,10`, 7, '#2a2a2a'),
    tr(c, a)
  );
}
export function arrow(from, a, len = 130, head = '#c3cad3', fletch = '#7b3fb8') {
  const tip = add(from, polar(len, a));
  let out = line(`M${P(from)}L${P(tip)}`, 5.5, INK) + line(`M${P(from)}L${P(tip)}`, 3, '#d9c8a0');
  out += g(path('M0,0L-16,-7L-12,0L-16,7Z', `fill="${head}" stroke="${INK}" stroke-width="2"`), tr(tip, a));
  out += g(path('M0,0L18,-8L22,-8L8,0L22,8L18,8Z', `fill="${fletch}" stroke="${INK}" stroke-width="1.8"`), tr(from, a));
  return out;
}

export function gun(hand, a, o = {}) {
  const col = o.col || '#3b3f46';
  const L = o.len || 46;
  let inner = `<rect x="-6" y="-11" width="${L}" height="13" rx="2" fill="${col}" stroke="${INK}" stroke-width="2.4"/>` +
    `<rect x="${L - 8}" y="-9" width="10" height="7" fill="${mix(col, '#000', 0.3)}" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M-4,0L6,0L2,20L-10,20Z" fill="${mix(col, '#000', 0.2)}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    line(`M0,-8H${L - 12}`, 1.6, '#9aa0aa');
  if (o.glow) inner += circle([L + 4, -4], 6, `fill="${o.glow}" filter="url(#glow)"`);
  return g(inner, `transform="translate(${f(hand[0])} ${f(hand[1])}) rotate(${f(a)}) scale(${o.s || 1} ${(o.flip || 1) * (o.s || 1)})"`);
}

export function card(c, a, col = '#ff3da5') {
  return g(
    `<rect x="-11" y="-16" width="22" height="32" rx="3" fill="${col}" opacity="0.6" filter="url(#glow)"/>` +
    `<rect x="-11" y="-16" width="22" height="32" rx="3" fill="#fff6fb" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="-7" y="-12" width="14" height="24" rx="2" fill="none" stroke="${col}" stroke-width="1.6"/>` +
    path('M0,-6L5,0L0,6L-5,0Z', `fill="${col}"`),
    tr(c, a)
  );
}

export function staff(a, b, col = '#6b4a2a', w = 7) {
  const d = `M${P(a)}L${P(b)}`;
  return path(d, `stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round"`) + path(d, `stroke="${col}" stroke-width="${w}" stroke-linecap="round"`) +
    path(d, `stroke="#fff" stroke-width="${w * 0.25}" stroke-linecap="round" opacity="0.4" transform="translate(-1 -1)"`);
}

// Cape qui flotte derrière les épaules
export function cape(J, col, o = {}) {
  const { toG, T } = J;
  const s = T.sw / 2;
  const sp = o.spread || 1;
  const pts = [toG([-s + 20, 10]), toG([-s - 30 * sp, 120]), add(toG([-s - 60 * sp, 260]), o.wind || [0, 0]), toG([0, 280]), add(toG([s + 60 * sp, 260]), o.wind || [0, 0]), toG([s + 30 * sp, 120]), toG([s - 20, 10])];
  const t = tone(col);
  const d = smooth(pts, true, 1 / 6);
  let folds = '';
  for (const k of [-0.6, -0.25, 0.25, 0.6]) folds += line(`M${P(toG([k * s, 60]))}Q${P(toG([k * s * 1.6, 160]))} ${P(toG([k * s * 2.2, 280]))}`, 2.4, t.dark);
  return shade(d, t, { s: 14, inner: folds });
}

// Ailes déployées derrière le dos (Falcon, la Guêpe…)
export function wings(J, o = {}) {
  const { toG } = J;
  const col = tone(o.col || '#c8202e');
  const sp = o.span || 1;
  let out = '';
  for (const s of [-1, 1]) {
    const root = toG([s * 30, 40]);
    if (o.insect) {
      for (const [a, L, w] of [[-35, 150, 46], [10, 110, 34]]) {
        const ang = s < 0 ? 180 - a : a;
        out += g(path(`M0,0Q${f(L * 0.5)},${f(-w)} ${f(L)},0Q${f(L * 0.5)},${f(w)} 0,0Z`, `fill="${o.col || '#bfefff'}" fill-opacity="0.45" stroke="${INK}" stroke-width="2.4"`) +
          line(`M6,0Q${f(L * 0.5)},${f(-w * 0.3)} ${f(L * 0.92)},0M${f(L * 0.3)},${f(-w * 0.3)}L${f(L * 0.45)},${f(w * 0.5)}M${f(L * 0.6)},${f(-w * 0.4)}L${f(L * 0.7)},${f(w * 0.4)}`, 1.2, '#ffffff', 'opacity="0.8"'), tr(root, ang * 1 - (s < 0 ? 0 : 0) * 1));
      }
      continue;
    }
    // ailes à plumes (rangées de rémiges)
    const n = 8;
    for (let i = n - 1; i >= 0; i--) {
      const a = -70 + i * 13 * sp;
      const ang = s < 0 ? 180 - a : a;
      const L = (190 - i * 12) * (o.len || 1);
      const p0 = add(root, polar(20, ang));
      const tone2 = i % 2 ? col : tone(o.col2 || '#e8e8ee');
      out += g(shade(`M0,-10Q${f(L * 0.55)},-22 ${f(L)},-3L${f(L - 8)},6Q${f(L * 0.5)},14 0,10Z`, tone2, { s: 4, lw: 2.6, rot: ang }), tr(p0, ang));
    }
  }
  return out;
}

// Herbe géante (monde microscopique)
export function grass(cols = ['#3f8f2a', '#5fb83a', '#2f6e20'], seed = 3) {
  let out = '';
  let r = 1;
  for (let i = 0; i < 16; i++) {
    r = (r * 9301 + 49297) % 233280;
    const x = (i / 15) * 440 - 20 + (r / 233280 - 0.5) * 30;
    const h = 200 + ((r * 7) % 160);
    const bend = ((r % 80) - 40);
    const col = cols[i % cols.length];
    out += path(`M${f(x - 12)},420Q${f(x - 6)},${f(400 - h * 0.5)} ${f(x + bend)},${f(400 - h)}Q${f(x + 6)},${f(400 - h * 0.5)} ${f(x + 12)},420Z`, `fill="${col}" stroke="${INK}" stroke-width="2.2"`);
  }
  return out;
}
export function flower(c, r, petal = '#ffffff', core = '#f5c518', n = 10) {
  let out = '';
  for (let i = 0; i < n; i++) out += g(ellipse([r * 0.55, 0], r * 0.5, r * 0.17, `fill="${petal}" stroke="${INK}" stroke-width="2"`), tr(c, (i * 360) / n));
  return out + circle(c, r * 0.26, `fill="${core}" stroke="${INK}" stroke-width="2.4"`);
}

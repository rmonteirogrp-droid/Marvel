// Décors de fond des médaillons (repère 0..400).
import { INK, f, P, path, line, circle, ellipse, smooth, poly, g, tone, mix, polar, add, rot } from './lib.js';

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function grad(id, stops, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${f(i / (stops.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}
export function sky(stops, id = 'sky') {
  return `<defs>${grad(id, stops)}</defs><rect width="400" height="400" fill="url(#${id})"/>`;
}
export function radial(id, inner, outer, cx = 0.5, cy = 0.5, r = 0.6) {
  return `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/></radialGradient></defs><rect width="400" height="400" fill="url(#${id})"/>`;
}

// Rayons d'explosion façon couverture de comics
export function rays(c = [200, 190], col = '#fff', n = 22, op = 0.25, spread = 0.5) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 360, a1 = a0 + (360 / n) * spread;
    const p0 = add(c, polar(600, a0)), p1 = add(c, polar(600, a1));
    d += `M${P(c)}L${P(p0)}L${P(p1)}Z`;
  }
  return path(d, `fill="${col}" opacity="${op}"`);
}
// Lignes de vitesse
export function speed(c = [200, 200], col = '#fff', n = 40, r0 = 150, op = 0.5, seed = 3) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = R() * 360, r1 = r0 + R() * 40, w = 1 + R() * 3;
    const p0 = add(c, polar(r1, a)), p1 = add(c, polar(300, a));
    out += path(`M${P(add(p0, polar(w * 0.2, a + 90)))}L${P(add(p1, polar(w, a + 90)))}L${P(add(p1, polar(w, a - 90)))}Z`, `fill="${col}"`);
  }
  return g(out, `opacity="${op}"`);
}

export function stars(n = 60, col = '#fff', seed = 1, y1 = 400) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = R() * 400, y = R() * y1, r = R() * 1.6 + 0.4;
    out += circle([x, y], r, `fill="${col}" opacity="${f(0.4 + R() * 0.6)}"`);
    if (r > 1.7) out += path(`M${f(x - 5)},${f(y)}L${f(x + 5)},${f(y)}M${f(x)},${f(y - 5)}L${f(x)},${f(y + 5)}`, `stroke="${col}" stroke-width="0.8"`);
  }
  return out;
}
export function nebula(cols, seed = 2) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < 7; i++) {
    out += ellipse([R() * 400, R() * 300], 60 + R() * 90, 30 + R() * 60, `fill="${cols[i % cols.length]}" opacity="${f(0.25 + R() * 0.3)}" filter="url(#blur14)" transform="rotate(${f(R() * 60 - 30)} 200 200)"`);
  }
  return out;
}
export function planet(c, r, col, ring = null) {
  const t = tone(col);
  let out = '';
  if (ring) out += ellipse(c, r * 1.9, r * 0.45, `fill="none" stroke="${ring}" stroke-width="5" transform="rotate(-18 ${f(c[0])} ${f(c[1])})" opacity="0.8"`);
  out += circle(c, r, `fill="${t.base}" stroke="${INK}" stroke-width="2.5"`);
  out += path(`M${f(c[0] - r * 0.2)},${f(c[1] - r)}A${f(r)},${f(r)} 0 0 1 ${f(c[0] + r * 0.6)},${f(c[1] + r * 0.8)}A${f(r * 1.1)},${f(r * 1.1)} 0 0 0 ${f(c[0] - r * 0.2)},${f(c[1] - r)}Z`, `fill="${t.dark}" opacity="0.6"`);
  out += circle([c[0] - r * 0.35, c[1] - r * 0.35], r * 0.25, `fill="${t.light}" opacity="0.6"`);
  return out;
}

// Gratte-ciels avec fenêtres
export function city(o = {}) {
  const R = rng(o.seed || 5);
  const far = o.far || '#3b4a7a', near = o.near || '#1d2340', win = o.win || '#ffd76a';
  let out = '';
  const row = (base, hmin, hmax, col, wcol, wop, outline) => {
    let x = -10;
    while (x < 410) {
      const w = 26 + R() * 34, h = hmin + R() * (hmax - hmin);
      const y = base - h;
      let b = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h + 200)}" fill="${col}" ${outline ? `stroke="${INK}" stroke-width="2"` : ''}/>`;
      if (R() < 0.35) b += `<rect x="${f(x + w * 0.35)}" y="${f(y - 14)}" width="${f(w * 0.3)}" height="16" fill="${col}"/>` + line(`M${f(x + w / 2)},${f(y - 14)}V${f(y - 34)}`, 1.5, col);
      for (let yy = y + 8; yy < base + 40; yy += 11)
        for (let xx = x + 5; xx < x + w - 6; xx += 9)
          if (R() < 0.45) b += `<rect x="${f(xx)}" y="${f(yy)}" width="4.5" height="6" fill="${wcol}" opacity="${wop}"/>`;
      out += b;
      x += w + R() * 4;
    }
  };
  row(o.base1 ?? 330, 120, 230, far, win, 0.35, false);
  row(o.base2 ?? 380, 70, 170, near, win, 0.7, true);
  return out;
}

// Toile d'araignée (centre, rayon)
export function web(c, r, col = '#fff', w = 1.6, op = 0.5, n = 12, a0 = 0) {
  let d = '';
  const spokes = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * 360;
    spokes.push(a);
    d += `M${P(c)}L${P(add(c, polar(r, a)))}`;
  }
  for (let k = 1; k <= 6; k++) {
    const rr = (r * k) / 6;
    for (let i = 0; i < n; i++) {
      const pa = add(c, polar(rr, spokes[i])), pb = add(c, polar(rr, spokes[(i + 1) % n]));
      const m = add(c, polar(rr * 0.86, spokes[i] + 180 / n));
      d += `M${P(pa)}Q${P(m)} ${P(pb)}`;
    }
  }
  return path(d, `fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}"`);
}

export function clouds(col = '#fff', y = 300, seed = 4, op = 1, scale = 1, outline = true) {
  const R = rng(seed);
  let out = '';
  let x = -40;
  while (x < 440) {
    const r = (30 + R() * 30) * scale;
    out += circle([x, y + R() * 30], r, `fill="${col}" ${outline ? `stroke="${INK}" stroke-width="2.5"` : ''}`);
    x += r * 1.1;
  }
  out += `<rect x="-10" y="${y + 10}" width="420" height="200" fill="${col}"/>`;
  return g(out, `opacity="${op}"`);
}

export function bolt(pts, col = '#fff7c2', w = 7, glow = '#9fd4ff') {
  const d = 'M' + pts.map(P).join('L');
  return path(d, `fill="none" stroke="${glow}" stroke-width="${w * 2.6}" stroke-linejoin="round" opacity="0.55" filter="url(#blur6)"`) +
    path(d, `fill="none" stroke="${INK}" stroke-width="${w + 3}" stroke-linejoin="round" stroke-linecap="round"`) +
    path(d, `fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`);
}
export function zig(a, b, n = 6, amp = 14, seed = 9) {
  const R = rng(seed);
  const pts = [a];
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const p = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
    const o = (R() - 0.5) * 2 * amp;
    pts.push([p[0] + Math.cos(ang) * o, p[1] + Math.sin(ang) * o]);
  }
  pts.push(b);
  return pts;
}

// Flammes (rangée de langues de feu)
export function flames(y = 400, h = 160, cols = ['#ff4b12', '#ff9a1f', '#ffe14d'], seed = 6, outline = true) {
  const R = rng(seed);
  let out = '';
  cols.forEach((col, li) => {
    const hh = h * (1 - li * 0.28);
    let pts = [[-20, 420]];
    let x = -20;
    while (x < 430) {
      const w = 22 + R() * 26;
      pts.push([x + w * 0.5, y - hh * (0.55 + R() * 0.45)]);
      pts.push([x + w, y - hh * 0.25 * R()]);
      x += w;
    }
    pts.push([430, 420]);
    out += path(smooth(pts, true, 1 / 5), `fill="${col}" ${outline && li === 0 ? `stroke="${INK}" stroke-width="2.5"` : ''}`);
  });
  return out;
}
// Une flamme isolée (pour cheveux / mains en feu)
export function flame(c, h, w, ang = 0, cols = ['#ff4b12', '#ff9a1f', '#ffe14d'], ink = true) {
  let out = '';
  cols.forEach((col, i) => {
    const k = 1 - i * 0.28;
    const H = h * k, W = w * k;
    const d = smooth([[0, 0], [W * 0.5, -H * 0.15], [W * 0.55, -H * 0.45], [W * 0.15, -H * 0.7], [W * 0.25, -H], [-W * 0.2, -H * 0.62], [-W * 0.5, -H * 0.35], [-W * 0.45, -H * 0.1]]);
    out += path(d, `fill="${col}" ${ink && i === 0 ? `stroke="${INK}" stroke-width="2.4"` : ''}`);
  });
  return g(out, `transform="translate(${f(c[0])} ${f(c[1])}) rotate(${f(ang)})"`);
}

// Cercles mystiques (Doctor Strange, Scarlet Witch…)
export function mandala(c, r, col = '#ffb43a', o = {}) {
  const w = o.w ?? 2.5;
  let out = '';
  out += circle(c, r, `fill="none" stroke="${col}" stroke-width="${w * 1.4}"`);
  out += circle(c, r * 0.86, `fill="none" stroke="${col}" stroke-width="${w * 0.7}"`);
  out += circle(c, r * 0.55, `fill="none" stroke="${col}" stroke-width="${w}"`);
  let d = '';
  const n = o.n || 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 + (o.a0 || 0);
    const p1 = add(c, polar(r * 0.86, a)), p2 = add(c, polar(r * 0.86, a + 360 / n * 3));
    d += `M${P(p1)}L${P(p2)}`;
    d += `M${P(add(c, polar(r * 0.55, a)))}L${P(add(c, polar(r * 0.86, a)))}`;
  }
  out += path(d, `fill="none" stroke="${col}" stroke-width="${w * 0.6}"`);
  // runes
  let rd = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * 360;
    const p = add(c, polar(r * 0.93, a));
    rd += `M${P(add(p, polar(r * 0.03, a + 90)))}L${P(add(p, polar(r * 0.03, a - 90)))}`;
  }
  out += path(rd, `stroke="${col}" stroke-width="${w * 0.8}"`);
  const glowC = o.glow ?? col;
  return g(out, `filter="url(#glow)" opacity="${o.op ?? 0.95}"`) + (o.ink ? '' : '') + (glowC ? '' : '');
}

// Hexagones du réseau HUD
export function hud(col = '#59e3ff', op = 0.35, seed = 2) {
  const R = rng(seed);
  let out = '';
  out += circle([200, 200], 150, `fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="12 6"`);
  out += circle([200, 200], 120, `fill="none" stroke="${col}" stroke-width="1"`);
  out += circle([200, 200], 175, `fill="none" stroke="${col}" stroke-width="4" stroke-dasharray="40 14 4 14"`);
  for (let i = 0; i < 14; i++) {
    const x = R() * 400, y = R() * 400;
    out += `<rect x="${f(x)}" y="${f(y)}" width="${f(10 + R() * 40)}" height="2" fill="${col}"/>`;
  }
  let gd = '';
  for (let x = 0; x <= 400; x += 25) gd += `M${x},0V400`;
  for (let y = 0; y <= 400; y += 25) gd += `M0,${y}H400`;
  out += path(gd, `stroke="${col}" stroke-width="0.6" opacity="0.5"`);
  return g(out, `opacity="${op}"`);
}

// Feuillage de jungle (silhouettes de feuilles)
export function leaves(cols = ['#0f3b2a', '#1b5c3b'], seed = 8, n = 14, yMin = 0) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = [R() * 400, yMin + R() * (400 - yMin)];
    const L = 60 + R() * 70, a = R() * 360;
    const col = cols[i % cols.length];
    const d = `M0,0Q${f(L * 0.5)},${f(-L * 0.28)} ${f(L)},0Q${f(L * 0.5)},${f(L * 0.28)} 0,0Z`;
    out += g(path(d, `fill="${col}" stroke="${INK}" stroke-width="2"`) + line(`M0,0L${f(L * 0.9)},0`, 1.5, mix(col, '#000', 0.4)), `transform="translate(${f(c[0])} ${f(c[1])}) rotate(${f(a)})"`);
  }
  return out;
}

// Débris / rochers
export function rocks(cols = ['#7b6a58', '#5a4c3f'], seed = 11, n = 9, y0 = 300) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = [R() * 400, y0 + R() * 100];
    const r = 14 + R() * 36;
    const pts = [];
    const k = 6 + Math.floor(R() * 3);
    for (let j = 0; j < k; j++) pts.push(add(c, polar(r * (0.7 + R() * 0.4), (j / k) * 360 + R() * 20)));
    const t = tone(cols[i % cols.length]);
    out += path(poly(pts), `fill="${t.base}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"`);
    out += path(poly([pts[0], pts[1], c]), `fill="${t.light}" opacity="0.6"`);
  }
  return out;
}
// Débris volants
export function debris(c, n = 10, col = '#8a7a66', seed = 12, rMin = 90, rMax = 180) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = R() * 360, rr = rMin + R() * (rMax - rMin);
    const p = add(c, polar(rr, a));
    const s = 4 + R() * 10;
    const pts = [0, 1, 2, 3, 4].map(j => add(p, polar(s * (0.6 + R() * 0.5), j * 72 + R() * 30)));
    out += path(poly(pts), `fill="${col}" stroke="${INK}" stroke-width="2"`);
  }
  return out;
}
// Fissures au sol
export function cracks(c, col = INK, n = 7, len = 160, seed = 13, w = 3) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = 180 + (i / (n - 1)) * 180 + (R() - 0.5) * 10;
    out += line('M' + zig(c, add(c, polar(len * (0.6 + R() * 0.5), a)), 5, 10, i + seed).map(P).join('L'), w, col);
  }
  return out;
}
// Grand « X » (X-Men)
export function xlogo(c, r, col = '#f7c843', op = 0.9, ring = '#1a2a6c') {
  const d = `M${f(c[0] - r * 0.62)},${f(c[1] - r * 0.62)}L${f(c[0] + r * 0.62)},${f(c[1] + r * 0.62)}M${f(c[0] + r * 0.62)},${f(c[1] - r * 0.62)}L${f(c[0] - r * 0.62)},${f(c[1] + r * 0.62)}`;
  return g(circle(c, r, `fill="${ring}" stroke="${INK}" stroke-width="4"`) +
    path(d, `stroke="${INK}" stroke-width="${f(r * 0.34)}" stroke-linecap="butt"`) +
    path(d, `stroke="${col}" stroke-width="${f(r * 0.25)}"`), `opacity="${op}"`);
}
// Champ d'énergie / aura
export function aura(c, r, col, op = 0.6) {
  return circle(c, r, `fill="${col}" opacity="${op}" filter="url(#blur14)"`);
}
export function energy(c, r, col = '#7fe6ff', core = '#ffffff') {
  return circle(c, r * 1.5, `fill="${col}" opacity="0.55" filter="url(#blur14)"`) +
    circle(c, r, `fill="${col}" opacity="0.9" filter="url(#glow)"`) + circle(c, r * 0.6, `fill="${core}"`);
}
// Rayon (laser, optique, répulseur)
export function beam(a, b, w, col, core = '#ffffff') {
  const d = `M${P(a)}L${P(b)}`;
  return path(d, `stroke="${col}" stroke-width="${w * 2.2}" stroke-linecap="round" opacity="0.5" filter="url(#blur6)"`) +
    path(d, `stroke="${col}" stroke-width="${w}" stroke-linecap="round"`) +
    path(d, `stroke="${core}" stroke-width="${w * 0.45}" stroke-linecap="round"`);
}
// Fil de toile
export function webLine(a, b, w = 3) {
  const d = `M${P(a)}L${P(b)}`;
  return path(d, `stroke="${INK}" stroke-width="${w + 2.5}" stroke-linecap="round"`) + path(d, `stroke="#f4f8ff" stroke-width="${w}" stroke-linecap="round"`);
}
// Bannière de drapeau (rayures)
export function stripes(cols, w = 40, ang = -20) {
  let out = '';
  for (let i = -6; i < 16; i++) out += `<rect x="${i * w}" y="-200" width="${w}" height="800" fill="${cols[((i % cols.length) + cols.length) % cols.length]}"/>`;
  return g(out, `transform="rotate(${ang} 200 200)"`);
}
export function starShape(c, r, ri = 0.42, n = 5, a0 = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) pts.push(add(c, polar(i % 2 ? r * ri : r, a0 + (i * 180) / n)));
  return poly(pts);
}

// Sapins en silhouette
export function pines(col = '#140a0a', seed = 14, n = 9, y0 = 330, hMin = 90, hMax = 170) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 440 - 20 + (R() - 0.5) * 20, h = hMin + R() * (hMax - hMin), w = h * 0.42;
    const y = y0 + R() * 40;
    const pts = [[x, y - h]];
    for (let k = 1; k <= 4; k++) pts.push([x + w * (k / 4) * 0.9, y - h + (h * k) / 4.4], [x + w * (k / 4) * 0.45, y - h + (h * k) / 4.4 - 4]);
    const right = pts.slice(1);
    const all = [pts[0], ...right, [x + w * 0.1, y + 200], [x - w * 0.1, y + 200], ...right.reverse().map(([px, py]) => [2 * x - px, py])];
    out += path(poly(all), `fill="${col}"`);
  }
  return out;
}

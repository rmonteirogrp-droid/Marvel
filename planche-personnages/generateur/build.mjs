// Génère les SVG + PNG de chaque personnage, une planche de contrôle et la planche finale.
// Usage : node build.mjs [id1,id2,...] [--sheet] [--final]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { icon } from './figure.js';
import { CHARS } from './characters.js';

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const OUT = path.resolve(process.argv.find(a => a.startsWith('--out='))?.slice(6) || '../icones-action');
const only = process.argv.slice(2).find(a => !a.startsWith('--'))?.split(',');
fs.mkdirSync(OUT, { recursive: true });

const list = CHARS.filter(c => !only || only.includes(c.id));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
for (const c of list) {
  const svg = icon(c);
  fs.writeFileSync(path.join(OUT, c.id + '.svg'), svg);
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="400" height="400"', 'width="512" height="512"')}</body></html>`);
  await page.locator('svg').screenshot({ path: path.join(OUT, c.id + '.png'), omitBackground: true });
}
console.log('icônes :', list.length);

if (process.argv.includes('--sheet')) {
  const cells = list.map(c => `<div class="c"><img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, c.id + '.png')).toString('base64')}"><span>${c.name}</span></div>`).join('');
  const p2 = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  await p2.setContent(`<html><body style="margin:0;background:#1a1626;font:600 15px sans-serif;color:#fff"><div style="display:flex;flex-wrap:wrap;gap:10px;padding:10px">${cells}</div>
  <style>.c{width:256px;text-align:center}.c img{width:256px;height:256px}</style></body></html>`);
  await p2.waitForTimeout(200);
  await p2.screenshot({ path: process.argv.find(a => a.startsWith('--sheetpath='))?.slice(12) || path.join(OUT, '_sheet.png'), fullPage: true });
}
await browser.close();

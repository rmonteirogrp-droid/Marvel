// Assemble la planche finale à partir des SVG générés par build.mjs.
// Usage : node planche.mjs  ->  ../planche-personnages-marvel-action.png
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { CHARS } from './characters.js';

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const ICONS = path.resolve('../icones-action');
const OUT = path.resolve('../planche-personnages-marvel-action.png');
const font = fs.readFileSync('bangers.ttf').toString('base64');
const GROUPS = [
  ['avengers', 'Avengers'],
  ['spider', 'Spider-Verse & rue'],
  ['cosmos', 'Gardiens & cosmos'],
  ['xmen', 'X-Men & mutants'],
  ['ff', 'Fantastiques & vilains'],
];
// Personnages retirés de la planche (rendu jugé raté)
const HIDDEN = new Set(['la-guepe', 'falcon', 'silver-surfer', 'nebula', 'la-torche']);
const svg64 = id => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(ICONS, id + '.svg')).toString('base64');
const sections = GROUPS.map(([g, title]) => {
  const cells = CHARS.filter(c => c.group === g && !HIDDEN.has(c.id)).map(c => `<figure><img src="${svg64(c.id)}"><figcaption>${c.name}</figcaption></figure>`).join('');
  return `<h2>${title}</h2><div class="grid">${cells}</div>`;
}).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Bangers;src:url(data:font/ttf;base64,${font})}
*{box-sizing:border-box}
body{margin:0;width:3400px;padding:70px 80px 90px;font-family:'DejaVu Sans',sans-serif;color:#fff;
 background:radial-gradient(circle at 50% 0%,#2a2350 0%,#120f22 55%,#0b0916 100%)}
body:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.07;
 background-image:radial-gradient(#fff 1.4px,transparent 1.6px);background-size:14px 14px}
h1{font-family:Bangers;font-size:150px;letter-spacing:6px;margin:0;line-height:1;color:#ffd23a;
 -webkit-text-stroke:5px #120d1a;text-shadow:8px 8px 0 #d62a2a,14px 14px 0 #120d1a}
.sub{font-size:34px;color:#c9c3e8;margin:18px 0 10px 4px}
h2{font-family:Bangers;font-size:72px;letter-spacing:4px;margin:60px 0 22px;color:#fff;
 -webkit-text-stroke:3px #120d1a;text-shadow:5px 5px 0 #d62a2a;border-bottom:4px solid #3a3360;padding-bottom:8px}
.grid{display:grid;grid-template-columns:repeat(10,1fr);gap:26px 22px}
figure{margin:0;text-align:center}
figure img{width:300px;height:300px;display:block;margin:0 auto;filter:drop-shadow(0 10px 14px rgba(0,0,0,.55))}
figcaption{font-family:Bangers;font-size:40px;letter-spacing:2px;margin-top:10px;color:#fff;-webkit-text-stroke:1.5px #120d1a}
</style></head><body><h1>Personnages Marvel</h1><div class="sub">46 héros et vilains · style comics · chacun dans sa pose et son décor</div>${sections}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 3400, height: 1000 } });
await page.setContent(html);
await page.waitForTimeout(500);
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log('planche :', OUT);

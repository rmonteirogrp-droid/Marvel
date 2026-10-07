// Icônes d'appli : un PNG 1024 × 1024 plein (non transparent) par personnage.
// Usage : node app-icons.mjs [id1,id2,...]  ->  ../icones-app/<id>.png
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { iconSquare } from './figure.js';
import { CHARS } from './characters.js';

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const OUT = path.resolve('../icones-app');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2]?.split(',');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
for (const c of CHARS.filter(c => !only || only.includes(c.id))) {
  await page.setContent(`<html><body style="margin:0">${iconSquare(c)}</body></html>`);
  await page.locator('svg').screenshot({ path: path.join(OUT, c.id + '.png'), omitBackground: false });
}
await browser.close();
console.log('icônes appli :', fs.readdirSync(OUT).length);

/**
 * render-pages.mjs — Render specific PDF pages as PNG images for inspection.
 * Uses Puppeteer + pdf.js (served locally) to render each page to a canvas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.resolve(__dirname, '..', 'building-microservices-fullstack.pdf');
const OUT_DIR = path.resolve(__dirname);

// Pages to render
const PAGES = [1, 2, 3];

const pdfData = fs.readFileSync(PDF_PATH);
const base64 = pdfData.toString('base64');

// We'll use the CDN version of pdf.js but load it properly via a served page
const viewerHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<canvas id="canvas"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const base64 = '${base64}';
const raw = atob(base64);
const uint8 = new Uint8Array(raw.length);
for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);

pdfjsLib.getDocument({ data: uint8 }).promise.then(pdf => {
  window._pdf = pdf;
  window._totalPages = pdf.numPages;
  window._ready = true;
  console.log('PDF loaded, pages:', pdf.numPages);
});

window.renderPage = async function(num) {
  const pg = await window._pdf.getPage(num);
  const viewport = pg.getViewport({ scale: 2.0 });
  const canvas = document.getElementById('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await pg.render({ canvasContext: ctx, viewport: viewport }).promise;
  return { width: viewport.width, height: viewport.height };
};
</script>
</body></html>`;

// Write a temp HTML file
const tempHtml = path.resolve(__dirname, '_viewer.html');
fs.writeFileSync(tempHtml, viewerHtml);

console.log('Launching Chrome...');
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
await page.goto('http://localhost:8765/book-gen/_viewer.html', {
  waitUntil: 'networkidle0',
  timeout: 30000,
});

// Wait for pdf.js to load the document
await page.waitForFunction(() => window._ready === true, { timeout: 30000 });

const totalPages = await page.evaluate(() => window._totalPages);
console.log(`PDF loaded: ${totalPages} pages`);

for (const pgNum of PAGES) {
  if (pgNum > totalPages) continue;

  await page.evaluate((num) => window.renderPage(num), pgNum);
  await new Promise(r => setTimeout(r, 300));

  const canvas = await page.$('#canvas');
  await canvas.screenshot({
    path: path.join(OUT_DIR, `render-p${pgNum}.png`),
    type: 'png',
  });
  console.log(`  Page ${pgNum} rendered`);
}

await browser.close();
fs.unlinkSync(tempHtml);
console.log('Done!');

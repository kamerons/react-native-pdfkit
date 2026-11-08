import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Jest cannot evaluate pdfjs-dist's ESM build (import.meta). This worker runs
// in plain Node so visual tests can rasterize with PDF.js 6.

const pdfPath = process.argv[2];
const outDir = process.argv[3];
const systemFonts = process.argv[4] === '1';

const data = new Uint8Array(readFileSync(pdfPath));
const pdfDocument = await getDocument({
  data,
  disableFontFace: !systemFonts,
}).promise;

mkdirSync(outDir, { recursive: true });
const images = [];

for (let i = 1; i <= pdfDocument.numPages; i++) {
  const page = await pdfDocument.getPage(i);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvasFactory = pdfDocument.canvasFactory;
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
  await page.render({
    canvasContext: canvasAndContext.context,
    viewport,
  }).promise;
  const imagePath = path.join(outDir, `${i}.png`);
  writeFileSync(imagePath, canvasAndContext.canvas.toBuffer('image/png'));
  images.push(imagePath);
  page.cleanup();
  if (typeof canvasFactory.destroy === 'function') {
    canvasFactory.destroy(canvasAndContext);
  }
}

process.stdout.write(JSON.stringify(images));

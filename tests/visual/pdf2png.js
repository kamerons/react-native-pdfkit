import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Adapted from https://github.com/mozilla/pdf.js/blob/v6.5.438/examples/node/pdf2png/pdf2png.mjs

const workerPath = path.join(__dirname, 'pdf2png-worker.mjs');

async function pdf2png(data, { systemFonts } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'pdfkit-pdf2png-'));
  const pdfPath = path.join(dir, 'input.pdf');
  const outDir = path.join(dir, 'pages');
  writeFileSync(pdfPath, Buffer.from(data));

  try {
    const result = spawnSync(
      process.execPath,
      [workerPath, pdfPath, outDir, systemFonts ? '1' : '0'],
      { encoding: 'utf8' },
    );
    if (result.status !== 0) {
      throw new Error(
        result.stderr || result.stdout || `pdf2png worker exited ${result.status}`,
      );
    }
    const imagePaths = JSON.parse(result.stdout);
    return imagePaths.map((imagePath) => readFileSync(imagePath));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export { pdf2png };

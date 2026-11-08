import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import stream from 'stream';
import { Buffer } from 'buffer';
import PDFDocument, { init } from '../../lib/document';
import { pdf2png } from './pdf2png.js';
import { getFontRegistry } from '../../lib/font/font_registry';

// pdfjs-dist 6 only supports Node 22.13+ and 24+. Older CI jobs still run unit tests.
function supportsPdfJs() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 13);
}

// Initialize adapters with Node.js implementations
init({ fs, zlib, stream, Buffer, TextEncoder, TextDecoder });

// Register common fonts used in visual tests
const fontsDir = path.join(__dirname, '../fonts');
const fontFiles = [
  'Roboto-Regular.ttf',
  'Roboto-Italic.ttf',
  'Roboto-Medium.ttf',
  'Roboto-MediumItalic.ttf',
];

const registry = getFontRegistry();
for (const fontFile of fontFiles) {
  const fontPath = path.join(fontsDir, fontFile);
  if (fs.existsSync(fontPath)) {
    const fontData = fs.readFileSync(fontPath);
    const fontName = `tests/fonts/${fontFile}`;
    registry.registerCustomFont(fontName, fontData);
  }
}

function runDocTest(options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  if (!options.info) {
    options.info = {};
  }

  if (!supportsPdfJs()) {
    console.warn(
      `Skipping visual snapshot render: pdfjs-dist 6 requires Node.js >= 22.13 (current ${process.version}).`,
    );
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(options);
    const buffers = [];

    (async () => {
      try {
        await fn(doc);
        doc.on('error', (err) => reject(err));
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
          try {
            const pdfData = Buffer.concat(buffers);
            const { systemFonts = false } = options;
            const images = await pdf2png(pdfData, { systemFonts });
            for (let image of images) {
              expect(image).toMatchImageSnapshot({
                failureThresholdType: 'percent',
                failureThreshold: 0.01,
              });
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        await doc.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

export { runDocTest };

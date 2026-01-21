import toContainChunk from './toContainChunk';
import toContainText from './toContainText';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import stream from 'stream';
import { Buffer } from 'buffer';
import { init } from '../../lib/document';
import { getFontRegistry } from '../../lib/font/font_registry';
import { getIccRegistry } from '../../lib/icc_registry';

// Initialize adapters with Node.js implementations
init({ fs, zlib, stream, Buffer, TextEncoder, TextDecoder });

// Ensure globalThis is available for pdfjs-dist webpack bundle
if (typeof globalThis === 'undefined') {
  global.globalThis = global;
}

expect.extend(toContainChunk);
expect.extend(toContainText);
expect.extend({ toMatchImageSnapshot });

// Register all standard fonts before tests run
// Register in a specific order so Helvetica is first (for backward compatibility with tests)
const fontsDir = path.join(__dirname, '../fonts');
const fontFiles = fs.readdirSync(fontsDir).filter((file) => file.endsWith('.afm'));

const fonts = {};
// Sort files to ensure consistent order, with Helvetica first
const sortedFiles = fontFiles.sort((a, b) => {
  // Put Helvetica first
  if (a.startsWith('Helvetica')) return -1;
  if (b.startsWith('Helvetica')) return 1;
  return a.localeCompare(b);
});

for (const file of sortedFiles) {
  const fontName = file.replace('.afm', '');
  const fontPath = path.join(fontsDir, file);
  fonts[fontName] = fs.readFileSync(fontPath, 'utf8');
}

getFontRegistry().registerStandardFonts(fonts);

// Register ICC profile for PDFA tests
const iccProfilePath = path.join(__dirname, '../data/sRGB_IEC61966_2_1.icc');
const iccProfile = fs.readFileSync(iccProfilePath);
getIccRegistry().registerICCProfile(iccProfile);

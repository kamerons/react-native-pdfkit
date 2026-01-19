import toContainChunk from './toContainChunk';
import toContainText from './toContainText';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import fs from 'fs';
import path from 'path';
import { getFontRegistry } from '../../lib/font/font_registry';

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

import fs from 'fs';
import path from 'path';
import PDFDocument from '../../lib/document';
import { logData, joinTokens } from './helpers';

const robotoFontPath = path.join(__dirname, '../fonts/Roboto-Regular.ttf');
const robotoFontData = fs.readFileSync(robotoFontPath);

describe('PDF/A-3', () => {
  test('metadata is present', async () => {
    let options = {
      autoFirstPage: false,
      pdfVersion: '1.7',
      subset: 'PDF/A-3',
    };
    let doc = new PDFDocument(options);
    const data = logData(doc);
    await doc.end();
    expect(data).toContainChunk([
      `11 0 obj`,
      `<<\n/length 892\n/Type /Metadata\n/Subtype /XML\n/Length 894\n>>`,
    ]);
  });

  test('color profile is present', async () => {
    const expected = [
      `10 0 obj`,
      joinTokens(
        '<<',
        '/Type /OutputIntent',
        '/S /GTS_PDFA1',
        '/Info (sRGB IEC61966-2.1)',
        '/OutputConditionIdentifier (sRGB IEC61966-2.1)',
        '/DestOutputProfile 9 0 R',
        '>>',
      ),
    ];
    let options = {
      autoFirstPage: false,
      pdfVersion: '1.7',
      subset: 'PDF/A-3',
    };
    let doc = new PDFDocument(options);
    const data = logData(doc);
    await doc.end();
    expect(data).toContainChunk(expected);
  });

  test('metadata contains pdfaid part and conformance', async () => {
    let options = {
      autoFirstPage: false,
      pdfVersion: '1.7',
      subset: 'PDF/A-3',
    };
    let doc = new PDFDocument(options);
    const data = logData(doc);
    await doc.end();
    let metadata = Buffer.from(data[27]).toString();

    expect(metadata).toContain('pdfaid:part>3');
    expect(metadata).toContain('pdfaid:conformance');
  });

  test('metadata pdfaid conformance B', async () => {
    let options = {
      autoFirstPage: false,
      pdfVersion: '1.7',
      subset: 'PDF/A-3b',
    };
    let doc = new PDFDocument(options);
    const data = logData(doc);
    await doc.end();
    let metadata = Buffer.from(data[27]).toString();

    expect(metadata).toContain('pdfaid:conformance>B');
  });

  test('metadata pdfaid conformance A', async () => {
    let options = {
      autoFirstPage: false,
      pdfVersion: '1.7',
      subset: 'PDF/A-3a',
    };
    let doc = new PDFDocument(options);
    const data = logData(doc);
    await doc.end();
    let metadata = Buffer.from(data[27]).toString();

    expect(metadata).toContain('pdfaid:conformance>A');
  });

  test('font data NOT contains CIDSet', async () => {
    let options = {
      autoFirstPage: false,
      pdfVersion: '1.4',
      subset: 'PDF/A-3a',
    };
    let doc = new PDFDocument(options);
    const data = logData(doc);
    doc.addPage();
    doc.registerFont('Roboto', robotoFontData);
    doc.font('Roboto');
    doc.text('Text');
    await doc.end();

    let fontDescriptor = data.find((v) => {
      return v.includes('/Type /FontDescriptor');
    });

    expect(fontDescriptor).not.toBeUndefined();

    expect(fontDescriptor).not.toContain('/CIDSet');
  });
});

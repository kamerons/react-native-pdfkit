import fs from 'fs';
import path from 'path';
import { fromBuffer, parse, parseSync } from '../../../../lib/vendor/jpeg-exif/index.js';

const testImagesDir = path.join(__dirname, 'test-images');
const IMG_0001 = path.join(testImagesDir, 'IMG_0001.JPG');
const IMG_0003 = path.join(testImagesDir, 'IMG_0003.JPG');
const ArbitroTiff = path.join(testImagesDir, 'Arbitro.tiff');

describe('.parse()', () => {
  test('file {undefined}', (done) => {
    parse(undefined, (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  test('file {null}', (done) => {
    parse(null, (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  test('APP1:#0xffe1', (done) => {
    parse(IMG_0001, (err, data) => {
      expect(err).toBeUndefined();
      expect(data).toBeInstanceOf(Object);
      done();
    });
  });

  test('APP0:#0xffe0', (done) => {
    parse(IMG_0003, (err, data) => {
      expect(err).toBeUndefined();
      // IMG_0003 actually has EXIF data, so data should be an object
      expect(data).toBeInstanceOf(Object);
      done();
    });
  });

  test('!(APP1:#0xffe1||APP0:#0xffe0)', (done) => {
    parse(__filename, (err, data) => {
      // Non-image file should error
      expect(err).toBeInstanceOf(Error);
      expect(data).toBeUndefined();
      done();
    });
  });

  test('[SubExif]', (done) => {
    parse(IMG_0001, (err, data) => {
      expect(err).toBeUndefined();
      expect(data.SubExif).toBeInstanceOf(Object);
      done();
    });
  });

  test('[GPSInfo]', (done) => {
    parse(IMG_0001, (err, data) => {
      expect(err).toBeUndefined();
      expect(data.GPSInfo).toBeInstanceOf(Object);
      done();
    });
  });
});

describe('.parseSync()', () => {
  test('file {undefined}', () => {
    expect(() => parseSync(undefined)).toThrow(Error);
  });

  test('file {null}', () => {
    expect(() => parseSync(null)).toThrow(Error);
  });

  test('APP1:#0xffe1', () => {
    const data = parseSync(IMG_0001);
    expect(data).toBeInstanceOf(Object);
  });

  test('!APP1:#0xffe1', () => {
    const data = parseSync(IMG_0003);
    expect(data).toBeInstanceOf(Object);
  });

  test('[SubExif]', () => {
    const data = parseSync(IMG_0001);
    expect(data.SubExif).toBeInstanceOf(Object);
  });

  test('[GPSInfo]', () => {
    const data = parseSync(IMG_0001);
    expect(data.GPSInfo).toBeInstanceOf(Object);
  });

  test('TIFF', () => {
    const data = parseSync(ArbitroTiff);

    expect(data).toEqual({
      ImageWidth: 174,
      ImageHeight: 38,
      BitsPerSample: 8,
      Compression: 5,
      PhotometricInterpretation: 2,
      StripOffsets: 8,
      Orientation: 1,
      SamplesPerPixel: 4,
      RowsPerStrip: 38,
      StripByteCounts: 6391,
      PlanarConfiguration: 1,
    });
  });
});

describe('.fromBuffer()', () => {
  test('file {undefined}', () => {
    expect(() => fromBuffer(undefined)).toThrow(Error);
  });

  test('APP1:#0xffe1', () => {
    const buffer = fs.readFileSync(IMG_0001);
    const data = fromBuffer(buffer);

    expect(data).toBeInstanceOf(Object);
  });

  test('!APP1:#0xffe1', () => {
    const buffer = fs.readFileSync(IMG_0003);
    const data = fromBuffer(buffer);

    expect(data).toBeInstanceOf(Object);
  });

  test('[SubExif]', () => {
    const buffer = fs.readFileSync(IMG_0001);
    const data = fromBuffer(buffer);

    expect(data.SubExif).toBeInstanceOf(Object);
  });

  test('[GPSInfo]', () => {
    const buffer = fs.readFileSync(IMG_0001);
    const data = fromBuffer(buffer);

    expect(data.GPSInfo).toBeInstanceOf(Object);
  });
});

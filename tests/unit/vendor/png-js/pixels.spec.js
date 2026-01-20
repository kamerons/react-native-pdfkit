import PNGNode from '../../../../lib/vendor/png-js/png-node.js';
import fs from 'fs';
import path from 'path';

const testImagesDir = path.join(__dirname, 'test-images');
const files = fs.readdirSync(testImagesDir);

async function getPixels(fileName) {
  const image = new PNGNode(fs.readFileSync(path.join(testImagesDir, fileName)));
  return new Promise(resolve => {
    image.decodePixels(resolve);
  });
}

describe('pixels', () => {
  test.each(files)('%s', async fileName => {
    const pixels = await getPixels(fileName);
    expect(pixels).toMatchSnapshot();
  });
});

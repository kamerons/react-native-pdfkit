import PNGNode from '../../../../lib/vendor/png-js/png-node.js';
import fs from 'fs';
import path from 'path';

const testImagesDir = path.join(__dirname, 'test-images');
const files = fs.readdirSync(testImagesDir);

function getImgData(fileName) {
  const image = new PNGNode(fs.readFileSync(path.join(testImagesDir, fileName)));
  return image.imgData;
}

describe('imgData', () => {
  test.each(files)('%s', fileName => {
    expect(getImgData(fileName)).toMatchSnapshot();
  });
});

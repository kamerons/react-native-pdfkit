import PNGNode from '../../../../lib/vendor/png-js/png-node.js';
import fs from 'fs';
import path from 'path';

const testImagesDir = path.join(__dirname, 'test-images');
const files = fs.readdirSync(testImagesDir);

function getMetaData(fileName) {
  const image = new PNGNode(fs.readFileSync(path.join(testImagesDir, fileName)));
  const { imgData, data, ...metadata } = image;
  return metadata;
}

describe('metadata', () => {
  test.each(files)('%s', fileName => {
    expect(getMetaData(fileName)).toMatchSnapshot();
  });
});

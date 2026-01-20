import { getZlib, getBuffer } from '../adapters';
import PNG from 'png-js';

class PNGImage {
  constructor(data, label) {
    this.label = label;
    this.image = new PNG(data);
    this.width = this.image.width;
    this.height = this.image.height;
    this.imgData = this.image.imgData;
    this.obj = null;
  }

  async embed(document) {
    let dataDecoded = false;

    this.document = document;
    if (this.obj) {
      return;
    }

    const hasAlphaChannel = this.image.hasAlphaChannel;
    const isInterlaced = this.image.interlaceMethod === 1;

    this.obj = this.document.ref({
      Type: 'XObject',
      Subtype: 'Image',
      BitsPerComponent: hasAlphaChannel ? 8 : this.image.bits,
      Width: this.width,
      Height: this.height,
      Filter: 'FlateDecode',
    });

    if (!hasAlphaChannel) {
      const params = this.document.ref({
        Predictor: isInterlaced ? 1 : 15,
        Colors: this.image.colors,
        BitsPerComponent: this.image.bits,
        Columns: this.width,
      });

      this.obj.data['DecodeParms'] = params;
      await params.end();
    }

    if (this.image.palette.length === 0) {
      this.obj.data['ColorSpace'] = this.image.colorSpace;
    } else {
      // embed the color palette in the PDF as an object stream
      const Buffer = getBuffer();
      const palette = this.document.ref();
      await palette.end(Buffer.from(this.image.palette));

      // build the color space array for the image
      this.obj.data['ColorSpace'] = [
        'Indexed',
        'DeviceRGB',
        this.image.palette.length / 3 - 1,
        palette,
      ];
    }

    // For PNG color types 0, 2 and 3, the transparency data is stored in
    // a dedicated PNG chunk.
    if (this.image.transparency.grayscale != null) {
      // Use Color Key Masking (spec section 4.8.5)
      // An array with N elements, where N is two times the number of color components.
      const val = this.image.transparency.grayscale;
      this.obj.data['Mask'] = [val, val];
    } else if (this.image.transparency.rgb) {
      // Use Color Key Masking (spec section 4.8.5)
      // An array with N elements, where N is two times the number of color components.
      const { rgb } = this.image.transparency;
      const mask = [];
      for (let x of rgb) {
        mask.push(x, x);
      }

      this.obj.data['Mask'] = mask;
    } else if (this.image.transparency.indexed) {
      // Create a transparency SMask for the image based on the data
      // in the PLTE and tRNS sections. See below for details on SMasks.
      dataDecoded = true;
      return await this.loadIndexedAlphaChannel();
    } else if (hasAlphaChannel) {
      // For PNG color types 4 and 6, the transparency data is stored as a alpha
      // channel mixed in with the main image data. Separate this data out into an
      // SMask object and store it separately in the PDF.
      dataDecoded = true;
      return await this.splitAlphaChannel();
    }

    if (isInterlaced && !dataDecoded) {
      return await this.decodeData();
    }

    await this.finalize();
  }

  async finalize() {
    if (this.alphaChannel) {
      const sMask = this.document.ref({
        Type: 'XObject',
        Subtype: 'Image',
        Height: this.height,
        Width: this.width,
        BitsPerComponent: 8,
        Filter: 'FlateDecode',
        ColorSpace: 'DeviceGray',
        Decode: [0, 1],
      });

      await sMask.end(this.alphaChannel);
      this.obj.data['SMask'] = sMask;
    }

    // add the actual image data
    await this.obj.end(this.imgData);

    // free memory
    this.image = null;
    return (this.imgData = null);
  }

  async splitAlphaChannel() {
    return new Promise((resolve, reject) => {
      this.image.decodePixels((pixels) => {
        // Wrap async operations in an immediately invoked async function
        // and await it to ensure the outer Promise only resolves after completion
        (async () => {
          try {
            const Buffer = getBuffer();
            const zlib = getZlib();
            let a, p;
            const colorCount = this.image.colors;
            const pixelCount = this.width * this.height;
            const imgData = Buffer.alloc(pixelCount * colorCount);
            const alphaChannel = Buffer.alloc(pixelCount);

            let i = (p = a = 0);
            const len = pixels.length;
            // For 16bit images copy only most significant byte (MSB) - PNG data is always stored in network byte order (MSB first)
            const skipByteCount = this.image.bits === 16 ? 1 : 0;
            while (i < len) {
              for (let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
                imgData[p++] = pixels[i++];
                i += skipByteCount;
              }
              alphaChannel[a++] = pixels[i++];
              i += skipByteCount;
            }

            this.imgData = await new Promise((resolve, reject) => {
              zlib.deflate(imgData, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            this.alphaChannel = await new Promise((resolve, reject) => {
              zlib.deflate(alphaChannel, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            await this.finalize();
            resolve();
          } catch (err) {
            reject(err);
          }
        })().catch(reject);
      });
    });
  }

  async loadIndexedAlphaChannel() {
    const transparency = this.image.transparency.indexed;
    return new Promise((resolve, reject) => {
      this.image.decodePixels((pixels) => {
        // Wrap async operations in an immediately invoked async function
        // and await it to ensure the outer Promise only resolves after completion
        (async () => {
          try {
            const Buffer = getBuffer();
            const zlib = getZlib();
            const alphaChannel = Buffer.alloc(this.width * this.height);

            let i = 0;
            for (let j = 0, end = pixels.length; j < end; j++) {
              alphaChannel[i++] = transparency[pixels[j]];
            }

            this.alphaChannel = await new Promise((resolve, reject) => {
              zlib.deflate(alphaChannel, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            await this.finalize();
            resolve();
          } catch (err) {
            reject(err);
          }
        })().catch(reject);
      });
    });
  }

  async decodeData() {
    return new Promise((resolve, reject) => {
      this.image.decodePixels((pixels) => {
        // Wrap async operations in an immediately invoked async function
        // and await it to ensure the outer Promise only resolves after completion
        (async () => {
          try {
            const zlib = getZlib();
            this.imgData = await new Promise((resolve, reject) => {
              zlib.deflate(pixels, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            await this.finalize();
            resolve();
          } catch (err) {
            reject(err);
          }
        })().catch(reject);
      });
    });
  }
}

export default PNGImage;

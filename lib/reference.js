/*
PDFReference - represents a reference to another object in the PDF object heirarchy
By Devon Govett
*/

import { getZlib, getBuffer } from './adapters';
import PDFAbstractReference from './abstract_reference';
import PDFObject from './object';

class PDFReference extends PDFAbstractReference {
  constructor(document, id, data = {}) {
    super();
    this.document = document;
    this.id = id;
    this.data = data;
    this.gen = 0;
    this.compress = this.document.compress && !this.data.Filter;
    this.uncompressedLength = 0;
    this.buffer = [];
    this._finalized = false;
  }

  write(chunk) {
    if (this._finalized) {
      throw new Error('Cannot write to a finalized reference');
    }

    if (!(chunk instanceof Uint8Array)) {
      const Buffer = getBuffer();
      chunk = Buffer.from(chunk + '\n', 'binary');
    }

    this.uncompressedLength += chunk.length;
    if (this.data.Length == null) {
      this.data.Length = 0;
    }
    this.buffer.push(chunk);
    this.data.Length += chunk.length;
    if (this.compress) {
      this.data.Filter = 'FlateDecode';
    }
  }

  async end(chunk) {
    if (this._finalized) {
      return; // Already finalized, do nothing
    }
    if (chunk) {
      this.write(chunk);
    }
    await this.finalize();
  }

  async finalize() {
    if (this._finalized) {
      return; // Already finalized, do nothing
    }
    this._finalized = true; // Set flag early to prevent writes

    const encryptFn = this.document._security
      ? this.document._security.getEncryptFn(this.id, this.gen)
      : null;

    if (this.buffer.length) {
      const Buffer = getBuffer();
      const zlib = getZlib();
      this.buffer = Buffer.concat(this.buffer);
      if (this.compress) {
        this.buffer = await new Promise((resolve, reject) => {
          zlib.deflate(this.buffer, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      }

      if (encryptFn) {
        this.buffer = encryptFn(this.buffer);
      }

      this.data.Length = this.buffer.length;
    }

    // Capture offset AFTER all async operations complete, right before writing
    // This ensures the offset reflects the actual position where the object will be written
    this.offset = this.document._offset;
    this.document._write(`${this.id} ${this.gen} obj`);
    this.document._write(PDFObject.convert(this.data, encryptFn));

    if (this.buffer.length) {
      this.document._write('stream');
      this.document._write(this.buffer);

      this.buffer = []; // free up memory
      this.document._write('\nendstream');
    }

    this.document._write('endobj');
    this.document._refEnd(this);
  }
  toString() {
    return `${this.id} ${this.gen} R`;
  }
}

export default PDFReference;

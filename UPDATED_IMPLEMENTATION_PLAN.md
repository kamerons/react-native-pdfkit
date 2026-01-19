# PDFKit React Native Implementation Plan

## Overview

This document outlines the implementation plan for making PDFKit compatible with React Native through dependency injection and async-first architecture. This approach eliminates the need for patches, busy-wait patterns, and React Native-specific dependencies in the PDFKit repository.

## Problem Statement

PDFKit is a Node.js library that relies on:

1. **Node.js `fs` module** - for reading font files and ICC profiles from the filesystem
2. **Node.js `zlib` module** - for compressing PDF streams
3. **Node.js `stream` module** - for handling data streams
4. **`__dirname` global** - for constructing paths to font files
5. **`Buffer` global** - for binary data handling

React Native does not provide these Node.js APIs, requiring adapters and polyfills.

## Solution: Dependency Injection with Async-First Architecture

Instead of patching the library or adding React Native dependencies, we will:

1. **Create an adapter system** - Central registry for fs, zlib, stream, and Buffer
2. **Require initialization** - Caller must call `init()` before using PDFKit
3. **Remove font files** - Caller provides font data as strings at initialization
4. **Convert to async** - Make operations async to work naturally with React Native
5. **Eliminate `__dirname`** - No longer needed since fonts are provided directly

## Implementation Details

### 1. Adapter System (`lib/adapters.js`)

Create a central adapter registry that stores injected dependencies:

```javascript
// lib/adapters.js
let fsAdapter = null;
let zlibAdapter = null;
let streamAdapter = null;
let BufferAdapter = null;

export function init({ fs, zlib, stream, Buffer }) {
  if (fs) fsAdapter = fs;
  if (zlib) zlibAdapter = zlib;
  if (stream) streamAdapter = stream;
  if (Buffer) BufferAdapter = Buffer;
}

export function getFS() {
  if (!fsAdapter) {
    fsAdapter = require('fs');
  }
  return fsAdapter;
}

export function getZlib() {
  if (!zlibAdapter) {
    zlibAdapter = require('zlib');
  }
  return zlibAdapter;
}

export function getStream() {
  if (!streamAdapter) {
    streamAdapter = require('stream');
  }
  return streamAdapter;
}

export function getBuffer() {
  if (!BufferAdapter) {
    BufferAdapter = typeof Buffer !== 'undefined' ? Buffer : require('buffer').Buffer;
  }
  return BufferAdapter;
}
```

**Key Features:**
- Defaults to Node.js modules if not initialized (backward compatibility)
- Allows callers to inject React Native-compatible implementations
- No React Native dependencies in this repo

### 2. Font Registry System (`lib/font/font_registry.js`)

Create a registry for caller-provided font data:

```javascript
// lib/font/font_registry.js
class FontRegistry {
  constructor() {
    this.standardFonts = {};
    this.iccProfile = null;
  }

  registerStandardFont(name, afmData) {
    this.standardFonts[name] = afmData;
  }

  registerStandardFonts(fonts) {
    Object.assign(this.standardFonts, fonts);
  }

  getStandardFont(name) {
    return this.standardFonts[name];
  }

  hasStandardFont(name) {
    return name in this.standardFonts;
  }

  registerICCProfile(iccData) {
    this.iccProfile = iccData;
  }

  getICCProfile() {
    return this.iccProfile;
  }
}

let registry = new FontRegistry();

export function getFontRegistry() {
  return registry;
}

export function resetFontRegistry() {
  registry = new FontRegistry();
}
```

**Standard Fonts Required:**
- Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique
- Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique
- Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic
- Symbol, ZapfDingbats

### 3. Update Font Loading (`lib/font/standard.js`)

Remove filesystem dependency and use font registry:

```javascript
// lib/font/standard.js
import AFMFont from './afm';
import PDFFont from '../font';
import { getFontRegistry } from './font_registry';

class StandardFont extends PDFFont {
  constructor(document, name, id) {
    super();
    this.document = document;
    this.name = name;
    this.id = id;

    // Get font data from registry instead of filesystem
    const fontData = getFontRegistry().getStandardFont(name);
    if (!fontData) {
      throw new Error(
        `Standard font '${name}' not registered. ` +
        `Use PDFKit.init() to register fonts before creating documents.`
      );
    }

    this.font = new AFMFont(fontData);
    // ... rest of constructor unchanged
  }

  static isStandardFont(name) {
    return getFontRegistry().hasStandardFont(name);
  }
}
```

### 4. Update Font Factory (`lib/font_factory.js`)

Remove filesystem dependency for standard fonts, keep it for custom fonts (optional):

```javascript
// lib/font_factory.js
import * as fontkit from 'fontkit';
import StandardFont from './font/standard';
import EmbeddedFont from './font/embedded';
import { getFS } from '../adapters';

class PDFFontFactory {
  static open(document, src, family, id) {
    let font;
    if (typeof src === 'string') {
      if (StandardFont.isStandardFont(src)) {
        return new StandardFont(document, src, id);
      }
      // For custom fonts, caller should pass Buffer/Uint8Array directly
      // If string is passed, it's treated as a file path (requires fs adapter)
      const fs = getFS();
      src = fs.readFileSync(src);
    }
    if (src instanceof Uint8Array) {
      font = fontkit.create(src, family);
    } else if (src instanceof ArrayBuffer) {
      font = fontkit.create(new Uint8Array(src), family);
    }

    if (font == null) {
      throw new Error('Not a supported font format or standard PDF font.');
    }

    return new EmbeddedFont(document, font, id);
  }
}
```

### 5. Make Operations Async

**A. Update `lib/reference.js` - Make finalize async:**

```javascript
// lib/reference.js
import { getZlib, getBuffer } from './adapters';
import PDFAbstractReference from './abstract_reference';
import PDFObject from './object';

class PDFReference extends PDFAbstractReference {
  // ... constructor unchanged

  async finalize() {
    const Buffer = getBuffer();
    this.offset = this.document._offset;

    const encryptFn = this.document._security
      ? this.document._security.getEncryptFn(this.id, this.gen)
      : null;

    if (this.buffer.length) {
      this.buffer = Buffer.concat(this.buffer);
      if (this.compress) {
        const zlib = getZlib();
        // Use async deflate
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
}
```

**B. Update all callers of `finalize()`** - Make them await the async call

**C. Update `lib/document.js`** - Make `end()` and related methods async

### 6. Replace All Direct Imports

**Files to update:**

1. **`lib/document.js`**
   - Replace `import stream from 'stream'` with `import { getStream } from './adapters'`
   - Use `const stream = getStream()` in class definition

2. **`lib/reference.js`**
   - Replace `import zlib from 'zlib'` with `import { getZlib, getBuffer } from './adapters'`
   - Replace all `Buffer.*` calls with adapter versions

3. **`lib/image/png.js`**
   - Replace `import zlib from 'zlib'` with adapter
   - Replace `Buffer` usage with adapter

4. **`lib/image.js`**
   - Replace `import fs from 'fs'` with adapter
   - Replace `Buffer` usage with adapter

5. **`lib/mixins/pdfa.js`**
   - Replace `import fs from 'fs'` with adapter
   - Replace `__dirname` usage - get ICC from font registry instead

6. **`lib/mixins/attachments.js`**
   - Replace `import fs from 'fs'` with adapter
   - Replace `Buffer` usage with adapter

7. **`lib/virtual-fs.js`**
   - Remove `__dirname` usage (line 39-40)

8. **All other files using `Buffer`:**
   - `lib/object.js`
   - `lib/security.js`
   - `lib/mixins/metadata.js`
   - `lib/font/embedded.js`
   - Replace all `Buffer.*` calls with adapter versions

### 7. Update Main Entry Point

Create or update the main entry point to export `init()`:

```javascript
// lib/index.js (or update existing entry)
import PDFDocument from './document';
import { init as initAdapters } from './adapters';
import { getFontRegistry } from './font/font_registry';

export default PDFDocument;

export function init({ fs, zlib, stream, Buffer, fonts, iccProfile }) {
  // Initialize adapters
  initAdapters({ fs, zlib, stream, Buffer });

  // Register fonts if provided
  if (fonts) {
    const registry = getFontRegistry();
    registry.registerStandardFonts(fonts);
  }

  // Register ICC profile if provided
  if (iccProfile) {
    const registry = getFontRegistry();
    registry.registerICCProfile(iccProfile);
  }
}
```

### 8. Remove Font Files

- Delete `lib/font/data/*.afm` files (14 files)
- Delete or document removal of `lib/mixins/data/sRGB_IEC61966_2_1.icc`
- Update build scripts to not copy font files

### 9. Update Build Configuration

**Update `rollup.config.js`:**

```javascript
// Remove font file copying
copy({
  targets: [
    // Font files removed - caller provides them
    // { src: ['lib/font/data/*.afm', 'lib/mixins/data/*.icc'], dest: 'js/data' },
  ],
})
```

## Usage Example

### React Native Project Setup

```javascript
// In React Native project
import PDFKit, { init } from 'pdfkit';
import * as RNFS from 'react-native-fs';
import * as RNZlib from '@klarna/react-native-zlib';
import { Buffer } from 'buffer';
import stream from 'readable-stream';

// Load fonts (caller's responsibility - can be from modules, assets, or network)
import CourierAFM from './fonts/Courier.afm';
import CourierBoldAFM from './fonts/Courier-Bold.afm';
import CourierObliqueAFM from './fonts/Courier-Oblique.afm';
import CourierBoldObliqueAFM from './fonts/Courier-BoldOblique.afm';
import HelveticaAFM from './fonts/Helvetica.afm';
import HelveticaBoldAFM from './fonts/Helvetica-Bold.afm';
import HelveticaObliqueAFM from './fonts/Helvetica-Oblique.afm';
import HelveticaBoldObliqueAFM from './fonts/Helvetica-BoldOblique.afm';
import TimesRomanAFM from './fonts/Times-Roman.afm';
import TimesBoldAFM from './fonts/Times-Bold.afm';
import TimesItalicAFM from './fonts/Times-Italic.afm';
import TimesBoldItalicAFM from './fonts/Times-BoldItalic.afm';
import SymbolAFM from './fonts/Symbol.afm';
import ZapfDingbatsAFM from './fonts/ZapfDingbats.afm';
import sRGB_ICC from './profiles/sRGB_IEC61966_2_1.icc';

// Create adapters (caller's responsibility)
function createFSAdapter(rnfs) {
  return {
    readFileSync: (path) => {
      // Implement sync wrapper or use async with proper handling
      // This is caller's responsibility
    },
    statSync: (path) => {
      // Implement sync wrapper
    },
    // ... other fs methods as needed
  };
}

function createZlibAdapter(rnzlib) {
  return {
    deflate: (data, callback) => {
      // Convert Buffer to format expected by react-native-zlib
      // Call rnzlib and convert back
      // This is caller's responsibility
    },
    // ... other zlib methods as needed
  };
}

// Initialize PDFKit
init({
  fs: createFSAdapter(RNFS),
  zlib: createZlibAdapter(RNZlib),
  stream: stream,
  Buffer: Buffer,
  fonts: {
    'Courier': CourierAFM,
    'Courier-Bold': CourierBoldAFM,
    'Courier-Oblique': CourierObliqueAFM,
    'Courier-BoldOblique': CourierBoldObliqueAFM,
    'Helvetica': HelveticaAFM,
    'Helvetica-Bold': HelveticaBoldAFM,
    'Helvetica-Oblique': HelveticaObliqueAFM,
    'Helvetica-BoldOblique': HelveticaBoldObliqueAFM,
    'Times-Roman': TimesRomanAFM,
    'Times-Bold': TimesBoldAFM,
    'Times-Italic': TimesItalicAFM,
    'Times-BoldItalic': TimesBoldItalicAFM,
    'Symbol': SymbolAFM,
    'ZapfDingbats': ZapfDingbatsAFM,
  },
  iccProfile: sRGB_ICC,
});

// Now use PDFKit
async function generatePDF() {
  const doc = new PDFDocument();
  doc.pipe(/* your output stream */);

  doc.font('Helvetica')
     .fontSize(25)
     .text('Hello World', 100, 100);

  await doc.end();
}
```

### Node.js Usage (Backward Compatible)

```javascript
// In Node.js - no init needed, uses defaults
const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('output.pdf'));

doc.font('Helvetica')
   .fontSize(25)
   .text('Hello World', 100, 100);

await doc.end();
```

## Files to Create

1. `lib/adapters.js` - Adapter registry system
2. `lib/font/font_registry.js` - Font data registry

## Files to Modify

1. `lib/document.js` - Use stream adapter, make end() async
2. `lib/reference.js` - Use zlib/Buffer adapters, make finalize() async
3. `lib/font/standard.js` - Use font registry instead of fs
4. `lib/font_factory.js` - Use fs adapter for custom fonts only
5. `lib/image/png.js` - Use zlib/Buffer adapters
6. `lib/image.js` - Use fs/Buffer adapters
7. `lib/mixins/pdfa.js` - Use fs adapter, get ICC from registry
8. `lib/mixins/attachments.js` - Use fs/Buffer adapters
9. `lib/virtual-fs.js` - Remove __dirname usage
10. `lib/object.js` - Use Buffer adapter
11. `lib/security.js` - Use Buffer adapter
12. `lib/mixins/metadata.js` - Use Buffer adapter
13. `lib/font/embedded.js` - Use Buffer adapter
14. Main entry point - Export init() function
15. `rollup.config.js` - Remove font file copying

## Files to Delete

1. `lib/font/data/*.afm` - All 14 font files
2. `lib/mixins/data/sRGB_IEC61966_2_1.icc` - ICC profile (optional, caller provides)

## Benefits of This Approach

1. **No React Native Dependencies** - Repository remains pure Node.js
2. **No Patches Required** - Clean implementation in the main codebase
3. **No Busy-Wait Patterns** - Proper async/await throughout
4. **No `__dirname` Dependency** - Fonts provided directly by caller
5. **Backward Compatible** - Node.js usage unchanged (defaults to Node modules)
6. **Flexible** - Callers can use any fs/zlib/stream/Buffer implementation
7. **Maintainable** - Single codebase for both Node.js and React Native
8. **Testable** - Easy to test with mock adapters

## Migration Checklist

- [ ] Create `lib/adapters.js`
- [ ] Create `lib/font/font_registry.js`
- [ ] Update `lib/font/standard.js` to use registry
- [ ] Update `lib/font_factory.js` to use adapters
- [ ] Update `lib/reference.js` to use adapters and make async
- [ ] Update `lib/document.js` to use stream adapter and make async
- [ ] Update all files using `fs` to use adapter
- [ ] Update all files using `zlib` to use adapter
- [ ] Update all files using `Buffer` to use adapter
- [ ] Update `lib/virtual-fs.js` to remove `__dirname`
- [ ] Update `lib/mixins/pdfa.js` to use ICC from registry
- [ ] Update main entry point to export `init()`
- [ ] Update `rollup.config.js` to remove font copying
- [ ] Delete font files from repository
- [ ] Update all callers of `finalize()` to await
- [ ] Update all callers of `end()` to await
- [ ] Test Node.js backward compatibility
- [ ] Test React Native usage
- [ ] Update documentation

## Testing Strategy

1. **Node.js Tests** - Ensure backward compatibility (no init required)
2. **React Native Tests** - Test with injected adapters
3. **Font Loading Tests** - Verify font registry works correctly
4. **Async Tests** - Verify all async operations complete properly
5. **Error Handling** - Test error cases (missing fonts, missing adapters)

## Conclusion

This implementation plan provides a clean, maintainable solution that:

- Eliminates the need for patches
- Removes React Native dependencies from the repository
- Provides proper async support
- Maintains backward compatibility with Node.js
- Gives callers full control over dependencies and font data
- Eliminates `__dirname` dependency
- Removes busy-wait patterns in favor of proper async/await

The key insight is that by requiring initialization and dependency injection, we can support both Node.js and React Native from a single codebase without compromising on either platform.

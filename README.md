# PDFKit (React Native Fork)

A JavaScript PDF generation library for Node.js and React Native. This is a fork of [PDFKit](https://github.com/foliojs/pdfkit) designed to work in React Native environments through dependency injection and async-first architecture.

## Description

PDFKit is a PDF document generation library that makes creating complex, multi-page, printable documents easy. The API embraces chainability, and includes both low level functions as well as abstractions for higher level functionality. The PDFKit API is designed to be simple, so generating complex documents is often as simple as a few function calls.

**Note**: This repository is not published to npm. You must clone this repository locally and install it as a local dependency in your project.

This fork has been modified to support React Native through:
- **Dependency Injection**: Node.js modules (fs, zlib, stream, Buffer) are injected at initialization
- **Font Registry System**: Standard fonts are provided directly rather than loaded from the filesystem
- **Async-First Architecture**: Operations are properly async to work naturally with React Native
- **No `__dirname` Dependency**: Fonts and resources are provided directly by the caller

Check out some of the [documentation and examples](http://pdfkit.org/docs/getting_started.html) to see for yourself!
You can also read the guide as a [self-generated PDF](http://pdfkit.org/docs/guide.pdf) with example output displayed inline.
If you'd like to see how it was generated, check out the README in the [docs](https://github.com/foliojs/pdfkit/tree/master/docs)
folder.

## Installation

Since this repository is not published to npm, you need to clone it locally and install it as a local dependency.

### Clone and Install

```bash
# Clone this repository
git clone <repository-url>
cd react-native-pdfkit

# Install dependencies
npm install
# or
yarn install
```

### Install in Your Project

In your React Native or Node.js project, install this package as a local dependency:

```bash
# Using npm
npm install /path/to/react-native-pdfkit

# Using yarn
yarn add /path/to/react-native-pdfkit

# Or using a git URL (if hosted on GitHub/GitLab)
npm install git+https://github.com/your-username/react-native-pdfkit.git
# or
yarn add git+https://github.com/your-username/react-native-pdfkit.git
```

### React Native Dependencies

For React Native projects, you'll also need to install the following dependencies:

```bash
# Required dependencies
npm install buffer readable-stream pako

# Optional: For file system operations (if needed)
npm install react-native-fs
```

- `buffer`: Provides Buffer polyfill for React Native
- `readable-stream`: Provides stream implementation for React Native
- `pako`: Provides zlib compression (deflate) for React Native
- `react-native-fs`: Optional, for file system operations if you need to read custom fonts from the filesystem

## Features

- Vector graphics
  - HTML5 canvas-like API
  - Path operations
  - SVG path parser for easy path creation
  - Transformations
  - Linear and radial gradients
- Text
  - Line wrapping (with soft hyphen recognition)
  - Text alignments
  - Bulleted lists
- Font embedding
  - Supports TrueType (.ttf), OpenType (.otf), WOFF, WOFF2, TrueType Collections (.ttc), and Datafork TrueType (.dfont) fonts
  - Font subsetting
  - See [fontkit](http://github.com/foliojs/fontkit) for more details on advanced glyph layout support.
- Image embedding
  - Supports JPEG and PNG files (including indexed PNGs, and PNGs with transparency)
- Tables
- Annotations
  - Links
  - Notes
  - Highlights
  - Underlines
  - etc.
- AcroForms
- Outlines
- PDF security
  - Encryption
  - Access privileges (printing, copying, modifying, annotating, form filling, content accessibility, document assembly)
- Accessibility support (marked content, logical structure, Tagged PDF, PDF/UA)

## Coming soon!

- Patterns fills
- Higher level APIs for laying out content
- More performance optimizations
- Even more awesomeness, perhaps written by you! Please fork this repository and send me pull requests.

## React Native Usage

**Important**: You must initialize PDFKit before creating any PDFDocument instances. This initialization sets up the necessary adapters and registers standard fonts.

### Initialization

```javascript
import PDFDocument, { init } from 'pdfkit';
import { getFontRegistry } from 'pdfkit/lib/font/font_registry';
import { Buffer } from 'buffer';
import stream from 'readable-stream';
import pako from 'pako';
import * as RNFS from 'react-native-fs'; // Optional, only if you need filesystem access

// Import standard font AFM files (you need to provide these)
import helveticaAfm from './fonts/Helvetica.afm';
import helveticaBoldAfm from './fonts/Helvetica-Bold.afm';
import helveticaObliqueAfm from './fonts/Helvetica-Oblique.afm';
import helveticaBoldObliqueAfm from './fonts/Helvetica-BoldOblique.afm';
import courierAfm from './fonts/Courier.afm';
import courierBoldAfm from './fonts/Courier-Bold.afm';
import courierObliqueAfm from './fonts/Courier-Oblique.afm';
import courierBoldObliqueAfm from './fonts/Courier-BoldOblique.afm';
import timesRomanAfm from './fonts/Times-Roman.afm';
import timesBoldAfm from './fonts/Times-Bold.afm';
import timesItalicAfm from './fonts/Times-Italic.afm';
import timesBoldItalicAfm from './fonts/Times-BoldItalic.afm';
import symbolAfm from './fonts/Symbol.afm';
import zapfDingbatsAfm from './fonts/ZapfDingbats.afm';

/**
 * Initializes PDFKit with React Native adapters and registers standard fonts.
 * Must be called before creating any PDFDocument instances.
 */
function initializePdfKit() {
  init({
    fs: RNFS, // Optional, only if you need filesystem access
    zlib: {
      deflate: (data, callback) => {
        try {
          // pako.deflate is synchronous and returns Uint8Array
          const compressed = pako.deflate(data);
          // Convert Uint8Array to Buffer
          const result = Buffer.from(compressed);
          callback(null, result);
        } catch (err) {
          callback(
            err instanceof Error ? err : new Error(String(err)),
            Buffer.alloc(0),
          );
        }
      },
    },
    stream: stream,
    Buffer: Buffer,
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
  });

  // Register all standard fonts in the global font registry.
  // This must be done BEFORE creating any PDFDocument instances.
  const registry = getFontRegistry();
  registry.registerStandardFonts({
    Helvetica: helveticaAfm,
    'Helvetica-Bold': helveticaBoldAfm,
    'Helvetica-Oblique': helveticaObliqueAfm,
    'Helvetica-BoldOblique': helveticaBoldObliqueAfm,
    Courier: courierAfm,
    'Courier-Bold': courierBoldAfm,
    'Courier-Oblique': courierObliqueAfm,
    'Courier-BoldOblique': courierBoldObliqueAfm,
    'Times-Roman': timesRomanAfm,
    'Times-Bold': timesBoldAfm,
    'Times-Italic': timesItalicAfm,
    'Times-BoldItalic': timesBoldItalicAfm,
    Symbol: symbolAfm,
    ZapfDingbats: zapfDingbatsAfm,
  });
}

// Initialize once at app startup
initializePdfKit();
```

### Creating PDFs in React Native

```javascript
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

async function generatePDF() {
  const doc = new PDFDocument();
  const chunks = [];

  // Collect PDF data
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    // Use pdfBuffer as needed (save to file, send to server, etc.)
  });

  // Add content
  doc
    .font('Helvetica')
    .fontSize(25)
    .text('Hello from React Native!', 100, 100);

  // Finalize PDF (now async)
  await doc.end();
}
```

## Node.js Usage

In Node.js, PDFKit works out of the box without initialization. However, if you're writing tests or need to explicitly initialize (for example, to register custom fonts), you can use the same initialization pattern.

See `tests/visual/helpers.js` for an example of how to initialize PDFKit in a Node.js environment:

```javascript
import fs from 'fs';
import zlib from 'zlib';
import stream from 'stream';
import { Buffer } from 'buffer';
import PDFDocument, { init } from 'pdfkit/lib/document';
import { getFontRegistry } from 'pdfkit/lib/font/font_registry';

// Initialize adapters with Node.js implementations
init({ fs, zlib, stream, Buffer, TextEncoder, TextDecoder });

// Register fonts if needed
const registry = getFontRegistry();
// ... register fonts ...

// Now use PDFDocument as usual
const doc = new PDFDocument();
```

### Basic Node.js Example

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Create a document
const doc = new PDFDocument();

// Pipe its output somewhere, like to a file or HTTP response
doc.pipe(fs.createWriteStream('output.pdf'));

// Embed a font, set the font size, and render some text
doc
  .font('Helvetica')
  .fontSize(25)
  .text('Some text with an embedded font!', 100, 100);

// Add an image, constrain it to a given size, and center it vertically and horizontally
doc.image('path/to/image.png', {
  fit: [250, 300],
  align: 'center',
  valign: 'center'
});

// Add another page
doc
  .addPage()
  .fontSize(25)
  .text('Here is some vector graphics...', 100, 100);

// Draw a triangle
doc
  .save()
  .moveTo(100, 150)
  .lineTo(100, 250)
  .lineTo(200, 250)
  .fill('#FF3300');

// Apply some transforms and render an SVG path with the 'even-odd' fill rule
doc
  .scale(0.6)
  .translate(470, -380)
  .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
  .fill('red', 'even-odd')
  .restore();

// Add some text with annotations
doc
  .addPage()
  .fillColor('blue')
  .text('Here is a link!', 100, 100)
  .underline(100, 100, 160, 27, { color: '#0000FF' })
  .link(100, 100, 160, 27, 'http://google.com/');

// Finalize PDF file (now async)
await doc.end();
```

[The PDF output from this example](http://pdfkit.org/demo/out.pdf) (with a few additions) shows the power of PDFKit — producing
complex documents with a very small amount of code. For more, see the `demo` folder and the
[PDFKit programming guide](http://pdfkit.org/docs/getting_started.html).

## Documentation

For complete API documentation and more examples, see the [PDFKit website](http://pdfkit.org/).

## License

PDFKit is available under the MIT license.

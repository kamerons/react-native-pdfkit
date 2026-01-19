import * as fontkit from 'fontkit';
import StandardFont from './font/standard';
import EmbeddedFont from './font/embedded';
import { getFontRegistry } from './font/font_registry';

class PDFFontFactory {
  static open(document, src, family, id) {
    let font;
    if (typeof src === 'string') {
      if (StandardFont.isStandardFont(src)) {
        return new StandardFont(document, src, id);
      }

      // Check if it's a registered custom font
      const registry = getFontRegistry();
      if (registry.hasCustomFont(src)) {
        const customFont = registry.getCustomFont(src);
        src = customFont.data;
        if (customFont.family && !family) {
          family = customFont.family;
        }
      } else {
        throw new Error(
          `Font '${src}' is not registered. Register it first using getFontRegistry().registerCustomFont() or doc.registerFont().`,
        );
      }
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

export default PDFFontFactory;

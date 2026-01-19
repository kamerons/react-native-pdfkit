class FontRegistry {
  constructor() {
    this.standardFonts = {};
    this.customFonts = {};
    this.defaultFontName = null;
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

  getDefaultFont() {
    if (this.defaultFontName && this.hasStandardFont(this.defaultFontName)) {
      return this.defaultFontName;
    }
    // Return first registered font
    const fontNames = Object.keys(this.standardFonts);
    if (fontNames.length > 0) {
      return fontNames[0];
    }
    return null;
  }

  setDefaultFont(name) {
    if (!this.hasStandardFont(name)) {
      throw new Error(
        `Font '${name}' is not registered. Register it first using registerStandardFonts().`,
      );
    }
    this.defaultFontName = name;
  }

  registerCustomFont(name, fontData, family = null) {
    if (!(fontData instanceof Uint8Array) && !(fontData instanceof ArrayBuffer)) {
      throw new Error(
        'Custom font data must be a Uint8Array or ArrayBuffer. Read the font file first and pass the buffer.',
      );
    }
    this.customFonts[name] = {
      data: fontData,
      family,
    };
  }

  getCustomFont(name) {
    return this.customFonts[name];
  }

  hasCustomFont(name) {
    return name in this.customFonts;
  }
}

let registry = new FontRegistry();

export function getFontRegistry() {
  return registry;
}

export function resetFontRegistry() {
  registry = new FontRegistry();
}

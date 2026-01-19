class FontRegistry {
  constructor() {
    this.standardFonts = {};
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
}

let registry = new FontRegistry();

export function getFontRegistry() {
  return registry;
}

export function resetFontRegistry() {
  registry = new FontRegistry();
}

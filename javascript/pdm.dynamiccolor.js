class DynamicColor {
  static eligibleColors = null;

  constructor(id, alpha) {
    this.id = 'live_control_selection';
    this.rgba = null;
    this.alpha = typeof alpha !== 'undefined' ? Math.max(0., Math.min(alpha, 1.)) : 1.0;
    this.greyscale = false;

    if (typeof id === 'string') {
      this.id = id;
    } else if (Array.isArray(id)) {
      this.rgba = id;
    }
  }

  getRGBA() {
    let color = this.id ? max.getcolor(this.id) : this.rgba;

    if (this.alpha != null) {
      color[3] = this.alpha;
    }
    
    if (this.greyscale) {
      const greyscaleFactor = 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
      color = [greyscaleFactor, greyscaleFactor, greyscaleFactor, color[3]];
    }

    return color;
  }

  setAlpha(alpha) {
    if (alpha < 0.0 || alpha > 1.0) {
      post('DynamicColor.setAlpha: alpha must be between 0 and 1 \n');
      return this;
    }
    this.alpha = alpha;
    return this;
  }

  setGreyscale(greyscale) {
    if (typeof greyscale !== 'boolean') {
      post('DynamicColor.setGreyscale: greyscale must be a boolean \n');
      return this;
    }
    this.greyscale = greyscale;
    return this;
  }

  setGrayscale(grayscale) {
    return this.setGreyscale(grayscale);
  }

  setId(id) {
    if (typeof id === 'string') {
      this.id = id;
    } else if (Array.isArray(id)) {
      this.rgba = id;
    }
    return this;
  }

  ensureMaxColorsLoaded() {
    // Lazy load maxColors if it hasn't been loaded yet
    if (!DynamicColor.eligibleColors) {
      DynamicColor.eligibleColors = [];
      //maxColors = require('maxcolors.json');
      maxColors.colors.forEach(item => {
        DynamicColor.eligibleColors.push(item.id);
      });
    }
    post('eligibleColors', DynamicColor.eligibleColors, '\n');
  }

  validateId() {
    this.ensureMaxColorsLoaded();

    if (DynamicColor.eligibleColors.indexOf(this.id) !== -1) {
      return true;
    }
    error('Color ID is invalid.\n');
    return false;
  }
}

if (typeof exports !== 'undefined') {
  exports.DynamicColor = DynamicColor;
}

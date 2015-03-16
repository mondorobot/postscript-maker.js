(function() {
  'use strict';

  var PostScriptDocument = function (options) {
    options = options || {};

    this.pages = [];

    this.config = {
      'documentAuthor': options.author               || 'Anonymous',
      'documentTitle':  options.title                || 'Untitled',
      'font':           options.font                 || 'Helvetica',
      'fontSize':       Number(options.fontSize)     || 12,
      'fontColor':      options.fontColor            || '#000000',
      'fillColor':      options.fillColor            || '#eeeeee',
      'borderColor':    options.borderColor          || '#cccccc',
      'borderWidth':    Number(options.borderWidth)  || 0.5,
      'lineWidth':      Number(options.lineWidth)    || 0.5,
      'widthInches':    Number(options.widthInches)  || 8.5,
      'heightInches':   Number(options.heightInches) || 11,
      'dpi':            Number(options.dpi)          || 72
    };

    if (options.marginCm) {
      this.config.marginInches = 0.393701 * options.marginCm;
    } else if (options.margin) {
      this.config.marginInches = options.marginInches;
    } else {
      this.config.marginInches = 0.5;
    }

    this.config.heightPt = this.config.heightInches * this.config.dpi;
    this.config.widthPt  = this.config.widthInches  * this.config.dpi;

    this.config.marginPt = this.config.marginInches * this.config.dpi;

    this.config.pageHeightPt = this.config.heightPt - (this.config.marginPt * 2);
    this.config.pageWidthPt  = this.config.widthPt  - (this.config.marginPt * 2);
  };

  PostScriptDocument.prototype = {
    // main interface {{{
    'addPage': function() {
      var page = {
        'x': this.config.marginPt+1,
        'y': this.config.marginPt+1,
        'w': this.config.pageHeightPt,
        'h': this.config.pageWidthPt,
        'elements': []
      };
      this.pages.push(page);
      return page;
    },

    'render': function() {
      var headers = [
        '%!PS-Adobe-3.0',
        '%%Creator: ' + this.config.documentAuthor,
        '%%Title: ' + this.config.documentTitle,
        '%%Pages: ' + this.pages.length,
        '%%PageOrder: Ascend',
        '%%BoundingBox: 0 0 '+this.config.widthPt+' '+this.config.heightPt,
        '%%DocumentPaperSizes: Letter',
        '%%EndComments'
      ].join("\n");

      var self = this;
      var scripts = this.pages.map(function(page, x) {
        var pageNum = x + 1;

        return [
          '%#############################################################',
          '% BEGIN PAGE',
          '%#############################################################',
          '%%Page ' + pageNum + ' ' + pageNum + "\n",
          self.compilePageScript(page) + "\n",
          'showpage',
          '%*************************************************************'
        ].join("\n");
      }).join("\n\n\n");

      return headers + "\n\n" + scripts + "\n\n" + "%%EOF\n";
    },
    // }}}

    // size and position {{{
    'computeBox': function(options, parent) {
      parent = parent || {
        computedBox: {
          x: this.config.marginPt+1,
          y: this.config.marginPt+1,
          w: this.config.pageHeightPt,
          h: this.config.pageWidthPt
        }
      };

      var x = options.box.x;
      var y = options.box.y;
      var w = options.box.w;
      var h = options.box.h;

      // set the box position relative to its parent
      xPt = parent.computedBox.x + x + 1;
      yPt = parent.computedBox.y + y + 1;

      // convert size percentages relative to parent
      if (typeof w === 'string' && w.match(/%$/)) {
        var wVal = Number(w.replace(/[^0-9.]/g, ''));
        var wPt = parent.computedBox.wPt * (100 / wVal);
      } else {
        var wPt = options.w;
      }

      if (typeof h === 'string' && h.match(/%$/)) {
        var hVal = Number(h.replace(/[^0-9.]/g, ''));
        var hPt = parent.computedBox.hPt * (100 / hVal);
      } else {
        var hPt = options.h;
      }

      var settings = {
        computedBox: {
          x: xPt,
          y: yPt,
          w: wPt,
          h: hPt
        }
      };

      return settings;
    },
    // }}}

    // compiling {{{
    'compilePageScript': function(page) {
      var self = this;

      page.elements.each(function(el) {
        return self.computeElement(el, page);
      });

      //var subroutines = page.computedElements.map(function(el) {
      //  return self.compileElement(el);
      //});

      //var output = subroutines.join("\n\n");
      var output = '';

      return output;
    },

    'computeElement': function(el) {
      switch (el.type) {
        case 'box':
          self.computeBox(el);
          break;

        case 'text':
          return self.computeText(el);
          break;

        case 'line':
          self.computeLine(el);
          break;

        default:
          break;
      }
    },

    'compileElement': function(el) {
      switch (el.type) {
        case 'box':
          return self.drawBox(el);
          break;

        case 'text':
          return self.drawText(el);
          break;

        case 'line':
          return self.drawLine(el);
          break;

        default:
          return '';
          break;
      }
    },

    'compileSubroutine': function(script, comments) {
      comments = comments || '';

      var output = comments + "\n" + script.join("\n");
      var trimmed = output.replace(/\s*\n\s*/g, "\n");

      return trimmed;
    },
    // }}}

    // drawing {{{
    'drawShape': function() {
      //"\ngsave\n200 550 translate 0.05 0.1 scale\n"+self.setColor(darkBlue)+"\nnewpath\n100 200 moveto\n200 250 lineto\n100 300 lineto\n16 setlinewidth\nstroke\ngrestore\n\n",
    },

    'drawImage': function() {
      //"\ngsave\n100 550 translate\n26 34 scale\n26 34 8 [26 0 0 -34 0 34]\n{<\nffffffffffffffffffffffffffffffffffffffffffffffffffff\nff000000000000000000000000000000000000ffffffffffffff\nff00efefefefefefefefefefefefefefefef0000ffffffffffff\nff00efefefefefefefefefefefefefefefef00ce00ffffffffff\nff00efefefefefefefefefefefefefefefef00cece00ffffffff\nff00efefefefefefefefefefefefefefefef00cecece00ffffff\nff00efefefefefefefefefefefefefefefef00cececece00ffff\nff00efefefefefefefefefefefefefefefef00000000000000ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efef000000ef000000ef000000ef0000ef0000efefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efef000000ef00000000ef00000000ef000000efefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efef0000ef00000000000000ef000000ef0000efefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff00efefefefefefefefefefefefefefefefefefefefefef00ff\nff000000000000000000000000000000000000000000000000ff\nffffffffffffffffffffffffffffffffffffffffffffffffffff\n>}\nimage\ngrestore\n\n",
    },

    'drawColorImage': function() {
      //"\ngsave\n300 535 translate\n50 50 scale\n/picstr 6 string def\n2 2 4 [2 0 0 -2 0 2]\n{ currentfile picstr readhexstring pop}\nfalse 3\ncolorimage\nf000080f0088\ngrestore\n\n",
    },

    'drawBox': function(options) {
      var border = options.border || '';
      var hasBorder = !!options.border;
      var hasFill = !!options.color;
      var x = options.xPt;
      var y = options.yPt;
      var w = options.wPt;
      var h = options.hPt;
      var fillColor = options.color || this.config.fillColor;
      var borderColor = this.config.borderColor;
      var borderWidth = this.config.borderWidth;

      if (hasBorder) {
        var b1 = border.split(' ')[0];
        var b2 = border.split(' ')[1];

        if (typeof b2 === 'string' && b2.match(/#/)) {
          borderColor = b2;
          borderWidth = Number(b1);
        } else if (b1.match(/#/)) {
          borderColor = b1;
        }
      }

      var comments = '% BOX: pos('+x+','+y+') dim('+w+','+h+')';

      var script = [
        'gsave',
        'newpath',
        this.moveto(left, bot),
        this.lineto(left, top),
        this.lineto(right, top),
        this.lineto(right, bot),
        'closepath'
      ];

      if ((!hasBorder) && (!hasFill)) {
        var drawFill = true;
        var drawBorder = false;
      } else {
        var drawFill = hasFill;
        var drawBorder = hasBorder;
      }

      var fillScript = ((!drawFill) ? [] : [
        this.setColor(fillColor),
        'fill',
      ]).join("\n");

      var borderScript = ((!drawBorder) ? [] : [
        this.setColor(borderColor),
        borderWidth + ' setlinewidth',
        'stroke'
      ]).join("\n");

      if (fillScript.trim() && borderScript.trim()) {
        fillScript = [
          'gsave',
          fillScript,
          'grestore'
        ].join("\n")+"\n";
      }

      var boxRenderScript = script.join("\n")+"\n"+fillScript+borderScript;

      return [comments, boxRenderScript].join("\n");
    },

    'getPageX': function(val) {
      if (this.config.marginPt > 0) {
        val += this.config.marginPt;
      }

      return val;
    },

    'getPageY': function(val) {
      val = this.config.heightPt - val;

      if (this.config.marginPt > 0) {
        val -= this.config.marginPt;
      }

      return val;
    },

    'drawLine': function(options) {
      var from = options.from;
      var to = options.to;

      var color = options.color || '#000000';
      var linewidth = options.linewidth || this.config.lineWidth || 0.5;

      var p1x = this.getPageX(from.x);
      var p1y = this.getPageY(from.y);

      var p2x = this.getPageX(to.x);
      var p2y = this.getPageY(to.y);

      var comment = '% LINE from('+from.x+','+from.y+') to('+to.x+','+to.y+')';

      var script = [
        'gsave',
        this.setColor(color),
        'newpath',
        this.moveto(p1x, p1y),
        this.lineto(p2x, p2y),
        'closepath',
        linewidth + ' setlinewidth',
        'stroke',
        'grestore'
      ];

      return [
        comment,
        script.join("\n")
      ].join("\n");
    },

    'drawText': function(options) {
      var text = options.text;

      var x = options.x || 0;
      var y = options.y || 0;

      var fontName  = (options.font      || this.config.font);
      var fontSize  = (options.fontSize  || this.config.fontSize);
      var fontColor = (options.fontColor || this.config.fontColor);

      x = this.getPageX(x);
      y = this.getPageY(y + fontSize);

      var saneText = text.replace(')', "\\)");

      var comment = '% TEXT pos('+options.x+','+options.y+') font('+fontName+')';
      var script = [
        'gsave',
        this.setColor(fontColor),
        '/'+fontName+' findfont',
        fontSize + ' scalefont setfont',
        x+' '+y+' moveto',
        '('+saneText+') show',
        'grestore'
      ];

      return [
        comment,
        script.join("\n")
      ].join("\n");
    },
    // }}}

    // postscript helpers {{{
    'moveto': function(x, y) {
      return [x, y, 'moveto'].join(' ');
    },

    'lineto': function(x, y) {
      return [x, y, 'lineto'].join(' ');
    },

    'setColor': function(color) {
      if (typeof color === 'string') {
        var rgb = this.hexToUnitRgb(color);
      } else {
        var rgb = color;
      }

      return rgb.concat('setrgbcolor').join(' ');
    },

    'getBoxBounds': function(x, y, w, h) {
      var top  = this.getPageY(y);
      var left = this.getPageX(x);

      var bot   = top - h;
      var right = left + w;

      return {
        'bot': bot,
        'left': left,
        'top': top,
        'right': right
      };
    },
    // }}}

    // utilities {{{
    'hexToRgb': function(color) {
      // Function used to determine the RGB colour value that was passed as HEX
      var result;

      // Look for rgb(num,num,num)
      if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)) return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

      // Look for rgb(num%,num%,num%)
      if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color)) return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55, parseFloat(result[3]) * 2.55];

      // Look for #a0b1c2
      if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color)) return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];

      // Look for #fff
      if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color)) return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16), parseInt(result[3] + result[3], 16)];
    },

    'hexToUnitRgb': function(color) {
      var rgb = this.hexToRgb(color);

      if (
        (!Array.isArray(rgb)) ||
        rgb.length === 0
      ) {
        return [1, 0, 1]; // bright pink means warning!
      }

      return rgb.map(function(x) {
        return x / 255;
      });
    }
    // }}}
  };

  // notes:
  //   AFM (adobe font metrics) ftp://ftp.adobe.com/pub/adobe/type/win/all/afmfiles/
  //   http://en.wikipedia.org/wiki/PostScript_Printer_Description
  //   http://en.wikipedia.org/wiki/Document_Structuring_Conventions
  //   http://partners.adobe.com/public/developer/en/ps/5001.DSC_Spec.pdf
  //   PostScript vs EPS
  //
  // Paper Size                      Dimension (in points)
  // ------------------              ---------------------
  // Comm #10 Envelope               297 x 684
  // C5 Envelope                     461 x 648
  // DL Envelope                     312 x 624
  // Folio                           595 x 935
  // Executive                       522 x 756
  // Letter                          612 x 792
  // Legal                           612 x 1008
  // Ledger                          1224 x 792
  // Tabloid                         792 x 1224
  // A0                              2384 x 3370
  // A1                              1684 x 2384
  // A2                              1191 x 1684
  // A3                              842 x 1191
  // A4                              595 x 842
  // A5                              420 x 595
  // A6                              297 x 420
  // A7                              210 x 297
  // A8                              148 x 210
  // A9                              105 x 148
  // B0                              2920 x 4127
  // B1                              2064 x 2920
  // B2                              1460 x 2064
  // B3                              1032 x 1460
  // B4                              729 x 1032
  // B5                              516 x 729
  // B6                              363 x 516
  // B7                              258 x 363
  // B8                              181 x 258
  // B9                              127 x 181
  // B10                             91 x 127

  if (
    typeof module === 'object' && module !== null &&
    typeof module.exports === 'object' && module.exports !== null
  ) {
    module.exports = PostScriptDocument;
  } else if (
    typeof define === 'function'
  ) {
    define(function() { return PostScriptDocument; });
  } else if (
    typeof window === 'object' && window !== null
  ) {
    window.PostScriptDocument = PostScriptDocument;
  }
})();

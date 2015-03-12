(function() {
  'use strict';

  var PostScriptDocument = function (options) {
    options = options || {};

    this.pages = [];
    this.config = {
      'documentAuthor': options.author || 'Anonymous',
      'documentTitle': options.title || 'Untitled',
      'font': options.font || 'Helvetica',
      'fontSize': options.fontSize || 12,
      'fontColor': '#000000',
      'lineWidth': options.lineWidth || 0.5,
      'widthInches': options.widthInches || 8.5,
      'heightInches': options.heightInches || 11,
      'dpi': options.dpi || 72
    };

    this.config.heightPt = this.config.heightInches * this.config.dpi;
    this.config.widthPt = this.config.widthInches * this.config.dpi;
  };

  PostScriptDocument.prototype = {
    // main interface {{{
    'addPage': function() {
      var page = [];
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
        '%%BoundingBox: 0 0 612 792',
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
          self.compileScript(page) + "\n",
          'showpage',
          '%*************************************************************'
        ].join("\n");
      }).join("\n\n\n");

      return headers + "\n\n" + scripts + "\n\n" + "%%EOF\n";
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
      var x = options.x;
      var y = options.y;
      var w = options.w;
      var h = options.h;
      var color = options.color;

      var comments = '% BOX: pos('+x+','+y+') dim('+w+','+h+')';

      if (typeof w === 'string' && w.match(/%$/)) {
        var wVal = Number(w.replace(/[^0-9.]/g, ''));
        w = this.config.widthPt * (100 / wVal);
      }

      if (typeof h === 'string' && h.match(/%$/)) {
        var hVal = Number(h.replace(/[^0-9.]/g, ''));
        h = this.config.heightPt * (100 / hVal);
      }

      var box = this.getBoxBounds(x, y, w, h);

      var bot    = box.bot;
      var top    = box.top;
      var left   = box.left;
      var right  = box.right;

      var script = [
        'gsave',
        this.setColor(color),
        'newpath',
        this.moveto(left, bot),
        this.lineto(left, top),
        this.lineto(right, top),
        this.lineto(right, bot),
        'closepath',
        'fill',
        'grestore'
      ];

      return [comments, script.join("\n")].join("\n");
    },

    'drawLine': function(options) {
      var from = options.from;
      var to = options.to;

      var color = options.color || '#000000';
      var linewidth = options.linewidth || this.config.lineWidth || 0.5;

      var p1x = from.x;
      var p1y = this.config.heightPt - from.y;

      var p2x = to.x;
      var p2y = this.config.heightPt - to.y;

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

      y = this.config.heightPt - (y + fontSize);

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

    // compiling {{{
    'compileScript': function(elements) {
      var self = this;

      var subroutines = elements.map(function(el) {
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
      });

      var output = subroutines.join("\n\n");

      return output;
    },

    'compileSubroutine': function(script, comments) {
      comments = comments || '';

      var output = comments + "\n" + script.join("\n");
      var trimmed = output.replace(/\s*\n\s*/g, "\n");

      return trimmed;
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
      var top = this.config.heightPt - y;
      var left = x;

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

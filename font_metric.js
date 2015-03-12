// AFM Helper
//
// File Format Documentation:
//   http://partners.adobe.com/public/developer/en/font/5004.AFM_Spec.pdf
//
// Download AFM files:
//   ftp://ftp.adobe.com/pub/adobe/type/win/all/afmfiles/
//   http://tug.ctan.org/fonts/lato/fonts/afm/public/
(function() {
  'use strict';

  var FontMetric = function (options) {
    this.init(options);
  };

  FontMetric.prototype = {
    // init {{{
    'init': function(options) {
      this.initDefaults();
      this.initSettings(options);
      this.load();
    },

    'load': function() {
      if (Object.keys(this.config.afm.glyphlist).length <= 0) {
        this.parseGlyphlistFile();
      }

      this.parseAfmFile();
    },

    'initSettings': function(options) {
      this.config.files.afmSource = options.file || '';
      this.config.files.glyphlistSource = options.glyphlist || '';

      if (options.glyphlist && typeof options.glyphlist === 'object') {
        this.config.afm.glyphlist = options.glyphlist;
      }

      this.config.settings.fontSize = Number(options.fontSize) || 12;
    },

    'initDefaults': function() {
      this.config = {
        files: {},

        settings: {
          fontSize: 12
        },

        afm: {
          glyphlist: {},
          charMetrics: {},
          nonCodedMetrics: [],
          kernPairs: {},
          fontMetrics: {
            ascender:  0, //  718 // top of the lower case 'd'
            descender: 0, // -207 // bottom of the lower case 'p'
            xHeight:   0, //  523 // top of the lower case 'x'
            capHeight: 0  //  718 // top of the upper case 'H'
          }
        }
      };
    },
    // }}}

    // user interface {{{
    'wrap': function(text, width, fontSize) {
      var self = this;

      var i = 0;
      var lines = [''];
      var lineNumber = 0;
      var lineWidth = 0;
      var fontSize = Number(fontSize) || this.config.settings.fontSize || 12;
      var chars = text.split('');

      var sizes = chars.map(function(c) {
        return self.width(c, fontSize);
      });

      sizes.forEach(function(s, i) {
        if (lineWidth + s >= width) {
          lineNumber += 1;
          lines[lineNumber] = '';
          lineWidth = 0;
        }

        lines[lineNumber] += chars[i];
        lineWidth += s;
      });

      return lines;
    },

    'width': function(text, fontSize) {
      var fontSize = Number(fontSize) || this.config.afm.fontSize || 12;
      var scale = fontSize / 1000;
      var width = 0;
      var em = this.config.afm.emSize * scale;

      for (var i = 0; i < text.length; i++) {
        var charWidth = em;
        var charCode = text.charCodeAt(i);
        var charMetric = this.config.afm.charMetrics[charCode];

        if (charMetric && charMetric.WX) {
          var charWidth = Number(charMetric.WX) * scale;
        }

        width += Number(charWidth);
      }

      return width;
    },
    // }}}

    // parsing {{{
    'parseGlyphlistFile': function() {
      var self = this;

      var src = this.config.files.glyphlistSource;
      var glyphlist = this.config.afm.glyphlist;

      if (!src && typeof src === 'string') {
        throw 'Could not find a valid glyphlist.txt (Adobe Glyph List) source file.';
        return;
      }

      if (!glyphlist && typeof glyphlist === 'object') {
        throw 'Could not find a valid glyphlist object.';
        return;
      }

      var lines = src.split("\n").map(function(line) {
        return line.trim();
      }).filter(function(line) {
        return line;
      }).filter(function(line) {
        return !line.match(/^\s*#/);
      });

      lines.forEach(function(line) {
        var parts = line.trim().split(';');

        var name = parts[0];
        var code = parseInt("0x"+parts[1]);

        glyphlist[name] = code;
      });
    },

    'parseAfmFile': function(file) {
      var self = this;

      var src = this.config.files.afmSource;
      if (!(src && typeof src === 'string')) {
        throw 'Could not find a valid AFM (Adobe Font Metrics) source file.';
        return;
      }

      var lines = src.trim().split("\n");

      if (lines.length <= 0) {
        throw 'AFM (Adobe Font Metrics) source file was empty or invalid.';
      }

      this.config.afm.kernPairs = {};
      this.config.afm.charMetrics = {};
      this.config.afm.nonCodedMetrics = [];
      this.config.afm.emSize = 850;

      this.parseGlobalFontMetrics(src);
      this.parseCharMetrics(lines);
      this.parseKernPairs(lines);
      this.parseEmSize();
    },

    'parseEmSize': function() {
      var emMetric = this.config.afm.charMetrics["M".charCodeAt(0)];

      if (emMetric && typeof emMetric === 'object' && emMetric.WX) {
        this.config.afm.emSize = Number(emMetric.WX);
      }
    },

    'parseGlobalFontMetrics': function(src) {
      var ascMatch = src.match(/Ascender (-?\d+)/);
      if (ascMatch) {
        this.config.afm.fontMetrics.ascender = Number(ascMatch[1]);
      }

      var descMatch = src.match(/Descender (-?\d+)/);
      if (descMatch) {
        this.config.afm.fontMetrics.descender = Number(descMatch[1]);
      }

      var xhMatch = src.match(/XHeight (-?\d+)/);
      if (xhMatch) {
        this.config.afm.fontMetrics.xHeight = Number(xhMatch[1]);
      }

      var chMatch = src.match(/CapHeight (-?\d+)/);
      if (chMatch) {
        this.config.afm.fontMetrics.capHeight = Number(chMatch[1]);
      }
    },

    'parseKernPairs': function(lines) {
      var kernPairs = this.config.afm.kernPairs;
      var kernPairLines = this.getKernPairLines(lines);

      kernPairLines.forEach(function(line) {
        var parts = line.split(/\s+/);

        var letter = parts[1];
        var to = parts[2];
        var offset = Number(parts[3]);

        if (!kernPairs[letter]) {
          kernPairs[letter] = {};
        }

        kernPairs[letter][to] = offset;
      });
    },

    'parseCharMetrics': function(lines) {
      var charMetricLines = this.getCharMetricLines(lines);

      var charMetricSettings = charMetricLines.map(function(line) {
        var charMetric = {};

        line.split(/\s*;\s*/).forEach(function(kvPair) {
          var kvMatches = kvPair.trim().match(/([A-Z]*)\s*(.*)/);

          var key = kvMatches[1];
          var val = kvMatches[2];

          charMetric[key] = val;
        });

        if (charMetric.C) {
          charMetric.C = Number(charMetric.C);
        }

        if (charMetric.WX) {
          charMetric.WX = Number(charMetric.WX);
        }

        if (charMetric.B && typeof charMetric.B === 'string') {
          charMetric.B = charMetric.B.split(' ').map(function(b) {
            return Number(b);
          });
        }

        return charMetric;
      });

      var charMetrics = this.config.afm.charMetrics;
      var glyphlist = this.config.afm.glyphlist;
      var nonCodedMetrics = this.config.afm.nonCodedMetrics;

      charMetricSettings.forEach(function(charMetric) {
        if (charMetric.C > 0) {
          charMetrics[charMetric.C] = charMetric;
        } else {
          if (charMetric.N && typeof charMetric.N === 'string') {
            var glyphCode = glyphlist[charMetric.N];

            if (glyphCode) {
              charMetrics[glyphCode] = charMetric;
            }
          } else {
            // these probably won't be useful in reality
            // but it may be useful to know that some characters
            // cannot be reliably identified by the glyphlist
            nonCodedMetrics.push(charMetric);
          }
        }
      });
    },

    'getCharMetricLines': function(lines) {
      var startCharMetricsIndex = findIndex(lines, function(line) {
        return line.match(/StartCharMetrics/);
      });

      var endCharMetricsIndex = findIndex(lines, function(line) {
        return line.match(/EndCharMetrics/);
      });

      var charMetricLines = lines.slice(startCharMetricsIndex, endCharMetricsIndex-1).map(function(line) {
        return line.trim().replace(/\s*;\s*$/, '');
      }).filter(function(line) {
        return line;
      });

      return charMetricLines;
    },

    'getKernPairLines': function(lines) {
      var startKernPairsIndex = findIndex(lines, function(line) {
        return line.match(/StartKernPairs/);
      });

      var endKernPairsIndex = findIndex(lines, function(line) {
        return line.match(/EndKernPairs/);
      });

      var kernPairLines = lines.slice(startKernPairsIndex, endKernPairsIndex-1).map(function(line) {
        return line.trim().replace(/\s*;\s*$/, '');
      }).filter(function(line) {
        return line;
      });

      return kernPairLines;
    }
    // }}}
  };

  // utilities {{{
  var findIndex = function(arr, callback) {
    if (!Array.isArray(arr)) {
      return;
    }

    for (var i = 0; i < arr.length; i++) {
      if (callback(arr[i])) {
        return i;
      }
    }

    return null;
  };
  // }}}

  if (
    typeof module === 'object' && module !== null &&
    typeof module.exports === 'object' && module.exports !== null
  ) {
    module.exports = FontMetric;
  } else if (
    typeof define === 'function'
  ) {
    define(function() { return FontMetric; });
  } else if (
    typeof window === 'object' && window !== null
  ) {
    window.FontMetric = FontMetric;
  }
})();

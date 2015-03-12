# postscript-maker.js

A JavaScript library for generating PostScript files.

# Requirements

The main postscript document generator has no strict or hard dependencies, however if you wish to make use of the `FontMetric` helper you will need to download the AFM file(s) for your font(s) as well as use the `glyphlist.txt` file found in this repo.

# Specs

In addition to working normally with standard web browsers when included globally, this library also plays nicely with:

 * node.js
 * RequireJS
 * Webpack
 * Browserify

# Installation

### Normal

    <script src="font_metric.js"></script>
    <script src="postscript_document.js"></script>
    <script>
      /* FontMetric and PostScriptDocument will be available globally */
      /* your code goes here */
    </script>

### AMD

    require(['font_metric', 'postscript_document'], function(FontMetric, PostScriptDocument) {
      /* your code goes here */
    });

### Browserify, Webpack and node.js

    var FontMetric = require('./font_metric');
    var PostScriptDocument = require('./postscript_document');

    /* your code goes here */

# Usage

    var afmData = read_file_as_string('path/to/your/font.afm');
    var glyphData = read_file_as_string('glyphlist.txt');

    var helvetica = new FontMetric({
      'file': afmData,
      'glyphlist': glyphData
    });

    var doc = new PostScriptDocument({
      'author': 'John Doe',
      'title': 'My Report'
    });

    var page = doc.addPage();

    page.push({
      type: 'text',
      text: 'Hello World',
      x: 10,
      y: 10,
      fontSize: 27
    });

    page.push({
      type: 'box',
      x: 100,
      y: 200,
      w: 400,
      h: 300,
      color: '#000088'
    });

    var outputFile = doc.render();

    /* save, write, download or echo the resulting outputFile which will be a simple string */

# Options

`PostScriptDocument`:

    author, string
    title, string
    font, string
    fontSize, integer
    lineWidth, integer
    widthInches, decimal
    heightInches, decimal
    dpi, integer

`FontMetric`:

    file, string: the AFM file as a string
    glyphlist, string: the contents of glyphlist.txt as a string

# API

`PostScriptDocument`:

    addPage() adds a new page to the document and, returns the page as an array
    render() renders all pages and their content, returns the result as a string

`FontMetric`:

    wrap(text, width, fontSize): returns an array of strings, wrapped to the given width (in pt) when using the given font size (in pt)
    width(text, fontSize): returns the width (in pt) of the text at the given font size (in pt)

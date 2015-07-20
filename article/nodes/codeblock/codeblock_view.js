"use strict";

var TextView = require('../text/text_view');

// Substance.Codeblock.View
// ==========================================================================

var CodeblockView = function(node) {
  TextView.call(this, node);
};

CodeblockView.Prototype = function() {};

CodeblockView.Prototype.prototype = TextView.prototype;
CodeblockView.prototype = new CodeblockView.Prototype();

module.exports = CodeblockView;

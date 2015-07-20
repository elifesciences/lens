"use strict";

var CompositeView = require("../composite/composite_view");

// Substance.Paragraph.View
// ==========================================================================

var ParagraphView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

ParagraphView.Prototype = function() {
  
};

ParagraphView.Prototype.prototype = CompositeView.prototype;
ParagraphView.prototype = new ParagraphView.Prototype();

module.exports = ParagraphView;

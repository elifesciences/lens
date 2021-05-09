"use strict";

var CompositeView = require("../composite/composite_view");

// Substance.Image.View
// ==========================================================================

var FootnoteView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

FootnoteView.Prototype = function() {


};

FootnoteView.Prototype.prototype = CompositeView.prototype;
FootnoteView.prototype = new FootnoteView.Prototype();

module.exports = FootnoteView;

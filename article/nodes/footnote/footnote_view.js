"use strict";

var ParagraphView = require("../paragraph").View;

// Substance.Image.View
// ==========================================================================

var FootnoteView = function(node, viewFactory) {
  ParagraphView.call(this, node, viewFactory);
};

FootnoteView.Prototype = function() {

  this.render = function() {
    ParagraphView.prototype.render.call(this);

    var labelEl = document.createElement('span');
    labelEl.classList.add('label');
    labelEl.innerHTML = this.node.label;

    this.el.insertBefore(labelEl, this.content);

    return this;
  };

};

FootnoteView.Prototype.prototype = ParagraphView.prototype;
FootnoteView.prototype = new FootnoteView.Prototype();

module.exports = FootnoteView;
